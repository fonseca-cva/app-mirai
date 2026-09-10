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
  //
  // NO se usa cliente.auth.updateUser(): esa función del SDK exige una sesión
  // completa en el storage interno del cliente (_useSession()) y, al no tenerla
  // (solo pasamos el token por header), lanza localmente AuthSessionMissingError
  // ("Auth session missing!") ANTES de tocar la red — sin excepción para
  // hasCustomAuthorizationHeader, a diferencia de getUser(). Se llama directo al
  // endpoint REST oficial PUT /auth/v1/user, que sí acepta el Bearer del header.
  const emailRedirectTo = `${new URL(request.url).origin}/guardar-informe`;
  const respuesta = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: "PUT",
    headers: {
      Authorization: authHeader,
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: correo, email_redirect_to: emailRedirectTo }),
  });
  const cuerpo = (await respuesta.json().catch(() => ({}))) as {
    msg?: string;
    message?: string;
    error_description?: string;
    error?: string;
    code?: string;
    error_code?: string;
  };
  const errorMsg =
    cuerpo.msg ?? cuerpo.message ?? cuerpo.error_description ?? cuerpo.error ?? "";

  if (!respuesta.ok) {
    // El correo ya pertenece a otra cuenta (o a esta misma sesión): no podemos
    // enviar el enlace de conversión. Nada se pierde: la sesión anónima sigue
    // intacta y el informe sigue en pantalla.
    if (
      respuesta.status === 422 ||
      /already|registered|same|exists/i.test(errorMsg) ||
      /email_exists|user_already_exists/i.test(cuerpo.error_code ?? cuerpo.code ?? "")
    ) {
      return NextResponse.json({ ok: true, yaTeniasCuenta: true });
    }
    // Token de sesión rechazado por GoTrue: mensaje claro y accionable en vez
    // del 502 genérico, para que el usuario sepa que debe recargar.
    if (respuesta.status === 401 || /session|invalid claim|jwt/i.test(errorMsg)) {
      console.error(`[vincular-cuenta] PUT /auth/v1/user falló (sesión inválida): ${errorMsg}`);
      return NextResponse.json(
        { error: "Tu sesión expiró, recarga la página.", codigo: "sesion_expirada" },
        { status: 401 }
      );
    }
    console.error(`[vincular-cuenta] PUT /auth/v1/user falló (${respuesta.status}): ${errorMsg}`);
    return NextResponse.json({ error: "No pudimos enviar el enlace." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, yaTeniasCuenta: false });
}
