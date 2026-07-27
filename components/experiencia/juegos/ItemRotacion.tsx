"use client";

import type { ItemRotacionBloque } from "@/lib/logic/rotacion";
import { PiezaOrigamiSVG } from "@/components/experiencia/juegos/PiezaOrigamiSVG";
import { AlternativaPlegado, PanelDoblez, PanelPerforado } from "@/components/experiencia/juegos/FiguraPlegadoSVG";
import { useTemporizadorItem } from "@/components/experiencia/juegos/useTemporizadorItem";
import { bloqueRotacion } from "@/lib/config/textos";

export interface ResultadoItemRotacion {
  indiceElegido: number | null;
  correcto: boolean;
  duracionMs: number;
}

interface Props {
  item: ItemRotacionBloque;
  onResponder: (resultado: ResultadoItemRotacion) => void;
  pausado?: boolean;
}

// Un ítem de "Pliegues en el espacio": rotación mental o plegado, según item.tipo.
// Misma regla de tiempo que Matrices (60s / aviso a los 45s) y sin feedback ítem a ítem.
export function ItemRotacion({ item, onResponder, pausado }: Props) {
  const { avisoActivo, marcarRespondido, yaRespondido } = useTemporizadorItem((duracionMs) =>
    onResponder({ indiceElegido: null, correcto: false, duracionMs }),
    pausado
  );

  function elegir(indice: number) {
    if (yaRespondido()) return;
    const duracionMs = marcarRespondido();
    onResponder({ indiceElegido: indice, correcto: indice === item.indiceCorrecto, duracionMs });
  }

  const clasesContenedor = `w-full max-w-md rounded-[20px] border-2 p-6 transition-colors duration-700 ${
    avisoActivo ? "border-tinta/10" : "border-teal-medio/40"
  }`;

  if (item.tipo === "rotacion") {
    return (
      <div className={clasesContenedor}>
        <div className="flex justify-center rounded-[14px] bg-gris-papel/60 p-4">
          <PiezaOrigamiSVG anguloDeg={item.anguloReferencia} espejada={false} tamano={90} titulo="Pieza de referencia" />
        </div>

        <div className="mt-6 grid grid-cols-4 gap-2">
          {item.alternativas.map((alternativa, i) => (
            <button
              key={i}
              onClick={() => elegir(i)}
              className="flex min-h-[44px] items-center justify-center rounded-[10px] border border-tinta/15 bg-blanco-papel/70 p-1 transition hover:border-teal-medio hover:bg-blanco-papel"
              aria-label={`Alternativa ${i + 1}`}
            >
              <PiezaOrigamiSVG anguloDeg={alternativa.anguloDeg} espejada={alternativa.espejada} tamano={64} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
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
        {item.alternativas.map((alternativa, i) => (
          <button
            key={i}
            onClick={() => elegir(i)}
            className="flex min-h-[44px] items-center justify-center rounded-[10px] border border-tinta/15 bg-blanco-papel/70 p-1 transition hover:border-teal-medio hover:bg-blanco-papel"
            aria-label={`Alternativa ${i + 1}`}
          >
            <AlternativaPlegado puntos={alternativa.puntos} />
          </button>
        ))}
      </div>
    </div>
  );
}
