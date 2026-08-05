// Helper de sync incremental entre Zustand y Supabase.
// Sección 2 de la spec: guardado por bloque completado (no por respuesta individual),
// con cola de reintento en memoria + localStorage de backup.
// // LIMITACIÓN: si el usuario cierra la pestaña antes de que la cola se vacíe,
// los datos pendientes se pierden (no hay service worker persistente en esta fase).

import { supabase, asegurarSesionAnonima } from "@/lib/supabase/client";
import type { SesionRow, RespuestaGustoRow, RespuestaCognitivoRow, RespuestaVerbalRow, ResultadoRow, CorreoInformeRow, TutorialEstadoRow, RespuestaDivergenteRow, RespuestaActividadRow, RespuestaAsignaturaRow, AspiracionRow } from "@/lib/supabase/types";

const TIMEOUT_MS = 5000;

// ── Función auxiliar: timeout para operaciones Supabase ─────────────
function conTimeout<T>(promesa: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    Promise.resolve(promesa).then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

// Las policies RLS exigen auth.uid() = user_id: sin sesión anónima activa,
// toda operación contra estas tablas es rechazada.
async function conSesion<T>(operacion: () => PromiseLike<T>): Promise<T> {
  await asegurarSesionAnonima();
  return conTimeout(operacion(), TIMEOUT_MS);
}

// ── Sync de sesión ─────────────────────────────────────────────────
export async function syncSesion(sesion: SesionRow): Promise<boolean> {
  if (!supabase) return false;
  const cliente = supabase;
  try {
    await conSesion(() => cliente.from("sesiones").upsert(sesion, { onConflict: "id" }));
    return true;
  } catch {
    return false;
  }
}

// ── Sync de respuestas gustos ─────────────────────────────────────
export async function syncRespuestasGustos(respuestas: RespuestaGustoRow[]): Promise<boolean> {
  if (!supabase || respuestas.length === 0) return false;
  const cliente = supabase;
  try {
    await conSesion(() => cliente.from("respuestas_gustos").insert(respuestas));
    return true;
  } catch {
    return false;
  }
}

// ── Sync de respuestas cognitivo ──────────────────────────────────
export async function syncRespuestasCognitivo(respuestas: RespuestaCognitivoRow[]): Promise<boolean> {
  if (!supabase || respuestas.length === 0) return false;
  const cliente = supabase;
  try {
    await conSesion(() => cliente.from("respuestas_cognitivo").insert(respuestas));
    return true;
  } catch {
    return false;
  }
}

// ── Sync de respuestas verbal ─────────────────────────────────────
// El texto se guarda aunque la evaluación falle (spec sección 4).
// Si la fila ya tiene id (insertada en 'pendiente' antes de evaluar, para el
// reintento asíncrono del punto 10), el resultado se escribe vía la RPC
// actualizar_evaluacion_verbal (verifica propiedad y no pisa filas 'evaluado').
export async function syncRespuestaVerbal(respuesta: RespuestaVerbalRow): Promise<boolean> {
  if (!supabase) return false;
  const cliente = supabase;
  try {
    if (respuesta.id) {
      await conSesion(() =>
        cliente.rpc("actualizar_evaluacion_verbal", {
          p_id: respuesta.id,
          p_evaluacion_json: respuesta.evaluacion_json,
          p_estado: respuesta.estado,
          p_revision_requerida: respuesta.revision_requerida,
          p_acuerdo_no_disponible: respuesta.acuerdo_no_disponible ?? false,
        })
      );
      return true;
    }
    await conSesion(() => cliente.from("respuestas_verbal").insert(respuesta));
    return true;
  } catch {
    return false;
  }
}

// ── Insert de respuesta verbal en 'pendiente' (punto 10) ──────────
// Se inserta ANTES de llamar a /api/evaluar para tener el id con el que el
// servidor puede completar la evaluación en segundo plano si falla en el
// momento. Devuelve el id de la fila, o null si el insert falló.
export async function insertarRespuestaVerbalPendiente(
  respuesta: Omit<RespuestaVerbalRow, "estado" | "evaluacion_json" | "revision_requerida">
): Promise<number | null> {
  if (!supabase) return null;
  const cliente = supabase;
  try {
    const { data, error } = await conSesion(() =>
      cliente
        .from("respuestas_verbal")
        .insert({ ...respuesta, estado: "pendiente", evaluacion_json: null, revision_requerida: false })
        .select("id")
        .maybeSingle()
    );
    if (error) return null;
    return (data?.id as number | undefined) ?? null;
  } catch {
    return null;
  }
}

// ── Update de evaluación verbal (después de llamar a /api/evaluar) ─
export async function updateEvaluacionVerbal(
  id: number,
  evaluacionJson: unknown,
  estado: "evaluado" | "error"
): Promise<boolean> {
  if (!supabase) return false;
  const cliente = supabase;
  try {
    await conSesion(() =>
      cliente.from("respuestas_verbal").update({ evaluacion_json: evaluacionJson, estado, evaluado_en: new Date().toISOString() }).eq("id", id)
    );
    return true;
  } catch {
    return false;
  }
}

// ── Sync de actividades (Bloque A2 — pilar de intereses) ────────────
// Los 24 ítems se guardan juntos al cerrarse el bloque.
export async function syncRespuestasActividades(respuestas: RespuestaActividadRow[]): Promise<boolean> {
  if (!supabase || respuestas.length === 0) return false;
  const cliente = supabase;
  try {
    await conSesion(() => cliente.from("respuestas_actividades").insert(respuestas));
    return true;
  } catch {
    return false;
  }
}

// ── Sync de asignaturas (Bloque A3 — pilar de intereses) ────────────
// Los 10 ítems se guardan juntos al cerrarse el bloque.
export async function syncRespuestasAsignaturas(respuestas: RespuestaAsignaturaRow[]): Promise<boolean> {
  if (!supabase || respuestas.length === 0) return false;
  const cliente = supabase;
  try {
    await conSesion(() => cliente.from("respuestas_asignaturas").insert(respuestas));
    return true;
  } catch {
    return false;
  }
}

// ── Sync de aspiración (Bloque A4 — pilar de intereses) ─────────────
// Una fila por sesión: upsert por session_id para ser idempotente.
export async function syncAspiracion(aspiracion: AspiracionRow): Promise<boolean> {
  if (!supabase) return false;
  const cliente = supabase;
  try {
    await conSesion(() => cliente.from("aspiraciones").upsert(aspiracion, { onConflict: "session_id" }));
    return true;
  } catch {
    return false;
  }
}

// ── Sync de divergente (EXPLORATORIO — NO REPORTAR en v1) ─────────
// El bloque sincroniza los 3 objetos juntos al cerrarse.
export async function syncRespuestasDivergente(respuestas: RespuestaDivergenteRow[]): Promise<boolean> {
  if (!supabase || respuestas.length === 0) return false;
  const cliente = supabase;
  try {
    await conSesion(() => cliente.from("respuestas_divergente").insert(respuestas));
    return true;
  } catch {
    return false;
  }
}

// ── Sync de resultados ────────────────────────────────────────────
// Guard de merge (punto 10): si el reintento asíncrono del servidor ya
// completó la comunicación (perfil_json.capacidades.comunicacion != null) y
// este guardado local aún la trae null (la evaluación falló en el momento),
// NO se pisa la versión del servidor: el informe permanente ya quedó completo.
export async function syncResultados(resultado: ResultadoRow): Promise<boolean> {
  if (!supabase) return false;
  const cliente = supabase;
  try {
    const entrante = resultado.perfil_json;
    if (entrante.capacidades?.comunicacion == null) {
      const { data: existente } = await conSesion(() =>
        cliente.from("resultados").select("perfil_json").eq("session_id", resultado.session_id).maybeSingle()
      );
      const comunicacionExistente = (existente?.perfil_json as { capacidades?: { comunicacion?: number | null } } | undefined)
        ?.capacidades?.comunicacion;
      if (comunicacionExistente != null) {
        // El servidor ya completó la dimensión: no pisar el informe.
        return true;
      }
    }
    await conSesion(() => cliente.from("resultados").upsert(resultado, { onConflict: "session_id" }));
    return true;
  } catch {
    return false;
  }
}

// ── Sync de estado del tutorial (ITERACIÓN 3 — telemetría de calidad) ─
export async function syncTutorialEstado(estado: TutorialEstadoRow): Promise<boolean> {
  if (!supabase) return false;
  const cliente = supabase;
  try {
    await conSesion(() => cliente.from("tutorial_estado").upsert(estado, { onConflict: "session_id,juego" }));
    return true;
  } catch {
    return false;
  }
}

// ── Sync de correo informe ────────────────────────────────────────
export async function syncCorreoInforme(correo: CorreoInformeRow): Promise<boolean> {
  if (!supabase) return false;
  const cliente = supabase;
  try {
    await conSesion(() => cliente.from("correos_informe").insert(correo));
    return true;
  } catch {
    return false;
  }
}

// ── Intento de drenar la cola de sync ─────────────────────────────
// Llámese después de cada bloque completado. No es crítico que falle:
// si Supabase no responde, los datos están en la cola y se reintentan
// en el próximo bloque o al recargar la página.
export interface TareaSync {
  id: string;
  tipo: "sesion" | "gustos" | "cognitivo" | "verbal" | "divergente" | "actividades" | "asignaturas" | "aspiracion" | "resultado" | "correo" | "tutorial";
  payload: unknown;
}

export async function procesarColaSync(cola: TareaSync[]): Promise<TareaSync[]> {
  const fallaron: TareaSync[] = [];

  for (const tarea of cola) {
    let ok = false;
    switch (tarea.tipo) {
      case "sesion":
        ok = await syncSesion(tarea.payload as SesionRow);
        break;
      case "gustos":
        ok = await syncRespuestasGustos(tarea.payload as RespuestaGustoRow[]);
        break;
      case "cognitivo":
        ok = await syncRespuestasCognitivo(tarea.payload as RespuestaCognitivoRow[]);
        break;
      case "verbal":
        ok = await syncRespuestaVerbal(tarea.payload as RespuestaVerbalRow);
        break;
      case "divergente":
        ok = await syncRespuestasDivergente(tarea.payload as RespuestaDivergenteRow[]);
        break;
      case "actividades":
        ok = await syncRespuestasActividades(tarea.payload as RespuestaActividadRow[]);
        break;
      case "asignaturas":
        ok = await syncRespuestasAsignaturas(tarea.payload as RespuestaAsignaturaRow[]);
        break;
      case "aspiracion":
        ok = await syncAspiracion(tarea.payload as AspiracionRow);
        break;
      case "resultado":
        ok = await syncResultados(tarea.payload as ResultadoRow);
        break;
      case "correo":
        ok = await syncCorreoInforme(tarea.payload as CorreoInformeRow);
        break;
      case "tutorial":
        ok = await syncTutorialEstado(tarea.payload as TutorialEstadoRow);
        break;
    }
    if (!ok) fallaron.push(tarea);
  }

  return fallaron;
}
