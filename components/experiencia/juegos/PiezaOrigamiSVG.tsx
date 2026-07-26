import { puntosSvg, transformarPieza } from "@/lib/logic/piezaOrigami";

interface Props {
  anguloDeg: number;
  espejada: boolean;
  tamano?: number;
  titulo?: string;
}

// Renderiza la pieza asimétrica (SVG paramétrico) para el juego de rotación mental.
export function PiezaOrigamiSVG({ anguloDeg, espejada, tamano = 80, titulo }: Props) {
  const centro = tamano / 2;
  const puntos = puntosSvg(transformarPieza(anguloDeg, espejada), centro);

  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox={`0 0 ${tamano} ${tamano}`}
      role="img"
      aria-label={titulo ?? "Pieza de papel"}
    >
      <polygon
        points={puntos}
        fill="var(--color-teal-medio)"
        stroke="var(--color-teal-profundo)"
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </svg>
  );
}
