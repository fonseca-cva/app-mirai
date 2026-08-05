"use client";

import { useEffect, useRef, useState } from "react";
import { itemsPliegues, itemPracticaPlegado, itemPracticaPlegado2 } from "@/lib/data/pliegues";
import { bloquePliegues, juegosCognitivos } from "@/lib/config/textos";
import { ItemPliegues, type ResultadoItemPliegues } from "@/components/experiencia/juegos/ItemPliegues";
import { ImagenEstaticaPlegadoSVG } from "@/components/experiencia/juegos/FiguraPlegadoSVG";
import { FoldTransition } from "@/components/origami/FoldTransition";
import { DemoPlegado } from "@/components/experiencia/tutorial/Demos";
import { PracticaPliegues } from "@/components/experiencia/tutorial/PracticaPliegues";
import { AyudaOverlay } from "@/components/experiencia/tutorial/AyudaOverlay";
import { BotonSaltarTutorial } from "@/components/experiencia/tutorial/BotonSaltarTutorial";
import { useTutorial } from "@/components/experiencia/tutorial/useTutorial";
import { useExperienciaStore } from "@/lib/store/experiencia";

export interface ResultadoPliegues {
  itemId: string;
  correcto: boolean;
  duracionMs: number;
}

interface Props {
  onCompletar: (resultados: ResultadoPliegues[]) => void;
}

