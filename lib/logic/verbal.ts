// Control de calidad del Bloque Verbal — funciones PURAS (validez).
// Plan de Camilo, puntos 1-7: rechazo de copia literal del estímulo antes de
// evaluar. Sin efectos: reciben strings, devuelven números/booleanos.
// Testeada en lib/logic/verbal.test.ts.

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
