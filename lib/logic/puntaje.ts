import { contextos, dimensiones, type DimensionCodigo } from "@/lib/data/contextos";
import { actividades } from "@/lib/data/actividades";
import { asignaturas } from "@/lib/data/asignaturas";
import { pesosAspiracion, type OpcionAspiracion } from "@/lib/data/aspiracion";

export interface Respuesta {
  contextoId: string;
  valor: 0 | 1 | 2;
  // ITERACIÓN 2: señal de calidad del estímulo (¿se abrió "¿Qué se hace acá?"?), no afecta puntaje.
  ayudaAbierta?: boolean;
  // Mejora Bloque A: audio ambiente activo (opt-in global && no muteado) al momento
  // de responder — para comparar comportamiento con/sin audio en el análisis del piloto.
  audioActivado?: boolean;
}

export interface PuntajeDimension {
  dimension: DimensionCodigo;
  etiqueta: string;
  puntajeBruto: number;
  puntajeMaximo: number;
  puntaje: number;
}

// ── Puntaje integrado de intereses (Bloque Integración) ─────────────────────
// Tres fuentes del pilar combinadas con pesos fijos (PENDIENTE REVALIDACIÓN
// METODOLÓGICA, misma firma que el resto de los pesos del instrumento):
//   45% contextos (A1) + 40% actividades/asignaturas (A2+A3, 20% c/u) + 15% aspiración (A4).
// Los tipos de respuesta viven acá (el store los re-exporta) para que la función
// integrada no dependa de la capa de estado.

export interface RespuestaActividad {
  actividadId: string;
  valor: 0 | 1 | 2;
}

export interface RespuestaAsignatura {
  asignaturaId: string;
  valor: 0 | 1 | 2;
}

export interface Aspiracion {
  opcion: OpcionAspiracion;
  detalle: string | null;
}

const PESO_GUSTOS = 0.45;
const PESO_ACTIVIDADES = 0.2; // mitad del 40% de actividades+asignaturas
const PESO_ASIGNATURAS = 0.2;
const PESO_ASPIRACION = 0.15;

// Puntaje 0-100 por dimensión para ítems de una sola dimensión (contextos y actividades).
function puntajePorItems(
  items: readonly { id: string; dimension: DimensionCodigo }[],
  valores: Map<string, 0 | 1 | 2>
): Map<DimensionCodigo, number> {
  const bruto = new Map<DimensionCodigo, number>();
  const maximo = new Map<DimensionCodigo, number>();
  for (const item of items) {
    bruto.set(item.dimension, (bruto.get(item.dimension) ?? 0) + (valores.get(item.id) ?? 0));
    maximo.set(item.dimension, (maximo.get(item.dimension) ?? 0) + 2);
  }
  const resultado = new Map<DimensionCodigo, number>();
  for (const [dim, max] of maximo) {
    resultado.set(dim, max === 0 ? 0 : Math.round(((bruto.get(dim) ?? 0) / max) * 100));
  }
  return resultado;
}

// Puntaje 0-100 por dimensión para asignaturas (cada ítem reparte pesos que suman 1.0).
function puntajeAsignaturasPorDimension(respuestas: RespuestaAsignatura[]): Map<DimensionCodigo, number> {
  const valores = new Map(respuestas.map((r) => [r.asignaturaId, r.valor]));
  const bruto = new Map<DimensionCodigo, number>();
  const maximo = new Map<DimensionCodigo, number>();
  for (const asg of asignaturas) {
    for (const [dim, peso] of Object.entries(asg.pesos)) {
      const d = dim as DimensionCodigo;
      bruto.set(d, (bruto.get(d) ?? 0) + (valores.get(asg.id) ?? 0) * peso);
      maximo.set(d, (maximo.get(d) ?? 0) + 2 * peso);
    }
  }
  const resultado = new Map<DimensionCodigo, number>();
  for (const [dim, max] of maximo) {
    resultado.set(dim, max === 0 ? 0 : Math.round(((bruto.get(dim) ?? 0) / max) * 100));
  }
  return resultado;
}

// Aporte 0-100 por dimensión de la aspiración (pesos de la opción × 100).
// "no_se" (o sin respuesta) no declara dirección: 0 en todas las dimensiones.
function puntajeAspiracionPorDimension(opcion: OpcionAspiracion | null): Map<DimensionCodigo, number> {
  const pesos = opcion ? pesosAspiracion[opcion] : {};
  const resultado = new Map<DimensionCodigo, number>();
  for (const [dim, peso] of Object.entries(pesos)) {
    resultado.set(dim as DimensionCodigo, (peso ?? 0) * 100);
  }
  return resultado;
}

