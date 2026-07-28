'use client';

import { useEffect, useId, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { atmosfera, colores, dropShadowCSS, mezclarHex, type DistanciaCapa } from '@/lib/config/tokens';
import { NUBE_PATH } from '@/components/origami/FondoCapas';

interface Pico {
  cx: number;
  hw: number;
  alto: number;
  nieve?: boolean;
  dy?: number;
}

interface CapaDef {
  distancia: DistanciaCapa;
  luz: string;
  sombra: string;
  picos: Pico[];
}

// Composición propia para esta página: sin cerros del frente (cercana),
// pasto más alto, cerros y árboles subidos, menos cielo visible.
const SUELO_Y = 90;
const BASE_Y = 104;
const PLIEGUE_BAJO = 12;

const CAPAS: CapaDef[] = [
  {
    distancia: 'media',
    luz: '#F0F0C0',
    sombra: '#C0C090',
    picos: [
      { cx: 198, hw: 58, alto: 78, nieve: true },
      { cx: 130, hw: 42, alto: 58, nieve: true, dy: 11 },
    ],
  },
  {
    distancia: 'media',
    luz: '#EDEDBA',
    sombra: '#B9B98A',
    picos: [{ cx: 264, hw: 45, alto: 69, nieve: true, dy: 11 }],
  },
];

const ARBOLES = [
  { x: 100, alto: 27, ancho: 12, tono: '#5DA878', dy: 26 },
  { x: 300, alto: 29, ancho: 13, tono: '#5DA878', dy: 26 },
];

function construirPico(p: Pico, baseY: number) {
  const { cx, hw, alto } = p;
  const apexY = baseY - alto;
  const leftX = cx - hw;
  const rightX = cx + hw;
  const quillaY = baseY + PLIEGUE_BAJO;

  const caraLuz = `M${cx},${apexY} L${leftX},${baseY} L${cx},${quillaY} Z`;
  const caraSombra = `M${cx},${apexY} L${cx},${quillaY} L${rightX},${baseY} Z`;

  let nieveLuz: string | undefined;
  let nieveSombra: string | undefined;
  if (p.nieve) {
    const sf = 0.3;
    const snowY = apexY + alto * sf;
    nieveLuz = `M${cx},${apexY} L${cx - hw * sf},${snowY} L${cx},${snowY} Z`;
    nieveSombra = `M${cx},${apexY} L${cx},${snowY} L${cx + hw * sf},${snowY} Z`;
  }

  return { caraLuz, caraSombra, creaseX: cx, apexY, quillaY, nieveLuz, nieveSombra };
}

const DESDOBLA = { duration: 0.85, ease: [0.34, 1.12, 0.64, 1] as const };

export function MetodologiaHero() {
  const ref = useRef<HTMLDivElement>(null);
  const creaseId = useId();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const mouseXSuave = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const mouseYSuave = useSpring(mouseY, { stiffness: 50, damping: 20 });

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const manejar = (e: PointerEvent) => {
      mouseX.set((e.clientX / window.innerWidth) * 2 - 1);
      mouseY.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', manejar);
    return () => window.removeEventListener('pointermove', manejar);
  }, [mouseX, mouseY]);

  const cara = (lado: 'right' | 'left', delay: number) => ({
    style: { originX: lado === 'right' ? 1 : 0, originY: 0.5 },
    initial: { scaleX: 0 },
    animate: { scaleX: 1 },
    transition: { ...DESDOBLA, delay },
  });

  return (
    <div
      ref={ref}
      className="relative w-screen overflow-hidden bg-papel h-[600px] sm:h-[700px]"
      style={{ marginLeft: 'calc(-50vw + 50%)' }}
    >
      <svg width="0" height="0">
        <defs>
          <linearGradient id={creaseId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={colores.blancoPapel} />
            <stop offset="100%" stopColor={colores.tinta} />
          </linearGradient>
        </defs>
      </svg>

      <svg viewBox="0 -5 400 195" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
        {/* Cielo */}
        <defs>
          <linearGradient id="metHeroSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F7F2E9" />
            <stop offset="100%" stopColor="#E8E0D0" />
          </linearGradient>
        </defs>
        <rect x="0" y="-5" width="400" height="200" fill="url(#metHeroSky)" />

        {/* Nube */}
        <g style={{ transform: `translate(${20}px, ${5}px)` }}>
          <path d={NUBE_PATH} fill="#FFFFFF" transform="translate(280, 0) scale(0.7)" opacity={0.9} />
        </g>

        {/* Prado — alargado hacia arriba */}
        <rect x="0" y={SUELO_Y} width="400" height={195 - SUELO_Y} fill="#6BB889" />
        <rect x="0" y={SUELO_Y} width="400" height={2.5} fill="#7DC89B" />

        {/* Cerros (sin capa "cercana" de frente) */}
        {CAPAS.map((capa, i) => {
          const atm = atmosfera[capa.distancia];
          const luz = mezclarHex(capa.luz, colores.papel, atm.mezclaPapel);
          const sombra = mezclarHex(capa.sombra, colores.papel, atm.mezclaPapel);
          const nieveLuz = mezclarHex('#F8F8F4', colores.papel, atm.mezclaPapel * 0.6);
          const nieveSombra = mezclarHex('#E2E2CE', colores.papel, atm.mezclaPapel * 0.6);
          const mouseMax = 4 + i * 2;

          return (
            <motion.g
              key={i}
              style={{
                transform: useTransform(mouseXSuave, [-1, 1], [-mouseMax, mouseMax]) as any,
                filter: `saturate(${atm.saturacion}) ${dropShadowCSS(capa.distancia)}`,
              }}
            >
              {capa.picos.map((p, j) => {
                const { caraLuz, caraSombra, creaseX, apexY, quillaY, nieveLuz: nL, nieveSombra: nS } = construirPico(p, BASE_Y + (p.dy ?? 0));
                const delay = i * 0.16 + j * 0.12;
                return (
                  <g key={j}>
                    <line x1={creaseX} y1={apexY} x2={creaseX} y2={quillaY} stroke={`url(#${creaseId})`} strokeWidth={1} opacity={0.25} />
                    <motion.g {...cara('right', delay)}>
                      <path d={caraLuz} fill={luz} />
                      {nL && <path d={nL} fill={nieveLuz} />}
                    </motion.g>
                    <motion.g {...cara('left', delay + 0.1)}>
                      <path d={caraSombra} fill={sombra} />
                      {nS && <path d={nS} fill={nieveSombra} />}
                    </motion.g>
                  </g>
                );
              })}
            </motion.g>
          );
        })}

        {/* Árboles — subidos, sobre el borde del prado */}
        <motion.g
          style={{
            transform: useTransform(mouseXSuave, [-1, 1], [-10, 10]) as any,
            filter: dropShadowCSS('cercana'),
          }}
        >
          {ARBOLES.map((a, i) => {
            const base = SUELO_Y + a.dy;
            const apexY = base - a.alto;
            const delay = 0.9 + i * 0.14;
            return (
              <g key={i}>
                <motion.rect
                  x={a.x - 2}
                  y={base - 2}
                  width={4}
                  height={14}
                  fill="#7A5A3C"
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 1 }}
                  style={{ originX: 0.5, originY: 0 }}
                  transition={{ duration: 0.5, delay: delay + DESDOBLA.duration + 0.15, ease: 'easeOut' }}
                />
                <motion.g {...cara('right', delay)}>
                  <polygon points={`${a.x},${apexY} ${a.x - a.ancho},${base} ${a.x},${base}`} fill={a.tono} />
                </motion.g>
                <motion.g {...cara('left', delay + 0.1)}>
                  <polygon points={`${a.x},${apexY} ${a.x},${base} ${a.x + a.ancho},${base}`} fill={mezclarHex(a.tono, colores.tinta, 0.2)} />
                </motion.g>
              </g>
            );
          })}
        </motion.g>
      </svg>

      {/* Contenido centrado — anclado cerca del final del verde */}
      <div className="absolute inset-x-0 bottom-24 sm:bottom-32 z-10 mx-auto max-w-2xl px-4 text-center sm:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h2 className="font-display text-3xl font-semibold text-blanco-papel sm:text-5xl">Cómo medimos</h2>
          <p className="mt-3 text-base text-blanco-papel/90 sm:text-lg">Una metodología rigurosa basada en tres pilares</p>
        </motion.div>
      </div>
    </div>
  );
}
