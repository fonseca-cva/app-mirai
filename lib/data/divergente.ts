// Bloque exploratorio de Pensamiento Divergente (usos alternativos) — Tanda D.
// EXPLORATORIO — NO REPORTAR: se recolecta en respuestas_divergente (migración 00008),
// no alimenta informe ni matching en v1 (ver COMMENT de la tabla en la migración).
// Diseño: 3 objetos cotidianos; el usuario escribe ideas de usos alternativos,
// una por línea. Sin puntaje: solo cantidad y contenido para el piloto.

export interface ObjetoDivergente {
  id: string;
  nombre: string;
  consigna: string;
}

// Mínimo de ideas para avanzar al siguiente objeto: alcanzable en un minuto,
// pero exige generar alternativas reales (no una sola ocurrencia).
export const MIN_IDEAS_POR_OBJETO = 3;

export const OBJETOS_DIVERGENTE: ObjetoDivergente[] = [
  {
    id: "div-clip",
    nombre: "Clip de oficina",
    consigna: "¿Para qué más sirve un clip de oficina, además de sujetar papeles?",
  },
  {
    id: "div-ladrillo",
    nombre: "Ladrillo",
    consigna: "¿Para qué más sirve un ladrillo, además de construir muros?",
  },
  {
    id: "div-taza",
    nombre: "Taza",
    consigna: "¿Para qué más sirve una taza, además de tomar líquidos?",
  },
];

// Normaliza el texto del usuario: cada línea no vacía = una idea.
// Es el criterio único para contar ideas y para armar respuestas_texto[].
export function limpiarIdeas(texto: string): string[] {
  return texto
    .split(/\r?\n/)
    .map((linea) => linea.trim())
    .filter((linea) => linea.length > 0);
}

export function contarIdeas(texto: string): number {
  return limpiarIdeas(texto).length;
}
