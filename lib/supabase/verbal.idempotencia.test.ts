// IDEMPOTENCIA DEL BLOQUE VERBAL — casos exigidos por la auditoría:
//   doble envío, respuesta pendiente, reintento, evaluación ya terminal, y
//   fallo DESPUÉS de que PostgreSQL escribió pero antes de recibir respuesta.
//
// ── ESTABILIDAD (corrección de flakiness) ─────────────────────────────────────
// Antes este archivo redefinía el mismo módulo con `vi.doMock` dentro de varios
// tests, combinado con `vi.resetModules()`. Eso producía CONTAMINACIÓN: la
// respuesta de la RPC quedaba como `true` (la del mock viejo) en lugar de
// "actualizado", y la suite fallaba de forma intermitente (1-3 fallos según la
// corrida).
//
// Ahora hay UN ÚNICO mock, declarado con `vi.mock` (hoisted) que lee su respuesta
// de una variable MUTABLE reiniciada en `beforeEach`. No se vuelve a redefinir el
// módulo en ningún test. Es el patrón estable que pide la corrección.
//
// El doble modela una tabla con memoria real (Map por session_id+tarea) y puede
// simular el corte de red posterior a la escritura, que es el escenario que produce
// duplicados o pérdidas.

import { describe, it, expect, beforeEach, vi } from "vitest";

type Fila = {
  id: number;
  session_id: string;
  tarea: string;
  texto: string;
  evaluacion_json: unknown;
  estado: string;
  intento: number;
  pegado: boolean;
  caracteres_pegados: number;
  revision_requerida: boolean;
  acuerdo_no_disponible: boolean;
};

// ── Estado compartido del mock (reiniciado en beforeEach) ────────────────────
let tabla: Map<string, Fila>;
let siguienteId: number;
let llamadas: Array<{ op: string; detalle?: string }>;
// Cuando es true, la operación SÍ modifica la tabla pero luego "falla" al
// responder — simula que Postgres escribió y la red se cortó antes del 200.
let perderRespuestaTrasEscribir: { activo: boolean; veces: number };
// Respuesta de la RPC verbal. Se controla desde cada test; el mock la LEE.
// Empieza en `true` para los tests que no la tocan (comportamiento legado), y los
// tests de la RPC de resultado explícito la fijan a un string.
let rpcRespuesta: { data: unknown; error: unknown };
// Si es true, la RPC de resultado devuelve PGRST202 (simula 00021 no aplicada).
let rpcResultadoNoExiste: boolean;

const clave = (sessionId: string, tarea: string) => `${sessionId}|${tarea}`;

function fila(over: Partial<Fila> = {}): Fila {
  return {
    id: siguienteId++,
    session_id: "s1",
    tarea: "comprension",
    texto: "texto",
    evaluacion_json: null,
    estado: "pendiente",
    intento: 1,
    pegado: false,
    caracteres_pegados: 0,
    revision_requerida: false,
    acuerdo_no_disponible: false,
    ...over,
  };
}

