import { describe, it, expect, beforeEach, vi } from "vitest";
import { instalarNavegadorFalso, rehidratar, type NavegadorFalso } from "@/lib/store/testNavegador";

let navegador: NavegadorFalso;

beforeEach(() => {
  navegador = instalarNavegadorFalso();
  vi.resetModules();
});


const CLAVE = "mirai-experiencia";
const COOKIE = "mirai_session_id";

const A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

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

// Escribe a mano el estado persistido (simula lo que dejó otro alumno, o una
// manipulación desde devtools).
function escribirEstadoPersistido(payload: Record<string, unknown>, version = 3) {
  // Escribe en AMBOS almacenes: la modalidad (sessionStorage por defecto, o
  // localStorage en b2c) la decide el entorno, y así la prueba no depende de cuál.
  navegador.escribirEstado(payload, version);
}

function estadoConRespuestas(sessionId: string) {
  return {
    sessionId,
    paso: "gustos",
    experienciaIncompleta: true,
    iniciadaEn: Date.now(),
    expiraEn: Date.now() + 60_000,
    respuestasGustos: [{ contextoId: "c1", valor: 2, ayudaAbierta: false, audioActivado: false }],
    respuestasCognitivo: [],
    respuestasVerbal: [],
    respuestasDivergente: [],
    respuestasActividades: [{ actividadId: "a1", valor: 2 }],
    respuestasAsignaturas: [],
    aspiracion: { opcion: "universidad", detalle: null },
  };
}

describe("coherencia cookie ↔ estado persistido", () => {
  it("cookie A + estado A → se puede reanudar, con las MISMAS respuestas", async () => {
    escribirEstadoPersistido(estadoConRespuestas(A));
    navegador.cookies.set(COOKIE, A);
    const store = await abrir();

    expect(store.getState().hayExperienciaReanudable()).toBe(true);
    expect(store.getState().retomarExperiencia()).toBe(true);
    expect(store.getState().sessionId).toBe(A);
    expect(store.getState().respuestasGustos).toHaveLength(1);
    expect(store.getState().respuestasActividades).toHaveLength(1);
  });

  it("cookie B + estado A → NO se reanuda y el estado se PURGA (no se mezcla)", async () => {
    escribirEstadoPersistido(estadoConRespuestas(A));
    navegador.cookies.set(COOKIE, B);
    const store = await abrir();

    expect(store.getState().hayExperienciaReanudable()).toBe(false);
    expect(store.getState().retomarExperiencia()).toBe(false);
    // Lo esencial: NUNCA queda el sessionId de la cookie con las respuestas de A.
    expect(store.getState().sessionId).toBeNull();
    expect(store.getState().respuestasGustos).toEqual([]);
    expect(store.getState().respuestasActividades).toEqual([]);
    // Y la cookie ajena se limpia: no se reutiliza para una experiencia nueva.
    expect(navegador.cookies.has(COOKIE)).toBe(false);
  });

  it("cookie ausente + estado A → NO se reanuda y el estado se PURGA", async () => {
    escribirEstadoPersistido(estadoConRespuestas(A));
    const store = await abrir();

    expect(store.getState().hayExperienciaReanudable()).toBe(false);
    expect(store.getState().retomarExperiencia()).toBe(false);
    expect(store.getState().sessionId).toBeNull();
    expect(store.getState().respuestasGustos).toEqual([]);
  });

  it("cookie A + estado VACÍO (nunca empezó) → no se ofrece reanudar", async () => {
    navegador.cookies.set(COOKIE, A);
    const store = await abrir();

    expect(store.getState().hayExperienciaReanudable()).toBe(false);
    expect(store.getState().motivoNoReanudable()).toBe("sin_sesion");
  });

  it("cookie A + estado A pero expirado → NO se reanuda y se purga", async () => {
    const viejo = estadoConRespuestas(A);
    viejo.expiraEn = Date.now() - 1000; // ya expiró
    escribirEstadoPersistido(viejo);
    navegador.cookies.set(COOKIE, A);
    const store = await abrir();

    expect(store.getState().hayExperienciaReanudable()).toBe(false);
    expect(store.getState().motivoNoReanudable()).toBe("expirado");
    expect(store.getState().retomarExperiencia()).toBe(false);
    expect(store.getState().respuestasGustos).toEqual([]);
  });

  it("cookie A + estado A pero experiencia COMPLETA → no se ofrece reanudar", async () => {
    const completada = estadoConRespuestas(A);
    completada.experienciaIncompleta = false;
    escribirEstadoPersistido(completada);
    navegador.cookies.set(COOKIE, A);
    const store = await abrir();

    expect(store.getState().hayExperienciaReanudable()).toBe(false);
    expect(store.getState().motivoNoReanudable()).toBe("no_incompleta");
  });
});

