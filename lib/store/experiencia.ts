import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Respuesta as RespuestaGustos } from "@/lib/logic/puntaje";
import { obtenerOCrearSessionId } from "@/lib/store/sesion";

export type PasoExperiencia = "intro" | "gustos" | "cognitivo" | "verbal" | "informe";

export interface RespuestaCognitivo {
  juego: "matrices" | "rotacion" | "secuencias";
  itemId: string;
  correcto: boolean;
  nivel: number;
  duracionMs: number;
}

export interface RespuestaVerbal {
  tarea: "comprension" | "argumentacion";
  texto: string;
  evaluacion: unknown | null;
  estado: "pendiente" | "evaluado" | "error";
}

// Operación de sync a Supabase encolada para reintento (p. ej. si la conexión falla al cerrar un bloque).
export interface TareaSync {
  id: string;
  tabla: string;
  payload: Record<string, unknown>;
}

interface EstadoExperiencia {
  sessionId: string | null;
  paso: PasoExperiencia;
  pausado: boolean;
  respuestasGustos: RespuestaGustos[];
  respuestasCognitivo: RespuestaCognitivo[];
  respuestasVerbal: RespuestaVerbal[];
  colaSync: TareaSync[];

  inicializarSesion: () => void;
  irAPaso: (paso: PasoExperiencia) => void;
  pausar: () => void;
  reanudar: () => void;
  agregarRespuestaGustos: (respuesta: RespuestaGustos) => void;
  agregarRespuestaCognitivo: (respuesta: RespuestaCognitivo) => void;
  agregarRespuestaVerbal: (respuesta: RespuestaVerbal) => void;
  encolarSync: (tarea: TareaSync) => void;
  resolverSync: (id: string) => void;
}

export const useExperienciaStore = create<EstadoExperiencia>()(
  persist(
    (set) => ({
      sessionId: null,
      paso: "intro",
      pausado: false,
      respuestasGustos: [],
      respuestasCognitivo: [],
      respuestasVerbal: [],
      colaSync: [],

      inicializarSesion: () => set({ sessionId: obtenerOCrearSessionId() }),
      irAPaso: (paso) => set({ paso, pausado: false }),
      pausar: () => set({ pausado: true }),
      reanudar: () => set({ pausado: false }),

      agregarRespuestaGustos: (respuesta) =>
        set((estado) => ({ respuestasGustos: [...estado.respuestasGustos, respuesta] })),
      agregarRespuestaCognitivo: (respuesta) =>
        set((estado) => ({ respuestasCognitivo: [...estado.respuestasCognitivo, respuesta] })),
      agregarRespuestaVerbal: (respuesta) =>
        set((estado) => ({ respuestasVerbal: [...estado.respuestasVerbal, respuesta] })),

      encolarSync: (tarea) => set((estado) => ({ colaSync: [...estado.colaSync, tarea] })),
      resolverSync: (id) =>
        set((estado) => ({ colaSync: estado.colaSync.filter((t) => t.id !== id) })),
    }),
    {
      name: "mirai-experiencia",
      // colaSync es transitorio (se reintenta en memoria durante la sesión de navegación,
      // no tiene sentido restaurarla tras recargar), así que no se persiste.
      partialize: (estado) => ({
        sessionId: estado.sessionId,
        paso: estado.paso,
        pausado: estado.pausado,
        respuestasGustos: estado.respuestasGustos,
        respuestasCognitivo: estado.respuestasCognitivo,
        respuestasVerbal: estado.respuestasVerbal,
      }),
    }
  )
);