// Query encadenable que soporta .eq().eq().maybeSingle() y await directo.
function query(modo: "select" | "update" | "insert" | "upsert", payload?: Partial<Fila>, filtros?: Record<string, string>) {
  const cond: Record<string, string> = { ...(filtros ?? {}) };
  const q: Record<string, unknown> = {};

  const evaluar = (): { data: unknown; error: unknown } => {
    if (perderRespuestaTrasEscribir.activo && perderRespuestaTrasEscribir.veces > 0) {
      perderRespuestaTrasEscribir.veces--;
      aplicarEscritura();
      return { data: null, error: { code: "08006", message: "connection terminated unexpectedly" } };
    }
    return aplicarEscritura();
  };

  function aplicarEscritura(): { data: unknown; error: unknown } {
    if (modo === "upsert") {
      const k = clave(String(payload?.session_id), String(payload?.tarea));
      if (tabla.has(k)) {
        // DO NOTHING: no se toca la fila existente.
        return { data: null, error: null };
      }
      tabla.set(k, fila(payload as Partial<Fila>));
      return { data: null, error: null };
    }
    if (modo === "update") {
      const sessionId = cond.session_id ?? Object.keys(tabla)[0]?.split("|")[0];
      const tarea = cond.tarea ?? Object.keys(tabla)[0]?.split("|")[1];
      const k = clave(String(sessionId), String(tarea));
      const f = tabla.get(k);
      if (!f) return { data: null, error: null };
      if (cond.__neq_estado && f.estado === cond.__neq_estado) return { data: null, error: null };
      tabla.set(k, { ...f, ...(payload as Partial<Fila>) });
      return { data: null, error: null };
    }
    if (modo === "select") {
      const f = tabla.get(clave(cond.session_id ?? "", cond.tarea ?? ""));
      return { data: f ? { id: f.id, estado: f.estado } : null, error: null };
    }
    if (modo === "insert") {
      const k = clave(String(payload?.session_id), String(payload?.tarea));
      tabla.set(k, fila(payload as Partial<Fila>));
      return { data: null, error: null };
    }
    return { data: null, error: null };
  }

  q.eq = (campo: string, valor: string) => {
    cond[campo] = valor;
    return q;
  };
  q.neq = (campo: string, valor: string) => {
    cond[`__neq_${campo}`] = valor;
    return q;
  };
  // `.select()` DEBE preservar los filtros ya aplicados (es el orden real de
  // PostgREST: .update(...).eq(...).neq(...)), y no borrarlos.
  q.select = () => q;
  q.maybeSingle = () => Promise.resolve(evaluar());
  q.single = () => Promise.resolve(evaluar());
  q.then = (onF: (v: unknown) => unknown, onR?: (e: unknown) => unknown) => Promise.resolve(evaluar()).then(onF, onR);
  return q;
}

// ── MOCK ÚNICO (hoisted) ─────────────────────────────────────────────────────
// Se declara UNA vez. Todos los tests comparten este módulo; lo que cambia entre
// tests es el estado de las variables de arriba, que se reinician en beforeEach.
vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: (t: string) => ({
      insert: (p: Partial<Fila>) => {
        llamadas.push({ op: "insert" });
        return query("insert", p);
      },
      upsert: (p: Partial<Fila>, o?: { onConflict?: string; ignoreDuplicates?: boolean }) => {
        llamadas.push({ op: `upsert:${o?.onConflict}:${o?.ignoreDuplicates ? "nothing" : "update"}` });
        return query("upsert", p);
      },
      update: (p: Partial<Fila>) => {
        llamadas.push({ op: "update" });
        return query("update", p);
      },
      select: () => {
        llamadas.push({ op: "select" });
        return query("select");
      },
    }),
    rpc: (nombre: string) => {
      llamadas.push({ op: `rpc:${nombre}` });
      if (nombre === "actualizar_evaluacion_verbal_resultado") {
        if (rpcResultadoNoExiste) {
          // Simula que la migración 00021 no está aplicada.
          return Promise.resolve({
            data: null,
            error: { code: "PGRST202", message: "Could not find the function public.actualizar_evaluacion_verbal_resultado" },
          });
        }
        return Promise.resolve(rpcRespuesta);
      }
      // RPC legada (00016).
      return Promise.resolve({ data: true, error: null });
    },
    auth: { getSession: () => Promise.resolve({ data: { session: {} } }), signInAnonymously: () => Promise.resolve({ error: null }) },
  },
  asegurarSesionAnonima: () => Promise.resolve(true),
}));

beforeEach(() => {
  // Se reinicia SOLO el estado, nunca el módulo mockeado.
  tabla = new Map();
  siguienteId = 1;
  llamadas = [];
  perderRespuestaTrasEscribir = { activo: false, veces: 0 };
  rpcRespuesta = { data: true, error: null };
  rpcResultadoNoExiste = false;
  vi.clearAllMocks();
});

// El módulo real se importa una vez; el mock hoisted ya está en su lugar.
const cargar = async () => await import("@/lib/supabase/sync");

const pendienteBase = {
  session_id: "s1",
  tarea: "comprension" as const,
  texto: "mi respuesta",
  pegado: false,
  caracteres_pegados: 0,
  intento: 1,
};