// Puntaje integrado de intereses: combina las tres fuentes del pilar con pesos
// fijos 45/40/15. Misma escala 0-100 y mismos desempates que calcularPuntajes.
// puntajeBruto conserva la granularidad pre-redondeo (×100) solo para desempates.
// Puntajes 0-100 por dimensión de las cuatro fuentes, antes de combinarlas.
// Se expone para poder comparar fuentes entre sí (ver detectarDiscrepancia).
function calcularFuentes(
  respuestasGustos: Respuesta[],
  respuestasActividades: RespuestaActividad[],
  respuestasAsignaturas: RespuestaAsignatura[],
  aspiracion: Aspiracion | null
) {
  return {
    gustos: puntajePorItems(contextos, new Map(respuestasGustos.map((r) => [r.contextoId, r.valor]))),
    actividadesScore: puntajePorItems(
      actividades,
      new Map(respuestasActividades.map((r) => [r.actividadId, r.valor]))
    ),
    asignaturasScore: puntajeAsignaturasPorDimension(respuestasAsignaturas),
    aspiracionScore: puntajeAspiracionPorDimension(aspiracion?.opcion ?? null),
  };
}

export function calcularPuntajesIntegrados(
  respuestasGustos: Respuesta[],
  respuestasActividades: RespuestaActividad[],
  respuestasAsignaturas: RespuestaAsignatura[],
  aspiracion: Aspiracion | null
): PuntajeDimension[] {
  const { gustos, actividadesScore, asignaturasScore, aspiracionScore } = calcularFuentes(
    respuestasGustos,
    respuestasActividades,
    respuestasAsignaturas,
    aspiracion
  );

  const resultado: PuntajeDimension[] = Object.keys(dimensiones).map((dim) => {
    const d = dim as DimensionCodigo;
    const raw =
      PESO_GUSTOS * (gustos.get(d) ?? 0) +
      PESO_ACTIVIDADES * (actividadesScore.get(d) ?? 0) +
      PESO_ASIGNATURAS * (asignaturasScore.get(d) ?? 0) +
      PESO_ASPIRACION * (aspiracionScore.get(d) ?? 0);
    return {
      dimension: d,
      etiqueta: dimensiones[d],
      puntajeBruto: Math.round(raw * 100),
      puntajeMaximo: 100,
      puntaje: Math.round(raw),
    };
  });

  resultado.sort((a, b) => {
    if (b.puntaje !== a.puntaje) return b.puntaje - a.puntaje;
    if (b.puntajeBruto !== a.puntajeBruto) return b.puntajeBruto - a.puntajeBruto;
    return a.etiqueta.localeCompare(b.etiqueta, "es");
  });

  return resultado;
}

// Dimensión con mayor puntaje de una fuente (desempate alfabético por código).
function dimensionTope(puntajes: Map<DimensionCodigo, number>): DimensionCodigo | null {
  let mejor: DimensionCodigo | null = null;
  let mejorValor = -1;
  for (const [dim, valor] of puntajes) {
    if (valor > mejorValor || (valor === mejorValor && mejor !== null && dim < mejor)) {
      mejor = dim;
      mejorValor = valor;
    }
  }
  return mejorValor >= 50 ? mejor : null;
}

export interface Discrepancia {
  dimensionGustos: DimensionCodigo;
  etiquetaGustos: string;
  dimensionActividades: DimensionCodigo;
  etiquetaActividades: string;
}

// Detecta cuando la dimensión mejor puntuada por contextos (gustos) difiere de
// la mejor puntuada por actividades. Solo se reporta si ambas fuentes tienen
// una señal fuerte (>=50); si no, el silencio (null) evita ruido con datos débiles.
export function detectarDiscrepancia(
  respuestasGustos: Respuesta[],
  respuestasActividades: RespuestaActividad[],
  respuestasAsignaturas: RespuestaAsignatura[],
  aspiracion: Aspiracion | null
): Discrepancia | null {
  const { gustos, actividadesScore } = calcularFuentes(
    respuestasGustos,
    respuestasActividades,
    respuestasAsignaturas,
    aspiracion
  );
  const topGustos = dimensionTope(gustos);
  const topActividades = dimensionTope(actividadesScore);
  if (!topGustos || !topActividades || topGustos === topActividades) return null;

  return {
    dimensionGustos: topGustos,
    etiquetaGustos: dimensiones[topGustos],
    dimensionActividades: topActividades,
    etiquetaActividades: dimensiones[topActividades],
  };
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
