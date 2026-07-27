"use client";

import { useEffect, useId, useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { atmosfera, colores, dropShadowCSS, mezclarHex, type DistanciaCapa } from "@/lib/config/tokens";

interface FondoCapasProps {
  className?: string;
}

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
  parallax: number;
}

// Horizonte elevado: el prado empieza mucho más arriba, las montañas son ~2×
// más altas. BASE_Y > SUELO_Y para que las bases de los cerros entren en el
// prado (montañas por delante del pasto, como en la referencia).
const SUELO_Y = 120;
const BASE_Y = 140;

// Las capas traseras son las más ALTAS (peaks at y < 40). Las delanteras son
// las más CORTAS (peaks at y > 60). Así, al scroll=0 las de atrás siempre
// están visualmente por encima de las del frente.
const CAPAS: CapaDef[] = [
  {
    distancia: "lejana",
    luz: "#D9D9A9",
    sombra: "#A9A97B",
    picos: [
      { cx: 152, hw: 70, alto: 100 },
      { cx: 258, hw: 62, alto: 82 },
    ],
    parallax: 0,
  },
  {
    distancia: "media",
    luz: "#F0F0C0",
    sombra: "#C0C090",
    picos: [
      { cx: 198, hw: 80, alto: 155, nieve: true },
      { cx: 128, hw: 56, alto: 105, nieve: true },
    ],
    parallax: 18,
  },
  {
    distancia: "media",
    luz: "#EDEDBA",
    sombra: "#B9B98A",
    picos: [{ cx: 262, hw: 64, alto: 130, nieve: true }],
    parallax: 32,
  },
  {
    distancia: "cercana",
    luz: "#EAEAAF",
    sombra: "#ABAD7C",
    picos: [
      { cx: 164, hw: 52, alto: 80 },
      { cx: 238, hw: 44, alto: 65, dy: 8 },
    ],
    parallax: 46,
  },
];

// El pliegue baja más allá de la base de la montaña, creando una quilla que
// da perspectiva isométrica (como en la parte baja de los cerros de la ref).
const PLIEGUE_BAJO = 14;

