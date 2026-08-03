export type TipoOrigami = "grulla" | "barco" | "flor" | "estrella" | "casa" | "pez";

interface Props {
  tipo: TipoOrigami;
  tamano?: number;
  titulo?: string;
}

// Color fijo y uniforme: nunca porta la regla (misma prohibición que en FiguraOrigamiSVG).
const COLOR = "var(--color-teal-profundo)";

function puntos(pares: Array<[number, number]>): string {
  return pares.map(([x, y]) => `${x},${y}`).join(" ");
}

// Estrella de 5 puntas calculada (no hardcodeada), en un viewBox de 100x100 centrado en (50,50).
function puntosEstrella(): string {
  const centro = 50;
  const radioExt = 42;
  const radioInt = 18;
  const pares: Array<[number, number]> = [];
  for (let i = 0; i < 10; i++) {
    const radio = i % 2 === 0 ? radioExt : radioInt;
    const angulo = (Math.PI * i) / 5 - Math.PI / 2;
    pares.push([centro + radio * Math.cos(angulo), centro + radio * Math.sin(angulo)]);
  }
  return puntos(pares);
}

// Cada objeto se dibuja como un conjunto de polígonos rectos (estilo low-poly / origami:
// facetas planas, sin curvas), en un único color de trazo/relleno — nunca el color porta
// información. Las 6 formas son distinguibles por silueta, no por tono.
const FORMAS: Record<TipoOrigami, Array<Array<[number, number]>>> = {
  // Grulla: cuerpo/cola romboidal, cuello y pico triangulares, un ala triangular superior.
  grulla: [
    [[15, 68], [50, 45], [88, 58], [58, 78]], // cuerpo + cola
    [[50, 45], [62, 12], [67, 34]], // cuello y pico
    [[32, 55], [55, 22], [66, 58]], // ala
  ],
  // Barco: casco trapezoidal + vela triangular sobre el mástil.
  barco: [
    [[12, 72], [88, 72], [70, 90], [30, 90]], // casco
    [[50, 15], [50, 72], [82, 64]], // vela
  ],
  // Flor: 4 pétalos romboidales alrededor de un centro cuadrado.
  flor: [
    [[50, 8], [61, 35], [50, 50], [39, 35]], // pétalo superior
    [[92, 50], [65, 61], [50, 50], [65, 39]], // pétalo derecho
    [[50, 92], [61, 65], [50, 50], [39, 65]], // pétalo inferior
    [[8, 50], [35, 61], [50, 50], [35, 39]], // pétalo izquierdo
    [[42, 42], [58, 42], [58, 58], [42, 58]], // centro
  ],
  // Estrella: polígono de 5 puntas (calculado en puntosEstrella, se dibuja aparte).
  estrella: [],
  // Casa: techo triangular + fachada rectangular.
  casa: [
    [[50, 12], [88, 45], [12, 45]], // techo
    [[24, 45], [76, 45], [76, 88], [24, 88]], // fachada
  ],
  // Pez: cuerpo romboidal + cola triangular.
  pez: [
    [[18, 50], [58, 24], [76, 50], [58, 76]], // cuerpo
    [[76, 50], [94, 28], [94, 72]], // cola
  ],
};

// Renderiza uno de los 6 objetos origami del juego de Secuencias como SVG paramétrico
// (nunca una imagen), en estilo low-poly (facetas rectas, un solo color), para que cada
// objeto sea reconocible a simple vista y distinguible de los demás por su silueta.
export function IconoOrigamiSVG({ tipo, tamano = 96, titulo }: Props) {
  const poligonos = FORMAS[tipo];

  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 100 100"
      role="img"
      aria-label={titulo ?? `Objeto origami: ${tipo}`}
    >
      {tipo === "estrella" ? (
        <polygon points={puntosEstrella()} fill={COLOR} stroke={COLOR} strokeWidth={2} strokeLinejoin="round" />
      ) : (
        poligonos.map((pares, i) => (
          <polygon
            key={i}
            points={puntos(pares)}
            fill={COLOR}
            stroke={COLOR}
            strokeWidth={2}
            strokeLinejoin="round"
            opacity={i === 0 ? 1 : 0.85}
          />
        ))
      )}
    </svg>
  );
}
