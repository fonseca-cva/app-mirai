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
