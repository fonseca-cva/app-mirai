import { describe, expect, it } from "vitest";
import { calcularCelda, generarItemMatriz, type Regla } from "@/lib/logic/matrices";

describe("calcularCelda", () => {
  it("aplica la regla de rotación de forma verificable: base + paso * columna", () => {
    const reglas: Regla[] = [{ atributo: "rotacionDeg", baseFila: [0, 90, 180], pasoColumna: 45 }];

    expect(calcularCelda(reglas, 0, 0).rotacionDeg).toBe(0);
    expect(calcularCelda(reglas, 0, 2).rotacionDeg).toBe(90);
    expect(calcularCelda(reglas, 1, 2).rotacionDeg).toBe(180);
    // 180 + 45*2 = 270, dentro de rango sin necesidad de módulo
    expect(calcularCelda(reglas, 2, 2).rotacionDeg).toBe(270);
  });

  it("envuelve la rotación en 360 en vez de saturar", () => {
    const reglas: Regla[] = [{ atributo: "rotacionDeg", baseFila: [270, 270, 270], pasoColumna: 90 }];
    expect(calcularCelda(reglas, 0, 1).rotacionDeg).toBe(0);
  });

  it("satura lados y pliegues dentro de su rango en vez de envolver", () => {
    const reglasLados: Regla[] = [{ atributo: "lados", baseFila: [3, 3, 3], pasoColumna: 3 }];
    expect(calcularCelda(reglasLados, 0, 2).lados).toBe(8);

    const reglasPliegues: Regla[] = [{ atributo: "pliegues", baseFila: [1, 1, 1], pasoColumna: 5 }];
    expect(calcularCelda(reglasPliegues, 0, 2).pliegues).toBe(3);
  });

  it("no controlar un atributo lo deja en su valor base fijo", () => {
    const reglas: Regla[] = [{ atributo: "tono", baseFila: [0, 0, 0], pasoColumna: 0.3 }];
    const celda = calcularCelda(reglas, 1, 1);
    expect(celda.lados).toBe(4);
    expect(celda.pliegues).toBe(1);
  });
});

describe("generarItemMatriz", () => {
  const reglas: Regla[] = [
    { atributo: "rotacionDeg", baseFila: [0, 45, 90], pasoColumna: 45 },
    { atributo: "pliegues", baseFila: [1, 1, 1], pasoColumna: 1 },
  ];

  it("la alternativa correcta coincide con la celda (fila2, col2) calculada por la regla", () => {
    const item = generarItemMatriz("test-01", "media", reglas);
    const esperada = calcularCelda(reglas, 2, 2);

    expect(item.alternativas[item.indiceCorrecto]).toEqual(esperada);
  });

  it("genera exactamente 5 alternativas sin duplicados", () => {
    const item = generarItemMatriz("test-02", "media", reglas);
    expect(item.alternativas).toHaveLength(5);

    const claves = item.alternativas.map((a) => JSON.stringify(a));
    expect(new Set(claves).size).toBe(5);
  });

  it("es determinístico: mismo id y reglas producen el mismo resultado", () => {
    const a = generarItemMatriz("test-03", "dificil", reglas);
    const b = generarItemMatriz("test-03", "dificil", reglas);
    expect(a).toEqual(b);
  });

  it("ids distintos pueden variar el orden de las alternativas", () => {
    const a = generarItemMatriz("aa", "facil", reglas);
    const b = generarItemMatriz("zz", "facil", reglas);
    // La correcta es la misma figura en ambos, pero no necesariamente en el mismo índice.
    expect(a.alternativas[a.indiceCorrecto]).toEqual(b.alternativas[b.indiceCorrecto]);
  });
});
