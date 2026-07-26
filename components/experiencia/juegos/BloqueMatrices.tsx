"use client";

import { useState, useCallback } from "react";
import { itemsMatrices, itemPracticaMatrices } from "@/lib/data/matrices";
import { generarItemMatriz, type ItemMatriz as ItemMatrizData } from "@/lib/logic/matrices";
import { bloqueMatrices } from "@/lib/config/textos";
import { ItemMatriz, type ResultadoItemMatriz } from "@/components/experiencia/juegos/ItemMatriz";
import { FoldTransition } from "@/components/origami/FoldTransition";
import { DemoMatrices } from "@/components/experiencia/tutorial/Demos";
import { PracticaMatrices } from "@/components/experiencia/tutorial/PracticaMatrices";
import { AyudaOverlay } from "@/components/experiencia/tutorial/AyudaOverlay";
import { useTutorial } from "@/components/experiencia/tutorial/useTutorial";
export interface ResultadoMatrices {
  itemId: string;
  correcto: boolean;
  duracionMs: number;
}

interface Props {
  onCompletar: (resultados: ResultadoMatrices[]) => void;
}

// Segundo ítem de práctica para matrices (fácil, 1 regla)
const itemPracticaMatrices2: ItemMatrizData = generarItemMatriz("mat-practica-2", "facil", [
  { atributo: "pliegues", baseFila: [1, 1, 1], pasoColumna: 1 },
]);

// Orquesta el juego de Matrices completo: tutorial (demo + 2 prácticas) → 12 ítems reales.
export function BloqueMatrices({ onCompletar }: Props) {
  const [indice, setIndice] = useState(0);
  const [resultados, setResultados] = useState<ResultadoMatrices[]>([]);
  const [ayudaAbierta, setAyudaAbierta] = useState(false);

  const tutorial = useTutorial([
    { indiceCorrecto: itemPracticaMatrices.indiceCorrecto },
    { indiceCorrecto: itemPracticaMatrices2.indiceCorrecto },
  ]);

  // Demo
  if (tutorial.fase === "demo") {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center sm:px-8">
        <h1 className="font-display text-2xl font-semibold">{bloqueMatrices.titulo}</h1>
        <p className="text-sm text-tinta/60">{bloqueMatrices.fraseFuerza}</p>
        <DemoMatrices onTerminada={tutorial.demoTerminada} />
        <button
          onClick={tutorial.saltarDemo}
          className="rounded-[14px] border border-tinta/20 px-6 py-3 text-base font-medium text-tinta/70 transition hover:border-tinta/40"
        >
          {bloqueMatrices.tutorial.demoSaltar}
        </button>
      </section>
    );
  }

  // Práctica 1
  if (tutorial.fase === "practica-1") {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 sm:px-8">
        <p className="text-sm font-medium text-teal-profundo">Práctica (no puntúa)</p>
        <PracticaMatrices item={itemPracticaMatrices} onRespuesta={tutorial.responder} />
      </section>
    );
  }

  // Práctica 2
  if (tutorial.fase === "practica-2") {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 sm:px-8">
        <p className="text-sm font-medium text-teal-profundo">Práctica (no puntúa)</p>
        <PracticaMatrices item={itemPracticaMatrices2} onRespuesta={tutorial.responder} />
      </section>
    );
  }

  // Feedback (cualquiera de los pasos)
  if (tutorial.fase === "feedback-1" || tutorial.fase === "feedback-2") {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center sm:px-8">
        <div className="w-full max-w-md rounded-[20px] border-2 border-coral/30 bg-coral/5 p-6">
          <p className="text-sm font-medium text-coral">{bloqueMatrices.tutorial.practicaFalloMensaje}</p>
          <p className="mt-2 text-sm text-tinta/60">{bloqueMatrices.tutorial.practicaFeedback}</p>
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
        <p className="font-display text-xl text-tinta/80">{bloqueMatrices.tutorial.transicion}</p>
        <button
          onClick={tutorial.completar}
          className="rounded-[14px] bg-coral px-6 py-3 text-base font-medium text-blanco-papel transition hover:opacity-90"
        >
          {bloqueMatrices.comenzarCta}
        </button>
      </section>
    );
  }

  // ── Ítems reales ──
  const itemActual = itemsMatrices[indice];

  function registrarResultado(resultado: ResultadoItemMatriz) {
    const nuevos: ResultadoMatrices[] = [
      ...resultados,
      { itemId: itemActual.id, correcto: resultado.correcto, duracionMs: resultado.duracionMs },
    ];

    if (indice + 1 >= itemsMatrices.length) {
      // Guardar tutorial_estado y completar
      onCompletar(nuevos);
      return;
    }

    setResultados(nuevos);
    setIndice(indice + 1);
  }

  return (
    <section className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 sm:px-8">
      {/* Botón ayuda */}
      <button
        onClick={() => setAyudaAbierta(true)}
        className="fixed left-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-blanco-papel/90 text-sm font-bold text-tinta/50 shadow-sm transition hover:text-tinta/80"
        aria-label={bloqueMatrices.tutorial.demoSaltar}
        title="?"
      >
        ?
      </button>

      <AyudaOverlay
        abierto={ayudaAbierta}
        resumen={bloqueMatrices.tutorial.ayudaResumen}
        onCerrar={() => setAyudaAbierta(false)}
      />

      <FoldTransition llave={itemActual.id}>
        <ItemMatriz item={itemActual} onResponder={registrarResultado} pausado={ayudaAbierta} />
      </FoldTransition>
    </section>
  );
}
