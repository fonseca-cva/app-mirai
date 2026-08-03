"use client";

import { useCallback, useState } from "react";
import { actividades } from "@/lib/data/actividades";
import { IconoContexto } from "@/components/origami/IconoContexto";
import { BarraProgreso } from "@/components/experiencia/BarraProgreso";
import { FoldTransition } from "@/components/origami/FoldTransition";
import { useExperienciaStore } from "@/lib/store/experiencia";
import { bloqueActividades, juegosCognitivos } from "@/lib/config/textos";

interface Props {
  onCompletar: () => void;
  onPausar: () => void;
}

// Bloque A2 (Tanda F, pilar de intereses): 24 actividades y pasatiempos,
// una tarjeta rápida por pantalla, escala de 3 puntos. Objetivo: ~2 min.
// Los 24 ítems se sincronizan juntos a respuestas_actividades al cerrarse.
export function BloqueActividades({ onCompletar, onPausar }: Props) {
  const [indice, setIndice] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [hecho, setHecho] = useState(false);
  const sessionId = useExperienciaStore((s) => s.sessionId);
  const agregarRespuestaActividad = useExperienciaStore((s) => s.agregarRespuestaActividad);
  const sincronizarBloque = useExperienciaStore((s) => s.sincronizarBloque);

  const actividad = actividades[indice];
  const esUltimo = indice + 1 >= actividades.length;

  const responder = useCallback(
    async (valor: 0 | 1 | 2) => {
      if (guardando) return;
      agregarRespuestaActividad({ actividadId: actividad.id, valor });

      if (!esUltimo) {
        setIndice(indice + 1);
        return;
      }

      // Último ítem: sync de las 24 respuestas juntas y cierre del bloque.
      setGuardando(true);
      if (sessionId) {
        const respuestas = useExperienciaStore.getState().respuestasActividades;
        await sincronizarBloque([
          {
            id: `actividades-${sessionId}`,
            tipo: "actividades",
            payload: respuestas.map((r) => ({
              session_id: sessionId,
              actividad_id: r.actividadId,
              valor: r.valor,
            })),
          },
        ]);
      }
      setGuardando(false);
      setHecho(true);
    },
    [guardando, esUltimo, indice, actividad.id, sessionId, agregarRespuestaActividad, sincronizarBloque]
  );

  if (hecho) {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="font-display text-xl text-tinta/80">{bloqueActividades.hecho}</p>
        <button
          onClick={onCompletar}
          className="rounded-[14px] bg-coral px-6 py-3 text-base font-medium text-blanco-papel transition hover:opacity-90"
        >
          {juegosCognitivos.seguir}
        </button>
      </section>
    );
  }

  return (
    <section className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-16 sm:px-8">
      <BarraProgreso actual={indice} total={actividades.length} ariaLabel="actividad" />

      <p className="text-sm text-teal-profundo/70">
        {bloqueActividades.titulo} — {indice + 1} {bloqueActividades.contadorDe} {actividades.length}
      </p>

      <FoldTransition llave={actividad.id}>
        <div className="flex w-full max-w-sm flex-col items-center gap-4 p-8 text-center">
          <IconoContexto dimension={actividad.dimension} className="h-14 w-14" />
          <h2 className="font-display text-2xl font-semibold leading-snug">
            {actividad.texto}
          </h2>
          <p className="text-sm text-tinta/50">{bloqueActividades.bajada}</p>

          <div className="mt-2 flex w-full flex-col gap-2">
            {bloqueActividades.botones.map((boton) => (
              <button
                key={boton.valor}
                onClick={() => responder(boton.valor as 0 | 1 | 2)}
                disabled={guardando}
                className={`rounded-[14px] px-4 py-3 text-sm font-medium transition enabled:hover:opacity-90 disabled:opacity-40 ${
                  boton.valor === 2
                    ? "bg-coral text-blanco-papel"
                    : "border border-tinta/20 hover:border-tinta/40"
                }`}
              >
                {boton.label}
              </button>
            ))}
          </div>
        </div>
      </FoldTransition>

      <button onClick={onPausar} className="text-sm text-tinta/60 underline">
        {bloqueActividades.pausa}
      </button>
    </section>
  );
}
