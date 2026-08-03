// Reglas de matching v2 (Tanda E): recomienda carreras curadas (lib/data/carreras.ts)
// en vez de las 10 áreas provisorias de v1. Función pura, sin side effects, testeable.
//
// Componentes por carrera:
//   - Intereses: 8 dimensiones ponderadas por el mapeo de área de la carrera
//     (principal con peso implícito 1 - Σsecundarias; secundarias con su peso).
//   - Capacidades: perfil cognitivo de la carrera (5 pesos, suma 1.0) × puntajes
//     del estudiante. 'numerico' usa el puntaje medido de 'patrones': la batería
//     actual no separa un constructo numérico (reparto numerico/patrones del
//     Tanda A es solo de datos, PENDIENTE REVALIDACIÓN).
//
// PENDIENTE FIRMA METODOLÓGICA: el peso compuesto (55% intereses / 45% capacidades)
// es provisorio y se calibrará con datos reales en Fase 3.

import type { PuntajeDimension } from "@/lib/logic/puntaje";
import type { PuntajesCognitivo } from "@/lib/logic/puntajeCognitivo";
import { carreras, type Carrera } from "@/lib/data/carreras";
import type { DimensionCodigo } from "@/lib/data/contextos";

const PESO_INTERESES_DEFECTO = 0.55;
const PESO_CAPACIDADES_DEFECTO = 0.45;

function puntajeDimension(codigo: DimensionCodigo, puntajes: PuntajeDimension[]): number {
  return puntajes.find((p) => p.dimension === codigo)?.puntaje ?? 0;
}

// Ajuste por intereses: suma ponderada de las dimensiones del área de la carrera.
// El peso de la dimensión principal es implícito: 1 - Σ(secundarias). Los pesos
// del área suman 1.0 (validado en lib/data/carreras.test.ts).
function pesoIntereses(carrera: Carrera, puntajesDimension: PuntajeDimension[]): number {
  const secundarias = carrera.area.secundarias ?? [];
  let pesoPrincipal = 1;
  for (const s of secundarias) pesoPrincipal -= s.peso;

  let total = pesoPrincipal * puntajeDimension(carrera.area.principal, puntajesDimension);
  for (const s of secundarias) {
    total += s.peso * puntajeDimension(s.codigo, puntajesDimension);
  }
  return Math.round(total);
}

// Ajuste por capacidades: perfil cognitivo de la carrera (5 pesos, suma 1.0) por
// los puntajes medidos del estudiante. 'numerico' comparte el puntaje de 'patrones'
// (la batería no lo separa aún; ver cabecera del módulo).
function pesoCapacidades(carrera: Carrera, puntajesCognitivo: PuntajesCognitivo): number {
  const { patrones, numerico, espacial, memoria, comunicacion } = carrera.perfilCognitivo;
  const total =
    (patrones ?? 0) * puntajesCognitivo.patrones +
    (numerico ?? 0) * puntajesCognitivo.patrones +
    (espacial ?? 0) * puntajesCognitivo.espacial +
    (memoria ?? 0) * puntajesCognitivo.memoria +
    (comunicacion ?? 0) * puntajesCognitivo.comunicacion;
  return Math.round(total);
}

export interface CarreraRecomendada {
  carrera: Carrera;
  puntajeCompuesto: number; // 0-100
  pesoIntereses: number; // 0-100
  pesoCapacidades: number; // 0-100
}

export interface OpcionesMatching {
  limite?: number; // cuántas carreras devolver (default 3)
  pesoIntereses?: number; // 0-1, default 0.55 (calibración Fase 3)
}

// Matching v2: puntaje compuesto por carrera (55% intereses / 45% capacidades por
// defecto), ordenado descendente con desempate alfabético determinista.
export function recomendarCarreras(
  puntajesDimension: PuntajeDimension[],
  puntajesCognitivo: PuntajesCognitivo,
  opciones: OpcionesMatching = {}
): CarreraRecomendada[] {
  const limite = opciones.limite ?? 3;
  const pesoInteresesGlobal = opciones.pesoIntereses ?? PESO_INTERESES_DEFECTO;
  const pesoCapacidadesGlobal = 1 - pesoInteresesGlobal;

  const resultado: CarreraRecomendada[] = carreras.map((carrera) => {
    const pi = pesoIntereses(carrera, puntajesDimension);
    const pc = pesoCapacidades(carrera, puntajesCognitivo);
    return {
      carrera,
      pesoIntereses: pi,
      pesoCapacidades: pc,
      puntajeCompuesto: Math.round(pi * pesoInteresesGlobal + pc * pesoCapacidadesGlobal),
    };
  });

  resultado.sort((a, b) => {
    if (b.puntajeCompuesto !== a.puntajeCompuesto) return b.puntajeCompuesto - a.puntajeCompuesto;
    return a.carrera.nombre.localeCompare(b.carrera.nombre, "es");
  });

  return resultado.slice(0, limite);
}
