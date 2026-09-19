import Link from "next/link";
import { paraColegios } from "@/lib/config/textos";

// Banda verde manzana plana (estilo referencia), con tarjeta de papel blanco.
export function ParaColegios() {
  return (
    <section id="colegios" className="scroll-mt-20 bg-verde-manzana px-4 py-16 sm:px-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 rounded-[14px] bg-blanco-papel p-8 text-center shadow-sm sm:flex-row sm:justify-between sm:text-left">
        <div>
          <h2 className="text-xl font-semibold">{paraColegios.titulo}</h2>
          <p className="text-tinta/80">{paraColegios.texto}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:items-end">
          {/* La página dedicada del programa, para quien quiere el detalle. */}
          <Link
            href="/colegios"
            className="rounded-[14px] border-2 border-tinta px-6 py-3 text-sm font-medium transition hover:bg-tinta hover:text-blanco-papel"
          >
            {paraColegios.ctaPagina}
          </Link>
          <a
            href={paraColegios.mailto}
            className="text-center text-sm text-tinta/70 underline underline-offset-4 transition hover:text-tinta sm:text-right"
          >
            {paraColegios.cta}
          </a>
        </div>
      </div>
    </section>
  );
}
