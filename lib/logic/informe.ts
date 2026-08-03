// Helpers puros para la página /mi-cuenta (Tanda C): título legible de un
// informe guardado y fecha en formato es-CL. Sin IO: testeable en vitest.

import { carreraPorId } from "@/lib/data/carreras";
import type { PerfilResultado } from "@/lib/supabase/types";

/** Título corto de un informe guardado: la primera carrera curada, o fallback. */
export function tituloInforme(perfil: PerfilResultado): string {
  const primera = perfil.carrerasRecomendadas[0];
  const carrera = primera ? carreraPorId(primera) : undefined;
  return carrera ? carrera.nombre : "Informe vocacional";
}

/** Fecha legible en español de Chile. Devuelve "—" si la fecha es inválida. */
export function formatearFecha(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "—";
  return fecha.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
