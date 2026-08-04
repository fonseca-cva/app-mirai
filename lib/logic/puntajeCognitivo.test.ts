import { describe, expect, it } from "vitest";
import { calcularPuntajesCognitivo, puntajeMatrices, puntajeRotacion, puntajeSeries } from "@/lib/logic/puntajeCognitivo";

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

describe("puntajeSeries", () => {
  it("mapea correctas/8 a 0-100", () => {
    expect(puntajeSeries(0)).toBe(0);
    expect(puntajeSeries(8)).toBe(100);
    expect(puntajeSeries(4)).toBe(50);
  });
});

describe("calcularPuntajesCognitivo", () => {
  it("combina los puntajes cognitivos y comunicación (desde Bloque Verbal)", () => {
    const resultado = calcularPuntajesCognitivo(12, 10, 8);
    expect(resultado).toEqual({ patrones: 100, numerico: 0, espacial: 100, memoria: 100, comunicacion: null });
  });
  it("comunicacion y series se pasan opcionalmente", () => {
    const resultado = calcularPuntajesCognitivo(6, 5, 5, 80, 4);
    expect(resultado.comunicacion).toBe(80);
    expect(resultado.numerico).toBe(50);
  });
  // Validez (plan de Camilo): sin evaluación válida, comunicación es null (nunca un 0 inventado).
  it("sin evaluación verbal la comunicación queda null, no 0", () => {
    const resultado = calcularPuntajesCognitivo(6, 5, 5);
    expect(resultado.comunicacion).toBeNull();
  });
});
