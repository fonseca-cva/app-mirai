import type { Metadata } from "next";
import Link from "next/link";
import { IndiceMetodologia } from "@/components/metodologia/IndiceMetodologia";
import { MetodologiaHero } from "@/components/metodologia/MetodologiaHero";
import { TresPilaresCirculos } from "@/components/metodologia/TresPilaresCirculos";
import { DiagramaTresPilares } from "@/components/metodologia/DiagramaTresPilares";
import { SeccionVisual } from "@/components/metodologia/SeccionVisual";
import { Header } from "@/components/landing/Header";
import { metodologia } from "@/lib/config/textos";

export const metadata: Metadata = {
  title: "Metodología — Mirai",
  description:
    "Cómo mide Mirai: intereses con estímulos audiovisuales, capacidades con tareas validadas por la psicología cognitiva, y datos oficiales de empleabilidad del Mineduc.",
  openGraph: {
    title: "Metodología — Mirai",
    description:
      "Cómo mide Mirai: intereses con estímulos audiovisuales, capacidades con tareas validadas por la psicología cognitiva, y datos oficiales de empleabilidad del Mineduc.",
    locale: "es_CL",
    type: "website",
  },
};

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------
export default function MetodologiaPage() {
  return (
    <main className="flex flex-1 flex-col">
      <Header />

      {/* Hero con diorama — fondo papel completo */}
      <div className="bg-papel">
        <MetodologiaHero />
      </div>

      {/* Sección de encabezado — fondo papel */}
      <section className="bg-papel px-4 py-12 sm:px-8 sm:py-16">
        <article className="mx-auto w-full max-w-[680px]">
          <h1 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
            {metodologia.encabezado.titulo}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-tinta/70">
            {metodologia.encabezado.bajada}
          </p>
        </article>
      </section>

      {/* Índice — fondo papel */}
      <section className="bg-papel px-4 sm:px-8 pb-6">
        <article className="mx-auto w-full max-w-[680px]">
          <IndiceMetodologia />
        </article>
      </section>

      {/* Sección 2 — Tres pilares — fondo papel */}
      <section className="bg-papel px-4 py-12 sm:px-8 sm:py-16">
        <article className="mx-auto w-full max-w-[680px] space-y-16">
          <section id="tres-pilares" className="scroll-mt-24">
            <h2 className="font-display text-2xl font-semibold text-tinta">{metodologia.tresPilares.titulo}</h2>
            <p className="mt-4 text-base leading-relaxed text-tinta/80">
              {metodologia.tresPilares.cuerpo.split("\n\n")[0]}
            </p>
            <TresPilaresCirculos />
            <DiagramaTresPilares />
          </section>
        </article>
      </section>

      {/* Sección 3 — Intereses — fondo coral */}
      <section id="intereses" className="bg-coral/10 px-4 py-12 sm:px-8 sm:py-16 scroll-mt-24">
        <article className="mx-auto w-full max-w-[680px]">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-coral text-sm font-semibold text-coral">
            01
          </div>
          <h2 className="font-display text-2xl font-semibold text-tinta">{metodologia.intereses.titulo}</h2>
          <div className="mt-4 space-y-4 text-base leading-relaxed text-tinta/80">
            {metodologia.intereses.cuerpo.split("\n\n").map((parrafo, i) => (
              <p key={i}>{parrafo}</p>
            ))}
          </div>
        </article>
      </section>

      {/* Sección 4 — Por qué preguntamos — fondo papel */}
      <section id="por-que-preguntamos" className="bg-papel px-4 py-12 sm:px-8 sm:py-16 scroll-mt-24">
        <article className="mx-auto w-full max-w-[680px]">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-coral text-sm font-semibold text-coral">
            02
          </div>
          <h2 className="font-display text-2xl font-semibold text-tinta">{metodologia.porQuePreguntamos.titulo}</h2>
          <div className="mt-4 space-y-4 text-base leading-relaxed text-tinta/80">
            {metodologia.porQuePreguntamos.cuerpo.split("\n\n").map((parrafo, i) => (
              <p key={i}>{parrafo}</p>
            ))}
          </div>
        </article>
      </section>

      {/* Sección 5 — Capacidades — fondo salvia */}
      <section id="capacidades" className="bg-salvia/10 px-4 py-12 sm:px-8 sm:py-16 scroll-mt-24">
        <article className="mx-auto w-full max-w-[680px]">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-salvia text-sm font-semibold text-salvia">
            03
          </div>
          <h2 className="font-display text-2xl font-semibold text-tinta">{metodologia.capacidades.titulo}</h2>
          <div className="mt-4 space-y-4 text-base leading-relaxed text-tinta/80">
            {metodologia.capacidades.cuerpo.split("\n\n").map((parrafo, i) => (
              <p key={i}>{parrafo}</p>
            ))}
          </div>
        </article>
      </section>

      {/* Sección 6 — Comprensión y expresión — fondo dorado */}
      <section id="comprension-expresion" className="bg-dorado/10 px-4 py-12 sm:px-8 sm:py-16 scroll-mt-24">
        <article className="mx-auto w-full max-w-[680px]">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-dorado text-sm font-semibold text-dorado">
            04
          </div>
          <h2 className="font-display text-2xl font-semibold text-tinta">{metodologia.comprensionExpresion.titulo}</h2>
          <div className="mt-4 space-y-4 text-base leading-relaxed text-tinta/80">
            {metodologia.comprensionExpresion.cuerpo.split("\n\n").map((parrafo, i) => (
              <p key={i}>{parrafo}</p>
            ))}
          </div>
        </article>
      </section>

      {/* Sección 7 — Datos del mercado — fondo teal */}
      <section id="datos-mercado" className="bg-teal/10 px-4 py-12 sm:px-8 sm:py-16 scroll-mt-24">
        <article className="mx-auto w-full max-w-[680px]">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-teal text-sm font-semibold text-teal">
            05
          </div>
          <h2 className="font-display text-2xl font-semibold text-tinta">{metodologia.datosMercado.titulo}</h2>
          <div className="mt-4 space-y-4 text-base leading-relaxed text-tinta/80">
            {metodologia.datosMercado.cuerpo.split("\n\n").map((parrafo, i) => (
              <p key={i}>{parrafo}</p>
            ))}
          </div>
        </article>
      </section>

      {/* Sección 8 — Lo que no hacemos — fondo papel */}
      <section id="lo-que-no-hacemos" className="bg-papel px-4 py-12 sm:px-8 sm:py-16 scroll-mt-24">
        <article className="mx-auto w-full max-w-[680px]">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-coral text-sm font-semibold text-coral">
            06
          </div>
          <h2 className="font-display text-2xl font-semibold text-tinta">{metodologia.loQueNoHacemos.titulo}</h2>
          <ul className="mt-4 space-y-3">
            {metodologia.loQueNoHacemos.items.map((item) => (
              <li key={item} className="flex gap-3 text-base leading-relaxed text-tinta/80">
                <span aria-hidden="true" className="mt-1 text-coral shrink-0">—</span>
                {item}
              </li>
            ))}
          </ul>
        </article>
      </section>

      {/* Sección 9 — Estado de desarrollo — fondo papel */}
      <section id="estado-desarrollo" className="bg-papel px-4 py-12 sm:px-8 sm:py-16 scroll-mt-24">
        <article className="mx-auto w-full max-w-[680px]">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-salvia text-sm font-semibold text-salvia">
            07
          </div>
          <h2 className="font-display text-2xl font-semibold text-tinta">{metodologia.estadoDesarrollo.titulo}</h2>
          <div className="mt-4 space-y-4 text-base leading-relaxed text-tinta/80">
            {metodologia.estadoDesarrollo.cuerpo.split("\n\n").map((parrafo, i) => (
              <p key={i}>{parrafo}</p>
            ))}
          </div>
        </article>
      </section>

      {/* Cierre — fondo papel */}
      <section className="bg-papel px-4 py-12 sm:px-8 sm:py-16 text-center">
        <article className="mx-auto w-full max-w-[680px]">
          <div className="flex flex-col items-center gap-6">
            <Link
              href={metodologia.cierre.probarHref}
              className="rounded-[14px] bg-coral px-6 py-3 text-base font-medium text-blanco-papel shadow-[0_12px_32px_-12px_rgba(232,106,79,0.5)] transition hover:opacity-90"
            >
              {metodologia.cierre.probar}
            </Link>
            <p className="max-w-md text-sm text-tinta/60">
              {metodologia.cierre.contacto.slice(0, metodologia.cierre.contacto.indexOf("colegios@miraiapp.cl"))}
              <a
                href={metodologia.cierre.contactoMailto}
                className="font-cuerpo text-coral underline transition hover:opacity-80"
              >
                colegios@miraiapp.cl
              </a>
            </p>
          </div>
        </article>
      </section>
    </main>
  );
}
