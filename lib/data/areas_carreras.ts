// Áreas de carreras agrupadas por dimensión dominante — sección 5.4 de la spec.
// Matching v1: reglas ponderadas por función pura, sin datos duros de mercado todavía.
// // PENDIENTE FIRMA METODOLÓGICA: la asignación dimensión→área es provisoria,
// basada en marco de Holland (RIASEC) adaptado a 8 dimensiones Mirai.

import type { DimensionCodigo } from "@/lib/data/contextos";

export interface AreaCarrera {
  id: string;
  nombre: string;
  descripcion: string;
  dimensiones: DimensionCodigo[]; // dimensiones que alimentan esta área
}

// 10 áreas de carreras cubriendo el espacio de 8 dimensiones.
// Cada área se asocia a 1 o 2 dimensiones principales.
// // PENDIENTE FIRMA METODOLÓGICA
export const areasCarreras: AreaCarrera[] = [
  {
    id: "construccion-obra",
    nombre: "Construcción y Obra",
    descripcion: "Diseño, planificación y ejecución de proyectos de construcción, desde obra gruesa a terminaciones.",
    dimensiones: ["tec"],
  },
  {
    id: "ciencia-laboratorio",
    nombre: "Ciencia y Laboratorio",
    descripcion: "Investigación, análisis y control de calidad en ciencias naturales, químicas y biológicas.",
    dimensiones: ["cie"],
  },
  {
    id: "arte-diseno",
    nombre: "Arte, Diseño y Comunicación",
    descripcion: "Creación visual, diseño gráfico, audiovisual, branding y comunicaciones.",
    dimensiones: ["cre"],
  },
  {
    id: "educacion-social",
    nombre: "Educación y Trabajo Social",
    descripcion: "Formación, acompañamiento e intervención social en comunidades e instituciones educativas.",
    dimensiones: ["soc"],
  },
  {
    id: "salud-bienestar",
    nombre: "Salud y Bienestar",
    descripcion: "Atención clínica, rehabilitación, cuidado de personas y promoción de salud.",
    dimensiones: ["sal"],
  },
  {
    id: "gestion-empresa",
    nombre: "Gestión y Empresa",
    descripcion: "Administración, emprendimiento, finanzas y liderazgo de equipos en organizaciones.",
    dimensiones: ["ges"],
  },
  {
    id: "datos-tecnologia",
    nombre: "Datos y Tecnología",
    descripcion: "Análisis de datos, programación, TI, logística y organización de información.",
    dimensiones: ["dat"],
  },
  {
    id: "naturaleza-medioambiente",
    nombre: "Naturaleza y Medio Ambiente",
    descripcion: "Trabajo en terreno, agricultura, forestal, conservación y sustentabilidad.",
    dimensiones: ["nat"],
  },
  {
    id: "ingenieria-tecnica",
    nombre: "Ingeniería y Tecnología Aplicada",
    descripcion: "Aplicación técnica de principios de ingeniería en industrias, mecánica, electricidad y procesos.",
    dimensiones: ["tec", "cie"],
  },
  {
    id: "servicio-atencion",
    nombre: "Servicio y Atención a Personas",
    descripcion: "Atención al cliente, turismo, hospitalidad y servicios directos a la comunidad.",
    dimensiones: ["soc", "ges"],
  },
];
