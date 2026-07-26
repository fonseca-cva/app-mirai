import { useId } from "react";
import type { DimensionCodigo } from "@/lib/data/contextos";
import { dimensiones } from "@/lib/data/contextos";
import { ajustarLuminosidad, colores } from "@/lib/config/tokens";

interface IconoContextoProps {
  dimension: DimensionCodigo;
  className?: string;
}

// DECISIÓN: la spec pide "12 iconos de contextos laborales" pero define
// 24 contextos en 8 dimensiones. Ante esa inconsistencia, se elige la opción
// más simple: un icono geométrico plegado por dimensión (8), monocromo (tinta)
// + acento, reutilizado por los 3 contextos de esa dimensión.
//
// Fase 1 (A.3/A.4): 3 tonos consistentes con LUZ (superior-izquierda) — caras
// hacia la izquierda quedan claras, caras hacia la derecha quedan en sombra —
// más una línea de pliegue por ícono.
const TONO_BASE = colores.tinta;
const TONO_CLARO = ajustarLuminosidad(TONO_BASE, 8);
const TONO_OSCURO = ajustarLuminosidad(TONO_BASE, -12);

export const ACENTOS: Record<DimensionCodigo, string> = {
  tec: "#D9A441",
  cie: "#7FA08C",
  cre: "#E86A4F",
  soc: "#E86A4F",
  sal: "#7FA08C",
  ges: "#D9A441",
  dat: "#7FA08C",
  nat: "#D9A441",
};

function crease(creaseId: string, x1: number, y1: number, x2: number, y2: number) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={`url(#${creaseId})`} strokeWidth={1} opacity={0.25} />;
}

const FORMAS: Record<DimensionCodigo, (creaseId: string) => React.ReactNode> = {
  tec: (id) => (
    <>
      <polygon points="20,60 45,35 30,70" fill={TONO_BASE} />
      <polygon points="45,35 55,45 30,70" fill={TONO_OSCURO} />
      <polygon points="45,35 65,20 75,30 55,45" fill={TONO_CLARO} />
      <polygon points="65,20 80,15 75,30" fill="var(--acento)" />
      {crease(id, 45, 35, 30, 70)}
    </>
  ),
  cie: (id) => (
    <>
      <polygon points="40,15 60,15 60,45 75,80 25,80 40,45" fill={TONO_BASE} />
      <polygon points="40,15 60,15 60,45 40,45" fill={TONO_CLARO} />
      <polygon points="60,45 75,80 40,45" fill={TONO_OSCURO} />
      <polygon points="30,68 70,68 75,80 25,80" fill="var(--acento)" />
      {crease(id, 60, 45, 40, 45)}
    </>
  ),
  cre: (id) => (
    <>
      <polygon points="55,15 75,35 35,75 25,65" fill={TONO_BASE} />
      <polygon points="75,35 35,75 55,15" fill={TONO_OSCURO} />
      <polygon points="55,15 75,35 65,45 45,25" fill={TONO_CLARO} />
      <polygon points="35,75 25,65 30,55 40,65" fill="var(--acento)" />
      {crease(id, 55, 15, 35, 75)}
    </>
  ),
  soc: (id) => (
    <>
      <polygon points="20,80 40,45 60,45 80,80" fill={TONO_BASE} />
      <polygon points="30,25 45,15 50,30 35,40" fill={TONO_CLARO} />
      <polygon points="60,25 75,15 80,30 65,40" fill={TONO_OSCURO} />
      <polygon points="40,45 60,45 50,60" fill="var(--acento)" />
      {crease(id, 40, 45, 60, 45)}
    </>
  ),
  sal: (id) => (
    <>
      <polygon
        points="40,20 60,20 60,40 80,40 80,60 60,60 60,80 40,80 40,60 20,60 20,40 40,40"
        fill={TONO_BASE}
      />
      <polygon points="20,40 40,40 40,60 20,60" fill={TONO_CLARO} />
      <polygon points="60,40 80,40 80,60 60,60" fill={TONO_OSCURO} />
      <polygon points="40,20 60,20 60,40 40,40" fill="var(--acento)" />
      {crease(id, 40, 40, 60, 40)}
    </>
  ),
  ges: (id) => (
    <>
      <polygon points="50,15 75,55 55,55 55,80 45,80 45,55 25,55" fill={TONO_BASE} />
      <polygon points="50,15 25,55 45,55" fill={TONO_CLARO} />
      <polygon points="50,15 75,55 55,55 55,35" fill={TONO_OSCURO} />
      <polygon points="50,15 60,32 40,32" fill="var(--acento)" />
      {crease(id, 50, 15, 55, 55)}
    </>
  ),
  dat: (id) => (
    <>
      <polygon points="20,80 35,80 35,55 20,55" fill={TONO_CLARO} />
      <polygon points="42,80 57,80 57,35 42,35" fill={TONO_BASE} />
      <polygon points="64,80 79,80 79,20 64,20" fill={TONO_OSCURO} />
      {crease(id, 57, 35, 57, 80)}
    </>
  ),
  nat: (id) => (
    <>
      <polygon points="20,75 45,25 60,50 50,75" fill={TONO_BASE} />
      <polygon points="45,25 60,50 50,75 55,60" fill={TONO_CLARO} />
      <polygon points="55,45 80,75 60,75" fill={TONO_OSCURO} />
      <polygon points="55,45 70,20 80,75" fill="var(--acento)" />
      {crease(id, 45, 25, 50, 75)}
    </>
  ),
};

export function IconoContexto({ dimension, className = "" }: IconoContextoProps) {
  const creaseId = useId();

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label={`Icono del ámbito ${dimensiones[dimension]}`}
      style={{ "--acento": ACENTOS[dimension] } as React.CSSProperties}
    >
      <defs>
        <linearGradient id={creaseId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={colores.blancoPapel} />
          <stop offset="100%" stopColor={colores.tinta} />
        </linearGradient>
      </defs>
      {FORMAS[dimension](creaseId)}
    </svg>
  );
}
