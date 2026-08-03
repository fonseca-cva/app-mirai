import { IconoOrigamiSVG, type TipoOrigami } from "@/components/experiencia/juegos/IconoOrigamiSVG";

// 6 objetos origami fijos (sección 3.3): reconocibles a simple vista y distinguibles entre
// sí por su silueta (forma), nunca por color.
const SIMBOLOS: TipoOrigami[] = ["grulla", "barco", "flor", "estrella", "casa", "pez"];

interface Props {
  simboloResaltado: number | null;
  deshabilitado: boolean;
  onTocar: (simbolo: number) => void;
}

export function PadSecuencias({ simboloResaltado, deshabilitado, onTocar }: Props) {
  return (
    <div
      className={`grid grid-cols-3 gap-3 transition-opacity duration-500 ${
        deshabilitado ? "opacity-30" : "opacity-100"
      }`}
    >
      {SIMBOLOS.map((tipo, i) => (
        <button
          key={i}
          onClick={() => onTocar(i)}
          disabled={deshabilitado}
          aria-label={`Símbolo ${i + 1}: ${tipo}`}
          aria-pressed={simboloResaltado === i}
          className={`flex h-20 w-20 min-h-[44px] min-w-[44px] items-center justify-center rounded-[14px] border-2 bg-blanco-papel/70 transition disabled:cursor-default ${
            simboloResaltado === i
              ? "border-coral bg-coral/10"
              : "border-tinta/15 enabled:hover:border-teal-medio"
          }`}
        >
          <IconoOrigamiSVG tipo={tipo} tamano={48} titulo={`Símbolo ${i + 1}: ${tipo}`} />
        </button>
      ))}
    </div>
  );
}
