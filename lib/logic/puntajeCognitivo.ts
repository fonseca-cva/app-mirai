import { puntajeSecuencias } from "@/lib/logic/secuencias";

// Puntaje = precisión y nivel alcanzado; los tiempos se registran pero nunca afectan el puntaje
// (sección 3, "reglas de medición no negociables").
export function puntajeMatrices(correctas: number): number {
  return Math.round((correctas / 12) * 100);
}

export function puntajeRotacion(correctas: number): number {
  return Math.round((correctas / 10) * 100);
}

export interface PuntajesCognitivo {
  patrones: number;
  espacial: number;
  memoria: number;
  comunicacion: number; // desde bloque verbal, normalizado a 0-100
}

export function calcularPuntajesCognitivo(
  correctasMatrices: number,
  correctasRotacion: number,
  largoMaximoSecuencias: number,
  puntajeComunicacion: number = 0,
): PuntajesCognitivo {
  return {
    patrones: puntajeMatrices(correctasMatrices),
    espacial: puntajeRotacion(correctasRotacion),
    memoria: puntajeSecuencias(largoMaximoSecuencias),
    comunicacion: puntajeComunicacion,
  };
}
