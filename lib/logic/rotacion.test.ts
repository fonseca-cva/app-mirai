import { describe, expect, it } from "vitest";
import { generarItemRotacionMental, generarItemPlegado } from "@/lib/logic/rotacion";
import { esEspejada, transformarPieza } from "@/lib/logic/piezaOrigami";

describe("generarItemRotacionMental", () => {
  it("la alternativa correcta nunca está espejada; los distractores siempre lo están", () => {
    const item = generarItemRotacionMental("rot-test", "media", 20, 140, [90, 180, 270]);
    const correcta = item.alternativas[item.indiceCorrecto];

    expect(correcta.espejada).toBe(false);
    expect(esEspejada(transformarPieza(correcta.anguloDeg, correcta.espejada))).toBe(false);

    item.alternativas
      .filter((_, i) => i !== item.indiceCorrecto)
      .forEach((alt) => {
        expect(alt.espejada).toBe(true);
        expect(esEspejada(transformarPieza(alt.anguloDeg, alt.espejada))).toBe(true);
      });
  });

  it("tiene 4 alternativas y es determinístico por id", () => {
    const a = generarItemRotacionMental("rot-01", "facil", 0, 90, [90, 180, 270]);
    const b = generarItemRotacionMental("rot-01", "facil", 0, 90, [90, 180, 270]);
    expect(a.alternativas).toHaveLength(4);
    expect(a).toEqual(b);
  });
});

describe("generarItemPlegado", () => {
  it("la alternativa correcta refleja el punto sobre el eje de doblez", () => {
    const item = generarItemPlegado("ple-test", "media", "vertical", { x: 0.8, y: 0.3 }, 0.2);
    const correcta = item.alternativas[item.indiceCorrecto];

    expect(correcta.puntos[0]).toEqual({ x: 0.8, y: 0.3 });
    expect(correcta.puntos[1].x).toBeCloseTo(0.2);
    expect(correcta.puntos[1].y).toBe(0.3);
  });

  it("tiene 4 alternativas únicas", () => {
    const item = generarItemPlegado("ple-01", "dificil", "horizontal", { x: 0.3, y: 0.75 }, 0.1);
    expect(item.alternativas).toHaveLength(4);

    const claves = item.alternativas.map((a) => JSON.stringify(a.puntos));
    expect(new Set(claves).size).toBe(4);
  });
});
