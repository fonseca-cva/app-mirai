"use client";

import { useEffect, useState } from "react";
import { bloqueSecuencias } from "@/lib/config/textos";
import { PadSecuencias } from "@/components/experiencia/juegos/PadSecuencias";
import { useSecuencias, type IntentoSecuencia } from "@/components/experiencia/juegos/useSecuencias";
import { puntajeSecuencias } from "@/lib/logic/secuencias";
import { DemoSecuencias } from "@/components/experiencia/tutorial/Demos";
import { PracticaSecuencias } from "@/components/experiencia/tutorial/PracticaSecuencias";
import { AyudaOverlay } from "@/components/experiencia/tutorial/AyudaOverlay";
import { useTutorial } from "@/components/experiencia/tutorial/useTutorial";

export interface ResultadoSecuencias {
  largoMaximoLogrado: number;
  puntaje: number;
  intentos: IntentoSecuencia[];
}

interface Props {
  onCompletar: (resultado: ResultadoSecuencias) => void;
}

// Secuencias de práctica
const SECUENCIA_PRACTICA_1 = [0, 3];
const SECUENCIA_PRACTICA_2 = [1, 4, 2];

function JuegoSecuencias({ onCompletar }: Props) {
  const { fase, simboloResaltado, tocarSimbolo } = useSecuencias((largoMaximoLogrado, intentos) => {
    onCompletar({ largoMaximoLogrado, puntaje: puntajeSecuencias(largoMaximoLogrado), intentos });
  });

  return (
    <div className="flex flex-col items-center gap-6">
      <PadSecuencias
        simboloResaltado={simboloResaltado}
        deshabilitado={fase !== "esperando-respuesta"}
        onTocar={tocarSimbolo}
      />
    </div>
  );
}

// Orquesta Secuencias: tutorial (demo + prácticas) → juego adaptativo real.
export function BloqueSecuencias({ onCompletar }: Props) {
  const [ayudaAbierta, setAyudaAbierta] = useState(false);

  // Para secuencias usamos indiceCorrecto=0 como "correcto" y -1 como incorrecto
  // (el componente PracticaSecuencias llama con 0 si acierta, -1 si no)
  const tutorial = useTutorial([
    { indiceCorrecto: 0 },
    { indiceCorrecto: 0 },
  ]);

  // Demo
  if (tutorial.fase === "demo") {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center sm:px-8">
        <h1 className="font-display text-2xl font-semibold">{bloqueSecuencias.titulo}</h1>
        <p className="text-sm text-tinta/60">{bloqueSecuencias.fraseFuerza}</p>
        <DemoSecuencias onTerminada={tutorial.demoTerminada} />
        <button
          onClick={tutorial.saltarDemo}
          className="rounded-[14px] border border-tinta/20 px-6 py-3 text-base font-medium text-tinta/70 transition hover:border-tinta/40"
        >
          {bloqueSecuencias.tutorial.demoSaltar}
        </button>
      </section>
    );
  }

  // Práctica 1
  if (tutorial.fase === "practica-1") {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 sm:px-8">
        <p className="text-sm font-medium text-teal-profundo">Práctica (no puntúa)</p>
        <PracticaSecuencias secuencia={SECUENCIA_PRACTICA_1} onRespuesta={tutorial.responder} />
      </section>
    );
  }

  // Práctica 2
  if (tutorial.fase === "practica-2") {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 sm:px-8">
        <p className="text-sm font-medium text-teal-profundo">Práctica (no puntúa)</p>
        <PracticaSecuencias secuencia={SECUENCIA_PRACTICA_2} onRespuesta={tutorial.responder} />
      </section>
    );
  }

  // Feedback
  if (tutorial.fase === "feedback-1" || tutorial.fase === "feedback-2") {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center sm:px-8">
        <div className="w-full max-w-md rounded-[20px] border-2 border-coral/30 bg-coral/5 p-6">
          <p className="text-sm font-medium text-coral">{bloqueSecuencias.tutorial.practicaFalloMensaje}</p>
          <p className="mt-2 text-sm text-tinta/60">{bloqueSecuencias.tutorial.practicaFeedback}</p>
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
        <p className="font-display text-xl text-tinta/80">{bloqueSecuencias.tutorial.transicion}</p>
        <button
          onClick={tutorial.completar}
          className="rounded-[14px] bg-coral px-6 py-3 text-base font-medium text-blanco-papel transition hover:opacity-90"
        >
          {bloqueSecuencias.comenzarCta}
        </button>
      </section>
    );
  }

  // ── Juego real ──
  return (
    <section className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 sm:px-8">
      <button
        onClick={() => setAyudaAbierta(true)}
        className="fixed left-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-blanco-papel/90 text-sm font-bold text-tinta/50 shadow-sm transition hover:text-tinta/80"
        aria-label={bloqueSecuencias.tutorial.demoSaltar}
        title="?"
      >
        ?
      </button>

      <AyudaOverlay
        abierto={ayudaAbierta}
        resumen={bloqueSecuencias.tutorial.ayudaResumen}
        onCerrar={() => setAyudaAbierta(false)}
      />

      <JuegoSecuencias onCompletar={onCompletar} />
    </section>
  );
}