function construirPico(p: Pico, baseY: number) {
  const { cx, hw, alto } = p;
  const apexY = baseY - alto;
  const leftX = cx - hw;
  const rightX = cx + hw;
  const quillaY = baseY + PLIEGUE_BAJO;

  // Cada cara es un triángulo: cumbre → esquina lateral (a la altura de base)
  // → vértice inferior del pliegue (quillaY, por debajo de la base).
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

const ARBOLES_ATRAS = [
  { x: 55, alto: 48, ancho: 20, tono: "#5DA878", dy: 0 },
  { x: 348, alto: 52, ancho: 22, tono: "#5DA878", dy: 0 },
];

const ARBOLES_FRENTE = [
  { x: 95, alto: 36, ancho: 15, tono: "#68B282", dy: 38 },
  { x: 305, alto: 38, ancho: 16, tono: "#68B282", dy: 38 },
];

const NUBES_ATRAS = [
  { top: "32%", ancho: 110, dur: 13, delay: 0 },
  { top: "20%", ancho: 80, dur: 54, delay: 8 },
];

const NUBES_FRENTE = [
  { top: "22%", ancho: 70, dur: 36, delay: 12 },
];

// La nube más rápida se renderiza en Hero.tsx con z-index sobre los textos.
export const NUBE_RAPIDA = { top: "43%", ancho: 100, dur: 9, delay: 3 };

export const NUBE_PATH =
  "M10 40 Q15 20 35 18 Q45 5 65 10 Q80 5 95 15 Q110 18 110 35 Q110 45 100 45 L15 45 Q5 45 10 40Z";

const DESDOBLA = { duration: 0.85, ease: [0.34, 1.12, 0.64, 1] as const };

export function FondoCapas({ className = "" }: FondoCapasProps) {
  const ref = useRef<HTMLDivElement>(null);
  const creaseId = useId();
  const prefiereMenosMovimiento = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const y0 = useTransform(scrollYProgress, [0, 1], prefiereMenosMovimiento ? [0, 0] : [0, CAPAS[0].parallax]);
  const y1 = useTransform(scrollYProgress, [0, 1], prefiereMenosMovimiento ? [0, 0] : [0, CAPAS[1].parallax]);
  const y2 = useTransform(scrollYProgress, [0, 1], prefiereMenosMovimiento ? [0, 0] : [0, CAPAS[2].parallax]);
  const y3 = useTransform(scrollYProgress, [0, 1], prefiereMenosMovimiento ? [0, 0] : [0, CAPAS[3].parallax]);
  const parallaxPorCapa = [y0, y1, y2, y3];

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const mouseXSuave = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const mouseYSuave = useSpring(mouseY, { stiffness: 50, damping: 20 });

  useEffect(() => {
    if (prefiereMenosMovimiento) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const manejarMovimiento = (e: PointerEvent) => {
      mouseX.set((e.clientX / window.innerWidth) * 2 - 1);
      mouseY.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", manejarMovimiento);
    return () => window.removeEventListener("pointermove", manejarMovimiento);
  }, [prefiereMenosMovimiento, mouseX, mouseY]);

  const cara = (lado: "right" | "left", delay: number) => ({
    style: { originX: lado === "right" ? 1 : 0, originY: 0.5 },
    initial: prefiereMenosMovimiento ? false : { scaleX: 0 },
    animate: { scaleX: 1 },
    transition: prefiereMenosMovimiento ? undefined : { ...DESDOBLA, delay },
  });

  const renderNubes = (nubes: typeof NUBES_ATRAS) =>
    nubes.map((n, i) => (
      <svg
        key={i}
        viewBox="0 0 120 60"
        className="pointer-events-none absolute left-0"
        style={{
          top: n.top,
          width: n.ancho,
          height: n.ancho * 0.5,
          animation: prefiereMenosMovimiento
            ? undefined
            : `nube-deriva ${n.dur}s linear ${n.delay}s infinite`,
        }}
        fill="none"
      >
        <path d={NUBE_PATH} fill="#FFFFFF" />
      </svg>
    ));

  return (
    <motion.div
      ref={ref}
      className={`absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
      style={{ "--mx": mouseXSuave, "--my": mouseYSuave } as React.CSSProperties}
    >
      <svg width="0" height="0">
        <defs>
          <linearGradient id={creaseId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={colores.blancoPapel} />
            <stop offset="100%" stopColor={colores.tinta} />
          </linearGradient>
        </defs>
      </svg>

      {/* Prado verde claro */}
      <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMax slice" className="absolute bottom-0 w-full">
        <rect x="0" y={SUELO_Y} width="400" height={200 - SUELO_Y} fill="#6BB889" />
        <rect x="0" y={SUELO_Y} width="400" height={2.5} fill="#7DC89B" />
      </svg>

      {/* Nubes detrás de los cerros */}
      <div className="pointer-events-none absolute inset-0">{renderNubes(NUBES_ATRAS)}</div>

      {CAPAS.map((capa, i) => {
        const atm = atmosfera[capa.distancia];
        const luz = mezclarHex(capa.luz, colores.papel, atm.mezclaPapel);
        const sombra = mezclarHex(capa.sombra, colores.papel, atm.mezclaPapel);
        const nieveLuz = mezclarHex("#F8F8F4", colores.papel, atm.mezclaPapel * 0.6);
        const nieveSombra = mezclarHex("#E2E2CE", colores.papel, atm.mezclaPapel * 0.6);
        const mouseMax = (capa.parallax / 46) * 12;

        return (
          <div
            key={i}
            className="absolute inset-0"
            style={{ transform: `translate(calc(var(--mx) * ${mouseMax}px), calc(var(--my) * ${mouseMax}px))` }}
          >
            <motion.svg
              style={{
                y: parallaxPorCapa[i],
                transformOrigin: "50% 100%",
                filter: `saturate(${atm.saturacion}) ${dropShadowCSS(capa.distancia)}`,
              }}
              viewBox="0 -30 400 230"
              preserveAspectRatio="xMidYMax slice"
              className="absolute bottom-0 w-full"
            >
              {capa.picos.map((p, j) => {
                const picoBaseY = (capa.distancia === "cercana" ? BASE_Y + 16 : BASE_Y) + (p.dy ?? 0);
                const { caraLuz, caraSombra, creaseX, apexY, quillaY, nieveLuz: nL, nieveSombra: nS } = construirPico(p, picoBaseY);
                const delay = i * 0.16 + j * 0.12;
                return (
                  <g key={j}>
                    <line
                      x1={creaseX}
                      y1={apexY}
                      x2={creaseX}
                      y2={quillaY}
                      stroke={`url(#${creaseId})`}
                      strokeWidth={1}
                      opacity={0.25}
                    />
                    <motion.g {...cara("right", delay)}>
                      <path d={caraLuz} fill={luz} />
                      {nL && <path d={nL} fill={nieveLuz} />}
                    </motion.g>
                    <motion.g {...cara("left", delay + 0.1)}>
                      <path d={caraSombra} fill={sombra} />
                      {nS && <path d={nS} fill={nieveSombra} />}
                    </motion.g>
                  </g>
                );
              })}
            </motion.svg>
          </div>
        );
      })}

      {/* Nubes delante de los cerros */}
      <div className="pointer-events-none absolute inset-0">{renderNubes(NUBES_FRENTE)}</div>

      {/* Árboles de atrás (sobre los cerros): menos mouse parallax → perspectiva */}
      <div
        className="absolute inset-0"
        style={{ transform: `translate(calc(var(--mx) * 4px), calc(var(--my) * 4px))` }}
      >
      <svg
        viewBox="0 0 400 200"
        preserveAspectRatio="xMidYMax slice"
        className="absolute bottom-0 w-full"
        style={{ filter: dropShadowCSS("media") }}
      >
        {ARBOLES_ATRAS.map((a, i) => {
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
                initial={prefiereMenosMovimiento ? false : { scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                style={{ originX: 0.5, originY: 0 }}
                transition={
                  prefiereMenosMovimiento ? undefined : { duration: 0.5, delay: delay + DESDOBLA.duration + 0.15, ease: "easeOut" }
                }
              />
              <motion.g {...cara("right", delay)}>
                <polygon points={`${a.x},${apexY} ${a.x - a.ancho},${base} ${a.x},${base}`} fill={a.tono} />
              </motion.g>
              <motion.g {...cara("left", delay + 0.1)}>
                <polygon
                  points={`${a.x},${apexY} ${a.x},${base} ${a.x + a.ancho},${base}`}
                  fill={mezclarHex(a.tono, colores.tinta, 0.2)}
                />
              </motion.g>
            </g>
          );
        })}
      </svg>
      </div>

      {/* Árboles del frente: mouse parallax completo */}
      <div
        className="absolute inset-0"
        style={{ transform: `translate(calc(var(--mx) * 12px), calc(var(--my) * 12px))` }}
      >
      <svg
        viewBox="0 0 400 200"
        preserveAspectRatio="xMidYMax slice"
        className="absolute bottom-0 w-full"
        style={{ filter: dropShadowCSS("cercana") }}
      >
        {ARBOLES_FRENTE.map((a, i) => {
          const base = SUELO_Y + a.dy;
          const apexY = base - a.alto;
          const delay = 1.2 + i * 0.14;
          return (
            <g key={i}>
              <motion.rect
                x={a.x - 2}
                y={base - 2}
                width={4}
                height={14}
                fill="#7A5A3C"
                initial={prefiereMenosMovimiento ? false : { scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                style={{ originX: 0.5, originY: 0 }}
                transition={
                  prefiereMenosMovimiento ? undefined : { duration: 0.5, delay: delay + DESDOBLA.duration + 0.15, ease: "easeOut" }
                }
              />
              <motion.g {...cara("right", delay)}>
                <polygon points={`${a.x},${apexY} ${a.x - a.ancho},${base} ${a.x},${base}`} fill={a.tono} />
              </motion.g>
              <motion.g {...cara("left", delay + 0.1)}>
                <polygon
                  points={`${a.x},${apexY} ${a.x},${base} ${a.x + a.ancho},${base}`}
                  fill={mezclarHex(a.tono, colores.tinta, 0.2)}
                />
              </motion.g>
            </g>
          );
        })}
      </svg>
      </div>

      <style>{`
        @keyframes nube-deriva {
          from { transform: translateX(-200px); }
          to { transform: translateX(100vw); }
        }
      `}</style>
    </motion.div>
  );
}
