// POST /api/enviar-informe-permanente — Tanda B: envía el correo CORTO con el
// enlace permanente /informe/[token]. Reemplaza al viejo /api/enviar-informe
// (que mandaba un resumen del informe; Camilo pidió un correo liviano que lleve
// al informe, sin trackers).
//
// Se llama desde /guardar-informe cuando la conversión anónimo → cuenta quedó
// confirmada: es el ÚNICO momento en que existe el token (generado por la DB al
// insertar el resultado) y el correo real (el de auth, tras el enlace mágico).
//
// Seguridad: el cliente autentica con el access token de su sesión (Bearer) y
// el route opera con un cliente "as-user", sujeto a las mismas policies RLS
// (auth.uid() = user_id): la lectura del token por session_id solo devuelve
// filas propias. El correo destinatario sale de auth.getUser() (mismo usuario),
// no de ninguna tabla ni del body: minimización, no se recolecta nada nuevo.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { construirCorreoInformePermanente } from "@/lib/email/plantillaInforme";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
// Remitente: dominio raíz verificable en Resend (decisión de Camilo — el SPF de
// Zoho en la raíz NO se toca: los registros de Resend viven en el subdominio
// 'send' y en el selector DKIM, ver 00017 o el plan de DNS del equipo).
const EMAIL_FROM = process.env.EMAIL_FROM ?? "Mirai <informe@miraiapp.cl>";

const RequestSchema = z.object({ sessionId: z.string().uuid() });

// Resultado detallado del intento: se persiste íntegro en envios_informe_permanente
// (migración 00019) porque los logs de Vercel no sirven de auditoría — retienen
// solo minutos, no días.
interface ResultadoEnvio {
  ok: boolean;
  statusHttp: number | null;
  resendId: string | null;
  error: string | null;
}

async function enviarConResend(to: string, subject: string, html: string, text: string): Promise<ResultadoEnvio> {
  if (!RESEND_API_KEY) {
    const error = "Sin RESEND_API_KEY — falta configurar la clave en Vercel";
    console.error(`[enviar-informe-permanente] ${error} — correo a ${to} NO se envió`);
    return { ok: false, statusHttp: null, resendId: null, error };
  }

  try {
    const respuesta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({ from: EMAIL_FROM, to, subject, html, text }),
      signal: AbortSignal.timeout(10000),
    });
    const cuerpo = await respuesta.text();
    if (!respuesta.ok) {
      console.error(`[enviar-informe-permanente] Resend respondió ${respuesta.status}: ${cuerpo}`);
      return { ok: false, statusHttp: respuesta.status, resendId: null, error: cuerpo.slice(0, 500) };
    }
    const json = JSON.parse(cuerpo) as { id?: string };
    return { ok: true, statusHttp: respuesta.status, resendId: json.id ?? null, error: null };
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : String(err);
    console.error("[enviar-informe-permanente] Error llamando a Resend:", err);
    return { ok: false, statusHttp: null, resendId: null, error: mensaje };
  }
}

export async function POST(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Falta sesión" }, { status: 401 });
  }

  const parsed = RequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const { sessionId } = parsed.data;

  // Cliente "as-user": las queries corren con el JWT del usuario, RLS aplica normal.
  const cliente = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  // 1) Token del informe de ESTA sesión (RLS: solo filas del uid actual).
  const { data: resultado } = await cliente
    .from("resultados")
    .select("token")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (!resultado?.token) {
    return NextResponse.json(
      { error: "Informe no encontrado (¿migración 00013 aplicada?)" },
      { status: 404 }
    );
  }

  // 1b) Frontera de servidor real para C(i): en modo prueba no se envía correo
  // real, sin depender de que el cliente no navegue hasta aquí (00017: el flag
  // es_prueba vive en sesiones, RLS ya limita la lectura a la fila propia).
  const { data: sesion } = await cliente
    .from("sesiones")
    .select("es_prueba")
    .eq("id", sessionId)
    .maybeSingle();

  if (sesion?.es_prueba) {
    return NextResponse.json({ error: "Sesión de prueba: no se envía correo real" }, { status: 403 });
  }

  // 2) Correo destinatario: el del usuario autenticado (ya vinculado a la sesión).
  const { data: usuario, error: userError } = await cliente.auth.getUser();
  const correoDestino = usuario.user?.email;
  if (userError || !correoDestino) {
    return NextResponse.json({ error: "Cuenta sin correo vinculado" }, { status: 400 });
  }

  // 3) Envío: enlace permanente sin datos identificables en la URL.
  const enlace = `${new URL(request.url).origin}/informe/${resultado.token}`;
  const { subject, html, text } = construirCorreoInformePermanente(enlace);
  const resultadoEnvio = await enviarConResend(correoDestino, subject, html, text);

  // 4) Auditoría persistente (00019): el log de Vercel se borra en minutos, esta
  // fila queda para siempre. Best-effort: un fallo de auditoría no debe ocultar
  // el resultado real del envío al usuario.
  const { error: auditError } = await cliente.rpc("registrar_envio_informe", {
    p_correo: correoDestino,
    p_ok: resultadoEnvio.ok,
    p_status_http: resultadoEnvio.statusHttp,
    p_resend_id: resultadoEnvio.resendId,
    p_error: resultadoEnvio.error,
  });
  if (auditError) {
    console.error(`[enviar-informe-permanente] no se pudo registrar auditoría (¿migración 00019 aplicada?): ${auditError.message}`);
  }

  if (!resultadoEnvio.ok) {
    return NextResponse.json({ estado: "error" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, estado: "enviado" }, { status: 200 });
}
