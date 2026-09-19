// REANUDACIÓN REAL — test de recarga con persistencia de verdad.
//
// El test anterior no servía: borraba las respuestas y nunca comprobaba que
// volvieran. Este usa un localStorage FALSO en memoria y hace que el middleware
// `persist` de zustand escriba y lea de ahí, destruyendo el store entremedio.
//
// Flujo cubierto (el que pidió la auditoría):
//   1. comenzar sesión (iniciarNuevaExperiencia)
//   2. responder ítems
//   3. avanzar de paso
//   4. DESTRUIR y REHIDRATAR el store (simula recargar la pestaña)
//   5. retomar
//   6. comprobar MISMO sessionId, MISMO paso y MISMAS respuestas

import { describe, it, expect, beforeEach, vi } from "vitest";

// El arnés (cookie + sessionStorage/localStorage) vive en lib/store/testNavegador.ts.
import { instalarNavegadorFalso, rehidratar, type NavegadorFalso } from "@/lib/store/testNavegador";

let navegador: NavegadorFalso;

beforeEach(() => {
  navegador = instalarNavegadorFalso();
  vi.resetModules();
});

// Carga "fresca" del módulo del store: simula abrir la página de nuevo. Como
// `persist` corre en el momento de crear el store, lee lo que quedó en el
// localStorage de la carga anterior.
async function cargarStore() {
  const mod = await import("@/lib/store/experiencia");
  // El store usa skipHydration: hay que rehidratar explícitamente, igual
  // que la página al montar. Sin esto el estado leído del almacén no llega.
  await rehidratar();
  return mod.useExperienciaStore;
}

