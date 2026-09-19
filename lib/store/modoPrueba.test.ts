// Test de AISLAMIENTO del modo prueba (migración 00017, exigencia "no negociable" de
// Camilo, entrega 1). Verifica:
//   (1) construirSesionRow SIEMPRE fuerza es_prueba:true cuando modoPrueba está activo
//       y JAMÁS produce es_prueba:false en ninguna ruta de código (el único modo
//       "no-prueba" es omitir el campo, dejando que la BD aplique el default false).
//   (2) sincronizarBloque (único call-site de TODAS las escrituras a Supabase) NO
//       escribe ni encola nada cuando el modo prueba está activo pero la revalidación
//       server-side de la cookie falla — desactiva el modo y no crea sesión ni hijos.
//       Gracias a esto, no existe ningún camino que cree una sesión (o respuestas
//       hijas) con es_prueba=false mientras el modo prueba esté activo.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { construirSesionRow } from "@/lib/supabase/sync";
import { useExperienciaStore, verificarPruebaValida } from "@/lib/store/experiencia";

describe("construirSesionRow — único punto de escritura de la sesión", () => {
  it("fuerza es_prueba:true cuando modoPrueba está activo", () => {
    const fila = construirSesionRow("s1", true, { edad: null, curso: null, dispositivo: "test" });
    expect(fila.es_prueba).toBe(true);
    expect(fila.id).toBe("s1");
  });

  it("OMITE es_prueba (no lo manda como false) cuando NO hay modo prueba", () => {
    const fila = construirSesionRow("s1", false, { edad: null, curso: null, dispositivo: "test" });
    // La clave NO existe en absoluto: la BD aplica su default false. Que no llegue un
    // es_prueba:false explícito evita cualquier doble vía/sobreescritura cliente.
    expect("es_prueba" in fila).toBe(false);
  });

  it("no existe desdoble: true nunca puede volverse false dentro de la construcción", () => {
    // Doble apriete: pase el valor que pase solo existe el ramo booleano `modoPrueba`
    // → si es true genera true; el constructor no recibe un `es_prueba` de entrada.
    const fila = construirSesionRow("s2", true, {});
    expect(fila.es_prueba).toBe(true);
    expect(fila.es_prueba !== false).toBe(true);
  });
});

describe("verificarPruebaValida — puerta server-side", () => {
  beforeEach(() => {
    useExperienciaStore.getState().setModoPrueba(false);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("devuelve true solo cuando /api/debug/verificar-prueba responde ok+200", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    );
    await expect(verificarPruebaValida()).resolves.toBe(true);
  });

  it("falla cerrado ante cookie no válida (401) o error de red", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    await expect(verificarPruebaValida()).resolves.toBe(false);

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    await expect(verificarPruebaValida()).resolves.toBe(false);
  });
});

describe("sincronizarBloque — no escribe datos cuando el modo prueba pierde la cookie", () => {
  beforeEach(() => {
    useExperienciaStore.setState({
      modoPrueba: true,
      colaSync: [],
      respuestasGustos: [],
    });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    useExperienciaStore.getState().setModoPrueba(false);
  });

  it("NO encola ni escribe nada y desactiva el modo si la revalidación falla", async () => {
    // Revalidación cortada: el store NO debe llamar a procesarColaSync (no escribe).
    // Hacemos que la verificación falle; sincronizarBloque debe retornar sin tocar la
    // cola, dejándola vacía (no se persiste ni la sesión ni los datos hijos).
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 }));

    const { sincronizarBloque } = useExperienciaStore.getState();
    await sincronizarBloque([
      {
        id: "s3-sesion",
        tipo: "sesion",
        payload: construirSesionRow("s3", true, {}),
      },
      { id: "s3-gustos", tipo: "gustos", payload: [] },
    ]);

    const estado = useExperienciaStore.getState();
    // El modo se desactiva y la cola queda sin las tareas: nada se escribió.
    expect(estado.modoPrueba).toBe(false);
    expect(estado.colaSync).toHaveLength(0);
    // La sesión no se marcó con es_prueba true en ningún lado (nada se encoló).
    expect(estado.colaSync.some((t) => (t.payload as { es_prueba?: boolean })?.es_prueba === true)).toBe(
      false
    );
  });

  it("encola y permite escritura cuando el modo prueba revalida OK", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }));

    const { sincronizarBloque } = useExperienciaStore.getState();
    await sincronizarBloque([
      {
        id: "s4-sesion",
        tipo: "sesion",
        payload: construirSesionRow("s4", true, {}),
      },
    ]);

    const estado = useExperienciaStore.getState();
    expect(estado.modoPrueba).toBe(true);
    // En un entorno sin supabase real, procesarColaSync descarta/marca las tareas;
    // lo relevante acá es que el modo se mantuvo activo (revalidación OK) tras pasar
    // la puerta. Si la puerta hubiera fallado, modoPrueba sería false.
    expect(estado.modoPrueba).toBe(true);
  });
});

