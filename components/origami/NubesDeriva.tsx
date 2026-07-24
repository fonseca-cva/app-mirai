'use client'

import { useId } from 'react'

const GRUPOS = [
  {
    key: 'lejanas',
    velocidad: 120,
    opacidad: 0.35,
    y: '15%',
    tamaño: 0.6,
    nubes: 4,
    profundidad: 0,
  },
  {
    key: 'medias',
    velocidad: 80,
    opacidad: 0.55,
    y: '35%',
    tamaño: 0.8,
    nubes: 3,
    profundidad: 1,
  },
  {
    key: 'cercanas',
    velocidad: 50,
    opacidad: 0.8,
    y: '55%',
    tamaño: 1,
    nubes: 2,
    profundidad: 2,
  },
] as const

interface Props {
  prefersReducedMotion: boolean
}

/** Tres grupos de nubes de papel a la deriva, loop continuo sin salto visible. */
export default function NubesDeriva({ prefersReducedMotion }: Props) {
  const uid = useId()

  if (prefersReducedMotion) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {GRUPOS.map((g) => {
        const id = `${uid}-${g.key}`
        const segundos = g.velocidad
        const anchoGrupo = 300 * g.tamaño
        const separacion = 60 * g.tamaño
        const anchoTotal = GRUPOS.length * (anchoGrupo + separacion)

        return (
          <div key={g.key} className="absolute" style={{ top: g.y, opacity: g.opacidad }}>
            {/* Contenedor duplicado para loop sin salto: −50% => el segundo grupo empieza justo fuera por la derecha */}
            <div
              className="flex"
              style={{
                width: `${anchoTotal * 2}px`,
                animation: `nubes-deriva-${g.key} ${segundos}s linear infinite`,
              }}
            >
              {/* Grupo A */}
              <div className="flex shrink-0" style={{ width: `${anchoTotal}px`, gap: `${separacion}px` }}>
                {Array.from({ length: GRUPOS.length }, (_, i) => (
                  <svg
                    key={`a-${i}`}
                    viewBox="0 0 120 60"
                    className="shrink-0"
                    style={{ width: `${anchoGrupo}px`, height: `${anchoGrupo * 0.5}px` }}
                    fill="none"
                  >
                    <path
                      d={nubePath(i)}
                      fill={`url(#${id}-grad-${i})`}
                      filter={`url(#${id}-sombra)`}
                    />
                  </svg>
                ))}
              </div>
              {/* Grupo B (duplicado, mismo contenido) */}
              <div className="flex shrink-0" style={{ width: `${anchoTotal}px`, gap: `${separacion}px` }}>
                {Array.from({ length: GRUPOS.length }, (_, i) => (
                  <svg
                    key={`b-${i}`}
                    viewBox="0 0 120 60"
                    className="shrink-0"
                    style={{ width: `${anchoGrupo}px`, height: `${anchoGrupo * 0.5}px` }}
                    fill="none"
                  >
                    <path
                      d={nubePath(i + GRUPOS.length)}
                      fill={`url(#${id}-grad-${i})`}
                      filter={`url(#${id}-sombra)`}
                    />
                  </svg>
                ))}
              </div>
            </div>

            {/* Defs SVG para este grupo (filtro + gradientes) */}
            <svg className="absolute size-0" aria-hidden>
              <defs>
                <filter id={`${id}-sombra`}>
                  <feDropShadow dx={1} dy={2} stdDeviation={2} floodOpacity={0.1} />
                </filter>
                {Array.from({ length: GRUPOS.length }, (_, i) => (
                  <linearGradient key={i} id={`${id}-grad-${i}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#f0f0ee" />
                    <stop offset="100%" stopColor="#e2e3dc" />
                  </linearGradient>
                ))}
              </defs>
            </svg>
          </div>
        )
      })}

      <style>{`
        ${GRUPOS.map(
          (g) => `
        @keyframes nubes-deriva-${g.key} {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        `
        ).join('')}
      `}</style>
    </div>
  )
}

/** Genera una forma de nube distinta según índice */
function nubePath(i: number): string {
  const formas = [
    'M10 40 Q15 20 35 18 Q45 5 65 10 Q80 5 95 15 Q110 18 110 35 Q110 45 100 45 L15 45 Q5 45 10 40Z',
    'M5 35 Q10 15 30 12 Q45 5 60 15 Q75 8 90 18 Q100 20 100 35 Q100 40 90 40 L10 40 Q5 40 5 35Z',
    'M15 38 Q20 18 40 15 Q55 8 70 18 Q85 10 100 20 Q105 25 105 35 Q105 42 95 42 L20 42 Q12 42 15 38Z',
    'M8 42 Q12 25 32 20 Q48 12 65 22 Q80 15 92 25 Q102 28 102 40 Q102 45 88 45 L12 45 Q5 45 8 42Z',
  ]
  return formas[i % formas.length]
}
