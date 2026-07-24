"use client";

import { motion, useReducedMotion } from "framer-motion";
import { GruaOrigami } from "@/components/origami/GruaOrigami";
import type { PuntajeDimension } from "@/lib/logic/puntaje";
import { lecturasPorDimension, resultadoParcial } from "@/lib/config/textos";

interface ResultadoParcialProps {
  top3: PuntajeDimension[];
}

export function ResultadoParcial({ top3 }: ResultadoParcialProps) {
  const prefiereMenosMovimiento = useReducedMotion();
  const top1 = top3[0];

  return (
    <section className="flex min-h-screen flex-col items-center gap-8 px-4 py-16 text-center sm:px-8">
      <motion.div
        initial={prefiereMenosMovimiento ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: prefiereMenosMovimiento ? 0.3 : 0.9, ease: "easeOut" }}
      >
        <GruaOrigami className="h-20 w-20" />
      </motion.div>

      <h1 className="font-display text-3xl font-semibold">{resultadoParcial.titulo}</h1>
      <p className="text-tinta/70">{resultadoParcial.subtitulo}</p>

      <div className="flex w-full max-w-md flex-col gap-4">
        {top3.map((dimension, i) => (
          <div key={dimension.dimension} className="text-left">
            <div className="mb-1 flex justify-between text-sm font-medium">
              <span>{dimension.etiqueta}</span>
              <span>{dimension.puntaje}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-papel-sombra">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${dimension.puntaje}%` }}
                transition={{ duration: prefiereMenosMovimiento ? 0.2 : 0.8, delay: prefiereMenosMovimiento ? 0 : i * 0.15 }}
                className="h-3 rounded-full bg-coral"
              />
            </div>
          </div>
        ))}
      </div>

      {top1 && <p className="max-w-md text-tinta/85">{lecturasPorDimension[top1.dimension]}</p>}

      <p className="max-w-md text-sm text-tinta/60">{resultadoParcial.cierre}</p>

      <a
        href={resultadoParcial.mailto}
        className="rounded-[14px] bg-coral px-6 py-3 text-base font-medium text-blanco-papel transition hover:opacity-90"
      >
        {resultadoParcial.cta}
      </a>
    </section>
  );
}
