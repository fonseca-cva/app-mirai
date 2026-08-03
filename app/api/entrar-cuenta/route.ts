// POST /api/entrar-cuenta — Tanda C: re-entrada por enlace mágico (sin contraseña).
//
// Se llama desde /mi-cuenta cuando NO hay sesión (estado "sin cuenta"): el
// usuario escribe el correo con el que guardó su informe y recibe un enlace
// de entrada. No crea cuentas (shouldCreateUser: false): si el correo no tiene
// cuenta, no se envía nada y la respuesta es idéntica (sin oráculo de
// enumeración de correos).
//
// Rate limit: mismo bucket de 5/h que /api/vincular-cuenta (RPC
// permitir_envio_otp, migración 00012). Limitación conocida y documentada:
// ambos flujos comparten cupo, así que alguien podría agotar el de un correo
// ajeno. Es un DoS de bajo costo (5/h es generoso) y no se resuelve en esta
// tanda.
//
// Pre-sesión: este route NO exige Authorization. Quien visita /mi-cuenta sin
// haber hecho la experiencia no tiene JWT de sesión (rol anon). Por eso la
// migración 00014 concede EXECUTE del RPC a anon: sin ese grant no habría
// forma de ratear este flujo sin crear usuarios anónimos fantasma (decisión
// de Tanda C: /mi-cuenta no crea sesiones).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { correoSchema } from "@/lib/logic/cuenta";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  const cuerpo = (await request.json().catch(() => null)) as { correo?: unknown } | null;
  const parsed = correoSchema.safeParse(cuerpo?.correo);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const correo = parsed.data;

  // Cliente con la anon key: sin sesión no hay JWT de usuario, y este flujo
  // debe funcionar pre-sesión.
  const cliente = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // 1) Rate limit: máx 5 enlaces por correo por hora (RPC SECURITY DEFINER,
  // 00012; grant a anon por 00014).
  const { data: permitido, error: rpcError } = await cliente.rpc("permitir_envio_otp", {
    p_email: correo,
  });
  if (rpcError) {
    console.error(`[entrar-cuenta] RPC permitir_envio_otp falló (¿migraciones 00012/00014 aplicadas?): ${rpcError.message}`);
    return NextResponse.json({ error: "No pudimos procesar la solicitud." }, { status: 502 });
  }
  if (permitido === false) {
    return NextResponse.json(
      { error: "Enviaste varios enlaces a este correo. Espera una hora y prueba de nuevo.", codigo: "limite_otp" },
      { status: 429 }
    );
  }

  // 2) Enlace mágico solo para cuentas existentes; jamás crea un usuario nuevo.
  const emailRedirectTo = `${new URL(request.url).origin}/mi-cuenta`;
  const { error } = await cliente.auth.signInWithOtp({
    email: correo,
    options: { shouldCreateUser: false, emailRedirectTo },
  });

  if (error) {
    console.error(`[entrar-cuenta] signInWithOtp falló: ${error.message}`);
    return NextResponse.json({ error: "No pudimos enviar el enlace." }, { status: 502 });
  }

  // Respuesta genérica SIEMPRE: no revelar si el correo tiene cuenta o no.
  return NextResponse.json({ ok: true }, { status: 200 });
}
