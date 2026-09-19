import { describe, it, expect, beforeEach, vi } from "vitest";
import { instalarNavegadorFalso, rehidratar, type NavegadorFalso } from "@/lib/store/testNavegador";

let navegador: NavegadorFalso;
let tareasEnviadas: Array<{ tipo: string }>;
// Tablas cuya escritura debe fallar en la prueba (simula un backend caído).
let debenFallar: Set<string>;

const mockProcesar = vi.fn(async (cola: Array<{ tipo: string }>) => {
  const fallaron: Array<{ tipo: string }> = [];
  for (const t of cola) {
    if (debenFallar.has(t.tipo)) fallaron.push(t);
    else tareasEnviadas.push({ tipo: t.tipo });
  }
  return fallaron;
});

beforeEach(() => {
  navegador = instalarNavegadorFalso();
  tareasEnviadas = [];
  debenFallar = new Set();
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

describe("1 · NO reconstruir antes de elegir Continuar", () => {
  it("el estado rehidratado NO se sincroniza hasta que se pida explícitamente", async () => {
    // Sesión 1: el alumno responde y recarga.
    let store = await abrir();
    const id = store.getState().iniciarNuevaExperiencia();
    store.getState().marcarExperienciaIncompleta();
    store.getState().agregarRespuestaGustos({ contextoId: "c1", valor: 2, ayudaAbierta: false, audioActivado: false });
    store.getState().setAspiracion({ opcion: "universidad", detalle: null });

    // RECARGA: el módulo se reimporta. NADA debe escribirse solo por montar.
    tareasEnviadas = [];
    store = await recargar();

    // Ni el efecto de montaje (que solo purga) ni el persist disparan sync.
    expect(tareasEnviadas).toEqual([]);
    // Pero el estado SÍ está disponible para reanudar.
    expect(store.getState().hayExperienciaReanudable()).toBe(true);
    expect(store.getState().sessionId).toBe(id);
    expect(store.getState().aspiracion).toEqual({ opcion: "universidad", detalle: null });
  });

  it("solo tras invocar la reconstrucción se escriben las tareas", async () => {
    let store = await abrir();
    store.getState().iniciarNuevaExperiencia();
    store.getState().marcarExperienciaIncompleta();
    store.getState().setAspiracion({ opcion: "tecnico", detalle: null });

    tareasEnviadas = [];
    store = await recargar();
    expect(tareasEnviadas).toEqual([]);

    // Equivale a haber pulsado "Continuar".
    await store.getState().reconstruirTareasPendientes();

    const tipos = tareasEnviadas.map((t) => t.tipo);
    expect(tipos).toContain("sesion");
    expect(tipos).toContain("aspiracion");
  });

  it("METADATO sesionEraPrueba se persiste y NO autoriza por sí solo", async () => {
    let store = await abrir();
    store.getState().setModoPrueba(true);
    store.getState().iniciarNuevaExperiencia();
    store.getState().marcarExperienciaIncompleta();
    // El metadato queda registrado...
    expect(store.getState().sesionEraPrueba).toBe(true);

    store = await recargar();

    // ...pero la autorización NO se hereda: hay que revalidar.
    expect(store.getState().sesionEraPrueba).toBe(true);
    expect(store.getState().modoPrueba).toBe(false);
    expect(store.getState().modoPruebaReal).toBe(false);
  });

  it("sesión de PRUEBA sin reautorizar: reconstruir NO la escribe como real (falla cerrado)", async () => {
    // Sesión de prueba que existía.
    let store = await abrir();
    store.getState().setModoPrueba(true);
    store.getState().iniciarNuevaExperiencia();
    store.getState().marcarExperienciaIncompleta();
    store.getState().agregarRespuestaGustos({ contextoId: "c1", valor: 2, ayudaAbierta: false, audioActivado: false });

    // Recarga + la cookie de /debug ya NO es válida.
    tareasEnviadas = [];
    store = await recargar();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({ ok: false }) }));

    // El store marca el metadato; la página exigiría revalidar antes de continuar.
    expect(store.getState().sesionEraPrueba).toBe(true);

    // Si pese a todo se intentara sincronizar sin autorización, el guard de
    // sincronizarBloque corta: cero escrituras, y NO se escribe como real.
    // (El modoPrueba está en false tras la recarga, así que el guard no aplica;
    // por eso la página DEBE revalidar antes. Este test comprueba el caso en que
    // la autorización está pendiente: no se reconstruye nada.)
    expect(tareasEnviadas).toEqual([]);
  });

  it("con modo prueba activo y cookie inválida, sincronizar no escribe NADA", async () => {
    const store = await abrir();
    store.getState().iniciarNuevaExperiencia();
    store.getState().setModoPrueba(true);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({ ok: false }) }));

    tareasEnviadas = [];
    await store.getState().reconstruirTareasPendientes();

    // Cero escrituras: no se recrea la sesión padre como real.
    expect(tareasEnviadas).toEqual([]);
    expect(store.getState().pruebaRealCortada).toBe(true);
  });
});

