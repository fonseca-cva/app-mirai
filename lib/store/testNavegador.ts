// Arnés compartido para los tests del store: emula el navegador (cookie +
// almacenamiento) respetando la modalidad configurada.
//
// IMPORTANTE: el almacén por defecto es `sessionStorage` (piloto escolar), no
// `localStorage`. Los tests deben stubbear AMBOS para no depender de cuál esté
// configurada, y `leerEstadoCrudo` devuelve el estado venga de donde venga.

import { vi } from "vitest";

export interface NavegadorFalso {
  sessionStorage: Map<string, string>;
  localStorage: Map<string, string>;
  cookies: Map<string, string>;
  /** Lee el estado persistido del almacén que la app esté usando. */
  leerEstado: () => Record<string, unknown> | null;
  /** Escribe a mano el estado (simula otro alumno o manipulación). */
  escribirEstado: (state: Record<string, unknown>, version?: number) => void;
  /** Fija la cookie de sesión. */
  fijarCookie: (sessionId: string) => void;
}

function crearStorageFalso(mapa: Map<string, string>): Storage {
  return {
    getItem: (k: string) => (mapa.has(k) ? (mapa.get(k) as string) : null),
    setItem: (k: string, v: string) => void mapa.set(k, String(v)),
    removeItem: (k: string) => void mapa.delete(k),
    clear: () => mapa.clear(),
    key: (i: number) => Array.from(mapa.keys())[i] ?? null,
    get length() {
      return mapa.size;
    },
  } as Storage;
}

/**
 * Instala `window` con sessionStorage y localStorage, y `document.cookie`.
 * Devuelve utilidades para inspeccionar y preparar el estado.
 */
export function instalarNavegadorFalso(): NavegadorFalso {
  const sessionStorage = new Map<string, string>();
  const localStorage = new Map<string, string>();
  const cookies = new Map<string, string>();

  vi.stubGlobal("window", {
    sessionStorage: crearStorageFalso(sessionStorage),
    localStorage: crearStorageFalso(localStorage),
  });

  vi.stubGlobal("document", {
    get cookie() {
      return Array.from(cookies.entries()).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("; ");
    },
    set cookie(raw: string) {
      const [par, ...attrs] = raw.split(";");
      const [nombre, valor = ""] = par.split("=");
      const limpio = decodeURIComponent(valor.trim());
      if (attrs.some((a) => a.trim().startsWith("max-age=0")) || limpio === "") cookies.delete(nombre.trim());
      else cookies.set(nombre.trim(), limpio);
    },
  });

  const CLAVE = "mirai-experiencia";

  return {
    sessionStorage,
    localStorage,
    cookies,
    leerEstado: () => {
      const crudo = sessionStorage.get(CLAVE) ?? localStorage.get(CLAVE) ?? null;
      if (!crudo) return null;
      try {
        return (JSON.parse(crudo) as { state: Record<string, unknown> }).state;
      } catch {
        return null;
      }
    },
    escribirEstado: (state, version = 3) => {
      const payload = JSON.stringify({ state, version });
      sessionStorage.set(CLAVE, payload);
      localStorage.set(CLAVE, payload);
    },
    fijarCookie: (sessionId) => {
      cookies.set("mirai_session_id", sessionId);
    },
  };
}


/**
 * Rehidrata el store como lo hace la app al montar.
 *
 * El store usa `skipHydration`, así que en los tests HAY que llamar a esto después
 * de preparar el estado y la cookie: sin ello el store queda vacío. Reproduce la
 * secuencia real (migrar → rehidratar) para que los tests ejerciten el mismo camino
 * que la página.
 */
export async function arrancarPersistencia(leerCookie: () => string | null): Promise<void> {
  const { inicializarPersistencia } = await import("@/lib/store/almacenamiento");
  const { useExperienciaStore } = await import("@/lib/store/experiencia");
  await inicializarPersistencia({
    rehydrate: () => useExperienciaStore.persist.rehydrate(),
    leerCookie,
  });
}

/** Atajo: rehidrata usando la cookie del navegador falso. */
export async function rehidratar(): Promise<void> {
  const { useExperienciaStore } = await import("@/lib/store/experiencia");
  await useExperienciaStore.persist.rehydrate();
}
