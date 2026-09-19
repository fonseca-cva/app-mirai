// INVARIANTES DE IDEMPOTENCIA Y DE "FALLO NUNCA ES ÉXITO" (pilot readiness).
//
// Verifica, con un doble de Supabase que REGISTRA las llamadas reales:
//   * Cada tabla de respuestas usa upsert con el onConflict que corresponde a su
//     índice único (migración 00020). Sin esto, el reintento de la cola duplica.
//   * Repetir una sincronización no cambia el onConflict (misma operación).
//   * Un error del proveedor SIEMPRE se reporta como false (nunca true).
//   * Un resultado inesperado de la RPC verbal se reporta como false, no como éxito.
//
// El doble es deliberadamente estricto: si el código llamara `.insert()` en una
// tabla con onConflict esperado, el test lo detecta (registra el método usado).

import { describe, it, expect, beforeEach, vi } from "vitest";

type Llamada = {
  tabla: string;
  metodo: "insert" | "upsert" | "select" | "update" | "rpc";
  onConflict?: string;
  ignoreDuplicates?: boolean;
  selectColumnas?: string;
  valores: unknown;
  rpcNombre?: string;
};

let llamadas: Llamada[] = [];
let respuestaPorTabla: Map<string, { data: unknown; error: unknown }>;
let rpcRespuesta: { data: unknown; error: unknown };

// Resultado "thenable" con la forma que espera el código: { data, error } y
// encadenables .select().maybeSingle() / .eq().
function construirQuery(resultado: { data: unknown; error: unknown }) {
  const query: Record<string, unknown> = {};
  query.select = (columnas?: string) => {
    const ultima = llamadas[llamadas.length - 1];
    if (ultima && ultima.metodo !== "rpc") ultima.selectColumnas = columnas;
    return query;
  };
  query.eq = () => query;
  query.neq = () => query;
  query.maybeSingle = () => Promise.resolve(resultado);
  query.single = () => Promise.resolve(resultado);
  query.then = (onFulfilled: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) =>
    Promise.resolve(resultado).then(onFulfilled, onRejected);
  return query;
}

function crearClienteFalso() {
  return {
    from: (tabla: string) => ({
      insert: (valores: unknown) => {
        llamadas.push({ tabla, metodo: "insert", valores });
        return construirQuery(respuestaPorTabla.get(tabla) ?? { data: null, error: null });
      },
      upsert: (valores: unknown, opciones?: { onConflict?: string; ignoreDuplicates?: boolean }) => {
        llamadas.push({ tabla, metodo: "upsert", onConflict: opciones?.onConflict, ignoreDuplicates: opciones?.ignoreDuplicates, valores });
        return construirQuery(respuestaPorTabla.get(tabla) ?? { data: null, error: null });
      },
      select: (columnas?: string) => {
        llamadas.push({ tabla, metodo: "select", selectColumnas: columnas, valores: null });
        return construirQuery(respuestaPorTabla.get(tabla) ?? { data: null, error: null });
      },
      update: (valores: unknown) => {
        llamadas.push({ tabla, metodo: "update", valores });
        return construirQuery(respuestaPorTabla.get(tabla) ?? { data: null, error: null });
      },
    }),
    rpc: (nombre: string) => {
      llamadas.push({ tabla: "rpc", metodo: "rpc", rpcNombre: nombre, valores: null });
      return Promise.resolve(rpcRespuesta);
    },
    auth: {
      getSession: () => Promise.resolve({ data: { session: { access_token: "t" } } }),
      signInAnonymously: () => Promise.resolve({ error: null }),
    },
  };
}

beforeEach(() => {
  llamadas = [];
  respuestaPorTabla = new Map();
  rpcRespuesta = { data: true, error: null };
  vi.resetModules();
  vi.doMock("@/lib/supabase/client", () => ({
    supabase: crearClienteFalso(),
    asegurarSesionAnonima: () => Promise.resolve(true),
    obtenerAccessToken: () => Promise.resolve("token"),
  }));
});

async function cargarSync() {
  return await import("@/lib/supabase/sync");
}

const FILA_GUSTO = { session_id: "s1", contexto_id: "c1", valor: 2 as const, latencia_ms: null, ayuda_abierta: false, audio_activado: false };

