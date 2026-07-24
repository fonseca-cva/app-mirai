"use client";

import { motion, useReducedMotion } from "framer-motion";

interface GruaOrigamiProps {
  className?: string;
  animarEntrada?: boolean;
}

// Grulla origami — logo-símbolo. Caras planas en 2-3 tonos de tinta que
// simulan pliegues. Con animarEntrada=true, se "pliega" una vez al cargar (≤1.5s).
export function GruaOrigami({ className = "", animarEntrada = false }: GruaOrigamiProps) {
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

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Grulla de origami, símbolo de Mirai"
    >
      <motion.g {...cuerpo}>
        {/* cuerpo / cabeza */}
        <polygon points="50,20 62,45 50,60 38,45" fill="#2B2B33" />
        <polygon points="50,20 62,45 50,45" fill="#3F3F49" />
        <polygon points="62,45 78,15 68,40" fill="#2B2B33" />
      </motion.g>
      <motion.g {...alas} style={{ transformOrigin: "50px 48px" }}>
        {/* ala izquierda */}
        <polygon points="50,48 8,30 42,58" fill="#3F3F49" />
        <polygon points="50,48 42,58 20,55" fill="#2B2B33" />
      </motion.g>
      <motion.g {...alas} style={{ transformOrigin: "50px 48px" }}>
        {/* ala derecha */}
        <polygon points="50,48 92,30 58,58" fill="#3F3F49" />
        <polygon points="50,48 58,58 80,55" fill="#2B2B33" />
      </motion.g>
      {/* cola */}
      <polygon points="50,60 44,85 58,66" fill="#E86A4F" />
    </svg>
  );
}
