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
  const sesionOk = await asegurarSesionAnonima();
  if (!sesionOk) throw new Error("sesion_anonima_no_disponible");
  return conTimeout(operacion(), TIMEOUT_MS);
}

// Regla no negociable (Camilo, 2026-09-08): ninguna escritura a la base puede
// fallar en silencio. Toda función de sync loguea código y mensaje reales del
// proveedor (o de la excepción) antes de reportar el fallo hacia arriba.
function logErrorSync(contexto: string, error: unknown): void {
  if (error && typeof error === "object" && "code" in error) {
    const e = error as { code?: string; message?: string; details?: string | null };
    console.error(`[sync:${contexto}] code=${e.code ?? "?"} message=${e.message ?? "?"} details=${e.details ?? "-"}`);
  } else if (error instanceof Error) {
    console.error(`[sync:${contexto}] ${error.message}`);
  } else {
    console.error(`[sync:${contexto}] error desconocido`, error);
  }
}

// ── Construcción de la fila de sesión ─────────────────────────────
// ÚNICO punto de construcción del SesionRow en todo el repo (aislamiento del
// modo prueba, migración 00017, exigencia "no negociable" de Camilo):
//   * Cuando modoPrueba es true, es_prueba SIEMPRE se fuerza a true — nunca a false.
//   * Cuando modoPrueba es false, la clave es_prueba se OMITE por completo (la BD
//     aplica el default false). No existe ninguna ruta que desdoble true→false.
// Los datos hijos (gustos, cognitivo, verbal, …) caen bajo este session_id y solo
// se persisten si el sync de la sesión escribe correctamente (verifica el flag).
export function construirSesionRow(
  sessionId: string,
  modoPrueba: boolean,
  base: {
    creada_en?: string;
    edad?: string | null;
    curso?: string | null;
    dispositivo?: string | null;
  } = {}
): SesionRow {
  const fila: SesionRow = {
    id: sessionId,
    creada_en: base.creada_en ?? new Date().toISOString(),
    edad: base.edad ?? null,
    curso: base.curso ?? null,
    dispositivo: base.dispositivo ?? null,
  };
  if (modoPrueba) fila.es_prueba = true;
  return fila;
}

// ── Sync de sesión ─────────────────────────────────────────────────
export async function syncSesion(sesion: SesionRow): Promise<boolean> {
  if (!supabase) return false;
  const cliente = supabase;
  try {
    const { error } = await conSesion(() => cliente.from("sesiones").upsert(sesion, { onConflict: "id" }));
    if (error) { logErrorSync("sesion", error); return false; }
    return true;
  } catch (error) {
    logErrorSync("sesion", error);
    return false;
  }
}

// ── Sync de respuestas gustos ─────────────────────────────────────
// IDEMPOTENTE (pilot readiness): el bloque entero se reintenta desde la cola con
// el MISMO payload cuando un POST se corta después de que la base ya insertó
// (timeout de 5s en redes de colegio). Con upsert + onConflict, ese reintento
// actualiza en vez de duplicar. Requiere el índice único
// uq_respuestas_gustos_sesion_contexto (migración 00020).
export async function syncRespuestasGustos(respuestas: RespuestaGustoRow[]): Promise<boolean> {
  if (!supabase || respuestas.length === 0) return false;
  const cliente = supabase;
  try {
    const { error } = await conSesion(() =>
      cliente.from("respuestas_gustos").upsert(respuestas, { onConflict: "session_id,contexto_id" })
    );
    if (error) { logErrorSync("gustos", error); return false; }
    return true;
  } catch (error) {
    logErrorSync("gustos", error);
    return false;
  }
}

// ── Sync de respuestas cognitivo ──────────────────────────────────
// IDEMPOTENTE: un ítem se responde una vez por (sesión, juego, ítem); el reintento
// de la cola actualiza en vez de duplicar. Requiere uq_respuestas_cognitivo_sesion_juego_item (00020).
export async function syncRespuestasCognitivo(respuestas: RespuestaCognitivoRow[]): Promise<boolean> {
  if (!supabase || respuestas.length === 0) return false;
  const cliente = supabase;
  try {
    const { error } = await conSesion(() =>
      cliente.from("respuestas_cognitivo").upsert(respuestas, { onConflict: "session_id,juego,item_id" })
    );
    if (error) { logErrorSync("cognitivo", error); return false; }
    return true;
  } catch (error) {
    logErrorSync("cognitivo", error);
    return false;
  }
}

