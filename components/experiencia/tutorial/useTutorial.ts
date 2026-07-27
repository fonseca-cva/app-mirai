"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export interface TutorialResult {
  tutorialVisto: boolean;
  practicaDominada: boolean;
  ciclosDemo: number;
  usoAtras: number;
  usoSaltarTutorial: boolean;
}

export type FaseTutorial =
  | "proposito"
  | "demo"
  | "practica-1"
  | "acierto-1"
  | "feedback-1"
  | "practica-2"
  | "acierto-2"
  | "feedback-2"
  | "practica-3"
  | "acierto-3"
  | "feedback-3"
  | "transicion"
  | "listo";

interface PracticaMeta {
  indiceCorrecto: number;
}

/**
 * Hook compartido para el tutorial de cada juego, en pantallas discretas
 * que solo avanzan por acción del usuario (ITERACIÓN 3 — regla madre).
 *
 * Flujo:
 * - proposito → demo (botón "Ver cómo funciona"; "Atrás" desde demo vuelve acá)
 * - demo → practica-1 (botón "Ya entendí, quiero practicar"; el loop de la demo no avanza nada)
 *   - Acierto → acierto-1 → (botón "Seguir") → practica-2
 *   - Error → feedback-1 → (botón "Entendido, otra práctica") → practica-2
 *     - Acierto → acierto-2 → transición (o practica-3 si el juego tiene 3 ítems)
 *     - Error → feedback-2 → transición (o practica-3)
 * - transicion → (onCompletar) → listo
 * - saltarTutorial: disponible en las 3 pantallas, salta directo a "listo" (desafíos reales)
 */
export function useTutorial(
  meta: [PracticaMeta, PracticaMeta] | [PracticaMeta, PracticaMeta, PracticaMeta]
) {
  const [fase, setFase] = useState<FaseTutorial>("proposito");
  const dominadaRef = useRef(true);
  const vistoRef = useRef(false);
  const ciclosDemoRef = useRef(0);
  const usoAtrasRef = useRef(0);
  const usoSaltarRef = useRef(false);

  const verComoFunciona = useCallback(() => {
    vistoRef.current = true;
    setFase("demo");
  }, []);

  const atrasDemo = useCallback(() => {
    usoAtrasRef.current += 1;
    setFase("proposito");
  }, []);

  const continuarAPractica = useCallback(() => {
    setFase("practica-1");
  }, []);

  const registrarCicloDemo = useCallback(() => {
    ciclosDemoRef.current += 1;
  }, []);

  const saltarTutorial = useCallback(() => {
    usoSaltarRef.current = true;
    setFase("listo");
  }, []);

  const responder = useCallback(
    (indice: number) => {
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
        const fa: FaseTutorial = paso === "practica-1" ? "acierto-1" : paso === "practica-2" ? "acierto-2" : "acierto-3";
        setFase(fa);
      } else {
        const fb: FaseTutorial = paso === "practica-1" ? "feedback-1" : paso === "practica-2" ? "feedback-2" : "feedback-3";
        setFase(fb);
      }
    },
    [fase, meta]
  );

  const continuarTrasAcierto = useCallback(() => {
    const paso =
      fase === "acierto-1" ? 0
        : fase === "acierto-2" ? 1
          : 2;

    if (paso === 0) setFase("practica-2");
    else if (paso === 1) setFase(meta.length >= 3 ? "practica-3" : "transicion");
    else setFase("transicion");
  }, [fase, meta.length]);

  const cerrarFeedback = useCallback(() => {
    const paso =
      fase === "feedback-1" ? 0
        : fase === "feedback-2" ? 1
          : 2;

    if (paso === 0) setFase("practica-2");
    else if (paso === 1) setFase(meta.length >= 3 ? "practica-3" : "transicion");
    else setFase("transicion");
  }, [fase, meta.length]);

  const completar = useCallback(() => {
    setFase("listo");
  }, []);

  return {
    fase,
    dominadaRef,
    vistoRef,
    verComoFunciona,
    atrasDemo,
    continuarAPractica,
    registrarCicloDemo,
    saltarTutorial,
    responder,
    continuarTrasAcierto,
    cerrarFeedback,
    completar,
    resultado: (): TutorialResult => ({
      tutorialVisto: vistoRef.current,
      practicaDominada: dominadaRef.current,
      ciclosDemo: ciclosDemoRef.current,
      usoAtras: usoAtrasRef.current,
      usoSaltarTutorial: usoSaltarRef.current,
    }),
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
