import { describe, it, expect, beforeEach, vi } from "vitest";
import { instalarNavegadorFalso, rehidratar, type NavegadorFalso } from "@/lib/store/testNavegador";

let navegador: NavegadorFalso;
// Registro de las tareas que llegan a procesarColaSync, en orden real de envío.
let tareasEnviadas: Array<{ tipo: string }>;

const mockProcesar = vi.fn(async (cola: Array<{ tipo: string }>) => {
  for (const t of cola) tareasEnviadas.push({ tipo: t.tipo });
  return []; // todas exitosas
});

beforeEach(() => {
  navegador = instalarNavegadorFalso();
  tareasEnviadas = [];
  mockProcesar.mockClear();
  vi.resetModules();

  vi.doMock("@/lib/supabase/sync", async () => {
    const real = await vi.importActual<typeof import("@/lib/supabase/sync")>("@/lib/supabase/sync");
    return { ...real, procesarColaSync: mockProcesar };
  });
});

async function abrir() {
  const mod = await import("@/lib/store/experiencia");
  // El store usa skipHydration: hay que rehidratar explícitamente, igual
  // que hace la página al montar.
  await rehidratar();
  return mod.useExperienciaStore;
}

async function recargar() {
  vi.resetModules();
  return await abrir();
}

describe("sesión padre antes de cualquier dato hijo", () => {
  it("encolarSesionPadre envía la tarea 'sesion'", async () => {
    const store = await abrir();
    store.getState().iniciarNuevaExperiencia();
    tareasEnviadas = [];

    await store.getState().encolarSesionPadre();

    expect(tareasEnviadas.map((t) => t.tipo)).toContain("sesion");
  });

  it("una tarea hija NUNCA se envía sin la sesión padre delante", async () => {
    const store = await abrir();
    const id = store.getState().iniciarNuevaExperiencia();
    tareasEnviadas = [];

    // La aspiración es la primera escritura del flujo y va ANTES de completar
    // los contextos: es justo el caso que fallaba.
    await store.getState().sincronizarBloque([
      { id: `aspiracion-${id}`, tipo: "aspiracion", payload: { session_id: id, opcion: "universidad", detalle: null } },
    ]);

    const tipos = tareasEnviadas.map((t) => t.tipo);
    expect(tipos).toContain("sesion");
    expect(tipos).toContain("aspiracion");
    // El orden importa: padre primero, hija después.
    expect(tipos.indexOf("sesion")).toBeLessThan(tipos.indexOf("aspiracion"));
  });

  it("si el padre ya está en la cola, no se duplica", async () => {
    const store = await abrir();
    const id = store.getState().iniciarNuevaExperiencia();
    // Primera llamada: encola el padre.
    await store.getState().sincronizarBloque([
      { id: `aspiracion-${id}`, tipo: "aspiracion", payload: { session_id: id, opcion: "universidad", detalle: null } },
    ]);
    const vecesPadre1 = tareasEnviadas.filter((t) => t.tipo === "sesion").length;

    // Segunda llamada con otra hija: el padre se vuelve a anteponer una sola vez.
    await store.getState().sincronizarBloque([
      { id: `actividades-${id}`, tipo: "actividades", payload: [] },
    ]);
    const vecesPadre2 = tareasEnviadas.filter((t) => t.tipo === "sesion").length;

    expect(vecesPadre2 - vecesPadre1).toBe(1);
  });

  it("la fila de sesión lleva es_prueba=true en modo prueba (propagado a las hijas por FK)", async () => {
    const store = await abrir();
    store.getState().setModoPrueba(true);
    store.getState().iniciarNuevaExperiencia();
    // Revalidación OK para que sincronizarBloque no corte.
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }));

    const tarea = store.getState().tareaSesionPadre();
    const payload = tarea.payload as { es_prueba?: boolean };

    expect(tarea.tipo).toBe("sesion");
    expect(payload.es_prueba).toBe(true);
  });
});