// Orquesta "Pliegues en el espacio": tutorial (propósito + demo en loop + 2 prácticas) → 7 ítems reales.
export function BloquePliegues({ onCompletar }: Props) {
  const [indice, setIndice] = useState(0);
  const [resultados, setResultados] = useState<ResultadoPliegues[]>([]);
  const [ayudaAbierta, setAyudaAbierta] = useState(false);
  const sessionId = useExperienciaStore((s) => s.sessionId);
  const sincronizarBloque = useExperienciaStore((s) => s.sincronizarBloque);
  const enviadoTutorialRef = useRef(false);

  const tutorial = useTutorial([
    { indiceCorrecto: itemPracticaPlegado.indiceCorrecto },
    { indiceCorrecto: itemPracticaPlegado2.indiceCorrecto },
  ]);

  useEffect(() => {
    if (tutorial.fase !== "listo" || enviadoTutorialRef.current || !sessionId) return;
    enviadoTutorialRef.current = true;
    const r = tutorial.resultado();
    sincronizarBloque([{
      id: `tutorial-${sessionId}-pliegues`,
      tipo: "tutorial",
      payload: {
        session_id: sessionId,
        juego: "pliegues" as const,
        tutorial_visto: r.tutorialVisto,
        practica_dominada: r.practicaDominada,
        demo_loops_vistos: r.ciclosDemo,
        uso_atras: r.usoAtras,
        uso_saltar_tutorial: r.usoSaltarTutorial,
      },
    }]);
  }, [tutorial, sessionId, sincronizarBloque]);

  // Pantalla 1 — propósito
  if (tutorial.fase === "proposito") {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center sm:px-8">
        <BotonSaltarTutorial onSaltar={tutorial.saltarTutorial} />
        <h1 className="font-display text-2xl font-semibold">{bloquePliegues.titulo}</h1>
        <p className="text-sm text-tinta/60">{bloquePliegues.fraseFuerza}</p>
        <ImagenEstaticaPlegadoSVG />
        <button
          onClick={tutorial.verComoFunciona}
          className="rounded-[14px] bg-coral px-6 py-3 text-base font-medium text-blanco-papel transition hover:opacity-90"
        >
          {bloquePliegues.tutorial.propositoCta}
        </button>
      </section>
    );
  }

  // Pantalla 2 — demo en loop
  if (tutorial.fase === "demo") {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center sm:px-8">
        <BotonSaltarTutorial onSaltar={tutorial.saltarTutorial} />
        <DemoPlegado onCicloCompletado={tutorial.registrarCicloDemo} />
        <div className="flex gap-3">
          <button
            onClick={tutorial.atrasDemo}
            className="rounded-[14px] border border-tinta/20 px-6 py-3 text-base font-medium text-tinta/70 transition hover:border-tinta/40"
          >
            {juegosCognitivos.atras}
          </button>
          <button
            onClick={tutorial.continuarAPractica}
            className="rounded-[14px] bg-coral px-6 py-3 text-base font-medium text-blanco-papel transition hover:opacity-90"
          >
            {bloquePliegues.tutorial.demoContinuarCta}
          </button>
        </div>
      </section>
    );
  }

  // Pantalla 3 — práctica
  if (tutorial.fase === "practica-1" || tutorial.fase === "practica-2") {
    const item = tutorial.fase === "practica-1" ? itemPracticaPlegado : itemPracticaPlegado2;
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 sm:px-8">
        <BotonSaltarTutorial onSaltar={tutorial.saltarTutorial} />
        <p className="text-sm font-medium text-teal-profundo">{juegosCognitivos.practicaAviso}</p>
        <p className="max-w-md text-sm text-tinta/60">{bloquePliegues.instrucciones}</p>
        <PracticaPliegues item={item} onRespuesta={tutorial.responder} />
      </section>
    );
  }

  // Acierto (pantalla propia, no un toast que desaparece)
  if (tutorial.fase === "acierto-1" || tutorial.fase === "acierto-2") {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center sm:px-8">
        <BotonSaltarTutorial onSaltar={tutorial.saltarTutorial} />
        <div className="w-full max-w-md rounded-[20px] border-2 border-teal-profundo/30 bg-teal-profundo/5 p-6">
          <p className="text-sm font-medium text-teal-profundo">{bloquePliegues.tutorial.practicaAcierto}</p>
        </div>
        <button
          onClick={tutorial.continuarTrasAcierto}
          className="rounded-[14px] bg-teal-profundo px-6 py-3 text-base font-medium text-blanco-papel transition hover:opacity-90"
        >
          {juegosCognitivos.seguir}
        </button>
      </section>
    );
  }

  // Feedback de error — queda en pantalla hasta que el usuario toque "Entendido, otra práctica"
  if (tutorial.fase === "feedback-1" || tutorial.fase === "feedback-2") {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center sm:px-8">
        <BotonSaltarTutorial onSaltar={tutorial.saltarTutorial} />
        <div className="w-full max-w-md rounded-[20px] border-2 border-coral/30 bg-coral/5 p-6">
          <p className="text-sm font-medium text-coral">{bloquePliegues.tutorial.practicaFalloMensaje}</p>
          <p className="mt-2 text-sm text-tinta/60">{bloquePliegues.tutorial.practicaFeedback}</p>
        </div>
        <button
          onClick={tutorial.cerrarFeedback}
          className="rounded-[14px] bg-teal-profundo px-6 py-3 text-base font-medium text-blanco-papel transition hover:opacity-90"
        >
          Entendido, otra práctica
        </button>
      </section>
    );
  }

  // Transición
  if (tutorial.fase === "transicion") {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center sm:px-8">
        <p className="font-display text-xl text-tinta/80">{bloquePliegues.tutorial.transicion}</p>
        <button
          onClick={tutorial.completar}
          className="rounded-[14px] bg-coral px-6 py-3 text-base font-medium text-blanco-papel transition hover:opacity-90"
        >
          {bloquePliegues.comenzarCta}
        </button>
      </section>
    );
  }

  // ── Ítems reales ──
  const itemActual = itemsPliegues[indice];

  function registrarResultado(resultado: ResultadoItemPliegues) {
    const nuevos: ResultadoPliegues[] = [
      ...resultados,
      { itemId: itemActual.id, correcto: resultado.correcto, duracionMs: resultado.duracionMs },
    ];

    if (indice + 1 >= itemsPliegues.length) {
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
        aria-label={bloquePliegues.tutorial.demoSaltar}
        title="?"
      >
        ?
      </button>

      <AyudaOverlay
        abierto={ayudaAbierta}
        resumen={bloquePliegues.tutorial.ayudaResumen}
        onCerrar={() => setAyudaAbierta(false)}
      />

      <FoldTransition llave={itemActual.id}>
        <ItemPliegues item={itemActual} onResponder={registrarResultado} pausado={ayudaAbierta} />
      </FoldTransition>
    </section>
  );
}
