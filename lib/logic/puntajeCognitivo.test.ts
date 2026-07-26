import { describe, expect, it } from "vitest";
import { calcularPuntajesCognitivo, puntajeMatrices, puntajeRotacion } from "@/lib/logic/puntajeCognitivo";

describe("puntajeMatrices", () => {
  it("mapea correctas/12 a 0-100", () => {
    expect(puntajeMatrices(0)).toBe(0);
    expect(puntajeMatrices(12)).toBe(100);
    expect(puntajeMatrices(6)).toBe(50);
  });
});

describe("puntajeRotacion", () => {
  it("mapea correctas/10 a 0-100", () => {
    expect(puntajeRotacion(0)).toBe(0);
    expect(puntajeRotacion(10)).toBe(100);
    expect(puntajeRotacion(5)).toBe(50);
  });
});

describe("calcularPuntajesCognitivo", () => {
  it("combina los puntajes cognitivos y comunicación (desde Bloque Verbal)", () => {
    const resultado = calcularPuntajesCognitivo(12, 10, 8);
    expect(resultado).toEqual({ patrones: 100, espacial: 100, memoria: 100, comunicacion: 0 });
  });
  it("comunicacion se pasa opcionalmente", () => {
    const resultado = calcularPuntajesCognitivo(6, 5, 5, 80);
    expect(resultado.comunicacion).toBe(80);
  });
});