// ── Sync de respuestas verbal ─────────────────────────────────────
// El texto se guarda aunque la evaluación falle (spec sección 4).
//
// CASO A — la fila ya existe (`respuesta.id`): el resultado se escribe vía la RPC
// actualizar_evaluacion_verbal, que verifica propiedad (user_id = auth.uid()) y
// NO pisa una fila en estado terminal ('evaluado'). Es el camino normal del
// reintento asíncrono del punto 10.
//
// CASO B — sin id: ya NO se hace `insert` a ciegas. Un insert duplicaría la
// respuesta cuando el bloque se re-sincroniza (mismo bug que en las otras
// tablas). Ahora se hace upsert por (session_id, tarea) — el índice único de la
// migración 00020 — con una guarda explícita para no pisar una evaluación ya
// completada:
//   * ON CONFLICT (session_id,tarea) DO UPDATE ...
//   * ... WHERE respuestas_verbal.estado <> 'evaluado'
// Es decir, si ya hay una fila EVALUADA, el upsert no la toca (0 filas
// afectadas) y la función devuelve igualmente true: el dato bueno ya está
// guardado, que es el resultado que el llamador espera. Si la fila está en
// 'pendiente'/'error'/'no_evaluado'/'no_pertinente', sí se actualiza.
//
// NOTA sobre la migración 00020: sin ese índice, el on_conflict falla con 42P10
// y la respuesta NO se guarda — el error se loguea y se devuelve false. Preferimos
// un fallo visible a una duplicación silenciosa (regla: ninguna escritura falla
// en silencio, y ningún fallo se reporta como éxito).
export async function syncRespuestaVerbal(respuesta: RespuestaVerbalRow): Promise<boolean> {
  if (!supabase) return false;
  const cliente = supabase;
  try {
    if (respuesta.id) {
      // Se usa la RPC de RESULTADO EXPLÍCITO (migración 00021), que distingue:
      //   'actualizado' → escrito. Éxito.
      //   'ya_evaluado' → ya estaba terminal Y es del usuario. ÉXITO IDEMPOTENTE:
      //                   la evaluación buena está guardada; sacar la fila de la
      //                   cola es lo correcto (antes se trataba como fallo y la
      //                   respuesta se reintentaba para siempre).
      //   'inexistente' → no existe o es ajena. FALLO real.
      const { data, error } = await conSesion(() =>
        cliente.rpc("actualizar_evaluacion_verbal_resultado", {
          p_id: respuesta.id,
          p_evaluacion_json: respuesta.evaluacion_json,
          p_estado: respuesta.estado,
          p_revision_requerida: respuesta.revision_requerida,
          p_acuerdo_no_disponible: respuesta.acuerdo_no_disponible ?? false,
        })
      );

      if (error) {
        // Degradación segura: si la migración 00021 aún no está aplicada, la RPC no
        // existe (PGRST202) y se cae a la versión booleana de 00016, que es el
        // comportamiento previo. Así el código nuevo no rompe un entorno viejo.
        const noExiste =
          error.code === "PGRST202" || error.code === "42883" || /could not find the function/i.test(error.message ?? "");
        if (noExiste) return await actualizarVerbalConRpcLegacy(cliente, respuesta);
        logErrorSync("verbal:rpc", error);
        return false;
      }

      if (data === "actualizado" || data === "ya_evaluado") return true;

      // 'inexistente' o cualquier valor inesperado: fallo, para que quede en la cola.
      logErrorSync("verbal:rpc", {
        code: "no_actualizado",
        message: `id=${respuesta.id} resultado=${String(data)} (fila inexistente o ajena)`,
      });
      return false;
    }

    // Caso B — sin id: upsert idempotente por (session_id, tarea), con guarda
    // para NO pisar una evaluación terminal. No se puede expresar un WHERE en el
    // DO UPDATE de PostgREST, así que se hace compare-and-set en dos pasos:
    //   1. `ignoreDuplicates: true` → ON CONFLICT DO NOTHING. Crea la fila si no
    //      existe; si existe, no la toca (y no la degrada). Idempotente por
    //      construcción: repetir la llamada no cambia nada.
    //   2. Si el estado entrante es un resultado de evaluación y la fila existía
    //      en un estado NO terminal ('pendiente','error','no_evaluado',
    //      'no_pertinente'), se actualiza con un UPDATE condicionado al estado
    //      observado. Si alguien la dejó en 'evaluado' entremedio, el WHERE no
    //      coincide y no se pisa (0 filas; se reporta true: el dato bueno está).
    // Requiere uq_respuestas_verbal_sesion_tarea (migración 00020). Sin ese
    // índice, el upsert falla con 42P10, se loguea y se devuelve false.
    const { error: errorUpsert } = await conSesion(() =>
      cliente
        .from("respuestas_verbal")
        .upsert(
          {
            session_id: respuesta.session_id,
            tarea: respuesta.tarea,
            texto: respuesta.texto,
            evaluacion_json: respuesta.evaluacion_json,
            estado: respuesta.estado,
            pegado: respuesta.pegado ?? false,
            caracteres_pegados: respuesta.caracteres_pegados ?? 0,
            revision_requerida: respuesta.revision_requerida ?? false,
            acuerdo_no_disponible: respuesta.acuerdo_no_disponible ?? false,
            intento: respuesta.intento ?? 1,
          },
          { onConflict: "session_id,tarea", ignoreDuplicates: true }
        )
    );
    if (errorUpsert) { logErrorSync("verbal:upsert", errorUpsert); return false; }

    // Paso 2: ¿quedó la fila en un estado no terminal con datos distintos? Se
    // relee para saber en qué estado está realmente (el insert pudo ser no-op por
    // conflicto) y se actualiza solo si sigue siendo actualizable.
    const { data: fila, error: errorSelect } = await conSesion(() =>
      cliente
        .from("respuestas_verbal")
        .select("id,estado")
        .eq("session_id", respuesta.session_id)
        .eq("tarea", respuesta.tarea)
        .maybeSingle()
    );
    if (errorSelect) { logErrorSync("verbal:select", errorSelect); return false; }
    if (!fila) {
      logErrorSync("verbal:upsert", { code: "fila_ausente", message: `sin fila tras upsert (session=${respuesta.session_id} tarea=${respuesta.tarea})` });
      return false;
    }

    // 'evaluado' es terminal: la respuesta ya está completa y no se toca.
    if (fila.estado === "evaluado") return true;
    // La fila recién creada ya quedó con el estado entrante del upsert.
    if (fila.estado === respuesta.estado) return true;

    // Update condicionado: si en la carrera alguien la marcó 'evaluado', el eq()
    // no coincide, no se actualiza nada y se reporta true (dato bueno presente).
    const { error: errorUpdate } = await conSesion(() =>
      cliente
        .from("respuestas_verbal")
        .update({
          texto: respuesta.texto,
          evaluacion_json: respuesta.evaluacion_json,
          estado: respuesta.estado,
          pegado: respuesta.pegado ?? false,
          caracteres_pegados: respuesta.caracteres_pegados ?? 0,
          revision_requerida: respuesta.revision_requerida ?? false,
          acuerdo_no_disponible: respuesta.acuerdo_no_disponible ?? false,
          intento: respuesta.intento ?? 1,
        })
        .eq("session_id", respuesta.session_id)
        .eq("tarea", respuesta.tarea)
        .neq("estado", "evaluado")
    );
    if (errorUpdate) { logErrorSync("verbal:update", errorUpdate); return false; }
    return true;
  } catch (error) {
    logErrorSync("verbal", error);
    return false;
  }
}
// Camino legado (migración 00016): la RPC booleana. Se usa SOLO si la de resultado
// explícito no existe todavía, para que el cliente funcione en un entorno sin
// aplicar 00021. No distingue "ya evaluada" de "inexistente", así que una fila
// terminal puede reintentarse sin fin: es la limitación que 00021 resuelve.
async function actualizarVerbalConRpcLegacy(
  cliente: NonNullable<typeof supabase>,
  respuesta: RespuestaVerbalRow
): Promise<boolean> {
  try {
    const { data, error } = await conSesion(() =>
      cliente.rpc("actualizar_evaluacion_verbal", {
        p_id: respuesta.id,
        p_evaluacion_json: respuesta.evaluacion_json,
        p_estado: respuesta.estado,
        p_revision_requerida: respuesta.revision_requerida,
        p_acuerdo_no_disponible: respuesta.acuerdo_no_disponible ?? false,
      })
    );
    if (error) { logErrorSync("verbal:rpc:legacy", error); return false; }
    if (data !== true) {
      logErrorSync("verbal:rpc:legacy", { code: "no_actualizado", message: `id=${respuesta.id} no coincidió (fila ajena o estado terminal)` });
      return false;
    }
    return true;
  } catch (error) {
    logErrorSync("verbal:rpc:legacy", error);
    return false;
  }
}

