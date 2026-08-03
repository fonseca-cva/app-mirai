"use client";

import type { ItemSerie as ItemSerieData } from "@/lib/data/series";
import { bloqueSeries } from "@/lib/config/textos";
import { useTemporizadorItem } from "@/components/experiencia/juegos/useTemporizadorItem";

export interface ResultadoItemSerie {
  indiceElegido: number | null;
  correcto: boolean;
  duracionMs: number;
}

interface Props {
  item: ItemSerieData;
  onResponder: (resultado: ResultadoItemSerie) => void;
  pausado?: boolean;
}

// Un ítem de Series: fichas de papel con texto (números o letra+número) en fila,
// más un hueco final, seguidas de 5 alternativas. Sin geometría (a diferencia de Matrices):
// el mundo visual es tipografía grande sobre fichas, para que el juego se lea como
// "razonamiento numérico" y no como "otro juego de figuras".
// Sin feedback correcto/incorrecto: responder solo avanza (igual que ItemMatriz).
export function ItemSerie({ item, onResponder, pausado }: Props) {
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
        {item.alternativas.map((elemento, i) => (
          <button
            key={i}
            onClick={() => elegir(i)}
            className="flex min-h-[44px] items-center justify-center rounded-[10px] border border-tinta/15 bg-blanco-papel/70 p-1 font-display text-base font-medium tracking-tight transition hover:border-teal-medio hover:bg-blanco-papel"
            aria-label={`Alternativa ${i + 1}`}
          >
            {elemento}
          </button>
        ))}
      </div>
    </div>
  );
}