describe("idempotencia — cada tabla de respuestas usa upsert con su onConflict", () => {
  const casos: Array<{
    nombre: string;
    tabla: string;
    onConflict: string;
    invocar: (sync: Awaited<ReturnType<typeof cargarSync>>) => Promise<boolean>;
    valores: unknown;
  }> = [
    {
      nombre: "gustos",
      tabla: "respuestas_gustos",
      onConflict: "session_id,contexto_id",
      invocar: (sync) => sync.syncRespuestasGustos([FILA_GUSTO] as never),
      valores: [FILA_GUSTO],
    },
    {
      nombre: "cognitivo",
      tabla: "respuestas_cognitivo",
      onConflict: "session_id,juego,item_id",
      invocar: (sync) =>
        sync.syncRespuestasCognitivo([
          { session_id: "s1", juego: "matrices", item_id: "m1", correcto: true, nivel: 1, duracion_ms: 100, repetido_timeout: false },
        ] as never),
      valores: null,
    },
    {
      nombre: "actividades",
      tabla: "respuestas_actividades",
      onConflict: "session_id,actividad_id",
      invocar: (sync) => sync.syncRespuestasActividades([{ session_id: "s1", actividad_id: "a1", valor: 1 as const }] as never),
      valores: null,
    },
    {
      nombre: "asignaturas",
      tabla: "respuestas_asignaturas",
      onConflict: "session_id,asignatura_id",
      invocar: (sync) => sync.syncRespuestasAsignaturas([{ session_id: "s1", asignatura_id: "as1", valor: 2 as const }] as never),
      valores: null,
    },
    {
      nombre: "divergente",
      tabla: "respuestas_divergente",
      onConflict: "session_id,objeto",
      invocar: (sync) =>
        sync.syncRespuestasDivergente([{ session_id: "s1", objeto: "o1", respuestas_texto: ["a"], cantidad: 1 }] as never),
      valores: null,
    },
  ];

  for (const caso of casos) {
    it(`${caso.nombre}: upsert con onConflict "${caso.onConflict}"`, async () => {
      const sync = await cargarSync();
      respuestaPorTabla.set(caso.tabla, { data: { id: 7 }, error: null });
      await caso.invocar(sync);

      const deLaTabla = llamadas.filter((l) => l.tabla === caso.tabla);
      expect(deLaTabla).toHaveLength(1);
      expect(deLaTabla[0].metodo).toBe("upsert");
      expect(deLaTabla[0].onConflict).toBe(caso.onConflict);
    });
  }

  it("verbal pendiente: usa DO NOTHING (ignoreDuplicates) para no degradar una fila ya evaluada", async () => {
    // Escribir estado 'pendiente' con DO UPDATE degradaría una fila 'evaluado' y
    // perdería la evaluación. La relectura posterior obtiene el id, así que
    // ignoreDuplicates no rompe el reintento asíncrono.
    const sync = await cargarSync();
    respuestaPorTabla.set("respuestas_verbal", { data: { id: 42 }, error: null });

    const id = await sync.insertarRespuestaVerbalPendiente({
      session_id: "s1",
      tarea: "comprension",
      texto: "texto",
      pegado: false,
      caracteres_pegados: 0,
      intento: 1,
    } as never);

    expect(id).toBe(42);
    const upserts = llamadas.filter((l) => l.tabla === "respuestas_verbal" && l.metodo === "upsert");
    expect(upserts).toHaveLength(1);
    expect(upserts[0].onConflict).toBe("session_id,tarea");
    expect(upserts[0].ignoreDuplicates).toBe(true);
    // Debe releer la fila para obtener su id (DO NOTHING no la devuelve).
    expect(llamadas.some((l) => l.tabla === "respuestas_verbal" && l.metodo === "select")).toBe(true);
  });

  it("repetir la misma sincronización produce la MISMA operación (no insert)", async () => {
    const sync = await cargarSync();
    respuestaPorTabla.set("respuestas_gustos", { data: null, error: null });

    await sync.syncRespuestasGustos([FILA_GUSTO] as never);
    await sync.syncRespuestasGustos([FILA_GUSTO] as never);

    const upserts = llamadas.filter((l) => l.tabla === "respuestas_gustos");
    expect(upserts).toHaveLength(2);
    expect(upserts.every((l) => l.metodo === "upsert")).toBe(true);
    expect(upserts.every((l) => l.onConflict === "session_id,contexto_id")).toBe(true);
    // `insert` en una tabla con índice único sería el camino de duplicación.
    expect(upserts.some((l) => l.metodo === "insert")).toBe(false);
  });

  it("tablas ya únicas en el esquema mantienen su onConflict (resultados, aspiraciones, tutorial)", async () => {
    const sync = await cargarSync();
    respuestaPorTabla.set("sesiones", { data: { creada_en: "2020-01-01T00:00:00.000Z" }, error: null });
    respuestaPorTabla.set("resultados", { data: null, error: null });
    respuestaPorTabla.set("aspiraciones", { data: null, error: null });
    respuestaPorTabla.set("tutorial_estado", { data: null, error: null });

    await sync.syncAspiracion({ session_id: "s1", opcion: "universidad", detalle: null } as never);
    await sync.syncTutorialEstado({
      session_id: "s1",
      juego: "matrices",
      tutorial_visto: true,
      practica_dominada: null,
      demo_loops_vistos: 0,
      uso_atras: 0,
      uso_saltar_tutorial: false,
    } as never);

    expect(llamadas.find((l) => l.tabla === "aspiraciones")?.onConflict).toBe("session_id");
    expect(llamadas.find((l) => l.tabla === "tutorial_estado")?.onConflict).toBe("session_id,juego");
    void sync;
  });
});

