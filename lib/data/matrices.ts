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
    reglas: [{ atributo: "tono", baseFila: [0, 0.15, 0.3], pasoColumna: 0.35 }],
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
      { atributo: "tono", baseFila: [0, 0.2, 0.1], pasoColumna: 0.3 },
    ],
  },
  {
    id: "mat-07",
    dificultad: "media",
    reglas: [
      { atributo: "pliegues", baseFila: [1, 2, 1], pasoColumna: 1 },
      { atributo: "tono", baseFila: [0.1, 0, 0.2], pasoColumna: 0.3 },
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
      { atributo: "tono", baseFila: [0, 0.1, 0.2], pasoColumna: 0.3 },
    ],
  },
  {
    id: "mat-11",
    dificultad: "dificil",
    reglas: [
      { atributo: "rotacionDeg", baseFila: [45, 135, 225], pasoColumna: 45 },
      { atributo: "lados", baseFila: [3, 4, 3], pasoColumna: 1 },
      { atributo: "tono", baseFila: [0.2, 0, 0.1], pasoColumna: 0.3 },
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

// Ítem de práctica: 1 regla simple, no puntúa, solo para que el estudiante entienda la mecánica.
export const itemPracticaMatrices: ItemMatriz = generarItemMatriz("mat-practica", "facil", [
  { atributo: "rotacionDeg", baseFila: [0, 0, 0], pasoColumna: 90 },
]);
