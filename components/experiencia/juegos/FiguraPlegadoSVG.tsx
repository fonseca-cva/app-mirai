import type { Eje, Punto } from "@/lib/logic/rotacion";

const TAMANO = 80;

function coord(punto: Punto): { cx: number; cy: number } {
  return { cx: punto.x * TAMANO, cy: punto.y * TAMANO };
}

interface EstimuloProps {
  eje: Eje;
  punto: Punto;
}

// Estímulo: el papel doblado por la línea, con el punto de perforación marcado.
export function EstimuloPlegado({ eje, punto }: EstimuloProps) {
  const { cx, cy } = coord(punto);
  const lineaProps =
    eje === "vertical"
      ? { x1: TAMANO / 2, y1: 0, x2: TAMANO / 2, y2: TAMANO }
      : { x1: 0, y1: TAMANO / 2, x2: TAMANO, y2: TAMANO / 2 };

  return (
    <svg width={TAMANO} height={TAMANO} viewBox={`0 0 ${TAMANO} ${TAMANO}`} role="img" aria-label="Papel doblado">
      <rect x={0} y={0} width={TAMANO} height={TAMANO} fill="var(--color-blanco-papel)" stroke="var(--color-tinta)" strokeOpacity={0.15} />
      <line {...lineaProps} stroke="var(--color-coral)" strokeDasharray="4 3" strokeWidth={2} />
      <circle cx={cx} cy={cy} r={4} fill="var(--color-tinta)" />
    </svg>
  );
}

interface AlternativaProps {
  puntos: [Punto, Punto];
}

// Alternativa: el papel ya desplegado, con los dos puntos de perforación resultantes.
export function AlternativaPlegado({ puntos }: AlternativaProps) {
  return (
    <svg width={TAMANO} height={TAMANO} viewBox={`0 0 ${TAMANO} ${TAMANO}`} role="img" aria-label="Papel desplegado">
      <rect x={0} y={0} width={TAMANO} height={TAMANO} fill="var(--color-blanco-papel)" stroke="var(--color-tinta)" strokeOpacity={0.15} />
      {puntos.map((p, i) => {
        const { cx, cy } = coord(p);
        return <circle key={i} cx={cx} cy={cy} r={4} fill="var(--color-teal-profundo)" />;
      })}
    </svg>
  );
}
