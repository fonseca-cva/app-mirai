import { useId } from "react";
import { ajustarLuminosidad, colores } from "@/lib/config/tokens";
import { ACENTOS } from "@/components/origami/IconoContexto";
import type { DimensionCodigo } from "@/lib/data/contextos";

// ITERACIÓN 2 (A.1): diorama SVG por contexto. Piezas paramétricas reutilizadas
// entre escenas para no disparar el peso del set completo (presupuesto: <350KB).
// Mismo lenguaje visual del sitio: 3 tonos según LUZ superior-izquierda
// (izquierda = clara, derecha = sombra), acento por dimensión, pliegues sutiles.

interface EscenaContextoProps {
  escenaId: string;
  dimension: DimensionCodigo;
  className?: string;
}

const TONO_BASE = colores.tinta;
const TONO_CLARO = ajustarLuminosidad(TONO_BASE, 8);
const TONO_OSCURO = ajustarLuminosidad(TONO_BASE, -12);
// Capa lejana: perspectiva atmosférica (mezcla hacia papel, sección B.6 de tokens).
const TONO_LEJANO = ajustarLuminosidad(TONO_BASE, 22);

function crease(id: string, x1: number, y1: number, x2: number, y2: number, opacity = 0.2) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={`url(#${id})`} strokeWidth={1} opacity={opacity} />;
}

// Figura humana de papel: silueta neutra (sin género, sin rasgos), siempre EN ACCIÓN.
// La pose (brazo/postura) comunica el oficio, no el vestuario.
function FiguraPapel({
  x,
  y,
  pose,
  acento,
  escala = 1,
}: {
  x: number;
  y: number;
  pose: "martillo" | "puntero" | "empuje" | "sentado";
  acento: string;
  escala?: number;
}) {
  const cuerpo = (
    <>
      {/* cabeza */}
      <polygon points="0,-38 6,-32 0,-26 -6,-32" fill={TONO_CLARO} />
      {/* torso */}
      <polygon points="-7,-26 7,-26 9,0 -9,0" fill={TONO_BASE} />
      <polygon points="0,-26 7,-26 9,0 0,0" fill={TONO_OSCURO} />
      {/* piernas */}
      <polygon points="-9,0 0,0 -3,26 -10,26" fill={TONO_OSCURO} />
      <polygon points="0,0 9,0 6,26 -1,26" fill={TONO_CLARO} />
    </>
  );

  const brazos = {
    martillo: (
      <>
        <polygon points="-7,-22 -18,-34 -13,-38 -3,-24" fill={TONO_CLARO} />
        <polygon points="-20,-40 -10,-34 -14,-28 -24,-34" fill={acento} />
        <polygon points="7,-22 14,-6 8,-4 2,-20" fill={TONO_OSCURO} />
      </>
    ),
    puntero: (
      <>
        <polygon points="7,-22 22,-30 25,-25 10,-18" fill={TONO_OSCURO} />
        <polygon points="-7,-22 -14,-6 -8,-4 -2,-20" fill={TONO_CLARO} />
      </>
    ),
    empuje: (
      <>
        <polygon points="7,-20 22,-14 20,-6 6,-12" fill={TONO_OSCURO} />
        <polygon points="-7,-20 -22,-14 -20,-6 -6,-12" fill={TONO_CLARO} />
      </>
    ),
    sentado: (
      <>
        <polygon points="-7,-22 -16,-12 -10,-8 -2,-18" fill={TONO_CLARO} />
        <polygon points="7,-22 16,-12 10,-8 2,-18" fill={TONO_OSCURO} />
      </>
    ),
  }[pose];

  return (
    <g transform={`translate(${x} ${y}) scale(${escala})`}>
      {cuerpo}
      {brazos}
    </g>
  );
}

function Mesa({ x, y, ancho = 44 }: { x: number; y: number; ancho?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <polygon points={`0,0 ${ancho},0 ${ancho - 6},10 6,10`} fill={TONO_CLARO} />
      <polygon points={`6,10 ${ancho - 6},10 ${ancho - 6},34 6,34`} fill={TONO_OSCURO} opacity={0.7} />
    </g>
  );
}

function Pantalla({ x, y, acento }: { x: number; y: number; acento: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <polygon points="0,0 26,0 26,18 0,18" fill={TONO_BASE} />
      <polygon points="3,3 23,3 23,15 3,15" fill={acento} opacity={0.35} />
      <polygon points="10,18 16,18 18,24 8,24" fill={TONO_OSCURO} />
    </g>
  );
}

function Planta({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <polygon points="-6,0 6,0 4,10 -4,10" fill={TONO_OSCURO} />
      <polygon points="0,-16 -8,-2 0,-4" fill={colores.salvia} />
      <polygon points="0,-14 8,-2 0,-2" fill={ajustarLuminosidad(colores.salvia, 10)} />
    </g>
  );
}

