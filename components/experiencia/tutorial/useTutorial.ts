"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export interface TutorialResult {
  tutorialVisto: boolean;
  practicaDominada: boolean;
}

export type FaseTutorial =
  | "demo"
  | "practica-1"
  | "practica-2"
  | "practica-3"
  | "feedback-1"
  | "feedback-2"
  | "feedback-3"
  | "transicion"
  | "listo";

interface PracticaMeta {
  indiceCorrecto: number;
}

/**
 * Hook compartido para el tutorial de 3 pasos (demo → práctica x2 → transición).
 *
 * Cada juego usa este hook y renderiza su propio contenido visual según `fase`.
 *
 * Flujo:
 * - demo (saltable) → practica-1
 *   - Acierto → practica-2
 *   - Error → feedback-1 → practica-2
 *     - Acierto → transicion
 *     - Error → feedback-2 → (replay demo si hay practica-3) → transicion
 * - transicion → (onCompletado) → listo
 */
export function useTutorial(
  meta: [PracticaMeta, PracticaMeta] | [PracticaMeta, PracticaMeta, PracticaMeta]
) {
  const [fase, setFase] = useState<FaseTutorial>("demo");
  const dominadaRef = useRef(true);
  const vistoRef = useRef(false);

  const saltarDemo = useCallback(() => {
    vistoRef.current = true;
    setFase("practica-1");
  }, []);

  const demoTerminada = useCallback(() => {
    vistoRef.current = true;
    setFase("practica-1");
  }, []);

  const responder = useCallback(
    (indice: number) => {
      // Determinar en qué paso estamos
      const paso: "practica-1" | "practica-2" | "practica-3" =
        fase === "practica-1" ? "practica-1"
          : fase === "practica-2" ? "practica-2"
            : "practica-3";

      const idx = paso === "practica-1" ? 0 : paso === "practica-2" ? 1 : 2;
      if (idx >= meta.length) {
        setFase("transicion");
        return;
      }
      const m = meta[idx]!;
      const correcto = indice === m.indiceCorrecto;

      if (!correcto) dominadaRef.current = false;

      if (correcto) {
        // Acierto: avanzar
        if (paso === "practica-1") setFase("practica-2");
        else setFase("transicion");
      } else {
        // Error: feedback
        const fb: FaseTutorial = paso === "practica-1" ? "feedback-1" : paso === "practica-2" ? "feedback-2" : "feedback-3";
        setFase(fb);
      }
    },
    [fase, meta]
  );

  const cerrarFeedback = useCallback(() => {
    const paso =
      fase === "feedback-1" ? 0
        : fase === "feedback-2" ? 1
          : 2;

    if (paso === 0) {
      setFase("practica-2");
    } else if (paso === 1) {
      // Tras 2 errores: si hay 3ra práctica (replay), ir a ella; si no, transición
      if (meta.length >= 3) {
        setFase("practica-3");
      } else {
        setFase("transicion");
      }
    } else {
      setFase("transicion");
    }
  }, [fase, meta.length]);

  const irATransicion = useCallback(() => setFase("transicion"), []);

  const completar = useCallback(() => {
    setFase("listo");
  }, []);

  return {
    fase,
    dominadaRef,
    vistoRef,
    saltarDemo,
    demoTerminada,
    responder,
    cerrarFeedback,
    irATransicion,
    completar,
  };
}

/**
 * Hook que detecta prefers-reduced-motion.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}
