// Reglas de matching v1: función pura que recomienda áreas de carreras basada en
// intereses (gustos) y capacidades (cognitivo). Sin side effects, testeable.
// // PENDIENTE FIRMA METODOLÓGICA: pesos (55% intereses / 45% capacidades) y mapeos
// son provisorios. Se calibrarán con datos reales en Fase 3.

import type { PuntajeDimension } from "@/lib/logic/puntaje";
import type { PuntajesCognitivo } from "@/lib/logic/puntajeCognitivo";
import { areasCarreras, type AreaCarrera } from "@/lib/data/areas_carreras";
import { dimensiones, type DimensionCodigo } from "@/lib/data/contextos";

// Puntaje normalizado de una dimensión (0-100) desde intereses.
function dimensionScore(codigo: DimensionCodigo, puntajes: PuntajeDimension[]): number {
  return puntajes.find((p) => p.dimension === codigo)?.puntaje ?? 0;
}

// Peso por área: suma ponderada de sus dimensiones desde intereses.
function pesoIntereses(area: AreaCarrera, puntajesDimension: PuntajeDimension[]): number {
  if (area.dimensiones.length === 0) return 0;
  const suma = area.dimensiones.reduce((acc, dim) => acc + dimensionScore(dim, puntajesDimension), 0);
  return suma / area.dimensiones.length;
}

// Peso por capacidades: mapeo área → capacidad relevante.
// // PENDIENTE FIRMA METODOLÓGICA: este mapeo es provisorio.
const CAPACIDAD_POR_AREA: Record<string, keyof PuntajesCognitivo> = {
  "construccion-obra": "espacial",
  "ciencia-laboratorio": "patrones",
  "arte-diseno": "espacial",
  "educacion-social": "comunicacion",
  "salud-bienestar": "memoria",
  "gestion-empresa": "memoria",
  "datos-tecnologia": "patrones",
  "naturaleza-medioambiente": "espacial",
  "ingenieria-tecnica": "patrones",
  "servicio-atencion": "comunicacion",
} as const;

function pesoCapacidades(area: AreaCarrera, puntajesCognitivo: PuntajesCognitivo): number {
  const capacidad = CAPACIDAD_POR_AREA[area.id];
  if (!capacidad) return 0;
  return puntajesCognitivo[capacidad];
}

export interface AreaRecomendada {
  area: AreaCarrera;
  puntajeCompuesto: number; // 0-100
  pesoIntereses: number;
  pesoCapacidades: number;
}

// Matching v1: 55% intereses / 45% capacidades.
// Devuelve las 3 áreas mejor rankeadas con puntaje compuesto.
export function recomendarAreas(
  puntajesDimension: PuntajeDimension[],
  puntajesCognitivo: PuntajesCognitivo
): AreaRecomendada[] {
  const PESO_INTERESES = 0.55;
  const PESO_CAPACIDADES = 0.45;

  const puntajes: AreaRecomendada[] = areasCarreras.map((area) => {
    const pi = pesoIntereses(area, puntajesDimension);
    const pc = pesoCapacidades(area, puntajesCognitivo);
    return {
      area,
      pesoIntereses: pi,
      pesoCapacidades: pc,
      puntajeCompuesto: Math.round(pi * PESO_INTERESES + pc * PESO_CAPACIDADES),
    };
  });

  puntajes.sort((a, b) => b.puntajeCompuesto - a.puntajeCompuesto);
  return puntajes.slice(0, 3);
}

// Perfil completo: top 3 áreas + puntajes de cada bloque para el informe.
export interface PerfilCompleto {
  top3Dimensiones: PuntajeDimension[];
  puntajesCognitivo: PuntajesCognitivo;
  areasRecomendadas: AreaRecomendada[];
  puntajeVerbal: number | null; // null si no se completó la evaluación verbal
}

export function generarPerfil(
  puntajesDimension: PuntajeDimension[],
  puntajesCognitivo: PuntajesCognitivo,
  puntajeVerbal: number | null
): PerfilCompleto {
  return {
    top3Dimensiones: puntajesDimension.slice(0, 3),
    puntajesCognitivo,
    areasRecomendadas: recomendarAreas(puntajesDimension, puntajesCognitivo),
    puntajeVerbal,
  };
}
