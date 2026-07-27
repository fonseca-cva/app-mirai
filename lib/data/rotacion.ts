// 10 ítems de plegado (sección 3.2, "Pliegues en el espacio").
// Todos son de tipo "plegado" para cumplir la rampa de dificultad del Anexo 2:
//   4 fáciles  — 1 doblez, 1 perforación
//   4 medios   — 1 doblez + 2 perforaciones, o 2 dobleces + 1 perforación
//   2 difíciles — 2 dobleces + 2 perforaciones, o doblez diagonal + 1 perforación
// La dificultad se modula por: número de pliegues, número de perforaciones,
// tipo de eje (diagonal es más díficil que vertical/horizontal), y offsetDecoy.
import { generarItemPlegado, type ItemRotacionBloque } from "@/lib/logic/rotacion";

export const itemsRotacion: ItemRotacionBloque[] = [
  // ── Fáciles (1 doblez, 1 perforación, offsetDecoy alto) ──────────
  generarItemPlegado("rot-01", "facil", ["vertical"], [{ x: 0.8, y: 0.3 }], 0.35),
  generarItemPlegado("rot-02", "facil", ["horizontal"], [{ x: 0.25, y: 0.85 }], 0.35),
  generarItemPlegado("rot-03", "facil", ["vertical"], [{ x: 0.65, y: 0.15 }], 0.3),
  generarItemPlegado("rot-04", "facil", ["horizontal"], [{ x: 0.2, y: 0.7 }], 0.3),

  // ── Medios (1 doblez + 2 perforaciones, offsetDecoy medio) ───────
  generarItemPlegado("rot-05", "media", ["vertical"], [{ x: 0.75, y: 0.3 }, { x: 0.75, y: 0.7 }], 0.25),
  generarItemPlegado("rot-06", "media", ["horizontal"], [{ x: 0.2, y: 0.6 }, { x: 0.8, y: 0.6 }], 0.25),
  // 2 dobleces (vertical+horizontal) + 1 perforación
  generarItemPlegado("rot-07", "media", ["vertical", "horizontal"], [{ x: 0.7, y: 0.7 }], 0.2),
  generarItemPlegado("rot-08", "media", ["vertical", "horizontal"], [{ x: 0.3, y: 0.3 }], 0.2),

  // ── Difíciles (diagonal + 1 perforación; 2 dobleces + 2 perforaciones) ──
  generarItemPlegado("rot-09", "dificil", ["diagonal"], [{ x: 0.7, y: 0.3 }], 0.12),
  generarItemPlegado("rot-10", "dificil", ["vertical", "horizontal"], [{ x: 0.75, y: 0.35 }, { x: 0.9, y: 0.15 }], 0.1),
];

// Ítems de práctica: NO se generan. Se escriben a mano para ser auditables por inspección directa.

// Práctica 1: rotación mental (referencia 0°, correcta 90°, distractores muy separados).
export const itemPracticaRotacion: ItemRotacionBloque = {
  id: "rot-practica",
  tipo: "rotacion",
  dificultad: "facil",
  anguloReferencia: 0,
  alternativas: [
    { anguloDeg: 210, espejada: true },
    { anguloDeg: 290, espejada: true },
    { anguloDeg: 10, espejada: true },
    { anguloDeg: 90, espejada: false },
  ],
  indiceCorrecto: 3,
};

// Práctica 2: plegado simple (1 doblez vertical, 1 perforación, offsetDecoy 0.35).
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
} satisfies ItemRotacionBloque;
