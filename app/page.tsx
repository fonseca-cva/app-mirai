import type { Metadata } from "next";
import { Hero } from "@/components/landing/Hero";
import { ComoFunciona } from "@/components/landing/ComoFunciona";
import { TeaserExperiencia } from "@/components/landing/TeaserExperiencia";
import { TeaserInforme } from "@/components/landing/TeaserInforme";
import { Respaldo } from "@/components/landing/Respaldo";
import { DatosDestacados } from "@/components/landing/DatosDestacados";
import { Apoderados } from "@/components/landing/Apoderados";
import { ParaColegios } from "@/components/landing/ParaColegios";
import { Contacto } from "@/components/landing/Contacto";
import { Footer } from "@/components/landing/Footer";
import { organizationSchema } from "@/lib/schemas";

export const metadata: Metadata = {
  title: "Mirai — Test vocacional con datos reales de Chile",
  description:
    "Un test vocacional interactivo con datos reales de empleabilidad en Chile. Descubre qué estudiar según tus intereses, capacidades y el mercado laboral. Orientación vocacional sin preguntas de horóscopo.",
  openGraph: {
    title: "Mirai — Test vocacional con datos reales de Chile",
    description:
      "Un test vocacional interactivo con datos reales de empleabilidad en Chile. Descubre qué estudiar según tus intereses, capacidades y el mercado laboral.",
    locale: "es_CL",
    type: "website",
  },
};

// Estilo referencia: bandas de color planas a sangre completa, alternadas
// (crema → teal → crema → gris → teal → verde → crema → teal), con
// transiciones rectas — sin cortes de papel rasgado.
export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema()),
        }}
      />
      <main className="flex flex-1 flex-col">
        <Hero />
        <ComoFunciona />
        <TeaserExperiencia />
        <TeaserInforme />
        <Respaldo />
        <DatosDestacados />
        <Apoderados />
        <ParaColegios />
        <Contacto />
        <Footer />
      </main>
    </>
  );
}
