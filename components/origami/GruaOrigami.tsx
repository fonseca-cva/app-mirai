"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ajustarLuminosidad, colores } from "@/lib/config/tokens";

interface GruaOrigamiProps {
  className?: string;
  animarEntrada?: boolean;
}

const TONO_BASE = colores.tinta;
const TONO_CLARO = ajustarLuminosidad(TONO_BASE, 8);
const TONO_OSCURO = ajustarLuminosidad(TONO_BASE, -12);

// Grulla origami — logo-símbolo. 3 tonos consistentes con la fuente de luz
// declarada (LUZ, superior-izquierda): caras que miran a la izquierda quedan
// claras, las que miran a la derecha quedan en sombra. Con animarEntrada=true,
// se "pliega" una vez al cargar (≤1.5s).
export function GruaOrigami({ className = "", animarEntrada = false }: GruaOrigamiProps) {
  const creaseId = useId();
  const prefiereMenosMovimiento = useReducedMotion();
  const debeAnimar = animarEntrada && !prefiereMenosMovimiento;

  const alas = {
    initial: debeAnimar ? { scaleX: 0.15, opacity: 0 } : undefined,
    animate: debeAnimar ? { scaleX: 1, opacity: 1 } : undefined,
    transition: { duration: 1.2, ease: "easeOut" as const },
  };

  const cuerpo = animarEntrada
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: prefiereMenosMovimiento ? 0.3 : 0.8 },
      }
    : {};

  // Aleteo en reposo (C.11): rotación ±2° cada 6s, desfasada entre alas para
  // que no batan en espejo perfecto. Se suma a la animación de entrada sin
  // pisarla (transition por-propiedad).
  const aleteo = prefiereMenosMovimiento
    ? {}
    : {
        animate: { ...(debeAnimar ? { scaleX: 1, opacity: 1 } : {}), rotate: [0, -2, 0, 2, 0] },
        transition: {
          rotate: { duration: 6, repeat: Infinity, ease: "easeInOut" as const, delay: debeAnimar ? 1.2 : 0 },
          ...(debeAnimar ? { default: { duration: 1.2, ease: "easeOut" as const } } : {}),
        },
      };

  // Respiración (C.10): escala casi imperceptible en toda la figura, ciclo
  // largo y desfasado respecto a otros elementos grandes de la escena.
  const respiracion = prefiereMenosMovimiento
    ? {}
    : {
        animate: { scale: [1, 1.008, 1] },
        transition: { duration: 9, repeat: Infinity, ease: "easeInOut" as const },
      };

  return (
    <motion.svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Grulla de origami, símbolo de Mirai"
      style={{ transformOrigin: "50% 50%" }}
      {...respiracion}
    >
      <defs>
        <linearGradient id={creaseId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={colores.blancoPapel} />
          <stop offset="100%" stopColor={colores.tinta} />
        </linearGradient>
      </defs>

      <motion.g {...cuerpo}>
        {/* cuerpo / cabeza */}
        <polygon points="50,20 62,45 50,60 38,45" fill={TONO_BASE} />
        <polygon points="50,20 62,45 50,45" fill={TONO_CLARO} />
        <polygon points="62,45 78,15 68,40" fill={TONO_OSCURO} />
        <line x1={50} y1={20} x2={50} y2={60} stroke={`url(#${creaseId})`} strokeWidth={1} opacity={0.25} />
      </motion.g>
      <motion.g {...alas} {...aleteo} style={{ transformOrigin: "50px 48px" }}>
        {/* ala izquierda: mira hacia LUZ → clara, con pliegue inferior en sombra */}
        <polygon points="50,48 8,30 42,58" fill={TONO_CLARO} />
        <polygon points="50,48 42,58 20,55" fill={TONO_OSCURO} />
        <line x1={8} y1={30} x2={50} y2={48} stroke={`url(#${creaseId})`} strokeWidth={1} opacity={0.25} />
      </motion.g>
      <motion.g {...alas} {...aleteo} style={{ transformOrigin: "50px 48px" }}>
        {/* ala derecha: mira en contra de LUZ → en sombra, con pliegue inferior base */}
        <polygon points="50,48 92,30 58,58" fill={TONO_OSCURO} />
        <polygon points="50,48 58,58 80,55" fill={TONO_BASE} />
        <line x1={50} y1={48} x2={92} y2={30} stroke={`url(#${creaseId})`} strokeWidth={1} opacity={0.25} />
      </motion.g>
      {/* cola */}
      <polygon points="50,60 44,85 58,66" fill={colores.coral} />
    </motion.svg>
  );
}
