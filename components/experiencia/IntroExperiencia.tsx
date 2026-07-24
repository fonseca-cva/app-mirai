import { experienciaIntro } from "@/lib/config/textos";

interface IntroExperienciaProps {
  onEmpezar: () => void;
}

export function IntroExperiencia({ onEmpezar }: IntroExperienciaProps) {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center sm:px-8">
      <h1 className="max-w-lg font-display text-3xl font-semibold sm:text-4xl">{experienciaIntro.titulo}</h1>
      <p className="max-w-md text-lg text-tinta/80">{experienciaIntro.texto}</p>
      <button
        onClick={onEmpezar}
        className="rounded-[14px] bg-coral px-8 py-3 text-base font-medium text-blanco-papel transition hover:opacity-90"
      >
        {experienciaIntro.cta}
      </button>
      <p className="text-sm text-tinta/60">{experienciaIntro.nota}</p>
    </section>
  );
}
