"use client";

import { useEffect, type RefObject } from "react";
import { obtenerAudioContexto } from "@/lib/data/audioContextos";

// El <audio> vive en un único ref montado en page.tsx, fuera de FoldTransition:
// TarjetaContexto se desmonta y remonta en cada cambio de contexto, así que un
// <audio> ahí adentro se recrearía (glitch audible) y perdería el estado de mute.
export function useAudioAmbiente(
  audioRef: RefObject<HTMLAudioElement | null>,
  escenaId: string | undefined,
  activo: boolean
) {
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const config = obtenerAudioContexto(escenaId);
    if (!activo || !config) {
      audio.pause();
      return;
    }

    if (!audio.src.endsWith(config.archivo)) {
      audio.pause();
      audio.src = config.archivo;
    }
    audio.loop = true;
    void audio.play().catch(() => {
      // Reproducción bloqueada por el navegador (sin gesto reciente): silencioso,
      // la tarjeta funciona completa sin sonido de todos modos.
    });

    return () => {
      audio.pause();
    };
  }, [audioRef, escenaId, activo]);
}
