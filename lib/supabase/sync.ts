// Helper de sync incremental entre Zustand y Supabase.
// Sección 2 de la spec: guardado por bloque completado (no por respuesta individual),
// con cola de reintento en memoria + localStorage de backup.
// // LIMITACIÓN: si el usuario cierra la pestaña antes de que la cola se vacíe,
// los datos pendientes se pierden (no hay service worker persistente en esta fase).

import { supabase, asegurarSesionAnonima } from "@/lib/supabase/client";
import type { SesionRow, RespuestaGustoRow, RespuestaCognitivoRow, RespuestaVerbalRow, ResultadoRow, CorreoInformeRow, TutorialEstadoRow } from "@/lib/supabase/types";

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
export async function syncRespuestaVerbal(respuesta: RespuestaVerbalRow): Promise<boolean> {
  if (!supabase) return false;
  const cliente = supabase;
  try {
    await conSesion(() => cliente.from("respuestas_verbal").insert(respuesta));
    return true;
  } catch {
    return false;
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

// ── Sync de resultados ────────────────────────────────────────────
export async function syncResultados(resultado: ResultadoRow): Promise<boolean> {
  if (!supabase) return false;
  const cliente = supabase;
  try {
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
  tipo: "sesion" | "gustos" | "cognitivo" | "verbal" | "resultado" | "correo" | "tutorial";
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
