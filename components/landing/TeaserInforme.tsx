import { teaserInforme } from "@/lib/config/textos";

export function TeaserInforme() {
  return (
    <section className="flex flex-col items-center gap-8 px-4 py-24 text-center sm:px-8">
      <svg viewBox="0 0 160 120" className="h-32 w-40" role="img" aria-label="Informe desplegándose como un mapa de papel">
        <polygon points="20,20 140,20 140,100 20,100" fill="#F7F2E9" stroke="#E8E0D0" strokeWidth="2" />
        <polygon points="20,20 80,20 80,100 20,100" fill="#FFFDF8" />
        <line x1="35" y1="40" x2="65" y2="40" stroke="#D9A441" strokeWidth="3" />
        <line x1="35" y1="55" x2="65" y2="55" stroke="#7FA08C" strokeWidth="3" />
        <line x1="95" y1="40" x2="125" y2="40" stroke="#E86A4F" strokeWidth="3" />
        <line x1="95" y1="55" x2="125" y2="55" stroke="#D9A441" strokeWidth="3" />
      </svg>
      <h2 className="text-3xl font-semibold">{teaserInforme.titulo}</h2>
      <ul className="max-w-md space-y-2 text-left text-tinta/80">
        {teaserInforme.bullets.map((bullet) => (
          <li key={bullet} className="flex gap-2">
            <span aria-hidden="true" className="text-salvia">
              ·
            </span>
            {bullet}
          </li>
        ))}
      </ul>
      <p className="text-sm text-tinta/60">{teaserInforme.mencion}</p>
    </section>
  );
}
