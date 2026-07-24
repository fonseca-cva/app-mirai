import type { ReactNode } from "react";

interface PaperLayerProps {
  children: ReactNode;
  className?: string;
  decorativo?: boolean;
}

// Panel base "de papel": fondo claro, radio estándar, sombra suave y difusa
// (nunca sombras duras) para simular profundidad de diorama.
export function PaperLayer({ children, className = "", decorativo = false }: PaperLayerProps) {
  return (
    <div
      aria-hidden={decorativo || undefined}
      className={`rounded-[14px] bg-blanco-papel shadow-[0_12px_32px_-12px_rgba(43,43,51,0.18)] ${className}`}
    >
      {children}
    </div>
  );
}
