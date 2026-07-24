"use client";

import { motion, useReducedMotion } from "framer-motion";
import { PaperLayer } from "@/components/origami/PaperLayer";
import { comoFunciona } from "@/lib/config/textos";

const ICONOS = [
  // Juega
  <polygon key="juega" points="30,30 70,30 70,70 30,70" fill="#D9A441" />,
  // Reacciona
  <polygon key="reacciona" points="20,25 80,25 80,60 45,60 30,75 30,60 20,60" fill="#E86A4F" />,
  // Descubre
  <polygon key="descubre" points="35,20 75,50 45,80 20,55" fill="#7FA08C" />,
];

export function ComoFunciona() {
  const prefiereMenosMovimiento = useReducedMotion();

  return (
    <section id="como-funciona" className="px-4 py-24 sm:px-8">
      <h2 className="mb-12 text-center text-3xl font-semibold">{comoFunciona.titulo}</h2>
      <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">
        {comoFunciona.tarjetas.map((tarjeta, i) => (
          <motion.div
            key={tarjeta.titulo}
            initial={prefiereMenosMovimiento ? { opacity: 0 } : { opacity: 0, rotateX: -40, y: 24 }}
            whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            style={{ transformPerspective: 800 }}
          >
            <PaperLayer className="flex h-full flex-col items-center gap-4 p-6 text-center">
              <svg viewBox="0 0 100 100" className="h-14 w-14" aria-hidden="true">
                {ICONOS[i]}
              </svg>
              <h3 className="text-xl font-semibold">{tarjeta.titulo}</h3>
              <p className="text-tinta/80">{tarjeta.texto}</p>
            </PaperLayer>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
