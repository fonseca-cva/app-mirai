import { describe, expect, it } from "vitest";
import { generarItemPlegado, combinacionesReflejo } from "@/lib/logic/pliegues";
describe("generarItemPlegado", () => {
  it("1 pliegue vertical, 1 punto: la correcta contiene el punto y su reflejo", () => {
    const item = generarItemPlegado("ple-test", "media", ["vertical"], [{ x: 0.8, y: 0.3 }], 0.2);
    const correcta = item.alternativas[item.indiceCorrecto];

    // con 1 pliegue, el resultado tiene 2¹ = 2 puntos
    expect(correcta.puntos).toHaveLength(2);
    const esperados = combinacionesReflejo({ x: 0.8, y: 0.3 }, ["vertical"]);
    expect(correcta.puntos).toEqual(expect.arrayContaining(esperados));
  });

  it("1 pliegue horizontal, 1 punto: refleja en Y", () => {
    const item = generarItemPlegado("ple-01", "facil", ["horizontal"], [{ x: 0.3, y: 0.75 }], 0.35);
    const correcta = item.alternativas[item.indiceCorrecto];

    const esperados = combinacionesReflejo({ x: 0.3, y: 0.75 }, ["horizontal"]);
    expect(correcta.puntos).toHaveLength(2);
    expect(correcta.puntos).toEqual(expect.arrayContaining(esperados));
  });

  it("2 pliegues vertical+horizontal, 1 punto: resultado tiene 4 puntos", () => {
    const item = generarItemPlegado("ple-2f", "media", ["vertical", "horizontal"], [{ x: 0.7, y: 0.7 }], 0.2);
    const correcta = item.alternativas[item.indiceCorrecto];

    // 2 pliegues → 2² = 4 puntos
    expect(correcta.puntos).toHaveLength(4);
    const esperados = combinacionesReflejo({ x: 0.7, y: 0.7 }, ["vertical", "horizontal"]);
    expect(correcta.puntos).toEqual(expect.arrayContaining(esperados));
  });

  it("1 pliegue, 2 puntos: resultado tiene 4 puntos (2 + 2 reflejados)", () => {
    const item = generarItemPlegado("ple-2p", "media", ["vertical"], [{ x: 0.3, y: 0.3 }, { x: 0.7, y: 0.7 }], 0.25);
    const correcta = item.alternativas[item.indiceCorrecto];

    // 2 puntos × 2 reflejos c/u = 4 puntos
    expect(correcta.puntos).toHaveLength(4);
  });

  it("2 pliegues + 2 puntos: resultado tiene 8 puntos", () => {
    const item = generarItemPlegado("ple-dificil", "dificil", ["vertical", "horizontal"], [{ x: 0.75, y: 0.35 }, { x: 0.25, y: 0.65 }], 0.1);
    const correcta = item.alternativas[item.indiceCorrecto];

    // 2 puntos × 2² = 8 puntos
    expect(correcta.puntos).toHaveLength(8);
  });

  it("distractor de eje incorrecto no es igual a la correcta", () => {
    const item = generarItemPlegado("ple-eje", "facil", ["vertical"], [{ x: 0.8, y: 0.3 }], 0.35);
    const correcta = item.alternativas[item.indiceCorrecto];
    const distractores = item.alternativas.filter((_, i) => i !== item.indiceCorrecto);

    distractores.forEach((d) => {
      const dStr = d.puntos.map((p) => `(${p.x.toFixed(2)},${p.y.toFixed(2)})`).join(" ");
      const cStr = correcta.puntos.map((p) => `(${p.x.toFixed(2)},${p.y.toFixed(2)})`).join(" ");
      expect(dStr).not.toBe(cStr);
    });
  });

  it("tiene 4 alternativas únicas", () => {
    const item = generarItemPlegado("ple-01", "dificil", ["horizontal"], [{ x: 0.3, y: 0.75 }], 0.1);
    expect(item.alternativas).toHaveLength(4);

    const claves = item.alternativas.map((a) => JSON.stringify(a.puntos));
    expect(new Set(claves).size).toBe(4);
  });
});
