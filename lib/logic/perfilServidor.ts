// RECOMPUTACIÓN DE PERFIL PARA EL REINTENTO ASÍNCRONO — entrega 2, punto 10.
//
// Cuando la evaluación verbal falla en el momento, /api/evaluar reintenta la
// cadena una vez en segundo plano (after()). Si el reintento resuelve, hay que
// completar el informe guardado: su perfil_json es un snapshot (migración
// 00013) que quedó con comunicacion: null. Esta función recalcula SOLO lo que
// cambia con la comunicación verbal:
//   * capacidades.comunicacion (1-5 → 0-100)
//   * carrerasRecomendadas (el matching incluye comunicación, lib/logic/matching)
// dimensionTop3, aspiracion y discrepancia NO dependen de la comunicación:
// quedan como estaban guardados. La triangulación ocurre solo en nuestro
// servidor: el proveedor puntúa un texto sin dueño y aquí se une a la sesión.

import { calcularPuntajesIntegrados } from "@/lib/logic/puntaje";
import type {
  Respuesta,
  RespuestaActividad,
  RespuestaAsignatura,
  Aspiracion,
} from "@/lib/logic/puntaje";
import { calcularPuntajesCognitivo } from "@/lib/logic/puntajeCognitivo";
import { recomendarCarreras } from "@/lib/logic/matching";
import type { PerfilResultado } from "@/lib/supabase/types";

export interface FilasCognitivo {
  juego: string;
  correcto: boolean;
  nivel: number;
}

export interface FilasParaPerfil {
  gustos: Respuesta[];
  actividades: RespuestaActividad[];
  asignaturas: RespuestaAsignatura[];
  aspiracion: Aspiracion | null;
  cognitivo: FilasCognitivo[];
}

/**
 * Recalcula el perfil con la comunicación ya evaluada. Mismo pipeline que el
 * cliente (components/experiencia/Informe.tsx), reutilizando las mismas
 * funciones puras de lib/logic — cero lógica duplicada.
 */
export function recalcularPerfilConComunicacion(
  perfilAnterior: PerfilResultado,
  filas: FilasParaPerfil,
  puntajeComunicacion: number | null
): PerfilResultado {
  const puntajesDimension = calcularPuntajesIntegrados(
    filas.gustos,
    filas.actividades,
    filas.asignaturas,
    filas.aspiracion
  );

  const correctasMatrices = filas.cognitivo.filter(
    (r) => r.juego === "matrices" && r.correcto
  ).length;
  const correctasPliegues = filas.cognitivo.filter(
    (r) => r.juego === "pliegues" && r.correcto
  ).length;
  const correctasSeries = filas.cognitivo.filter(
    (r) => r.juego === "series" && r.correcto
  ).length;
  const largoMaximo = Math.max(
    ...filas.cognitivo.filter((r) => r.juego === "secuencias").map((r) => r.nivel),
    0
  );

  const puntajesCognitivo = calcularPuntajesCognitivo(
    correctasMatrices,
    correctasPliegues,
    largoMaximo,
    puntajeComunicacion,
    correctasSeries
  );

  const carrerasRecomendadas = recomendarCarreras(
    puntajesDimension,
    puntajesCognitivo
  ).map((c) => c.carrera.id);

  return {
    ...perfilAnterior,
    // dimensionTop3 no depende de comunicación: se conserva tal como se guardó.
    capacidades: {
      ...perfilAnterior.capacidades,
      comunicacion: puntajeComunicacion,
    },
    carrerasRecomendadas,
  };
}
