import { describe, it, expect } from "vitest";
import { recomendarAreas, generarPerfil } from "@/lib/logic/matching";
import type { PuntajeDimension } from "@/lib/logic/puntaje";
import type { PuntajesCognitivo } from "@/lib/logic/puntajeCognitivo";
import type { DimensionCodigo } from "@/lib/data/contextos";

function dimensionMock(codigo: DimensionCodigo, puntaje: number): PuntajeDimension {
  return { dimension: codigo, etiqueta: codigo, puntajeBruto: puntaje, puntajeMaximo: 100, puntaje };
}

const PUNTAJES_VACIO: PuntajeDimension[] = [];
const COGNITIVO_PROMEDIO: PuntajesCognitivo = { patrones: 50, espacial: 50, memoria: 50, comunicacion: 50 };

describe("recomendarAreas", () => {
  it("retorna 3 áreas incluso con puntajes vacíos", () => {
    const resultado = recomendarAreas(PUNTAJES_VACIO, COGNITIVO_PROMEDIO);
    expect(resultado).toHaveLength(3);
  });

  it("ordena por puntaje compuesto descendente", () => {
    const puntajes = [
      dimensionMock("tec" as DimensionCodigo, 90),
      dimensionMock("cie" as DimensionCodigo, 80),
      dimensionMock("cre" as DimensionCodigo, 70),
      dimensionMock("soc" as DimensionCodigo, 60),
      dimensionMock("sal" as DimensionCodigo, 50),
      dimensionMock("ges" as DimensionCodigo, 40),
      dimensionMock("dat" as DimensionCodigo, 30),
      dimensionMock("nat" as DimensionCodigo, 20),
    ];

    const resultado = recomendarAreas(puntajes, COGNITIVO_PROMEDIO);
    expect(resultado[0].puntajeCompuesto).toBeGreaterThanOrEqual(resultado[1].puntajeCompuesto);
    expect(resultado[1].puntajeCompuesto).toBeGreaterThanOrEqual(resultado[2].puntajeCompuesto);
  });

  it("área con dimensión de alto puntaje aparece primera", () => {
    const puntajesTec = [
      dimensionMock("tec" as DimensionCodigo, 100),
      dimensionMock("cie" as DimensionCodigo, 0),
      dimensionMock("cre" as DimensionCodigo, 0),
      dimensionMock("soc" as DimensionCodigo, 0),
      dimensionMock("sal" as DimensionCodigo, 0),
      dimensionMock("ges" as DimensionCodigo, 0),
      dimensionMock("dat" as DimensionCodigo, 0),
      dimensionMock("nat" as DimensionCodigo, 0),
    ];

    const resultado = recomendarAreas(puntajesTec, COGNITIVO_PROMEDIO);
    // "Construcción y Obra" tiene dimensión "tec"
    const construccion = resultado.find((a) => a.area.id === "construccion-obra");
    expect(construccion).toBeDefined();
    expect(resultado[0].area.id).toBe("construccion-obra");
  });
});

describe("generarPerfil", () => {
  it("incluye top 3 dimensiones", () => {
    const puntajes = [
      dimensionMock("tec" as DimensionCodigo, 90),
      dimensionMock("cie" as DimensionCodigo, 80),
      dimensionMock("cre" as DimensionCodigo, 70),
      dimensionMock("soc" as DimensionCodigo, 10),
    ];
    const perfil = generarPerfil(puntajes, COGNITIVO_PROMEDIO, null);
    expect(perfil.top3Dimensiones).toHaveLength(3);
    expect(perfil.top3Dimensiones[0].dimension).toBe("tec");
  });

  it("incluye puntaje verbal nulo", () => {
    const perfil = generarPerfil([], COGNITIVO_PROMEDIO, null);
    expect(perfil.puntajeVerbal).toBeNull();
  });
});
