'use client';

import { motion } from 'framer-motion';
import { empleabilidadCarreras, empleabilidadFuente } from '@/lib/config/datos-graficos';
import { colores } from '@/lib/config/tokens';

// Barras planas estilo papel: cada una con un filo claro arriba (misma idea
// de "cara iluminada" que las montañas del sitio), altura proporcional al %.
const TONOS = [colores.coral, colores.dorado, colores.teal, colores.salvia, colores.tealProfundo];

const ALTO_MAX = 160; // px, para el 100%

export function GraficoEmpleabilidad() {
  return (
    <div className="mx-auto mt-16 max-w-3xl">
      <h3 className="text-center font-display text-xl font-semibold text-tinta sm:text-2xl">
        La empleabilidad varía muchísimo entre carreras
      </h3>

      <div className="mt-10 flex items-end justify-center gap-4 sm:gap-6" style={{ height: ALTO_MAX + 56 }}>
        {empleabilidadCarreras.map((c, i) => {
          const alto = (c.porcentaje / 100) * ALTO_MAX;
          return (
            <div key={c.carrera} className="flex flex-col items-center" style={{ width: 56 }}>
              <span className="mb-1 text-sm font-semibold text-tinta">{c.porcentaje}%</span>
              <motion.div
                className="w-full origin-bottom overflow-hidden rounded-t-[6px]"
                style={{ height: alto, backgroundColor: TONOS[i % TONOS.length] }}
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: 'easeOut' }}
              >
                {/* filo claro arriba, como cara iluminada de un pliegue */}
                <div className="h-2 w-full bg-white/35" />
              </motion.div>
              <span className="mt-2 text-center text-[11px] leading-tight text-tinta/70">{c.carrera}</span>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-xs uppercase tracking-wide text-tinta/45">{empleabilidadFuente}</p>
    </div>
  );
}
