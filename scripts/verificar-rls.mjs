// Prueba de aislamiento RLS (Fase 3 — Anonymous Auth).
// Exigida por Camilo antes de mergear la migración 00003: desde dos sesiones
// anónimas distintas, confirmar que ninguna puede leer ni escribir filas de la otra.
//
// Requiere un proyecto Supabase real con la migración 00003 ya aplicada.
// Uso:
//   node --env-file=.env.local scripts/verificar-rls.mjs
// (o exportar NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY antes de correrlo)

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
    "Corré este script recién cuando tengas las credenciales del proyecto real " +
    "(node --env-file=.env.local scripts/verificar-rls.mjs)."
  );
  process.exit(1);
}

// Dos clientes independientes → cada uno con su propia sesión anónima en memoria,
// simulando dos usuarios/dispositivos reales sin compartir estado.
const clienteA = createClient(url, anonKey);
const clienteB = createClient(url, anonKey);

let fallas = 0;

function reportar(nombre, ok, detalle) {
  console.log(`${ok ? "✅" : "❌"} ${nombre}${detalle ? " — " + detalle : ""}`);
  if (!ok) fallas++;
}

const { data: authA, error: errA } = await clienteA.auth.signInAnonymously();
const { data: authB, error: errB } = await clienteB.auth.signInAnonymously();

if (errA || errB || !authA.user || !authB.user) {
  console.error("No se pudo crear sesión anónima:", errA ?? errB);
  process.exit(1);
}

reportar(
  "Los dos usuarios anónimos tienen auth.uid() distinto",
  authA.user.id !== authB.user.id,
  `A=${authA.user.id} B=${authB.user.id}`
);

// Control positivo: A crea su propia sesión — debe funcionar.
const sesionIdA = randomUUID();
const { error: insertPropioError } = await clienteA
  .from("sesiones")
  .insert({ id: sesionIdA, dispositivo: "verificacion-rls-aislamiento" });

reportar("A puede insertar su propia sesión", !insertPropioError, insertPropioError?.message);

// B intenta leer la sesión de A → RLS debe devolver 0 filas (no un error; RLS filtra en vez de bloquear).
const { data: lecturaAjena, error: lecturaError } = await clienteB
  .from("sesiones")
  .select("id")
  .eq("id", sesionIdA);

reportar(
  "B NO puede leer la sesión de A",
  !lecturaError && (lecturaAjena?.length ?? 0) === 0,
  lecturaError ? lecturaError.message : `filas devueltas: ${lecturaAjena?.length ?? 0}`
);

// B intenta modificar la sesión de A → RLS debe filtrar el UPDATE (0 filas afectadas).
const { data: updateAjeno, error: updateError } = await clienteB
  .from("sesiones")
  .update({ dispositivo: "hackeado-por-B" })
  .eq("id", sesionIdA)
  .select("id");

reportar(
  "B NO puede modificar la sesión de A",
  !updateError && (updateAjeno?.length ?? 0) === 0,
  updateError ? updateError.message : `filas modificadas: ${updateAjeno?.length ?? 0}`
);

// A confirma que su propia fila sigue intacta (no fue tocada por el intento de B).
const { data: relectura } = await clienteA
  .from("sesiones")
  .select("dispositivo")
  .eq("id", sesionIdA)
  .single();

reportar(
  "La fila de A sigue con su valor original tras el intento de B",
  relectura?.dispositivo === "verificacion-rls-aislamiento",
  `valor actual: ${relectura?.dispositivo}`
);

console.log(fallas === 0 ? "\nRLS OK: aislamiento por auth.uid() confirmado." : `\n${fallas} verificación(es) fallida(s).`);
process.exit(fallas === 0 ? 0 : 2);