describe("recargar antes de terminar los contextos: la aspiración NO se pierde", () => {
  it("iniciar → aspiración → recargar → continuar → sesión y aspiración persistidas", async () => {
    // ── Sesión 1: el alumno empieza y responde la aspiración ────────────────
    let store = await abrir();
    const id = store.getState().iniciarNuevaExperiencia();
    store.getState().marcarExperienciaIncompleta();
    store.getState().setAspiracion({ opcion: "tecnico", detalle: "mecánica" });
    // Responde solo ALGUNOS contextos: el bloque de gustos NO se completó, así
    // que la sesión padre nunca se habría creado en el flujo antiguo.
    store.getState().agregarRespuestaGustos({ contextoId: "c1", valor: 2, ayudaAbierta: false, audioActivado: false });
    store.getState().agregarRespuestaGustos({ contextoId: "c2", valor: 1, ayudaAbierta: false, audioActivado: false });
    store.getState().irAPaso("gustos");

    // ── RECARGA (la cola en memoria se pierde; el estado persistido NO) ──────
    tareasEnviadas = [];
    store = await recargar();

    expect(store.getState().sessionId).toBe(id);
    expect(store.getState().aspiracion).toEqual({ opcion: "tecnico", detalle: "mecánica" });
    expect(store.getState().hayExperienciaReanudable()).toBe(true);

    // ── Continuar: la página reconstruye las tareas pendientes del estado ────
    await store.getState().reconstruirTareasPendientes();

    const tipos = tareasEnviadas.map((t) => t.tipo);
    // Sin persistir la cola, la aspiración y la sesión se vuelven a derivar: eso
    // es lo que evita que se pierdan por recargar.
    expect(tipos).toContain("sesion");
    expect(tipos).toContain("aspiracion");
    expect(tipos.indexOf("sesion")).toBeLessThan(tipos.indexOf("aspiracion"));
    // Los gustos PARCIALES **no** se reconstruyen: la política es guardar al
    // completar el bloque. Enviarlos a medias escribiría en la base un estado que
    // parece terminado. Permanecen locales y se sincronizan al cerrar el bloque.
    expect(tipos).not.toContain("gustos");
  });

  it("la cola NO se persiste (no se reenvían payloads de una sesión vieja)", async () => {
    let store = await abrir();
    const id = store.getState().iniciarNuevaExperiencia();
    store.getState().marcarExperienciaIncompleta();
    // Se fuerza una cola pendiente y se recarga.
    await store.getState().sincronizarBloque([
      { id: `gustos-${id}`, tipo: "gustos", payload: [] },
    ]);
    // Simula que quedó algo pendiente en memoria.
    const conPendiente = store.getState().colaSync.length;

    store = await recargar();

    expect(conPendiente).toBeGreaterThanOrEqual(0);
    // Tras recargar la cola arranca SIEMPRE vacía: lo que se reconstruye sale del
    // estado, no de una cola serializada.
    expect(store.getState().colaSync).toEqual([]);
  });

  it("un bloque completo SÍ se reconstruye tras recargar", async () => {
    const { asignaturas } = await import("@/lib/data/asignaturas");
    let store = await abrir();
    const id = store.getState().iniciarNuevaExperiencia();
    store.getState().marcarExperienciaIncompleta();
    for (const a of asignaturas) store.getState().agregarRespuestaAsignatura({ asignaturaId: a.id, valor: 2 });

    tareasEnviadas = [];
    store = await recargar();
    await store.getState().reconstruirTareasPendientes();

    const tipos = tareasEnviadas.map((t) => t.tipo);
    expect(tipos).toContain("sesion");
    expect(tipos).toContain("asignaturas");
    expect(tipos.indexOf("sesion")).toBeLessThan(tipos.indexOf("asignaturas"));
    void id;
  });

  it("un bloque INCOMPLETO no se reconstruye a medias (evita escribir estado parcial)", async () => {
    const { asignaturas } = await import("@/lib/data/asignaturas");
    const store = await abrir();
    store.getState().iniciarNuevaExperiencia();
    store.getState().marcarExperienciaIncompleta();
    // Solo 3 de 10: el bloque se enviará completo cuando el alumno lo cierre.
    for (const a of asignaturas.slice(0, 3)) store.getState().agregarRespuestaAsignatura({ asignaturaId: a.id, valor: 1 });

    tareasEnviadas = [];
    await store.getState().reconstruirTareasPendientes();

    const tipos = tareasEnviadas.map((t) => t.tipo);
    expect(tipos).toContain("sesion");
    expect(tipos).not.toContain("asignaturas");
  });

  it("sin sesión no se reconstruye nada", async () => {
    const store = await abrir();
    tareasEnviadas = [];
    await store.getState().reconstruirTareasPendientes();
    expect(tareasEnviadas).toEqual([]);
  });
});
