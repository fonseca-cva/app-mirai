import { experienciaAudioAmbiente, experienciaIntro } from "@/lib/config/textos";

interface IntroExperienciaProps {
  // Mejora Bloque A: la pregunta de audio ambiente reemplaza el CTA único — el
  // sonido nunca hace autoplay, siempre nace de este gesto explícito (conAudio).
  onEmpezar: (conAudio: boolean) => void;
}

export function IntroExperiencia({ onEmpezar }: IntroExperienciaProps) {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center sm:px-8">
      <h1 className="max-w-lg font-display text-3xl font-semibold sm:text-4xl">{experienciaIntro.titulo}</h1>
      <p className="max-w-md text-lg text-tinta/80">{experienciaIntro.texto}</p>
      <p className="max-w-md text-tinta/80">{experienciaAudioAmbiente.pregunta}</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => onEmpezar(true)}
          className="rounded-[14px] bg-coral px-8 py-3 text-base font-medium text-blanco-papel transition hover:opacity-90"
        >
          {experienciaAudioAmbiente.conSonido}
        </button>
        <button
          onClick={() => onEmpezar(false)}
          className="rounded-[14px] border border-tinta/20 px-8 py-3 text-base font-medium transition hover:border-tinta/40"
        >
          {experienciaAudioAmbiente.sinSonido}
        </button>
      </div>
      <p className="text-sm text-tinta/60">{experienciaIntro.nota}</p>
    </section>
  );
}
