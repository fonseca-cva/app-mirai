import type { FiguraOrigami } from "@/lib/logic/figuraOrigami";
import { FiguraOrigamiSVG } from "@/components/experiencia/juegos/FiguraOrigamiSVG";

// 6 símbolos fijos (sección 3.3): distintos en lados y tono para no depender solo del color.
const SIMBOLOS: FiguraOrigami[] = [
  { lados: 3, rotacionDeg: 0, tono: 0.1, pliegues: 1 },
  { lados: 4, rotacionDeg: 45, tono: 0.3, pliegues: 1 },
  { lados: 5, rotacionDeg: 0, tono: 0.5, pliegues: 1 },
  { lados: 6, rotacionDeg: 30, tono: 0.7, pliegues: 1 },
  { lados: 7, rotacionDeg: 0, tono: 0.9, pliegues: 1 },
  { lados: 8, rotacionDeg: 22.5, tono: 1, pliegues: 1 },
];

interface Props {
  simboloResaltado: number | null;
  deshabilitado: boolean;
  onTocar: (simbolo: number) => void;
}

export function PadSecuencias({ simboloResaltado, deshabilitado, onTocar }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {SIMBOLOS.map((figura, i) => (
        <button
          key={i}
          onClick={() => onTocar(i)}
          disabled={deshabilitado}
          aria-label={`Símbolo ${i + 1}`}
          aria-pressed={simboloResaltado === i}
          className={`flex h-20 w-20 min-h-[44px] min-w-[44px] items-center justify-center rounded-[14px] border-2 bg-blanco-papel/70 transition disabled:cursor-default ${
            simboloResaltado === i
              ? "border-coral bg-coral/10"
              : "border-tinta/15 enabled:hover:border-teal-medio"
          }`}
        >
          <FiguraOrigamiSVG figura={figura} tamano={48} titulo={`Símbolo ${i + 1}`} />
        </button>
      ))}
    </div>
  );
}
