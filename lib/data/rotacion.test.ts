import { describe, expect, it } from "vitest";
import { itemsRotacion } from "@/lib/data/rotacion";

describe("itemsRotacion", () => {
  it("tiene 10 ítems con tipos alternados y rampa 4/4/2", () => {
    expect(itemsRotacion).toHaveLength(10);
    itemsRotacion.forEach((item, i) => {
      expect(item.tipo).toBe(i % 2 === 0 ? "rotacion" : "plegado");
    });

    expect(itemsRotacion.filter((i) => i.dificultad === "facil")).toHaveLength(4);
    expect(itemsRotacion.filter((i) => i.dificultad === "media")).toHaveLength(4);
    expect(itemsRotacion.filter((i) => i.dificultad === "dificil")).toHaveLength(2);
  });

  it("cada ítem tiene exactamente 4 alternativas únicas y un índice correcto válido", () => {
    for (const item of itemsRotacion) {
      expect(item.alternativas).toHaveLength(4);
      expect(item.indiceCorrecto).toBeGreaterThanOrEqual(0);
      expect(item.indiceCorrecto).toBeLessThan(4);

      const claves = item.alternativas.map((a) => JSON.stringify(a));
      expect(new Set(claves).size).toBe(4);
    }
  });

  it("todos los ids son únicos", () => {
    const ids = itemsRotacion.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
