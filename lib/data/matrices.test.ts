import { describe, expect, it } from "vitest";
import { itemsMatrices, itemPracticaMatrices } from "@/lib/data/matrices";

describe("itemsMatrices", () => {
  it("tiene 12 ítems con la rampa de dificultad 4 fáciles / 5 medias / 3 difíciles", () => {
    expect(itemsMatrices).toHaveLength(12);
    expect(itemsMatrices.filter((i) => i.dificultad === "facil")).toHaveLength(4);
    expect(itemsMatrices.filter((i) => i.dificultad === "media")).toHaveLength(5);
    expect(itemsMatrices.filter((i) => i.dificultad === "dificil")).toHaveLength(3);
  });

  it("cada ítem tiene 5 alternativas únicas y un índice correcto válido", () => {
    for (const item of itemsMatrices) {
      expect(item.alternativas).toHaveLength(5);
      expect(item.indiceCorrecto).toBeGreaterThanOrEqual(0);
      expect(item.indiceCorrecto).toBeLessThan(5);

      const claves = item.alternativas.map((a) => JSON.stringify(a));
      expect(new Set(claves).size).toBe(5);
    }
  });

  it("todos los ids son únicos", () => {
    const ids = itemsMatrices.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("el ítem de práctica también es válido y no está en el set puntuable", () => {
    expect(itemPracticaMatrices.alternativas).toHaveLength(5);
    expect(itemsMatrices.some((i) => i.id === itemPracticaMatrices.id)).toBe(false);
  });
});
