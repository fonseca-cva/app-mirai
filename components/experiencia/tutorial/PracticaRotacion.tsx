"use client";

import { useState } from "react";
import type { ItemRotacionBloque } from "@/lib/logic/rotacion";
import { PanelDoblez, PanelPerforado, AlternativaPlegado } from "@/components/experiencia/juegos/FiguraPlegadoSVG";
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

  return (
    <div className="flex flex-col items-center gap-4">
      <div className={clasesContenedor}>
        <p className="mb-3 text-center text-sm font-medium text-tinta/70">{bloqueRotacion.tutorial.consignaPlegado}</p>

        <div className="flex justify-center gap-3 rounded-[14px] bg-gris-papel/60 p-4">
          <div className="flex flex-col items-center gap-1">
            <PanelDoblez pliegues={item.pliegues} puntos={item.puntos} />
            <span className="text-[11px] text-tinta/50">{bloqueRotacion.tutorial.plegadoPanelDoblez}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <PanelPerforado pliegues={item.pliegues} puntos={item.puntos} />
            <span className="text-[11px] text-tinta/50">{bloqueRotacion.tutorial.plegadoPanelPerforado}</span>
          </div>
        </div>

        <p className="mt-4 text-center text-xs font-medium text-teal-profundo">{bloqueRotacion.tutorial.plegadoPanelPregunta}</p>

        <div className="mt-3 grid grid-cols-4 gap-2">
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
