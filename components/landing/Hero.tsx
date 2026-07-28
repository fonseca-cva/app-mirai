'use client'

import Link from "next/link"
import { useReducedMotion } from "framer-motion"
import { FondoCapas, NUBE_RAPIDA, NUBE_PATH } from "@/components/origami/FondoCapas"
import { GruaOrigami } from "@/components/origami/GruaOrigami"
import { AvionPapel } from "@/components/origami/AvionPapel"
import { Header } from "@/components/landing/Header"
import { hero } from "@/lib/config/textos"

export function Hero() {
  const reducedMotion = !!useReducedMotion()
  return (
    <>
      <Header />

      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-20 text-center sm:px-8">
        <FondoCapas />

        {/* Avión detrás de capas medias */}
        <AvionPapel animar prefersReducedMotion={reducedMotion} />
        <div className="relative z-10 -mt-[190px] flex flex-col items-center gap-6">
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

        {/* Nube rápida: pasa por delante de todo (textos incluidos) */}
        <svg
          viewBox="0 0 120 60"
          className="pointer-events-none absolute left-0 z-20"
          style={{
            top: NUBE_RAPIDA.top,
            width: NUBE_RAPIDA.ancho,
            height: NUBE_RAPIDA.ancho * 0.5,
            animation: reducedMotion
              ? undefined
              : `nube-deriva ${NUBE_RAPIDA.dur}s linear ${NUBE_RAPIDA.delay}s infinite both`,
          }}
          fill="none"
        >
          <path d={NUBE_PATH} fill="#FFFFFF" />
        </svg>
      </section>
    </>
  );
}
