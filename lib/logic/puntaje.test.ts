import { describe, expect, it } from "vitest";
import { contextos } from "@/lib/data/contextos";
import { actividades } from "@/lib/data/actividades";
import { asignaturas } from "@/lib/data/asignaturas";
import { calcularPuntajes, calcularPuntajesIntegrados, detectarDiscrepancia } from "@/lib/logic/puntaje";
import type { Respuesta, RespuestaActividad } from "@/lib/logic/puntaje";

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

describe("calcularPuntajesIntegrados", () => {
  const gustosMaximos = contextos.map((c) => ({ contextoId: c.id, valor: 2 as const }));
  const actividadesMaximas = actividades.map((a) => ({ actividadId: a.id, valor: 2 as const }));
  const asignaturasMaximas = asignaturas.map((a) => ({ asignaturaId: a.id, valor: 2 as const }));

  it("con todo al máximo y sin aspiración declarada, el máximo posible es 85 (45+40)", () => {
    const resultado = calcularPuntajesIntegrados(gustosMaximos, actividadesMaximas, asignaturasMaximas, null);
    expect(resultado).toHaveLength(8);
    // ges no tiene cobertura de asignaturas (no hay asignatura de gestión en el
    // currículum): su máximo es 45 (contextos) + 20 (actividades) = 65.
    expect(
      resultado.every((r) => r.puntaje === 85 || (r.dimension === "ges" && r.puntaje === 65))
    ).toBe(true);
  });

  it("la aspiración orienta dentro del 15%: universidad favorece cie/soc/cre", () => {
    const resultado = calcularPuntajesIntegrados(gustosMaximos, actividadesMaximas, asignaturasMaximas, {
      opcion: "universidad",
      detalle: null,
    });
    const porDimension = new Map(resultado.map((r) => [r.dimension, r.puntaje]));
    expect(porDimension.get("cie")).toBe(91); // 45 + 40 + 0.15×40
    expect(porDimension.get("soc")).toBe(90); // 45 + 40 + 0.15×30 → 89.5, redondea a 90
    expect(porDimension.get("cre")).toBe(90);
    expect(porDimension.get("tec")).toBe(85); // sin aporte de aspiración
    expect(resultado[0].dimension).toBe("cie");
  });

  it("no_se es neutral: igual que sin aspiración", () => {
    const conNoSe = calcularPuntajesIntegrados(gustosMaximos, actividadesMaximas, asignaturasMaximas, {
      opcion: "no_se",
      detalle: null,
    });
    const sinAspiracion = calcularPuntajesIntegrados(gustosMaximos, actividadesMaximas, asignaturasMaximas, null);
    expect(conNoSe.map((r) => r.puntaje)).toEqual(sinAspiracion.map((r) => r.puntaje));
  });

  it("combina fuentes independientes: cre domina por gustos, tec por actividades+aspiración", () => {
    const gustos: Respuesta[] = contextos.map((c) => ({
      contextoId: c.id,
      valor: c.dimension === "cre" ? 2 : 0,
    }));
    const soloTec: RespuestaActividad[] = actividades.map((a) => ({
      actividadId: a.id,
      valor: a.dimension === "tec" ? 2 : 0,
    }));
    const asignaturasCero = asignaturas.map((a) => ({ asignaturaId: a.id, valor: 0 as const }));
    const resultado = calcularPuntajesIntegrados(gustos, soloTec, asignaturasCero, {
      opcion: "tecnico",
      detalle: null,
    });
    const porDimension = new Map(resultado.map((r) => [r.dimension, r.puntaje]));
    expect(porDimension.get("cre")).toBe(45); // 0.45 × 100
    expect(porDimension.get("tec")).toBe(26); // 0.20 × 100 + 0.15 × 40
    expect(porDimension.get("sal")).toBe(5); // 0.15 × 30 → 4.5
    expect(porDimension.get("dat")).toBe(5); // 0.15 × 30 → 4.5
  });

  it("respuestas vacías dan 0 en todo, salvo el nudge del 15% de la aspiración", () => {
    const resultado = calcularPuntajesIntegrados([], [], [], { opcion: "trabajar", detalle: null });
    const porDimension = new Map(resultado.map((r) => [r.dimension, r.puntaje]));
    expect(porDimension.get("ges")).toBe(6); // 0.15 × 40
    expect(porDimension.get("tec")).toBe(5); // 0.15 × 30 → 4.5
    expect(porDimension.get("cie")).toBe(0);
  });

  it("ordena con los mismos desempates que calcularPuntajes (alfabético por etiqueta)", () => {
    const resultado = calcularPuntajesIntegrados([], [], [], null);
    const etiquetas = resultado.map((r) => r.etiqueta);
    const ordenadas = [...etiquetas].sort((a, b) => a.localeCompare(b, "es"));
    expect(etiquetas).toEqual(ordenadas);
  });
});

describe("detectarDiscrepancia", () => {
  it("retorna null cuando no hay respuestas (ninguna fuente supera el umbral)", () => {
    expect(detectarDiscrepancia([], [], [], null)).toBeNull();
  });

  it("retorna null cuando gustos y actividades apuntan a la misma dimensión top", () => {
    const gustos: Respuesta[] = contextos.map((c) => ({ contextoId: c.id, valor: c.dimension === "cre" ? 2 : 0 }));
    const act: RespuestaActividad[] = actividades.map((a) => ({
      actividadId: a.id,
      valor: a.dimension === "cre" ? 2 : 0,
    }));
    expect(detectarDiscrepancia(gustos, act, [], null)).toBeNull();
  });

  it("retorna la discrepancia cuando gustos y actividades apuntan a dimensiones distintas y fuertes", () => {
    const gustos: Respuesta[] = contextos.map((c) => ({ contextoId: c.id, valor: c.dimension === "cre" ? 2 : 0 }));
    const act: RespuestaActividad[] = actividades.map((a) => ({
      actividadId: a.id,
      valor: a.dimension === "tec" ? 2 : 0,
    }));
    const resultado = detectarDiscrepancia(gustos, act, [], null);
    expect(resultado).toEqual({
      dimensionGustos: "cre",
      etiquetaGustos: expect.any(String),
      dimensionActividades: "tec",
      etiquetaActividades: expect.any(String),
    });
  });
});
