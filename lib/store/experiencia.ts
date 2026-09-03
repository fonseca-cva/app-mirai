import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Respuesta as RespuestaGustos } from "@/lib/logic/puntaje";
import type { RespuestaActividad, RespuestaAsignatura, Aspiracion } from "@/lib/logic/puntaje";
import type { OpcionAspiracion } from "@/lib/data/aspiracion";
import { obtenerOCrearSessionId } from "@/lib/store/sesion";
import { procesarColaSync, type TareaSync } from "@/lib/supabase/sync";
import { contextos } from "@/lib/data/contextos";
import { actividades } from "@/lib/data/actividades";
import { asignaturas } from "@/lib/data/asignaturas";
import { itemsMatrices } from "@/lib/data/matrices";
import { itemsSeries } from "@/lib/data/series";
import { itemsPliegues } from "@/lib/data/pliegues";
import { OBJETOS_DIVERGENTE, MIN_IDEAS_POR_OBJETO } from "@/lib/data/divergente";

// Bloque Integración: los tipos de respuesta del pilar de intereses viven en
// puntaje.ts (calcularPuntajesIntegrados los consume) y en data/aspiracion.ts
// (unión cerrada del CHECK de la migración 00011). Se re-exportan acá para no
// romper los imports de los componentes.
export type { TareaSync } from "@/lib/supabase/sync";
export type { RespuestaActividad, RespuestaAsignatura, Aspiracion } from "@/lib/logic/puntaje";
export type { OpcionAspiracion } from "@/lib/data/aspiracion";

export type PasoExperiencia =
  | "intro"
  | "aspiracion"
  | "gustos"
  | "actividades"
  | "asignaturas"
  | "resultadoParcial"
  | "cognitivo"
  | "verbal"
  | "divergente"
  | "informe";

export interface RespuestaCognitivo {
  juego: "matrices" | "series" | "pliegues" | "secuencias";
  itemId: string;
  correcto: boolean;
  nivel: number;
  duracionMs: number;
  // Anexo 3: solo aplica a "secuencias" — si esta respuesta vino tras usar la única
  // repetición por timeout de inactividad de la ronda (para no penalizar por distracción).
  repetidoPorTimeout: boolean;
}

export interface RespuestaVerbal {
  // Id de la fila respuestas_verbal insertada en 'pendiente' antes de evaluar
  // (reintento asíncrono, punto 10). Si existe, el sync del bloque actualiza la
  // fila vía RPC en vez de insertar una nueva.
  id?: number;
  tarea: "comprension" | "argumentacion" | "expresion";
  texto: string;
  evaluacion: unknown | null;
  // Validez (plan de Camilo): 'no_pertinente' = filtro de pertinencia rechazó la
  // respuesta (se guarda igual para QA); 'no_evaluado' = evaluación no disponible
  // (sin proveedor, fallo o formato inválido). NUNCA se inventa un puntaje.
  estado: "pendiente" | "evaluado" | "error" | "no_pertinente" | "no_evaluado";
  // Telemetría de control de calidad (solo QA: no afecta puntaje ni se muestra).
  pegado?: boolean;
  caracteresPegados?: number;
  revisionRequerida?: boolean;
  // Doble evaluación: true si la evaluación se reportó con un solo evaluador
  // (el segundo no estaba configurado o falló). Se persiste para auditoría.
  acuerdoNoDisponible?: boolean;
  intento?: number;
}

export interface RespuestaDivergente {
  objeto: string;
  respuestasTexto: string[];
  cantidad: number;
}

interface EstadoExperiencia {
  sessionId: string | null;
  paso: PasoExperiencia;
  pausado: boolean;
  // Modo prueba (aislamiento 00017): true solo mientras una sesión válida de /debug
  // esté autenticada en el navegador (cookie httpOnly). NO se persiste en localStorage
  // (se revalida contra /api/debug/verificar-prueba antes de cada escritura), así que
  // nunca queda "pegado" entre recargas ni tras expirar la cookie.
  modoPrueba: boolean;
  // Mejora Bloque A: elección de audio ambiente hecha en IntroExperiencia (opt-in,
  // nunca autoplay). El mute momentáneo durante el bloque es estado local del componente.
  audioActivado: boolean;
  respuestasGustos: RespuestaGustos[];
  respuestasCognitivo: RespuestaCognitivo[];
  respuestasVerbal: RespuestaVerbal[];
  respuestasDivergente: RespuestaDivergente[];
  respuestasActividades: RespuestaActividad[];
  respuestasAsignaturas: RespuestaAsignatura[];
  aspiracion: Aspiracion | null;
  colaSync: TareaSync[];

