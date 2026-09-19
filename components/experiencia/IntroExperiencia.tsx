import { experienciaAudioAmbiente, experienciaIntro } from "@/lib/config/textos";

interface IntroExperienciaProps {
  // Mejora Bloque A: la pregunta de audio ambiente reemplaza el CTA único — el
  // sonido nunca hace autoplay, siempre nace de este gesto explícito (conAudio).
  onEmpezar: (conAudio: boolean) => void;
  // Mientras se crea/confirma la sesión padre, ambos CTA quedan deshabilitados:
  // no se puede avanzar a la aspiración antes de que la sesión esté asegurada.
  creando?: boolean;
  // Si no se pudo asegurar la sesión, se explica y se ofrece reintentar (los
  // mismos botones, ya habilitados).
  error?: string | null;
}

export function IntroExperiencia({ onEmpezar, creando = false, error = null }: IntroExperienciaProps) {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center sm:px-8">
      <h1 className="max-w-lg font-display text-3xl font-semibold sm:text-4xl">{experienciaIntro.titulo}</h1>
      <p className="max-w-md text-lg text-tinta/80">{experienciaIntro.texto}</p>
      <p className="max-w-md text-tinta/80">{experienciaAudioAmbiente.pregunta}</p>
      {error && (
        <p className="max-w-md rounded-[14px] border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-tinta/90">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => onEmpezar(true)}
          disabled={creando}
          className="rounded-[14px] bg-coral px-8 py-3 text-base font-medium text-blanco-papel transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {creando ? "Preparando…" : experienciaAudioAmbiente.conSonido}
        </button>
        <button
          onClick={() => onEmpezar(false)}
          disabled={creando}
          className="rounded-[14px] border border-tinta/20 px-8 py-3 text-base font-medium transition enabled:hover:border-tinta/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {experienciaAudioAmbiente.sinSonido}
        </button>
      </div>
      <p className="text-sm text-tinta/60">{experienciaIntro.nota}</p>
    </section>
  );
}
