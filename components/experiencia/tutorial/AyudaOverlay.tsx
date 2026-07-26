"use client";

import { juegosCognitivos } from "@/lib/config/textos";

interface Props {
  abierto: boolean;
  resumen: string[];
  onCerrar: () => void;
}

// Overlay de ayuda que se abre durante los ítems reales.
// Pausa el temporizador del ítem mientras está abierto (el padre controla pausado).
export function AyudaOverlay({ abierto, resumen, onCerrar }: Props) {
  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-[20px] bg-blanco-papel p-6 shadow-xl">
        <h2 className="font-display text-lg font-semibold text-tinta">
          {juegosCognitivos.ayuda}
        </h2>
        <ul className="mt-4 space-y-3">
          {resumen.map((linea, i) => (
            <li key={i} className="flex gap-3 text-sm text-tinta/70">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-profundo/10 text-xs font-medium text-teal-profundo">
                {i + 1}
              </span>
              <span>{linea}</span>
            </li>
          ))}
        </ul>
        <button
          onClick={onCerrar}
          className="mt-6 w-full rounded-[14px] bg-teal-profundo px-6 py-3 text-base font-medium text-blanco-papel transition hover:opacity-90"
        >
          {juegosCognitivos.cerrarAyuda}
        </button>
      </div>
    </div>
  );
}
