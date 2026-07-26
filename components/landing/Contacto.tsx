"use client";

import { useState, type FormEvent } from "react";
import { contacto } from "@/lib/config/textos";

export function Contacto() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [motivo, setMotivo] = useState(contacto.campos.motivoOpciones[0].value);
  const [mensaje, setMensaje] = useState("");

  function manejarEnvio(evento: FormEvent) {
    evento.preventDefault();
    const asunto = `Contacto Mirai — ${motivo}`;
    const cuerpo = `Nombre: ${nombre}\nCorreo: ${correo}\nMotivo: ${motivo}\n\n${mensaje}`;
    window.location.href = `mailto:${contacto.mailtoDestino}?subject=${encodeURIComponent(
      asunto
    )}&body=${encodeURIComponent(cuerpo)}`;
  }

  return (
    <section className="px-4 py-24 sm:px-8">
      <div className="mx-auto max-w-md">
        <h2 className="mb-8 text-center text-2xl font-semibold uppercase tracking-[0.2em] sm:text-3xl">{contacto.titulo}</h2>
        <form onSubmit={manejarEnvio} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            {contacto.campos.nombre}
            <input
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="rounded-[14px] border border-tinta/20 px-4 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {contacto.campos.correo}
            <input
              required
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="rounded-[14px] border border-tinta/20 px-4 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {contacto.campos.motivo}
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="rounded-[14px] border border-tinta/20 px-4 py-2"
            >
              {contacto.campos.motivoOpciones.map((opcion) => (
                <option key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {contacto.campos.mensaje}
            <textarea
              required
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows={4}
              className="rounded-[14px] border border-tinta/20 px-4 py-2"
            />
          </label>
          <button
            type="submit"
            className="rounded-[14px] bg-coral px-6 py-3 text-base font-medium text-blanco-papel transition hover:opacity-90"
          >
            {contacto.submit}
          </button>
        </form>
      </div>
    </section>
  );
}
