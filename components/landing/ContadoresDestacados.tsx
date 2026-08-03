'use client';

import { motion } from 'framer-motion';
import { ContadorNumero } from '@/components/landing/ContadorNumero';
import { contadoresHome } from '@/lib/config/datos-graficos';

// Tres cifras destacadas, estilo papel: número grande que cuenta una sola
// vez al entrar en viewport, con su fuente siempre visible debajo.
export function ContadoresDestacados() {
  return (
    <div className="mx-auto grid max-w-4xl gap-10 sm:grid-cols-3 sm:gap-6">
      {contadoresHome.map((c, i) => (
        <motion.div
          key={c.texto}
          className="flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
        >
          <div className="relative">
            <span className="font-display text-5xl font-semibold text-coral sm:text-6xl">
              <ContadorNumero valor={c.valor} prefijo={c.prefijo} sufijo={c.sufijo} />
            </span>
          </div>
          <p className="mt-3 max-w-[220px] text-sm leading-snug text-tinta/80">{c.texto}</p>
          <p className="mt-2 text-xs uppercase tracking-wide text-tinta/45">{c.fuente}</p>
        </motion.div>
      ))}
    </div>
  );
}
