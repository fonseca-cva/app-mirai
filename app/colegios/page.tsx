import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { ContadoresDestacados } from "@/components/landing/ContadoresDestacados";
import { colegios, mailtoColegios } from "@/lib/config/textos";

// Metadata SEO + Open Graph. Mismo patrón que /metodologia (objeto estático en un
// Server Component), que es la convención de esta versión de Next.
export const metadata: Metadata = {
  title: colegios.metadata.titulo,
  description: colegios.metadata.descripcion,
  openGraph: {
    title: colegios.metadata.titulo,
    description: colegios.metadata.descripcion,
    locale: "es_CL",
    type: "website",
  },
};

// Anclas de la propia página, para el índice interno.
const ANCLAS = [
  { href: "#problema", label: "El problema" },
  { href: "#estudiante", label: "Cada estudiante" },
  { href: "#colegio", label: "Tu colegio" },
  { href: "#fundador", label: "Colegio Fundador" },
  { href: "#salvaguardas", label: "Salvaguardas" },
  { href: "#hora", label: "La hora pedagógica" },
  { href: "#preguntas", label: "Preguntas" },
];

/**
 * Página /colegios — Programa de Colegios Fundadores.
 *
 * Reutiliza el sistema existente: Header y Footer de la landing, las bandas planas a
 * sangre completa de `globals.css` (@theme), la tarjeta de papel blanco con radio de
 * 14px que usa ParaColegios, y Fraunces (font-display) para títulos + Inter para
 * cuerpo, ambos ya cargados en el layout raíz.
 *
 * Sin componentes nuevos: el objetivo es que se sienta parte del mismo sitio.
 */
