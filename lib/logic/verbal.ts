// Control de calidad del Bloque Verbal — funciones PURAS (validez).
// Plan de Camilo, puntos 1-7: rechazo de copia literal del estímulo antes de
// evaluar. Sin efectos: reciben strings, devuelven números/booleanos.
// Testeada en lib/logic/verbal.test.ts.

import { TEXTOS_COMPRENSION, DILEMAS_ARGUMENTACION, CONSIGNAS_EXPRESION } from "@/lib/config/rubricas";

export const CARACTERES_MINIMOS = 120; // requisito de entrada vigente (cliente y servidor)
export const UMBRAL_SOLAPAMIENTO = 0.6; // fracción de n-gramas de la respuesta presentes en el estímulo

// Minúsculas, sin puntuación, espacios colapsados. Base de la comparación.
export function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .replace(/[^a-záéíóúüñ0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// N-gramas de palabras (n=3 por defecto). Devuelve Set para intersección O(1).
export function nGramas(texto: string, n = 3): Set<string> {
  const norm = normalizarTexto(texto);
  if (norm.length === 0) return new Set();
  const palabras = norm.split(" ");
  const set = new Set<string>();
  for (let i = 0; i + n <= palabras.length; i++) {
    set.add(palabras.slice(i, i + n).join(" "));
  }
  return set;
}

// Fracción de n-gramas de la RESPUESTA que aparecen en el ESTÍMULO.
// 0 = nada en común; 1 = respuesta construida íntegramente con frases del estímulo.
export function solapamientoLiteral(respuesta: string, estimulo: string): number {
  const gramasRespuesta = nGramas(respuesta);
  const gramasEstimulo = nGramas(estimulo);
  if (gramasRespuesta.size === 0) return 0;
  let coincidencias = 0;
  gramasRespuesta.forEach((g) => {
    if (gramasEstimulo.has(g)) coincidencias++;
  });
  return coincidencias / gramasRespuesta.size;
}

// ¿La respuesta es copia literal del estímulo (no explicación propia)?
// Umbral documentado: UMBRAL_SOLAPAMIENTO (0.6). La decisión la toma el
// servidor ANTES de llamar al modelo; no se puntúa y se trata como
// no pertinente con razón "copia_literal".
export function esCopiaLiteral(respuesta: string, estimulo: string): boolean {
  return solapamientoLiteral(respuesta, estimulo) >= UMBRAL_SOLAPAMIENTO;
}

export type TareaVerbal = "comprension" | "argumentacion" | "expresion";

export interface IndicesEstimuloVerbal {
  indiceTexto: number;
  indiceDilema: number;
  indiceExpresion: number;
}

// Índices deterministas de estímulo (fix 2026-09-09, bug reportado por Camilo): el
// estímulo que el alumno VE (BloqueVerbal.tsx) y el que el servidor EVALÚA
// (/api/evaluar y /api/debug/evaluar) DEBEN salir de la MISMA fórmula. El bug fue
// que /api/debug/evaluar la ignoraba por completo y evaluaba siempre contra el
// índice [0] mientras el alumno veía otro estímulo — invisible porque nada
// garantizaba la correspondencia. Centralizada acá: cliente y ambas rutas server
// llaman a esta misma función, así que no pueden volver a divergir.
export function indicesEstimuloVerbal(sessionId: string | null | undefined): IndicesEstimuloVerbal {
  if (!sessionId) return { indiceTexto: 0, indiceDilema: 0, indiceExpresion: 0 };
  return {
    indiceTexto: sessionId.charCodeAt(0) % TEXTOS_COMPRENSION.length,
    indiceDilema: sessionId.charCodeAt(1) % DILEMAS_ARGUMENTACION.length,
    indiceExpresion: sessionId.charCodeAt(2) % CONSIGNAS_EXPRESION.length,
  };
}

// Estímulo correspondiente a la tarea dado un juego de índices (mismo default `?? 0`
// que ya usaba /api/evaluar, para no romper llamadas que aún no mandan índice).
export function estimuloVerbalDe(tarea: TareaVerbal, indices: Partial<IndicesEstimuloVerbal>): string {
  if (tarea === "comprension") return TEXTOS_COMPRENSION[indices.indiceTexto ?? 0];
  if (tarea === "argumentacion") return DILEMAS_ARGUMENTACION[indices.indiceDilema ?? 0];
  return CONSIGNAS_EXPRESION[indices.indiceExpresion ?? 0];
}
