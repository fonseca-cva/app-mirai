// Tipos que reflejan el esquema de Supabase (migraciones 00001-00004).
// Los tipos compuestos se usan para insert/select tipados desde el cliente.
// Las políticas RLS garantizan que cada sesión solo ve sus propios datos, vía
// auth.uid() = user_id (Anonymous Auth, migración 00003). user_id es opcional
// en estos tipos porque la columna tiene DEFAULT auth.uid(): el cliente no
// necesita enviarlo en los inserts.

export interface SesionRow {
  id: string;
  creada_en: string;
  edad: string | null;
  curso: string | null;
  dispositivo: string | null;
  user_id?: string;
}

export interface RespuestaGustoRow {
  id?: number;
  session_id: string;
  contexto_id: string;
  valor: 0 | 1 | 2;
  latencia_ms: number | null;
  ayuda_abierta: boolean;
  audio_activado: boolean;
  creado_en?: string;
  user_id?: string;
}

export interface RespuestaCognitivoRow {
  id?: number;
  session_id: string;
  juego: "matrices" | "series" | "pliegues" | "secuencias";
  item_id: string;
  correcto: boolean;
  nivel: number;
  duracion_ms: number;
  repetido_timeout: boolean;
  creado_en?: string;
  user_id?: string;
}

export interface RespuestaVerbalRow {
  id?: number;
  session_id: string;
  tarea: "comprension" | "argumentacion" | "expresion";
  texto: string;
  evaluacion_json: EvaluacionVerbal | null;
  estado: "pendiente" | "evaluado" | "error";
  creado_en?: string;
  evaluado_en?: string | null;
  user_id?: string;
}

// Tabla respuestas_asignaturas (migración 00011) — Bloque A3 del pilar de intereses.
// user_id es opcional porque la columna tiene DEFAULT auth.uid(): el cliente no lo envía.
export interface RespuestaAsignaturaRow {
  id?: number;
  session_id: string;
  asignatura_id: string;
  valor: 0 | 1 | 2;
  creado_en?: string;
  user_id?: string;
}

// Tabla aspiraciones (migración 00011) — Bloque A4 del pilar de intereses.
// Una fila por sesión (UNIQUE session_id): se hace upsert por session_id.
export interface AspiracionRow {
  id?: number;
  session_id: string;
  opcion: "universidad" | "tecnico" | "trabajar" | "no_se";
  detalle: string | null;
  creado_en?: string;
  user_id?: string;
}

// Tabla respuestas_actividades (migración 00010) — Bloque A2 del pilar de intereses.
// user_id es opcional porque la columna tiene DEFAULT auth.uid(): el cliente no lo envía.
export interface RespuestaActividadRow {
  id?: number;
  session_id: string;
  actividad_id: string;
  valor: 0 | 1 | 2;
  creado_en?: string;
  user_id?: string;
}

// Tabla respuestas_divergente (migración 00008) — bloque EXPLORATORIO (NO REPORTAR en v1).
// user_id es opcional porque la columna tiene DEFAULT auth.uid(): el cliente no lo envía.
export interface RespuestaDivergenteRow {
  id?: number;
  session_id: string;
  objeto: string;
  respuestas_texto: string[];
  cantidad: number;
  creado_en?: string;
  user_id?: string;
}

export interface EvaluacionVerbal {
  nivel: "literal" | "inferencial" | "critico";
  puntaje: number; // 1-5
  fortaleza: string;
  area_mejora: string;
}

export interface ResultadoRow {
  id?: number;
  session_id: string;
  perfil_json: PerfilResultado;
  generado_en?: string;
  user_id?: string;
}

export interface PerfilResultado {
  dimensionTop3: Array<{ codigo: string; etiqueta: string; puntaje: number }>;
  capacidades: {
    patrones: number; // 0-100
    espacial: number; // 0-100
    memoria: number; // 0-100
    comunicacion: number; // 0-100 (desde verbal)
  };
  carrerasRecomendadas: string[]; // ids de carreras curadas (lib/data/carreras.ts)
  generado_en: string;
}

export interface TutorialEstadoRow {
  id?: number;
  session_id: string;
  juego: "matrices" | "series" | "pliegues" | "secuencias";
  tutorial_visto: boolean;
  practica_dominada: boolean | null;
  demo_loops_vistos: number;
  uso_atras: number;
  uso_saltar_tutorial: boolean;
  creado_en?: string;
  user_id?: string;
}

export interface CorreoInformeRow {
  id?: number;
  session_id: string;
  email: string;
  estado?: "pendiente" | "enviado" | "error";
  creado_en?: string;
  enviado_en?: string | null;
  user_id?: string;
}