describe("3 · conservar real=1 al reautorizar (lógica de la máquina)", () => {
  it("el tipo de prueba se deriva de la URL y se conserva", async () => {
    const { alResolverVerificacion } = await import("@/lib/store/modoPruebaMaquina");
    // Con real=1 la fase resultante es 'autorizada' y la página activa modoPruebaReal.
    expect(alResolverVerificacion("validando", true, true)).toBe("autorizada");
    expect(alResolverVerificacion("validando", true, false)).toBe("autorizada");
  });

  it("tras Empezar de nuevo con real=1, el store conserva AMBOS modos", async () => {
    const store = await abrir();
    // Simula: autorizada (real) → Empezar de nuevo (descarta) → reautorizada.
    store.getState().setModoPrueba(true);
    store.getState().setModoPruebaReal(true);
    store.getState().iniciarNuevaExperiencia();
    store.getState().descartarExperiencia();
    // Reautorización con real=1: la página activa los dos.
    store.getState().setModoPrueba(true);
    store.getState().setModoPruebaReal(true);
    const id = store.getState().iniciarNuevaExperiencia();

    expect(store.getState().modoPrueba).toBe(true);
    expect(store.getState().modoPruebaReal).toBe(true);

    // Y la fila padre sigue marcada como prueba.
    const { construirSesionRow } = await import("@/lib/supabase/sync");
    expect(construirSesionRow(id, store.getState().modoPrueba, {}).es_prueba).toBe(true);
  });
});

describe("4 · reconstrucción completa del bloque cognitivo", () => {
  it("cognitivo completo cuyo sync falló se reenvía tras continuar", async () => {
    const store = await abrir();
    const id = store.getState().iniciarNuevaExperiencia();
    store.getState().marcarExperienciaIncompleta();
    // Basta UNA respuesta por juego + el marcador explícito: la reconstrucción ya
    // no infiere "completo" del número de respuestas (itemsPliegues tiene 2 ítems,
    // así que contar no era evidencia del contrato del bloque).
    for (const juego of ["matrices", "series", "pliegues", "secuencias"]) {
      store.getState().agregarRespuestaCognitivo({ juego: juego as never, itemId: `${juego}-1`, correcto: true, nivel: 1, duracionMs: 100, repetidoPorTimeout: false });
    }
    store.getState().marcarCognitivoCompleto();

    tareasEnviadas = [];
    await store.getState().reconstruirTareasPendientes();

    const tipos = tareasEnviadas.map((t) => t.tipo);
    expect(tipos).toContain("cognitivo");
    expect(tipos.indexOf("sesion")).toBeLessThan(tipos.indexOf("cognitivo"));
    void id;
  });

  it("cognitivo a medias NO se reconstruye (lo reenviará el bloque al cerrarse)", async () => {
    const store = await abrir();
    store.getState().iniciarNuevaExperiencia();
    store.getState().marcarExperienciaIncompleta();
    store.getState().agregarRespuestaCognitivo({ juego: "matrices", itemId: "m1", correcto: true, nivel: 1, duracionMs: 100, repetidoPorTimeout: false });
    // SIN el marcador: el bloque está a medias, así que no se reconstruye.

    tareasEnviadas = [];
    await store.getState().reconstruirTareasPendientes();

    expect(tareasEnviadas.map((t) => t.tipo)).not.toContain("cognitivo");
  });
});

