import { paraColegios } from "@/lib/config/textos";

export function ParaColegios() {
  return (
    <section id="colegios" className="flex flex-col items-center gap-4 px-4 py-16 text-center sm:flex-row sm:justify-between sm:px-16">
      <div>
        <h2 className="text-xl font-semibold">{paraColegios.titulo}</h2>
        <p className="text-tinta/80">{paraColegios.texto}</p>
      </div>
      <a
        href={paraColegios.mailto}
        className="shrink-0 rounded-[14px] border-2 border-tinta px-6 py-3 text-sm font-medium transition hover:bg-tinta hover:text-blanco-papel"
      >
        {paraColegios.cta}
      </a>
    </section>
  );
}
