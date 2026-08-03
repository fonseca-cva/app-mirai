// Verificación del rate limit de enlaces por correo (Tanda A, migración 00012).
// Regla de Camilo: máx 5 envíos por correo por hora.
//
// Requiere un proyecto Supabase real con la migración 00012 ya aplicada.
// Uso:
//   node --env-file=.env.local scripts/verificar-rate-limit.mjs
// (o exportar NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY antes de correrlo)

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
    "Corré este script recién cuando tengas las credenciales del proyecto real " +
    "(node --env-file=.env.local scripts/verificar-rate-limit.mjs)."
  );
  process.exit(1);
}

// Correo fake (.invalid nunca se envía): el RPC solo cuenta y registra.
const email = `rate-limit-${Date.now()}@prueba.mirai.invalid`;

const cliente = createClient(url, anonKey);
const { error: anonError } = await cliente.auth.signInAnonymously();
if (anonError) {
  console.error("No se pudo crear sesión anónima:", anonError.message);
  process.exit(1);
}

let permitidos = 0;
let fallas = 0;

for (let i = 1; i <= 6; i++) {
  const { data, error } = await cliente.rpc("permitir_envio_otp", { p_email: email });
  if (error) {
    console.error(`❌ Llamada ${i}: el RPC falló — ¿está aplicada la migración 00012?`, error.message);
    process.exit(2);
  }
  const esperado = i <= 5;
  const ok = data === esperado;
  console.log(`${ok ? "✅" : "❌"} Llamada ${i}: permitido=${data} (esperado ${esperado})`);
  if (data === true) permitidos++;
  if (!ok) fallas++;
}

console.log(
  fallas === 0
    ? `\nRate limit OK: 5 permitidos, 6ª rechazada (${permitidos}/${permitidos} dentro de la hora).`
    : `\n${fallas} verificación(es) fallida(s).`
);
process.exit(fallas === 0 ? 0 : 2);
