import { colores, dropShadowCSS } from "@/lib/config/tokens";

interface PapelRasgadoProps {
  colorRelleno?: string;
  className?: string;
}

// Silueta de corte irregular (fija, no aleatoria: evita mismatch SSR/cliente).
const PUNTOS_RASGADO: [number, number][] = [
  [0, 14], [18, 22], [34, 8], [52, 20], [70, 6], [88, 18], [106, 10], [124, 24],
  [142, 12], [160, 20], [178, 8], [196, 18], [214, 10], [232, 22], [250, 6],
  [268, 18], [286, 12], [304, 24], [322, 8], [340, 18], [358, 12], [376, 20], [400, 14],
];

const RUTA_RASGADO = `M${PUNTOS_RASGADO.map(([x, y]) => `${x},${y}`).join(" L")} L400,32 L0,32 Z`;

// Transición de "papel rasgado" entre secciones (C.13): reemplaza el borde
// recto por un corte irregular, con la sombra de LUZ proyectada sobre la
// sección siguiente (usa el mismo dropShadowCSS que el resto del diorama).
export function PapelRasgado({ colorRelleno = colores.papel, className = "" }: PapelRasgadoProps) {
  return (
    <div className={`relative h-8 w-full overflow-hidden ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 400 32"
        preserveAspectRatio="none"
        className="h-full w-full"
        style={{ filter: dropShadowCSS("media") }}
      >
        <path d={RUTA_RASGADO} fill={colorRelleno} />
      </svg>
    </div>
  );
}
