"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

interface FoldTransitionProps {
  llave: string | number;
  children: ReactNode;
  className?: string;
}

// Transición de "pliegue de papel" entre tarjetas, 400ms. Con
// prefers-reduced-motion, se reduce a un fade simple.
export function FoldTransition({ llave, children, className = "" }: FoldTransitionProps) {
  const prefiereMenosMovimiento = useReducedMotion();

  const variantes = prefiereMenosMovimiento
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, rotateX: -90, y: 12 },
        animate: { opacity: 1, rotateX: 0, y: 0 },
        exit: { opacity: 0, rotateX: 90, y: -12 },
      };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={llave}
        initial={variantes.initial}
        animate={variantes.animate}
        exit={variantes.exit}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        style={{ transformPerspective: 800 }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