export default function ColegiosPage() {
  return (
    <main className="flex flex-1 flex-col">
      <Header />

      {/* ── 1. Hero ────────────────────────────────────────────────────── */}
      <section className="bg-papel px-4 pt-28 pb-14 sm:px-8 sm:pt-36 sm:pb-20">
        <div className="mx-auto w-full max-w-[760px]">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-coral">
            {colegios.hero.etiqueta}
          </p>
          <h1 className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-5xl">
            {colegios.hero.titulo}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-tinta/75">{colegios.hero.bajada}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={mailtoColegios()}
              className="rounded-[14px] bg-coral px-6 py-3 text-center text-base font-medium text-blanco-papel transition hover:opacity-90"
            >
              {colegios.hero.cta}
            </a>
            <a
              href="#estudiante"
              className="rounded-[14px] border border-tinta/20 px-6 py-3 text-center text-base font-medium transition hover:border-tinta/40"
            >
              {colegios.hero.ctaSecundario}
            </a>
          </div>

          {/* Nota de honestidad: no estamos validados todavía. */}
          <p className="mt-6 max-w-[640px] border-l-2 border-dorado pl-4 text-sm leading-relaxed text-tinta/65">
            {colegios.hero.notaPiloto}
          </p>
        </div>
      </section>

      {/* Índice interno — navegación de la propia página */}
      <nav aria-label="Secciones de esta página" className="bg-papel px-4 pb-10 sm:px-8">
        <ul className="mx-auto flex w-full max-w-[760px] flex-wrap gap-x-5 gap-y-2 text-sm">
          {ANCLAS.map((a) => (
            <li key={a.href}>
              <a href={a.href} className="text-tinta/60 underline decoration-tinta/20 underline-offset-4 transition hover:text-coral">
                {a.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── 2. El problema ─────────────────────────────────────────────── */}
      <section id="problema" className="scroll-mt-24 bg-papel-sombra px-4 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto w-full max-w-[760px]">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">{colegios.problema.titulo}</h2>
          <p className="mt-3 text-base leading-relaxed text-tinta/70">{colegios.problema.bajada}</p>

          {/* Cifras: cada una con su fuente, siempre visible. */}
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {colegios.problema.cifras.map((c) => (
              <div key={c.texto} className="rounded-[14px] bg-blanco-papel p-5 shadow-sm">
                <p className="font-display text-3xl font-semibold text-coral">{c.valor}</p>
                <p className="mt-2 text-sm leading-snug text-tinta/80">{c.texto}</p>
                <p className="mt-3 text-xs uppercase tracking-wide text-tinta/45">{c.fuente}</p>
              </div>
            ))}
          </div>

          <p className="mt-8 text-base leading-relaxed text-tinta/75">{colegios.problema.cierre}</p>
        </div>
      </section>

      {/* ── 3. Qué vive cada estudiante ────────────────────────────────── */}
      <section id="estudiante" className="scroll-mt-24 bg-papel px-4 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto w-full max-w-[760px]">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">{colegios.estudiante.titulo}</h2>
          <p className="mt-3 text-base leading-relaxed text-tinta/70">{colegios.estudiante.bajada}</p>

          <ol className="mt-10 flex flex-col gap-6">
            {colegios.estudiante.pasos.map((p, i) => (
              <li key={p.titulo} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-salvia/20 font-display text-sm font-semibold text-salvia"
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold">{p.titulo}</h3>
                  <p className="mt-1 text-base leading-relaxed text-tinta/75">{p.texto}</p>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-8 rounded-[14px] border border-salvia/30 bg-salvia/5 p-5 text-sm leading-relaxed text-tinta/80">
            {colegios.estudiante.nota}
          </p>
        </div>
      </section>

      {/* ── 4. Qué recibe el colegio ───────────────────────────────────── */}
      <section id="colegio" className="scroll-mt-24 bg-verde-manzana px-4 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto w-full max-w-[760px]">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">{colegios.colegio.titulo}</h2>
          <p className="mt-3 text-base leading-relaxed text-tinta/75">{colegios.colegio.bajada}</p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {colegios.colegio.entregables.map((e) => (
              <div key={e.titulo} className="rounded-[14px] bg-blanco-papel p-5 shadow-sm">
                <h3 className="font-display text-base font-semibold">{e.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-tinta/75">{e.texto}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 text-sm leading-relaxed text-tinta/70">{colegios.colegio.notaAgregado}</p>
        </div>
      </section>

      {/* ── 5. Qué significa ser Colegio Fundador ──────────────────────── */}
      <section id="fundador" className="scroll-mt-24 bg-papel px-4 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto w-full max-w-[760px]">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">{colegios.fundador.titulo}</h2>
          <p className="mt-3 text-base leading-relaxed text-tinta/70">{colegios.fundador.bajada}</p>

          <ul className="mt-10 flex flex-col gap-6">
            {colegios.fundador.compromisos.map((c) => (
              <li key={c.titulo} className="border-l-2 border-coral/40 pl-5">
                <h3 className="font-display text-lg font-semibold">{c.titulo}</h3>
                <p className="mt-1 text-base leading-relaxed text-tinta/75">{c.texto}</p>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-base leading-relaxed text-tinta/75">{colegios.fundador.cierre}</p>
        </div>
      </section>

      {/* ── 6. Salvaguardas ────────────────────────────────────────────── */}
      <section id="salvaguardas" className="scroll-mt-24 bg-teal-profundo px-4 py-16 text-blanco-papel sm:px-8 sm:py-20">
        <div className="mx-auto w-full max-w-[760px]">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">{colegios.salvaguardas.titulo}</h2>
          <p className="mt-3 text-base leading-relaxed text-blanco-papel/85">{colegios.salvaguardas.bajada}</p>

          <dl className="mt-10 grid gap-6 sm:grid-cols-2">
            {colegios.salvaguardas.items.map((s) => (
              <div key={s.titulo}>
                <dt className="font-display text-base font-semibold">{s.titulo}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-blanco-papel/85">
                  {s.texto}
                  {"enlace" in s && s.enlace && (
                    <>
                      {" "}
                      <Link href={s.enlace} className="underline decoration-blanco-papel/40 underline-offset-4 transition hover:decoration-blanco-papel">
                        {s.enlaceTexto}
                      </Link>
                    </>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── 7. Una hora pedagógica ─────────────────────────────────────── */}
      <section id="hora" className="scroll-mt-24 bg-papel px-4 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto w-full max-w-[760px]">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">{colegios.horaPedagogica.titulo}</h2>
          <p className="mt-3 text-base leading-relaxed text-tinta/70">{colegios.horaPedagogica.bajada}</p>

          <ol className="mt-10 flex flex-col gap-0">
            {colegios.horaPedagogica.pasos.map((p, i) => (
              <li key={p.titulo} className="flex gap-4 border-l border-tinta/15 pb-8 pl-6 last:pb-0">
                <div className="relative">
                  <span
                    aria-hidden="true"
                    className={`absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full ${
                      i === 0 ? "bg-dorado" : i === colegios.horaPedagogica.pasos.length - 1 ? "bg-coral" : "bg-salvia"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-tinta/45">{p.momento}</p>
                  <h3 className="mt-1 font-display text-lg font-semibold">{p.titulo}</h3>
                  <p className="mt-1 text-base leading-relaxed text-tinta/75">{p.texto}</p>
                </div>
              </li>
            ))}
          </ol>

          <p className="mt-6 text-sm leading-relaxed text-tinta/65">{colegios.horaPedagogica.nota}</p>
        </div>
      </section>

      {/* Franja de datos verificados — reutiliza el componente de la landing */}
      <section className="bg-papel-sombra px-4 pb-16 sm:px-8">
        <ContadoresDestacados />
      </section>

      {/* ── 8. Preguntas frecuentes ────────────────────────────────────── */}
      <section id="preguntas" className="scroll-mt-24 bg-papel px-4 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto w-full max-w-[760px]">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">Preguntas frecuentes</h2>

          {/* <details>/<summary>: accesible por teclado y sin JavaScript. */}
          <div className="mt-8 flex flex-col divide-y divide-tinta/10 border-y border-tinta/10">
            {colegios.faq.map((f) => (
              <details key={f.pregunta} className="group py-4">
                <summary className="cursor-pointer list-none font-display text-base font-semibold marker:content-none">
                  <span className="flex items-start justify-between gap-4">
                    {f.pregunta}
                    <span
                      aria-hidden="true"
                      className="mt-1 shrink-0 text-tinta/40 transition group-open:rotate-45"
                    >
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-tinta/75">
                  {f.respuesta}
                  {"enlace" in f && f.enlace && (
                    <>
                      {" "}
                      <Link href={f.enlace} className="text-coral underline underline-offset-4">
                        {f.enlaceTexto}
                      </Link>
                    </>
                  )}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. CTA ─────────────────────────────────────────────────────── */}
      <section className="bg-papel px-4 pb-20 sm:px-8">
        <div className="mx-auto w-full max-w-[760px] rounded-[14px] bg-blanco-papel p-8 text-center shadow-sm sm:p-10">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">{colegios.cta.titulo}</h2>
          <p className="mx-auto mt-3 max-w-[520px] text-base leading-relaxed text-tinta/75">
            {colegios.cta.bajada}
          </p>
          <a
            href={mailtoColegios()}
            className="mt-8 inline-block rounded-[14px] bg-coral px-8 py-3 text-base font-medium text-blanco-papel transition hover:opacity-90"
          >
            {colegios.cta.boton}
          </a>
          <p className="mt-4 text-sm text-tinta/55">{colegios.cta.alternativa}</p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
