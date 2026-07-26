"use client";

import { useState } from "react";
import { itemsRotacion, itemPracticaRotacion } from "@/lib/data/rotacion";
import { generarItemRotacionMental, type ItemRotacionBloque } from "@/lib/logic/rotacion";
import { bloqueRotacion } from "@/lib/config/textos";
import { ItemRotacion, type ResultadoItemRotacion } from "@/components/experiencia/juegos/ItemRotacion";
import { FoldTransition } from "@/components/origami/FoldTransition";
import { DemoRotacion } from "@/components/experiencia/tutorial/Demos";
import { PracticaRotacion } from "@/components/experiencia/tutorial/PracticaRotacion";
import { AyudaOverlay } from "@/components/experiencia/tutorial/AyudaOverlay";
import { useTutorial } from "@/components/experiencia/tutorial/useTutorial";

export interface ResultadoRotacion {
  itemId: string;
  correcto: boolean;
  duracionMs: number;
}

interface Props {
  onCompletar: (resultados: ResultadoRotacion[]) => void;
}

// Segundo ítem de práctica: rotación simple, fácil, no puntúa
const itemPracticaRotacion2: ItemRotacionBloque = generarItemRotacionMental(
  "rot-practica-2",
  "facil",
  45,
  135,
  [120, 200, 280]
);

// Orquesta "Pliegues en el espacio": tutorial (demo + 2 prácticas) → 10 ítems reales.
export function BloqueRotacion({ onCompletar }: Props) {
  const [indice, setIndice] = useState(0);
  const [resultados, setResultados] = useState<ResultadoRotacion[]>([]);
  const [ayudaAbierta, setAyudaAbierta] = useState(false);

  const tutorial = useTutorial([
    { indiceCorrecto: itemPracticaRotacion.indiceCorrecto },
    { indiceCorrecto: itemPracticaRotacion2.indiceCorrecto },
  ]);

  // Demo
  if (tutorial.fase === "demo") {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center sm:px-8">
        <h1 className="font-display text-2xl font-semibold">{bloqueRotacion.titulo}</h1>
        <p className="text-sm text-tinta/60">{bloqueRotacion.fraseFuerza}</p>
        <DemoRotacion onTerminada={tutorial.demoTerminada} />
        <button
          onClick={tutorial.saltarDemo}
          className="rounded-[14px] border border-tinta/20 px-6 py-3 text-base font-medium text-tinta/70 transition hover:border-tinta/40"
        >
          {bloqueRotacion.tutorial.demoSaltar}
        </button>
      </section>
    );
  }

  // Práctica 1
  if (tutorial.fase === "practica-1") {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 sm:px-8">
        <p className="text-sm font-medium text-teal-profundo">Práctica (no puntúa)</p>
        <PracticaRotacion item={itemPracticaRotacion} onRespuesta={tutorial.responder} />
      </section>
    );
  }

  // Práctica 2
  if (tutorial.fase === "practica-2") {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 sm:px-8">
        <p className="text-sm font-medium text-teal-profundo">Práctica (no puntúa)</p>
        <PracticaRotacion item={itemPracticaRotacion2} onRespuesta={tutorial.responder} />
      </section>
    );
  }

  // Feedback
  if (tutorial.fase === "feedback-1" || tutorial.fase === "feedback-2") {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center sm:px-8">
        <div className="w-full max-w-md rounded-[20px] border-2 border-coral/30 bg-coral/5 p-6">
          <p className="text-sm font-medium text-coral">{bloqueRotacion.tutorial.practicaFalloMensaje}</p>
          <p className="mt-2 text-sm text-tinta/60">{bloqueRotacion.tutorial.practicaFeedback}</p>
        </div>
        <button
          onClick={tutorial.cerrarFeedback}
          className="rounded-[14px] bg-teal-profundo px-6 py-3 text-base font-medium text-blanco-papel transition hover:opacity-90"
        >
          Entendido
        </button>
      </section>
    );
  }

  // Transición
  if (tutorial.fase === "transicion") {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center sm:px-8">
        <p className="font-display text-xl text-tinta/80">{bloqueRotacion.tutorial.transicion}</p>
        <button
          onClick={tutorial.completar}
          className="rounded-[14px] bg-coral px-6 py-3 text-base font-medium text-blanco-papel transition hover:opacity-90"
        >
          {bloqueRotacion.comenzarCta}
        </button>
      </section>
    );
  }

  // ── Ítems reales ──
  const itemActual = itemsRotacion[indice];

  function registrarResultado(resultado: ResultadoItemRotacion) {
    const nuevos: ResultadoRotacion[] = [
      ...resultados,
      { itemId: itemActual.id, correcto: resultado.correcto, duracionMs: resultado.duracionMs },
    ];

    if (indice + 1 >= itemsRotacion.length) {
      onCompletar(nuevos);
      return;
    }

    setResultados(nuevos);
    setIndice(indice + 1);
  }

  return (
    <section className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 sm:px-8">
      <button
        onClick={() => setAyudaAbierta(true)}
        className="fixed left-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-blanco-papel/90 text-sm font-bold text-tinta/50 shadow-sm transition hover:text-tinta/80"
        aria-label={bloqueRotacion.tutorial.demoSaltar}
        title="?"
      >
        ?
      </button>

      <AyudaOverlay
        abierto={ayudaAbierta}
        resumen={bloqueRotacion.tutorial.ayudaResumen}
        onCerrar={() => setAyudaAbierta(false)}
      />

      <FoldTransition llave={itemActual.id}>
        <ItemRotacion item={itemActual} onResponder={registrarResultado} pausado={ayudaAbierta} />
      </FoldTransition>
    </section>
  );
}