// ── Insert de respuesta verbal en 'pendiente' (punto 10) ──────────
// Se crea ANTES de llamar a /api/evaluar para tener el id con el que el servidor
// puede completar la evaluación en segundo plano si falla en el momento.
// Devuelve el id de la fila, o null si falló.
//
// IDEMPOTENTE por (session_id, tarea) — índice de la migración 00020.
//
// `ignoreDuplicates: true` (ON CONFLICT DO NOTHING) es deliberado y no negociable
// acá: esta función escribe estado 'pendiente', así que un DO UPDATE degradaría a
// 'pendiente' una fila ya 'evaluado' (perdería la evaluación). Con DO NOTHING, si
// la fila ya existe se conserva como está y solo se lee su id — que es justo lo
// que el llamador necesita para el reintento asíncrono. El UPDATE controlado vive
// en syncRespuestaVerbal, que sí respeta el estado terminal.
export async function insertarRespuestaVerbalPendiente(
  respuesta: Omit<RespuestaVerbalRow, "estado" | "evaluacion_json" | "revision_requerida">
): Promise<number | null> {
  if (!supabase) return null;
  const cliente = supabase;
  try {
    const { error: errorUpsert } = await conSesion(() =>
      cliente
        .from("respuestas_verbal")
        .upsert(
          { ...respuesta, estado: "pendiente", evaluacion_json: null, revision_requerida: false },
          { onConflict: "session_id,tarea", ignoreDuplicates: true }
        )
    );
    if (errorUpsert) { logErrorSync("verbal:pendiente", errorUpsert); return null; }

    // Relectura del id: necesaria en ambos casos (fila nueva o ya existente),
    // porque DO NOTHING no devuelve la fila que dejó pasar.
    const { data, error } = await conSesion(() =>
      cliente
        .from("respuestas_verbal")
        .select("id")
        .eq("session_id", respuesta.session_id)
        .eq("tarea", respuesta.tarea)
        .maybeSingle()
    );
    if (error) { logErrorSync("verbal:pendiente:select", error); return null; }
    if (!data?.id) {
      logErrorSync("verbal:pendiente", { code: "sin_id", message: `no se pudo obtener id (session=${respuesta.session_id} tarea=${respuesta.tarea})` });
      return null;
    }
    return data.id as number;
  } catch (error) {
    logErrorSync("verbal:pendiente", error);
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
    const { error } = await conSesion(() =>
      cliente.from("respuestas_verbal").update({ evaluacion_json: evaluacionJson, estado, evaluado_en: new Date().toISOString() }).eq("id", id)
    );
    if (error) { logErrorSync("verbal:update", error); return false; }
    return true;
  } catch (error) {
    logErrorSync("verbal:update", error);
    return false;
  }
}

