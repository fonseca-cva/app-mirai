import Link from "next/link";
import { PaperLayer } from "@/components/origami/PaperLayer";
import { IconoContexto } from "@/components/origami/IconoContexto";
import { teaserExperiencia } from "@/lib/config/textos";

export function TeaserExperiencia() {
  return (
    <section className="flex flex-col items-center gap-8 px-4 py-24 text-center sm:px-8">
      <PaperLayer className="w-full max-w-sm p-6 text-left">
        <IconoContexto dimension="cre" className="mb-4 h-12 w-12" />
        <p className="font-display text-lg font-semibold">Estudio de diseño gráfico</p>
        <p className="mt-1 text-sm text-tinta/70">
          El cliente pide &ldquo;algo más wow&rdquo; sin decir qué significa eso.
        </p>
        <div className="mt-4 flex gap-2 text-xs">
          <Link href="/experiencia" className="rounded-[14px] border border-tinta/20 px-3 py-1 transition hover:bg-tinta/10">
            No es para mí
          </Link>
          <Link href="/experiencia" className="rounded-[14px] border border-tinta/20 px-3 py-1 transition hover:bg-tinta/10">
            Podría ser
          </Link>
          <Link href="/experiencia" className="rounded-[14px] bg-coral px-3 py-1 text-blanco-papel transition hover:opacity-90">
            Me atrae
          </Link>
        </div>
      </PaperLayer>
      <p className="max-w-md text-xl font-display">{teaserExperiencia.frase}</p>
      <Link
        href="/experiencia"
        className="rounded-[14px] border-2 border-coral px-6 py-3 text-base font-medium text-coral transition hover:bg-coral hover:text-blanco-papel"
      >
        {teaserExperiencia.cta}
      </Link>
    </section>
  );
}
