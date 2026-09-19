import { describe, it, expect, beforeEach, vi } from "vitest";
import { instalarNavegadorFalso, rehidratar, type NavegadorFalso } from "@/lib/store/testNavegador";

let navegador: NavegadorFalso;

beforeEach(() => {
  navegador = instalarNavegadorFalso();
  vi.resetModules();
});

import { siguienteIndicePendiente, bloqueCompleto, respuestasSinJuego, siguienteJuegoPendiente, siguienteTareaPendiente } from "@/lib/store/checkpoints";
import { actividades } from "@/lib/data/actividades";
import { asignaturas } from "@/lib/data/asignaturas";
import { contextos } from "@/lib/data/contextos";
import { itemsMatrices } from "@/lib/data/matrices";
import { itemsSeries } from "@/lib/data/series";
import { itemsPliegues } from "@/lib/data/pliegues";
import { OBJETOS_DIVERGENTE } from "@/lib/data/divergente";

async function recargar() {
  vi.resetModules();
  const mod = await import("@/lib/store/experiencia");
  await rehidratar();
  return mod.useExperienciaStore;
}

async function abrir() {
  const mod = await import("@/lib/store/experiencia");
  // El store usa skipHydration: hay que rehidratar explícitamente, igual
  // que hace la página al montar.
  await rehidratar();
  return mod.useExperienciaStore;
}

// ══════════════════════════════════════════════════════════════════════════
describe("actividades: abre en la primera pendiente", () => {
  it("sin respuestas abre en el ítem 0", () => {
    expect(siguienteIndicePendiente(actividades, [])).toBe(0);
  });

  it("con 5 respondidas abre en el 5 (no repite lo ya respondido)", () => {
    const respondidas = actividades.slice(0, 5).map((a) => a.id);
    expect(siguienteIndicePendiente(actividades, respondidas)).toBe(5);
  });

  it("una respuesta HUÉRFANA (id que no está en el catálogo) no mueve el índice", () => {
    expect(siguienteIndicePendiente(actividades, ["id-que-no-existe"])).toBe(0);
  });

  it("agujero intermedio: abre en el PRIMER pendiente, no después del último", () => {
    // Respondió 0..4 y 7..10. El primero pendiente es el 5.
    const ids = [0, 1, 2, 3, 4, 7, 8, 9, 10].map((i) => actividades[i].id);
    expect(siguienteIndicePendiente(actividades, ids)).toBe(5);
  });

  it("bloque completo → índice = length (el componente cierra el bloque)", () => {
    const todos = actividades.map((a) => a.id);
    expect(siguienteIndicePendiente(actividades, todos)).toBe(actividades.length);
    expect(bloqueCompleto(actividades, todos)).toBe(true);
  });

  it("duplicados en las respuestas no rompen el cálculo", () => {
    const conDuplicados = [actividades[0].id, actividades[0].id, actividades[1].id];
    expect(siguienteIndicePendiente(actividades, conDuplicados)).toBe(2);
  });
});

describe("asignaturas: abre en la primera pendiente", () => {
  it("sin respuestas abre en 0", () => {
    expect(siguienteIndicePendiente(asignaturas, [])).toBe(0);
  });

  it("tras responder 3, abre en 3", () => {
    expect(siguienteIndicePendiente(asignaturas, asignaturas.slice(0, 3).map((a) => a.id))).toBe(3);
  });

  it("con todas respondidas → completa", () => {
    const todas = asignaturas.map((a) => a.id);
    expect(bloqueCompleto(asignaturas, todas)).toBe(true);
  });
});

describe("gustos: abre en el primer contexto pendiente", () => {
  it("sin respuestas abre en 0", () => {
    expect(siguienteIndicePendiente(contextos, [])).toBe(0);
  });

  it("con 12 respondidos abre en 12", () => {
    expect(siguienteIndicePendiente(contextos, contextos.slice(0, 12).map((c) => c.id))).toBe(12);
  });
});

