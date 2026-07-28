"use client";

import { motion, useReducedMotion } from "framer-motion";
import { PaperLayer } from "@/components/origami/PaperLayer";
import { GruaOrigami } from "@/components/origami/GruaOrigami";
import { comoFunciona, nombreSignificado } from "@/lib/config/textos";

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
    <section id="como-funciona" className="scroll-mt-20 bg-teal-medio px-4 py-24 sm:px-8">
      <div className="mb-8 flex items-center justify-center gap-2 text-sm text-blanco-papel/85">
        <GruaOrigami className="h-6 w-6" />
        <p className="font-display">{nombreSignificado.texto}</p>
      </div>
      <h2 className="mb-6 text-center text-2xl font-semibold uppercase tracking-[0.2em] text-blanco-papel sm:text-3xl">
        {comoFunciona.titulo}
      </h2>
      {/* Olas de papel (adorno de la referencia) */}
      <svg viewBox="0 0 60 8" className="mx-auto mb-12 h-2 w-16" aria-hidden="true">
        {[0, 22, 44].map((x) => (
          <path key={x} d={`M${x},8 Q${x + 8},-6 ${x + 16},8 Z`} fill="#FFFDF8" opacity={0.45} />
        ))}
      </svg>
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
