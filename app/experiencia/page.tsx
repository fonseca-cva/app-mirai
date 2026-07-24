"use client";

import { useMemo, useState } from "react";
import { IntroExperiencia } from "@/components/experiencia/IntroExperiencia";
import { TarjetaContexto } from "@/components/experiencia/TarjetaContexto";
import { BarraProgreso } from "@/components/experiencia/BarraProgreso";
import { ResultadoParcial } from "@/components/experiencia/ResultadoParcial";
import { FoldTransition } from "@/components/origami/FoldTransition";
import { contextos } from "@/lib/data/contextos";
import { calcularPuntajes, type Respuesta } from "@/lib/logic/puntaje";
import { experienciaTarjeta } from "@/lib/config/textos";

type Fase = "intro" | "jugando" | "pausado" | "resultado";

export default function ExperienciaPage() {
  const [fase, setFase] = useState<Fase>("intro");
  const [indice, setIndice] = useState(0);
  const [respuestas, setRespuestas] = useState<Respuesta[]>([]);

  const top3 = useMemo(() => calcularPuntajes(respuestas).slice(0, 3), [respuestas]);

  function responder(valor: 0 | 1 | 2) {
    const contextoActual = contextos[indice];
    const nuevasRespuestas = [...respuestas, { contextoId: contextoActual.id, valor }];
    setRespuestas(nuevasRespuestas);

    if (indice + 1 >= contextos.length) {
      setFase("resultado");
    } else {
      setIndice(indice + 1);
    }
  }

  if (fase === "intro") {
    return <IntroExperiencia onEmpezar={() => setFase("jugando")} />;
  }

  if (fase === "resultado") {
    return <ResultadoParcial top3={top3} />;
  }

  const contextoActual = contextos[indice];

  return (
    <section className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-16 sm:px-8">
      <BarraProgreso actual={indice} total={contextos.length} />

      {fase === "pausado" ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-tinta/70">Pausado. Vuelve cuando quieras.</p>
          <button
            onClick={() => setFase("jugando")}
            className="rounded-[14px] bg-coral px-6 py-3 text-base font-medium text-blanco-papel transition hover:opacity-90"
          >
            {experienciaTarjeta.reanudar}
          </button>
        </div>
      ) : (
        <>
          <FoldTransition llave={contextoActual.id}>
            <TarjetaContexto contexto={contextoActual} onResponder={responder} />
          </FoldTransition>
          <button onClick={() => setFase("pausado")} className="text-sm text-tinta/60 underline">
            {experienciaTarjeta.pausa}
          </button>
        </>
      )}
    </section>
  );
}
