'use client';

import { useEffect, useRef } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';

interface ContadorNumeroProps {
  valor: number;
  prefijo?: string;
  sufijo?: string;
  duracion?: number;
}

// Cuenta de 0 al valor final una sola vez, al entrar en viewport.
// Actualiza el texto directamente (no re-renderiza React en cada frame).
// Con prefers-reduced-motion, muestra el valor final sin animar.
export function ContadorNumero({ valor, prefijo = '', sufijo = '', duracion = 1.4 }: ContadorNumeroProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const enVista = useInView(ref, { once: true, margin: '-80px' });
  const prefiereMenosMovimiento = useReducedMotion();

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo || !enVista) return;

    if (prefiereMenosMovimiento) {
      nodo.textContent = `${prefijo}${valor}${sufijo}`;
      return;
    }

    const formatear = (n: number) => {
      const esDecimal = !Number.isInteger(valor);
      const num = esDecimal ? n.toFixed(1) : Math.round(n).toString();
      return `${prefijo}${num}${sufijo}`;
    };

    nodo.textContent = formatear(0);
    const controles = animate(0, valor, {
      duration: duracion,
      ease: 'easeOut',
      onUpdate: (n) => {
        nodo.textContent = formatear(n);
      },
    });

    return () => controles.stop();
  }, [enVista, valor, prefijo, sufijo, duracion, prefiereMenosMovimiento]);

  return <span ref={ref}>{prefiereMenosMovimiento ? `${prefijo}${valor}${sufijo}` : `${prefijo}0${sufijo}`}</span>;
}
