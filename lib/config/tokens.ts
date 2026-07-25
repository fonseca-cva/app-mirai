// Tokens de diseño — secciones 4 (spec base) y A/B (Fase 1: diorama).
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
  teal: "#74C2CE",
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

// ─── SISTEMA DE LUZ Y SOMBRA (Fase 1, sección A) ────────────────────────

/** Fuente de luz única: superior-izquierda, 45°. Todas las sombras del sitio la respetan. */
export const LUZ = { x: -1, y: -1 } as const;

export type DistanciaCapa = "cercana" | "media" | "lejana";

/**
 * Escala de sombras por distancia (A.2).
 * offset y blur crecen con la distancia; opacidad decrece (sombra más difusa).
 */
export const sombrasPorDistancia: Record<
  DistanciaCapa,
  { blur: number; offset: number; opacity: number }
> = {
  cercana: { blur: 6, offset: 4, opacity: 0.18 },
  media: { blur: 14, offset: 10, opacity: 0.12 },
  lejana: { blur: 28, offset: 18, opacity: 0.07 },
};

/**
 * Perspectiva atmosférica (B.6).
 * Las capas lejanas se desaturan y se aclaran hacia papel.
 */
export const atmosfera: Record<
  DistanciaCapa,
  { saturacion: number; mezclaPapel: number }
> = {
  cercana: { saturacion: 1.0, mezclaPapel: 0 },
  media: { saturacion: 0.8, mezclaPapel: 0.1 },
  lejana: { saturacion: 0.55, mezclaPapel: 0.25 },
};

/**
 * Genera CSS drop-shadow() para una distancia de capa, respetando LUZ.
 * La sombra se proyecta en dirección opuesta a la fuente de luz (superior-izquierda → inferior-derecha).
 */
export function dropShadowCSS(distancia: DistanciaCapa): string {
  const s = sombrasPorDistancia[distancia];
  const dx = -LUZ.x * s.offset; // LUZ.x = -1 → dx = 4
  const dy = -LUZ.y * s.offset; // LUZ.y = -1 → dy = 4
  return `drop-shadow(${dx}px ${dy}px ${s.blur}px rgba(0,0,0,${s.opacity}))`;
}

/**
 * Ajusta luminosidad de un color hex en delta porcentual (A.3).
 * +8% = cara iluminada, 0% = base, −12% = sombra.
 * Retorna el nuevo hex.
 */
export function ajustarLuminosidad(hex: string, delta: number): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h =
      max === r
        ? ((g - b) / d + (g < b ? 6 : 0)) / 6
        : max === g
          ? ((b - r) / d + 2) / 6
          : ((r - g) / d + 4) / 6;
  }

  const l2 = Math.max(0, Math.min(1, l + delta / 100));

  const toRgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q2 = l2 < 0.5 ? l2 * (1 + s) : l2 + s - l2 * s;
  const p2 = 2 * l2 - q2;

  const rr = Math.round(toRgb(p2, q2, h + 1 / 3) * 255);
  const gg = Math.round(toRgb(p2, q2, h) * 255);
  const bb = Math.round(toRgb(p2, q2, h - 1 / 3) * 255);

  return `#${rr.toString(16).padStart(2, "0")}${gg.toString(16).padStart(2, "0")}${bb.toString(16).padStart(2, "0")}`;
}
