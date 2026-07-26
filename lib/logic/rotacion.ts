export type DificultadRotacion = "facil" | "media" | "dificil";
export type Eje = "vertical" | "horizontal";
export interface Punto {
  x: number;
  y: number;
}

// -- Tipo (a): rotación mental. Alternativas: 1 pieza rotada (correcta) + 3 espejadas. --
export interface AlternativaRotacion {
  anguloDeg: number;
  espejada: boolean;
}

export interface ItemRotacionMental {
  id: string;
  tipo: "rotacion";
  dificultad: DificultadRotacion;
  anguloReferencia: number;
  alternativas: AlternativaRotacion[];
  indiceCorrecto: number;
}

function ordenPorSemilla<T>(items: T[], semilla: string): T[] {
  const offset = semilla.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

export function generarItemRotacionMental(
  id: string,
  dificultad: DificultadRotacion,
  anguloReferencia: number,
  anguloCorrecto: number,
  // Difícil = ángulos espejados cercanos al correcto (más fácil confundirse); fácil = lejanos.
  offsetsEspejados: [number, number, number]
): ItemRotacionMental {
  const correcta: AlternativaRotacion = { anguloDeg: anguloCorrecto, espejada: false };
  const distractores: AlternativaRotacion[] = offsetsEspejados.map((offset) => ({
    anguloDeg: (anguloCorrecto + offset + 360) % 360,
    espejada: true,
  }));

  const alternativas = ordenPorSemilla([correcta, ...distractores], id);
  const indiceCorrecto = alternativas.findIndex((a) => a === correcta);

  return { id, tipo: "rotacion", dificultad, anguloReferencia, alternativas, indiceCorrecto };
}

// -- Tipo (b): plegado. Al desplegar, el punto original se refleja sobre el eje de doblez. --
export interface AlternativaPlegado {
  puntos: [Punto, Punto];
}

export interface ItemPlegado {
  id: string;
  tipo: "plegado";
  dificultad: DificultadRotacion;
  eje: Eje;
  punto: Punto;
  alternativas: AlternativaPlegado[];
  indiceCorrecto: number;
}

function reflejar(punto: Punto, eje: Eje): Punto {
  return eje === "vertical" ? { x: 1 - punto.x, y: punto.y } : { x: punto.x, y: 1 - punto.y };
}

function par(a: Punto, b: Punto): [Punto, Punto] {
  return [a, b];
}

function ejeContrario(eje: Eje): Eje {
  return eje === "vertical" ? "horizontal" : "vertical";
}

function puntosIguales(a: [Punto, Punto], b: [Punto, Punto]): boolean {
  return a.every((p, i) => p.x === b[i].x && p.y === b[i].y);
}

export function generarItemPlegado(
  id: string,
  dificultad: DificultadRotacion,
  eje: Eje,
  punto: Punto,
  // Difícil = el punto decoy queda más cerca del correcto (más fácil confundirse).
  offsetDecoy: number
): ItemPlegado {
  const correcta: AlternativaPlegado = { puntos: par(punto, reflejar(punto, eje)) };
  const ejeIncorrecto = ejeContrario(eje);
  const reflejoCorrecto = reflejar(punto, eje);

  const distractores: AlternativaPlegado[] = [
    // 1. refleja sobre el eje equivocado
    { puntos: par(punto, reflejar(punto, ejeIncorrecto)) },
    // 2. refleja bien pero desplaza el segundo punto (el pliegue "no calza")
    {
      puntos: par(
        punto,
        eje === "vertical"
          ? { ...reflejoCorrecto, y: reflejoCorrecto.y + offsetDecoy }
          : { ...reflejoCorrecto, x: reflejoCorrecto.x + offsetDecoy }
      ),
    },
    // 3. no refleja: el segundo punto queda igual al original (como si no se hubiera doblado)
    { puntos: par(punto, { ...punto }) },
  ].filter((d) => !puntosIguales(d.puntos, correcta.puntos));

  const alternativas = ordenPorSemilla([correcta, ...distractores.slice(0, 3)], id);
  const indiceCorrecto = alternativas.findIndex((a) => a === correcta);

  return { id, tipo: "plegado", dificultad, eje, punto, alternativas, indiceCorrecto };
}

export type ItemRotacionBloque = ItemRotacionMental | ItemPlegado;
