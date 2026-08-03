// Verificación de la Tanda C: /mi-cuenta (listado de informes propios por RLS).
//
// Controles de Camilo:
//   - Aislamiento por RLS: dos usuarios anónimos (A y B) con informes propios;
//     cada listado devuelve SOLO sus filas, nunca las del otro.
//   - Proyección mínima: el listado pide token/generado_en/perfil_json, nunca
//     session_id (ni user_id, que RLS no permite leer ajeno).
//   - La tabla no es legible sin sesión (RLS).
//
// La persistencia tras la conversión anónimo → cuenta (mismo auth.uid()) la
// verifica verificar-conversion-cuenta.mjs (Tanda A); este script cubre el
// aislamiento del listado, que es lo nuevo de la tanda.
//
// Requiere: proyecto real con las migraciones 00003 y 00013 aplicadas
// (resultados con RLS y token).
//
// Uso:
//   node --env-file=.env.local scripts/verificar-mi-cuenta.mjs

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY en el entorno.");
  process.exit(1);
}

let fallas = 0;
function reportar(nombre, ok, detalle) {
  console.log(`${ok ? "✅" : "❌"} ${nombre}${detalle ? " — " + detalle : ""}`);
  if (!ok) fallas++;
}

const perfilJson = {
  dimensionTop3: [
    { codigo: "I", etiqueta: "Investigativo", puntaje: 88 },
    { codigo: "A", etiqueta: "Artístico", puntaje: 74 },
    { codigo: "S", etiqueta: "Social", puntaje: 61 },
  ],
  capacidades: { patrones: 80, numerico: 60, espacial: 65, memoria: 72, comunicacion: 78 },
  carrerasRecomendadas: ["medicina", "enfermeria", "psicologia"],
  generado_en: new Date(0).toISOString(),
  aspiracion: { opcion: "universidad" },
  discrepancia: { etiquetaGustos: "Investigativo", etiquetaActividades: "Social" },
};

const PROYECCION = ["token", "generado_en", "perfil_json"];

/** Crea una sesión anónima y una fila de resultado para ella. */
async function crearUsuarioConInforme(nombre) {
  const cliente = createClient(url, anonKey);
  const { data: anon, error: anonError } = await cliente.auth.signInAnonymously();
  if (anonError || !anon.user) {
    reportar(`${nombre}: sesión anónima creada`, false, anonError?.message);
    return null;
  }
  reportar(`${nombre}: sesión anónima creada`, true, anon.user.id);

  const sesionId = randomUUID();
  const { error: sesionError } = await cliente
    .from("sesiones")
    .insert({ id: sesionId, dispositivo: "verificar-mi-cuenta" });
  if (sesionError) {
    reportar(`${nombre}: sesión de negocio creada`, false, sesionError.message);
    return null;
  }
  reportar(`${nombre}: sesión de negocio creada`, true);

  const { data: resultado, error: resultadoError } = await cliente
    .from("resultados")
    .insert({ session_id: sesionId, perfil_json: perfilJson })
    .select("token")
    .single();
  if (resultadoError || !resultado?.token) {
    reportar(`${nombre}: informe insertado`, false, resultadoError?.message);
    return null;
  }
  reportar(`${nombre}: informe insertado`, true, resultado.token);
  return { cliente, token: resultado.token };
}

// ── 1) Dos usuarios anónimos con un informe cada uno ────────────────
const a = await crearUsuarioConInforme("A");
const b = await crearUsuarioConInforme("B");
if (!a || !b) {
  console.error("\nNo se pudo preparar el escenario; revisa migraciones 00003/00013.");
  process.exit(1);
}

// ── 2) Listado de A: solo la fila de A ───────────────────────────────
const { data: listaA, error: listaAError } = await a.cliente
  .from("resultados")
  .select(PROYECCION.join(", "))
  .order("generado_en", { ascending: false });
reportar("A lista sus informes (sin error)", !listaAError, listaAError?.message);
if (listaAError) process.exit(1);
reportar(
  "El listado de A contiene SOLO su informe",
  listaA.length === 1 && listaA[0].token === a.token,
  `A ve ${listaA.length} fila(s)`
);

// Proyección mínima: nunca session_id, user_id ni correo.
const clavesA = Object.keys(listaA[0]).sort();
reportar(
  "El listado expone SOLO token/generado_en/perfil_json",
  JSON.stringify(clavesA) === JSON.stringify(PROYECCION),
  clavesA.join(", ")
);

// ── 3) Listado de B: solo la fila de B, y el token de A no aparece ──
const { data: listaB, error: listaBError } = await b.cliente
  .from("resultados")
  .select(PROYECCION.join(", "))
  .order("generado_en", { ascending: false });
reportar("B lista sus informes (sin error)", !listaBError, listaBError?.message);
if (listaBError) process.exit(1);
reportar(
  "El listado de B contiene SOLO su informe",
  listaB.length === 1 && listaB[0].token === b.token,
  `B ve ${listaB.length} fila(s)`
);
reportar(
  "B NO ve el token del informe de A (aislamiento RLS)",
  listaB.every((fila) => fila.token !== a.token)
);

// ── 4) A sigue viendo solo lo suyo tras la inserción de B ────────────
const { data: listaA2 } = await a.cliente
  .from("resultados")
  .select(PROYECCION.join(", "));
reportar(
  "A no ve el informe de B ni después (sin contaminación cruzada)",
  listaA2.length === 1 && listaA2[0].token === a.token
);

// ── 5) Sin sesión: SELECT directo bloqueado por RLS ──────────────────
const clienteAnon = createClient(url, anonKey); // sin signInAnonymously
const { data: lecturaDirecta } = await clienteAnon.from("resultados").select(PROYECCION.join(", "));
reportar(
  "Sin sesión, el SELECT a resultados es bloqueado por RLS (0 filas)",
  !lecturaDirecta || lecturaDirecta.length === 0
);

console.log(fallas === 0 ? "\n✅ Todo en orden." : `\n❌ ${fallas} control(es) fallaron.`);
process.exit(fallas === 0 ? 0 : 1);
