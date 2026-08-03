"use client";

import { useCallback, useState } from "react";
import {
  OBJETOS_DIVERGENTE,
  MIN_IDEAS_POR_OBJETO,
  limpiarIdeas,
} from "@/lib/data/divergente";
import { useExperienciaStore } from "@/lib/store/experiencia";
import { bloqueDivergente, juegosCognitivos } from "@/lib/config/textos";

interface Props {
  onCompletar: () => void;
  onPausar: () => void;
}

// Bloque exploratorio (Tanda D): usos alternativos de 3 objetos.
// EXPLORATORIO — NO REPORTAR: se sincroniza a respuestas_divergente, no alimenta
// informe ni matching en v1. Por eso no tiene tutorial ni demo: es recolección simple.
export function BloqueDivergente({ onCompletar, onPausar }: Props) {
  const [indice, setIndice] = useState(0);
  const [texto, setTexto] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [hecho, setHecho] = useState(false);
  const sessionId = useExperienciaStore((s) => s.sessionId);
  const agregarRespuestaDivergente = useExperienciaStore((s) => s.agregarRespuestaDivergente);
  const sincronizarBloque = useExperienciaStore((s) => s.sincronizarBloque);

  const objeto = OBJETOS_DIVERGENTE[indice];
  const ideas = limpiarIdeas(texto);
  const puedeContinuar = ideas.length >= MIN_IDEAS_POR_OBJETO;
  const esUltimo = indice + 1 >= OBJETOS_DIVERGENTE.length;

  const registrarObjeto = useCallback(async () => {
    if (!puedeContinuar || guardando) return;
    setGuardando(true);

    agregarRespuestaDivergente({
      objeto: objeto.id,
      respuestasTexto: ideas,
      cantidad: ideas.length,
    });
    setTexto("");

    if (!esUltimo) {
      setIndice(indice + 1);
      setGuardando(false);
      return;
    }

    // Último objeto: sync de las 3 respuestas juntas y cierre del bloque.
    if (sessionId) {
      const respuestas = useExperienciaStore.getState().respuestasDivergente;
      await sincronizarBloque([
        {
          id: `divergente-${sessionId}`,
          tipo: "divergente",
          payload: respuestas.map((r) => ({
            session_id: sessionId,
            objeto: r.objeto,
            respuestas_texto: r.respuestasTexto,
            cantidad: r.cantidad,
          })),
        },
      ]);
    }

    setGuardando(false);
    setHecho(true);
  }, [puedeContinuar, guardando, esUltimo, indice, ideas, objeto.id, sessionId, agregarRespuestaDivergente, sincronizarBloque]);

  if (hecho) {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="font-display text-xl text-tinta/80">{bloqueDivergente.hecho}</p>
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
    <section className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-16 sm:px-8">
      <button
        onClick={onPausar}
        className="self-end rounded-full bg-blanco-papel/90 px-3 py-1.5 text-sm text-tinta/60 underline shadow-sm"
      >
        {juegosCognitivos.pausa}
      </button>

      <header className="flex flex-col gap-1">
        <p className="text-sm text-teal-profundo/70">
          {bloqueDivergente.objetoEtiqueta} {indice + 1} {bloqueDivergente.de} {OBJETOS_DIVERGENTE.length}
        </p>
        <h1 className="font-display text-2xl font-semibold">
          {bloqueDivergente.titulo}: {objeto.nombre}
        </h1>
        <p className="text-base leading-relaxed text-tinta/70">{objeto.consigna}</p>
      </header>

      <p className="rounded-[10px] border border-teal-profundo/20 bg-teal-profundo/5 px-4 py-3 text-sm text-tinta/60">
        {bloqueDivergente.avisoExploratorio}
      </p>

      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={bloqueDivergente.placeholder}
        className="min-h-[220px] w-full resize-y rounded-[14px] border border-tinta/10 bg-blanco-papel p-4 text-base text-tinta outline-none transition focus:border-coral/50 focus:ring-2 focus:ring-coral/20"
        disabled={guardando}
        aria-label={objeto.nombre}
      />

      <div className="flex items-center justify-between">
        <span className={`text-sm ${puedeContinuar ? "text-tinta/60" : "text-tinta/40"}`}>
          {bloqueDivergente.minimo} {MIN_IDEAS_POR_OBJETO} — {ideas.length} {bloqueDivergente.contadorIdeas}
        </span>

        <button
          onClick={registrarObjeto}
          disabled={!puedeContinuar || guardando}
          className="rounded-[14px] bg-coral px-6 py-3 text-base font-medium text-blanco-papel transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {esUltimo ? bloqueDivergente.terminarCta : bloqueDivergente.siguienteCta}
        </button>
      </div>
    </section>
  );
}
