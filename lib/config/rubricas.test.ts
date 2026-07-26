import { describe, it, expect } from "vitest";
import { EvaluacionSchema, promptComprension, promptArgumentacion } from "@/lib/config/rubricas";

describe("EvaluacionSchema", () => {
  it("acepta evaluación válida completa", () => {
    const resultado = EvaluacionSchema.safeParse({
      nivel: "inferencial",
      puntaje: 4,
      fortaleza: "Buena conexión de ideas",
      area_mejora: "Podría profundizar más",
    });
    expect(resultado.success).toBe(true);
  });

  it("rechaza puntaje fuera de rango", () => {
    const resultado = EvaluacionSchema.safeParse({
      nivel: "literal",
      puntaje: 6,
      fortaleza: "OK",
      area_mejora: "Nada",
    });
    expect(resultado.success).toBe(false);
  });

  it("rechaza nivel inválido", () => {
    const resultado = EvaluacionSchema.safeParse({
      nivel: "superficial",
      puntaje: 3,
      fortaleza: "OK",
      area_mejora: "Nada",
    });
    expect(resultado.success).toBe(false);
  });

  it("rechaza campos faltantes", () => {
    const resultado = EvaluacionSchema.safeParse({
      nivel: "critico",
      puntaje: 5,
    });
    expect(resultado.success).toBe(false);
  });

  it("rechaza objeto vacío", () => {
    const resultado = EvaluacionSchema.safeParse({});
    expect(resultado.success).toBe(false);
  });
});

describe("promptComprension", () => {
  it("incluye el texto en el prompt", () => {
    const prompt = promptComprension("Texto de prueba.");
    expect(prompt).toContain("Texto de prueba.");
  });

  it("incluye instrucción de no evaluar opinión", () => {
    const prompt = promptComprension("Algo.");
    expect(prompt.toLowerCase()).toContain("nunca");
  });
});

describe("promptArgumentacion", () => {
  it("incluye el dilema en el prompt", () => {
    const prompt = promptArgumentacion("¿Debería X?");
    expect(prompt).toContain("¿Debería X?");
  });

  it("incluye instrucción de evaluar estructura no opinión", () => {
    const prompt = promptArgumentacion("¿Y?");
    expect(prompt.toLowerCase()).toContain("nunca");
  });
});
