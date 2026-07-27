import { describe, expect, it } from "vitest";
import { itemsRotacion, itemPracticaRotacion, itemPracticaPlegado } from "@/lib/data/rotacion";
import { esEspejada, transformarPieza } from "@/lib/logic/piezaOrigami";
import { combinacionesReflejo, type Eje, type Punto, type ItemPlegado } from "@/lib/logic/rotacion";

const itemsPlegado = itemsRotacion.filter((i): i is ItemPlegado => i.tipo === "plegado");

function puntosStr(puntos: Punto[]): string {
  return puntos.map((p) => `(${p.x.toFixed(2)},${p.y.toFixed(2)})`).sort().join(" ");
}

describe("itemsRotacion (ahora 10 ítems de plegado)", () => {
  it("tiene 10 ítems, todos de tipo plegado, con rampa 4/4/2", () => {
    expect(itemsRotacion).toHaveLength(10);
    itemsRotacion.forEach((item) => {
      expect(item.tipo, `${item.id} debe ser plegado`).toBe("plegado");
    });

    expect(itemsRotacion.filter((i) => i.dificultad === "facil")).toHaveLength(4);
    expect(itemsRotacion.filter((i) => i.dificultad === "media")).toHaveLength(4);
    expect(itemsRotacion.filter((i) => i.dificultad === "dificil")).toHaveLength(2);
  });

  it("cada ítem tiene exactamente 4 alternativas únicas y un índice correcto válido", () => {
    for (const item of itemsPlegado) {
      expect(item.alternativas).toHaveLength(4);
      expect(item.indiceCorrecto).toBeGreaterThanOrEqual(0);
      expect(item.indiceCorrecto).toBeLessThan(4);

      const claves = item.alternativas.map((a) => puntosStr(a.puntos));
      expect(new Set(claves).size, `${item.id}: alternativas únicas`).toBe(4);
    }
  });

  it("todos los ids son únicos", () => {
    const ids = itemsRotacion.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("cada ítem fácil tiene 1 pliegue y 1 perforación", () => {
    for (const item of itemsPlegado) {
      if (item.dificultad !== "facil") continue;
      expect(item.pliegues).toHaveLength(1);
      expect(item.puntos).toHaveLength(1);
    }
  });

  it("cada ítem medio tiene estructura variada (1 pliegue+2 puntos, o 2 pliegues+1 punto)", () => {
    for (const item of itemsPlegado) {
      if (item.dificultad !== "media") continue;
      const valido =
        (item.pliegues.length === 1 && item.puntos.length === 2) ||
        (item.pliegues.length === 2 && item.puntos.length === 1);
      expect(valido, `${item.id}: estructura media válida`).toBe(true);
    }
  });

  it("cada ítem difícil tiene diagonal o 2 pliegues+2 puntos", () => {
    for (const item of itemsPlegado) {
      if (item.dificultad !== "dificil") continue;
      const diagonal = item.pliegues.some((e) => e === "diagonal");
      const compuesto = item.pliegues.length === 2 && item.puntos.length === 2;
      expect(diagonal || compuesto, `${item.id}: estructura difícil válida`).toBe(true);
    }
  });

  // Punto 6 del bloqueante: la respuesta correcta es el REFLEJO real del punto original
  // a través de TODOS los pliegues en secuencia. Recalculamos y verificamos.
  it("la alternativa correcta refleja todos los puntos originales a través de todos los pliegues", () => {
    for (const item of itemsPlegado) {
      const correcta = item.alternativas[item.indiceCorrecto];
      const esperada = item.puntos.flatMap((p) => combinacionesReflejo(p, item.pliegues)).sort(
        (a, b) => a.x - b.x || a.y - b.y
      );
      const obtenida = [...correcta.puntos].sort(
        (a, b) => a.x - b.x || a.y - b.y
      );

      for (let pi = 0; pi < esperada.length; pi++) {
        expect(Math.abs(obtenida[pi].x - esperada[pi].x)).toBeLessThan(1e-9);
        expect(Math.abs(obtenida[pi].y - esperada[pi].y)).toBeLessThan(1e-9);
      }
    }
  });

  // Las alternativas incorrectas NO son iguales al reflejo correcto
  it("ningún distractor coincide con la respuesta correcta", () => {
    for (const item of itemsPlegado) {
      const correcta = item.alternativas[item.indiceCorrecto];
      const correctaStr = puntosStr(correcta.puntos);
      item.alternativas.forEach((alt, i) => {
        if (i === item.indiceCorrecto) return;
        expect(puntosStr(alt.puntos), `${item.id} distractor ${i}`).not.toBe(correctaStr);
      });
    }
  });

  // Punto 4: alternativas distinguibles a simple vista
  it("ninguna alternativa tiene todos los puntos iguales a otra", () => {
    for (const item of itemsPlegado) {
      for (let i = 0; i < item.alternativas.length; i++) {
        for (let j = i + 1; j < item.alternativas.length; j++) {
          const puntosI = puntosStr(item.alternativas[i].puntos);
          const puntosJ = puntosStr(item.alternativas[j].puntos);
          expect(puntosI, `${item.id}: alternativas ${i} y ${j}`).not.toBe(puntosJ);
        }
      }
    }
  });

  // Invariante física: todas las perforaciones de un ítem se hacen sobre el mismo paquete
  // doblado, así que deben caer del mismo lado de cada pliegue no-diagonal. Si dos puntos
  // quedan en lados opuestos, el papel doblado que se dibuja (mitad/cuarto) es geométricamente
  // imposible de perforar con un solo golpe. Bug real detectado en rot-10 (puntos en cuadrantes
  // opuestos de vertical+horizontal): esta prueba lo habría atrapado.
  it("todos los puntos de un ítem caen del mismo lado de cada pliegue no-diagonal", () => {
    for (const item of itemsPlegado) {
      const ejesNoDiagonales = item.pliegues.filter((e): e is "vertical" | "horizontal" => e !== "diagonal");
      for (const eje of ejesNoDiagonales) {
        const lados = item.puntos.map((p) => (eje === "vertical" ? p.x > 0.5 : p.y > 0.5));
        expect(new Set(lados).size, `${item.id}: puntos deben compartir lado en eje ${eje}`).toBe(1);
      }
    }
  });
});

describe("itemPracticaRotacion", () => {
  it("la correcta nunca está espejada; los distractores sí", () => {
    if (itemPracticaRotacion.tipo !== "rotacion") return;
    itemPracticaRotacion.alternativas.forEach((alt, i) => {
      const espejadaReal = esEspejada(transformarPieza(alt.anguloDeg, alt.espejada));
      if (i === itemPracticaRotacion.indiceCorrecto) {
        expect(espejadaReal).toBe(false);
      } else {
        expect(espejadaReal).toBe(true);
      }
    });
  });
});

describe("itemPracticaPlegado", () => {
  it("la alternativa correcta refleja el punto sobre el eje vertical (1 pliegue, 1 punto)", () => {
    if (itemPracticaPlegado.tipo !== "plegado") return;
    const reflejarVertical = (p: Punto) => ({ x: 1 - p.x, y: p.y });
    itemPracticaPlegado.alternativas.forEach((alt, i) => {
      const reflejoEsperado = reflejarVertical(itemPracticaPlegado.puntos[0]);
      const correctaReflejada = i === itemPracticaPlegado.indiceCorrecto;
      const tieneReflejo = alt.puntos.some(
        (p) => Math.abs(p.x - reflejoEsperado.x) < 1e-9 && Math.abs(p.y - reflejoEsperado.y) < 1e-9
      );
      expect(tieneReflejo, `alternativa ${i} ${correctaReflejada ? "debe" : "no debe"} contener el reflejo`).toBe(correctaReflejada);
    });
  });

  it("tiene 4 alternativas únicas", () => {
    if (itemPracticaPlegado.tipo !== "plegado") return;
    const claves = itemPracticaPlegado.alternativas.map((a) => puntosStr(a.puntos));
    expect(new Set(claves).size).toBe(4);
  });
});
