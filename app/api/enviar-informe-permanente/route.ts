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
const EMAIL_FROM = process.env.EMAIL_FROM ?? "Mirai <informe@informes.miraiapp.cl>";

const RequestSchema = z.object({ sessionId: z.string().uuid() });

async function enviarConResend(to: string, subject: string, html: string, text: string): Promise<boolean> {
  if (!RESEND_API_KEY) {
    // Sin clave configurada: simular envío para desarrollo (mismo criterio que /api/evaluar).
    console.log(`[enviar-informe-permanente] Sin RESEND_API_KEY — envío simulado a ${to}`);
    return true;
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
    if (!respuesta.ok) {
      console.error(`[enviar-informe-permanente] Resend respondió ${respuesta.status}: ${await respuesta.text()}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[enviar-informe-permanente] Error llamando a Resend:", err);
    return false;
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

  // 2) Correo destinatario: el del usuario autenticado (ya vinculado a la sesión).
  const { data: usuario, error: userError } = await cliente.auth.getUser();
  const correoDestino = usuario.user?.email;
  if (userError || !correoDestino) {
    return NextResponse.json({ error: "Cuenta sin correo vinculado" }, { status: 400 });
  }

  // 3) Envío: enlace permanente sin datos identificables en la URL.
  const enlace = `${new URL(request.url).origin}/informe/${resultado.token}`;
  const { subject, html, text } = construirCorreoInformePermanente(enlace);
  const enviado = await enviarConResend(correoDestino, subject, html, text);

  if (!enviado) {
    return NextResponse.json({ estado: "error" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, estado: "enviado" }, { status: 200 });
}
