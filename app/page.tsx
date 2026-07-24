import { Hero } from "@/components/landing/Hero";
import { ComoFunciona } from "@/components/landing/ComoFunciona";
import { TeaserExperiencia } from "@/components/landing/TeaserExperiencia";
import { TeaserInforme } from "@/components/landing/TeaserInforme";
import { Respaldo } from "@/components/landing/Respaldo";
import { ParaColegios } from "@/components/landing/ParaColegios";
import { Contacto } from "@/components/landing/Contacto";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <ComoFunciona />
      <TeaserExperiencia />
      <TeaserInforme />
      <Respaldo />
      <ParaColegios />
      <Contacto />
      <Footer />
    </main>
  );
}