function CajaFruta({ x, y, acento }: { x: number; y: number; acento: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <polygon points="0,10 28,10 24,28 4,28" fill={TONO_CLARO} />
      <polygon points="4,28 24,28 22,34 6,34" fill={TONO_OSCURO} opacity={0.6} />
      <circle cx="10" cy="12" r="3.4" fill={acento} />
      <circle cx="17" cy="10" r="3.4" fill={ajustarLuminosidad(acento, 12)} />
      <circle cx="23" cy="13" r="3.4" fill={acento} />
    </g>
  );
}

// ─── Escena 1: Obra en construcción (tec-01, capataz de obra) ───────────
function EscenaObraConstruccion({ id, acento }: { id: string; acento: string }) {
  return (
    <>
      {/* cielo/piso */}
      <rect x="0" y="0" width="200" height="120" fill="none" />
      <line x1="0" y1="104" x2="200" y2="104" stroke={TONO_OSCURO} strokeWidth={1} opacity={0.15} />

      {/* grúa de papel, capa lejana */}
      <g opacity={0.9}>
        <polygon points="150,104 156,104 154,30 150,30" fill={TONO_LEJANO} />
        <polygon points="150,32 190,20 190,26 152,38" fill={TONO_LEJANO} />
        <line x1="188" y1="22" x2="188" y2="48" stroke={TONO_LEJANO} strokeWidth={1.5} />
      </g>

      {/* estructura a medio levantar */}
      <g>
        <polygon points="30,104 40,104 40,40 30,40" fill={TONO_CLARO} />
        <polygon points="70,104 80,104 80,34 70,34" fill={TONO_BASE} />
        <polygon points="40,50 70,50 70,56 40,56" fill={TONO_OSCURO} />
        <polygon points="40,74 70,74 70,80 40,80" fill={TONO_OSCURO} />
        {crease(id, 40, 40, 40, 104, 0.15)}
        {crease(id, 70, 34, 70, 104, 0.15)}
      </g>

      {/* casco (acento) sobre la figura */}
      <FiguraPapel x={100} y={100} pose="martillo" acento={acento} escala={0.9} />
      <FiguraPapel x={122} y={102} pose="puntero" acento={acento} escala={0.8} />

      {/* plano sobre mesa baja, primer plano */}
      <Mesa x={10} y={90} ancho={30} />
      <polygon points="12,88 36,88 36,92 12,92" fill={colores.blancoPapel} opacity={0.9} />
      <line x1="16" y1="90" x2="32" y2="90" stroke={acento} strokeWidth={1} opacity={0.6} />
    </>
  );
}

// ─── Escena 2: Packing agrícola (nat-01) ────────────────────────────────
function EscenaPackingAgricola({ id, acento }: { id: string; acento: string }) {
  return (
    <>
      <line x1="0" y1="104" x2="200" y2="104" stroke={TONO_OSCURO} strokeWidth={1} opacity={0.15} />

      {/* cajas apiladas al fondo */}
      <g opacity={0.85}>
        <CajaFruta x={150} y={56} acento={ajustarLuminosidad(acento, 6)} />
        <CajaFruta x={172} y={62} acento={ajustarLuminosidad(acento, 6)} />
      </g>

      {/* mesón / línea de packing, primer plano */}
      <polygon points="10,80 190,80 182,96 18,96" fill={TONO_CLARO} />
      <polygon points="18,96 182,96 178,104 22,104" fill={TONO_OSCURO} opacity={0.6} />
      {crease(id, 10, 80, 190, 80, 0.15)}

      <CajaFruta x={30} y={54} acento={acento} />
      <CajaFruta x={70} y={50} acento={acento} />

      <FiguraPapel x={110} y={96} pose="empuje" acento={acento} escala={0.9} />
      <FiguraPapel x={140} y={98} pose="martillo" acento={acento} escala={0.85} />
    </>
  );
}

const ESCENAS: Record<string, (props: { id: string; acento: string }) => React.ReactNode> = {
  "obra-construccion": (p) => <EscenaObraConstruccion {...p} />,
  "packing-agricola": (p) => <EscenaPackingAgricola {...p} />,
};

/** true si existe una escena ilustrada construida para este id (si no, el llamador debe caer al ícono). */
export function tieneEscena(escenaId: string | undefined): escenaId is string {
  return !!escenaId && escenaId in ESCENAS;
}

export function EscenaContexto({ escenaId, dimension, className = "" }: EscenaContextoProps) {
  const creaseId = useId();
  const render = ESCENAS[escenaId];
  if (!render) return null;

  const acento = ACENTOS[dimension];

  return (
    <svg viewBox="0 0 200 120" className={className} role="img" aria-hidden="true">
      <defs>
        <linearGradient id={creaseId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={colores.blancoPapel} />
          <stop offset="100%" stopColor={colores.tinta} />
        </linearGradient>
      </defs>
      {render({ id: creaseId, acento })}
    </svg>
  );
}
