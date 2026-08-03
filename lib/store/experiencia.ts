import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Respuesta as RespuestaGustos } from "@/lib/logic/puntaje";
import type { RespuestaActividad, RespuestaAsignatura, Aspiracion } from "@/lib/logic/puntaje";
import type { OpcionAspiracion } from "@/lib/data/aspiracion";
import { obtenerOCrearSessionId } from "@/lib/store/sesion";
import { procesarColaSync, type TareaSync } from "@/lib/supabase/sync";

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
  tarea: "comprension" | "argumentacion" | "expresion";
  texto: string;
  evaluacion: unknown | null;
  estado: "pendiente" | "evaluado" | "error";
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
}

export const useExperienciaStore = create<EstadoExperiencia>()(
  persist(
    (set, get) => ({
      sessionId: null,
      paso: "intro",
      pausado: false,
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

      sincronizarBloque: async (tareas) => {
        set((estado) => ({ colaSync: [...estado.colaSync, ...tareas] }));
        const fallaron = await procesarColaSync(get().colaSync);
        set({ colaSync: fallaron });
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
