interface AvionPapelProps {
  className?: string;
}

// Avión de papel — usado en CTAs y transiciones.
export function AvionPapel({ className = "" }: AvionPapelProps) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Avión de papel">
      <polygon points="5,55 95,15 55,50" fill="#F7F2E9" />
      <polygon points="5,55 55,50 40,85" fill="#E8E0D0" />
      <polygon points="55,50 95,15 40,85" fill="#FFFDF8" />
    </svg>
  );
}
