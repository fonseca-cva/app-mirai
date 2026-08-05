"use client";

import { useEffect, useRef, useState } from "react";
import { itemsRotacion, itemPracticaPlegado, itemPracticaPlegado2 } from "@/lib/data/rotacion";
import { bloqueRotacion, juegosCognitivos } from "@/lib/config/textos";
import { ItemRotacion, type ResultadoItemRotacion } from "@/components/experiencia/juegos/ItemRotacion";
import { ImagenEstaticaPlegadoSVG } from "@/components/experiencia/juegos/FiguraPlegadoSVG";
import { FoldTransition } from "@/components/origami/FoldTransition";
import { DemoPlegado } from "@/components/experiencia/tutorial/Demos";
import { PracticaRotacion } from "@/components/experiencia/tutorial/PracticaRotacion";
import { AyudaOverlay } from "@/components/experiencia/tutorial/AyudaOverlay";
import { BotonSaltarTutorial } from "@/components/experiencia/tutorial/BotonSaltarTutorial";
import { useTutorial } from "@/components/experiencia/tutorial/useTutorial";
import { useExperienciaStore } from "@/lib/store/experiencia";

export interface ResultadoRotacion {
  itemId: string;
  correcto: boolean;
  duracionMs: number;
}

interface Props {
  onCompletar: (resultados: ResultadoRotacion[]) => void;
}

// Orquesta "Pliegues en el espacio": tutorial (propósito + demo en loop + 2 prácticas) → 7 ítems reales.
export function BloqueRotacion({ onCompletar }: Props) {
  const [indice, setIndice] = useState(0);
  const [resultados, setResultados] = useState<ResultadoRotacion[]>([]);
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
      id: `tutorial-${sessionId}-rotacion`,
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
        <h1 className="font-display text-2xl font-semibold">{bloqueRotacion.titulo}</h1>
        <p className="text-sm text-tinta/60">{bloqueRotacion.fraseFuerza}</p>
        <ImagenEstaticaPlegadoSVG />
        <button
          onClick={tutorial.verComoFunciona}
          className="rounded-[14px] bg-coral px-6 py-3 text-base font-medium text-blanco-papel transition hover:opacity-90"
        >
          {bloqueRotacion.tutorial.propositoCta}
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
            {bloqueRotacion.tutorial.demoContinuarCta}
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
        <p className="max-w-md text-sm text-tinta/60">{bloqueRotacion.instrucciones}</p>
        <PracticaRotacion item={item} onRespuesta={tutorial.responder} />
      </section>
    );
  }

  // Acierto (pantalla propia, no un toast que desaparece)
  if (tutorial.fase === "acierto-1" || tutorial.fase === "acierto-2") {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center sm:px-8">
        <BotonSaltarTutorial onSaltar={tutorial.saltarTutorial} />
        <div className="w-full max-w-md rounded-[20px] border-2 border-teal-profundo/30 bg-teal-profundo/5 p-6">
          <p className="text-sm font-medium text-teal-profundo">{bloqueRotacion.tutorial.practicaAcierto}</p>
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
          <p className="text-sm font-medium text-coral">{bloqueRotacion.tutorial.practicaFalloMensaje}</p>
          <p className="mt-2 text-sm text-tinta/60">{bloqueRotacion.tutorial.practicaFeedback}</p>
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
