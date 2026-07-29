import type { Metadata } from "next";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { ArticulosIndexClient } from "./ArticulosIndexClient";
import { getArticulos, getUniqueMoldes } from "@/lib/articulos";

export const metadata: Metadata = {
  title: "Artículos — Mirai",
  description:
    "Guías, análisis y datos sobre orientación vocacional, carreras, empleabilidad y educación superior en Chile.",
  openGraph: {
    title: "Artículos — Mirai",
    description:
      "Guías, análisis y datos sobre orientación vocacional, carreras, empleabilidad y educación superior en Chile.",
    locale: "es_CL",
    type: "website",
  },
};

export default function ArticulosPage() {
  const articulos = getArticulos();
  const moldes = getUniqueMoldes();

  return (
    <main className="flex flex-1 flex-col">
      <Header />

      <section className="bg-papel px-4 py-24 sm:px-8 sm:py-28">
        <article className="mx-auto w-full max-w-[680px]">
          <h1 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
            Artículos
          </h1>
          <p className="mt-3 text-base leading-relaxed text-tinta/70">
            Guías, análisis y datos sobre orientación vocacional en Chile.
          </p>
        </article>
      </section>

      <section className="bg-papel px-4 pb-20 sm:px-8">
        <div className="mx-auto w-full max-w-[680px]">
          <ArticulosIndexClient articulos={articulos} moldes={moldes} />
        </div>
      </section>

      <Footer />
    </main>
  );
}
