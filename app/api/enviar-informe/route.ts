// POST /api/enviar-informe — Envía el informe vocacional por correo vía Resend.
// Decisión de Camilo: la API key de Resend vive solo en env vars de Vercel, así que
// este envío corre en un route handler de Next.js (no una Edge Function de Supabase,
// que usaría `supabase secrets` en vez de las env vars de Vercel).
//
// Seguridad: el cliente autentica con el access token de su sesión anónima
// (Authorization: Bearer <token>). Se crea un cliente Supabase "as-user" con ese
// token, así que la lectura de `resultados`/`correos_informe` queda sujeta a las
// mismas policies RLS (auth.uid() = user_id) — no hay chequeo manual de propiedad
// porque RLS ya lo garantiza: si el session_id no es del usuario, la fila no vuelve.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { construirCorreoInforme } from "@/lib/email/plantillaInforme";
import type { PerfilResultado } from "@/lib/supabase/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const EMAIL_FROM = process.env.EMAIL_FROM ?? "Mirai <informe@informes.miraiapp.cl>";

const RequestSchema = z.object({ sessionId: z.string().uuid() });

async function enviarConResend(to: string, subject: string, html: string, text: string): Promise<boolean> {
  if (!RESEND_API_KEY) {
    // Sin clave configurada: simular envío para desarrollo (mismo criterio que /api/evaluar).
    console.log(`[enviar-informe] Sin RESEND_API_KEY — envío simulado a ${to}`);
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
      console.error(`[enviar-informe] Resend respondió ${respuesta.status}: ${await respuesta.text()}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[enviar-informe] Error llamando a Resend:", err);
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

  const { data: resultado } = await cliente
    .from("resultados")
    .select("perfil_json")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (!resultado) {
    return NextResponse.json({ error: "Informe no encontrado" }, { status: 404 });
  }

  const { data: correo } = await cliente
    .from("correos_informe")
    .select("id, email, estado")
    .eq("session_id", sessionId)
    .order("creado_en", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!correo) {
    return NextResponse.json({ error: "No hay correo registrado para esta sesión" }, { status: 400 });
  }

  if (correo.estado === "enviado") {
    return NextResponse.json({ estado: "enviado" }, { status: 200 });
  }

  const { subject, html, text } = construirCorreoInforme(resultado.perfil_json as PerfilResultado);
  const enviado = await enviarConResend(correo.email, subject, html, text);

  await cliente
    .from("correos_informe")
    .update({ estado: enviado ? "enviado" : "error", enviado_en: new Date().toISOString() })
    .eq("id", correo.id);

  if (!enviado) {
    return NextResponse.json({ estado: "error" }, { status: 502 });
  }
  return NextResponse.json({ estado: "enviado" }, { status: 200 });
}
