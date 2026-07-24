import type { ReactNode } from "react";
import type { DimensionCodigo } from "@/lib/data/contextos";
import { dimensiones } from "@/lib/data/contextos";

interface IconoContextoProps {
  dimension: DimensionCodigo;
  className?: string;
}

// DECISIÓN: la spec pide "12 iconos de contextos laborales" pero define
// 24 contextos en 8 dimensiones. Ante esa inconsistencia, se elige la opción
// más simple: un icono geométrico plegado por dimensión (8), monocromo (tinta)
// + acento, reutilizado por los 3 contextos de esa dimensión.
const TONO_BASE = "#2B2B33";
const TONO_MEDIO = "#3F3F49";

const ACENTOS: Record<DimensionCodigo, string> = {
  tec: "#D9A441",
  cie: "#7FA08C",
  cre: "#E86A4F",
  soc: "#E86A4F",
  sal: "#7FA08C",
  ges: "#D9A441",
  dat: "#7FA08C",
  nat: "#D9A441",
};

const FORMAS: Record<DimensionCodigo, ReactNode> = {
  tec: (
    <>
      <polygon points="20,60 45,35 55,45 30,70" fill={TONO_BASE} />
      <polygon points="45,35 65,20 75,30 55,45" fill={TONO_MEDIO} />
      <polygon points="65,20 80,15 75,30" fill="var(--acento)" />
    </>
  ),
  cie: (
    <>
      <polygon points="40,15 60,15 60,45 75,80 25,80 40,45" fill={TONO_BASE} />
      <polygon points="40,15 60,15 60,45 40,45" fill={TONO_MEDIO} />
      <polygon points="30,68 70,68 75,80 25,80" fill="var(--acento)" />
    </>
  ),
  cre: (
    <>
      <polygon points="55,15 75,35 35,75 25,65" fill={TONO_BASE} />
      <polygon points="55,15 75,35 65,45 45,25" fill={TONO_MEDIO} />
      <polygon points="35,75 25,65 30,55 40,65" fill="var(--acento)" />
    </>
  ),
  soc: (
    <>
      <polygon points="30,25 45,15 50,30 35,40" fill={TONO_BASE} />
      <polygon points="60,25 75,15 80,30 65,40" fill={TONO_MEDIO} />
      <polygon points="20,80 40,45 60,45 80,80" fill="var(--acento)" />
    </>
  ),
  sal: (
    <>
      <polygon points="40,20 60,20 60,40 80,40 80,60 60,60 60,80 40,80 40,60 20,60 20,40 40,40" fill={TONO_BASE} />
      <polygon points="40,20 60,20 60,40 40,40" fill="var(--acento)" />
    </>
  ),
  ges: (
    <>
      <polygon points="50,15 75,55 55,55 55,80 45,80 45,55 25,55" fill={TONO_BASE} />
      <polygon points="50,15 75,55 55,55 55,35" fill={TONO_MEDIO} />
      <polygon points="50,15 60,32 40,32" fill="var(--acento)" />
    </>
  ),
  dat: (
    <>
      <polygon points="20,80 35,80 35,55 20,55" fill={TONO_BASE} />
      <polygon points="42,80 57,80 57,35 42,35" fill={TONO_MEDIO} />
      <polygon points="64,80 79,80 79,20 64,20" fill="var(--acento)" />
    </>
  ),
  nat: (
    <>
      <polygon points="20,75 45,25 60,50 50,75" fill={TONO_BASE} />
      <polygon points="45,25 60,50 50,75 55,60" fill={TONO_MEDIO} />
      <polygon points="55,45 70,20 80,75 60,75" fill="var(--acento)" />
    </>
  ),
};

export function IconoContexto({ dimension, className = "" }: IconoContextoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label={`Icono del ámbito ${dimensiones[dimension]}`}
      style={{ "--acento": ACENTOS[dimension] } as React.CSSProperties}
    >
      {FORMAS[dimension]}
    </svg>
  );
}
