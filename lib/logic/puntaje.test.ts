import { describe, expect, it } from "vitest";
import { contextos } from "@/lib/data/contextos";
import { calcularPuntajes } from "@/lib/logic/puntaje";

describe("calcularPuntajes", () => {
  it("da 0 en todas las dimensiones cuando todas las respuestas son 0, y ordena alfabéticamente por etiqueta", () => {
    const respuestas = contextos.map((c) => ({ contextoId: c.id, valor: 0 as const }));
    const resultado = calcularPuntajes(respuestas);

    expect(resultado).toHaveLength(8);
    expect(resultado.every((r) => r.puntaje === 0)).toBe(true);

    const etiquetas = resultado.map((r) => r.etiqueta);
    const ordenadas = [...etiquetas].sort((a, b) => a.localeCompare(b, "es"));
    expect(etiquetas).toEqual(ordenadas);
  });

  it("da 100 en todas las dimensiones cuando todas las respuestas son 2", () => {
    const respuestas = contextos.map((c) => ({ contextoId: c.id, valor: 2 as const }));
    const resultado = calcularPuntajes(respuestas);

    expect(resultado.every((r) => r.puntaje === 100)).toBe(true);
  });

  it("calcula puntajes mixtos y ordena de mayor a menor", () => {
    const respuestas = contextos.map((c) => {
      if (c.dimension === "cre") return { contextoId: c.id, valor: 2 as const };
      if (c.dimension === "tec") return { contextoId: c.id, valor: 0 as const };
      return { contextoId: c.id, valor: 1 as const };
    });

    const resultado = calcularPuntajes(respuestas);

    expect(resultado[0].dimension).toBe("cre");
    expect(resultado[0].puntaje).toBe(100);

    const ultimo = resultado[resultado.length - 1];
    expect(ultimo.dimension).toBe("tec");
    expect(ultimo.puntaje).toBe(0);

    const intermedias = resultado.filter((r) => r.dimension !== "cre" && r.dimension !== "tec");
    expect(intermedias.every((r) => r.puntaje === 50)).toBe(true);
  });
});
