"use client";

import { useState } from "react";
import type { ItemRotacionBloque } from "@/lib/logic/rotacion";
import { PiezaOrigamiSVG } from "@/components/experiencia/juegos/PiezaOrigamiSVG";
import { EstimuloPlegado, AlternativaPlegado } from "@/components/experiencia/juegos/FiguraPlegadoSVG";
import { bloqueRotacion } from "@/lib/config/textos";

interface Props {
  item: ItemRotacionBloque;
  onRespuesta: (indice: number) => void;
}

type Estado = "jugando" | "feedback";

export function PracticaRotacion({ item, onRespuesta }: Props) {
  const [estado, setEstado] = useState<Estado>("jugando");
  const [indiceRespuesta, setIndiceRespuesta] = useState<number | null>(null);

  function elegir(indice: number) {
    if (estado !== "jugando") return;
    setIndiceRespuesta(indice);
    setEstado("feedback");
    onRespuesta(indice);
  }

  const correcto = indiceRespuesta === item.indiceCorrecto;

  const clasesContenedor = `w-full max-w-md rounded-[20px] border-2 p-6 transition-colors duration-700 ${
    estado === "feedback" && correcto
      ? "border-teal-profundo"
      : estado === "feedback" && !correcto
        ? "border-coral"
        : "border-teal-medio/40"
  }`;

  if (item.tipo === "rotacion") {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className={clasesContenedor}>
          <div className="flex justify-center rounded-[14px] bg-gris-papel/60 p-4">
            <PiezaOrigamiSVG anguloDeg={item.anguloReferencia} espejada={false} tamano={90} titulo="Pieza de referencia" />
          </div>

          <div className="mt-6 grid grid-cols-4 gap-2">
            {item.alternativas.map((alternativa, i) => {
              const esRespuesta = i === indiceRespuesta;
              const esCorrecta = i === item.indiceCorrecto;
              return (
                <button
                  key={i}
                  onClick={() => elegir(i)}
                  disabled={estado !== "jugando"}
                  className={`flex min-h-[44px] items-center justify-center rounded-[10px] border p-1 transition ${
                    estado === "feedback" && esCorrecta
                      ? "border-teal-profundo bg-teal-profundo/10"
                      : estado === "feedback" && esRespuesta && !esCorrecta
                        ? "border-coral bg-coral/5"
                        : "border-tinta/15 bg-blanco-papel/70 enabled:hover:border-teal-medio"
                  }`}
                >
                  <PiezaOrigamiSVG anguloDeg={alternativa.anguloDeg} espejada={alternativa.espejada} tamano={64} />
                </button>
              );
            })}
          </div>
        </div>

        {estado === "feedback" && (
          <div className={`rounded-[14px] px-4 py-3 text-center text-sm ${
            correcto ? "bg-teal-profundo/10 text-teal-profundo" : "bg-coral/10 text-coral"
          }`}>
            <p className="font-medium">
              {correcto ? bloqueRotacion.tutorial.practicaAcierto : bloqueRotacion.tutorial.practicaFalloMensaje}
            </p>
            {!correcto && (
              <p className="mt-1 text-tinta/60 text-xs">
                {bloqueRotacion.tutorial.practicaErrorPista(90)}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className={clasesContenedor}>
        <div className="flex justify-center rounded-[14px] bg-gris-papel/60 p-4">
          <EstimuloPlegado eje={item.eje} punto={item.punto} />
        </div>

        <div className="mt-6 grid grid-cols-4 gap-2">
          {item.alternativas.map((alternativa, i) => {
            const esRespuesta = i === indiceRespuesta;
            const esCorrecta = i === item.indiceCorrecto;
            return (
              <button
                key={i}
                onClick={() => elegir(i)}
                disabled={estado !== "jugando"}
                className={`flex min-h-[44px] items-center justify-center rounded-[10px] border p-1 transition ${
                  estado === "feedback" && esCorrecta
                    ? "border-teal-profundo bg-teal-profundo/10"
                    : estado === "feedback" && esRespuesta && !esCorrecta
                      ? "border-coral bg-coral/5"
                      : "border-tinta/15 bg-blanco-papel/70 enabled:hover:border-teal-medio"
                }`}
              >
                <AlternativaPlegado puntos={alternativa.puntos} />
              </button>
            );
          })}
        </div>
      </div>

      {estado === "feedback" && (
        <div className={`rounded-[14px] px-4 py-3 text-center text-sm ${
          correcto ? "bg-teal-profundo/10 text-teal-profundo" : "bg-coral/10 text-coral"
        }`}>
          <p className="font-medium">
            {correcto ? bloqueRotacion.tutorial.practicaAcierto : bloqueRotacion.tutorial.practicaFalloMensaje}
          </p>
          {!correcto && (
            <p className="mt-1 text-tinta/60 text-xs">
              La perforación se refleja al otro lado del pliegue.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
