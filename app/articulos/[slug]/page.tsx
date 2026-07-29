import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticuloBySlug, getSlugs, getArticulos } from "@/lib/articulos";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";

// ---------------------------------------------------------------------------
// Generación estática (Next 16: params debe ser async)
// ---------------------------------------------------------------------------
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return getSlugs().map((slug) => ({ slug }));
}

// ---------------------------------------------------------------------------
// Metadatos dinámicos (Next 16: props es Promise)
// ---------------------------------------------------------------------------
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const articulo = getArticuloBySlug(slug);

  if (!articulo) return {};

  return {
    title: `${articulo.titulo} — Mirai`,
    description: articulo.resumen,
    openGraph: {
      title: `${articulo.titulo} — Mirai`,
      description: articulo.resumen,
      locale: "es_CL",
      type: "article",
      publishedTime: articulo.fecha,
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers para formatear fecha
// ---------------------------------------------------------------------------
function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("es-CL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Mapa de CTAs
// ---------------------------------------------------------------------------
const CTA_MAP: Record<string, { label: string; href: string }> = {
  experiencia: {
    label: "Descubrir mi perfil",
    href: "/experiencia",
  },
  metodologia: {
    label: "Ver metodología",
    href: "/metodologia",
  },
};

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------
export default async function ArticuloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const articulo = getArticuloBySlug(slug);

  if (!articulo) {
    notFound();
  }

  // Artículos relacionados
  const relacionados = articulo.articulos_relacionados
    .map((s) => getArticuloBySlug(s))
    .filter(Boolean);

  // Medios listos — se muestran; pendientes/no_producido se omiten
  const mediosListos = articulo.medios.filter((m) => m.estado === "listo");

  // CTA
  const ctaConfig = CTA_MAP[articulo.cta];

  return (
    <main className="flex flex-1 flex-col">
      <Header />

      {/* Breadcrumb */}
      <nav aria-label="Navegación secundaria" className="bg-papel px-4 pt-24 sm:px-8">
        <div className="mx-auto w-full max-w-[680px]">
          <ol className="flex items-center gap-1.5 text-xs text-tinta/40">
            <li>
              <Link href="/articulos" className="hover:text-coral transition">
                Artículos
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-tinta/60 truncate">{articulo.titulo}</li>
          </ol>
        </div>
      </nav>

      {/* Encabezado */}
      <article className="bg-papel px-4 py-10 sm:px-8 sm:py-14">
        <div className="mx-auto w-full max-w-[680px] space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-tinta/5 px-3 py-0.5 text-xs font-medium text-tinta/60">
              {articulo.molde}
            </span>
            <span className="rounded-full bg-coral/10 px-3 py-0.5 text-xs font-medium text-coral/80">
              {articulo.publico === "estudiante"
                ? "Estudiante"
                : articulo.publico === "apoderado"
                  ? "Apoderado"
                  : "Orientador"}
            </span>
          </div>

          <h1 className="font-display text-3xl font-semibold leading-tight text-tinta sm:text-4xl">
            {articulo.titulo}
          </h1>

          <p className="text-base leading-relaxed text-tinta/70">
            {articulo.resumen}
          </p>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-tinta/40">
            <time dateTime={articulo.fecha}>
              Publicado el {formatDate(articulo.fecha)}
            </time>
          </div>
        </div>
      </article>

      {/* Cuerpo del artículo */}
      <section className="bg-papel px-4 pb-10 sm:px-8">
        <div
          className="mx-auto w-full max-w-[680px] prose-custom"
          dangerouslySetInnerHTML={{ __html: articulo.contenidoHtml }}
        />
      </section>

      {/* Medios listos (si hay) */}
      {mediosListos.length > 0 && (
        <section className="bg-papel px-4 pb-10 sm:px-8">
          <div className="mx-auto w-full max-w-[680px] space-y-6">
            {mediosListos.map((medio, i) => (
              <figure key={i}>
                {/* Aquí se insertará el medio cuando esté listo */}
                <figcaption className="mt-2 text-xs text-tinta/40">
                  {medio.descripcion}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Recuadro de fuentes */}
      {articulo.datos_usados.length > 0 && (
        <section className="bg-salvia/10 px-4 py-12 sm:px-8">
          <div className="mx-auto w-full max-w-[680px]">
            <h2 className="font-display text-xl font-semibold text-tinta mb-4">
              Fuentes y datos utilizados
            </h2>
            <ul className="space-y-2">
              {articulo.datos_usados.map((fuente, i) => (
                <li
                  key={i}
                  className="flex gap-3 text-sm leading-relaxed text-tinta/70"
                >
                  <span aria-hidden="true" className="mt-1 text-salvia shrink-0">
                    —
                  </span>
                  <span>{fuente}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* CTA */}
      {ctaConfig && (
        <section className="bg-coral/10 px-4 py-12 sm:px-8 text-center">
          <div className="mx-auto w-full max-w-[680px]">
            <Link
              href={ctaConfig.href}
              className="inline-block rounded-[14px] bg-coral px-6 py-3 text-base font-medium text-blanco-papel shadow-[0_12px_32px_-12px_rgba(232,106,79,0.5)] transition hover:opacity-90"
            >
              {ctaConfig.label}
            </Link>
          </div>
        </section>
      )}

      {/* Artículos relacionados */}
      {relacionados.length > 0 && (
        <section className="bg-papel px-4 py-12 sm:px-8">
          <div className="mx-auto w-full max-w-[680px]">
            <h2 className="font-display text-xl font-semibold text-tinta mb-4">
              Artículos relacionados
            </h2>
            <ul className="space-y-3">
              {relacionados.map((rel) => (
                <li key={rel!.slug}>
                  <Link
                    href={`/articulos/${rel!.slug}`}
                    className="group flex items-center gap-3 rounded-xl border border-tinta/10 bg-blanco-papel p-4 transition hover:border-coral/30 hover:shadow-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-display text-base font-medium text-tinta group-hover:text-coral transition">
                        {rel!.titulo}
                      </p>
                      <p className="text-xs text-tinta/50 mt-0.5">
                        {rel!.molde}
                      </p>
                    </div>
                    <svg
                      className="ml-auto h-4 w-4 shrink-0 text-tinta/30 transition group-hover:text-coral group-hover:translate-x-0.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}
