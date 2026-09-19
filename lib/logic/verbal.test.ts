import { describe, it, expect } from "vitest";
import {
  normalizarTexto,
  nGramas,
  solapamientoLiteral,
  esCopiaLiteral,
  UMBRAL_SOLAPAMIENTO,
  indicesEstimuloVerbal,
  estimuloVerbalDe,
} from "@/lib/logic/verbal";
import { TEXTOS_COMPRENSION, DILEMAS_ARGUMENTACION, CONSIGNAS_EXPRESION } from "@/lib/config/rubricas";

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

// Test de regresión (bug reportado por Camilo, 2026-09-09): /api/debug/evaluar
// evaluaba SIEMPRE contra el estímulo [0] mientras BloqueVerbal.tsx mostraba el
// estímulo derivado del sessionId — el filtro de pertinencia funcionaba bien,
// pero comparaba contra el texto equivocado. La corrección centraliza la
// derivación de índices y la selección de estímulo en estas dos funciones, para
// que el cliente y AMBAS rutas de evaluación (/api/evaluar, /api/debug/evaluar)
// no puedan volver a divergir. Este test verifica esa correspondencia
// directamente sobre la fuente única de verdad.
describe("indicesEstimuloVerbal + estimuloVerbalDe — estímulo mostrado === estímulo evaluado", () => {
  it("sin sessionId, cae en el índice 0 para las 3 tareas (mismo default que antes)", () => {
    const indices = indicesEstimuloVerbal(null);
    expect(indices).toEqual({ indiceTexto: 0, indiceDilema: 0, indiceExpresion: 0 });
    expect(estimuloVerbalDe("comprension", indices)).toBe(TEXTOS_COMPRENSION[0]);
    expect(estimuloVerbalDe("argumentacion", indices)).toBe(DILEMAS_ARGUMENTACION[0]);
    expect(estimuloVerbalDe("expresion", indices)).toBe(CONSIGNAS_EXPRESION[0]);
  });

  it("para un mismo sessionId, el índice derivado siempre selecciona el MISMO estímulo (determinístico)", () => {
    const sessionId = "b3f1c2d4-aaaa-4bbb-8ccc-000000000001";
    const primeraLectura = indicesEstimuloVerbal(sessionId);
    const segundaLectura = indicesEstimuloVerbal(sessionId);
    expect(segundaLectura).toEqual(primeraLectura);
  });

  it("REGRESIÓN: para varios sessionId distintos, el estímulo que 'vería' el alumno (misma fórmula que BloqueVerbal.tsx) es EXACTAMENTE el que el evaluador recibiría — nunca queda fijo en [0]", () => {
    const sessionIds = [
      "s0000000-0000-0000-0000-000000000000", // charCodeAt(0) = 's' → no cae en 0 por azar
      "zzz00000-0000-0000-0000-000000000000",
      "abc00000-0000-0000-0000-000000000000",
      "qed00000-0000-0000-0000-000000000000",
    ];

    for (const sessionId of sessionIds) {
      const indices = indicesEstimuloVerbal(sessionId);

      // Lo que el alumno vería (fórmula que usa BloqueVerbal.tsx para elegir el
      // texto/dilema/consigna a mostrar), calculado independientemente acá:
      const esperadoComprension = TEXTOS_COMPRENSION[sessionId.charCodeAt(0) % TEXTOS_COMPRENSION.length];
      const esperadoArgumentacion = DILEMAS_ARGUMENTACION[sessionId.charCodeAt(1) % DILEMAS_ARGUMENTACION.length];
      const esperadoExpresion = CONSIGNAS_EXPRESION[sessionId.charCodeAt(2) % CONSIGNAS_EXPRESION.length];

      // Lo que el evaluador recibiría con esos mismos índices:
      expect(estimuloVerbalDe("comprension", indices)).toBe(esperadoComprension);
      expect(estimuloVerbalDe("argumentacion", indices)).toBe(esperadoArgumentacion);
      expect(estimuloVerbalDe("expresion", indices)).toBe(esperadoExpresion);
    }
  });

  it("índices fuera de rango u omitidos no revientan: caen a un elemento válido del arreglo", () => {
    expect(estimuloVerbalDe("comprension", {})).toBe(TEXTOS_COMPRENSION[0]);
    expect(estimuloVerbalDe("argumentacion", {})).toBe(DILEMAS_ARGUMENTACION[0]);
    expect(estimuloVerbalDe("expresion", {})).toBe(CONSIGNAS_EXPRESION[0]);
  });
});
