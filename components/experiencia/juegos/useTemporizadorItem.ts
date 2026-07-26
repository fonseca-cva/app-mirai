"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const DURACION_MS = 60_000;
const AVISO_MS = 45_000;

// Regla no negociable de la spec (sección 3): 60s por ítem, aviso suave a los 45s
// (el borde se atenúa), sin cronómetro visible. Si expira, se marca omitido y avanza.
//
// Se asume que el componente que usa este hook se remonta por completo en cada ítem nuevo
// (FoldTransition le pasa `key={item.id}` al contenedor), así que el estado ya parte limpio
// en cada ítem y no hace falta resetearlo a mano.
//
// `pausado` opcional: cuando true, detiene el conteo regresivo (p. ej. ayuda abierta).
// Al volver a false, reanuda desde el tiempo restante.
export function useTemporizadorItem(
  alExpirar: (duracionMs: number) => void,
  pausado?: boolean
) {
  const [avisoActivo, setAvisoActivo] = useState(false);
  const inicioRef = useRef(0);
  const respondidoRef = useRef(false);
  const alExpirarRef = useRef(alExpirar);
  const pausadoRef = useRef(pausado);
  const tiempoTranscurridoRef = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Sincroniza ref de callback (nunca stale)
  useEffect(() => {
    alExpirarRef.current = alExpirar;
  });

  // Arranca o reanuda el timer cuando `pausado` cambia o se monta el hook
  useEffect(() => {
    // Si ya respondió, no hacer nada
    if (respondidoRef.current) return;

    // Si está pausado, limpiar timers y marcar el tiempo transcurrido
    if (pausado) {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      return;
    }

    // Si ya había transcurrido algo (reanudación), usar ese remanente
    const pendienteMs = DURACION_MS - tiempoTranscurridoRef.current;
    if (pendienteMs <= 0) {
      respondidoRef.current = true;
      alExpirarRef.current(DURACION_MS);
      return;
    }

    const avisoPendienteMs = AVISO_MS - tiempoTranscurridoRef.current;
    inicioRef.current = performance.now();

    const timerAviso = setTimeout(() => {
      if (respondidoRef.current) return;
      setAvisoActivo(true);
    }, Math.max(avisoPendienteMs, 0));

    const timerExpira = setTimeout(() => {
      if (respondidoRef.current) return;
      respondidoRef.current = true;
      alExpirarRef.current(DURACION_MS);
    }, pendienteMs);

    timersRef.current = [timerAviso, timerExpira];

    return () => {
      timersRef.current.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pausado]);

  // Rastrea cambios de pausado para actualizar el ref
  const pausadoPrevio = useRef(pausado);
  useEffect(() => {
    if (pausadoPrevio.current === false && pausado === true) {
      // Se acaba de pausar: acumular tiempo transcurrido
      if (inicioRef.current > 0) {
        tiempoTranscurridoRef.current += performance.now() - inicioRef.current;
      }
    }
    pausadoPrevio.current = pausado;
  }, [pausado]);

  const marcarRespondido = useCallback((): number => {
    respondidoRef.current = true;
    timersRef.current.forEach(clearTimeout);
    const ahora = performance.now();
    const tiempoFinal = tiempoTranscurridoRef.current + (ahora - inicioRef.current);
    return Math.round(tiempoFinal);
  }, []);

  function yaRespondido(): boolean {
    return respondidoRef.current;
  }

  return { avisoActivo, marcarRespondido, yaRespondido };
}
