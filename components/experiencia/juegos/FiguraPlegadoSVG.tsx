import type { Eje, Punto } from "@/lib/logic/rotacion";

const TAMANO = 80;

function coord(punto: Punto): { cx: number; cy: number } {
  return { cx: punto.x * TAMANO, cy: punto.y * TAMANO };
}

function lineaEje(eje: Eje, idx: number) {
  const offset = idx * 4; // pequeño desplazamiento visual para ejes paralelos
  switch (eje) {
    case "vertical":
      return { x1: TAMANO / 2 + offset, y1: 0, x2: TAMANO / 2 + offset, y2: TAMANO };
    case "horizontal":
      return { x1: 0, y1: TAMANO / 2 + offset, x2: TAMANO, y2: TAMANO / 2 + offset };
    case "diagonal":
      return { x1: 0, y1: 0, x2: TAMANO, y2: TAMANO };
  }
}

// La flecha de dirección del panel 1 usa el primer pliegue como principal.
function mitadQuePliega(eje: Eje, punto: Punto): { x: number; y: number; width: number; height: number } {
  switch (eje) {
    case "vertical":
      return punto.x > 0.5
        ? { x: TAMANO / 2, y: 0, width: TAMANO / 2, height: TAMANO }
        : { x: 0, y: 0, width: TAMANO / 2, height: TAMANO };
    case "horizontal":
      return punto.y > 0.5
        ? { x: 0, y: TAMANO / 2, width: TAMANO, height: TAMANO / 2 }
        : { x: 0, y: 0, width: TAMANO, height: TAMANO / 2 };
    case "diagonal":
      // Para diagonal usamos una simplificación: mostrar la mitad arriba/izquierda
      return { x: 0, y: 0, width: TAMANO / 2, height: TAMANO / 2 };
  }
}

// El panel 2 (papel ya doblado) debe mostrar la intersección de TODAS las mitades no-diagonales
// que sobreviven al doblez, no solo la del primer pliegue. Para 2 pliegues vertical+horizontal
// esto da el cuarto de papel correcto en vez de la mitad. La diagonal combinada con otro eje
// no ocurre en los datos actuales; si el único pliegue es diagonal se mantiene la simplificación.
function mitadQuePliegaCompuesta(pliegues: Eje[], puntoRef: Punto): { x: number; y: number; width: number; height: number } {
  if (pliegues.length === 1) return mitadQuePliega(pliegues[0]!, puntoRef);

  let x0 = 0;
  let y0 = 0;
  let x1 = TAMANO;
  let y1 = TAMANO;
  for (const eje of pliegues) {
    if (eje === "vertical") {
      if (puntoRef.x > 0.5) x0 = Math.max(x0, TAMANO / 2);
      else x1 = Math.min(x1, TAMANO / 2);
    } else if (eje === "horizontal") {
      if (puntoRef.y > 0.5) y0 = Math.max(y0, TAMANO / 2);
      else y1 = Math.min(y1, TAMANO / 2);
    }
  }
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

interface EstimuloProps {
  pliegues: Eje[];
  puntos: Punto[];
}

// Panel 1: el papel plano con las líneas de doblez y una flecha indicando la dirección del primer pliegue.
export function PanelDoblez({ pliegues, puntos }: EstimuloProps) {
  const primerEje = pliegues[0]!;
  const primerPunto = puntos[0]!;
  const mitad = mitadQuePliega(primerEje, primerPunto);
  const centroMitad = { x: mitad.x + mitad.width / 2, y: mitad.y + mitad.height / 2 };
  const centroTotal = TAMANO / 2;
  const flecha = {
    x1: centroMitad.x,
    y1: centroMitad.y,
    x2: centroMitad.x + (centroTotal - centroMitad.x) * 0.6,
    y2: centroMitad.y + (centroTotal - centroMitad.y) * 0.6,
  };

  return (
    <svg width={TAMANO} height={TAMANO} viewBox={`0 0 ${TAMANO} ${TAMANO}`} role="img" aria-label="Papel con línea de doblez">
      <rect x={0} y={0} width={TAMANO} height={TAMANO} fill="var(--color-blanco-papel)" stroke="var(--color-tinta)" strokeOpacity={0.15} />
      {pliegues.map((eje, i) => (
        <line key={i} {...lineaEje(eje, i)} stroke="var(--color-coral)" strokeDasharray="4 3" strokeWidth={2} />
      ))}
      <line
        {...flecha}
        stroke="var(--color-teal-profundo)"
        strokeWidth={2.5}
        strokeLinecap="round"
        markerEnd="url(#flecha-doblez)"
      />
      {puntos.map((p, i) => {
        const { cx, cy } = coord(p);
        return <circle key={i} cx={cx} cy={cy} r={2.5} fill="var(--color-teal-profundo)" opacity={0.7} />;
      })}
      <defs>
        <marker id="flecha-doblez" markerWidth={8} markerHeight={8} refX={4} refY={4} orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="var(--color-teal-profundo)" />
        </marker>
      </defs>
    </svg>
  );
}

// Panel 2: el papel ya doblado, con las perforaciones marcadas sobre las capas juntas.
export function PanelPerforado({ pliegues, puntos }: EstimuloProps) {
  const mitad = mitadQuePliegaCompuesta(pliegues, puntos[0]!);

  return (
    <svg width={TAMANO} height={TAMANO} viewBox={`0 0 ${TAMANO} ${TAMANO}`} role="img" aria-label="Papel doblado con perforación">
      <rect x={0} y={0} width={TAMANO} height={TAMANO} fill="var(--color-gris-papel)" fillOpacity={0.4} stroke="var(--color-tinta)" strokeOpacity={0.1} />
      <rect
        x={mitad.x}
        y={mitad.y}
        width={mitad.width}
        height={mitad.height}
        fill="var(--color-blanco-papel)"
        stroke="var(--color-teal-profundo)"
        strokeWidth={2}
      />
      {puntos.map((p, i) => {
        const { cx, cy } = coord(p);
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={5} fill="none" stroke="var(--color-coral)" strokeWidth={2} />
            <circle cx={cx} cy={cy} r={1.5} fill="var(--color-coral)" />
          </g>
        );
      })}
    </svg>
  );
}

interface AlternativaProps {
  puntos: Punto[];
}

// Panel 3 (alternativa): el papel ya desplegado con los puntos de perforación resultantes.
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
