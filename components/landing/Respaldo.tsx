import Link from "next/link";
import { respaldo } from "@/lib/config/textos";

// Banda teal a sangre completa (estilo referencia: sección de cifras sobre
// teal con texto blanco), transición recta, sin fondo de montañas.
export function Respaldo() {
  return (
    <section id="respaldo" className="scroll-mt-20 bg-teal-medio px-4 py-24 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-10 text-center text-2xl font-semibold uppercase tracking-[0.2em] text-blanco-papel sm:text-3xl">
          {respaldo.titulo}
        </h2>
        <p className="mb-10 rounded-[14px] bg-blanco-papel p-6 text-center font-display text-lg text-tinta shadow-sm">
          {respaldo.cifra}
        </p>
        <ul className="space-y-4">
          {respaldo.viñetas.map((viñeta) => (
            <li key={viñeta} className="flex gap-3 text-blanco-papel/90">
              <span aria-hidden="true" className="mt-1 text-blanco-papel">
                ✓
              </span>
              {viñeta}
            </li>
          ))}
        </ul>
        {respaldo.notaCohorte && (
          <p className="mt-8 text-center text-sm text-blanco-papel/60">
            {respaldo.notaCohorte}
          </p>
        )}
        {respaldo.metodologiaLink && (
          <p className="mt-8 text-center">
            <Link
              href="/metodologia"
              className="inline-block text-sm font-medium text-blanco-papel underline underline-offset-4 transition hover:opacity-80"
            >
              {respaldo.metodologiaLink}
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
