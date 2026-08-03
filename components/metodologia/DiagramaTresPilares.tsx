'use client';

import { motion } from 'framer-motion';

// Diagrama conceptual: los tres pliegues (intereses, capacidades, mercado)
// confluyen en un cuarto pliegue mayor, el informe. Sin cifras — es
// puramente visual, en el mismo lenguaje de pliegues (cara clara / cara
// sombra) que usan las montañas y el logo del sitio. El informe usa el
// mismo tratamiento de pliegue que los tres insumos, solo que más grande
// y en tono neutro (tinta), para mantener consistencia visual.

interface PliegueMini {
  cx: number;
  label: string;
  colorClase: string;
}

const PLIEGUES: PliegueMini[] = [
  { cx: 90, label: 'Intereses', colorClase: 'text-coral' },
  { cx: 200, label: 'Capacidades', colorClase: 'text-salvia' },
  { cx: 310, label: 'Mercado', colorClase: 'text-dorado' },
];

const CY = 40;
const ALTO = 22;
const HW = 18;
const LINEA_INICIO_Y = CY + ALTO + 26; // deja espacio libre bajo la etiqueta

const INFORME_CX = 200;
const INFORME_CY = 172;
const INFORME_ALTO = 32;
const INFORME_HW = 26;
const INFORME_APEX_Y = INFORME_CY - INFORME_ALTO;

function Pliegue({
  cx,
  cy,
  alto,
  hw,
  colorClase,
}: {
  cx: number;
  cy: number;
  alto: number;
  hw: number;
  colorClase: string;
}) {
  const apexY = cy - alto;
  const baseY = cy + alto;
  return (
    <>
      <polygon points={`${cx - hw},${baseY} ${cx},${apexY} ${cx},${baseY}`} className={colorClase} fill="currentColor" opacity={0.35} />
      <polygon points={`${cx},${apexY} ${cx + hw},${baseY} ${cx},${baseY}`} className={colorClase} fill="currentColor" opacity={0.65} />
      <line x1={cx} y1={apexY} x2={cx} y2={baseY} className={colorClase} stroke="currentColor" strokeWidth={1} opacity={0.8} />
    </>
  );
}

export function DiagramaTresPilares() {
  return (
    <motion.div
      className="mx-auto my-4 max-w-md"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6 }}
    >
      <svg viewBox="0 0 400 250" className="w-full" aria-hidden="true">
        {/* Líneas de confluencia — parten bajo las etiquetas, nunca sobre el texto */}
        {PLIEGUES.map((p) => (
          <line
            key={`linea-${p.cx}`}
            x1={p.cx}
            y1={LINEA_INICIO_Y}
            x2={INFORME_CX}
            y2={INFORME_APEX_Y}
            className="text-tinta/25"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeDasharray="3 4"
          />
        ))}

        {/* Tres pliegues de entrada */}
        {PLIEGUES.map((p, i) => (
          <motion.g
            key={p.label}
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.12 }}
          >
            <Pliegue cx={p.cx} cy={CY} alto={ALTO} hw={HW} colorClase={p.colorClase} />
            <text
              x={p.cx}
              y={CY + ALTO + 20}
              textAnchor="middle"
              className={`${p.colorClase} font-sans`}
              fill="currentColor"
              fontSize={12}
              fontWeight={600}
            >
              {p.label}
            </text>
          </motion.g>
        ))}

        {/* Pliegue mayor: el informe, mismo lenguaje visual, tono neutro */}
        <motion.g
          initial={{ opacity: 0, scale: 0.85 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          style={{ transformOrigin: `${INFORME_CX}px ${INFORME_CY}px` }}
        >
          <Pliegue cx={INFORME_CX} cy={INFORME_CY} alto={INFORME_ALTO} hw={INFORME_HW} colorClase="text-tinta" />
        </motion.g>

        <text
          x={INFORME_CX}
          y={INFORME_CY + INFORME_ALTO + 24}
          textAnchor="middle"
          className="text-tinta"
          fill="currentColor"
          fontSize={13}
          fontWeight={700}
        >
          Tu informe
        </text>
      </svg>
    </motion.div>
  );
}
