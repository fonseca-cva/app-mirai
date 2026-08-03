// Ítems de Series (razonamiento numérico y secuencial), sección 3 de la spec.
// A diferencia de matrices.ts, estos 10 ítems (8 reales + 2 práctica) se escriben A MANO:
// las reglas numéricas y alfanuméricas son más simples de enunciar directamente que de
// generar con un motor de reglas. Documentados uno por uno en items_series_auditoria.md.
//
// Mundo visual: fichas de papel con texto (números o combinaciones letra+número), sin
// geometría — para distinguirse claramente de Matrices (figuras), Rotación/Pliegues (papel 3D)
// y Secuencias (objetos origami). El color nunca porta la regla (ver auditoría).

export interface ItemSerie {
  id: string;
  dificultad: "facil" | "media" | "dificil";
  secuencia: string[]; // elementos visibles, en orden; el siguiente elemento es lo que se pide
  alternativas: string[]; // 5 alternativas para completar el siguiente elemento
  indiceCorrecto: number;
}

// ── Ítems reales: rampa 3 fáciles / 3 medias / 2 difíciles ──────────

const ITEMS_REALES: ItemSerie[] = [
  // -- Fáciles: una regla aritmética simple --
  {
    id: "ser-01",
    dificultad: "facil",
    // Regla: +2 cada paso.
    secuencia: ["3", "5", "7", "9", "11"],
    alternativas: ["12", "13", "14", "15", "10"],
    indiceCorrecto: 1,
  },
  {
    id: "ser-02",
    dificultad: "facil",
    // Regla: -3 cada paso.
    secuencia: ["30", "27", "24", "21", "18"],
    alternativas: ["14", "15", "16", "17", "12"],
    indiceCorrecto: 1,
  },
  {
    id: "ser-03",
    dificultad: "facil",
    // Regla: ×2 cada paso.
    secuencia: ["2", "4", "8", "16", "32"],
    alternativas: ["48", "60", "64", "66", "34"],
    indiceCorrecto: 2,
  },

  // -- Medias: dos reglas combinadas o alternancia entre dos subseries --
  {
    id: "ser-04",
    dificultad: "media",
    // Regla: alterna +1 y +3 (1,+1→2,+3→5,+1→6,+3→9,+1→10...).
    secuencia: ["1", "2", "5", "6", "9"],
    alternativas: ["8", "10", "11", "12", "13"],
    indiceCorrecto: 1,
  },
  {
    id: "ser-05",
    dificultad: "media",
    // Regla: dos subseries intercaladas — posiciones impares (1,3,5,...) suben +2 desde 1;
    // posiciones pares (2,4,6,...) suben +10 desde 10. El siguiente término (posición 7,
    // impar) continúa la subserie A: 1,3,5,7.
    secuencia: ["1", "10", "3", "20", "5", "30"],
    alternativas: ["6", "7", "9", "25", "40"],
    indiceCorrecto: 1,
  },
  {
    id: "ser-06",
    dificultad: "media",
    // Regla: alterna ×2 y -1 sobre el valor anterior (4,×2→8,-1→7,×2→14,-1→13,×2→26,-1→25).
    secuencia: ["4", "8", "7", "14", "13", "26"],
    alternativas: ["12", "24", "25", "27", "52"],
    indiceCorrecto: 2,
  },

  // -- Difíciles: regla no obvia o alfanumérica --
  {
    id: "ser-07",
    dificultad: "dificil",
    // Regla alfanumérica (tipo Letter-Number Series, ICAR): la letra avanza una posición
    // en el alfabeto y el número sube +2 (impares), en paralelo. A1,B3,C5,D7 → E9.
    secuencia: ["A1", "B3", "C5", "D7"],
    alternativas: ["D9", "E7", "E9", "E11", "F9"],
    indiceCorrecto: 2,
  },
  {
    id: "ser-08",
    dificultad: "dificil",
    // Regla no obvia: cada término es la suma de los dos anteriores (Fibonacci).
    secuencia: ["2", "3", "5", "8", "13"],
    alternativas: ["11", "18", "20", "21", "24"],
    indiceCorrecto: 3,
  },
];

export const itemsSeries: ItemSerie[] = ITEMS_REALES;

// ── Ítems de práctica: la regla más obvia posible, escritos a mano ──

// Práctica 1: +1 simple.
export const itemPracticaSeries: ItemSerie = {
  id: "ser-practica",
  dificultad: "facil",
  secuencia: ["1", "2", "3", "4"],
  alternativas: ["3", "5", "6", "7", "8"],
  indiceCorrecto: 1,
};

// Práctica 2: alternancia obvia de dos valores.
export const itemPracticaSeries2: ItemSerie = {
  id: "ser-practica-2",
  dificultad: "facil",
  secuencia: ["5", "10", "5", "10", "5"],
  alternativas: ["5", "7", "10", "15", "20"],
  indiceCorrecto: 2,
};
