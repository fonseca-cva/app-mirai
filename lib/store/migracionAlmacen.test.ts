// MIGRACIÓN ENTRE ALMACENES — secuencia determinista (pilot readiness).
//
// El bug que cierra: `migrarEntreAlmacenes()` corría en un useEffect DESPUÉS de que
// zustand hidratara automáticamente. Copiaba el JSON al almacén nuevo, pero el store
// en memoria ya se había hidratado del almacén VACÍO, así que el alumno perdía la
// reanudación hasta una segunda recarga.
//
// Ahora el store usa `skipHydration` y la página hace: migrar → rehidratar → purgar.
// Estos tests ejercitan ESA secuencia, no una aproximación.
//
// Caso cubierto (el pedido): estado válido en localStorage + configuración nueva
// sessionStorage + misma cookie + PRIMERA apertura (sin recarga extra) → la UI debe
// poder continuar, conservando paso y respuestas, y localStorage debe quedar limpio.

import { describe, it, expect, beforeEach, vi } from "vitest";
import { instalarNavegadorFalso, type NavegadorFalso } from "@/lib/store/testNavegador";

let navegador: NavegadorFalso;

const CLAVE = "mirai-experiencia";
const SESSION_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const SESSION_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

beforeEach(() => {
  navegador = instalarNavegadorFalso();
  vi.resetModules();
  // Modalidad nueva: sessionStorage (piloto escolar). Es el default, se explicita
  // para que la prueba no dependa del entorno.
  vi.stubEnv("NEXT_PUBLIC_MIRAI_ALMACENAMIENTO", "sessionStorage");
});

function estadoEnLocalStorage(sessionId: string) {
  // Como lo dejaría una versión anterior de la app (modalidad b2c).
  navegador.localStorage.set(
    CLAVE,
    JSON.stringify({
      state: {
        sessionId,
        paso: "gustos",
        experienciaIncompleta: true,
        iniciadaEn: Date.now(),
        expiraEn: Date.now() + 86_400_000,
        sesionEraPrueba: false,
        cognitivoCompleto: false,
        respuestasGustos: [{ contextoId: "tec-01", valor: 2, ayudaAbierta: false, audioActivado: false }],
        respuestasCognitivo: [],
        respuestasVerbal: [],
        respuestasDivergente: [],
        respuestasActividades: [],
        respuestasAsignaturas: [],
        aspiracion: { opcion: "universidad", detalle: null },
      },
      version: 3,
    })
  );
}

/** Arranca la persistencia como la página: migrar → rehidratar. */
async function arrancarComoLaApp() {
  const { inicializarPersistencia } = await import("@/lib/store/almacenamiento");
  const { useExperienciaStore } = await import("@/lib/store/experiencia");
  return await inicializarPersistencia({
    rehydrate: () => useExperienciaStore.persist.rehydrate(),
    leerCookie: () => navegador.cookies.get("mirai_session_id") ?? null,
  });
}

describe("cambio de modalidad: localStorage → sessionStorage", () => {
  it("PRIMERA apertura (sin recarga extra): migra y la UI puede continuar", async () => {
    // Estado de la modalidad anterior + la cookie vigente (misma sesión).
    estadoEnLocalStorage(SESSION_A);
    navegador.cookies.set("mirai_session_id", SESSION_A);

    const { accion } = await arrancarComoLaApp();
    expect(accion).toBe("migrado");

    const { useExperienciaStore } = await import("@/lib/store/experiencia");
    // Lo esencial: en la PRIMERA carga el store ya tiene el estado migrado. Antes
    // había que recargar una segunda vez para verlo.
    expect(useExperienciaStore.getState().sessionId).toBe(SESSION_A);
    expect(useExperienciaStore.getState().paso).toBe("gustos");
    expect(useExperienciaStore.getState().respuestasGustos).toHaveLength(1);
    expect(useExperienciaStore.getState().aspiracion).toEqual({ opcion: "universidad", detalle: null });

    // Y la UI puede ofrecer continuar sin recargar.
    expect(useExperienciaStore.getState().hayExperienciaReanudable()).toBe(true);
  });

  it("localStorage queda LIMPIO tras migrar (no se rehidrata dos veces)", async () => {
    estadoEnLocalStorage(SESSION_A);
    navegador.cookies.set("mirai_session_id", SESSION_A);

    await arrancarComoLaApp();

    expect(navegador.localStorage.has(CLAVE)).toBe(false);
    expect(navegador.sessionStorage.has(CLAVE)).toBe(true);
  });

  it("cookie DISTINTA: descarta en vez de migrar (no mezcla sesiones)", async () => {
    estadoEnLocalStorage(SESSION_A);
    navegador.cookies.set("mirai_session_id", SESSION_B); // el alumno es otro

    const { accion } = await arrancarComoLaApp();
    expect(accion).toBe("descartado-por-incoherente");

    const { useExperienciaStore } = await import("@/lib/store/experiencia");
    // No se migró el estado de A a la sesión de B.
    expect(useExperienciaStore.getState().sessionId).toBeNull();
    expect(useExperienciaStore.getState().respuestasGustos).toHaveLength(0);
    // Y el estado viejo se eliminó.
    expect(navegador.localStorage.has(CLAVE)).toBe(false);
  });

  it("sin cookie: descarta (no hay experiencia legítima que migrar)", async () => {
    estadoEnLocalStorage(SESSION_A);

    const { accion } = await arrancarComoLaApp();
    expect(accion).toBe("descartado-por-incoherente");
    expect(navegador.localStorage.has(CLAVE)).toBe(false);

    const { useExperienciaStore } = await import("@/lib/store/experiencia");
    expect(useExperienciaStore.getState().sessionId).toBeNull();
  });

  it("el almacén ACTIVO manda: si sessionStorage ya tiene estado, no se pisa", async () => {
    // Estado nuevo (ya en sessionStorage) y basura vieja en localStorage.
    navegador.sessionStorage.set(
      CLAVE,
      JSON.stringify({
        state: { sessionId: SESSION_A, paso: "actividades", experienciaIncompleta: true, expiraEn: Date.now() + 100000 },
        version: 3,
      })
    );
    navegador.localStorage.set(CLAVE, JSON.stringify({ state: { sessionId: SESSION_B, paso: "intro" }, version: 3 }));
    navegador.cookies.set("mirai_session_id", SESSION_A);

    const { accion } = await arrancarComoLaApp();
    expect(accion).toBe("sin-cambios");

    const { useExperienciaStore } = await import("@/lib/store/experiencia");
    // Se conserva el estado del almacén activo, no el viejo.
    expect(useExperienciaStore.getState().paso).toBe("actividades");
    // Y la basura se elimina.
    expect(navegador.localStorage.has(CLAVE)).toBe(false);
  });

  it("estado corrupto en el almacén viejo: se descarta, no rompe la carga", async () => {
    navegador.localStorage.set(CLAVE, "{no es json}");
    navegador.cookies.set("mirai_session_id", SESSION_A);

    const { accion } = await arrancarComoLaApp();
    expect(accion).toBe("descartado-por-incoherente");

    const { useExperienciaStore } = await import("@/lib/store/experiencia");
    expect(useExperienciaStore.getState().sessionId).toBeNull();
  });
});
