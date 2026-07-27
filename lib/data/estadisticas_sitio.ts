// Banco de cifras verificadas para el portal.
// Toda cifra visible en el sitio se renderiza exclusivamente desde este archivo.
// // NINGUNA cifra se agrega, redondea o reformula sin pasar por acá.
//
// Reglas (B2 del plan):
// 1. Solo cifras de este banco. Si no está aquí, no existe para el sitio.
// 2. Toda cifra lleva fuente y año en el mismo elemento visual.
// 3. Máximo 3 cifras flotantes en hero, 1 por transición de sección.
// 4. Animación: contador desde 0 o pliegue que se abre, una vez al entrar al viewport.
//    Respeta prefers-reduced-motion.
// 5. Móvil: las cifras del hero se reducen a 1.
//
// // Camilo entrega los valores verificados contra fuente. NADA se rellena por estimación.

import { z } from "zod";

// ---------------------------------------------------------------------------
// Tipo
// ---------------------------------------------------------------------------

export interface CifraSitio {
  /** Identificador único para referenciar desde componentes */
  id: string;
  /** Número a mostrar (entero o decimal) */
  cifra: number;
  /** Texto descriptivo, ej. "combinaciones carrera-institución" */
  texto: string;
  /** Formateo opcional: sufijo, unidad, etc. */
  formato?: {
    prefijo?: string;   // ej. "$", ">"
    sufijo?: string;    // ej. "%", " años", "+"
    decimales?: number; // 0 por defecto
  };
  /** Fuente y año visibles en pantalla */
  fuente: string;
  anio: number;
  /** URL opcional para verificación */
  urlFuente?: string;
  /** Fecha en que se verificó el dato */
  verificadoEn: string; // ISO date string
  /** Ubicación sugerida en el sitio: hero | transicion-{id-seccion} */
  ubicacion: "hero" | `transicion-${string}`;
  /** Prioridad de visualización (1 = más importante). Hero muestra hasta 3. */
  prioridad: number;
}

// ---------------------------------------------------------------------------
// Validación Zod
// ---------------------------------------------------------------------------

export const CifraSitioSchema = z.object({
  id: z.string().min(1),
  cifra: z.number().finite(),
  texto: z.string().min(1),
  formato: z
    .object({
      prefijo: z.string().optional(),
      sufijo: z.string().optional(),
      decimales: z.number().int().min(0).optional(),
    })
    .optional(),
  fuente: z.string().min(1),
  anio: z.number().int().min(1900),
  urlFuente: z.string().url().optional(),
  verificadoEn: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  ubicacion: z.string(),
  prioridad: z.number().int().min(1),
});

export const BancoCifrasSchema = z.array(CifraSitioSchema);

// ---------------------------------------------------------------------------
// Banco — vacío hasta que Camilo entregue datos verificados
// ---------------------------------------------------------------------------

export const bancoCifras: CifraSitio[] = [];

// ---------------------------------------------------------------------------
// Helper: obtener cifras para una ubicación, ordenadas por prioridad
// ---------------------------------------------------------------------------

export function cifrasPorUbicacion(
  ubicacion: "hero" | `transicion-${string}`,
  max: number = 3,
): CifraSitio[] {
  return bancoCifras
    .filter((c) => c.ubicacion === ubicacion)
    .sort((a, b) => a.prioridad - b.prioridad)
    .slice(0, max);
}

/** Cifras candidatas que Camilo debe verificar antes de agregar al banco:
 *    - Inscritos PAES último proceso (DEMRE)
 *    - Deserción/retención 1er año SIES (rango)
 *    - 1.740 combinaciones carrera-institución (mifuturo.cl)
 *    - Visitas anuales mifuturo.cl
 *    - 24 lugares / 3 juegos / 25 minutos (producto propio)
 */
