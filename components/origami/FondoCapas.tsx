"use client";

import { useEffect, useId, useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { atmosfera, colores, dropShadowCSS, mezclarHex, type DistanciaCapa } from "@/lib/config/tokens";

interface FondoCapasProps {
  className?: string;
}

/** Un pico triangular de papel: centro, semiancho, alto y si lleva cumbre nevada. */
interface Pico {
  cx: number;
  hw: number;
  alto: number;
  nieve?: boolean;
}

interface CapaDef {
  distancia: DistanciaCapa;
  /** Cara iluminada (hacia LUZ, superior-izquierda): crema/khaki claro. */
  luz: string;
  /** Cara en sombra (ladera derecha): oliva. */
  sombra: string;
  picos: Pico[];
  parallax: number;
}

// Geometría dentro del viewBox 0 0 400 200:
// - SUELO_Y: línea superior del prado verde (se dibuja DETRÁS de los cerros).
// - BASE_Y: base de los picos, por debajo de SUELO_Y, de modo que los cerros
//   quedan DELANTE del pasto y sus bases entran en el prado (como en la
//   referencia, donde las montañas se apoyan sobre el verde).
const SUELO_Y = 180;
const BASE_Y = 194;

// Grupo compacto y centrado de cerros de papel (≈45% del ancho, no de borde a
// borde), como el clúster central de la referencia: un pico protagonista alto
// con nieve, flanqueado por picos menores; detrás, un par de siluetas oliva.
const CAPAS: CapaDef[] = [
  {
    distancia: "lejana",
    luz: "#D9D9A9",
    sombra: "#A9A97B",
    picos: [
      { cx: 152, hw: 54, alto: 64 },
      { cx: 258, hw: 48, alto: 50 },
    ],
    parallax: 0,
  },
  {
    distancia: "media",
    luz: "#F0F0C0",
    sombra: "#C0C090",
    picos: [
      { cx: 198, hw: 62, alto: 112, nieve: true },
      { cx: 128, hw: 44, alto: 68, nieve: true },
    ],
    parallax: 26,
  },
  {
    distancia: "media",
    luz: "#EDEDBA",
    sombra: "#B9B98A",
    picos: [{ cx: 262, hw: 50, alto: 84, nieve: true }],
    parallax: 46,
  },
  {
    distancia: "cercana",
    luz: "#EAEAAF",
    sombra: "#ABAD7C",
    picos: [
      { cx: 164, hw: 40, alto: 52 },
      { cx: 238, hw: 34, alto: 42 },
    ],
    parallax: 66,
  },
];

/** El pliegue cae un poco a la derecha del vértice: la cara iluminada (izquierda)
 *  es más ancha que la ladera en sombra, como un doblez de papel bajo LUZ 45°. */
const FOLD = 0.14;

/**
 * Descompone un pico triangular en sus dos caras de papel (clara / sombra), la
 * arista del pliegue central y, si corresponde, una cumbre nevada de dos tonos.
 */
function construirPico(p: Pico, baseY: number) {
  const { cx, hw, alto } = p;
  const apexY = baseY - alto;
  const leftX = cx - hw;
  const rightX = cx + hw;
  const foldX = cx + hw * FOLD;

  const caraLuz = `M${cx},${apexY} L${leftX},${baseY} L${foldX},${baseY} Z`;
  const caraSombra = `M${cx},${apexY} L${foldX},${baseY} L${rightX},${baseY} Z`;
  const pliegue = { x1: cx, y1: apexY, x2: foldX, y2: baseY };

  let nieveLuz: string | undefined;
  let nieveSombra: string | undefined;
  if (p.nieve) {
    const sf = 0.3; // la nieve baja hasta el 30% de la altura del pico
    const snowY = apexY + alto * sf;
    const slX = cx - hw * sf;
    const srX = cx + hw * sf;
    const sFoldX = cx + hw * FOLD * sf;
    nieveLuz = `M${cx},${apexY} L${slX},${snowY} L${sFoldX},${snowY} Z`;
    nieveSombra = `M${cx},${apexY} L${sFoldX},${snowY} L${srX},${snowY} Z`;
  }

  return { caraLuz, caraSombra, pliegue, nieveLuz, nieveSombra };
}

// Arbolitos planos del prado, flanqueando la escena como en la referencia:
// copa triangular de dos pliegues sobre un tronco fino.
const ARBOLES = [
  { x: 24, alto: 30, ancho: 12, tono: "#4E8A63" },
  { x: 52, alto: 22, ancho: 9, tono: "#5A9670" },
  { x: 350, alto: 24, ancho: 10, tono: "#5A9670" },
  { x: 378, alto: 32, ancho: 13, tono: "#4E8A63" },
];

export function FondoCapas({ className = "" }: FondoCapasProps) {
  const ref = useRef<HTMLDivElement>(null);
  const creaseId = useId();
  const prefiereMenosMovimiento = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  // Llamadas explícitas (no en loop) para respetar rules-of-hooks: CAPAS tiene
  // longitud fija, así que el orden de hooks es siempre el mismo.
  const y0 = useTransform(scrollYProgress, [0, 1], prefiereMenosMovimiento ? [0, 0] : [0, CAPAS[0].parallax]);
  const y1 = useTransform(scrollYProgress, [0, 1], prefiereMenosMovimiento ? [0, 0] : [0, CAPAS[1].parallax]);
  const y2 = useTransform(scrollYProgress, [0, 1], prefiereMenosMovimiento ? [0, 0] : [0, CAPAS[2].parallax]);
  const y3 = useTransform(scrollYProgress, [0, 1], prefiereMenosMovimiento ? [0, 0] : [0, CAPAS[3].parallax]);
  const parallaxPorCapa = [y0, y1, y2, y3];

  // Parallax de mouse (C.12): desplazamiento diferencial ±12px máximo,
  // proporcional al parallax de scroll de cada capa (capas lejanas casi no
  // se mueven, cercanas sí). Suavizado con spring; desactivado en touch,
  // sin puntero fino, o con prefers-reduced-motion.
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

  return (
    <motion.div
      ref={ref}
      className={`absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
      style={{ "--mx": mouseXSuave, "--my": mouseYSuave } as React.CSSProperties}
    >
      {/* Gradiente de pliegue reutilizado: objectBoundingBox 0,0→1,1 hace que
          cada línea sea más clara en su extremo superior-izquierdo (hacia LUZ)
          y más oscura en el opuesto, sin importar su orientación individual. */}
      <svg width="0" height="0">
        <defs>
          <linearGradient id={creaseId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={colores.blancoPapel} />
            <stop offset="100%" stopColor={colores.tinta} />
          </linearGradient>
        </defs>
      </svg>

      {/* Prado: banda verde mar profundo, DETRÁS de los cerros (los cerros se
          apoyan sobre ella, como en la referencia). */}
      <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMax slice" className="absolute bottom-0 w-full">
        <rect x="0" y={SUELO_Y} width="400" height={200 - SUELO_Y} fill="#407058" />
        <rect x="0" y={SUELO_Y} width="400" height={2.5} fill="#4C7E63" />
      </svg>

      {CAPAS.map((capa, i) => {
        const atm = atmosfera[capa.distancia];
        // Perspectiva atmosférica: las capas lejanas se funden hacia el papel.
        const luz = mezclarHex(capa.luz, colores.papel, atm.mezclaPapel);
        const sombra = mezclarHex(capa.sombra, colores.papel, atm.mezclaPapel);
        const nieveLuz = mezclarHex("#F8F8F4", colores.papel, atm.mezclaPapel * 0.6);
        const nieveSombra = mezclarHex("#E2E2CE", colores.papel, atm.mezclaPapel * 0.6);
        // Offset máximo de parallax de mouse (±12px), proporcional al parallax
        // de scroll de la capa (0 en la más lejana → 12px en la más cercana).
        const mouseMax = (capa.parallax / 66) * 12;

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
              animate={prefiereMenosMovimiento ? undefined : { scale: [1, 1.006, 1] }}
              transition={
                prefiereMenosMovimiento
                  ? undefined
                  : { duration: 8 + i * 0.7, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }
              }
              viewBox="0 0 400 200"
              preserveAspectRatio="xMidYMax slice"
              className="absolute bottom-0 w-full"
            >
              {capa.picos.map((p, j) => {
                const { caraLuz, caraSombra, pliegue, nieveLuz: nL, nieveSombra: nS } = construirPico(p, BASE_Y);
                const apexY = BASE_Y - p.alto;
                const alturaTotal = BASE_Y - apexY + 2;
                const leftX = p.cx - p.hw;
                const rightX = p.cx + p.hw;
                const foldX = pliegue.x2;
                const delayBase = i * 0.55 + j * 0.22;
                const clipIdLuz = `${creaseId}-pico-${i}-${j}-luz`;
                const clipIdSombra = `${creaseId}-pico-${i}-${j}-sombra`;
                return (
                  <g key={j}>
                    {/* La línea de pliegue (bisagra) se ve desde el primer frame:
                        las dos caras se desdoblan a partir de ella, cada una por
                        su cuenta, creciendo verticalmente desde la cumbre hacia
                        la base — como dos hojas de papel abriéndose desde el eje. */}
                    <line
                      x1={pliegue.x1}
                      y1={pliegue.y1}
                      x2={pliegue.x2}
                      y2={pliegue.y2}
                      stroke={`url(#${creaseId})`}
                      strokeWidth={1}
                      opacity={0.22}
                    />
                    <g style={{ clipPath: `url(#${clipIdLuz})` }}>
                      <clipPath id={clipIdLuz}>
                        <motion.rect
                          x={leftX - 4}
                          y={apexY}
                          width={foldX - leftX + 4}
                          height={alturaTotal}
                          initial={prefiereMenosMovimiento ? undefined : { height: 0 }}
                          animate={prefiereMenosMovimiento ? undefined : { height: alturaTotal }}
                          transition={
                            prefiereMenosMovimiento
                              ? undefined
                              : { duration: 2.6, ease: "easeInOut", delay: delayBase }
                          }
                        />
                      </clipPath>
                      <path d={caraLuz} fill={luz} />
                      {nL && <path d={nL} fill={nieveLuz} />}
                    </g>
                    <g style={{ clipPath: `url(#${clipIdSombra})` }}>
                      <clipPath id={clipIdSombra}>
                        <motion.rect
                          x={foldX - 4}
                          y={apexY}
                          width={rightX - foldX + 8}
                          height={alturaTotal}
                          initial={prefiereMenosMovimiento ? undefined : { height: 0 }}
                          animate={prefiereMenosMovimiento ? undefined : { height: alturaTotal }}
                          transition={
                            prefiereMenosMovimiento
                              ? undefined
                              : { duration: 2.6, ease: "easeInOut", delay: delayBase + 0.25 }
                          }
                        />
                      </clipPath>
                      <path d={caraSombra} fill={sombra} />
                      {nS && <path d={nS} fill={nieveSombra} />}
                    </g>
                  </g>
                );
              })}
            </motion.svg>
          </div>
        );
      })}

      {/* Arbolitos de papel a los costados, delante de todo. */}
      <svg
        viewBox="0 0 400 200"
        preserveAspectRatio="xMidYMax slice"
        className="absolute bottom-0 w-full"
        style={{ filter: dropShadowCSS("cercana") }}
      >
        {ARBOLES.map((a, i) => {
          const apexY = SUELO_Y - a.alto;
          const baseTroncoY = SUELO_Y + 2;
          const alturaTotal = baseTroncoY - apexY;
          const delayBase = 2.3 + i * 0.22;
          const clipIdLuz = `${creaseId}-arbol-${i}-luz`;
          const clipIdSombra = `${creaseId}-arbol-${i}-sombra`;
          return (
            <g key={i}>
              <rect x={a.x - 1.2} y={SUELO_Y - 5} width={2.4} height={7} fill="#7A5A3C" />
              {/* Copa triangular de dos pliegues (papel): cada cara se desdobla
                  por su cuenta desde la cumbre, con un leve desfase entre
                  ellas, como dos hojas abriéndose desde el eje central. */}
              <g style={{ clipPath: `url(#${clipIdLuz})` }}>
                <clipPath id={clipIdLuz}>
                  <motion.rect
                    x={a.x - a.ancho - 2}
                    y={apexY}
                    width={a.ancho + 2}
                    height={alturaTotal}
                    initial={prefiereMenosMovimiento ? undefined : { height: 0 }}
                    animate={prefiereMenosMovimiento ? undefined : { height: alturaTotal }}
                    transition={
                      prefiereMenosMovimiento ? undefined : { duration: 2, ease: "easeInOut", delay: delayBase }
                    }
                  />
                </clipPath>
                <polygon points={`${a.x},${apexY} ${a.x - a.ancho},${SUELO_Y} ${a.x},${SUELO_Y}`} fill={a.tono} />
              </g>
              <g style={{ clipPath: `url(#${clipIdSombra})` }}>
                <clipPath id={clipIdSombra}>
                  <motion.rect
                    x={a.x}
                    y={apexY}
                    width={a.ancho + 2}
                    height={alturaTotal}
                    initial={prefiereMenosMovimiento ? undefined : { height: 0 }}
                    animate={prefiereMenosMovimiento ? undefined : { height: alturaTotal }}
                    transition={
                      prefiereMenosMovimiento
                        ? undefined
                        : { duration: 2, ease: "easeInOut", delay: delayBase + 0.2 }
                    }
                  />
                </clipPath>
                <polygon
                  points={`${a.x},${apexY} ${a.x},${SUELO_Y} ${a.x + a.ancho},${SUELO_Y}`}
                  fill={mezclarHex(a.tono, colores.tinta, 0.2)}
                />
              </g>
            </g>
          );
        })}
      </svg>
    </motion.div>
  );
}