// ── Sync de actividades (Bloque A2 — pilar de intereses) ────────────
// Los 24 ítems se guardan juntos al cerrarse el bloque. IDEMPOTENTE por
// (session_id, actividad_id): requiere uq_respuestas_actividades_sesion_actividad (00020).
export async function syncRespuestasActividades(respuestas: RespuestaActividadRow[]): Promise<boolean> {
  if (!supabase || respuestas.length === 0) return false;
  const cliente = supabase;
  try {
    const { error } = await conSesion(() =>
      cliente.from("respuestas_actividades").upsert(respuestas, { onConflict: "session_id,actividad_id" })
    );
    if (error) { logErrorSync("actividades", error); return false; }
    return true;
  } catch (error) {
    logErrorSync("actividades", error);
    return false;
  }
}

// ── Sync de asignaturas (Bloque A3 — pilar de intereses) ────────────
// Los 10 ítems se guardan juntos al cerrarse el bloque. IDEMPOTENTE por
// (session_id, asignatura_id): requiere uq_respuestas_asignaturas_sesion_asignatura (00020).
export async function syncRespuestasAsignaturas(respuestas: RespuestaAsignaturaRow[]): Promise<boolean> {
  if (!supabase || respuestas.length === 0) return false;
  const cliente = supabase;
  try {
    const { error } = await conSesion(() =>
      cliente.from("respuestas_asignaturas").upsert(respuestas, { onConflict: "session_id,asignatura_id" })
    );
    if (error) { logErrorSync("asignaturas", error); return false; }
    return true;
  } catch (error) {
    logErrorSync("asignaturas", error);
    return false;
  }
}

