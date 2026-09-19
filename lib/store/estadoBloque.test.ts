// ESTADOS DE BLOQUE: pendiente · último ítem · completo (pilot readiness).
//
// Cierra el crash de "recargar un bloque ya terminado": `siguienteIndicePendiente`
// devuelve `catalogo.length` cuando todas las respuestas están presentes, y los
// componentes hacían `catalogo[indice]` → `undefined` → acceso a `.id`/`.nombre`.
//
// `estadoBloque` (lib/store/checkpoints.ts) encapsula los tres estados y es lo que
// los componentes consumen ahora. Se prueban contra los CATÁLOGOS REALES para que
// la cobertura sea la de producción y no un fixture inventado.

import { describe, it, expect } from "vitest";
import { estadoBloque, siguienteIndicePendiente, bloqueCompleto } from "@/lib/store/checkpoints";
import { actividades } from "@/lib/data/actividades";
import { asignaturas } from "@/lib/data/asignaturas";
import { contextos } from "@/lib/data/contextos";
import { OBJETOS_DIVERGENTE } from "@/lib/data/divergente";

const catalogo = actividades;

describe("estadoBloque — pendiente", () => {
  it("sin respuestas: primer ítem, no es último (si el catálogo tiene más de 1)", () => {
    const e = estadoBloque(catalogo, [], 0);
    expect(e.estado).toBe("pendiente");
    expect(e.item?.id).toBe(catalogo[0].id);
    expect(e.indice).toBe(0);
    expect(e.esUltimo).toBe(catalogo.length === 1);
  });

  it("a mitad: ítem correcto según el índice", () => {
    const e = estadoBloque(catalogo, [], 7);
    expect(e.estado).toBe("pendiente");
    expect(e.item?.id).toBe(catalogo[7].id);
  });
});

describe("estadoBloque — último ítem", () => {
  it("en el último índice: pendiente y esUltimo=true", () => {
    const ultimo = catalogo.length - 1;
    const e = estadoBloque(catalogo, [], ultimo);
    expect(e.estado).toBe("pendiente");
    expect(e.esUltimo).toBe(true);
    expect(e.item?.id).toBe(catalogo[ultimo].id);
  });

  it("con el penúltimo respondido y el último SIN responder: sigue pendiente y esUltimo", () => {
    const respondidas = catalogo.slice(0, catalogo.length - 1).map((x) => x.id);
    // El índice derivado apunta al último pendiente.
    const idx = siguienteIndicePendiente(catalogo, respondidas);
    expect(idx).toBe(catalogo.length - 1);
    const e = estadoBloque(catalogo, respondidas, idx);
    expect(e.estado).toBe("pendiente");
    expect(e.esUltimo).toBe(true);
    expect(e.item).not.toBeNull();
  });
});

describe("estadoBloque — completo (el caso que crasheaba)", () => {
  it("todas las respuestas: estado completo, item null, NO undefined", () => {
    const respondidas = catalogo.map((x) => x.id);
    const idx = siguienteIndicePendiente(catalogo, respondidas);
    // El índice derivado es igual al largo del catálogo: indexarlo daba undefined.
    expect(idx).toBe(catalogo.length);

    const e = estadoBloque(catalogo, respondidas, idx);
    expect(e.estado).toBe("completo");
    expect(e.item).toBeNull();
    // Explícito: no es undefined, para que el componente deba manejarlo.
    expect(e.item).not.toBeUndefined();
    expect(e.esUltimo).toBe(true);
  });

  it("índice IGUAL al largo sin respuestas completas: también es completo (no explota)", () => {
    // Estado incoherente posible tras un cambio de catálogo: el índice quedó en el
    // final aunque falten respuestas. Debe resolverse como completo, no crashear.
    const e = estadoBloque(catalogo, [], catalogo.length);
    expect(e.estado).toBe("completo");
    expect(e.item).toBeNull();
  });

  it("índice MAYOR que el catálogo (corrupto): se acota y no lee fuera de rango", () => {
    const e = estadoBloque(catalogo, [], catalogo.length + 99);
    expect(e.estado).toBe("completo");
    expect(e.item).toBeNull();
  });

  it("índice NEGATIVO: se acota a 0 y devuelve el primer ítem", () => {
    const e = estadoBloque(catalogo, [], -5);
    expect(e.estado).toBe("pendiente");
    expect(e.item?.id).toBe(catalogo[0].id);
    expect(e.indice).toBe(0);
  });

  it("catálogo vacío: completo, sin crash", () => {
    const e = estadoBloque([], [], 0);
    expect(e.estado).toBe("completo");
    expect(e.item).toBeNull();
  });
});

describe("estadoBloque contra cada catálogo real", () => {
  // Se tipa cada caso como `{ id: string }[]` para poder recorrerlos en un bucle
  // sin que TypeScript intente unificar los catálogos concretos.
  const casos: Array<{ nombre: string; cat: Array<{ id: string }> }> = [
    { nombre: "actividades", cat: actividades },
    { nombre: "asignaturas", cat: asignaturas },
    { nombre: "contextos (gustos)", cat: contextos },
    { nombre: "divergente", cat: OBJETOS_DIVERGENTE },
  ];

  for (const { nombre, cat } of casos) {
    const clave = (x: { id: string }) => x.id;
    it(`${nombre}: completo al rehidratar no produce item undefined`, () => {
      const respondidas = cat.map(clave);
      expect(bloqueCompleto(cat, respondidas)).toBe(true);
      const idx = siguienteIndicePendiente(cat, respondidas);
      const e = estadoBloque(cat, respondidas, idx);
      expect(e.estado).toBe("completo");
      expect(e.item).toBeNull();
    });

    it(`${nombre}: a medias devuelve el primer pendiente`, () => {
      const respondidas = cat.slice(0, Math.max(1, cat.length - 1)).map(clave);
      const idx = siguienteIndicePendiente(cat, respondidas);
      const e = estadoBloque(cat, respondidas, idx);
      if (cat.length === 1) {
        expect(e.estado).toBe("completo");
      } else {
        expect(e.estado).toBe("pendiente");
        expect(e.item).not.toBeNull();
      }
    });
  }
});
