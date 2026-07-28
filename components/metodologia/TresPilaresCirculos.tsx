'use client';

import { motion } from 'framer-motion';

interface Pilar {
  label: string;
  color: string;
  icon: React.ReactNode;
  descripcion: string;
}

const pilares: Pilar[] = [
  {
    label: 'Intereses',
    color: 'text-coral',
    descripcion: 'Estímulos audiovisuales que revelan tus preferencias auténticas',
    icon: (
      <svg viewBox="0 0 100 100" className="h-16 w-16" fill="none">
        <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="3" />
        <path
          d="M 50 20 Q 65 30 65 45 Q 65 60 50 60 Q 35 60 35 45 Q 35 30 50 20"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
        />
        <circle cx="45" cy="45" r="3" fill="currentColor" />
        <circle cx="55" cy="45" r="3" fill="currentColor" />
        <path d="M 45 55 Q 50 58 55 55" stroke="currentColor" strokeWidth="2.5" fill="none" />
      </svg>
    ),
  },
  {
    label: 'Capacidades',
    color: 'text-salvia',
    descripcion: 'Tareas validadas por psicología cognitiva que miden habilidades reales',
    icon: (
      <svg viewBox="0 0 100 100" className="h-16 w-16" fill="none">
        <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="3" />
        <rect x="30" y="35" width="40" height="30" rx="2" stroke="currentColor" strokeWidth="2.5" fill="none" />
        <line x1="35" y1="45" x2="65" y2="45" stroke="currentColor" strokeWidth="2" />
        <line x1="35" y1="55" x2="65" y2="55" stroke="currentColor" strokeWidth="2" />
        <circle cx="73" cy="50" r="4" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: 'Mercado',
    color: 'text-dorado',
    descripcion: 'Datos oficiales de empleabilidad y demanda del Mineduc',
    icon: (
      <svg viewBox="0 0 100 100" className="h-16 w-16" fill="none">
        <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="3" />
        <path
          d="M 30 65 L 35 55 L 40 60 L 50 40 L 60 50 L 70 35 L 75 65"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line x1="30" y1="65" x2="70" y2="65" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
];

export function TresPilaresCirculos() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' as any },
    },
  };

  return (
    <motion.div
      className="my-12 grid gap-8 sm:grid-cols-3 lg:gap-6"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
    >
      {pilares.map((pilar, i) => (
        <motion.div
          key={pilar.label}
          variants={itemVariants}
          className="flex flex-col items-center text-center"
        >
          {/* Círculo con fondo */}
          <div className={`relative mb-4 flex h-40 w-40 items-center justify-center rounded-full bg-blanco-papel shadow-sm ring-1 ring-tinta/10 ${pilar.color}`}>
            {/* Icono */}
            <div className="text-current">{pilar.icon}</div>

            {/* Número de pilar al costado */}
            <div className={`absolute -right-4 -top-4 flex h-10 w-10 items-center justify-center rounded-full ${pilar.color} bg-papel text-sm font-semibold`}>
              {i + 1}
            </div>
          </div>

          {/* Etiqueta */}
          <h3 className={`text-lg font-semibold ${pilar.color}`}>{pilar.label}</h3>

          {/* Descripción */}
          <p className="mt-2 text-sm leading-relaxed text-tinta/70">{pilar.descripcion}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
