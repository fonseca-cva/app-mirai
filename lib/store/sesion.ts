// Identidad de la sesión de la experiencia (sin login) + retención local.
//
// REGLA DE NEGOCIO (pilot readiness — no negociable):
//   * Una EXPERIENCIA NUEVA siempre recibe un sessionId NUEVO.
//   * RETOMAR conserva el sessionId: es la misma experiencia, con las mismas
//     respuestas. Y SOLO se permite si el sessionId del estado persistido es
//     EXACTAMENTE el mismo que el de la cookie (ver lib/store/experiencia.ts).
//   * EMPEZAR OTRA descarta el sessionId anterior y todo su estado.
//
// Motivación: computadores compartidos de una sala. Si el alumno 2 abre
// /experiencia, la cookie y el localStorage del alumno 1 pueden seguir ahí;
// mezclarlos produciría una sesión con las respuestas de dos personas.
//
// ── RETENCIÓN LOCAL Y DATOS DE MENORES ─────────────────────────────────────
// El localStorage guarda RESPUESTAS DEL INSTRUMENTO, incluidas las respuestas
// verbales de texto abierto que el alumno escribió. Por eso:
//   * El estado persistido lleva su propio `expiraEn`, como MÁXIMO igual a la
//     vida de la cookie (7 días). No se decide una retención mayor acá: eso
//     requiere revisión legal.
//   * Se purga automáticamente si falta la cookie, si expiró o si no coincide
//     con el estado persistido (ver `evaluarReanudable`).
//   * Se limpia por completo al completar o descartar la experiencia.
// La cookie no es de tracking: es técnica y de primera parte.

const COOKIE_SESION = "mirai_session_id";
// Ventana de pausa/retorno del spec (7 días) — es también el TECHO de la
// retención del estado local. No ampliar sin revisión legal.
export const SIETE_DIAS_SEGUNDOS = 7 * 24 * 60 * 60;
export const RETENCION_MS = SIETE_DIAS_SEGUNDOS * 1000;

function leerCookie(nombre: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${nombre}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function escribirCookie(nombre: string, valor: string, maxAgeSegundos: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${nombre}=${encodeURIComponent(valor)}; path=/; max-age=${maxAgeSegundos}; samesite=lax`;
}

function borrarCookie(nombre: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${nombre}=; path=/; max-age=0; samesite=lax`;
}

// sessionId de la experiencia EN CURSO según el navegador, o null. Lectura pura.
export function sesionEnCurso(): string | null {
  return leerCookie(COOKIE_SESION);
}

// Crea una experiencia NUEVA: UUID nuevo persistido en la cookie.
export function crearSessionIdNuevo(): string {
  const nuevo = crypto.randomUUID();
  escribirCookie(COOKIE_SESION, nuevo, SIETE_DIAS_SEGUNDOS);
  return nuevo;
}

// Descarta la sesión en curso.
export function descartarSesionEnCurso(): void {
  borrarCookie(COOKIE_SESION);
}

// Compatibilidad con el flujo histórico.
export function obtenerOCrearSessionId(): string {
  return sesionEnCurso() ?? crearSessionIdNuevo();
}

// ── Coherencia cookie ↔ estado persistido ──────────────────────────────────
// Es la ÚNICA función que decide si el estado persistido es reanudable. Codifica
// las reglas que antes estaban repartidas y podían mezclar a dos alumnos:
//   * Sin cookie            → nada reanudable (el estado es huérfano: se purga).
//   * Cookie ≠ estado       → estado INVÁLIDO (pertenece a otra experiencia).
//   * Expirado              → nada reanudable.
//   * Sin sesión persistida → nada reanudable.
//   * `!incompleta`         → la experiencia ya terminó o nunca empezó.
export type EstadoReanudable =
  | { reanudable: true }
  | { reanudable: false; motivo: "sin_cookie" | "cookie_distinta" | "expirado" | "sin_sesion" | "no_incompleta" };

export function evaluarReanudable(estado: {
  sessionId: string | null;
  experienciaIncompleta: boolean;
  expiraEn: number | null;
  // Metadato NO AUTORITATIVO: solo informa que la sesión se creó en modo prueba,
  // para que el llamador sepa que DEBE revalidar antes de usarla. No se evalúa
  // aquí: esta función decide si el estado es reanudable, no si está autorizado.
  sesionEraPrueba?: boolean;
}): EstadoReanudable {
  const cookie = sesionEnCurso();
  if (!cookie) return { reanudable: false, motivo: "sin_cookie" };
  if (!estado.sessionId) return { reanudable: false, motivo: "sin_sesion" };
  // Comprobación central: NUNCA mezclar la sesión de la cookie con respuestas de
  // otra sesión. Si difieren, el estado persistido es basura y se descarta entero.
  if (estado.sessionId !== cookie) return { reanudable: false, motivo: "cookie_distinta" };
  if (estado.expiraEn != null && Date.now() > estado.expiraEn) return { reanudable: false, motivo: "expirado" };
  if (!estado.experienciaIncompleta) return { reanudable: false, motivo: "no_incompleta" };
  return { reanudable: true };
}
