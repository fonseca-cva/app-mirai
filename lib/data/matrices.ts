// CONTENIDO PROVISORIO — pendiente de firma metodológica.
// 12 ítems de matrices 3x3 (sección 3.1 de la spec). Rampa de dificultad:
// 4 fáciles (1 regla), 5 medias (2 reglas), 3 difíciles (3 reglas).
import { generarItemMatriz, type ItemMatriz, type Regla } from "@/lib/logic/matrices";

interface DefinicionItem {
  id: string;
  dificultad: ItemMatriz["dificultad"];
  reglas: Regla[];
}

const DEFINICIONES: DefinicionItem[] = [
  // -- Fáciles: 1 regla --
  {
    id: "mat-01",
    dificultad: "facil",
    reglas: [{ atributo: "rotacionDeg", baseFila: [0, 45, 90], pasoColumna: 45 }],
  },
  {
    id: "mat-02",
    dificultad: "facil",
    reglas: [{ atributo: "pliegues", baseFila: [1, 1, 1], pasoColumna: 1 }],
  },
  {
    id: "mat-03",
    dificultad: "facil",
    // Tablero de ajedrez: valor(fila,columna) = (fila + columna) mod 2 → alterna sólido/contorno.
    reglas: [{ atributo: "relleno", baseFila: [0, 1, 0], pasoColumna: 1 }],
  },
  {
    id: "mat-04",
    dificultad: "facil",
    reglas: [{ atributo: "lados", baseFila: [3, 4, 5], pasoColumna: 1 }],
  },

  // -- Medias: 2 reglas --
  {
    id: "mat-05",
    dificultad: "media",
    reglas: [
      { atributo: "rotacionDeg", baseFila: [0, 90, 180], pasoColumna: 45 },
      { atributo: "pliegues", baseFila: [1, 1, 2], pasoColumna: 1 },
    ],
  },
  {
    id: "mat-06",
    dificultad: "media",
    reglas: [
      { atributo: "rotacionDeg", baseFila: [45, 0, 315], pasoColumna: 45 },
      { atributo: "relleno", baseFila: [0, 1, 0], pasoColumna: 1 },
    ],
  },
  {
    id: "mat-07",
    dificultad: "media",
    reglas: [
      { atributo: "pliegues", baseFila: [1, 2, 1], pasoColumna: 1 },
      { atributo: "relleno", baseFila: [1, 0, 1], pasoColumna: 1 },
    ],
  },
  {
    id: "mat-08",
    dificultad: "media",
    reglas: [
      { atributo: "lados", baseFila: [3, 3, 4], pasoColumna: 1 },
      { atributo: "rotacionDeg", baseFila: [0, 45, 90], pasoColumna: 90 },
    ],
  },
  {
    id: "mat-09",
    dificultad: "media",
    reglas: [
      { atributo: "lados", baseFila: [4, 5, 3], pasoColumna: 1 },
      { atributo: "pliegues", baseFila: [1, 1, 1], pasoColumna: 1 },
    ],
  },

  // -- Difíciles: 3 reglas --
  {
    id: "mat-10",
    dificultad: "dificil",
    reglas: [
      { atributo: "rotacionDeg", baseFila: [0, 90, 180], pasoColumna: 45 },
      { atributo: "pliegues", baseFila: [1, 1, 2], pasoColumna: 1 },
      { atributo: "relleno", baseFila: [0, 1, 0], pasoColumna: 1 },
    ],
  },
  {
    id: "mat-11",
    dificultad: "dificil",
    reglas: [
      { atributo: "rotacionDeg", baseFila: [45, 135, 225], pasoColumna: 45 },
      { atributo: "lados", baseFila: [3, 4, 3], pasoColumna: 1 },
      { atributo: "relleno", baseFila: [1, 0, 1], pasoColumna: 1 },
    ],
  },
  {
    id: "mat-12",
    dificultad: "dificil",
    reglas: [
      { atributo: "lados", baseFila: [3, 4, 5], pasoColumna: 1 },
      { atributo: "pliegues", baseFila: [1, 2, 1], pasoColumna: 1 },
      { atributo: "rotacionDeg", baseFila: [0, 45, 90], pasoColumna: 45 },
    ],
  },
];

