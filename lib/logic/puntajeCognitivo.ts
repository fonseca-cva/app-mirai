import { puntajeSecuencias } from "@/lib/logic/secuencias";

// Puntaje = precisión y nivel alcanzado; los tiempos se registran pero nunca afectan el puntaje
// (sección 3, "reglas de medición no negociables").
export function puntajeMatrices(correctas: number): number {
  return Math.round((correctas / 12) * 100);
}

export function puntajePliegues(correctas: number): number {
  return Math.round((correctas / 10) * 100);
}

export function puntajeSeries(correctas: number): number {
  return Math.round((correctas / 8) * 100);
}

export interface PuntajesCognitivo {
  patrones: number;
  numerico: number;
  espacial: number;
  memoria: number;
  comunicacion: number | null; // desde bloque verbal, normalizado a 0-100; null = sin evaluar (NUNCA 0 inventado)
}

export function calcularPuntajesCognitivo(
  correctasMatrices: number,
  correctasPliegues: number,
  largoMaximoSecuencias: number,
  puntajeComunicacion: number | null = null,
  correctasSeries: number = 0,
): PuntajesCognitivo {
  return {
    patrones: puntajeMatrices(correctasMatrices),
    numerico: puntajeSeries(correctasSeries),
    espacial: puntajePliegues(correctasPliegues),
    memoria: puntajeSecuencias(largoMaximoSecuencias),
    comunicacion: puntajeComunicacion,
  };
}
