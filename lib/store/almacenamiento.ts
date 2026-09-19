// ALMACENAMIENTO LOCAL DE LA EXPERIENCIA — configuración explícita.
//
// El estado persistido contiene RESPUESTAS DEL INSTRUMENTO, incluidas las verbales
// de texto abierto y la aspiración del alumno. Por eso dónde vive ese estado es una
// decisión de producto y de privacidad, no un detalle de implementación.
//
// ── DOS MODALIDADES ──────────────────────────────────────────────────────────
//   "piloto-escolar" (DEFAULT): sessionStorage.
//     Sobrevive a las recargas de la pestaña, pero se borra al cerrarla. En un
//     computador compartido de una sala, al terminar la clase NO queda nada de un
//     alumno en el disco. Es la modalidad elegida para el piloto.
//
//   "b2c": localStorage.
//     Permite reanudar entre sesiones de navegación (hasta RETENCION_MS). Requiere
//     configuración explícita Y política de privacidad aprobada: deja respuestas en
//     el disco hasta 7 días. NO se activa por defecto.
//
// ── CÓMO SE ELIGE ────────────────────────────────────────────────────────────
// Con `NEXT_PUBLIC_MIRAI_ALMACENAMIENTO`:
//   * sin definir, "sessionStorage" o cualquier valor no reconocido → piloto-escolar
//     (el default es el más protector, y un valor raro NO escala privilegios);
//   * "localStorage" → b2c.
// El valor se resuelve UNA vez al cargar el módulo.
//
// ── CAMBIO DE MODALIDAD ──────────────────────────────────────────────────────
// Si se cambia la modalidad, el estado viejo queda en el OTRO almacén. Para no
// mezclarlo, `migrarEntreAlmacenes()` migra el estado SOLO si su sessionId coincide
// con la cookie vigente, y borra el del almacén anterior. Un estado huérfano (de
// otra sesión) se descarta en vez de reutilizarse.

import { createJSONStorage, type StateStorage } from "zustand/middleware";
import type { PersistStorage } from "zustand/middleware";

export type ModalidadAlmacenamiento = "piloto-escolar" | "b2c";

/** Qué hizo la migración entre almacenes. */
export type AccionMigracion = "sin-cambios" | "migrado" | "descartado-por-incoherente";

export const CLAVE_ESTADO = "mirai-experiencia";

/** Modalidad resuelta desde el entorno. El default es el más protector. */
export function modalidadConfigurada(): ModalidadAlmacenamiento {
  const valor = process.env.NEXT_PUBLIC_MIRAI_ALMACENAMIENTO;
  return valor === "localStorage" ? "b2c" : "piloto-escolar";
}

/** Nombre del almacén de cada modalidad, para poder migrar y limpiar. */
export function almacenDe(modalidad: ModalidadAlmacenamiento): "sessionStorage" | "localStorage" {
  return modalidad === "b2c" ? "localStorage" : "sessionStorage";
}

/** Storage crudo (string → string) del almacén que corresponde a la modalidad. */
export function storageCrudoDeExperiencia(): StateStorage {
  const inalcanzable: StateStorage = {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
  };
  if (typeof window === "undefined") return inalcanzable;

  const nombre = almacenDe(modalidadConfigurada());
  const almacen = (window as unknown as Record<string, Storage | undefined>)[nombre];
  if (!almacen) return inalcanzable;

  return {
    getItem: (clave) => almacen.getItem(clave),
    setItem: (clave, valor) => {
      almacen.setItem(clave, valor);
    },
    removeItem: (clave) => {
      almacen.removeItem(clave);
    },
  };
}

/**
 * Evita mezclar estados al cambiar de modalidad.
 *
 * Reglas:
 *   * Si el almacén ACTIVO ya tiene estado, no se toca (es el vigente).
 *   * Si no lo tiene pero el OTRO sí, se migra SOLO si su `sessionId` coincide con
 *     la cookie vigente. Si no coincide (estado de otra sesión/alumno), se BORRA en
 *     vez de reutilizarlo.
 *   * Siempre se limpia el almacén anterior tras decidir, para que no quede basura
 *     que una futura modalidad pudiera rehidratar por error.
 *
 * Devuelve qué hizo, para poder registrarlo en pruebas.
 */