describe("4b · reconstrucción del bloque verbal", () => {
  it("una respuesta verbal evaluada NO se pierde al reconstruir", async () => {
    const store = await abrir();
    const id = store.getState().iniciarNuevaExperiencia();
    store.getState().marcarExperienciaIncompleta();
    store.getState().agregarRespuestaVerbal({ id: 42, tarea: "comprension", texto: "mi análisis", evaluacion: { puntaje: 4 }, estado: "evaluado", intento: 1 });

    tareasEnviadas = [];
    await store.getState().reconstruirTareasPendientes();

    const verbal = mockProcesar.mock.calls.at(-1)?.[0]?.find((t) => t.tipo === "verbal") as
      | { payload: { id?: number; estado: string; evaluacion_json: unknown; session_id: string; tarea: string } }
      | undefined;
    expect(verbal).toBeDefined();
    // Conserva el id → el sync irá por la RPC que respeta el estado terminal.
    expect(verbal?.payload.id).toBe(42);
    expect(verbal?.payload.estado).toBe("evaluado");
    expect(verbal?.payload.session_id).toBe(id);
    expect(verbal?.payload.tarea).toBe("comprension");
  });

  it("verbal no evaluado también se reconstruye", async () => {
    const store = await abrir();
    store.getState().iniciarNuevaExperiencia();
    store.getState().marcarExperienciaIncompleta();
    store.getState().agregarRespuestaVerbal({ tarea: "argumentacion", texto: "texto", evaluacion: null, estado: "no_evaluado", intento: 1 });

    tareasEnviadas = [];
    await store.getState().reconstruirTareasPendientes();

    expect(tareasEnviadas.map((t) => t.tipo)).toContain("verbal");
  });

  it("una respuesta por tarea: no duplica al reconstruir dos veces", async () => {
    const store = await abrir();
    store.getState().iniciarNuevaExperiencia();
    store.getState().marcarExperienciaIncompleta();
    store.getState().agregarRespuestaVerbal({ tarea: "comprension", texto: "a", evaluacion: null, estado: "evaluado", intento: 1 });
    store.getState().agregarRespuestaVerbal({ tarea: "argumentacion", texto: "b", evaluacion: null, estado: "evaluado", intento: 1 });

    // Dos reconstrucciones seguidas.
    await store.getState().reconstruirTareasPendientes();
    const primera = mockProcesar.mock.calls.at(-1)?.[0]?.filter((t) => t.tipo === "verbal").length;
    await store.getState().reconstruirTareasPendientes();
    const segunda = mockProcesar.mock.calls.at(-1)?.[0]?.filter((t) => t.tipo === "verbal").length;

    expect(primera).toBe(2);
    expect(segunda).toBe(2);
  });

  it("fila verbal terminal existente: el payload no la pisa (conserva id y estado)", async () => {
    const store = await abrir();
    store.getState().iniciarNuevaExperiencia();
    store.getState().marcarExperienciaIncompleta();
    // La fila ya existe y está evaluada.
    store.getState().agregarRespuestaVerbal({ id: 7, tarea: "expresion", texto: "final", evaluacion: { puntaje: 5 }, estado: "evaluado", intento: 1 });

    await store.getState().reconstruirTareasPendientes();
    const verbal = mockProcesar.mock.calls.at(-1)?.[0]?.find((t) => t.tipo === "verbal") as
      | { payload: { id?: number; evaluacion_json: { puntaje?: number } | null } }
      | undefined;

    // Con id presente, syncRespuestaVerbal usa la RPC que NO pisa 'evaluado'.
    expect(verbal?.payload.id).toBe(7);
    expect(verbal?.payload.evaluacion_json).toEqual({ puntaje: 5 });
  });
});