describe("divergente: abre en el primer objeto pendiente", () => {
  it("sin respuestas abre en 0", () => {
    expect(siguienteIndicePendiente(OBJETOS_DIVERGENTE, [])).toBe(0);
  });

  it("con el primero respondido abre en 1", () => {
    expect(siguienteIndicePendiente(OBJETOS_DIVERGENTE, [OBJETOS_DIVERGENTE[0].id])).toBe(1);
  });
});

describe("cognitivo: reanuda en el primer juego incompleto", () => {
  const items = { matrices: itemsMatrices, series: itemsSeries, pliegues: itemsPliegues };
  const orden = ["matrices", "series", "pliegues"] as const;

  it("sin respuestas → matrices", () => {
    expect(siguienteJuegoPendiente(orden, items, [])).toBe("matrices");
  });

  it("matrices completo → series", () => {
    const resp = itemsMatrices.map((i) => ({ juego: "matrices", itemId: i.id }));
    expect(siguienteJuegoPendiente(orden, items, resp)).toBe("series");
  });

  it("matrices incompleto → matrices (no salta al siguiente)", () => {
    const resp = itemsMatrices.slice(0, 3).map((i) => ({ juego: "matrices", itemId: i.id }));
    expect(siguienteJuegoPendiente(orden, items, resp)).toBe("matrices");
  });

  it("matrices y series completos → pliegues", () => {
    const resp = [
      ...itemsMatrices.map((i) => ({ juego: "matrices", itemId: i.id })),
      ...itemsSeries.map((i) => ({ juego: "series", itemId: i.id })),
    ];
    expect(siguienteJuegoPendiente(orden, items, resp)).toBe("pliegues");
  });

  it("un juego incompleto se REINICIA descartando sus respuestas parciales", () => {
    // Requisito: no mezclar intentos. Un juego abandonado a medias se rehace
    // entero; sus respuestas parciales se eliminan explícitamente.
    const respuestas = [
      ...itemsMatrices.slice(0, 4).map((i) => ({ juego: "matrices", itemId: i.id, correcto: true })),
      ...itemsSeries.map((i) => ({ juego: "series", itemId: i.id, correcto: false })),
    ];
    const limpias = respuestasSinJuego(respuestas, "matrices");

    expect(limpias).toHaveLength(itemsSeries.length);
    expect(limpias.every((r) => r.juego === "series")).toBe(true);
    // Y con matrices limpio, vuelve a empezar matrices desde cero.
    expect(siguienteJuegoPendiente(orden, items, limpias)).toBe("matrices");
  });
});

describe("verbal: reanuda en la primera tarea pendiente", () => {
  const orden = ["comprension", "argumentacion", "expresion"] as const;

  it("sin respuestas → comprension", () => {
    expect(siguienteTareaPendiente(orden, [])).toBe("comprension");
  });

  it("comprensión respondida → argumentacion", () => {
    expect(siguienteTareaPendiente(orden, [{ tarea: "comprension", estado: "evaluado" }])).toBe("argumentacion");
  });

  it("una respuesta 'no_evaluado' cuenta como respondida (no se le vuelve a pedir)", () => {
    expect(siguienteTareaPendiente(orden, [{ tarea: "comprension", estado: "no_evaluado" }])).toBe("argumentacion");
  });

  it("las tres respondidas → queda en la última (el bloque cierra)", () => {
    const todas = orden.map((t) => ({ tarea: t, estado: "evaluado" }));
    expect(siguienteTareaPendiente(orden, todas)).toBe("expresion");
  });
});

