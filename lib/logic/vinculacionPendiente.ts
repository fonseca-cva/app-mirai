// Vinculación pendiente: qué sesión anónima pidió guardar su informe con un correo.
//
// Antes vivía en sessionStorage, que es POR PESTAÑA. El enlace del correo siempre
// abre una pestaña nueva, así que /guardar-informe nunca encontraba el dato:
// decía "otra cuenta" (falso) y no enviaba el correo con el enlace permanente.
// Ahora vive en localStorage (compartido entre pestañas del mismo navegador),
// con vencimiento, y se sigue leyendo sessionStorage por compatibilidad.
//
// Minimización: solo ids opacos y el apodo que la persona escribió; nunca el correo.

const CLAVE = "mirai_vinculacion_pendiente";
// Claves antiguas (sessionStorage), para pestañas abiertas antes de este cambio.
const UID_LEGADO = "mirai_uid_anonimo";
const APODO_LEGADO = "mirai_apodo_pendiente";
const SESION_LEGADO = "mirai_sesion_id";

/** Vence a las 48 h: más que la vigencia del enlace de confirmación. */
const VIGENCIA_MS = 48 * 60 * 60 * 1000;

export interface VinculacionPendiente {
  uid: string;
  sesionId: string | null;
  apodo: string | null;
  creadaEn: number;
}

function almacen(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function guardarVinculacionPendiente(datos: { uid: string; sesionId?: string | null; apodo?: string | null }) {
  const valor: VinculacionPendiente = {
    uid: datos.uid,
    sesionId: datos.sesionId ?? null,
    apodo: datos.apodo ?? null,
    creadaEn: Date.now(),
  };
  try {
    almacen()?.setItem(CLAVE, JSON.stringify(valor));
  } catch {
    // Almacenamiento bloqueado (modo privado estricto): /guardar-informe cae al respaldo por datos.
  }
}

export function leerVinculacionPendiente(ahora = Date.now()): VinculacionPendiente | null {
  try {
    const crudo = almacen()?.getItem(CLAVE);
    if (crudo) {
      const v = JSON.parse(crudo) as VinculacionPendiente;
      if (v && typeof v.uid === "string" && ahora - v.creadaEn <= VIGENCIA_MS) return v;
    }
  } catch {
    // dato corrupto: se ignora
  }
  try {
    const uid = typeof window !== "undefined" ? window.sessionStorage.getItem(UID_LEGADO) : null;
    if (uid) {
      return {
        uid,
        sesionId: window.sessionStorage.getItem(SESION_LEGADO),
        apodo: window.sessionStorage.getItem(APODO_LEGADO),
        creadaEn: ahora,
      };
    }
  } catch {
    // sin sessionStorage
  }
  return null;
}

export function limpiarVinculacionPendiente() {
  try {
    almacen()?.removeItem(CLAVE);
  } catch {
    // ignorar
  }
  try {
    window.sessionStorage.removeItem(UID_LEGADO);
    window.sessionStorage.removeItem(APODO_LEGADO);
    window.sessionStorage.removeItem(SESION_LEGADO);
  } catch {
    // ignorar
  }
}