describe("un fallo de persistencia NUNCA se reporta como éxito", () => {
  it("error del proveedor en gustos → false", async () => {
    const sync = await cargarSync();
    respuestaPorTabla.set("respuestas_gustos", { data: null, error: { code: "42501", message: "RLS" } });
    expect(await sync.syncRespuestasGustos([FILA_GUSTO] as never)).toBe(false);
  });

  it("error del proveedor en cada tabla de respuestas → false", async () => {
    const sync = await cargarSync();
    const error = { code: "XX000", message: "boom" };
    respuestaPorTabla.set("respuestas_cognitivo", { data: null, error });
    respuestaPorTabla.set("respuestas_actividades", { data: null, error });
    respuestaPorTabla.set("respuestas_asignaturas", { data: null, error });
    respuestaPorTabla.set("respuestas_divergente", { data: null, error });
    respuestaPorTabla.set("respuestas_verbal", { data: null, error });

    expect(await sync.syncRespuestasCognitivo([{ session_id: "s1", juego: "matrices", item_id: "m1", correcto: true, nivel: 1, duracion_ms: 1, repetido_timeout: false }] as never)).toBe(false);
    expect(await sync.syncRespuestasActividades([{ session_id: "s1", actividad_id: "a1", valor: 1 }] as never)).toBe(false);
    expect(await sync.syncRespuestasAsignaturas([{ session_id: "s1", asignatura_id: "as1", valor: 1 }] as never)).toBe(false);
    expect(await sync.syncRespuestasDivergente([{ session_id: "s1", objeto: "o1", respuestas_texto: [], cantidad: 0 }] as never)).toBe(false);
    expect(await sync.insertarRespuestaVerbalPendiente({ session_id: "s1", tarea: "comprension", texto: "t", pegado: false, caracteres_pegados: 0, intento: 1 } as never)).toBeNull();
  });

  it("un resultado inesperado de la RPC verbal → false, no éxito silencioso", async () => {
    // La RPC de resultado explícito (00021) solo devuelve 'actualizado',
    // 'ya_evaluado' o 'inexistente'. Cualquier otra cosa es un fallo: nunca se
    // interpreta como éxito.
    const sync = await cargarSync();
    rpcRespuesta = { data: "algo_inesperado", error: null };
    const ok = await sync.syncRespuestaVerbal({
      id: 99,
      session_id: "s1",
      tarea: "comprension",
      texto: "t",
      evaluacion_json: null,
      estado: "evaluado",
      pegado: false,
      caracteres_pegados: 0,
      revision_requerida: false,
      intento: 1,
    } as never);
    expect(ok).toBe(false);
    expect(llamadas.some((l) => l.rpcNombre === "actualizar_evaluacion_verbal_resultado")).toBe(true);
  });

  it("un bloque vacío no se reporta como éxito (nada que escribir ≠ escrito)", async () => {
    const sync = await cargarSync();
    expect(await sync.syncRespuestasGustos([])).toBe(false);
    expect(await sync.syncRespuestasCognitivo([])).toBe(false);
    expect(await sync.syncRespuestasActividades([])).toBe(false);
    expect(await sync.syncRespuestasAsignaturas([])).toBe(false);
    expect(await sync.syncRespuestasDivergente([])).toBe(false);
  });

  it("procesarColaSync conserva en la cola TODA tarea que falló", async () => {
    const sync = await cargarSync();
    respuestaPorTabla.set("respuestas_gustos", { data: null, error: { code: "XX000", message: "boom" } });
    respuestaPorTabla.set("sesiones", { data: null, error: null });

    const fallaron = await sync.procesarColaSync([
      { id: "t1", tipo: "sesion", payload: { id: "s1", creada_en: new Date().toISOString(), edad: null, curso: null, dispositivo: null } },
      { id: "t2", tipo: "gustos", payload: [FILA_GUSTO] },
    ]);

    expect(fallaron).toHaveLength(1);
    expect(fallaron[0].id).toBe("t2");
  });
});

describe("sanearGeneradoEn — ningún resultado antes de su sesión", () => {
  it("corrige un generado_en anterior a creada_en", async () => {
    const { sanearGeneradoEn } = await cargarSync();
    const corregido = sanearGeneradoEn("2020-01-01T00:00:00.000Z", "2025-01-01T00:00:00.000Z");
    expect(corregido).toBe("2025-01-01T00:00:00.000Z");
  });

  it("respeta un generado_en posterior a creada_en", async () => {
    const { sanearGeneradoEn } = await cargarSync();
    const original = "2025-01-02T00:00:00.000Z";
    expect(sanearGeneradoEn(original, "2025-01-01T00:00:00.000Z")).toBe(original);
  });

  it("sin creada_en conocida no inventa una corrección", async () => {
    const { sanearGeneradoEn } = await cargarSync();
    const original = "2020-01-01T00:00:00.000Z";
    expect(sanearGeneradoEn(original, null)).toBe(original);
  });

  it("generado_en ausente o inválido cae al piso creada_en", async () => {
    const { sanearGeneradoEn } = await cargarSync();
    expect(sanearGeneradoEn(undefined, "2025-01-01T00:00:00.000Z")).toBe("2025-01-01T00:00:00.000Z");
    expect(sanearGeneradoEn("no-es-fecha", "2025-01-01T00:00:00.000Z")).toBe("2025-01-01T00:00:00.000Z");
  });
});