// ══════════════════════════════════════════════════════════════════════════
describe("mutaciones del store: repetir una respuesta REEMPLAZA, no anexa", () => {
  it("gustos: mismo contextoId → 1 fila, con el valor nuevo", async () => {
    const store = await abrir();
    store.getState().iniciarNuevaExperiencia();
    store.getState().agregarRespuestaGustos({ contextoId: "c1", valor: 0, ayudaAbierta: false, audioActivado: false });
    store.getState().agregarRespuestaGustos({ contextoId: "c1", valor: 2, ayudaAbierta: true, audioActivado: false });

    const r = store.getState().respuestasGustos;
    expect(r).toHaveLength(1);
    expect(r[0].valor).toBe(2);
    expect(r[0].ayudaAbierta).toBe(true);
  });

  it("actividades y asignaturas: misma clave → reemplazo", async () => {
    const store = await abrir();
    store.getState().iniciarNuevaExperiencia();
    store.getState().agregarRespuestaActividad({ actividadId: "a1", valor: 0 });
    store.getState().agregarRespuestaActividad({ actividadId: "a1", valor: 2 });
    store.getState().agregarRespuestaAsignatura({ asignaturaId: "as1", valor: 1 });
    store.getState().agregarRespuestaAsignatura({ asignaturaId: "as1", valor: 0 });

    expect(store.getState().respuestasActividades).toHaveLength(1);
    expect(store.getState().respuestasActividades[0].valor).toBe(2);
    expect(store.getState().respuestasAsignaturas).toHaveLength(1);
    expect(store.getState().respuestasAsignaturas[0].valor).toBe(0);
  });

  it("cognitivo: clave (juego, itemId) → reemplazo; no colisiona entre juegos", async () => {
    const store = await abrir();
    store.getState().iniciarNuevaExperiencia();
    const base = { itemId: "m1", correcto: true, nivel: 1, duracionMs: 100, repetidoPorTimeout: false };
    store.getState().agregarRespuestaCognitivo({ juego: "matrices", ...base, correcto: false });
    store.getState().agregarRespuestaCognitivo({ juego: "matrices", ...base, correcto: true });
    // Mismo itemId en OTRO juego es otra respuesta (la clave incluye el juego).
    store.getState().agregarRespuestaCognitivo({ juego: "series", ...base });

    const r = store.getState().respuestasCognitivo;
    expect(r).toHaveLength(2);
    expect(r.filter((x) => x.juego === "matrices")).toHaveLength(1);
    expect(r.find((x) => x.juego === "matrices")?.correcto).toBe(true);
  });

  it("verbal: misma tarea → reemplazo y conserva el id de la fila pendiente", async () => {
    const store = await abrir();
    store.getState().iniciarNuevaExperiencia();
    // Primer envío: se insertó la fila 'pendiente' con id 77.
    store.getState().agregarRespuestaVerbal({ id: 77, tarea: "comprension", texto: "v1", evaluacion: null, estado: "pendiente" });
    // Reintento tras no pertinente: SIN id (no se debe perder el 77).
    store.getState().agregarRespuestaVerbal({ tarea: "comprension", texto: "v2", evaluacion: null, estado: "no_pertinente", intento: 2 });

    const r = store.getState().respuestasVerbal;
    expect(r).toHaveLength(1);
    expect(r[0].texto).toBe("v2");
    // Sin esto, el sync perdería la referencia y volvería al camino por clave.
    expect(r[0].id).toBe(77);
  });

  it("divergente: mismo objeto → reemplazo", async () => {
    const store = await abrir();
    store.getState().iniciarNuevaExperiencia();
    store.getState().agregarRespuestaDivergente({ objeto: "o1", respuestasTexto: ["a"], cantidad: 1 });
    store.getState().agregarRespuestaDivergente({ objeto: "o1", respuestasTexto: ["a", "b", "c"], cantidad: 3 });

    const r = store.getState().respuestasDivergente;
    expect(r).toHaveLength(1);
    expect(r[0].cantidad).toBe(3);
  });

  it("el payload del bloque completo no lleva claves duplicadas", async () => {
    // Con reemplazo idempotente, el array del store no puede tener dos entradas
    // con la misma clave: por eso el upsert del bloque entero nunca choca consigo
    // mismo contra el índice único de la migración 00020.
    const store = await abrir();
    store.getState().iniciarNuevaExperiencia();
    for (const c of contextos.slice(0, 8)) {
      store.getState().agregarRespuestaGustos({ contextoId: c.id, valor: 1, ayudaAbierta: false, audioActivado: false });
    }
    // Re-responde dos de ellos (como al retroceder o al re-ejecutar un efecto).
    store.getState().agregarRespuestaGustos({ contextoId: contextos[2].id, valor: 2, ayudaAbierta: false, audioActivado: false });
    store.getState().agregarRespuestaGustos({ contextoId: contextos[5].id, valor: 0, ayudaAbierta: false, audioActivado: false });

    const claves = store.getState().respuestasGustos.map((r) => r.contextoId);
    expect(claves).toHaveLength(8);
    expect(new Set(claves).size).toBe(8);
  });
});

