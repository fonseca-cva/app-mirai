"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// ── Estado del tutorial ─────────────────────────────────────────────

export interface TutorialResult {
  tutorialVisto: boolean;
  practicaDominada: boolean;
}

type FaseBase =
  | "demo"
  | "practica-1"
  | "feedback-1"
  | "practica-2"
  | "feedback-2"
  | "replay-demo"
  | "practica-3"
  | "feedback-3"
  | "transicion"
  | "listo";

type Fase = FaseBase;

// ── Hook helper: prefers-reduced-motion ────────────────────────────

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

// ── Componente que maneja el flujo de 3 pasos ──────────────────────

interface Props {
  /** Render de cada fase */
  render: (fase: Fase, acciones: AccionesTutorial) => React.ReactNode;
  /** Callback cuando termina todo el tutorial */
  onCompletado: (r: TutorialResult) => void;
}

export interface AccionesTutorial {
  avanzar: () => void;
  saltarDemo: () => void;
  responderPractica: (indice: number) => void;
  cerrarFeedback: () => void;
  irATransicion: () => void;
  completarTutorial: () => void;
}

interface PracticaMeta {
  indiceCorrecto: number;
}

// Orquesta el tutorial de 3 pasos: demo saltable → 2 prácticas con feedback → transición.
// Es responsabilidad del padre (cada BloqueX) generar el contenido visual de cada fase
// usando las acciones que devuelve el hook.
export function useTutorial(
  practicasMeta: [PracticaMeta, PracticaMeta],
  practica3Meta?: PracticaMeta
) {
  const [fase, setFase] = useState<Fase>("demo");
  const [errores, setErrores] = useState(0);
  const dominadaRef = useRef(true);
  const vistoRef = useRef(true);

  const saltarDemo = useCallback(() => setFase("practica-1"), []);

  const responderPractica = useCallback(
    (indice: number) => {
      const idxPaso = fase === "practica-1" ? 0 : fase === "practica-2" ? 1 : 2;
      const meta = idxPaso === 0 ? practicasMeta[0] : idxPaso === 1 ? practicasMeta[1] : practica3Meta!;
      const correcto = indice === meta.indiceCorrecto;

      if (!correcto) {
        dominadaRef.current = false;
      }

      if (correcto && idxPaso !== 2) {
        // Acierto: avanzar a siguiente práctica o transición
        const sig = idxPaso === 0 ? "practica-2" : "transicion";
        setFase(sig);
        return;
      }

      if (correcto && idxPaso === 2) {
        setFase("transicion");
        return;
      }

      // Error: mostrar feedback
      const sigFeedback = idxPaso === 0 ? "feedback-1" : idxPaso === 1 ? "feedback-2" : "feedback-3";
      setFase(sigFeedback);
      setErrores((prev) => prev + 1);
    },
    [fase, practicasMeta, practica3Meta]
  );

  const cerrarFeedback = useCallback(() => {
    const idxPaso = fase === "feedback-1" ? 0 : fase === "feedback-2" ? 1 : 2;

    if (idxPaso === 0) {
      // Tras feedback del primer error: pasar al segundo ítem
      setFase("practica-2");
    } else if (idxPaso === 1) {
      // Tras feedback del segundo error: ¿replay demo o transición?
      if (practica3Meta) {
        setFase("replay-demo");
      } else {
        setFase("transicion");
      }
    } else {
      // feedback-3: transición
      setFase("transicion");
    }
  }, [fase, practica3Meta]);

  const irATransicion = useCallback(() => setFase("transicion"), []);

  const completarTutorial = useCallback(() => {
    setFase("listo");
  }, []);

  const avanzar = useCallback(() => {
    setFase("practica-1");
  }, []);

  return {
    fase,
    errores,
    dominadaRef,
    vistoRef,
    acciones: { saltarDemo, responderPractica, cerrarFeedback, completarTutorial, avanzar, irATransicion } as AccionesTutorial,
    resultado: { tutorialVisto: vistoRef.current, practicaDominada: dominadaRef.current } as TutorialResult,
  };
}

// Componente que renderiza el tutorial usando el hook
export function TutorialJuego({
  render,
  onCompletado,
}: Props) {
  const reducida = useReducedMotion();
  const [listo, setListo] = useState(false);
  const resultadoRef = useRef<TutorialResult>({ tutorialVisto: true, practicaDominada: true });

  const handleCompletado = useCallback(() => {
    resultadoRef.current = {
      tutorialVisto: true,
      practicaDominada: resultadoRef.current.practicaDominada,
    };
    onCompletado(resultadoRef.current);
    setListo(true);
  }, [onCompletado]);

  // No usamos el hook aquí porque los padres usan useTutorial directamente
  if (listo) return null;
  return null;
}