// ── Sync de aspiración (Bloque A4 — pilar de intereses) ─────────────
// Una fila por sesión: upsert por session_id para ser idempotente.
export async function syncAspiracion(aspiracion: AspiracionRow): Promise<boolean> {
  if (!supabase) return false;
  const cliente = supabase;
  try {
    const { error } = await conSesion(() => cliente.from("aspiraciones").upsert(aspiracion, { onConflict: "session_id" }));
    if (error) { logErrorSync("aspiracion", error); return false; }
    return true;
  } catch (error) {
    logErrorSync("aspiracion", error);
    return false;
  }
}

// ── Sync de divergente (EXPLORATORIO — NO REPORTAR en v1) ─────────
// El bloque sincroniza los 3 objetos juntos al cerrarse. IDEMPOTENTE por
// (session_id, objeto): requiere uq_respuestas_divergente_sesion_objeto (00020).
export async function syncRespuestasDivergente(respuestas: RespuestaDivergenteRow[]): Promise<boolean> {
  if (!supabase || respuestas.length === 0) return false;
  const cliente = supabase;
  try {
    const { error } = await conSesion(() =>
      cliente.from("respuestas_divergente").upsert(respuestas, { onConflict: "session_id,objeto" })
    );
    if (error) { logErrorSync("divergente", error); return false; }
    return true;
  } catch (error) {
    logErrorSync("divergente", error);
    return false;
  }
}

