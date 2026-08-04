import { describe, it, expect } from "vitest";
import { EvaluacionSchema, PertinenciaSchema, promptComprension, promptArgumentacion, promptPertinencia, RATE_LIMIT_POR_SESSION } from "@/lib/config/rubricas";

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

describe("PertinenciaSchema (filtro de pertinencia, punto 2 del plan)", () => {
  it("acepta salida binaria válida con razón", () => {
    const resultado = PertinenciaSchema.safeParse({ pertinente: false, razon: "Texto genérico intercambiable." });
    expect(resultado.success).toBe(true);
  });

  it("rechaza sin razón", () => {
    const resultado = PertinenciaSchema.safeParse({ pertinente: true });
    expect(resultado.success).toBe(false);
  });

  it("rechaza valor no booleano", () => {
    const resultado = PertinenciaSchema.safeParse({ pertinente: "quizás", razon: "N/A" });
    expect(resultado.success).toBe(false);
  });
});

describe("promptPertinencia", () => {
  it("incluye el estímulo y la respuesta", () => {
    const prompt = promptPertinencia("Estímulo X", "Respuesta Y");
    expect(prompt).toContain("Estímulo X");
    expect(prompt).toContain("Respuesta Y");
  });
});

describe("rúbricas ancladas (punto 3 del plan)", () => {
  it("los prompts exigen la regla de no premiar texto genérico", () => {
    expect(promptComprension("X")).toContain("genérico");
    expect(promptArgumentacion("X")).toContain("genérico");
  });

  it("los niveles 4 y 5 exigen evidencia concreta del estímulo", () => {
    expect(promptComprension("X")).toContain("EXIGEN evidencia concreta");
    expect(promptArgumentacion("X")).toContain("EXIGEN evidencia concreta");
  });
});

describe("rate limit", () => {
  it("9 llamadas por sesión (pertinencia + rúbrica + doble evaluación × 2 intentos)", () => {
    expect(RATE_LIMIT_POR_SESSION).toBe(9);
  });
});
