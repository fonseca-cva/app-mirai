// BLOQUE A3 — ASIGNATURAS ESCOLARES (Nuevo, Tanda F — Pilar de Intereses)
// 10 ítems: asignaturas del currículum chileno de enseñanza media.
// Escala de 3 puntos: "me gusta / me da lo mismo / no me gusta". Duración objetivo 45s.
//
// ⚠️ PENDIENTE REVALIDACIÓN METODOLÓGICA — revisión de Camilo de los pesos del
// puntaje integrado (45/40/15). Los pesos y nombres pueden cambiar; el archivo
// ya lo consumen BloqueAsignaturas y el puntaje integrado (lib/logic/puntaje.ts).
//
// Cada asignatura mapea a 1-2 dimensiones con pesos que suman 1.0.
// Nota abierta: Camilo listó "Tecnología/Inglés" como un solo ítem; aquí se usa
// "Tecnología". Si se prefiere Inglés en ese cupo, el mapeo sugerido es
// soc 0.7 / cre 0.3 (ver mensaje de revisión al jefe).

import type { DimensionCodigo } from "@/lib/data/contextos";

export interface Asignatura {
  id: string;
  nombre: string;
  /** Pesos por dimensión; los presentes suman 1.0. */
  pesos: Partial<Record<DimensionCodigo, number>>;
}

export const asignaturas: Asignatura[] = [
  {
    id: "asg-01",
    nombre: "Lenguaje y Comunicación",
    pesos: { cre: 0.5, soc: 0.5 },
  },
  {
    id: "asg-02",
    nombre: "Matemática",
    pesos: { cie: 0.6, dat: 0.4 },
  },
  {
    id: "asg-03",
    nombre: "Historia",
    pesos: { soc: 0.6, cie: 0.4 },
  },
  {
    id: "asg-04",
    nombre: "Biología",
    pesos: { cie: 0.6, sal: 0.4 },
  },
  {
    id: "asg-05",
    nombre: "Física",
    pesos: { cie: 0.6, tec: 0.4 },
  },
  {
    id: "asg-06",
    nombre: "Química",
    pesos: { cie: 0.7, tec: 0.3 },
  },
  {
    id: "asg-07",
    nombre: "Artes Visuales",
    pesos: { cre: 0.8, tec: 0.2 },
  },
  {
    id: "asg-08",
    nombre: "Música",
    pesos: { cre: 0.8, soc: 0.2 },
  },
  {
    id: "asg-09",
    nombre: "Educación Física",
    pesos: { sal: 0.6, nat: 0.4 },
  },
  {
    id: "asg-10",
    nombre: "Tecnología",
    pesos: { tec: 0.6, dat: 0.4 },
  },
];
