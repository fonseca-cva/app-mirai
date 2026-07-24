'use client'

import Link from "next/link"
import { useReducedMotion } from "motion/react"
import { FondoCapas } from "@/components/origami/FondoCapas"
import { GruaOrigami } from "@/components/origami/GruaOrigami"
import { AvionPapel } from "@/components/origami/AvionPapel"
import NubesDeriva from "@/components/origami/NubesDeriva"
import { hero, nav } from "@/lib/config/textos"

export function Hero() {
  const reducedMotion = !!useReducedMotion()
  return (
    <>
      <header className="fixed top-0 z-50 flex w-full items-center justify-between gap-4 bg-papel/90 px-4 py-3 backdrop-blur-sm sm:px-8">
        <a href="#" className="flex items-center gap-2 font-display text-lg font-semibold">
          <GruaOrigami className="h-8 w-8" />
          {nav.logo}
        </a>
        <nav className="hidden items-center gap-6 md:flex">
          {nav.anclas.map((ancla) => (
            <a key={ancla.href} href={ancla.href} className="text-sm hover:text-coral">
              {ancla.label}
            </a>
          ))}
        </nav>
        <Link
          href="/experiencia"
          className="rounded-[14px] bg-coral px-4 py-2 text-sm font-medium text-blanco-papel transition hover:opacity-90"
        >
          {nav.cta}
        </Link>
      </header>

      <NubesDeriva prefersReducedMotion={reducedMotion} />

      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-20 text-center sm:px-8">
        <FondoCapas />

        {/* Avión detrás de capas medias */}
        <AvionPapel animar prefersReducedMotion={reducedMotion} />
        <div className="relative z-10 flex flex-col items-center gap-6">
          <GruaOrigami className="h-24 w-24" animarEntrada />
          <h1 className="max-w-2xl text-4xl font-semibold sm:text-6xl">{hero.titular}</h1>
          <p className="max-w-xl text-lg text-tinta/80">{hero.subtitulo}</p>
          <Link
            href="/experiencia"
            className="rounded-[14px] bg-coral px-6 py-3 text-base font-medium text-blanco-papel shadow-[0_12px_32px_-12px_rgba(232,106,79,0.5)] transition hover:opacity-90"
          >
            {hero.cta}
          </Link>
        </div>
      </section>
    </>
  );
}