describe("reanudación real tras recargar la pestaña", () => {
  it("restaura EL MISMO sessionId, paso y respuestas", async () => {
    // ── Carga 1: el alumno empieza, responde y avanza ────────────────────
    const store1 = await cargarStore();
    const sessionId1 = store1.getState().iniciarNuevaExperiencia();
    store1.getState().marcarExperienciaIncompleta();

    // Responde 3 contextos del bloque de gustos.
    store1.getState().agregarRespuestaGustos({ contextoId: "c1", valor: 2, ayudaAbierta: false, audioActivado: false });
    store1.getState().agregarRespuestaGustos({ contextoId: "c2", valor: 1, ayudaAbierta: true, audioActivado: false });
    store1.getState().agregarRespuestaGustos({ contextoId: "c3", valor: 0, ayudaAbierta: false, audioActivado: true });
    // Y algunas de otros bloques, para comprobar que todos se persisten.
    store1.getState().agregarRespuestaCognitivo({ juego: "matrices", itemId: "m1", correcto: true, nivel: 1, duracionMs: 1200, repetidoPorTimeout: false });
    store1.getState().agregarRespuestaActividad({ actividadId: "a1", valor: 2 });
    store1.getState().agregarRespuestaAsignatura({ asignaturaId: "as1", valor: 1 });
    store1.getState().setAspiracion({ opcion: "universidad", detalle: null });
    // Avanza de paso.
    store1.getState().irAPaso("gustos");

    const gustosAntes = store1.getState().respuestasGustos;
    const cognitivoAntes = store1.getState().respuestasCognitivo;
    expect(gustosAntes).toHaveLength(3);
    expect(store1.getState().paso).toBe("gustos");

    // ── DESTRUIR el store (simula cerrar/recargar la pestaña) ────────────
    // Se vacía el módulo cacheado: la próxima importación crea un store nuevo,
    // que es exactamente lo que pasa al recargar la página. El localStorage y la
    // cookie SOBREVIVEN (como en un navegador real).
    vi.resetModules();
    expect(navegador.leerEstado()).not.toBeNull(); // persist escribió algo

    // ── Carga 2: el store se rehidrata desde localStorage ────────────────
    const store2 = await cargarStore();

    // Rehidratado: mismo sessionId, mismo paso, mismas respuestas — SIN
    // llamar todavía a retomar (el persist ya restauró el estado).
    expect(store2.getState().sessionId).toBe(sessionId1);
    expect(store2.getState().paso).toBe("gustos");
    expect(store2.getState().respuestasGustos).toEqual(gustosAntes);
    expect(store2.getState().respuestasCognitivo).toEqual(cognitivoAntes);
    expect(store2.getState().respuestasActividades).toEqual([{ actividadId: "a1", valor: 2 }]);
    expect(store2.getState().respuestasAsignaturas).toEqual([{ asignaturaId: "as1", valor: 1 }]);
    expect(store2.getState().aspiracion).toEqual({ opcion: "universidad", detalle: null });

    // La UI puede ofrecer "Continuar" (no la ofrece si no hay nada reanudable).
    expect(store2.getState().hayExperienciaReanudable()).toBe(true);

    // ── El alumno elige "Continuar" ──────────────────────────────────────
    const retomada = store2.getState().retomarExperiencia();
    expect(retomada).toBe(true);
    expect(store2.getState().sessionId).toBe(sessionId1);
    expect(store2.getState().paso).toBe("gustos");
    expect(store2.getState().respuestasGustos).toHaveLength(3);
  });

  it("una experiencia en INTRO no se ofrece para reanudar (nada que continuar)", async () => {
    const store1 = await cargarStore();
    store1.getState().iniciarNuevaExperiencia();
    // No se marca incompleta: el alumno todavía no entró a la experiencia.

    vi.resetModules();
    const store2 = await cargarStore();

    expect(store2.getState().hayExperienciaReanudable()).toBe(false);
  });

  it("NO se persiste el modo prueba (debe revalidarse, no heredarse)", async () => {
    const store1 = await cargarStore();
    store1.getState().iniciarNuevaExperiencia();
    store1.getState().marcarExperienciaIncompleta();
    store1.getState().setModoPrueba(true);
    store1.getState().setModoPruebaReal(true);

    vi.resetModules();
    const store2 = await cargarStore();

    // Un flag persistido podría habilitar escrituras es_prueba=true sin revalidar
    // la cookie de /debug. Se exige revalidación en cada carga.
    expect(store2.getState().modoPrueba).toBe(false);
    expect(store2.getState().modoPruebaReal).toBe(false);
  });

  it("NO se persiste la cola de sync (evita reenviar payloads de una sesión vieja)", async () => {
    const store1 = await cargarStore();
    store1.getState().iniciarNuevaExperiencia();
    store1.getState().marcarExperienciaIncompleta();
    // La cola se llena sola al sincronizar; se fuerza para verificar el partialize.
    const setState = store1.setState as unknown as (p: { colaSync: unknown[] }) => void;
    setState({ colaSync: [{ id: "pendiente", tipo: "gustos", payload: [] }] });

    vi.resetModules();
    const store2 = await cargarStore();

    expect(store2.getState().colaSync).toEqual([]);
  });
});

describe("punto único de creación de sesión (no doble rotación)", () => {
  it("'empezar de nuevo' descarta; la creación ocurre una sola vez en el CTA de la intro", async () => {
    const store = await cargarStore();

    // Visita 1: el CTA de la intro crea la sesión (equivale a crearEnIntro sin
    // cookie previa).
    const primera = store.getState().iniciarNuevaExperiencia();
    store.getState().marcarExperienciaIncompleta();

    // El alumno vuelve, elige "Empezar de nuevo": descarta (no crea).
    store.getState().descartarExperiencia();
    expect(store.getState().sessionId).toBeNull();

    // El CTA de la intro crea la nueva (única creación de esta experiencia).
    const segunda = store.getState().iniciarNuevaExperiencia();
    expect(segunda).not.toBe(primera);
  });

  it("retomar NO rota el sessionId (Continuar nunca genera sesión nueva)", async () => {
    const store = await cargarStore();
    const original = store.getState().iniciarNuevaExperiencia();
    store.getState().marcarExperienciaIncompleta();

    const retomada = store.getState().retomarExperiencia();

    expect(retomada).toBe(true);
    expect(store.getState().sessionId).toBe(original);
  });
});
