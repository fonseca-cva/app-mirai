import { apoderados } from "@/lib/config/textos";

// Franja compacta y sobria (sin card, sin CTA propio) entre El informe y Para colegios.
export function Apoderados() {
  return (
    <section className="bg-papel px-4 py-16 sm:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-xl font-semibold sm:text-2xl">{apoderados.titulo}</h2>
        <p className="mt-3 text-tinta/80">{apoderados.texto}</p>
      </div>
    </section>
  );
}