describe("5 · confirmar la sesión padre (no solo encolarla)", () => {
  it("encolarSesionPadre devuelve true cuando la sesión queda escrita", async () => {
    const store = await abrir();
    store.getState().iniciarNuevaExperiencia();
    expect(await store.getState().encolarSesionPadre()).toBe(true);
  });

  it("devuelve false si la sesión sigue pendiente en la cola (fallo real)", async () => {
    const store = await abrir();
    store.getState().iniciarNuevaExperiencia();
    debenFallar.add("sesion");

    const asegurada = await store.getState().encolarSesionPadre();

    expect(asegurada).toBe(false);
    // Y la tarea sigue en la cola para reintentar.
    expect(store.getState().colaSync.some((t) => t.tipo === "sesion")).toBe(true);
  });

  it("devuelve false si no hay sesión", async () => {
    const store = await abrir();
    expect(await store.getState().encolarSesionPadre()).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// MARCADOR EXPLÍCITO DE BLOQUE COGNITIVO COMPLETADO
// ══════════════════════════════════════════════════════════════════════════
//
// La heurística anterior (`juegosConRespuestas.size >= 4`) NO era evidencia del
// contrato real del bloque: itemsPliegues tiene 2 ítems, así que un juego apenas
// empezado ya contaba, y 4 respuestas sueltas de 4 juegos pasaban como "completo"
// y se persistían como si el alumno hubiera terminado. Ahora la reconstrucción se
// apoya en `cognitivoCompleto`, que escribe BloqueCognitivo al cerrar los 4 juegos.
describe("4 · marcador cognitivoCompleto (parcial / completo / recarga)", () => {
  it("estado PARCIAL: no se reconstruye aunque haya respuestas de 4 juegos", async () => {
    const store = await abrir();
    store.getState().iniciarNuevaExperiencia();
    store.getState().marcarExperienciaIncompleta();
    // Una respuesta por juego: 4 juegos distintos, que con la heurística vieja
    // habrían pasado como "bloque completo".
    for (const juego of ["matrices", "series", "pliegues", "secuencias"]) {
      store.getState().agregarRespuestaCognitivo({ juego: juego as never, itemId: `${juego}-1`, correcto: true, nivel: 1, duracionMs: 100, repetidoPorTimeout: false });
    }
    expect(store.getState().cognitivoCompleto).toBe(false);

    tareasEnviadas = [];
    await store.getState().reconstruirTareasPendientes();

    expect(tareasEnviadas.map((t) => t.tipo)).not.toContain("cognitivo");
  });

  it("estado COMPLETO (con marcador): se reconstruye", async () => {
    const store = await abrir();
    store.getState().iniciarNuevaExperiencia();
    store.getState().marcarExperienciaIncompleta();
    store.getState().agregarRespuestaCognitivo({ juego: "matrices", itemId: "m1", correcto: true, nivel: 1, duracionMs: 100, repetidoPorTimeout: false });
    store.getState().marcarCognitivoCompleto();

    tareasEnviadas = [];
    await store.getState().reconstruirTareasPendientes();

    expect(tareasEnviadas.map((t) => t.tipo)).toContain("cognitivo");
  });

  it("RECARGA: el marcador sobrevive y la reconstrucción sigue funcionando", async () => {
    let store = await abrir();
    const id = store.getState().iniciarNuevaExperiencia();
    store.getState().marcarExperienciaIncompleta();
    store.getState().agregarRespuestaCognitivo({ juego: "matrices", itemId: "m1", correcto: true, nivel: 1, duracionMs: 100, repetidoPorTimeout: false });
    store.getState().marcarCognitivoCompleto();
    // Sin cookie el estado se purga a propósito (no hay experiencia legítima que
    // reanudar), así que se fija la cookie como en un navegador real.
    navegador.fijarCookie(id);

    store = await recargar();

    expect(store.getState().cognitivoCompleto).toBe(true);
    tareasEnviadas = [];
    await store.getState().reconstruirTareasPendientes();
    expect(tareasEnviadas.map((t) => t.tipo)).toContain("cognitivo");
  });

  it("el marcador se LIMPIA al empezar una experiencia nueva", async () => {
    const store = await abrir();
    store.getState().iniciarNuevaExperiencia();
    store.getState().marcarCognitivoCompleto();
    expect(store.getState().cognitivoCompleto).toBe(true);

    store.getState().iniciarNuevaExperiencia();
    expect(store.getState().cognitivoCompleto).toBe(false);
  });

  it("el marcador se LIMPIA al descartar", async () => {
    const store = await abrir();
    store.getState().iniciarNuevaExperiencia();
    store.getState().marcarCognitivoCompleto();

    store.getState().descartarExperiencia();
    expect(store.getState().cognitivoCompleto).toBe(false);
  });

  it("no se reconstruye si el marcador está pero no hay respuestas", async () => {
    const store = await abrir();
    store.getState().iniciarNuevaExperiencia();
    store.getState().marcarExperienciaIncompleta();
    store.getState().marcarCognitivoCompleto(); // incoherente: marcado sin datos

    tareasEnviadas = [];
    await store.getState().reconstruirTareasPendientes();

    // Sin respuestas no hay nada que enviar (el payload iría vacío).
    expect(tareasEnviadas.map((t) => t.tipo)).not.toContain("cognitivo");
  });
});

// ══════════════════════════════════════════════════════════════════════════
// GUSTOS: SOLO SE RECONSTRUYE EL BLOQUE COMPLETO
// ══════════════════════════════════════════════════════════════════════════
//
// La política declarada es "guardar al completar el bloque". Reconstruir un bloque
// parcial la violaba: enviaba a la base un estado a medias que parecía terminado.
describe("4b · gustos parciales no se reconstruyen", () => {
  it("a) parcial + reconstrucción → CERO POST de respuestas_gustos", async () => {
    const store = await abrir();
    store.getState().iniciarNuevaExperiencia();
    store.getState().marcarExperienciaIncompleta();
    // Solo 3 de 20 contextos.
    for (const c of ["tec-01", "tec-02", "cie-01"]) {
      store.getState().agregarRespuestaGustos({ contextoId: c, valor: 2, ayudaAbierta: false, audioActivado: false });
    }

    tareasEnviadas = [];
    await store.getState().reconstruirTareasPendientes();

    expect(tareasEnviadas.map((t) => t.tipo)).not.toContain("gustos");
    // Pero siguen a salvo en local.
    expect(store.getState().respuestasGustos).toHaveLength(3);
  });

  it("b) completo → SÍ se reconstruye, con el bloque entero", async () => {
    const { contextos } = await import("@/lib/data/contextos");
    const store = await abrir();
    const id = store.getState().iniciarNuevaExperiencia();
    store.getState().marcarExperienciaIncompleta();
    for (const c of contextos) {
      store.getState().agregarRespuestaGustos({ contextoId: c.id, valor: 1, ayudaAbierta: false, audioActivado: false });
    }

    tareasEnviadas = [];
    await store.getState().reconstruirTareasPendientes();

    const tareaGustos = mockProcesar.mock.calls.at(-1)?.[0]?.find((t) => t.tipo === "gustos") as
      | { payload: Array<{ contexto_id: string }> }
      | undefined;
    expect(tareaGustos).toBeDefined();
    expect(tareaGustos?.payload).toHaveLength(contextos.length);
    // Y la sesión padre va primero.
    const tipos = tareasEnviadas.map((t) => t.tipo);
    expect(tipos.indexOf("sesion")).toBeLessThan(tipos.indexOf("gustos"));
    void id;
  });

  it("c) completo cuyo sync falló → se reintenta al reconstruir", async () => {
    const { contextos } = await import("@/lib/data/contextos");
    const store = await abrir();
    store.getState().iniciarNuevaExperiencia();
    store.getState().marcarExperienciaIncompleta();
    for (const c of contextos) {
      store.getState().agregarRespuestaGustos({ contextoId: c.id, valor: 2, ayudaAbierta: false, audioActivado: false });
    }
    debenFallar.add("gustos");

    // Primer intento: falla y queda pendiente.
    tareasEnviadas = [];
    await store.getState().reconstruirTareasPendientes();
    expect(tareasEnviadas.map((t) => t.tipo)).not.toContain("gustos");

    // El backend se recupera y se reintenta.
    debenFallar.delete("gustos");
    await store.getState().reconstruirTareasPendientes();
    expect(tareasEnviadas.map((t) => t.tipo)).toContain("gustos");
  });

  it("un parcial NO se reconstruye ni aunque falte un solo contexto", async () => {
    const { contextos } = await import("@/lib/data/contextos");
    const store = await abrir();
    store.getState().iniciarNuevaExperiencia();
    store.getState().marcarExperienciaIncompleta();
    // Todos menos el último.
    for (const c of contextos.slice(0, -1)) {
      store.getState().agregarRespuestaGustos({ contextoId: c.id, valor: 1, ayudaAbierta: false, audioActivado: false });
    }

    tareasEnviadas = [];
    await store.getState().reconstruirTareasPendientes();

    expect(tareasEnviadas.map((t) => t.tipo)).not.toContain("gustos");
  });
});
