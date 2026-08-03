"use client";

import { useState } from "react";
import type { ItemSerie } from "@/lib/data/series";
import { bloqueSeries } from "@/lib/config/textos";

interface Props {
  item: ItemSerie;
  onRespuesta: (indice: number) => void;
}

type Estado = "jugando" | "feedback";

// Práctica de Series con feedback visual, clonando la estructura de PracticaMatrices.
// Cuando el usuario responde (correcta o incorrectamente), pasa a feedback
// y llama onRespuesta para que el tutorial maneje el flujo.
export function PracticaSeries({ item, onRespuesta }: Props) {
  const [estado, setEstado] = useState<Estado>("jugando");
  const [indiceRespuesta, setIndiceRespuesta] = useState<number | null>(null);

  function elegir(indice: number) {
    if (estado !== "jugando") return;
    setIndiceRespuesta(indice);
    setEstado("feedback");
    onRespuesta(indice);
  }

  const correcto = indiceRespuesta === item.indiceCorrecto;

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`w-full max-w-md rounded-[20px] border-2 p-6 transition-colors duration-700 ${
          estado === "feedback" && correcto
            ? "border-teal-profundo"
            : estado === "feedback" && !correcto
              ? "border-coral"
              : "border-teal-medio/40"
        }`}
      >
        <div className="mx-auto flex w-fit flex-wrap items-center justify-center gap-2 rounded-[14px] bg-gris-papel/60 p-3">
          {item.secuencia.map((elemento, i) => (
            <div
              key={i}
              className="flex h-16 w-16 items-center justify-center rounded-[10px] bg-blanco-papel/70 font-display text-xl font-semibold tracking-tight sm:h-20 sm:w-20 sm:text-2xl"
            >
              {elemento}
            </div>
          ))}
          <div
            className="flex h-16 w-16 items-center justify-center rounded-[10px] border-2 border-dashed border-tinta/20 text-2xl text-tinta/40 sm:h-20 sm:w-20"
            aria-label={bloqueSeries.huecoVacioAria}
          >
            ?
          </div>
        </div>

        <div className="mt-6 grid grid-cols-5 gap-2">
          {item.alternativas.map((elemento, i) => {
            const esRespuesta = i === indiceRespuesta;
            const esCorrecta = i === item.indiceCorrecto;
            return (
              <button
                key={i}
                onClick={() => elegir(i)}
                disabled={estado !== "jugando"}
                className={`flex min-h-[44px] items-center justify-center rounded-[10px] border p-1 font-display text-base font-medium tracking-tight transition ${
                  estado === "feedback" && esCorrecta
                    ? "border-teal-profundo bg-teal-profundo/10"
                    : estado === "feedback" && esRespuesta && !esCorrecta
                      ? "border-coral bg-coral/5"
                      : "border-tinta/15 bg-blanco-papel/70 enabled:hover:border-teal-medio"
                }`}
              >
                {elemento}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback inline */}
      {estado === "feedback" && (
        <div className={`rounded-[14px] px-4 py-3 text-center text-sm ${
          correcto ? "bg-teal-profundo/10 text-teal-profundo" : "bg-coral/10 text-coral"
        }`}>
          <p className="font-medium">
            {correcto ? bloqueSeries.tutorial.practicaAcierto : bloqueSeries.tutorial.practicaFalloMensaje}
          </p>
          {!correcto && (
            <p className="mt-1 text-tinta/60 text-xs">
              {bloqueSeries.tutorial.practicaErrorPista("busca qué operación pasa de un elemento al siguiente")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
