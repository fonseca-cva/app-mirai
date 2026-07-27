export const SIMBOLOS_SECUENCIAS = 6; // símbolos origami fijos, representados por índice 0-5
const LARGO_INICIAL = 3;
const LARGO_MAXIMO = 8;

export interface EstadoSecuencias {
  largoActual: number;
  erroresEnLargoActual: number;
  largoMaximoLogrado: number; // 0 si aún no supera el largo inicial
  terminado: boolean;
}

export const ESTADO_INICIAL_SECUENCIAS: EstadoSecuencias = {
  largoActual: LARGO_INICIAL,
  erroresEnLargoActual: 0,
  largoMaximoLogrado: 0,
  terminado: false,
};

// Máquina de estados adaptativa (sección 3.3): acierto → +1 de largo; error → repite el
// mismo largo una vez; segundo error consecutivo en el mismo largo → termina. Tope: largo 8.
export function avanzarSecuencia(estado: EstadoSecuencias, acierto: boolean): EstadoSecuencias {
  if (estado.terminado) return estado;

  if (acierto) {
    const largoMaximoLogrado = Math.max(estado.largoMaximoLogrado, estado.largoActual);
    if (estado.largoActual >= LARGO_MAXIMO) {
      return { ...estado, largoMaximoLogrado, terminado: true };
    }
    return { largoActual: estado.largoActual + 1, erroresEnLargoActual: 0, largoMaximoLogrado, terminado: false };
  }

  if (estado.erroresEnLargoActual === 0) {
    return { ...estado, erroresEnLargoActual: 1 };
  }

  return { ...estado, terminado: true };
}

// Puntaje: span máximo logrado mapeado a 0-100 (sección 3.3).
const MAPA_PUNTAJE: Record<number, number> = { 0: 0, 3: 20, 4: 40, 5: 60, 6: 75, 7: 90, 8: 100 };

export function puntajeSecuencias(largoMaximoLogrado: number): number {
  return MAPA_PUNTAJE[largoMaximoLogrado] ?? 0;
}

// ── Anexo 3: estados explícitos del juego ──────────────────────────
// Tiempos de fase (contrato validado por auditoría, sección Anexo 3):
export const MS_SIMBOLO = 800;
export const MS_ENTRE_SIMBOLOS = 250;
export const MS_PAUSA_FIN_PRESENTACION = 900; // tablero vacío tras la presentación
export const MS_TRANSICION_RONDA = 1200; // mínimo entre rondas, con mensaje
export const MS_TIMEOUT_RESPUESTA = 20_000; // inactividad antes de "¿Sigues ahí?"

export type FaseJuegoSecuencias =
  | "mostrando"
  | "pausa"
  | "esperando-respuesta"
  | "transicion"
  | "timeout"
  | "terminado";

export interface EstadoFaseSecuencias {
  fase: FaseJuegoSecuencias;
  estado: EstadoSecuencias;
  timeoutUsadoEnRonda: boolean;
  tipoTransicion: "acierto" | "reintento" | null;
  // Se incrementa cada vez que hay que presentar una secuencia (nueva ronda o repetición
  // por timeout): la UI lo usa como señal para regenerar la secuencia a mostrar.
  generacionMostrando: number;
}

export const ESTADO_FASE_INICIAL: EstadoFaseSecuencias = {
  fase: "mostrando",
  estado: ESTADO_INICIAL_SECUENCIAS,
  timeoutUsadoEnRonda: false,
  tipoTransicion: null,
  generacionMostrando: 0,
};

export type EventoFaseSecuencias =
  | { tipo: "FIN_PRESENTACION" }
  | { tipo: "FIN_PAUSA" }
  | { tipo: "RESPUESTA_CORRECTA" }
  | { tipo: "RESPUESTA_INCORRECTA" }
  | { tipo: "TIMEOUT" }
  | { tipo: "REPETIR_RONDA" }
  | { tipo: "FIN_TRANSICION" };

// Resuelve el resultado de una ronda (acierto, error, o timeout ya repetido una vez) contra
// la máquina adaptativa: si termina el juego no hay transición: si sigue, se anuncia el tipo
// (acierto → largo sube; reintento → mismo largo) antes de la próxima presentación.
function resolverRonda(previo: EstadoFaseSecuencias, acierto: boolean): EstadoFaseSecuencias {
  const estado = avanzarSecuencia(previo.estado, acierto);
  if (estado.terminado) {
    return { ...previo, estado, fase: "terminado", tipoTransicion: null };
  }
  return { ...previo, estado, fase: "transicion", tipoTransicion: acierto ? "acierto" : "reintento" };
}

// Máquina de fases de UI del juego de Secuencias (Anexo 3): separa perceptiblemente
// presentación, pausa, turno de respuesta, transición entre rondas y timeout por inactividad.
// Pura y sin temporizadores reales para poder testear la secuencia de fases —en particular la
// regla de "el timeout se puede repetir una sola vez"— sin renderizar la UI.
export function reducirFaseSecuencias(
  previo: EstadoFaseSecuencias,
  evento: EventoFaseSecuencias
): EstadoFaseSecuencias {
  switch (evento.tipo) {
    case "FIN_PRESENTACION":
      return previo.fase === "mostrando" ? { ...previo, fase: "pausa" } : previo;
    case "FIN_PAUSA":
      return previo.fase === "pausa" ? { ...previo, fase: "esperando-respuesta" } : previo;
    case "RESPUESTA_CORRECTA":
      return previo.fase === "esperando-respuesta" ? resolverRonda(previo, true) : previo;
    case "RESPUESTA_INCORRECTA":
      return previo.fase === "esperando-respuesta" ? resolverRonda(previo, false) : previo;
    case "TIMEOUT":
      if (previo.fase !== "esperando-respuesta") return previo;
      return previo.timeoutUsadoEnRonda
        ? resolverRonda(previo, false)
        : { ...previo, fase: "timeout" };
    case "REPETIR_RONDA":
      return previo.fase === "timeout"
        ? {
            ...previo,
            fase: "mostrando",
            timeoutUsadoEnRonda: true,
            generacionMostrando: previo.generacionMostrando + 1,
          }
        : previo;
    case "FIN_TRANSICION":
      return previo.fase === "transicion"
        ? {
            ...previo,
            fase: "mostrando",
            timeoutUsadoEnRonda: false,
            tipoTransicion: null,
            generacionMostrando: previo.generacionMostrando + 1,
          }
        : previo;
    default:
      return previo;
  }
}
