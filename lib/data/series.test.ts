import { describe, expect, it } from "vitest";
import { itemsSeries, itemPracticaSeries, itemPracticaSeries2, type ItemSerie } from "@/lib/data/series";

const TODOS = [...itemsSeries, itemPracticaSeries, itemPracticaSeries2];

// Recalcula el elemento esperado a partir de la regla declarada en el comentario de cada
// ítem (lib/data/series.ts) — como los ítems se escriben a mano (no hay generador), esta es
// la forma de detectar que "lo que se ve" y "lo que se puntúa como correcto" coinciden.
const SIGUIENTE_ESPERADO: Record<string, string> = {
  "ser-01": "13", // +2
  "ser-02": "15", // -3
  "ser-03": "64", // ×2
  "ser-04": "10", // alterna +1/+3
  "ser-05": "7", // subserie impar: 1,3,5,7 (+2)
  "ser-06": "25", // alterna ×2/-1
  "ser-07": "E9", // letra +1, número +2
  "ser-08": "21", // fibonacci
  "ser-practica": "5", // +1
  "ser-practica-2": "10", // alternancia 5/10
};

describe("itemsSeries: la regla enunciada reproduce la alternativa correcta", () => {
  it.each(TODOS.map((item) => [item.id, item] as const))("%s", (id, item) => {
    const esperado = SIGUIENTE_ESPERADO[id];
    expect(esperado).toBeDefined();
    expect(item.alternativas[item.indiceCorrecto]).toBe(esperado);
  });
});

describe("itemsSeries: invariantes estructurales", () => {
  function verificarItem(item: ItemSerie) {
    // Exactamente 5 alternativas, un solo índice correcto en rango.
    expect(item.alternativas).toHaveLength(5);
    expect(item.indiceCorrecto).toBeGreaterThanOrEqual(0);
    expect(item.indiceCorrecto).toBeLessThan(5);

    // Sin distractores duplicados entre sí ni con la correcta (ni textual ni visualmente
    // confundibles: al ser strings cortos, "duplicado visual" se reduce a "string idéntico").
    const claves = new Set(item.alternativas);
    expect(claves.size).toBe(5);

    // La serie visible tiene entre 4 y 6 elementos (spec 3.2).
    expect(item.secuencia.length).toBeGreaterThanOrEqual(4);
    expect(item.secuencia.length).toBeLessThanOrEqual(6);
  }

  it("cada ítem real cumple las invariantes estructurales", () => {
    itemsSeries.forEach(verificarItem);
  });

  it("los ítems de práctica cumplen las mismas invariantes", () => {
    verificarItem(itemPracticaSeries);
    verificarItem(itemPracticaSeries2);
  });

  it("rampa de dificultad: 3 fáciles, 3 medias, 2 difíciles", () => {
    const porDificultad = { facil: 0, media: 0, dificil: 0 };
    itemsSeries.forEach((item) => { porDificultad[item.dificultad]++; });
    expect(porDificultad).toEqual({ facil: 3, media: 3, dificil: 2 });
  });

  it("ids de ítems reales son únicos", () => {
    const ids = new Set(itemsSeries.map((i) => i.id));
    expect(ids.size).toBe(itemsSeries.length);
  });
});
