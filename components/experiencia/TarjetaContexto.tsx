"use client";

import { useEffect, useState } from "react";
import { PaperLayer } from "@/components/origami/PaperLayer";
import { IconoContexto } from "@/components/origami/IconoContexto";
import { EscenaContexto, tieneEscena } from "@/components/origami/EscenaContexto";
import type { Contexto } from "@/lib/data/contextos";
import { experienciaTarjeta } from "@/lib/config/textos";

interface TarjetaContextoProps {
  contexto: Contexto;
  onResponder: (valor: 0 | 1 | 2, ayudaAbierta: boolean) => void;
}

export function TarjetaContexto({ contexto, onResponder }: TarjetaContextoProps) {
  const [expandido, setExpandido] = useState(false);
  const [ayudaAbierta, setAyudaAbierta] = useState(false);

  function abrirExpandible() {
    setExpandido(true);
    setAyudaAbierta(true); // señal de calidad del estímulo (D.10) — no afecta puntaje
  }

  useEffect(() => {
    if (!expandido) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previo;
    };
  }, [expandido]);

  return (
    <PaperLayer className="relative flex w-full max-w-sm flex-col items-center gap-4 p-8 text-center">
      <button
        onClick={abrirExpandible}
        aria-label={experienciaTarjeta.queSeHaceAquiAria}
        className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-tinta/50 transition hover:bg-papel-sombra/60 hover:text-tinta/80"
      >
        <span aria-hidden="true" className="text-lg">?</span>
      </button>

      {tieneEscena(contexto.escenaId) ? (
        <EscenaContexto escenaId={contexto.escenaId} dimension={contexto.icono} className="h-32 w-full" />
      ) : (
        <IconoContexto dimension={contexto.icono} className="h-16 w-16" />
      )}

      <h2 className="text-xl font-semibold">{contexto.nombre}</h2>

      <div className="space-y-1">
        <p className="italic text-tinta/70">{contexto.escena}</p>
        <p className="text-tinta/80">{contexto.tarea}</p>
      </div>

      <button
        onClick={abrirExpandible}
        className="text-sm text-teal-profundo/80 underline underline-offset-2"
      >
        {experienciaTarjeta.queSeHaceAqui}
      </button>

      <div className="mt-2 flex w-full flex-col gap-2">
        {experienciaTarjeta.botones.map((boton) => (
          <button
            key={boton.valor}
            onClick={() => onResponder(boton.valor as 0 | 1 | 2, ayudaAbierta)}
            className={`rounded-[14px] px-4 py-3 text-sm font-medium transition ${
              boton.valor === 2
                ? "bg-coral text-blanco-papel hover:opacity-90"
                : "border border-tinta/20 hover:border-tinta/40"
            }`}
          >
            {boton.label}
          </button>
        ))}
      </div>

      {expandido && (
        <>
          <div
            className="fixed inset-0 z-40 bg-tinta/30"
            onClick={() => setExpandido(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-label={contexto.nombre}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[70vh] overflow-y-auto overscroll-contain rounded-t-[20px] bg-blanco-papel p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-left shadow-[0_-12px_32px_-12px_rgba(43,43,51,0.25)] sm:absolute sm:inset-x-6 sm:bottom-auto sm:top-24 sm:max-h-none sm:rounded-[14px] sm:pb-6"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg font-semibold">{contexto.nombre}</h3>
              <button
                onClick={() => setExpandido(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-tinta/50 hover:bg-papel-sombra/60"
                aria-label={experienciaTarjeta.cerrarExpandible}
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-tinta/80">
              {contexto.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2">
                  <span aria-hidden="true" className="text-teal-profundo">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </PaperLayer>
  );
}
