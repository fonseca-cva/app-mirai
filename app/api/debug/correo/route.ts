// POST /api/debug/correo — botón de prueba de correo del /debug (punto 11).
// Muestra el resultado REAL del proveedor (status + cuerpo del error), para
// verificar en 10 segundos SMTP/Supabase/Resend sin hacer la experiencia.
//
//   { tipo: "resend", destino: "..." } → Resend directo (dominio miraiapp.cl)
//   { tipo: "otp", destino: "..." }     → correo integrado de Supabase Auth
//     (signInWithOtp; con SMTP custom configurado, la salida real es Resend vía
//     SMTP — verifica la cadena completa incluyendo el redirect whitelist).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { debugAutenticado } from "@/lib/debug";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const EMAIL_FROM = process.env.EMAIL_FROM ?? "Mirai <informe@miraiapp.cl>";

const Schema = z.object({
  tipo: z.enum(["resend", "otp"]),
  destino: z.string().email(),
});

async function probarResend(destino: string): Promise<Record<string, unknown>> {
  if (!RESEND_API_KEY) {
    return { ok: false, error: "RESEND_API_KEY no configurada en el entorno" };
  }
  const inicio = Date.now();
  try {
    const respuesta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [destino],
        subject: "Prueba /debug — Mirai",
        html: "<p>Prueba de correo desde la herramienta de diagnóstico de Mirai.</p>",
        text: "Prueba de correo desde la herramienta de diagnóstico de Mirai.",
      }),
      signal: AbortSignal.timeout(15000),
    });
    const cuerpo = await respuesta.text();
    const ms = Date.now() - inicio;
    console.log(`[debug/correo] resend status=${respuesta.status} ms=${ms} cuerpo=${cuerpo.slice(0, 800)}`);
    return {
      ok: respuesta.ok,
      status: respuesta.status,
      ms,
      // Cuerpo COMPLETO del proveedor: éxito (id) o error textual exacto.
      cuerpo: cuerpo.slice(0, 2000),
    };
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : String(err);
    return { ok: false, error: mensaje, ms: Date.now() - inicio };
  }
}

async function probarOtp(destino: string, origin: string): Promise<Record<string, unknown>> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { ok: false, error: "Supabase no configurado" };
  }
  const inicio = Date.now();
  const emailRedirectTo = `${origin}/guardar-informe`;
  try {
    const cliente = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { error } = await cliente.auth.signInWithOtp({
      email: destino,
      options: { emailRedirectTo },
    });
    const ms = Date.now() - inicio;
    console.log(
      `[debug/correo] otp destino=${destino} ms=${ms} redirect=${emailRedirectTo} error=${error?.message ?? "ninguno"} status=${error?.status ?? 200}`
    );
    return {
      ok: !error,
      ms,
      // Mensaje textual exacto del proveedor (GoTrue): rate limit, redirect
      // fuera de whitelist, SMTP fallando, etc.
      error: error ? { message: error.message, status: error.status, code: error.code } : null,
      emailRedirectTo,
    };
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : String(err);
    return { ok: false, error: mensaje, ms: Date.now() - inicio };
  }
}

export async function POST(request: NextRequest) {
  if (!(await debugAutenticado())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = Schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const { tipo, destino } = parsed.data;

  const origin = new URL(request.url).origin;
  const resultado =
    tipo === "resend" ? await probarResend(destino) : await probarOtp(destino, origin);

  return NextResponse.json({ tipo, destino, ...resultado }, { status: 200 });
}
