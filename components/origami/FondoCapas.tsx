"use client";

import { useEffect, useId, useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ajustarLuminosidad, atmosfera, colores, dropShadowCSS, type DistanciaCapa } from "@/lib/config/tokens";

interface FondoCapasProps {
  className?: string;
}

type Punto = [number, number];

interface CapaDef {
  distancia: DistanciaCapa;
  colorBase: string;
  cresta: Punto[];
  parallax: number;
  ocultarMobile?: boolean;
}

const BASE_Y = 200;

// Cordillera de papel en 6 capas (4 en mobile, ver `ocultarMobile`), de más lejana
// a más cercana. Fase 1 — secciones A y B: cada capa respeta LUZ (drop-shadow +
// facetas de 3 tonos según pendiente) y la perspectiva atmosférica de `tokens.ts`.
const CAPAS: CapaDef[] = [
  {
    distancia: "lejana",
    colorBase: "#D8CDB8",
    cresta: [[0, 120], [70, 85], [150, 110], [230, 80], [320, 105], [400, 90]],
    parallax: 0,
  },
  {
    distancia: "lejana",
    colorBase: "#C9BCA0",
    cresta: [[0, 145], [90, 105], [190, 135], [270, 100], [400, 120]],
    parallax: 18,
    ocultarMobile: true,
  },
  {
    distancia: "media",
    colorBase: "#93A88F",
    cresta: [[0, 158], [110, 132], [230, 152], [340, 128], [400, 142]],
    parallax: 36,
  },
  {
    distancia: "media",
    colorBase: "#7FA08C",
    cresta: [[0, 172], [130, 148], [260, 168], [400, 152]],
    parallax: 54,
    ocultarMobile: true,
  },
  {
    distancia: "cercana",
    colorBase: "#4F5F45",
    cresta: [
      [0, 182], [30, 160], [55, 178], [85, 155], [115, 180], [150, 158],
      [185, 182], [220, 160], [255, 180], [290, 155], [325, 178], [360, 160], [400, 178],
    ],
    parallax: 72,
  },
  {
    distancia: "cercana",
    colorBase: "#33402E",
    cresta: [[0, 196], [60, 178], [140, 192], [230, 175], [320, 190], [400, 184]],
    parallax: 90,
  },
];

/** Mezcla dos colores hex por una razón t (0 = hexA puro, 1 = hexB puro). */
function mezclarHex(hexA: string, hexB: string, t: number): string {
  const parse = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [ar, ag, ab] = parse(hexA);
  const [br, bg, bb] = parse(hexB);
  const mezclar = (a: number, b: number) => Math.round(a + (b - a) * t);
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${toHex(mezclar(ar, br))}${toHex(mezclar(ag, bg))}${toHex(mezclar(ab, bb))}`;
}

/**
 * Convierte la silueta de una cresta en facetas trapezoidales (A.3): cada
 * tramo ascendente (mirando hacia LUZ) queda "claro", cada tramo descendente
 * queda "oscuro", y los tramos planos quedan en el tono base. También junta
 * las aristas internas para las líneas de pliegue (A.4).
 */
function construirFacetas(cresta: Punto[], baseY: number) {
  const facetas: { d: string; tono: "claro" | "oscuro" | "base" }[] = [];
  const aristas: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < cresta.length - 1; i++) {
    const [x1, y1] = cresta[i];
    const [x2, y2] = cresta[i + 1];
    const tono = y2 < y1 ? "claro" : y2 > y1 ? "oscuro" : "base";
    facetas.push({ d: `M${x1},${y1} L${x2},${y2} L${x2},${baseY} L${x1},${baseY} Z`, tono });
    aristas.push({ x1, y1, x2, y2 });
  }
  return { facetas, aristas };
}

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
  const y4 = useTransform(scrollYProgress, [0, 1], prefiereMenosMovimiento ? [0, 0] : [0, CAPAS[4].parallax]);
  const y5 = useTransform(scrollYProgress, [0, 1], prefiereMenosMovimiento ? [0, 0] : [0, CAPAS[5].parallax]);
  const parallaxPorCapa = [y0, y1, y2, y3, y4, y5];

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
      {/* Gradiente de pliegue reutilizado (A.4): objectBoundingBox 0,0→1,1 hace
          que cada línea sea más clara en su extremo superior-izquierdo (hacia LUZ)
          y más oscura en el opuesto, sin importar su orientación individual. */}
      <svg width="0" height="0">
        <defs>
          <linearGradient id={creaseId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={colores.blancoPapel} />
            <stop offset="100%" stopColor={colores.tinta} />
          </linearGradient>
        </defs>
      </svg>

      {CAPAS.map((capa, i) => {
        const atm = atmosfera[capa.distancia];
        const tonoBase = mezclarHex(capa.colorBase, colores.papel, atm.mezclaPapel);
        const tonos = {
          base: tonoBase,
          claro: ajustarLuminosidad(tonoBase, 8),
          oscuro: ajustarLuminosidad(tonoBase, -12),
        };
        const { facetas, aristas } = construirFacetas(capa.cresta, BASE_Y);
        // Offset máximo de parallax de mouse (±12px), proporcional al parallax
        // de scroll de la capa (0 en la más lejana → 12px en la más cercana).
        const mouseMax = (capa.parallax / 90) * 12;

        return (
          <div
            key={i}
            className={`absolute inset-0 ${capa.ocultarMobile ? "hidden sm:block" : ""}`}
            style={{ transform: `translate(calc(var(--mx) * ${mouseMax}px), calc(var(--my) * ${mouseMax}px))` }}
          >
            <motion.svg
              style={{
                y: parallaxPorCapa[i],
                transformOrigin: "50% 100%",
                filter: `saturate(${atm.saturacion}) ${dropShadowCSS(capa.distancia)}`,
              }}
              animate={prefiereMenosMovimiento ? undefined : { scale: [1, 1.008, 1] }}
              transition={
                prefiereMenosMovimiento
                  ? undefined
                  : { duration: 8 + i * 0.7, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }
              }
              viewBox="0 0 400 200"
              className="absolute bottom-0 w-full"
            >
              {facetas.map((f, j) => (
                <path key={j} d={f.d} fill={tonos[f.tono]} />
              ))}
              {aristas.map((a, j) => (
                <line
                  key={j}
                  x1={a.x1}
                  y1={a.y1}
                  x2={a.x2}
                  y2={a.y2}
                  stroke={`url(#${creaseId})`}
                  strokeWidth={1}
                  opacity={0.25}
                />
              ))}
            </motion.svg>
          </div>
        );
      })}

      {/* Marco de primer plano (B.7): silueta muy cercana recortada por el borde. */}
      <div
        className="absolute -bottom-6 -left-10 h-44 w-44"
        style={{ filter: "blur(2px) saturate(1.4)" }}
      >
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <polygon points="8,92 58,18 88,48 38,96" fill={colores.salvia} />
          <polygon points="8,92 58,18 42,62" fill={ajustarLuminosidad(colores.salvia, 10)} />
        </svg>
      </div>
    </motion.div>
  );
}
