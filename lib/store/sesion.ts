const COOKIE_SESION = "mirai_session_id";
const SIETE_DIAS_SEGUNDOS = 7 * 24 * 60 * 60;

function leerCookie(nombre: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${nombre}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function escribirCookie(nombre: string, valor: string, maxAgeSegundos: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${nombre}=${encodeURIComponent(valor)}; path=/; max-age=${maxAgeSegundos}; samesite=lax`;
}

// Cookie técnica de primera parte (no de tracking): identifica la sesión de la experiencia,
// sin login. Expira a los 7 días según la regla de pausa/retorno del spec.
export function obtenerOCrearSessionId(): string {
  const existente = leerCookie(COOKIE_SESION);
  if (existente) return existente;

  const nuevo = crypto.randomUUID();
  escribirCookie(COOKIE_SESION, nuevo, SIETE_DIAS_SEGUNDOS);
  return nuevo;
}
