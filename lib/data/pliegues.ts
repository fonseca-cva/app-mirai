// 7 ítems de plegado (sección 3.2, "Pliegues en el espacio").
// Todos son de tipo "plegado" para cumplir la rampa de dificultad del Anexo 2 tras el
// rebalance de Tanda C (10 → 7 ítems, proporción 3/3/1 mantenida):
//   3 fáciles — 1 doblez, 1 perforación
//   3 medios  — 1 doblez + 2 perforaciones, o 2 dobleces + 1 perforación
//   1 difícil — doblez diagonal + 1 perforación
// La dificultad se modula por: número de pliegues, número de perforaciones,
// tipo de eje (diagonal es más díficil que vertical/horizontal), y offsetDecoy.
import { generarItemPlegado, type ItemPlieguesBloque } from "@/lib/logic/pliegues";

export const itemsPliegues: ItemPlieguesBloque[] = [
  // ── Fáciles (1 doblez, 1 perforación, offsetDecoy alto) ──────────
  generarItemPlegado("rot-01", "facil", ["vertical"], [{ x: 0.8, y: 0.3 }], 0.35),
  generarItemPlegado("rot-02", "facil", ["horizontal"], [{ x: 0.25, y: 0.85 }], 0.35),
  generarItemPlegado("rot-03", "facil", ["vertical"], [{ x: 0.65, y: 0.15 }], 0.3),

  // ── Medios (1 doblez + 2 perforaciones, offsetDecoy medio) ───────
  generarItemPlegado("rot-05", "media", ["vertical"], [{ x: 0.75, y: 0.3 }, { x: 0.75, y: 0.7 }], 0.25),
  generarItemPlegado("rot-06", "media", ["horizontal"], [{ x: 0.2, y: 0.6 }, { x: 0.8, y: 0.6 }], 0.25),
  // 2 dobleces (vertical+horizontal) + 1 perforación
  generarItemPlegado("rot-07", "media", ["vertical", "horizontal"], [{ x: 0.7, y: 0.7 }], 0.2),

  // ── Difícil (diagonal + 1 perforación) ──
  generarItemPlegado("rot-09", "dificil", ["diagonal"], [{ x: 0.7, y: 0.3 }], 0.12),
];

// Ítems de práctica: NO se generan. Se escriben a mano para ser auditables por inspección directa.

// Práctica 1: plegado simple (1 doblez vertical, 1 perforación).
// Correcta: el punto (0.80, 0.30) se refleja sobre el eje vertical → (0.20, 0.30).
export const itemPracticaPlegado = {
  id: "ple-practica",
  tipo: "plegado",
  dificultad: "facil",
  pliegues: ["vertical"],
  puntos: [{ x: 0.8, y: 0.3 }],
  alternativas: [
    { puntos: [{ x: 0.8, y: 0.3 }, { x: 0.8, y: 0.7 }] },
    { puntos: [{ x: 0.8, y: 0.3 }, { x: 0.2, y: 0.65 }] },
    { puntos: [{ x: 0.8, y: 0.3 }, { x: 0.8, y: 0.3 }] },
    { puntos: [{ x: 0.8, y: 0.3 }, { x: 0.2, y: 0.3 }] },
  ],
  indiceCorrecto: 3,
} satisfies ItemPlieguesBloque;

// Práctica 2: plegado simple (1 doblez horizontal, 1 perforación).
// Correcta: el punto (0.30, 0.80) se refleja sobre el eje horizontal → (0.30, 0.20).
export const itemPracticaPlegado2 = {
  id: "ple-practica-2",
  tipo: "plegado",
  dificultad: "facil",
  pliegues: ["horizontal"],
  puntos: [{ x: 0.3, y: 0.8 }],
  alternativas: [
    { puntos: [{ x: 0.3, y: 0.8 }, { x: 0.7, y: 0.8 }] },
    { puntos: [{ x: 0.3, y: 0.8 }, { x: 0.3, y: 0.26 }] },
    { puntos: [{ x: 0.3, y: 0.8 }] },
    { puntos: [{ x: 0.3, y: 0.8 }, { x: 0.3, y: 0.2 }] },
  ],
  indiceCorrecto: 3,
} satisfies ItemPlieguesBloque;
