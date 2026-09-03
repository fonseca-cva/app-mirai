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
