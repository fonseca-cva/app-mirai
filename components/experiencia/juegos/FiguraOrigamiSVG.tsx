import type { FiguraOrigami } from "@/lib/logic/figuraOrigami";

interface Props {
  figura: FiguraOrigami;
  tamano?: number;
  titulo?: string;
}

function puntosPoligono(lados: number, radio: number, centro: number): string {
  const puntos: string[] = [];
  for (let i = 0; i < lados; i++) {
    const angulo = (Math.PI * 2 * i) / lados - Math.PI / 2;
    const x = centro + radio * Math.cos(angulo);
    const y = centro + radio * Math.sin(angulo);
    puntos.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return puntos.join(" ");
}

// Interpola entre el teal claro y el teal profundo de marca según el atributo "tono" (0-1).
// El tono nunca es la única señal: lados y pliegues ya distinguen la figura por forma.
function colorPorTono(tono: number): string {
  const claro = { r: 0x74, g: 0xc2, b: 0xce };
  const profundo = { r: 0x2f, g: 0x9a, b: 0xac };
  const mezclar = (a: number, b: number) => Math.round(a + (b - a) * tono);
  return `rgb(${mezclar(claro.r, profundo.r)}, ${mezclar(claro.g, profundo.g)}, ${mezclar(claro.b, profundo.b)})`;
}

// Renderiza una figura origami como SVG paramétrico (nunca una imagen): un polígono regular
// de `lados` caras, rotado, con `pliegues` capas concéntricas que evocan dobleces de papel.
export function FiguraOrigamiSVG({ figura, tamano = 96, titulo }: Props) {
  const centro = tamano / 2;
  const radioBase = tamano * 0.42;
  const color = colorPorTono(figura.tono);
  const capas = Array.from({ length: figura.pliegues }, (_, i) => {
    const escala = 1 - i * 0.24;
    return puntosPoligono(figura.lados, radioBase * escala, centro);
  });

  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox={`0 0 ${tamano} ${tamano}`}
      role="img"
      aria-label={titulo ?? "Figura origami"}
    >
      <g transform={`rotate(${figura.rotacionDeg} ${centro} ${centro})`}>
        {capas.map((puntos, i) => (
          <polygon
            key={i}
            points={puntos}
            fill={i === capas.length - 1 ? color : "none"}
            stroke={color}
            strokeWidth={2}
            strokeLinejoin="round"
            opacity={i === 0 ? 1 : 0.85}
          />
        ))}
      </g>
    </svg>
  );
}