// ── Coherencia temporal del resultado ─────────────────────────────
// INVARIANTE: ningún resultado puede tener generado_en anterior a la creación de
// su sesión. El perfil se genera en el navegador (new Date()), así que un reloj
// desajustado o una sesión retomada al día siguiente podría producir un
// generado_en anterior a sesiones.creada_en. Es pura para poder testearla sin red.
// Devuelve el generado_en corregido (nunca anterior a creadaEn).
export function sanearGeneradoEn(generadoEn: string | undefined, creadaEn: string | null): string {
  // Sin creada_en conocida no hay contra qué comparar: se respeta el valor (o
  // se usa ahora si no vino). No inventamos una fecha para "arreglar" algo
  // que no sabemos si está mal.
  if (!creadaEn) return generadoEn ?? new Date().toISOString();

  const creada = Date.parse(creadaEn);
  const generado = generadoEn ? Date.parse(generadoEn) : NaN;

  // generado_en ausente o no parseable → usar creadaEn como piso honesto.
  if (Number.isNaN(generado)) return creadaEn;
  // Fecha inválida de sesión → no comparamos, respetamos lo que vino.
  if (Number.isNaN(creada)) return generadoEn as string;
  // Anterior a la creación: se corrige al piso (no se descarta el resultado).
  if (generado < creada) {
    console.warn(`[sync:resultados] generado_en (${generadoEn}) anterior a creada_en (${creadaEn}); corregido a creada_en`);
    return creadaEn;
  }
  return generadoEn as string;
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

    // Invariante temporal: se lee creada_en de la sesión y se corrige
    // perfil_json.generado_en si quedó anterior. Sin este paso, un reloj
    // desajustado dejaría un informe "generado antes de empezar".
    const { data: sesion, error: errorSesion } = await conSesion(() =>
      cliente.from("sesiones").select("creada_en").eq("id", resultado.session_id).maybeSingle()
    );
    if (errorSesion) { logErrorSync("resultados:sesion", errorSesion); return false; }
    const generadoEnSaneado = sanearGeneradoEn(entrante.generado_en, (sesion?.creada_en as string | undefined) ?? null);
    if (generadoEnSaneado !== entrante.generado_en) {
      resultado = { ...resultado, perfil_json: { ...entrante, generado_en: generadoEnSaneado } };
    }

    if (entrante.capacidades?.comunicacion == null) {
      const { data: existente, error: errorSelect } = await conSesion(() =>
        cliente.from("resultados").select("perfil_json").eq("session_id", resultado.session_id).maybeSingle()
      );
      if (errorSelect) { logErrorSync("resultados:select", errorSelect); return false; }
      const comunicacionExistente = (existente?.perfil_json as { capacidades?: { comunicacion?: number | null } } | undefined)
        ?.capacidades?.comunicacion;
      if (comunicacionExistente != null) {
        // El servidor ya completó la dimensión: no pisar el informe.
        return true;
      }
    }
    const { error } = await conSesion(() => cliente.from("resultados").upsert(resultado, { onConflict: "session_id" }));
    if (error) { logErrorSync("resultados", error); return false; }
    return true;
  } catch (error) {
    logErrorSync("resultados", error);
    return false;
  }
}

// ── Sync de estado del tutorial (ITERACIÓN 3 — telemetría de calidad) ─
export async function syncTutorialEstado(estado: TutorialEstadoRow): Promise<boolean> {
  if (!supabase) return false;
  const cliente = supabase;
  try {
    const { error } = await conSesion(() => cliente.from("tutorial_estado").upsert(estado, { onConflict: "session_id,juego" }));
    if (error) { logErrorSync("tutorial", error); return false; }
    return true;
  } catch (error) {
    logErrorSync("tutorial", error);
    return false;
  }
}

// ── Sync de correo informe ────────────────────────────────────────
export async function syncCorreoInforme(correo: CorreoInformeRow): Promise<boolean> {
  if (!supabase) return false;
  const cliente = supabase;
  try {
    const { error } = await conSesion(() => cliente.from("correos_informe").insert(correo));
    if (error) { logErrorSync("correo", error); return false; }
    return true;
  } catch (error) {
    logErrorSync("correo", error);
    return false;
  }
}

// ── Intento de drenar la cola de sync ─────────────────────────────
// Llámese después de cada bloque completado. Devuelve las tareas que FALLARON
// para que el llamador las conserve en memoria y las reintente en el próximo
// bloque.
//
// CORRECCIÓN DE UN COMENTARIO INCORRECTO: antes decía que lo pendiente "se
// reintenta ... al recargar la página". NO es cierto y no puede serlo: la cola
// (`colaSync`) es estado en memoria y NO se persiste (a propósito: una cola
// serializada podría reenviar payloads de una sesión ya descartada). Si el alumno
// cierra la pestaña, lo que había en la cola se pierde.
//
// Lo que SÍ sobrevive a una recarga es el ESTADO del store (respuestas +
// aspiración). Al montar, `reconstruirTareasPendientes()` las vuelve a derivar y
// las reenvía (sesión padre primero). La idempotencia de cada upsert hace que
// reenviar algo ya escrito sea inofensivo.
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
