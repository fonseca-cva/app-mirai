import Link from "next/link";
import { GruaOrigami } from "@/components/origami/GruaOrigami";
import { footer, nav } from "@/lib/config/textos";

// Footer teal profundo centrado (estilo referencia): logo al centro,
// enlaces y copyright en blanco atenuado.
export function Footer() {
  return (
    <footer className="flex flex-col items-center gap-6 bg-teal-profundo px-4 py-16 text-center text-sm text-blanco-papel/80 sm:px-8">
      <div className="flex flex-col items-center gap-2">
        <GruaOrigami className="h-10 w-10" />
        <p className="font-display text-xl font-semibold uppercase tracking-[0.3em] text-blanco-papel">
          {nav.logo}
        </p>
      </div>
      <nav className="flex gap-6">
        {footer.enlaces.map((enlace) => (
          <Link key={enlace.href} href={enlace.href} className="transition hover:text-blanco-papel">
            {enlace.label}
          </Link>
        ))}
      </nav>
      <p className="text-blanco-papel/60">{footer.copyright}</p>
    </footer>
  );
}
