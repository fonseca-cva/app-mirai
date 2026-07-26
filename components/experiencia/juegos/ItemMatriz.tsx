"use client";

import type { ItemMatriz as ItemMatrizData } from "@/lib/logic/matrices";
import { bloqueMatrices } from "@/lib/config/textos";
import { FiguraOrigamiSVG } from "@/components/experiencia/juegos/FiguraOrigamiSVG";
import { useTemporizadorItem } from "@/components/experiencia/juegos/useTemporizadorItem";

export interface ResultadoItemMatriz {
  indiceElegido: number | null;
  correcto: boolean;
  duracionMs: number;
}

interface Props {
  item: ItemMatrizData;
  onResponder: (resultado: ResultadoItemMatriz) => void;
  pausado?: boolean;
}

// Un ítem de matriz: grilla 3x3 con la celda final vacía + 5 alternativas.
// Sin feedback correcto/incorrecto (spec 3, "reglas de medición"): responder solo avanza.
export function ItemMatriz({ item, onResponder, pausado }: Props) {
  const { avisoActivo, marcarRespondido, yaRespondido } = useTemporizadorItem((duracionMs) =>
    onResponder({ indiceElegido: null, correcto: false, duracionMs }),
    pausado
  );

  function elegir(indice: number) {
    if (yaRespondido()) return;
    const duracionMs = marcarRespondido();
    onResponder({ indiceElegido: indice, correcto: indice === item.indiceCorrecto, duracionMs });
  }

  return (
    <div
      className={`w-full max-w-md rounded-[20px] border-2 p-6 transition-colors duration-700 ${
        avisoActivo ? "border-tinta/10" : "border-teal-medio/40"
      }`}
    >
      <div className="mx-auto grid w-fit grid-cols-3 gap-2 rounded-[14px] bg-gris-papel/60 p-3">
        {item.grilla.map((figura, i) =>
          i === 8 ? (
            <div
              key="vacia"
              className="flex h-20 w-20 items-center justify-center rounded-[10px] border-2 border-dashed border-tinta/20 text-2xl text-tinta/40 sm:h-24 sm:w-24"
              aria-label={bloqueMatrices.celdaVaciaAria}
            >
              ?
            </div>
          ) : (
            <div
              key={i}
              className="flex h-20 w-20 items-center justify-center rounded-[10px] bg-blanco-papel/70 sm:h-24 sm:w-24"
            >
              <FiguraOrigamiSVG figura={figura} tamano={56} />
            </div>
          )
        )}
      </div>

      <div className="mt-6 grid grid-cols-5 gap-2">
        {item.alternativas.map((figura, i) => (
          <button
            key={i}
            onClick={() => elegir(i)}
            className="flex min-h-[44px] items-center justify-center rounded-[10px] border border-tinta/15 bg-blanco-papel/70 p-1 transition hover:border-teal-medio hover:bg-blanco-papel"
            aria-label={`Alternativa ${i + 1}`}
          >
            <FiguraOrigamiSVG figura={figura} tamano={40} />
          </button>
        ))}
      </div>
    </div>
  );
}
