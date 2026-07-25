import { FondoCapas } from "@/components/origami/FondoCapas";
import { respaldo } from "@/lib/config/textos";

export function Respaldo() {
  return (
    <section id="respaldo" className="relative overflow-hidden bg-salvia/15 px-4 py-24 sm:px-8">
      <FondoCapas className="opacity-20" />
      <div className="relative z-10 mx-auto max-w-3xl">
        <h2 className="mb-10 text-center text-3xl font-semibold">{respaldo.titulo}</h2>
        <ul className="mb-10 space-y-4">
          {respaldo.viñetas.map((viñeta) => (
            <li key={viñeta} className="flex gap-3 text-tinta/85">
              <span aria-hidden="true" className="mt-1 text-salvia">
                ✓
              </span>
              {viñeta}
            </li>
          ))}
        </ul>
        <p className="rounded-[14px] bg-blanco-papel p-6 text-center font-display text-lg shadow-sm">{respaldo.cifra}</p>
      </div>
    </section>
  );
}
