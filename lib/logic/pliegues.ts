export type DificultadPliegues = "facil" | "media" | "dificil";
export type Eje = "vertical" | "horizontal" | "diagonal";
export interface Punto {
  x: number;
  y: number;
}

function ordenPorSemilla<T>(items: T[], semilla: string): T[] {
  const offset = semilla.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

// -- Plegado. Soporta 1 o más pliegues secuenciales y 1 o más perforaciones. --
// Al desplegar, CADA punto original se refleja a través de CADA pliegue en secuencia.
// El resultado final son 2ⁿ puntos (n = número de pliegues) por cada punto original:
//   p → reflejar(p, eje₁) → reflejar(reflejar(p, eje₁), eje₂) → ...
// El conjunto completo son todas las combinaciones de reflejo/no-reflejo.

export interface AlternativaPlegado {
  puntos: Punto[]; // 2ⁿ × m puntos (n pliegues, m perforaciones)
}

export interface ItemPlegado {
  id: string;
  tipo: "plegado";
  dificultad: DificultadPliegues;
  pliegues: Eje[];      // secuencia de dobleces (1-2)
  puntos: Punto[];      // puntos de perforación (1-2)
  alternativas: AlternativaPlegado[];
  indiceCorrecto: number;
}

function reflejar(punto: Punto, eje: Eje): Punto {
  switch (eje) {
    case "vertical":
      return { x: 1 - punto.x, y: punto.y };
    case "horizontal":
      return { x: punto.x, y: 1 - punto.y };
    case "diagonal":
      return { x: punto.y, y: punto.x }; // reflejo sobre la recta y=x
  }
}

function reflejarCompuesto(punto: Punto, pliegues: Eje[]): Punto {
  return pliegues.reduce((p, eje) => reflejar(p, eje), punto);
}

// Genera TODAS las combinaciones de reflejo para un punto a través de una secuencia de pliegues.
// p.ej. para 2 pliegues: [p, reflejar(p,eje₁), reflejar(p,eje₂), reflejar(reflejar(p,eje₁),eje₂)]
export function combinacionesReflejo(punto: Punto, pliegues: Eje[]): Punto[] {
  if (pliegues.length === 0) return [punto];
  const resultado: Punto[] = [punto];
  for (const eje of pliegues) {
    const actuales = [...resultado]; // copia: lo que teníamos hasta ahora
    for (const p of actuales) {
      resultado.push(reflejar(p, eje));
    }
  }
  // resultado ahora tiene 2ⁿ puntos: todas las combinaciones de reflejar/no-reflejar
  return resultado;
}

function puntosIguales(a: Punto[], b: Punto[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((p, i) => p.x === b[i].x && p.y === b[i].y);
}

function ordenarPuntos(puntos: Punto[]): Punto[] {
  return [...puntos].sort((a, b) => a.x - b.x || a.y - b.y);
}

function normalizarAlternativa(puntos: Punto[]): Punto[] {
  return ordenarPuntos(puntos);
}

function distractorEjeIncorrecto(
  puntos: Punto[],
  pliegues: Eje[],
  ejeCorrecto: Eje
): AlternativaPlegado | null {
  // Elige un eje diferente al correcto para el ÚLTIMO pliegue (el más saliente)
  const otrosEjes = (["vertical", "horizontal", "diagonal"] as const).filter((e) => e !== ejeCorrecto);
  for (const ejeMal of otrosEjes) {
    const plieguesMal = [...pliegues.slice(0, -1), ejeMal];
    const resultado = puntos.flatMap((p) => combinacionesReflejo(p, plieguesMal));
    const alt = { puntos: normalizarAlternativa(resultado) };
    // Verificar que no sea igual a la correcta
    const correcta = normalizarAlternativa(puntos.flatMap((p) => combinacionesReflejo(p, pliegues)));
    if (!puntosIguales(alt.puntos, correcta)) return alt;
  }
  return null;
}

function distractorDesplazado(
  puntos: Punto[],
  pliegues: Eje[],
  offsetDecoy: number
): AlternativaPlegado | null {
  // Refleja bien pero desplaza UN punto en el resultado
  const resultado = puntos.flatMap((p) => combinacionesReflejo(p, pliegues));
  if (resultado.length < 2) return null;
  const ultimo = resultado[resultado.length - 1];
  const desplazado: Punto =
    pliegues[pliegues.length - 1] === "vertical"
      ? { x: ultimo.x, y: ultimo.y + offsetDecoy }
      : pliegues[pliegues.length - 1] === "horizontal"
        ? { x: ultimo.x + offsetDecoy, y: ultimo.y }
        : { x: ultimo.x + offsetDecoy, y: ultimo.y - offsetDecoy };

  const conDesplazamiento = [...resultado.slice(0, -1), desplazado];
  const alt = { puntos: normalizarAlternativa(conDesplazamiento) };
  const correcta = normalizarAlternativa(puntos.flatMap((p) => combinacionesReflejo(p, pliegues)));
  if (!puntosIguales(alt.puntos, correcta)) return alt;
  return null;
}

function distractorSinReflejar(
  puntos: Punto[],
  pliegues: Eje[]
): AlternativaPlegado | null {
  // Los puntos se quedan en su lugar (no se reflejó ningún pliegue)
  const resultado = puntos;
  const alt = { puntos: normalizarAlternativa(resultado) };
  const correcta = normalizarAlternativa(puntos.flatMap((p) => combinacionesReflejo(p, pliegues)));
  if (!puntosIguales(alt.puntos, correcta)) return alt;
  return null;
}

export function generarItemPlegado(
  id: string,
  dificultad: DificultadPliegues,
  pliegues: Eje[],
  puntos: Punto[],
  // Decoy offset: más pequeño = más difícil (el distractor desplazado se confunde más con el correcto)
  offsetDecoy: number
): ItemPlegado {
  const correcta: AlternativaPlegado = {
    puntos: normalizarAlternativa(puntos.flatMap((p) => combinacionesReflejo(p, pliegues))),
  };

  const distractores: AlternativaPlegado[] = [];

  // 1. Refleja sobre el eje equivocado (solo si hay al menos 1 pliegue)
  const d1 = distractorEjeIncorrecto(puntos, pliegues, pliegues[pliegues.length - 1]);
  if (d1) distractores.push(d1);

  // 2. Refleja bien pero desplaza uno de los puntos reflejados
  const d2 = distractorDesplazado(puntos, pliegues, offsetDecoy);
  if (d2) distractores.push(d2);

  // 3. No refleja (puntos se quedan donde están)
  const d3 = distractorSinReflejar(puntos, pliegues);
  if (d3) distractores.push(d3);

  // Si no alcanzamos 3 distractores, rellenamos con alternativas adicionales
  // (p.ej. otro eje incorrecto)
  while (distractores.length < 3) {
    const otroEje = (["vertical", "horizontal", "diagonal"] as const).filter(
      (e) => e !== pliegues[pliegues.length - 1]
    );
    for (const eje of otroEje) {
      if (distractores.length >= 3) break;
      const plieguesMal = [...pliegues.slice(0, -1), eje];
      const resultado = puntos.flatMap((p) => combinacionesReflejo(p, plieguesMal));
      const alt = { puntos: normalizarAlternativa(resultado) };
      if (
        !puntosIguales(alt.puntos, correcta.puntos) &&
        !distractores.some((d) => puntosIguales(d.puntos, alt.puntos))
      ) {
        distractores.push(alt);
      }
    }
    break; // si no hay más, salimos
  }

  const todasLasAlternativas = ordenPorSemilla([correcta, ...distractores.slice(0, 3)], id);
  const indiceCorrecto = todasLasAlternativas.findIndex(
    (a) => a === correcta
  );

  return { id, tipo: "plegado", dificultad, pliegues, puntos, alternativas: todasLasAlternativas, indiceCorrecto };
}

export type ItemPlieguesBloque = ItemPlegado;
