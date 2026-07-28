'use client';

import { motion } from 'framer-motion';

interface SeccionVisualProps {
  id?: string;
  titulo: string;
  bajada?: string;
  children: React.ReactNode;
  colorFondo?: 'papel' | 'teal' | 'salvia' | 'dorado' | 'coral';
  esclarecer?: boolean;
}

const coloresMap = {
  papel: 'bg-papel',
  teal: 'bg-teal/10',
  salvia: 'bg-salvia/10',
  dorado: 'bg-dorado/10',
  coral: 'bg-coral/10',
};

export function SeccionVisual({
  id,
  titulo,
  bajada,
  children,
  colorFondo = 'papel',
  esclarecer = false,
}: SeccionVisualProps) {
  return (
    <motion.section
      id={id}
      className={`scroll-mt-24 rounded-2xl p-8 sm:p-12 ${coloresMap[colorFondo]}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.5 }}
    >
      <div className="mx-auto max-w-2xl">
        <motion.h2
          className={`font-display text-2xl font-semibold ${esclarecer ? 'text-tinta' : 'text-tinta'}`}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {titulo}
        </motion.h2>

        {bajada && (
          <motion.p
            className="mt-3 text-lg font-medium text-tinta/80"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            {bajada}
          </motion.p>
        )}

        <motion.div
          className="mt-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {children}
        </motion.div>
      </div>
    </motion.section>
  );
}
