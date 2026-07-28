import type { Metadata } from "next";
import Link from "next/link";
import { GruaOrigami } from "@/components/origami/GruaOrigami";
import { IndiceMetodologia } from "@/components/metodologia/IndiceMetodologia";
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
// SVG decorativo estático: pliegue abstracto de papel
// ---------------------------------------------------------------------------
function PliegueAbstracto({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 80"
      className={className}
      fill="none"
      aria-hidden="true"
      role="img"
      aria-label="Pliegue de papel abstracto"
    >
      <polygon points="0,80 60,0 120,80" fill="currentColor" className="text-salvia/15" />
      <polygon points="0,80 60,0 60,80" fill="currentColor" className="text-salvia/25" />
      <line x1="60" y1="0" x2="60" y2="80" stroke="currentColor" className="text-salvia/40" strokeWidth="1" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Tres pliegues rotulados para la sección de pilares
// ---------------------------------------------------------------------------
function TresPliegues() {
  const pilares = [
    { label: "Intereses", color: "text-coral" },
    { label: "Capacidades", color: "text-salvia" },
    { label: "Mercado", color: "text-dorado" },
  ];

  return (
    <div className="my-10 flex flex-wrap justify-center gap-6" aria-hidden="true">
      {pilares.map((p) => (
        <div key={p.label} className="flex flex-col items-center gap-2">
          <svg viewBox="0 0 80 60" className="h-20 w-24" fill="none" aria-hidden="true">
            <polygon points="0,60 40,0 80,60" fill="currentColor" className={`${p.color} opacity-[0.18]`} />
            <polygon points="0,60 40,0 40,60" fill="currentColor" className={`${p.color} opacity-[0.30]`} />
            <line x1="40" y1="0" x2="40" y2="60" stroke="currentColor" className={`${p.color} opacity-40`} strokeWidth="1" />
          </svg>
          <span className={`text-xs font-semibold uppercase tracking-widest ${p.color}`}>{p.label}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente para sección de texto con cuerpo que respeta párrafos (\n\n)
// ---------------------------------------------------------------------------
function SeccionTexto({
  id,
  titulo,
  cuerpo,
  children,
}: {
  id?: string;
  titulo: string;
  cuerpo?: string;
  children?: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-display text-2xl font-semibold text-tinta">{titulo}</h2>
      {cuerpo && (
        <div className="mt-4 space-y-4 text-base leading-relaxed text-tinta/80">
          {cuerpo.split("\n\n").map((parrafo, i) => (
            <p key={i}>{parrafo}</p>
          ))}
        </div>
      )}
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------
export default function MetodologiaPage() {
  return (
    <main className="mx-auto flex flex-1 flex-col">
      {/* Navegación superior mínima */}
      <header className="flex items-center gap-3 px-4 pt-6 sm:px-8">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold text-tinta transition hover:text-coral">
          <GruaOrigami className="h-7 w-7" />
          Mirai
        </Link>
        <span className="text-xs text-tinta/30">/</span>
        <span className="text-sm text-tinta/50">Metodología</span>
      </header>

      <article className="mx-auto w-full max-w-[680px] px-4 py-12 sm:px-6 sm:py-16">
        {/* Encabezado */}
        <section className="mb-8">
          <PliegueAbstracto className="mb-6 h-16 w-24" />
          <h1 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
            {metodologia.encabezado.titulo}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-tinta/70">
            {metodologia.encabezado.bajada}
          </p>
        </section>

        {/* Índice */}
        <IndiceMetodologia />

        {/* Sección 2 — Tres pilares */}
        <div className="space-y-16">
          <SeccionTexto id="tres-pilares" titulo={metodologia.tresPilares.titulo} cuerpo={metodologia.tresPilares.cuerpo}>
            <TresPliegues />
          </SeccionTexto>

          {/* Sección 3 — Intereses */}
          <SeccionTexto id="intereses" titulo={metodologia.intereses.titulo} cuerpo={metodologia.intereses.cuerpo} />

          {/* Sección 4 — Capacidades */}
          <SeccionTexto id="capacidades" titulo={metodologia.capacidades.titulo} cuerpo={metodologia.capacidades.cuerpo} />

          {/* Sección 5 — Comprensión y expresión */}
          <SeccionTexto id="comprension-expresion" titulo={metodologia.comprensionExpresion.titulo} cuerpo={metodologia.comprensionExpresion.cuerpo} />

          {/* Sección 6 — Datos del mercado */}
          <SeccionTexto id="datos-mercado" titulo={metodologia.datosMercado.titulo} cuerpo={metodologia.datosMercado.cuerpo} />

          {/* Sección 7 — Lo que no hacemos (recuadro diferenciado) */}
          <section id="lo-que-no-hacemos" className="scroll-mt-24 rounded-[14px] border border-coral/20 bg-blanco-papel p-6 shadow-sm sm:p-8">
            <h2 className="font-display text-2xl font-semibold text-tinta">{metodologia.loQueNoHacemos.titulo}</h2>
            <ul className="mt-4 space-y-3">
              {metodologia.loQueNoHacemos.items.map((item) => (
                <li key={item} className="flex gap-3 text-base leading-relaxed text-tinta/80">
                  <span aria-hidden="true" className="mt-1 text-coral shrink-0">—</span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Sección 8 — Estado de desarrollo */}
          <SeccionTexto id="estado-desarrollo" titulo={metodologia.estadoDesarrollo.titulo} cuerpo={metodologia.estadoDesarrollo.cuerpo} />
        </div>

        {/* Cierre */}
        <footer className="mt-16 border-t border-tinta/10 pt-10 text-center">
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
        </footer>
      </article>
    </main>
  );
}
