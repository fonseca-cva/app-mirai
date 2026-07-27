"use client";

import { juegosCognitivos } from "@/lib/config/textos";

interface Props {
  onSaltar: () => void;
}

// Botón discreto y persistente en las 3 pantallas del tutorial (propósito, demo, práctica).
// Salta directo a los desafíos reales — para quien repite el juego o ya sabe cómo funciona.
export function BotonSaltarTutorial({ onSaltar }: Props) {
  return (
    <button
      onClick={onSaltar}
      className="fixed right-4 top-4 z-10 rounded-full bg-blanco-papel/90 px-3 py-1.5 text-xs text-tinta/50 shadow-sm transition hover:text-tinta/80"
    >
      {juegosCognitivos.saltarTutorial}
    </button>
  );
}
