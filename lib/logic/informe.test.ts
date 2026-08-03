import { describe, it, expect } from "vitest";
import { formatearFecha, tituloInforme } from "@/lib/logic/informe";
import type { PerfilResultado } from "@/lib/supabase/types";

const perfilBase: PerfilResultado = {
  dimensionTop3: [{ codigo: "sal", etiqueta: "Salud", puntaje: 90 }],
  capacidades: { patrones: 80, numerico: 60, espacial: 65, memoria: 72, comunicacion: 78 },
  carrerasRecomendadas: [],
  generado_en: new Date(0).toISOString(),
};

describe("tituloInforme", () => {
  it("usa la primera carrera curada como título", () => {
    expect(tituloInforme({ ...perfilBase, carrerasRecomendadas: ["medicina", "enfermeria"] })).toBe("Medicina");
  });

  it("cae al fallback si no hay carreras o el id no existe", () => {
    expect(tituloInforme(perfilBase)).toBe("Informe vocacional");
    expect(tituloInforme({ ...perfilBase, carrerasRecomendadas: ["no-existe"] })).toBe("Informe vocacional");
  });
});

describe("formatearFecha", () => {
  it("formatea fechas ISO en español de Chile", () => {
    const fecha = formatearFecha("2026-07-06T12:00:00.000Z");
    expect(fecha).toMatch(/6 de julio de 2026/);
  });

  it("devuelve '—' para fechas inválidas", () => {
    expect(formatearFecha("no-es-fecha")).toBe("—");
    expect(formatearFecha("")).toBe("—");
  });
});