  inicializarSesion: () => void;
  // Flujo de modoprueba: activa/desactiva el flag en el store. Al activarlo NUNCA se
  // hace escritura alguna aquí — solo lo establece (verificarPrueba se encarga de
  // confirmar la cookie server-side antes de habilitar la UI; sincronizarBloque vuelve
  // a revalidar antes de cada escritura real).
  setModoPrueba: (activo: boolean) => void;
  irAPaso: (paso: PasoExperiencia) => void;
  pausar: () => void;
  reanudar: () => void;
  activarAudio: (conAudio: boolean) => void;
  agregarRespuestaGustos: (respuesta: RespuestaGustos) => void;
  agregarRespuestaCognitivo: (respuesta: RespuestaCognitivo) => void;
  agregarRespuestaVerbal: (respuesta: RespuestaVerbal) => void;
  agregarRespuestaDivergente: (respuesta: RespuestaDivergente) => void;
  agregarRespuestaActividad: (respuesta: RespuestaActividad) => void;
  agregarRespuestaAsignatura: (respuesta: RespuestaAsignatura) => void;
  setAspiracion: (aspiracion: Aspiracion) => void;
  // Encola las tareas nuevas y reintenta toda la cola (incluida la pendiente de bloques
  // anteriores) contra Supabase. No es crítico que falle: lo que no se sincroniza queda
  // en colaSync para el próximo bloque completado.
  sincronizarBloque: (tareas: TareaSync[]) => Promise<void>;
  // Modo prueba (Entrega 2): rellena con datos al azar el bloque no-verbal
  // recibido y avanza al siguiente paso, replicando EXACTAMENTE el sync que
  // hace cada bloque real al completarse (mismo payload, mismo sincronizarBloque).
  // No hace nada si paso no es un bloque no-verbal soportado (verbal/informe/etc.
  // se manejan aparte). Solo tiene efecto si modoPrueba está activo.
  rellenarBloqueAlAzar: (paso: PasoExperiencia) => Promise<void>;
}

function valorAlAzar(): 0 | 1 | 2 {
  return Math.floor(Math.random() * 3) as 0 | 1 | 2;
}

// Revalidación server-side del modo prueba (aislamiento 00017). Llama a la ruta
// protegida /api/debug/verificar-prueba que confirma la cookie httpOnly de /debug
// (hash de DEBUG_KEY). Devuelve true SOLO si la sesión de debug sigue siendo válida.
// Se invoca antes de cada escritura cuando modoPrueba está activo; si la cookie
// expiró o no existe, devuelve false y el store desactiva el modo sin escribir nada.
// Robustez: ante cualquier error de red falla "cerrado" (false) — el modo prueba
// jamás se auto-habilita ni escribe por no poder confirmar la cookie.
export async function verificarPruebaValida(): Promise<boolean> {
  if (typeof fetch === "undefined") return false;
  try {
    const res = await fetch("/api/debug/verificar-prueba", { method: "GET", cache: "no-store" });
    if (!res.ok) return false;
    const data = (await res.json()) as { ok?: boolean };
    return data?.ok === true;
  } catch {
    return false;
  }
}

