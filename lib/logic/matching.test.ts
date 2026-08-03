import { describe, it, expect } from "vitest";
import { recomendarCarreras } from "@/lib/logic/matching";
import { carreras } from "@/lib/data/carreras";
import type { PuntajeDimension } from "@/lib/logic/puntaje";
import type { PuntajesCognitivo } from "@/lib/logic/puntajeCognitivo";
import type { DimensionCodigo } from "@/lib/data/contextos";

function dimensionMock(codigo: DimensionCodigo, puntaje: number): PuntajeDimension {
  return { dimension: codigo, etiqueta: codigo, puntajeBruto: puntaje, puntajeMaximo: 100, puntaje };
}

const COGNITIVO_PROMEDIO: PuntajesCognitivo = { patrones: 50, espacial: 50, memoria: 50, comunicacion: 50 };

describe("recomendarCarreras", () => {
  it("retorna 3 carreras incluso con puntajes vacíos", () => {
    const resultado = recomendarCarreras([], COGNITIVO_PROMEDIO);
    expect(resultado).toHaveLength(3);
    expect(resultado.every((r) => r.pesoIntereses === 0)).toBe(true);
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

    const resultado = recomendarCarreras(puntajes, COGNITIVO_PROMEDIO, { limite: 60 });
    for (let i = 0; i < resultado.length - 1; i++) {
      expect(resultado[i].puntajeCompuesto).toBeGreaterThanOrEqual(resultado[i + 1].puntajeCompuesto);
    }
  });

  it("dimensión dominante posiciona carreras de esa área primero", () => {
    const soloSalud = [
      dimensionMock("sal" as DimensionCodigo, 100),
      dimensionMock("tec" as DimensionCodigo, 0),
      dimensionMock("cie" as DimensionCodigo, 0),
      dimensionMock("cre" as DimensionCodigo, 0),
      dimensionMock("soc" as DimensionCodigo, 0),
      dimensionMock("ges" as DimensionCodigo, 0),
      dimensionMock("dat" as DimensionCodigo, 0),
      dimensionMock("nat" as DimensionCodigo, 0),
    ];

    const resultado = recomendarCarreras(soloSalud, COGNITIVO_PROMEDIO);
    expect(resultado[0].carrera.area.principal).toBe("sal");
    // La carrera con más peso de "sal" en su área debe estar en el top.
    const maxPesoSal = Math.max(
      ...carreras.map((c) => {
        const secundaria = c.area.secundarias?.find((s) => s.codigo === "sal")?.peso ?? 0;
        return (c.area.principal === "sal" ? 1 - (c.area.secundarias ?? []).reduce((a, s) => a + s.peso, 0) : 0) + secundaria;
      })
    );
    const top = resultado.find((r) => {
      const secundaria = r.carrera.area.secundarias?.find((s) => s.codigo === "sal")?.peso ?? 0;
      const principal = r.carrera.area.principal === "sal" ? 1 - (r.carrera.area.secundarias ?? []).reduce((a, s) => a + s.peso, 0) : 0;
      return principal + secundaria === maxPesoSal;
    });
    expect(top).toBeDefined();
    expect(resultado[0].pesoIntereses).toBeGreaterThanOrEqual(top!.pesoIntereses);
  });

  it("capacidad dominante posiciona la carrera con mayor peso cognitivo", () => {
    const soloEspacial: PuntajesCognitivo = { patrones: 0, espacial: 100, memoria: 0, comunicacion: 0 };
    const resultado = recomendarCarreras([], soloEspacial);

    const maxEspacial = Math.max(...carreras.map((c) => c.perfilCognitivo.espacial ?? 0));
    expect(resultado[0].carrera.perfilCognitivo.espacial).toBe(maxEspacial);
  });

  it("numerico usa el puntaje medido de patrones (batería no lo separa aún)", () => {
    const soloPatrones: PuntajesCognitivo = { patrones: 100, espacial: 0, memoria: 0, comunicacion: 0 };
    const resultado = recomendarCarreras([], soloPatrones);

    const maxPatronesNumerico = Math.max(
      ...carreras.map((c) => (c.perfilCognitivo.patrones ?? 0) + (c.perfilCognitivo.numerico ?? 0))
    );
    const topSuma = (resultado[0].carrera.perfilCognitivo.patrones ?? 0) + (resultado[0].carrera.perfilCognitivo.numerico ?? 0);
    expect(topSuma).toBe(maxPatronesNumerico);
  });

  it("compone 55% intereses / 45% capacidades", () => {
    const medicina = recomendarCarreras(
      [dimensionMock("sal" as DimensionCodigo, 100), dimensionMock("cie" as DimensionCodigo, 0)],
      COGNITIVO_PROMEDIO,
      { limite: 60 }
    ).find((r) => r.carrera.id === "medicina");

    expect(medicina).toBeDefined();
    // interés: 0.7×100 + 0.3×0 = 70; capacidad: 50; compuesto: round(0.55×70 + 0.45×50) = 61
    expect(medicina!.pesoIntereses).toBe(70);
    expect(medicina!.pesoCapacidades).toBe(50);
    expect(medicina!.puntajeCompuesto).toBe(61);
  });

  it("respeta límite y peso de intereses configurables", () => {
    const cinco = recomendarCarreras([], COGNITIVO_PROMEDIO, { limite: 5 });
    expect(cinco).toHaveLength(5);

    const conPeso = recomendarCarreras(
      [dimensionMock("sal" as DimensionCodigo, 100), dimensionMock("cie" as DimensionCodigo, 0)],
      COGNITIVO_PROMEDIO,
      { limite: 60, pesoIntereses: 0.3 }
    ).find((r) => r.carrera.id === "medicina");
    // round(0.3×70 + 0.7×50) = round(56) = 56
    expect(conPeso!.puntajeCompuesto).toBe(56);
  });

  it("desempata alfabéticamente de forma determinista", () => {
    const todas = recomendarCarreras([], COGNITIVO_PROMEDIO, { limite: 60 });
    expect(todas).toHaveLength(carreras.length);
    for (let i = 0; i < todas.length - 1; i++) {
      const a = todas[i];
      const b = todas[i + 1];
      expect(a.puntajeCompuesto).toBeGreaterThanOrEqual(b.puntajeCompuesto);
      if (a.puntajeCompuesto === b.puntajeCompuesto) {
        expect(a.carrera.nombre.localeCompare(b.carrera.nombre, "es")).toBeLessThanOrEqual(0);
      }
    }
  });
});
