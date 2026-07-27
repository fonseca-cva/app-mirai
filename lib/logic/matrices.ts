import {
  clamp,
  figurasColisionanVisualmente,
  figurasIguales,
  type FiguraOrigami,
} from "@/lib/logic/figuraOrigami";

export type AtributoRegla = "lados" | "rotacionDeg" | "relleno" | "pliegues";

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
  relleno: [0, 1],
  pliegues: [1, 3],
};

const PERTURBACION: Record<AtributoRegla, number> = {
  lados: 1,
  rotacionDeg: 90,
  relleno: 1,
  pliegues: 1,
};

const FIGURA_BASE: FiguraOrigami = { lados: 4, rotacionDeg: 0, relleno: 0, pliegues: 1 };

function resolverValor(atributo: AtributoRegla, crudo: number): number {
  const [min, max] = ATRIBUTO_RANGO[atributo];
  if (atributo === "rotacionDeg") return ((crudo % 360) + 360) % 360;
  // relleno es binario (sólido/contorno): envuelve mod 2 en vez de saturar, para que
  // pueda alternar como regla (p.ej. tablero de ajedrez) igual que rotacionDeg envuelve mod 360.
  if (atributo === "relleno") return ((crudo % 2) + 2) % 2;
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

// Offsets candidatos para un distractor de rotación, en orden de preferencia. Cubre todas las
// simetrías posibles de un polígono de 3-8 lados (120°, 90°, 72°, 60°, ~51.4°, 45°): para
// cualquiera de ellas, al menos uno de estos offsets NO es congruente mod esa simetría, así
// que el distractor resultante nunca es "el mismo polígono rotado a una orientación equivalente"
// (el bug que producía p.ej. dos cuadrados a 90° de diferencia = geométricamente idénticos).
const OFFSETS_ROTACION_SEGUROS = [90, -90, 45, -45, 135, -135, 30, -30];

function perturbarRotacion(correcta: FiguraOrigami): FiguraOrigami {
  for (const offset of OFFSETS_ROTACION_SEGUROS) {
    const candidato = { ...correcta, rotacionDeg: resolverValor("rotacionDeg", correcta.rotacionDeg + offset) };
    if (!figurasColisionanVisualmente(candidato, correcta)) return candidato;
  }
  throw new Error(`No se encontró un ángulo de distractor seguro para lados=${correcta.lados}`);
}

// Genera un distractor alterando un solo atributo (los demás quedan fieles a la correcta),
// para que el error sea "creíble" dentro del mismo sistema de figuras, no ruido arbitrario.
function distractorPorAtributo(correcta: FiguraOrigami, atributo: AtributoRegla): FiguraOrigami {
  if (atributo === "rotacionDeg") return perturbarRotacion(correcta);
  const candidato = perturbar(correcta, atributo, 1);
  return figurasIguales(candidato, correcta) ? perturbar(correcta, atributo, -1) : candidato;
}

const TODOS_LOS_ATRIBUTOS: AtributoRegla[] = ["lados", "rotacionDeg", "relleno", "pliegues"];

function generarDistractores(correcta: FiguraOrigami, reglas: Regla[]): FiguraOrigami[] {
  const controlados = reglas.map((r) => r.atributo);
  const libres = TODOS_LOS_ATRIBUTOS.filter((a) => !controlados.includes(a));
  const distractores: FiguraOrigami[] = [];

  for (const atributo of [...controlados, ...libres]) {
    if (distractores.length >= 4) break;
    const candidato = distractorPorAtributo(correcta, atributo);
    const colisiona =
      figurasColisionanVisualmente(candidato, correcta) ||
      distractores.some((d) => figurasColisionanVisualmente(d, candidato));
    if (!colisiona) {
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
