import type { FiguraOrigami } from "@/lib/logic/figuraOrigami";

interface Props {
  figura: FiguraOrigami;
  tamano?: number;
  titulo?: string;
}

interface Punto {
  x: number;
  y: number;
}

function puntosPoligono(lados: number, radio: number, centro: number): Punto[] {
  const puntos: Punto[] = [];
  for (let i = 0; i < lados; i++) {
    const angulo = (Math.PI * 2 * i) / lados - Math.PI / 2;
    puntos.push({ x: centro + radio * Math.cos(angulo), y: centro + radio * Math.sin(angulo) });
  }
  return puntos;
}

function formatearPuntos(puntos: Punto[]): string {
  return puntos.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
}

// Color fijo y uniforme: nunca porta la regla (prohibición absoluta de color como señal).
const COLOR = "var(--color-teal-profundo)";
const COLOR_MARCA = "var(--color-coral)";

// Renderiza una figura origami como SVG paramétrico (nunca una imagen): un polígono regular
// de `lados` caras, rotado, con `pliegues` capas concéntricas que evocan dobleces de papel.
//
// Marca de asimetría: un punto pequeño sobre el primer vértice, dentro del mismo grupo rotado.
// Sin esta marca, un polígono regular es indistinguible de sí mismo rotado en múltiplos de
// 360/lados grados (p.ej. un cuadrado rotado 90° se ve idéntico a sí mismo) — la marca rompe
// esa simetría rotacional para que CUALQUIER cambio de `rotacionDeg` sea siempre visible.
export function FiguraOrigamiSVG({ figura, tamano = 96, titulo }: Props) {
  const centro = tamano / 2;
  const radioBase = tamano * 0.42;
  const solido = figura.relleno === 0;
  const capas = Array.from({ length: figura.pliegues }, (_, i) => {
    const escala = 1 - i * 0.24;
    return puntosPoligono(figura.lados, radioBase * escala, centro);
  });
  const puntoMarca = capas[0][0]!;

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
            points={formatearPuntos(puntos)}
            fill={solido && i === capas.length - 1 ? COLOR : "none"}
            stroke={COLOR}
            strokeWidth={2}
            strokeLinejoin="round"
            opacity={i === 0 ? 1 : 0.85}
          />
        ))}
        <circle cx={puntoMarca.x} cy={puntoMarca.y} r={tamano * 0.045} fill={COLOR_MARCA} />
      </g>
    </svg>
  );
}