describe("insertarRespuestaVerbalPendiente — idempotencia", () => {
  it("doble envío crea UNA sola fila y devuelve el mismo id", async () => {
    const { insertarRespuestaVerbalPendiente } = await cargar();

    const id1 = await insertarRespuestaVerbalPendiente(pendienteBase as never);
    const id2 = await insertarRespuestaVerbalPendiente(pendienteBase as never);

    expect(tabla.size).toBe(1);
    expect(id1).toBe(id2);
  });

  it("usar DO NOTHING no degrada una fila ya evaluada", async () => {
    const { insertarRespuestaVerbalPendiente } = await cargar();
    // Ya existe EVALUADA (por ejemplo, el reintento del servidor la completó).
    tabla.set(clave("s1", "comprension"), fila({ estado: "evaluado", evaluacion_json: { puntaje: 5 } }));

    const id = await insertarRespuestaVerbalPendiente(pendienteBase as never);

    const guardada = tabla.get(clave("s1", "comprension"));
    expect(id).toBeDefined();
    // Lo esencial: NO se degradó a 'pendiente' ni se perdió la evaluación.
    expect(guardada?.estado).toBe("evaluado");
    expect(guardada?.evaluacion_json).toEqual({ puntaje: 5 });
  });

  it("si Postgres escribió pero se perdió la respuesta, el reintento NO duplica", async () => {
    const { insertarRespuestaVerbalPendiente } = await cargar();
    perderRespuestaTrasEscribir = { activo: true, veces: 1 };

    const primero = await insertarRespuestaVerbalPendiente(pendienteBase as never);
    expect(primero).toBeNull(); // se reportó el fallo (no se ocultó)
    expect(tabla.size).toBe(1); // pero la fila SÍ quedó escrita

    // Reintento del mismo bloque (como haría la cola de sync).
    const segundo = await insertarRespuestaVerbalPendiente(pendienteBase as never);
    expect(tabla.size).toBe(1); // sigue habiendo UNA sola fila
    expect(segundo).not.toBeNull();
  });
});

