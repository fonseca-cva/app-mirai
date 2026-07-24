interface BarraProgresoProps {
  actual: number;
  total: number;
}

// Tira de papel que se va "plegando": un segmento por contexto (24 en total).
export function BarraProgreso({ actual, total }: BarraProgresoProps) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={actual}
      aria-label={`Progreso: contexto ${actual} de ${total}`}
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
