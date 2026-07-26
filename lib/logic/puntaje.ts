import { contextos, dimensiones, type DimensionCodigo } from "@/lib/data/contextos";

export interface Respuesta {
  contextoId: string;
  valor: 0 | 1 | 2;
  // ITERACIÓN 2: señal de calidad del estímulo (¿se abrió "¿Qué se hace acá?"?), no afecta puntaje.
  ayudaAbierta?: boolean;
}

export interface PuntajeDimension {
  dimension: DimensionCodigo;
  etiqueta: string;
  puntajeBruto: number;
  puntajeMaximo: number;
  puntaje: number;
}

// Puntaje por dimensión = suma respuestas / máximo posible (0-100).
// Empates: orden estable por puntaje bruto, luego alfabético (por etiqueta).
export function calcularPuntajes(respuestas: Respuesta[]): PuntajeDimension[] {
  const valorPorContexto = new Map(respuestas.map((r) => [r.contextoId, r.valor]));

  const acumulado = new Map<DimensionCodigo, { bruto: number; maximo: number }>();

  for (const contexto of contextos) {
    const actual = acumulado.get(contexto.dimension) ?? { bruto: 0, maximo: 0 };
    actual.maximo += 2;
    actual.bruto += valorPorContexto.get(contexto.id) ?? 0;
    acumulado.set(contexto.dimension, actual);
  }

  const resultado: PuntajeDimension[] = Array.from(acumulado.entries()).map(
    ([dimension, { bruto, maximo }]) => ({
      dimension,
      etiqueta: dimensiones[dimension],
      puntajeBruto: bruto,
      puntajeMaximo: maximo,
      puntaje: maximo === 0 ? 0 : Math.round((bruto / maximo) * 100),
    })
  );

  resultado.sort((a, b) => {
    if (b.puntaje !== a.puntaje) return b.puntaje - a.puntaje;
    if (b.puntajeBruto !== a.puntajeBruto) return b.puntajeBruto - a.puntajeBruto;
    return a.etiqueta.localeCompare(b.etiqueta, "es");
  });

  return resultado;
}
