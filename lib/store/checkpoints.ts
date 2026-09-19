// CHECKPOINTS REANUDABLES (pilot readiness).
//
// Problema que resuelve: cada bloque lleva su propio progreso con `useState`
// (índice de la tarjeta actual, juego en curso, tarea verbal…). Ese estado NO se
// persiste, así que al recargar todos los bloques volvían al ítem 0 aunque el
// store tuviera las respuestas. El resultado era un flujo que "seguía donde
// quedó" solo en apariencia: el alumno volvía a responder lo mismo.
//
// Solución (opción B del pedido): NO se persiste el índice. Se DERIVA del estado
// ya persistido (las respuestas), que es la única fuente de verdad. Ventajas:
//   * no hay dos fuentes que puedan divergir (índice vs. respuestas);
//   * recargar abre siempre en el primer ítem PENDIENTE, incluso si el alumno
//     retrocedió o si una respuesta se perdió;
//   * no hace falta invalidar nada al reordenar el catálogo.
//
// Las funciones son puras y testeables sin DOM.

export interface ConId {
  id: string;
}

/**
 * Índice del primer ítem del catálogo que AÚN NO tiene respuesta.
 * Devuelve `catalogo.length` si ya están todas (bloque completo).
 *
 * Se recorre el catálogo en su orden real (no las respuestas), así que:
 *   * responder fuera de orden no salta ítems pendientes;
 *   * una respuesta de un catálogo viejo (id desconocido) no desplaza el índice.
 */
export function siguienteIndicePendiente(catalogo: ConId[], respondidos: string[]): number {
  const set = new Set(respondidos);
  const i = catalogo.findIndex((item) => !set.has(item.id));
  return i === -1 ? catalogo.length : i;
}

/**
 * ¿El bloque está completo? Se compara contra el catálogo (no contra un contador
 * previo), así que es inmune a duplicados y a respuestas huérfanas.
 */
export function bloqueCompleto(catalogo: ConId[], respondidos: string[]): boolean {
  if (catalogo.length === 0) return false;
  const set = new Set(respondidos);
  return catalogo.every((item) => set.has(item.id));
}

/**
 * Reinicio explícito de un subbloque incompleto.
 *
 * Requisito del pedido: "si un subbloque incompleto debe reiniciarse, elimina
 * primero de forma explícita sus respuestas parciales; no mezcles intentos".
 * Un juego cognitivo a medias (p. ej. matrices abandonado a mitad) NO se puede
 * continuar ítem por ítem sin repetir estímulos ya vistos, así que se reinicia
 * ENTERO: se descartan sus respuestas parciales antes de volver a empezarlo.
 * Devuelve la lista de respuestas que deben conservarse.
 */
export function respuestasSinJuego<T extends { juego: string }>(respuestas: T[], juego: string): T[] {
  return respuestas.filter((r) => r.juego !== juego);
}

/**
 * Primer juego cognitivo pendiente, en el orden oficial del bloque.
 * Si todos están completos, devuelve el último (el bloque se cerrará solo).
 * Mismo criterio que `siguienteIndicePendiente`: se recorre el orden real.
 */
export function siguienteJuegoPendiente<J extends string>(
  orden: readonly J[],
  itemsPorJuego: Record<J, ConId[]>,
  respondidos: Array<{ juego: string; itemId: string }>
): J {
  for (const juego of orden) {
    const respondidosDeJuego = respondidos.filter((r) => r.juego === juego).map((r) => r.itemId);
    if (!bloqueCompleto(itemsPorJuego[juego], respondidosDeJuego)) return juego;
  }
  return orden[orden.length - 1];
}

/**
 * Tareas verbales: cuál es la primera pendiente, en el orden fijo del bloque.
 */
export function siguienteTareaPendiente<T extends string>(
  orden: readonly T[],
  respondidas: Array<{ tarea: string; estado: string }>
): T {
  // Una respuesta 'no_evaluado'/'error' cuenta como respondida: el alumno ya
  // entregó su texto y el bloque no debe pedírselo otra vez (el reintento es
  // asíncrono del servidor, no del alumno).
  const set = new Set(respondidas.map((r) => r.tarea));
  const pendiente = orden.find((t) => !set.has(t));
  return pendiente ?? orden[orden.length - 1];
}

// ══════════════════════════════════════════════════════════════════════════
// ESTADO DE UN BLOQUE POR ÍNDICE (evita leer fuera del catálogo)
// ══════════════════════════════════════════════════════════════════════════
//
// Motivo: `siguienteIndicePendiente` devuelve `catalogo.length` cuando el bloque
// ya está completo. Los componentes hacían `catalogo[indice]` y obtenían
// `undefined`, para después acceder a `.id` / `.nombre` → crash al recargar una
// experiencia ya terminada. Este ayudante encapsula los tres estados posibles
// para que ningún componente vuelva a indexar a ciegas.

export type EstadoBloque<T> =
  | { estado: "pendiente"; item: T; indice: number; esUltimo: boolean }
  | { estado: "completo"; item: null; indice: number; esUltimo: true };

/**
 * Estado del bloque dado el catálogo, las respuestas y el índice actual.
 *
 * - `pendiente`: hay un ítem que mostrar (nunca fuera de rango).
 * - `completo` : el índice alcanzó el final o ya están todas las respuestas;
 *                `item` es null a propósito, para que el llamador deba manejar la
 *                pantalla de bloque terminado en vez de recibir un `undefined`.
 *
 * El índice se ACOTA al catálogo: un índice corrupto (persistido por una versión
 * vieja, o mayor que el catálogo tras un cambio de contenido) no puede producir
 * un acceso fuera de rango.
 */
export function estadoBloque<T extends ConId>(
  catalogo: T[],
  respondidos: string[],
  indice: number
): EstadoBloque<T> {
  if (catalogo.length === 0) return { estado: "completo", item: null, indice: 0, esUltimo: true };
  const acotado = Math.max(0, Math.min(indice, catalogo.length));
  if (acotado >= catalogo.length || bloqueCompleto(catalogo, respondidos)) {
    return { estado: "completo", item: null, indice: catalogo.length, esUltimo: true };
  }
  return {
    estado: "pendiente",
    item: catalogo[acotado],
    indice: acotado,
    esUltimo: acotado + 1 >= catalogo.length,
  };
}