export function migrarEntreAlmacenes(leerCookie: () => string | null): AccionMigracion {
  if (typeof window === "undefined") return "sin-cambios";

  const activo = almacenDe(modalidadConfigurada());
  const otro = activo === "sessionStorage" ? "localStorage" : "sessionStorage";
  const almacenActivo = (window as unknown as Record<string, Storage | undefined>)[activo];
  const almacenOtro = (window as unknown as Record<string, Storage | undefined>)[otro];
  if (!almacenActivo || !almacenOtro) return "sin-cambios";

  // El almacén activo manda: si ya hay estado, el otro es basura de una modalidad
  // anterior y se elimina para que no pueda rehidratarse nunca.
  if (almacenActivo.getItem(CLAVE_ESTADO)) {
    almacenOtro.removeItem(CLAVE_ESTADO);
    return "sin-cambios";
  }

  const crudo = almacenOtro.getItem(CLAVE_ESTADO);
  if (!crudo) return "sin-cambios";

  try {
    const parseado = JSON.parse(crudo) as { state?: { sessionId?: string | null } };
    const sessionIdDelEstado = parseado?.state?.sessionId ?? null;
    const cookie = leerCookie();

    // Coherencia cookie ↔ estado: sin coincidencia NO se migra (evita mezclar
    // sesiones), se descarta.
    if (sessionIdDelEstado && cookie && sessionIdDelEstado === cookie) {
      almacenActivo.setItem(CLAVE_ESTADO, crudo);
      almacenOtro.removeItem(CLAVE_ESTADO);
      return "migrado";
    }

    almacenOtro.removeItem(CLAVE_ESTADO);
    return "descartado-por-incoherente";
  } catch {
    // Estado corrupto: no se migra, se elimina.
    almacenOtro.removeItem(CLAVE_ESTADO);
    return "descartado-por-incoherente";
  }
}


/**
 * Storage para `persist`, con serialización JSON.
 *
 * Se usa `createJSONStorage` porque `persist` necesita
 * `getItem(): StorageValue<T> | null` (objeto deserializado), no el string crudo.
 * Sin `window` (SSR) devuelve el storage crudo inalcanzable, y zustand no persiste
 * nada en el servidor.
 */
export function storageDeExperiencia<T>(): PersistStorage<T> {
  // `createJSONStorage` ya devuelve `PersistStorage<T>`; el cast se limita al
  // `Storage` que pide su callback, porque el storage falso de los tests no
  // implementa toda la interfaz del DOM.
  return createJSONStorage<T>(() => storageCrudoDeExperiencia() as unknown as Storage) as unknown as PersistStorage<T>;
}

/**
 * Secuencia DETERMINISTA de arranque de la persistencia.
 *
 * Orden obligatorio (era el bug: zustand hidrataba solo, antes de migrar):
 *   1. MIGRAR entre almacenes (si cambió la modalidad), leyendo la cookie para
 *      comprobar la coherencia. Solo copia estado cuyo sessionId coincide.
 *   2. REHIDRATAR el store desde el almacén que corresponde YA migrado.
 *   3. Devolver el control: la página purga incoherencias y decide la reanudación.
 *
 * Recibe las operaciones por parámetro para poder probarse sin DOM ni el store
 * real (y para no crear una dependencia circular almacenamiento → store).
 */
export async function inicializarPersistencia(deps: {
  rehydrate: () => Promise<void> | void;
  leerCookie: () => string | null;
}): Promise<{ accion: AccionMigracion }> {
  // 1. Migrar ANTES de hidratar: el estado que llegue al store será el correcto.
  const accion = migrarEntreAlmacenes(deps.leerCookie);
  // 2. Hidratar desde el almacén ya definitivo.
  await deps.rehydrate();
  return { accion };
}
