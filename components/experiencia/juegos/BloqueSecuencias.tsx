"use client";

import { useEffect, useRef, useState } from "react";
import { bloqueSecuencias, juegosCognitivos } from "@/lib/config/textos";
import { PadSecuencias } from "@/components/experiencia/juegos/PadSecuencias";
import { IconoOrigamiSVG, type TipoOrigami } from "@/components/experiencia/juegos/IconoOrigamiSVG";
import { useSecuencias, type IntentoSecuencia } from "@/components/experiencia/juegos/useSecuencias";
import { puntajeSecuencias } from "@/lib/logic/secuencias";
import { DemoSecuencias } from "@/components/experiencia/tutorial/Demos";
import { PracticaSecuencias } from "@/components/experiencia/tutorial/PracticaSecuencias";
import { AyudaOverlay } from "@/components/experiencia/tutorial/AyudaOverlay";
import { BotonSaltarTutorial } from "@/components/experiencia/tutorial/BotonSaltarTutorial";
import { useTutorial } from "@/components/experiencia/tutorial/useTutorial";
import { useExperienciaStore } from "@/lib/store/experiencia";

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

const SIMBOLOS_PROPOSITO: TipoOrigami[] = ["grulla", "barco", "flor", "estrella", "casa", "pez"];

// Imagen estática del juego para la pantalla de propósito (sin animación).
function ImagenEstaticaSecuencias() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {SIMBOLOS_PROPOSITO.map((tipo, i) => (
        <div
          key={i}
          className="flex h-14 w-14 items-center justify-center rounded-[14px] border-2 border-tinta/15 bg-blanco-papel/70 sm:h-16 sm:w-16"
        >
          <IconoOrigamiSVG tipo={tipo} tamano={40} titulo={`Símbolo ${i + 1}: ${tipo}`} />
        </div>
      ))}
    </div>
  );
}

function JuegoSecuencias({ onCompletar }: Props) {
  const { fase, tipoTransicion, simboloResaltado, tocarSimbolo, repetirRonda } = useSecuencias(
    (largoMaximoLogrado, intentos) => {
      onCompletar({ largoMaximoLogrado, puntaje: puntajeSecuencias(largoMaximoLogrado), intentos });
    }
  );

  // Anexo 3: transición y timeout limpian el tablero por completo y muestran una pantalla
  // propia, para que nunca una ronda nueva empiece sin un cambio de estado perceptible.
  if (fase === "transicion") {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 text-center">
        <p className="font-display text-lg text-tinta/80">
          {tipoTransicion === "acierto" ? bloqueSecuencias.transicionAcierto : bloqueSecuencias.transicionReintento}
        </p>
      </div>
    );
  }

  if (fase === "timeout") {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 text-center">
        <p className="font-display text-lg text-tinta/80">{bloqueSecuencias.timeoutMensaje}</p>
        <button
          onClick={repetirRonda}
          className="rounded-[14px] bg-coral px-6 py-3 text-base font-medium text-blanco-papel transition hover:opacity-90"
        >
          {bloqueSecuencias.timeoutRepetirCta}
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[280px] flex-col items-center gap-6">
      <p className="h-6 text-sm font-medium text-teal-profundo">
        {fase === "mostrando"
          ? bloqueSecuencias.etiquetaPresentacion
          : fase === "esperando-respuesta"
            ? bloqueSecuencias.etiquetaRespuesta
            : ""}
      </p>
      <PadSecuencias
        simboloResaltado={simboloResaltado}
        deshabilitado={fase !== "esperando-respuesta"}
        onTocar={tocarSimbolo}
      />
    </div>
  );
}

// Orquesta Secuencias: tutorial (propósito + demo en loop + prácticas) → juego adaptativo real.
export function BloqueSecuencias({ onCompletar }: Props) {
  const [ayudaAbierta, setAyudaAbierta] = useState(false);
  const sessionId = useExperienciaStore((s) => s.sessionId);
  const sincronizarBloque = useExperienciaStore((s) => s.sincronizarBloque);
  const enviadoTutorialRef = useRef(false);

  // Para secuencias usamos indiceCorrecto=0 como "correcto" y -1 como incorrecto
  // (el componente PracticaSecuencias llama con 0 si acierta, -1 si no)
  const tutorial = useTutorial([
    { indiceCorrecto: 0 },
    { indiceCorrecto: 0 },
  ]);

  useEffect(() => {
    if (tutorial.fase !== "listo" || enviadoTutorialRef.current || !sessionId) return;
    enviadoTutorialRef.current = true;
    const r = tutorial.resultado();
    sincronizarBloque([{
      id: `tutorial-${sessionId}-secuencias`,
      tipo: "tutorial",
      payload: {
        session_id: sessionId,
        juego: "secuencias" as const,
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
        <h1 className="font-display text-2xl font-semibold">{bloqueSecuencias.titulo}</h1>
        <p className="text-sm text-tinta/60">{bloqueSecuencias.fraseFuerza}</p>
        <ImagenEstaticaSecuencias />
        <button
          onClick={tutorial.verComoFunciona}
          className="rounded-[14px] bg-coral px-6 py-3 text-base font-medium text-blanco-papel transition hover:opacity-90"
        >
          {bloqueSecuencias.tutorial.propositoCta}
        </button>
      </section>
    );
  }

  // Pantalla 2 — demo en loop
  if (tutorial.fase === "demo") {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center sm:px-8">
        <BotonSaltarTutorial onSaltar={tutorial.saltarTutorial} />
        <DemoSecuencias onCicloCompletado={tutorial.registrarCicloDemo} />
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
            {bloqueSecuencias.tutorial.demoContinuarCta}
          </button>
        </div>
      </section>
    );
  }

  // Pantalla 3 — práctica
  if (tutorial.fase === "practica-1" || tutorial.fase === "practica-2") {
    const secuencia = tutorial.fase === "practica-1" ? SECUENCIA_PRACTICA_1 : SECUENCIA_PRACTICA_2;
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 sm:px-8">
        <BotonSaltarTutorial onSaltar={tutorial.saltarTutorial} />
        <p className="text-sm font-medium text-teal-profundo">{juegosCognitivos.practicaAviso}</p>
        <p className="max-w-md text-sm text-tinta/60">{bloqueSecuencias.instrucciones}</p>
        <PracticaSecuencias secuencia={secuencia} onRespuesta={tutorial.responder} />
      </section>
    );
  }

  // Acierto (pantalla propia, no un toast que desaparece)
  if (tutorial.fase === "acierto-1" || tutorial.fase === "acierto-2") {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center sm:px-8">
        <BotonSaltarTutorial onSaltar={tutorial.saltarTutorial} />
        <div className="w-full max-w-md rounded-[20px] border-2 border-teal-profundo/30 bg-teal-profundo/5 p-6">
          <p className="text-sm font-medium text-teal-profundo">{bloqueSecuencias.tutorial.practicaAcierto}</p>
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
          <p className="text-sm font-medium text-coral">{bloqueSecuencias.tutorial.practicaFalloMensaje}</p>
          <p className="mt-2 text-sm text-tinta/60">{bloqueSecuencias.tutorial.practicaFeedback}</p>
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
