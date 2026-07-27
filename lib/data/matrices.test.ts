import { describe, expect, it } from "vitest";
import { itemsMatrices, itemPracticaMatrices, itemPracticaMatrices2 } from "@/lib/data/matrices";
import { calcularCelda } from "@/lib/logic/matrices";
import { figurasColisionanVisualmente } from "@/lib/logic/figuraOrigami";

describe("itemsMatrices", () => {
  it("tiene 12 ítems con la rampa de dificultad 4 fáciles / 5 medias / 3 difíciles", () => {
    expect(itemsMatrices).toHaveLength(12);
    expect(itemsMatrices.filter((i) => i.dificultad === "facil")).toHaveLength(4);
    expect(itemsMatrices.filter((i) => i.dificultad === "media")).toHaveLength(5);
    expect(itemsMatrices.filter((i) => i.dificultad === "dificil")).toHaveLength(3);
  });

  it("cada ítem tiene 5 alternativas únicas y un índice correcto válido", () => {
    for (const item of itemsMatrices) {
      expect(item.alternativas).toHaveLength(5);
      expect(item.indiceCorrecto).toBeGreaterThanOrEqual(0);
      expect(item.indiceCorrecto).toBeLessThan(5);

      const claves = item.alternativas.map((a) => JSON.stringify(a));
      expect(new Set(claves).size).toBe(5);
    }
  });

  it("todos los ids son únicos", () => {
    const ids = itemsMatrices.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("el ítem de práctica también es válido y no está en el set puntuable", () => {
    expect(itemPracticaMatrices.alternativas).toHaveLength(5);
    expect(itemsMatrices.some((i) => i.id === itemPracticaMatrices.id)).toBe(false);
  });

  // Punto 7 del bloqueante: el generador debe construir desde la regla (regla → figuras),
  // nunca figuras sueltas. Recomputamos CADA celda de la grilla (las 3 filas y las 3 columnas,
  // ambas direcciones a la vez) desde las reglas declaradas del ítem y verificamos que coincide
  // exactamente con lo que se muestra. Esto habría detectado el bug de Evidencia 1 (tablero
  // hardcodeado sin relación con ninguna regla).
  it("cada celda de la grilla es derivable de las reglas declaradas (fila y columna)", () => {
    for (const item of itemsMatrices) {
      for (let fila = 0; fila < 3; fila++) {
        for (let columna = 0; columna < 3; columna++) {
          const esperada = calcularCelda(item.reglas, fila, columna);
          const real = item.grilla[fila * 3 + columna];
          expect(real, `${item.id} celda (${fila},${columna})`).toEqual(esperada);
        }
      }
      const esperadaRespuesta = calcularCelda(item.reglas, 2, 2);
      expect(item.alternativas[item.indiceCorrecto], `${item.id} respuesta correcta`).toEqual(
        esperadaRespuesta
      );
    }
  });

  // Punto 4 del bloqueante: dos alternativas nunca pueden ser visualmente indistinguibles —
  // mismo lados + relleno + pliegues y rotación congruente módulo la simetría del polígono
  // (p.ej. un cuadrado rotado 90° es geométricamente el mismo cuadrado).
  it("ninguna alternativa colisiona visualmente con otra (mismo lados/relleno/pliegues y rotación congruente mod simetría)", () => {
    const todosLosItems = [...itemsMatrices, itemPracticaMatrices, itemPracticaMatrices2];
    for (const item of todosLosItems) {
      for (let i = 0; i < item.alternativas.length; i++) {
        for (let j = i + 1; j < item.alternativas.length; j++) {
          const colisiona = figurasColisionanVisualmente(item.alternativas[i], item.alternativas[j]);
          expect(colisiona, `${item.id}: alternativas ${i} y ${j} son indistinguibles`).toBe(false);
        }
      }
    }
  });
});
