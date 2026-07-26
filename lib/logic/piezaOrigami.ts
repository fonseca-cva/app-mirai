// Pieza base asimétrica (silueta tipo "bandera" de papel doblado): a diferencia de un polígono
// regular, no tiene simetría de reflexión, así que espejarla es geométricamente distinguible
// de cualquier rotación pura — condición necesaria para que el ítem de rotación mental tenga
// una única respuesta correcta verificable.
export const PIEZA_BASE: Array<[number, number]> = [
  [-24, -30],
  [8, -30],
  [8, -6],
  [24, -6],
  [24, 22],
  [-24, 22],
];

export function transformarPieza(anguloDeg: number, espejada: boolean): Array<[number, number]> {
  const rad = (anguloDeg * Math.PI) / 180;
  return PIEZA_BASE.map(([x, y]) => {
    const mx = espejada ? -x : x;
    const rx = mx * Math.cos(rad) - y * Math.sin(rad);
    const ry = mx * Math.sin(rad) + y * Math.cos(rad);
    return [rx, ry] as [number, number];
  });
}

function areaConSigno(puntos: Array<[number, number]>): number {
  let suma = 0;
  for (let i = 0; i < puntos.length; i++) {
    const [x1, y1] = puntos[i];
    const [x2, y2] = puntos[(i + 1) % puntos.length];
    suma += x1 * y2 - x2 * y1;
  }
  return suma / 2;
}

// Invariante geométrico: espejar invierte la orientación (signo del área con signo);
// rotar puro nunca la invierte. Así se puede verificar por cálculo si una figura
// transformada es "la misma pieza rotada" o una versión espejada.
export function esEspejada(puntos: Array<[number, number]>): boolean {
  const signoBase = Math.sign(areaConSigno(PIEZA_BASE));
  return Math.sign(areaConSigno(puntos)) !== signoBase;
}

export function puntosSvg(puntos: Array<[number, number]>, centro: number): string {
  return puntos.map(([x, y]) => `${(x + centro).toFixed(2)},${(y + centro).toFixed(2)}`).join(" ");
}
