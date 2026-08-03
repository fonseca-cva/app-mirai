// Verificación de la Tanda B: informe permanente /informe/[token] (migración 00013).
//
// Controles de Camilo:
//   - "Un token ajeno no permite acceder a datos de la cuenta": la RPC pública
//     obtener_informe_publico devuelve 0 filas con un token desconocido, y su
//     proyección es SOLO token/perfil_json/generado_en (nunca user_id, session_id
//     ni correo).
//   - La tabla resultados no es legible sin sesión (RLS por auth.uid()).
//
// Requiere: proyecto real con la migración 00013 aplicada.
//
// Uso:
//   node --env-file=.env.local scripts/verificar-informe-permanente.mjs

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

// ── 1) Sesión anónima y fila de prueba ─────────────────────────────
const cliente = createClient(url, anonKey);
const { data: anon, error: anonError } = await cliente.auth.signInAnonymously();
if (anonError || !anon.user) {
  console.error("No se pudo crear la sesión anónima:", anonError?.message);
  process.exit(1);
}
reportar("Sesión anónima creada", true, anon.user.id);

const sesionIdPrueba = randomUUID();
const { error: sesionError } = await cliente
  .from("sesiones")
  .insert({ id: sesionIdPrueba, dispositivo: "verificar-informe-permanente" });
reportar("Sesión de negocio creada", !sesionError, sesionError?.message);
if (sesionError) process.exit(1);

// El insert devuelve la fila con el token generado por DEFAULT (00013).
const { data: resultado, error: resultadoError } = await cliente
  .from("resultados")
  .insert({ session_id: sesionIdPrueba, perfil_json: perfilJson })
  .select("token, perfil_json")
  .single();
reportar("Resultado insertado con token generado por la DB", !resultadoError, resultadoError?.message);
if (resultadoError || !resultado?.token) process.exit(1);

const token = resultado.token;
reportar(
  "Token tiene forma no adivinable (base64url ~22 chars)",
  /^[A-Za-z0-9_-]{20,24}$/.test(token),
  token
);

// ── 2) Lectura pública por token (RPC) ──────────────────────────────
const { data: informe, error: rpcError } = await cliente
  .rpc("obtener_informe_publico", { p_token: token })
  .maybeSingle();
reportar("La RPC pública devuelve el informe con el token correcto", !rpcError && !!informe, rpcError?.message);
if (rpcError || !informe) process.exit(1);

// Proyección mínima: NUNCA user_id ni session_id (ni correo).
const claves = Object.keys(informe).sort();
reportar(
  "La RPC expone SOLO token/perfil_json/generado_en",
  JSON.stringify(claves) === JSON.stringify(["generado_en", "perfil_json", "token"]),
  claves.join(", ")
);
reportar(
  "El perfil guardado se reconstruye idéntico (incluye campos nuevos de Tanda B)",
  JSON.stringify(informe.perfil_json) === JSON.stringify(perfilJson)
);

// ── 3) Token ajeno → 0 filas (Camilo) ───────────────────────────────
const tokenAjeno = "A".repeat(22).replace(/A/g, "z");
const { data: ajeno } = await cliente
  .rpc("obtener_informe_publico", { p_token: tokenAjeno })
  .maybeSingle();
reportar("Un token ajeno no devuelve nada", !ajeno);

// ── 4) La tabla no es legible sin sesión (RLS) ──────────────────────
const clienteAnon = createClient(url, anonKey); // sin signInAnonymously
const { data: lecturaDirecta, error: lecturaError } = await clienteAnon
  .from("resultados")
  .select("user_id, session_id, perfil_json")
  .eq("session_id", sesionIdPrueba);
reportar(
  "Sin sesión, SELECT directo a resultados es bloqueado por RLS (0 filas)",
  !lecturaDirecta || lecturaDirecta.length === 0,
  lecturaError ? lecturaError.message : undefined
);

console.log(fallas === 0 ? "\n✅ Todo en orden." : `\n❌ ${fallas} control(es) fallaron.`);
process.exit(fallas === 0 ? 0 : 1);
