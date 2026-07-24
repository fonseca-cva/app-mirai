import { paginaEnConstruccion } from "@/lib/config/textos";

export default function PrivacidadPage() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-display text-3xl font-semibold">Privacidad — {paginaEnConstruccion.titulo}</h1>
      <p className="max-w-md text-tinta/70">{paginaEnConstruccion.texto}</p>
    </section>
  );
}
