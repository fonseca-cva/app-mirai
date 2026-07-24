"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

interface FondoCapasProps {
  className?: string;
}

// Montañas de papel en capas, fondo del hero. Parallax sutil (máx. 40px de
// desplazamiento diferencial) con Framer Motion useScroll. Desactivado si
// prefers-reduced-motion está activo.
export function FondoCapas({ className = "" }: FondoCapasProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefiereMenosMovimiento = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const capaLejana = useTransform(scrollYProgress, [0, 1], prefiereMenosMovimiento ? [0, 0] : [0, 15]);
  const capaMedia = useTransform(scrollYProgress, [0, 1], prefiereMenosMovimiento ? [0, 0] : [0, 28]);
  const capaCercana = useTransform(scrollYProgress, [0, 1], prefiereMenosMovimiento ? [0, 0] : [0, 40]);

  return (
    <div ref={ref} className={`absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <motion.svg style={{ y: capaLejana }} viewBox="0 0 400 200" className="absolute bottom-0 w-full">
        <polygon points="0,200 0,110 90,60 180,120 260,70 400,130 400,200" fill="#E8E0D0" />
      </motion.svg>
      <motion.svg style={{ y: capaMedia }} viewBox="0 0 400 200" className="absolute bottom-0 w-full">
        <polygon points="0,200 0,140 70,90 160,150 240,100 400,160 400,200" fill="#DCD2BC" />
      </motion.svg>
      <motion.svg style={{ y: capaCercana }} viewBox="0 0 400 200" className="absolute bottom-0 w-full">
        <polygon points="0,200 0,165 100,120 200,175 320,130 400,170 400,200" fill="#F7F2E9" />
      </motion.svg>
    </div>
  );
}
