// CONTENIDO PROVISORIO — pendiente de firma metodológica.
// 10 ítems de "Pliegues en el espacio" (sección 3.2). Tipos alternados: rotación / plegado.
// Rampa: 4 fáciles, 4 medios, 2 difíciles (offsets más cerrados = más difícil).
import {
  generarItemPlegado,
  generarItemRotacionMental,
  type ItemRotacionBloque,
} from "@/lib/logic/rotacion";

export const itemsRotacion: ItemRotacionBloque[] = [
  // -- Fáciles --
  generarItemRotacionMental("rot-01", "facil", 0, 90, [90, 180, 270]),
  generarItemPlegado("rot-02", "facil", "vertical", { x: 0.8, y: 0.3 }, 0.35),
  generarItemRotacionMental("rot-03", "facil", 45, 225, [80, 160, 260]),
  generarItemPlegado("rot-04", "facil", "horizontal", { x: 0.25, y: 0.85 }, 0.35),

  // -- Medios --
  generarItemRotacionMental("rot-05", "media", 20, 140, [70, 150, 250]),
  generarItemPlegado("rot-06", "media", "vertical", { x: 0.75, y: 0.6 }, 0.2),
  generarItemRotacionMental("rot-07", "media", 200, 60, [60, 140, 220]),
  generarItemPlegado("rot-08", "media", "horizontal", { x: 0.4, y: 0.9 }, 0.2),

  // -- Difíciles: offsets/decoys más cerrados --
  generarItemRotacionMental("rot-09", "dificil", 130, 310, [30, 90, 200]),
  generarItemPlegado("rot-10", "dificil", "vertical", { x: 0.85, y: 0.45 }, 0.1),
];

// Ítem de práctica: rotación simple, ángulos muy separados, no puntúa.
export const itemPracticaRotacion: ItemRotacionBloque = generarItemRotacionMental(
  "rot-practica",
  "facil",
  0,
  90,
  [120, 200, 280]
);