// Caso nuevo (fix 2026-09-09, exigencia de Camilo): el modo prueba REAL usa
// /api/evaluar (persiste) en vez de /api/debug/evaluar, pero el aislamiento de
// sesiones de prueba debe seguir siendo el mismo — la marca es_prueba SIGUE
// viniendo solo de construirSesionRow, y si la cookie se pierde a mitad de la
// sesión, sincronizarBloque debe cortar la escritura Y dejar una marca visible
// (pruebaRealCortada) para que la UI se detenga, en vez de continuar en silencio
// hacia una sesión que dejó de estar garantizada como marcada.
describe("modo prueba REAL — mismo aislamiento que el modo prueba de debug, más fail-stop visible", () => {
  beforeEach(() => {
    useExperienciaStore.setState({
      modoPrueba: true,
      modoPruebaReal: true,
      pruebaRealCortada: false,
      colaSync: [],
      respuestasGustos: [],
    });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    useExperienciaStore.setState({ modoPrueba: false, modoPruebaReal: false, pruebaRealCortada: false });
  });

  it("activar modoPruebaReal NO cambia la marca es_prueba de la sesión: sigue viniendo solo de construirSesionRow", () => {
    // Independiente de modoPruebaReal — esa bandera solo decide QUÉ RUTA de
    // evaluación usa BloqueVerbal, nunca cómo se marca la sesión.
    const fila = construirSesionRow("s5", true, {});
    expect(fila.es_prueba).toBe(true);
  });

  it("si la cookie se pierde a mitad de sesión en modo prueba real: corta la escritura, desactiva ambas banderas y deja pruebaRealCortada=true (fail-stop visible)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 }));

    const { sincronizarBloque } = useExperienciaStore.getState();
    await sincronizarBloque([
      {
        id: "s5-sesion",
        tipo: "sesion",
        payload: construirSesionRow("s5", true, {}),
      },
    ]);

    const estado = useExperienciaStore.getState();
    // Mismo comportamiento de aislamiento que el modo prueba de debug: nada se
    // encola ni se escribe.
    expect(estado.colaSync).toHaveLength(0);
    expect(estado.modoPrueba).toBe(false);
    expect(estado.modoPruebaReal).toBe(false);
    // Diferencia exigida por Camilo respecto al modo debug: queda la marca para
    // que la UI (app/experiencia/page.tsx) bloquee la pantalla con un mensaje
    // visible en vez de dejar seguir la experiencia sin que el tester lo note.
    expect(estado.pruebaRealCortada).toBe(true);
  });

  it("si la revalidación es OK, modoPruebaReal se mantiene y pruebaRealCortada sigue en false", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }));

    const { sincronizarBloque } = useExperienciaStore.getState();
    await sincronizarBloque([
      {
        id: "s6-sesion",
        tipo: "sesion",
        payload: construirSesionRow("s6", true, {}),
      },
    ]);

    const estado = useExperienciaStore.getState();
    expect(estado.modoPrueba).toBe(true);
    expect(estado.modoPruebaReal).toBe(true);
    expect(estado.pruebaRealCortada).toBe(false);
  });

  it("un corte en modo prueba SIMPLE también marca el fail-stop visible (cualquier prueba debe detenerse)", async () => {
    // Antes el fail-stop visible era exclusivo del modo prueba REAL: una prueba
    // simple que perdía la cookie a mitad del flujo veía apagarse el modo en
    // silencio, y un bloque posterior podía escribirse COMO REAL. Ahora cualquier
    // pérdida de autorización corta la experiencia de forma visible.
    useExperienciaStore.setState({ modoPrueba: true, modoPruebaReal: false, pruebaRealCortada: false, colaSync: [] });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 }));

    const { sincronizarBloque } = useExperienciaStore.getState();
    await sincronizarBloque([
      { id: "s7-sesion", tipo: "sesion", payload: construirSesionRow("s7", true, {}) },
    ]);

    const estado = useExperienciaStore.getState();
    expect(estado.modoPrueba).toBe(false);
    expect(estado.pruebaRealCortada).toBe(true);
    // Y no se encoló nada: ninguna escritura sin la marca es_prueba.
    expect(estado.colaSync).toEqual([]);
  });
});
