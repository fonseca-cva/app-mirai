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
  creado_en?: string;
  user_id?: string;
}

export interface RespuestaCognitivoRow {
  id?: number;
  session_id: string;
  juego: "matrices" | "rotacion" | "secuencias";
  item_id: string;
  correcto: boolean;
  nivel: number;
  duracion_ms: number;
  creado_en?: string;
  user_id?: string;
}

export interface RespuestaVerbalRow {
  id?: number;
  session_id: string;
  tarea: "comprension" | "argumentacion";
  texto: string;
  evaluacion_json: EvaluacionVerbal | null;
  estado: "pendiente" | "evaluado" | "error";
  creado_en?: string;
  evaluado_en?: string | null;
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
  areasCarreras: string[];
  generado_en: string;
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
