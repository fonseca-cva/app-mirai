// BLOQUE A2 — ACTIVIDADES Y PASATIEMPOS (Nuevo, Tanda F — Pilar de Intereses)
// 24 ítems (3 por cada una de las 8 dimensiones), formato rápido de 3 puntos
// ("me gusta / no me gusta / indiferente"), una tarjeta por pantalla.
// Son ACTIVIDADES CONCRETAS que se hacen por gusto — no consumo cultural ni
// preguntas sobre productos (eso va al bloque exploratorio).
//
// ⚠️ PENDIENTE REVALIDACIÓN METODOLÓGICA — revisión de Camilo de los pesos del
// puntaje integrado (45/40/15). Los textos pueden cambiar; el archivo ya lo
// consumen BloqueActividades y el puntaje integrado (lib/logic/puntaje.ts).
//
// Redacción en español de Chile, pensada para adolescentes (7mo básico en adelante),
// género neutro ("desarmar algo", "cuidar a alguien") y sin tecnicismos.

import type { DimensionCodigo } from "@/lib/data/contextos";

export interface Actividad {
  id: string;
  dimension: DimensionCodigo;
  /** Actividad concreta, en infinitivo, que se hace por gusto. */
  texto: string;
}

export const actividades: Actividad[] = [
  // tec — Técnico-Manual
  {
    id: "act-tec-01",
    dimension: "tec",
    texto: "desarmar algo para ver cómo funciona por dentro",
  },
  {
    id: "act-tec-02",
    dimension: "tec",
    texto: "arreglar algo que se echó a perder",
  },
  {
    id: "act-tec-03",
    dimension: "tec",
    texto: "construir o armar cosas con las manos (maquetas, muebles, objetos)",
  },

  // cie — Científico-Analítico
  {
    id: "act-cie-01",
    dimension: "cie",
    texto: "buscar explicaciones a cosas que te dan curiosidad",
  },
  {
    id: "act-cie-02",
    dimension: "cie",
    texto: "resolver puzzles o problemas difíciles",
  },
  {
    id: "act-cie-03",
    dimension: "cie",
    texto: "hacer experimentos caseros para probar si una idea funciona",
  },

  // cre — Creativo
  {
    id: "act-cre-01",
    dimension: "cre",
    texto: "dibujar, escribir o hacer música por tu cuenta",
  },
  {
    id: "act-cre-02",
    dimension: "cre",
    texto: "editar videos o fotos",
  },
  {
    id: "act-cre-03",
    dimension: "cre",
    texto: "inventar historias, personajes o mundos imaginarios",
  },

  // soc — Social-Humano
  {
    id: "act-soc-01",
    dimension: "soc",
    texto: "explicarle algo a alguien hasta que lo entienda",
  },
  {
    id: "act-soc-02",
    dimension: "soc",
    texto: "escuchar los problemas de un amigo",
  },
  {
    id: "act-soc-03",
    dimension: "soc",
    texto: "ayudar a otras personas o participar en algo solidario",
  },

  // sal — Salud y Cuidado
  {
    id: "act-sal-01",
    dimension: "sal",
    texto: "cuidar a alguien que está enfermo",
  },
  {
    id: "act-sal-02",
    dimension: "sal",
    texto: "aprender cómo funciona el cuerpo",
  },
  {
    id: "act-sal-03",
    dimension: "sal",
    texto: "preparar comidas sanas o probar recetas saludables",
  },

  // ges — Gestión y Emprendimiento
  {
    id: "act-ges-01",
    dimension: "ges",
    texto: "organizar un evento o una salida con un grupo",
  },
  {
    id: "act-ges-02",
    dimension: "ges",
    texto: "vender o revender algo",
  },
  {
    id: "act-ges-03",
    dimension: "ges",
    texto: "ponerse al frente de un grupo para lograr algo (proyecto, campaña, equipo)",
  },

  // dat — Datos y Organización
  {
    id: "act-dat-01",
    dimension: "dat",
    texto: "ordenar y clasificar tus cosas con un sistema",
  },
  {
    id: "act-dat-02",
    dimension: "dat",
    texto: "llevar la cuenta de tus gastos",
  },
  {
    id: "act-dat-03",
    dimension: "dat",
    texto: "llevar registros o estadísticas de algo que te interesa (deportes, juegos, colecciones)",
  },

  // nat — Naturaleza y Terreno
  {
    id: "act-nat-01",
    dimension: "nat",
    texto: "estar al aire libre aunque cueste llegar",
  },
  {
    id: "act-nat-02",
    dimension: "nat",
    texto: "cuidar plantas o animales",
  },
  {
    id: "act-nat-03",
    dimension: "nat",
    texto: "sembrar, cultivar o trabajar la tierra",
  },
];

/** Índice por dimensión: cuántos ítems de actividades tiene cada dimensión. */
export const actividadesPorDimension = (): Record<DimensionCodigo, number> => {
  const conteo = {} as Record<DimensionCodigo, number>;
  for (const a of actividades) {
    conteo[a.dimension] = (conteo[a.dimension] ?? 0) + 1;
  }
  return conteo;
};
