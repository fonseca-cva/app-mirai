"use client";

import { useCallback, useState } from "react";
import { asignaturas, type Asignatura } from "@/lib/data/asignaturas";
import type { DimensionCodigo } from "@/lib/data/contextos";
import { IconoContexto } from "@/components/origami/IconoContexto";
import { BarraProgreso } from "@/components/experiencia/BarraProgreso";
import { FoldTransition } from "@/components/origami/FoldTransition";
import { useExperienciaStore } from "@/lib/store/experiencia";
import { bloqueAsignaturas, bloqueActividades, juegosCognitivos } from "@/lib/config/textos";

interface Props {
  onCompletar: () => void;
  onPausar: () => void;
}

// Dimensión principal de una asignatura: la de mayor peso en su mapeo
// (define el ícono origami de la tarjeta).
function dimensionPrincipal(asignatura: Asignatura): DimensionCodigo {
  const [dimension] = Object.entries(asignatura.pesos).sort(
    (a, b) => (b[1] as number) - (a[1] as number)
  )[0];
  return dimension as DimensionCodigo;
}

// Bloque A3 (Tanda F, pilar de intereses): 10 asignaturas escolares,
// una tarjeta rápida por pantalla, escala de 3 puntos. Objetivo: ~45s.
// Los 10 ítems se sincronizan juntos a respuestas_asignaturas al cerrarse.
export function BloqueAsignaturas({ onCompletar, onPausar }: Props) {
  const [indice, setIndice] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [hecho, setHecho] = useState(false);
  const sessionId = useExperienciaStore((s) => s.sessionId);
  const agregarRespuestaAsignatura = useExperienciaStore((s) => s.agregarRespuestaAsignatura);
  const sincronizarBloque = useExperienciaStore((s) => s.sincronizarBloque);

  const asignatura = asignaturas[indice];
  const esUltimo = indice + 1 >= asignaturas.length;

  const responder = useCallback(
    async (valor: 0 | 1 | 2) => {
      if (guardando) return;
      agregarRespuestaAsignatura({ asignaturaId: asignatura.id, valor });

      if (!esUltimo) {
        setIndice(indice + 1);
        return;
      }

      // Último ítem: sync de las 10 respuestas juntas y cierre del bloque.
      setGuardando(true);
      if (sessionId) {
        const respuestas = useExperienciaStore.getState().respuestasAsignaturas;
        await sincronizarBloque([
          {
            id: `asignaturas-${sessionId}`,
            tipo: "asignaturas",
            payload: respuestas.map((r) => ({
              session_id: sessionId,
              asignatura_id: r.asignaturaId,
              valor: r.valor,
            })),
          },
        ]);
      }
      setGuardando(false);
      setHecho(true);
    },
    [guardando, esUltimo, indice, asignatura.id, sessionId, agregarRespuestaAsignatura, sincronizarBloque]
  );

  if (hecho) {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="font-display text-xl text-tinta/80">{bloqueAsignaturas.hecho}</p>
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
      <BarraProgreso actual={indice} total={asignaturas.length} ariaLabel="asignatura" />

      <p className="text-sm text-teal-profundo/70">
        {bloqueAsignaturas.titulo} — {indice + 1} {bloqueAsignaturas.contadorDe} {asignaturas.length}
      </p>

      <FoldTransition llave={asignatura.id}>
        <div className="flex w-full max-w-sm flex-col items-center gap-4 p-8 text-center">
          <IconoContexto dimension={dimensionPrincipal(asignatura)} className="h-14 w-14" />
          <h2 className="font-display text-2xl font-semibold leading-snug">
            {asignatura.nombre}
          </h2>
          <p className="text-sm text-tinta/50">{bloqueAsignaturas.bajada}</p>

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
        {bloqueAsignaturas.pausa}
      </button>
    </section>
  );
}
