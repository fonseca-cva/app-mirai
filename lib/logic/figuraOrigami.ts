// Descriptor de una figura origami paramétrica, compartido por Matrices y Rotación.
// Se renderiza como SVG (ver components/experiencia/juegos/FiguraOrigamiSVG.tsx); nunca es una imagen.
// El color es SIEMPRE decorativo y uniforme: ningún atributo aquí puede portar la regla vía tono/matiz.
export interface FiguraOrigami {
  lados: number; // 3-8, polígono regular (regla de "tipo de figura")
  rotacionDeg: number; // 0-315 en pasos de 45 (regla de "rotación")
  relleno: number; // binario: 0 = sólido, 1 = contorno (regla de "relleno", nunca gradación de tono)
  pliegues: number; // 1-3, capas anidadas concéntricas (regla de "adición de pliegues")
}

export function clamp(valor: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, valor));
}

export function figurasIguales(a: FiguraOrigami, b: FiguraOrigami): boolean {
  return (
    a.lados === b.lados &&
    a.rotacionDeg === b.rotacionDeg &&
    a.relleno === b.relleno &&
    a.pliegues === b.pliegues
  );
}

// Dos figuras colisionan visualmente si comparten forma, relleno y capas, y su rotación es
// congruente módulo la simetría rotacional del polígono (p.ej. un cuadrado rotado 90° es
// geométricamente el mismo cuadrado que sin rotar). Más estricta que figurasIguales: úsala
// para rechazar distractores degenerados, no solo duplicados exactos.
export function figurasColisionanVisualmente(a: FiguraOrigami, b: FiguraOrigami): boolean {
  if (a.lados !== b.lados || a.relleno !== b.relleno || a.pliegues !== b.pliegues) return false;
  const simetria = 360 / a.lados;
  const diff = ((a.rotacionDeg - b.rotacionDeg) % simetria + simetria) % simetria;
  return diff < 1e-6 || simetria - diff < 1e-6;
}
