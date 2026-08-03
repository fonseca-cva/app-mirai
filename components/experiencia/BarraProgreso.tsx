interface BarraProgresoProps {
  actual: number;
  total: number;
  /** Nombre de lo que se está respondiendo, para el aria-label (p. ej. "actividad"). */
  ariaLabel?: string;
}

// Tira de papel que se va "plegando": un segmento por ítem (24 en total).
export function BarraProgreso({ actual, total, ariaLabel = "contexto" }: BarraProgresoProps) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={actual}
      aria-label={`Progreso: ${ariaLabel} ${actual} de ${total}`}
      className="flex w-full max-w-md gap-1"
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-2 flex-1 rounded-full transition-colors ${i < actual ? "bg-coral" : "bg-papel-sombra"}`}
        />
      ))}
    </div>
  );
}
