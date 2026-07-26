import { clamp, figurasIguales, type FiguraOrigami } from "@/lib/logic/figuraOrigami";

export type AtributoRegla = "lados" | "rotacionDeg" | "tono" | "pliegues";

// Una regla describe cómo cambia UN atributo a lo largo de las columnas de la matriz.
// baseFila fija el valor de partida (columna 0) por fila, para que cada fila explore
// el mismo patrón desde un punto distinto — así la regla es verificable por cálculo directo.
export interface Regla {
  atributo: AtributoRegla;
  baseFila: [number, number, number];
  pasoColumna: number;
}

const ATRIBUTO_RANGO: Record<AtributoRegla, [number, number]> = {
  lados: [3, 8],
  rotacionDeg: [0, 315],
  tono: [0, 1],
  pliegues: [1, 3],
};

const PERTURBACION: Record<AtributoRegla, number> = {
  lados: 1,
  rotacionDeg: 90,
  tono: 0.3,
  pliegues: 1,
};

const FIGURA_BASE: FiguraOrigami = { lados: 4, rotacionDeg: 0, tono: 0.3, pliegues: 1 };

function resolverValor(atributo: AtributoRegla, crudo: number): number {
  const [min, max] = ATRIBUTO_RANGO[atributo];
  if (atributo === "rotacionDeg") return ((crudo % 360) + 360) % 360;
  return clamp(crudo, min, max);
}

export function calcularCelda(reglas: Regla[], fila: number, columna: number): FiguraOrigami {
  const figura = { ...FIGURA_BASE };
  for (const regla of reglas) {
    figura[regla.atributo] = resolverValor(
      regla.atributo,
      regla.baseFila[fila] + regla.pasoColumna * columna
    );
  }
  return figura;
}

function perturbar(figura: FiguraOrigami, atributo: AtributoRegla, signo: 1 | -1): FiguraOrigami {
  const valor = resolverValor(atributo, figura[atributo] + PERTURBACION[atributo] * signo);
  return { ...figura, [atributo]: valor };
}

// Genera un distractor alterando un solo atributo (los demás quedan fieles a la correcta),
// para que el error sea "creíble" dentro del mismo sistema de figuras, no ruido arbitrario.
function distractorPorAtributo(correcta: FiguraOrigami, atributo: AtributoRegla): FiguraOrigami {
  const candidato = perturbar(correcta, atributo, 1);
  return figurasIguales(candidato, correcta) ? perturbar(correcta, atributo, -1) : candidato;
}

const TODOS_LOS_ATRIBUTOS: AtributoRegla[] = ["lados", "rotacionDeg", "tono", "pliegues"];

function generarDistractores(correcta: FiguraOrigami, reglas: Regla[]): FiguraOrigami[] {
  const controlados = reglas.map((r) => r.atributo);
  const libres = TODOS_LOS_ATRIBUTOS.filter((a) => !controlados.includes(a));
  const distractores: FiguraOrigami[] = [];

  for (const atributo of [...controlados, ...libres]) {
    if (distractores.length >= 4) break;
    const candidato = distractorPorAtributo(correcta, atributo);
    if (!figurasIguales(candidato, correcta) && !distractores.some((d) => figurasIguales(d, candidato))) {
      distractores.push(candidato);
    }
  }
  return distractores;
}

// Orden determinístico por id (no Math.random: debe ser estable en SSR y reproducible en tests).
function ordenPorSemilla<T>(items: T[], semilla: string): T[] {
  const offset = semilla.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

export interface ItemMatriz {
  id: string;
  dificultad: "facil" | "media" | "dificil";
  reglas: Regla[];
  grilla: FiguraOrigami[]; // 9 celdas fila por fila; la celda 8 (fila2, col2) es la respuesta
  alternativas: FiguraOrigami[];
  indiceCorrecto: number;
}

export function generarItemMatriz(
  id: string,
  dificultad: ItemMatriz["dificultad"],
  reglas: Regla[]
): ItemMatriz {
  const grilla: FiguraOrigami[] = [];
  for (let fila = 0; fila < 3; fila++) {
    for (let columna = 0; columna < 3; columna++) {
      grilla.push(calcularCelda(reglas, fila, columna));
    }
  }

  const correcta = grilla[8];
  const distractores = generarDistractores(correcta, reglas);
  const alternativas = ordenPorSemilla([correcta, ...distractores], id);
  const indiceCorrecto = alternativas.findIndex((a) => figurasIguales(a, correcta));

  return { id, dificultad, reglas, grilla, alternativas, indiceCorrecto };
}
