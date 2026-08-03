// POST /api/vincular-cuenta — Tanda A: vincula el correo a la sesión anónima.
//
// Conversión anónimo → cuenta con PRESERVACIÓN de datos: se usa
// `auth.updateUser({ email })`, que es el mecanismo documentado de Supabase para
// convertir un usuario anónimo en permanente manteniendo el MISMO auth.uid().
// (NO se usa signInWithOtp: ese flujo crea un usuario NUEVO con otro uid y las
// filas de respuestas/resultados quedarían huérfanas bajo el uid anónimo.)
//
// Seguridad: el cliente autentica con el access token de su sesión anónima
// (Authorization: Bearer <token>) y el route opera con un cliente "as-user",
// sujeto a las mismas policies RLS (auth.uid() = user_id).
//
// Sin service role en este repo: si el correo ya pertenece a OTRA cuenta, no se
// puede fusionar (requeriría admin.generateLink + migración de filas entre uids).
// Se responde yaTeniasCuenta=true y la UI lo comunica con honestidad; el merge
// queda reportado como pendiente (requiere SUPABASE_SERVICE_ROLE_KEY).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { vincularCuentaSchema } from "@/lib/logic/cuenta";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Falta sesión" }, { status: 401 });
  }

  const parsed = vincularCuentaSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const { correo } = parsed.data;

  // Cliente "as-user": el JWT anónimo del cliente, RLS aplica normal.
  const cliente = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  // 1) Rate limit: máx 5 enlaces por correo por hora (RPC SECURITY DEFINER, 00012).
  const { data: permitido, error: rpcError } = await cliente.rpc("permitir_envio_otp", {
    p_email: correo,
  });
  if (rpcError) {
    console.error(`[vincular-cuenta] RPC permitir_envio_otp falló (¿migración 00012 aplicada?): ${rpcError.message}`);
    return NextResponse.json({ error: "No pudimos procesar la solicitud." }, { status: 502 });
  }
  if (permitido === false) {
    return NextResponse.json(
      { error: "Enviaste varios enlaces a este correo. Espera una hora y prueba de nuevo.", codigo: "limite_otp" },
      { status: 429 }
    );
  }

  // 2) Conversión: mismo uid, correo de confirmación a la dirección indicada.
  // La URL de redirect no lleva ningún dato identificable (sin correo, sin apodo).
  const emailRedirectTo = `${new URL(request.url).origin}/guardar-informe`;
  const { error } = await cliente.auth.updateUser(
    { email: correo },
    { emailRedirectTo }
  );

  if (error) {
    // El correo ya pertenece a otra cuenta (o a esta misma sesión): no podemos
    // enviar el enlace de conversión. Nada se pierde: la sesión anónima sigue
    // intacta y el informe sigue en pantalla.
    if (error.status === 422 || /already|registered|same/i.test(error.message)) {
      return NextResponse.json({ ok: true, yaTeniasCuenta: true });
    }
    console.error(`[vincular-cuenta] updateUser falló: ${error.message}`);
    return NextResponse.json({ error: "No pudimos enviar el enlace." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, yaTeniasCuenta: false });
}
