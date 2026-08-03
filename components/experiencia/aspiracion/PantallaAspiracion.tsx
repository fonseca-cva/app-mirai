"use client";

import { useState } from "react";
import { useExperienciaStore, type OpcionAspiracion } from "@/lib/store/experiencia";
import { bloqueAspiracion } from "@/lib/config/textos";

interface Props {
  onContinuar: () => void;
}

// Bloque A4 (Tanda F, pilar de intereses): aspiración post 4° medio.
// Una pregunta al inicio del flujo + detalle opcional (carrera/área en mente).
// Se sincroniza como fila única (upsert por session_id) al continuar.
export function PantallaAspiracion({ onContinuar }: Props) {
  const [opcion, setOpcion] = useState<OpcionAspiracion | null>(null);
  const [detalle, setDetalle] = useState("");
  const [guardando, setGuardando] = useState(false);
  const sessionId = useExperienciaStore((s) => s.sessionId);
  const setAspiracion = useExperienciaStore((s) => s.setAspiracion);
  const sincronizarBloque = useExperienciaStore((s) => s.sincronizarBloque);

  async function continuar() {
    if (!opcion || guardando) return;
    setGuardando(true);
    const detalleLimpio = detalle.trim() || null;
    setAspiracion({ opcion, detalle: detalleLimpio });
    if (sessionId) {
      await sincronizarBloque([
        {
          id: `aspiracion-${sessionId}`,
          tipo: "aspiracion",
          payload: {
            session_id: sessionId,
            opcion,
            detalle: detalleLimpio,
          },
        },
      ]);
    }
    setGuardando(false);
    onContinuar();
  }

  return (
    <section className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-16 text-center sm:px-8">
      <p className="font-display text-xl text-tinta/70">{bloqueAspiracion.titulo}</p>
      <h1 className="max-w-lg font-display text-3xl font-semibold sm:text-4xl">
        {bloqueAspiracion.pregunta}
      </h1>

      <div className="flex w-full max-w-sm flex-col gap-3">
        {bloqueAspiracion.opciones.map((boton) => (
          <button
            key={boton.valor}
            onClick={() => setOpcion(boton.valor as OpcionAspiracion)}
            className={`rounded-[14px] px-4 py-3 text-sm font-medium transition ${
              opcion === boton.valor
                ? "border-2 border-coral bg-coral/10 text-tinta"
                : "border border-tinta/20 hover:border-tinta/40"
            }`}
          >
            {boton.label}
          </button>
        ))}
      </div>

      <div className="flex w-full max-w-sm flex-col gap-2 text-left">
        <label htmlFor="aspiracion-detalle" className="text-sm text-tinta/70">
          {bloqueAspiracion.detalleLabel}
        </label>
        <input
          id="aspiracion-detalle"
          value={detalle}
          onChange={(e) => setDetalle(e.target.value)}
          placeholder={bloqueAspiracion.detallePlaceholder}
          disabled={guardando}
          className="w-full rounded-[14px] border border-tinta/20 bg-transparent px-4 py-3 text-sm outline-none transition placeholder:text-tinta/40 focus:border-tinta/50"
        />
      </div>

      <button
        onClick={continuar}
        disabled={!opcion || guardando}
        className="rounded-[14px] bg-coral px-8 py-3 text-base font-medium text-blanco-papel transition enabled:hover:opacity-90 disabled:opacity-40"
      >
        {bloqueAspiracion.continuar}
      </button>
    </section>
  );
}
