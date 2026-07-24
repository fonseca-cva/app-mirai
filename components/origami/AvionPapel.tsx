'use client'

import { motion } from 'motion/react'
import { useEffect, useState } from 'react'

interface AvionPapelProps {
  className?: string;
  animar?: boolean;
  prefersReducedMotion?: boolean;
}

/** Avión de papel — usado en CTAs, transiciones y hero volador. */
export function AvionPapel({ className = "", animar = false, prefersReducedMotion }: AvionPapelProps) {
  const [volar, setVolar] = useState(false)

  useEffect(() => {
    if (!animar || prefersReducedMotion) return

    const programarVuelo = () => {
      const espera = 25000 + Math.random() * 15000 // 25-40s
      const timer = setTimeout(() => {
        setVolar(true)
        // Una vez que termina la travesía, esperar y reprogramar
        setTimeout(() => {
          setVolar(false)
          programarVuelo()
        }, 6000)
      }, espera)
      return timer
    }

    const timer = programarVuelo()
    return () => clearTimeout(timer)
  }, [animar, prefersReducedMotion])

  // Si no es animación, SVG estático original
  if (!animar || prefersReducedMotion) {
    return (
      <svg viewBox="0 0 100 100" className={className} role="img" aria-label="Avión de papel">
        <polygon points="5,55 95,15 55,50" fill="#F7F2E9" />
        <polygon points="5,55 55,50 40,85" fill="#E8E0D0" />
        <polygon points="55,50 95,15 40,85" fill="#FFFDF8" />
      </svg>
    )
  }

  // Modo volador: cruza el hero en diagonal
  return (
    <motion.div
      className="pointer-events-none absolute z-0"
      style={{ left: 0, top: '30%' }}
      animate={
        volar
          ? {
              x: ['-150px', 'calc(100vw + 200px)'],
              y: ['0px', '200px'],
              opacity: [0, 1, 1, 0],
            }
          : { opacity: 0 }
      }
      transition={
        volar
          ? {
              x: { duration: 5, ease: 'easeInOut' },
              y: { duration: 5, ease: 'easeInOut' },
              opacity: { duration: 5, times: [0, 0.1, 0.9, 1] },
            }
          : { duration: 0 }
      }
    >
      <svg
        viewBox="0 0 100 100"
        className={className}
        role="img"
        aria-label="Avión de papel volando"
        style={{ width: 80, height: 80, rotate: '-15deg' }}
      >
        <polygon points="5,55 95,15 55,50" fill="#F7F2E9" />
        <polygon points="5,55 55,50 40,85" fill="#E8E0D0" />
        <polygon points="55,50 95,15 40,85" fill="#FFFDF8" />
      </svg>
    </motion.div>
  )
}