// ══════════════════════════════════════════════════════════════════════════
describe("reanudación de bloques tras recarga REAL", () => {
  it("actividades a medias: recarga y el bloque reabre en la pendiente", async () => {
    let store = await abrir();
    const id = store.getState().iniciarNuevaExperiencia();
    store.getState().marcarExperienciaIncompleta();
    for (const a of actividades.slice(0, 7)) {
      store.getState().agregarRespuestaActividad({ actividadId: a.id, valor: 1 });
    }
    store.getState().irAPaso("actividades");

    store = await recargar();

    // El bloque deriva su índice de las respuestas persistidas.
    const respondidas = store.getState().respuestasActividades.map((r) => r.actividadId);
    expect(siguienteIndicePendiente(actividades, respondidas)).toBe(7);
    expect(store.getState().sessionId).toBe(id);
    expect(store.getState().respuestasActividades).toHaveLength(7);
  });

  it("cognitivo con matrices completo: recarga y reanuda en series", async () => {
    let store = await abrir();
    store.getState().iniciarNuevaExperiencia();
    store.getState().marcarExperienciaIncompleta();
    for (const i of itemsMatrices) {
      store.getState().agregarRespuestaCognitivo({ juego: "matrices", itemId: i.id, correcto: true, nivel: 1, duracionMs: 100, repetidoPorTimeout: false });
    }
    store.getState().irAPaso("cognitivo");

    store = await recargar();

    const hechos = store.getState().respuestasCognitivo;
    expect(bloqueCompleto(itemsMatrices, hechos.filter((r) => r.juego === "matrices").map((r) => r.itemId))).toBe(true);
    expect(siguienteJuegoPendiente(["matrices", "series", "pliegues"] as const, { matrices: itemsMatrices, series: itemsSeries, pliegues: itemsPliegues }, hechos.map((r) => ({ juego: r.juego, itemId: r.itemId })))).toBe("series");
  });

  it("verbal con comprensión respondida: recarga y reanuda en argumentación", async () => {
    let store = await abrir();
    store.getState().iniciarNuevaExperiencia();
    store.getState().marcarExperienciaIncompleta();
    store.getState().agregarRespuestaVerbal({ tarea: "comprension", texto: "mi texto", evaluacion: null, estado: "evaluado" });
    store.getState().irAPaso("verbal");

    store = await recargar();

    const tarea = siguienteTareaPendiente(
      ["comprension", "argumentacion", "expresion"] as const,
      store.getState().respuestasVerbal.map((r) => ({ tarea: r.tarea, estado: r.estado }))
    );
    expect(tarea).toBe("argumentacion");
    // El intento derivado conserva el 2º intento si ya se había reintentado.
    expect(store.getState().respuestasVerbal[0].tarea).toBe("comprension");
  });

  it("bloque completo tras recargar NO se repite (todas las claves presentes)", async () => {
    let store = await abrir();
    store.getState().iniciarNuevaExperiencia();
    store.getState().marcarExperienciaIncompleta();
    for (const a of asignaturas) store.getState().agregarRespuestaAsignatura({ asignaturaId: a.id, valor: 2 });

    store = await recargar();

    const respondidas = store.getState().respuestasAsignaturas.map((r) => r.asignaturaId);
    expect(bloqueCompleto(asignaturas, respondidas)).toBe(true);
    expect(siguienteIndicePendiente(asignaturas, respondidas)).toBe(asignaturas.length);
  });
});
