// Tokens de diseño — sección 4 de la spec.
// DECISIÓN: el proyecto usa Tailwind v4 (CSS-first, sin tailwind.config.js).
// Este archivo sigue siendo la fuente de verdad de los tokens; se refleja
// en app/globals.css (@theme) para generar utilidades Tailwind (bg-papel, text-coral, etc.)
// y se importa directamente donde se necesite el valor crudo (ej. fills de SVG).

export const colores = {
  papel: "#F7F2E9",
  papelSombra: "#E8E0D0",
  tinta: "#2B2B33",
  coral: "#E86A4F",
  salvia: "#7FA08C",
  dorado: "#D9A441",
  blancoPapel: "#FFFDF8",
} as const;

export const tipografia = {
  display: "var(--font-fraunces)",
  cuerpo: "var(--font-inter)",
} as const;

export const radios = {
  estandar: "14px",
} as const;

export const espaciado = {
  seccion: "6rem",
  seccionMobile: "4rem",
} as const;

export const breakpoints = {
  mobile: "375px",
  desktop: "1440px",
} as const;

export type ColorToken = keyof typeof colores;
