'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { GruaOrigami } from "@/components/origami/GruaOrigami"
import { nav } from "@/lib/config/textos"

export function Header() {
  const pathname = usePathname()
  const enHome = pathname === "/"
  const [abierto, setAbierto] = useState(false)

  // Los anclas (#seccion) viven en la home. Si estamos en otra página,
  // hay que anteponer "/" para volver a la home y saltar a la sección.
  const resolverHref = (href: string) => (href.startsWith("#") && !enHome ? `/${href}` : href)

  return (
    <header className="fixed top-0 z-50 w-full bg-papel/90 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg font-semibold"
          onClick={() => setAbierto(false)}
        >
          <GruaOrigami className="h-8 w-8" />
          {nav.logo}
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {nav.anclas.map((ancla) => (
            <a key={ancla.href} href={resolverHref(ancla.href)} className="text-sm hover:text-coral">
              {ancla.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/experiencia"
            className="rounded-[14px] bg-coral px-4 py-2 text-sm font-medium text-blanco-papel transition hover:opacity-90"
          >
            {nav.cta}
          </Link>

          {/* Botón hamburguesa — solo mobile */}
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-tinta md:hidden"
            aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={abierto}
            onClick={() => setAbierto((v) => !v)}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              {abierto ? (
                <>
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Menú desplegable — solo mobile */}
      {abierto && (
        <div className="flex flex-col gap-1 border-t border-tinta/10 bg-papel px-4 py-4 md:hidden">
          {nav.anclas.map((ancla) => (
            <a
              key={ancla.href}
              href={resolverHref(ancla.href)}
              className="rounded-lg px-2 py-2 text-sm text-tinta hover:bg-tinta/5 hover:text-coral"
              onClick={() => setAbierto(false)}
            >
              {ancla.label}
            </a>
          ))}
        </div>
      )}
    </header>
  )
}