describe("localStorage manipulado o con versión inválida", () => {
  it("versión vieja (v1) → se descarta por el migrate, no rehidrata respuestas", async () => {
    escribirEstadoPersistido(estadoConRespuestas(A), 1);
    navegador.cookies.set(COOKIE, A);
    const store = await abrir();

    expect(store.getState().sessionId).toBeNull();
    expect(store.getState().respuestasGustos).toEqual([]);
    expect(store.getState().hayExperienciaReanudable()).toBe(false);
  });

  it("versión del formato 'no guardaba nada' (v2) → se descarta igual", async () => {
    escribirEstadoPersistido({}, 2);
    navegador.cookies.set(COOKIE, A);
    const store = await abrir();

    expect(store.getState().sessionId).toBeNull();
  });

  it("JSON corrupto no rompe la carga (el store arranca limpio)", async () => {
    // JSON corrupto se escribe DIRECTAMENTE en el almacén (no vía el helper, que
    // serializa correctamente): es lo que dejaría una manipulación desde devtools.
    navegador.sessionStorage.set(CLAVE, "{esto no es json valido");
    navegador.localStorage.set(CLAVE, "{esto no es json valido");
    navegador.cookies.set(COOKIE, A);

    const store = await abrir();

    expect(store.getState().sessionId).toBeNull();
    expect(store.getState().respuestasGustos).toEqual([]);
    expect(store.getState().hayExperienciaReanudable()).toBe(false);
  });

  it("sessionId con formato inválido (manipulado) se trata como incoherente", async () => {
    escribirEstadoPersistido(estadoConRespuestas("no-es-un-uuid-valido"));
    navegador.cookies.set(COOKIE, A);
    const store = await abrir();

    expect(store.getState().hayExperienciaReanudable()).toBe(false);
    expect(store.getState().retomarExperiencia()).toBe(false);
    expect(store.getState().respuestasGustos).toEqual([]);
  });
});

describe("purga defensiva al montar (purgarEstadoInvalido)", () => {
  it("purga cuando la cookie no coincide, y deja el navegador limpio", async () => {
    escribirEstadoPersistido(estadoConRespuestas(A));
    navegador.cookies.set(COOKIE, B);
    const store = await abrir();

    expect(store.getState().purgarEstadoInvalido()).toBe(true);
    expect(store.getState().sessionId).toBeNull();
    // Y el estado persistido realmente se vació en localStorage.
    const guardado = JSON.parse(navegador.sessionStorage.get(CLAVE) as string);
    expect(guardado.state.sessionId).toBeNull();
    expect(guardado.state.respuestasGustos).toEqual([]);
  });

  it("NO purga cuando todo es coherente", async () => {
    escribirEstadoPersistido(estadoConRespuestas(A));
    navegador.cookies.set(COOKIE, A);
    const store = await abrir();

    expect(store.getState().purgarEstadoInvalido()).toBe(false);
    expect(store.getState().sessionId).toBe(A);
    expect(store.getState().respuestasGustos).toHaveLength(1);
  });

  it("'no_incompleta' NO purga (no hay nada que proteger todavía)", async () => {
    navegador.cookies.set(COOKIE, A);
    const store = await abrir();
    expect(store.getState().purgarEstadoInvalido()).toBe(false);
  });
});

describe("retención local (datos de menores)", () => {
  it("marcarExperienciaIncompleta fija una expiración como máximo igual a la cookie", async () => {
    const { RETENCION_MS } = await import("@/lib/store/sesion");
    const { SIETE_DIAS_SEGUNDOS: _7 } = await import("@/lib/store/sesion");
    const store = await abrir();
    store.getState().iniciarNuevaExperiencia();

    const antes = Date.now();
    store.getState().marcarExperienciaIncompleta();
    const expira = store.getState().expiraEn as number;

    expect(expira).toBeGreaterThanOrEqual(antes + RETENCION_MS - 1000);
    // Techo: 7 días (vida de la cookie). No se retiene más sin revisión legal.
    expect(RETENCION_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("descartarExperiencia limpia la expiración junto con todo lo demás", async () => {
    const store = await abrir();
    store.getState().iniciarNuevaExperiencia();
    store.getState().marcarExperienciaIncompleta();
    expect(store.getState().expiraEn).not.toBeNull();

    store.getState().descartarExperiencia();

    expect(store.getState().expiraEn).toBeNull();
    expect(store.getState().sessionId).toBeNull();
    expect(store.getState().experienciaIncompleta).toBe(false);
  });

  it("los datos del instrumento NO sobreviven al descarte en localStorage", async () => {
    const store = await abrir();
    store.getState().iniciarNuevaExperiencia();
    store.getState().marcarExperienciaIncompleta();
    store.getState().agregarRespuestaVerbal({ tarea: "comprension", texto: "texto abierto del alumno", evaluacion: null, estado: "evaluado" });

    store.getState().descartarExperiencia();

    // El texto abierto es el dato más sensible del instrumento: no debe quedar.
    const guardado = navegador.sessionStorage.get(CLAVE);
    if (guardado) {
      const parsed = JSON.parse(guardado);
      expect(JSON.stringify(parsed.state.respuestasVerbal ?? [])).not.toContain("texto abierto del alumno");
    }
  });
});
