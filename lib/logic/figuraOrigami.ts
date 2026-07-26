// Descriptor de una figura origami paramétrica, compartido por Matrices y Rotación.
// Se renderiza como SVG (ver components/experiencia/juegos/FiguraOrigamiSVG.tsx); nunca es una imagen.
export interface FiguraOrigami {
  lados: number; // 3-8, polígono regular (regla de "conteo")
  rotacionDeg: number; // 0-315 en pasos de 45 (regla de "rotación")
  tono: number; // 0-1, intensidad de color sobre el teal de marca (regla de "cambio de tono")
  pliegues: number; // 1-3, capas anidadas concéntricas (regla de "adición de pliegues")
}

export function clamp(valor: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, valor));
}

export function figurasIguales(a: FiguraOrigami, b: FiguraOrigami): boolean {
  return (
    a.lados === b.lados &&
    a.rotacionDeg === b.rotacionDeg &&
    a.tono === b.tono &&
    a.pliegues === b.pliegues
  );
}
