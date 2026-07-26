"use client";

import { useState, useEffect, useRef } from "react";
import { PadSecuencias } from "@/components/experiencia/juegos/PadSecuencias";
import { bloqueSecuencias } from "@/lib/config/textos";

interface Props {
  secuencia: number[];
  onRespuesta: (indice: number) => void;
}

type Estado = "mostrando" | "esperando" | "feedback";

const MS_SIMBOLO = 800;
const MS_ENTRE_SIMBOLOS = 250;

// Práctica de Secuencias: muestra una secuencia fija, espera la repetición del usuario,
// y luego pasa a feedback.
export function PracticaSecuencias({ secuencia, onRespuesta }: Props) {
  const [estado, setEstado] = useState<Estado>("mostrando");
  const [simboloResaltado, setSimboloResaltado] = useState<number | null>(null);
  const [progreso, setProgreso] = useState(0);
  const [completado, setCompletado] = useState(false);
  const inicioRef = useRef(0);

  // Mostrar la secuencia automáticamente
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    secuencia.forEach((simbolo, i) => {
      const inicio = i * (MS_SIMBOLO + MS_ENTRE_SIMBOLOS);
      timers.push(setTimeout(() => setSimboloResaltado(simbolo), inicio));
      timers.push(setTimeout(() => setSimboloResaltado(null), inicio + MS_SIMBOLO));
    });
    const fin = secuencia.length * (MS_SIMBOLO + MS_ENTRE_SIMBOLOS);
    timers.push(setTimeout(() => {
      inicioRef.current = performance.now();
      setEstado("esperando");
    }, fin));
    return () => timers.forEach(clearTimeout);
  }, [secuencia]);

  function tocar(simbolo: number) {
    if (estado !== "esperando" || completado) return;

    if (simbolo !== secuencia[progreso]) {
      // Error
      setEstado("feedback");
      onRespuesta(-1); // señal de error (-1 para indicar error en secuencia)
      return;
    }

    const siguiente = progreso + 1;
    setProgreso(siguiente);

    if (siguiente >= secuencia.length) {
      setCompletado(true);
      setEstado("feedback");
      onRespuesta(0); // señal de acierto
    }
  }

  const correcto = completado;

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-tinta/60">
        {estado === "mostrando"
          ? "Mira la secuencia..."
          : estado === "esperando"
            ? "Ahora repítela en el mismo orden"
            : correcto
              ? bloqueSecuencias.tutorial.practicaAcierto
              : bloqueSecuencias.tutorial.practicaFalloMensaje}
      </p>

      <PadSecuencias
        simboloResaltado={simboloResaltado}
        deshabilitado={estado !== "esperando"}
        onTocar={tocar}
      />

      {estado === "feedback" && !correcto && (
        <div className="rounded-[14px] border-2 border-coral/30 bg-coral/5 p-4 text-center text-sm">
          <p className="font-medium text-coral">{bloqueSecuencias.tutorial.practicaFeedback}</p>
          <p className="mt-1 text-xs text-tinta/60">
            {bloqueSecuencias.tutorial.practicaErrorPista}
            {secuencia.map((s) => `⬡${s + 1}`).join(" → ")}
          </p>
        </div>
      )}

      {estado === "feedback" && correcto && (
        <div className="rounded-[14px] bg-teal-profundo/10 p-4 text-center text-sm text-teal-profundo">
          <p className="font-medium">{bloqueSecuencias.tutorial.practicaAcierto}</p>
        </div>
      )}
    </div>
  );
}
