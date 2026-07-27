"use client";

import { useEffect, useRef, useState } from "react";
import { itemsMatrices, itemPracticaMatrices, itemPracticaMatrices2 } from "@/lib/data/matrices";
import { bloqueMatrices, juegosCognitivos } from "@/lib/config/textos";
import { ItemMatriz, type ResultadoItemMatriz } from "@/components/experiencia/juegos/ItemMatriz";
import { FoldTransition } from "@/components/origami/FoldTransition";
import { DemoMatrices } from "@/components/experiencia/tutorial/Demos";
import { PracticaMatrices } from "@/components/experiencia/tutorial/PracticaMatrices";
import { AyudaOverlay } from "@/components/experiencia/tutorial/AyudaOverlay";
import { BotonSaltarTutorial } from "@/components/experiencia/tutorial/BotonSaltarTutorial";
import { useTutorial } from "@/components/experiencia/tutorial/useTutorial";
import { useExperienciaStore } from "@/lib/store/experiencia";

export interface ResultadoMatrices {
  itemId: string;
  correcto: boolean;
  duracionMs: number;
}

interface Props {
  onCompletar: (resultados: ResultadoMatrices[]) => void;
}

// Imagen estática del juego para la pantalla de propósito (sin animación).
// Mismo tablero fijo de referencia que DemoMatrices: fila = forma, columna = cantidad (1, 2, 3).
function ImagenEstaticaMatrices() {
  const celdas = ["●", "●●", "●●●", "■", "■■", "■■■", "▲", "▲▲", "?"];
  return (
    <div className="grid grid-cols-3 gap-2 rounded-[14px] bg-gris-papel/60 p-3">
      {celdas.map((s, i) => (
        <div
          key={i}
          className={`flex h-14 w-14 items-center justify-center rounded-[10px] text-base tracking-tight sm:h-16 sm:w-16 ${
            i === 8 ? "border-2 border-dashed border-tinta/30 bg-blanco-papel/70 text-tinta/40" : "bg-blanco-papel/70"
          }`}
        >
          {s}
        </div>
      ))}
    </div>
  );
}

// Orquesta el juego de Matrices completo: tutorial (propósito + demo en loop + 2 prácticas) → 12 ítems reales.
export function BloqueMatrices({ onCompletar }: Props) {
  const [indice, setIndice] = useState(0);
  const [resultados, setResultados] = useState<ResultadoMatrices[]>([]);
  const [ayudaAbierta, setAyudaAbierta] = useState(false);
  const sessionId = useExperienciaStore((s) => s.sessionId);
  const sincronizarBloque = useExperienciaStore((s) => s.sincronizarBloque);
  const enviadoTutorialRef = useRef(false);

  const tutorial = useTutorial([
    { indiceCorrecto: itemPracticaMatrices.indiceCorrecto },
    { indiceCorrecto: itemPracticaMatrices2.indiceCorrecto },
  ]);

  useEffect(() => {
    if (tutorial.fase !== "listo" || enviadoTutorialRef.current || !sessionId) return;
    enviadoTutorialRef.current = true;
    const r = tutorial.resultado();
    sincronizarBloque([{
      id: `tutorial-${sessionId}-matrices`,
      tipo: "tutorial",
      payload: {
        session_id: sessionId,
        juego: "matrices" as const,
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
        <h1 className="font-display text-2xl font-semibold">{bloqueMatrices.titulo}</h1>
        <p className="text-sm text-tinta/60">{bloqueMatrices.fraseFuerza}</p>
        <ImagenEstaticaMatrices />
        <button
          onClick={tutorial.verComoFunciona}
          className="rounded-[14px] bg-coral px-6 py-3 text-base font-medium text-blanco-papel transition hover:opacity-90"
        >
          {bloqueMatrices.tutorial.propositoCta}
        </button>
      </section>
    );
  }

  // Pantalla 2 — demo en loop
  if (tutorial.fase === "demo") {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center sm:px-8">
        <BotonSaltarTutorial onSaltar={tutorial.saltarTutorial} />
        <DemoMatrices onCicloCompletado={tutorial.registrarCicloDemo} />
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
            {bloqueMatrices.tutorial.demoContinuarCta}
          </button>
        </div>
      </section>
    );
  }

  // Pantalla 3 — práctica
  if (tutorial.fase === "practica-1" || tutorial.fase === "practica-2") {
    const item = tutorial.fase === "practica-1" ? itemPracticaMatrices : itemPracticaMatrices2;
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 sm:px-8">
        <BotonSaltarTutorial onSaltar={tutorial.saltarTutorial} />
        <p className="text-sm font-medium text-teal-profundo">{juegosCognitivos.practicaAviso}</p>
        <p className="max-w-md text-sm text-tinta/60">{bloqueMatrices.instrucciones}</p>
        <PracticaMatrices item={item} onRespuesta={tutorial.responder} />
      </section>
    );
  }

  // Acierto (pantalla propia, no un toast que desaparece)
  if (tutorial.fase === "acierto-1" || tutorial.fase === "acierto-2") {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center sm:px-8">
        <BotonSaltarTutorial onSaltar={tutorial.saltarTutorial} />
        <div className="w-full max-w-md rounded-[20px] border-2 border-teal-profundo/30 bg-teal-profundo/5 p-6">
          <p className="text-sm font-medium text-teal-profundo">{bloqueMatrices.tutorial.practicaAcierto}</p>
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
          <p className="text-sm font-medium text-coral">{bloqueMatrices.tutorial.practicaFalloMensaje}</p>
          <p className="mt-2 text-sm text-tinta/60">{bloqueMatrices.tutorial.practicaFeedback}</p>
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
