import Link from "next/link";
import { footer } from "@/lib/config/textos";

export function Footer() {
  return (
    <footer className="flex flex-col items-center gap-3 border-t border-tinta/10 px-4 py-8 text-center text-sm text-tinta/70 sm:flex-row sm:justify-between sm:px-8">
      <p>{footer.copyright}</p>
      <nav className="flex gap-4">
        {footer.enlaces.map((enlace) => (
          <Link key={enlace.href} href={enlace.href} className="hover:text-coral">
            {enlace.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
