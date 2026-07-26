'use client'

interface Props {
  prefersReducedMotion: boolean
}

// Solo un par de nubes, como en la referencia: blancas, planas y discretas,
// cerca de las cumbres. Flotan apenas (±14px) en vez de cruzar la pantalla.
const NUBES = [
  { top: '48%', left: '8%', ancho: 120, dur: 16, delay: 0 },
  { top: '18%', left: '70%', ancho: 90, dur: 21, delay: 4 },
] as const

/** Un par de nubes de papel casi estáticas, con flotación sutil. */
export default function NubesDeriva({ prefersReducedMotion }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      {NUBES.map((n, i) => (
        <svg
          key={i}
          viewBox="0 0 120 60"
          className="absolute"
          style={{
            top: n.top,
            left: n.left,
            width: `${n.ancho}px`,
            height: `${n.ancho * 0.5}px`,
            animation: prefersReducedMotion
              ? undefined
              : `nube-flota ${n.dur}s ease-in-out ${n.delay}s infinite alternate`,
          }}
          fill="none"
        >
          <path
            d="M10 40 Q15 20 35 18 Q45 5 65 10 Q80 5 95 15 Q110 18 110 35 Q110 45 100 45 L15 45 Q5 45 10 40Z"
            fill="#FFFFFF"
            opacity={0.9}
          />
        </svg>
      ))}

      <style>{`
        @keyframes nube-flota {
          from { transform: translateX(0); }
          to { transform: translateX(14px); }
        }
      `}</style>
    </div>
  )
}
