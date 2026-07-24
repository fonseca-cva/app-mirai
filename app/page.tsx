import { Hero } from "@/components/landing/Hero";
import { ComoFunciona } from "@/components/landing/ComoFunciona";
import { TeaserExperiencia } from "@/components/landing/TeaserExperiencia";
import { TeaserInforme } from "@/components/landing/TeaserInforme";
import { Respaldo } from "@/components/landing/Respaldo";
import { ParaColegios } from "@/components/landing/ParaColegios";
import { Contacto } from "@/components/landing/Contacto";
import { Footer } from "@/components/landing/Footer";
import { PapelRasgado } from "@/components/origami/PapelRasgado";

// Tono aproximado de la sección Respaldo (bg-salvia/15 sobre papel), para que
// el corte rasgado que sigue a esa sección "sea" su propio papel.
const TONO_RESPALDO = "#E5E6DB";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <ComoFunciona />
      <PapelRasgado />
      <TeaserExperiencia />
      <PapelRasgado />
      <TeaserInforme />
      <PapelRasgado />
      <Respaldo />
      <PapelRasgado colorRelleno={TONO_RESPALDO} />
      <ParaColegios />
      <PapelRasgado />
      <Contacto />
      <PapelRasgado />
      <Footer />
    </main>
  );
}
