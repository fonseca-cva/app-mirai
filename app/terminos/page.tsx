import type { Metadata } from "next";
import { paginaEnConstruccion } from "@/lib/config/textos";

export const metadata: Metadata = {
  title: "Términos de uso — Mirai",
  description:
    "Términos y condiciones de uso del test vocacional Mirai.",
  openGraph: {
    title: "Términos de uso — Mirai",
    description:
      "Términos y condiciones de uso del test vocacional Mirai.",
    locale: "es_CL",
    type: "website",
  },
};

export default function TerminosPage() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-display text-3xl font-semibold">Términos — {paginaEnConstruccion.titulo}</h1>
      <p className="max-w-md text-tinta/70">{paginaEnConstruccion.texto}</p>
    </section>
  );
}
