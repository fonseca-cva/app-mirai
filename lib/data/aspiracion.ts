// BLOQUE A4 — ASPIRACIÓN POST 4° MEDIO (Nuevo, Tanda F — Pilar de Intereses)
// Una respuesta por sesión: qué le gustaría hacer después de 4° medio.
// `opcion` es la unión cerrada que coincide con el CHECK de la migración 00011.
//
// PESOS DE CONVERGENCIA — PENDIENTE REVALIDACIÓN METODOLÓGICA (revisión de Camilo):
// la aspiración es UNA decisión categórica, no una lista de ítems, así que su
// aporte al perfil integrado es un "nudge" direccional por opción (pesos que
// suman 1.0 por opción, mismo patrón que las asignaturas). Con peso 15% en el
// puntaje integrado, el efecto máximo por dimensión es 6 puntos: orienta sin
// dominar. "no_se" no declara dirección: aporta 0 a todas las dimensiones.

import type { DimensionCodigo } from "@/lib/data/contextos";

export type OpcionAspiracion = "universidad" | "tecnico" | "trabajar" | "no_se";

/** Pesos por dimensión para cada opción; los presentes suman 1.0 (validado en test). */
export const pesosAspiracion: Record<OpcionAspiracion, Partial<Record<DimensionCodigo, number>>> = {
  universidad: { cie: 0.4, soc: 0.3, cre: 0.3 },
  tecnico: { tec: 0.4, sal: 0.3, dat: 0.3 },
  trabajar: { ges: 0.4, tec: 0.3, nat: 0.3 },
  no_se: {},
};
