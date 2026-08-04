import { describe, it, expect } from "vitest";
import {
  normalizarTexto,
  nGramas,
  solapamientoLiteral,
  esCopiaLiteral,
  UMBRAL_SOLAPAMIENTO,
} from "@/lib/logic/verbal";

const ESTIMULO =
  "En Chile, la producción de cobre representa aproximadamente el 10% del PIB nacional. La minería se concentra principalmente en el norte del país.";

describe("normalizarTexto", () => {
  it("colapsa mayúsculas, puntuación y espacios", () => {
    expect(normalizarTexto("¡Hola,  MUNDO!")).toBe("hola mundo");
  });

  it("conserva números", () => {
    expect(normalizarTexto("10% del PIB")).toBe("10 del pib");
  });
});

describe("nGramas", () => {
  it("genera trigramas de palabras", () => {
    expect(nGramas("uno dos tres cuatro")).toEqual(
      new Set(["uno dos tres", "dos tres cuatro"])
    );
  });

  it("devuelve vacío para texto corto", () => {
    expect(nGramas("hola mundo").size).toBe(0);
  });
});

describe("solapamientoLiteral", () => {
  it("respuesta idéntica al estímulo: solapamiento alto", () => {
    expect(solapamientoLiteral(ESTIMULO, ESTIMULO)).toBeGreaterThanOrEqual(0.9);
  });

  it("respuesta sin relación: solapamiento 0", () => {
    const respuesta = "Me gusta jugar fútbol los fines de semana con mis amigos del barrio.";
    expect(solapamientoLiteral(respuesta, ESTIMULO)).toBe(0);
  });

  it("respuesta que parafrasea con frases del estímulo: solapamiento parcial", () => {
    const respuesta =
      "El texto dice que la producción de cobre representa el 10% del PIB nacional y que la minería se concentra en el norte.";
    const ratio = solapamientoLiteral(respuesta, ESTIMULO);
    expect(ratio).toBeGreaterThan(0);
    expect(ratio).toBeLessThan(0.9);
  });
});

describe("esCopiaLiteral", () => {
  it("copia literal del estímulo → true", () => {
    expect(esCopiaLiteral(ESTIMULO.slice(0, 200), ESTIMULO)).toBe(true);
  });

  it("respuesta propia original → false", () => {
    const respuesta =
      "Yo creo que la minería genera harto empleo en el norte, pero también me preocupa el tema del agua. Por eso me parece interesante que estén usando agua de mar desalinizada para no gastar agua fresca. Al final, el desafío es producir sin destruir el medio ambiente, y eso requiere inversión en tecnología.";
    expect(esCopiaLiteral(respuesta, ESTIMULO)).toBe(false);
  });
});

describe("umbral documentado", () => {
  it("el umbral de copia literal está fijado en 0.6", () => {
    expect(UMBRAL_SOLAPAMIENTO).toBe(0.6);
  });
});
