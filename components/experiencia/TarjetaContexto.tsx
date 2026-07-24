import { PaperLayer } from "@/components/origami/PaperLayer";
import { IconoContexto } from "@/components/origami/IconoContexto";
import type { Contexto } from "@/lib/data/contextos";
import { experienciaTarjeta } from "@/lib/config/textos";

interface TarjetaContextoProps {
  contexto: Contexto;
  onResponder: (valor: 0 | 1 | 2) => void;
}

export function TarjetaContexto({ contexto, onResponder }: TarjetaContextoProps) {
  return (
    <PaperLayer className="flex w-full max-w-sm flex-col items-center gap-4 p-8 text-center">
      <IconoContexto dimension={contexto.icono} className="h-16 w-16" />
      <h2 className="text-xl font-semibold">{contexto.nombre}</h2>
      <p className="text-tinta/80">{contexto.descripcion}</p>
      <div className="mt-2 flex w-full flex-col gap-2">
        {experienciaTarjeta.botones.map((boton) => (
          <button
            key={boton.valor}
            onClick={() => onResponder(boton.valor as 0 | 1 | 2)}
            className={`rounded-[14px] px-4 py-3 text-sm font-medium transition ${
              boton.valor === 2
                ? "bg-coral text-blanco-papel hover:opacity-90"
                : "border border-tinta/20 hover:border-tinta/40"
            }`}
          >
            {boton.label}
          </button>
        ))}
      </div>
    </PaperLayer>
  );
}