export const itemsMatrices: ItemMatriz[] = DEFINICIONES.map((def) =>
  generarItemMatriz(def.id, def.dificultad, def.reglas)
);

// Ítems de práctica: NO se generan (a diferencia de itemsMatrices arriba). Se escriben a mano,
// valor por valor, para que sean auditables por inspección directa e inmunes a cualquier bug
// futuro del generador. Documentados en items_matrices_auditoria.md.

// Práctica 1: regla más obvia posible — tipo de figura (número de lados) sube de 3 a 5,
// igual en las 3 filas. Respuesta correcta: pentágono (lados: 5), sólido, sin rotar, 1 capa.
export const itemPracticaMatrices: ItemMatriz = {
  id: "mat-practica",
  dificultad: "facil",
  reglas: [{ atributo: "lados", baseFila: [3, 3, 3], pasoColumna: 1 }],
  grilla: [
    { lados: 3, rotacionDeg: 0, relleno: 0, pliegues: 1 },
    { lados: 4, rotacionDeg: 0, relleno: 0, pliegues: 1 },
    { lados: 5, rotacionDeg: 0, relleno: 0, pliegues: 1 },
    { lados: 3, rotacionDeg: 0, relleno: 0, pliegues: 1 },
    { lados: 4, rotacionDeg: 0, relleno: 0, pliegues: 1 },
    { lados: 5, rotacionDeg: 0, relleno: 0, pliegues: 1 },
    { lados: 3, rotacionDeg: 0, relleno: 0, pliegues: 1 },
    { lados: 4, rotacionDeg: 0, relleno: 0, pliegues: 1 },
    { lados: 5, rotacionDeg: 0, relleno: 0, pliegues: 1 },
  ],
  alternativas: [
    { lados: 6, rotacionDeg: 0, relleno: 0, pliegues: 1 },
    { lados: 5, rotacionDeg: 90, relleno: 0, pliegues: 1 },
    { lados: 5, rotacionDeg: 0, relleno: 1, pliegues: 1 },
    { lados: 5, rotacionDeg: 0, relleno: 0, pliegues: 2 },
    { lados: 5, rotacionDeg: 0, relleno: 0, pliegues: 1 },
  ],
  indiceCorrecto: 4,
};

// Práctica 2: segunda regla más obvia — relleno binario, alterna sólido/contorno/sólido,
// igual en las 3 filas. Respuesta correcta: cuadrado sólido (relleno: 0), sin rotar, 1 capa.
export const itemPracticaMatrices2: ItemMatriz = {
  id: "mat-practica-2",
  dificultad: "facil",
  reglas: [{ atributo: "relleno", baseFila: [0, 0, 0], pasoColumna: 1 }],
  grilla: [
    { lados: 4, rotacionDeg: 0, relleno: 0, pliegues: 1 },
    { lados: 4, rotacionDeg: 0, relleno: 1, pliegues: 1 },
    { lados: 4, rotacionDeg: 0, relleno: 0, pliegues: 1 },
    { lados: 4, rotacionDeg: 0, relleno: 0, pliegues: 1 },
    { lados: 4, rotacionDeg: 0, relleno: 1, pliegues: 1 },
    { lados: 4, rotacionDeg: 0, relleno: 0, pliegues: 1 },
    { lados: 4, rotacionDeg: 0, relleno: 0, pliegues: 1 },
    { lados: 4, rotacionDeg: 0, relleno: 1, pliegues: 1 },
    { lados: 4, rotacionDeg: 0, relleno: 0, pliegues: 1 },
  ],
  alternativas: [
    { lados: 4, rotacionDeg: 0, relleno: 1, pliegues: 1 },
    { lados: 5, rotacionDeg: 0, relleno: 0, pliegues: 1 },
    { lados: 4, rotacionDeg: 45, relleno: 0, pliegues: 1 },
    { lados: 4, rotacionDeg: 0, relleno: 0, pliegues: 2 },
    { lados: 4, rotacionDeg: 0, relleno: 0, pliegues: 1 },
  ],
  indiceCorrecto: 4,
};
