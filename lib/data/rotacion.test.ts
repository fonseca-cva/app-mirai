import { describe, expect, it } from "vitest";
import { itemsRotacion, itemPracticaPlegado, itemPracticaPlegado2 } from "@/lib/data/rotacion";
import { combinacionesReflejo, type Eje, type Punto, type ItemPlegado } from "@/lib/logic/rotacion";

const itemsPlegado = itemsRotacion.filter((i): i is ItemPlegado => i.tipo === "plegado");

function puntosStr(puntos: Punto[]): string {
  return puntos.map((p) => `(${p.x.toFixed(2)},${p.y.toFixed(2)})`).sort().join(" ");
}

describe("itemsRotacion (ahora 7 ítems de plegado)", () => {
  it("tiene 7 ítems, todos de tipo plegado, con rampa 3/3/1", () => {
    expect(itemsRotacion).toHaveLength(7);
    itemsRotacion.forEach((item) => {
      expect(item.tipo, `${item.id} debe ser plegado`).toBe("plegado");
    });

    expect(itemsRotacion.filter((i) => i.dificultad === "facil")).toHaveLength(3);
    expect(itemsRotacion.filter((i) => i.dificultad === "media")).toHaveLength(3);
    expect(itemsRotacion.filter((i) => i.dificultad === "dificil")).toHaveLength(1);
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

describe("prácticas de plegado (2, ambas escritas a mano)", () => {
  const practicas = [itemPracticaPlegado, itemPracticaPlegado2] as const;

  it("ambas son de tipo plegado y tienen 4 alternativas únicas", () => {
    for (const p of practicas) {
      expect(p.tipo).toBe("plegado");
      expect(p.alternativas).toHaveLength(4);
      const claves = p.alternativas.map((a) => puntosStr(a.puntos));
      expect(new Set(claves).size).toBe(4);
    }
  });

  it("la alternativa correcta refleja el punto sobre el eje del pliegue", () => {
    const reflejar = (p: Punto, eje: Eje) => (eje === "vertical" ? { x: 1 - p.x, y: p.y } : { x: p.x, y: 1 - p.y });
    for (const p of practicas) {
      const eje = p.pliegues[0]!;
      const reflejoEsperado = reflejar(p.puntos[0], eje);
      p.alternativas.forEach((alt, i) => {
        const esCorrecta = i === p.indiceCorrecto;
        const tieneReflejo = alt.puntos.some(
          (pt) => Math.abs(pt.x - reflejoEsperado.x) < 1e-9 && Math.abs(pt.y - reflejoEsperado.y) < 1e-9
        );
        expect(tieneReflejo, `${p.id} alternativa ${i} ${esCorrecta ? "debe" : "no debe"} contener el reflejo`).toBe(esCorrecta);
      });
    }
  });

  it("ninguna práctica usa rotación mental (sin ángulos ni espejados)", () => {
    for (const p of practicas) {
      expect(p.tipo).toBe("plegado");
      expect("anguloReferencia" in p).toBe(false);
      expect("anguloDeg" in p.alternativas[0]).toBe(false);
    }
  });
});