export const useExperienciaStore = create<EstadoExperiencia>()(
  persist(
    (set, get) => ({
      sessionId: null,
      paso: "intro",
      pausado: false,
      modoPrueba: false,
      audioActivado: false,
      respuestasGustos: [],
      respuestasCognitivo: [],
      respuestasVerbal: [],
      respuestasDivergente: [],
      respuestasActividades: [],
      respuestasAsignaturas: [],
      aspiracion: null,
      colaSync: [],

      inicializarSesion: () => set({ sessionId: obtenerOCrearSessionId() }),
      setModoPrueba: (activo) => set({ modoPrueba: activo }),
      irAPaso: (paso) => set({ paso, pausado: false }),
      pausar: () => set({ pausado: true }),
      reanudar: () => set({ pausado: false }),
      activarAudio: (conAudio) => set({ audioActivado: conAudio }),

      agregarRespuestaGustos: (respuesta) =>
        set((estado) => ({ respuestasGustos: [...estado.respuestasGustos, respuesta] })),
      agregarRespuestaCognitivo: (respuesta) =>
        set((estado) => ({ respuestasCognitivo: [...estado.respuestasCognitivo, respuesta] })),
      agregarRespuestaVerbal: (respuesta) =>
        set((estado) => ({ respuestasVerbal: [...estado.respuestasVerbal, respuesta] })),
      agregarRespuestaDivergente: (respuesta) =>
        set((estado) => ({ respuestasDivergente: [...estado.respuestasDivergente, respuesta] })),
      agregarRespuestaActividad: (respuesta) =>
        set((estado) => ({ respuestasActividades: [...estado.respuestasActividades, respuesta] })),
      agregarRespuestaAsignatura: (respuesta) =>
        set((estado) => ({ respuestasAsignaturas: [...estado.respuestasAsignaturas, respuesta] })),
      setAspiracion: (aspiracion) => set({ aspiracion }),

      // Modo prueba (aislamiento 00017, exigencia no negociable de Camilo): TODA
      // escritura a la base ("sesion", "gustos", "cognitivo", "verbal", …) pasa por
      // sincronizarBloque — es el único call-site de procesarColaSync (verificado por
      // grep). Si el modo prueba está activo, se revalida la cookie server-side ANTES
      // de escribir nada. Si la revalidación falla (cookie expirada, otra pestaña,
      // navegación externa, session perdida), el modo se desactiva y NO se escribe
      // nada: ni la sesión ni ningún dato hijo. Preferimos que el modo se caiga solo
      // antes que generar una sesión (o hijos) sin la marca es_prueba.
      //
      // El modo NO se autopermite: solo activa escritura si supera la revalidación; en
      // flujo normal (modoPrueba=false) no hay llamada extra de red — cero overhead.
      sincronizarBloque: async (tareas) => {
        if (get().modoPrueba && !(await verificarPruebaValida())) {
          // Aislamiento roto (cookie no revalidada): desactivar modo y NO encolar ni
          // escribir. Nada de este bloque se persiste bajo una sesión sin marcar.
          set({ modoPrueba: false });
          return;
        }
        set((estado) => ({ colaSync: [...estado.colaSync, ...tareas] }));
        const fallaron = await procesarColaSync(get().colaSync);
        set({ colaSync: fallaron });
      },

      rellenarBloqueAlAzar: async (paso) => {
        if (!get().modoPrueba) return;
        const sessionId = get().sessionId;

        if (paso === "aspiracion") {
          const opciones: OpcionAspiracion[] = ["universidad", "tecnico", "trabajar", "no_se"];
          const opcion = opciones[Math.floor(Math.random() * opciones.length)];
          set({ aspiracion: { opcion, detalle: null } });
          if (sessionId) {
            await get().sincronizarBloque([
              {
                id: `aspiracion-${sessionId}`,
                tipo: "aspiracion",
                payload: { session_id: sessionId, opcion, detalle: null },
              },
            ]);
          }
          set({ paso: "gustos" });
          return;
        }

        if (paso === "gustos") {
          // La sincronización (sesión + gustos) la dispara el efecto de
          // page.tsx apenas respuestasGustos alcanza contextos.length: solo
          // hace falta completar las respuestas que falten y avanzar el paso.
          const faltantes = contextos.slice(get().respuestasGustos.length).map(
            (c): RespuestaGustos => ({ contextoId: c.id, valor: valorAlAzar(), ayudaAbierta: false, audioActivado: false })
          );
          set((estado) => ({ respuestasGustos: [...estado.respuestasGustos, ...faltantes] }));
          set({ paso: "actividades" });
          return;
        }

        if (paso === "actividades") {
          const respuestas: RespuestaActividad[] = actividades.map((a) => ({ actividadId: a.id, valor: valorAlAzar() }));
          set({ respuestasActividades: respuestas });
          if (sessionId) {
            await get().sincronizarBloque([
              {
                id: `actividades-${sessionId}`,
                tipo: "actividades",
                payload: respuestas.map((r) => ({ session_id: sessionId, actividad_id: r.actividadId, valor: r.valor })),
              },
            ]);
          }
          set({ paso: "asignaturas" });
          return;
        }

        if (paso === "asignaturas") {
          const respuestas: RespuestaAsignatura[] = asignaturas.map((a) => ({ asignaturaId: a.id, valor: valorAlAzar() }));
          set({ respuestasAsignaturas: respuestas });
          if (sessionId) {
            await get().sincronizarBloque([
              {
                id: `asignaturas-${sessionId}`,
                tipo: "asignaturas",
                payload: respuestas.map((r) => ({ session_id: sessionId, asignatura_id: r.asignaturaId, valor: r.valor })),
              },
            ]);
          }
          set({ paso: "resultadoParcial" });
          return;
        }

        if (paso === "cognitivo") {
          const respuestas: RespuestaCognitivo[] = [
            ...itemsMatrices.map((i): RespuestaCognitivo => ({ juego: "matrices", itemId: i.id, correcto: Math.random() > 0.3, nivel: 1, duracionMs: 4000, repetidoPorTimeout: false })),
            ...itemsSeries.map((i): RespuestaCognitivo => ({ juego: "series", itemId: i.id, correcto: Math.random() > 0.3, nivel: 1, duracionMs: 4000, repetidoPorTimeout: false })),
            ...itemsPliegues.map((i): RespuestaCognitivo => ({ juego: "pliegues", itemId: i.id, correcto: Math.random() > 0.3, nivel: 1, duracionMs: 4000, repetidoPorTimeout: false })),
            { juego: "secuencias", itemId: "seq-prueba", correcto: true, nivel: 5, duracionMs: 4000, repetidoPorTimeout: false },
          ];
          set({ respuestasCognitivo: respuestas });
          if (sessionId) {
            await get().sincronizarBloque([
              {
                id: `cognitivo-${sessionId}`,
                tipo: "cognitivo",
                payload: respuestas.map((r) => ({
                  session_id: sessionId,
                  juego: r.juego,
                  item_id: r.itemId,
                  correcto: r.correcto,
                  nivel: r.nivel,
                  duracion_ms: r.duracionMs,
                  repetido_timeout: r.repetidoPorTimeout,
                })),
              },
            ]);
          }
          set({ paso: "verbal" });
          return;
        }

        if (paso === "divergente") {
          const respuestas: RespuestaDivergente[] = OBJETOS_DIVERGENTE.map((o) => {
            const ideas = Array.from({ length: MIN_IDEAS_POR_OBJETO }, (_, i) => `idea de prueba ${i + 1}`);
            return { objeto: o.id, respuestasTexto: ideas, cantidad: ideas.length };
          });
          set({ respuestasDivergente: respuestas });
          if (sessionId) {
            await get().sincronizarBloque([
              {
                id: `divergente-${sessionId}`,
                tipo: "divergente",
                payload: respuestas.map((r) => ({
                  session_id: sessionId,
                  objeto: r.objeto,
                  respuestas_texto: r.respuestasTexto,
                  cantidad: r.cantidad,
                })),
              },
            ]);
          }
          set({ paso: "informe" });
          return;
        }
      },
    }),
    {
      name: "mirai-experiencia",
      // colaSync es transitorio (se reintenta en memoria durante la sesión de navegación,
      // no tiene sentido restaurarla tras recargar), así que no se persiste.
      partialize: (estado) => ({
        sessionId: estado.sessionId,
        paso: estado.paso,
        pausado: estado.pausado,
        audioActivado: estado.audioActivado,
        respuestasGustos: estado.respuestasGustos,
        respuestasCognitivo: estado.respuestasCognitivo,
        respuestasVerbal: estado.respuestasVerbal,
        respuestasDivergente: estado.respuestasDivergente,
        respuestasActividades: estado.respuestasActividades,
        respuestasAsignaturas: estado.respuestasAsignaturas,
        aspiracion: estado.aspiracion,
      }),
    }
  )
);