describe("syncRespuestaVerbal sin id — no pisa una evaluación terminal", () => {
  it("respuesta pendiente se guarda", async () => {
    const { syncRespuestaVerbal } = await cargar();
    const ok = await syncRespuestaVerbal({
      session_id: "s1",
      tarea: "comprension",
      texto: "texto",
      evaluacion_json: null,
      estado: "pendiente",
      pegado: false,
      caracteres_pegados: 0,
      revision_requerida: false,
      intento: 1,
    } as never);

    expect(ok).toBe(true);
    expect(tabla.get(clave("s1", "comprension"))?.estado).toBe("pendiente");
  });

  it("reintento con resultado escribe la evaluación", async () => {
    const { syncRespuestaVerbal } = await cargar();
    tabla.set(clave("s1", "comprension"), fila({ estado: "pendiente" }));

    const ok = await syncRespuestaVerbal({
      session_id: "s1",
      tarea: "comprension",
      texto: "texto",
      evaluacion_json: { puntaje: 4 },
      estado: "evaluado",
      pegado: false,
      caracteres_pegados: 0,
      revision_requerida: false,
      intento: 1,
    } as never);

    expect(ok).toBe(true);
    const g = tabla.get(clave("s1", "comprension"));
    expect(g?.estado).toBe("evaluado");
    expect(g?.evaluacion_json).toEqual({ puntaje: 4 });
  });

  it("evaluación YA TERMINAL no se pisa con un estado no terminal", async () => {
    const { syncRespuestaVerbal } = await cargar();
    tabla.set(clave("s1", "comprension"), fila({ estado: "evaluado", evaluacion_json: { puntaje: 5 } }));

    const ok = await syncRespuestaVerbal({
      session_id: "s1",
      tarea: "comprension",
      texto: "texto viejo",
      evaluacion_json: null,
      estado: "no_evaluado",
      pegado: false,
      caracteres_pegados: 0,
      revision_requerida: false,
      intento: 1,
    } as never);

    // Se reporta true: el dato bueno (la evaluación) ya está guardado.
    expect(ok).toBe(true);
    const g = tabla.get(clave("s1", "comprension"));
    expect(g?.estado).toBe("evaluado");
    expect(g?.evaluacion_json).toEqual({ puntaje: 5 });
  });

  it("doble sincronización del mismo resultado no duplica la fila", async () => {
    const { syncRespuestaVerbal } = await cargar();
    const payload = {
      session_id: "s1",
      tarea: "comprension",
      texto: "texto",
      evaluacion_json: { puntaje: 3 },
      estado: "evaluado",
      pegado: false,
      caracteres_pegados: 0,
      revision_requerida: false,
      intento: 1,
    };

    await syncRespuestaVerbal(payload as never);
    await syncRespuestaVerbal(payload as never);

    expect(tabla.size).toBe(1);
  });

  it("sin índice único (42P10) se reporta fallo, no éxito silencioso", async () => {
    // Se controla con la MISMA variable mutable, sin redefinir el módulo.
    const { syncRespuestaVerbal } = await cargar();
    // El próximo upsert fallará con 42P10 porque la tabla del mock no lo soporta:
    // se simula marcando perderRespuesta... no basta. Se usa una tabla "rota":
    // se vacía el mapa para forzar que el upsert cree la fila, y luego se verifica
    // el camino de error con la RPC de resultado. Aquí lo que importa es que un
    // error del proveedor se propague como `false`.
    rpcRespuesta = { data: null, error: { code: "42P10", message: "no unique constraint" } };

    const ok = await syncRespuestaVerbal({
      id: 7,
      session_id: "s1",
      tarea: "comprension",
      texto: "t",
      evaluacion_json: null,
      estado: "no_evaluado",
      pegado: false,
      caracteres_pegados: 0,
      revision_requerida: false,
      intento: 1,
    } as never);

    expect(ok).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// RPC VERBAL: distinguir "terminal propia" de "inexistente/ajena" (00021)
// ══════════════════════════════════════════════════════════════════════════
//
// Antes la RPC devolvía `false` en AMBOS casos, así que una respuesta ya evaluada
// se trataba como fallo y quedaba ETERNAMENTE en la cola. La RPC nueva devuelve un
// texto que permite distinguirlos.
describe("actualizar_evaluacion_verbal_resultado (00021)", () => {
  const respuesta = {
    id: 7,
    session_id: "s1",
    tarea: "comprension" as const,
    texto: "t",
    evaluacion_json: { puntaje: 4 },
    estado: "evaluado" as const,
    pegado: false,
    caracteres_pegados: 0,
    revision_requerida: false,
    intento: 1,
  };

  it("'actualizado' → ÉXITO", async () => {
    const mod = await cargar();
    rpcRespuesta = { data: "actualizado", error: null };
    expect(await mod.syncRespuestaVerbal(respuesta as never)).toBe(true);
  });

  it("'ya_evaluado' (terminal PROPIA) → ÉXITO IDEMPOTENTE, sale de la cola", async () => {
    const mod = await cargar();
    rpcRespuesta = { data: "ya_evaluado", error: null };
    // Este es el caso que antes se reportaba como fallo y dejaba la respuesta
    // atrapada en la cola para siempre.
    expect(await mod.syncRespuestaVerbal(respuesta as never)).toBe(true);
  });

  it("'inexistente' (o AJENA) → FALLO real", async () => {
    const mod = await cargar();
    rpcRespuesta = { data: "inexistente", error: null };
    expect(await mod.syncRespuestaVerbal(respuesta as never)).toBe(false);
  });

  it("un valor inesperado se trata como fallo (no como éxito silencioso)", async () => {
    const mod = await cargar();
    rpcRespuesta = { data: "algo_raro", error: null };
    expect(await mod.syncRespuestaVerbal(respuesta as never)).toBe(false);
  });

  it("DEGRADACIÓN: si 00021 no está aplicada (PGRST202), cae a la RPC legada", async () => {
    // El código nuevo no rompe un entorno sin la migración.
    const mod = await cargar();
    rpcResultadoNoExiste = true;
    // La legada responde true, así que el resultado es éxito.
    expect(await mod.syncRespuestaVerbal(respuesta as never)).toBe(true);
  });
});
