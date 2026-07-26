"use client";

import { useEffect, useRef, useState } from "react";
import {
  avanzarSecuencia,
  ESTADO_INICIAL_SECUENCIAS,
  SIMBOLOS_SECUENCIAS,
  type EstadoSecuencias,
} from "@/lib/logic/secuencias";

const MS_SIMBOLO = 800;
const MS_ENTRE_SIMBOLOS = 250;

type FaseInterna = "mostrando" | "esperando-respuesta";
type Fase = FaseInterna | "terminado";

export interface IntentoSecuencia {
  itemId: string;
  correcto: boolean;
  nivel: number; // el largo intentado
  duracionMs: number;
}

function generarSecuencia(largo: number): number[] {
  return Array.from({ length: largo }, () => Math.floor(Math.random() * SIMBOLOS_SECUENCIAS));
}

function claveRonda(estado: EstadoSecuencias): string {
  return `${estado.largoActual}-${estado.erroresEnLargoActual}`;
}

// Hook que envuelve la máquina de estados pura (lib/logic/secuencias.ts) con la reproducción
// temporizada (800ms por símbolo, 250ms entre símbolos) y la captura de toques del pad.
// Reporta cada intento (uno por fila en respuestas_cognitivo) además del largo máximo logrado.
export function useSecuencias(
  alTerminar: (largoMaximoLogrado: number, intentos: IntentoSecuencia[]) => void
) {
  const [estado, setEstado] = useState<EstadoSecuencias>(ESTADO_INICIAL_SECUENCIAS);
  const [secuencia, setSecuencia] = useState<number[]>(() =>
    generarSecuencia(ESTADO_INICIAL_SECUENCIAS.largoActual)
  );
  const [fase, setFase] = useState<FaseInterna>("mostrando");
  const [simboloResaltado, setSimboloResaltado] = useState<number | null>(null);
  const [progresoRespuesta, setProgresoRespuesta] = useState(0);

  // Patrón oficial de React para "ajustar estado cuando cambia algo derivado del render"
  // (ver react.dev "Adjusting state when a prop changes"): se compara contra la ronda
  // anterior y, si cambió, se ajusta el estado en el mismo render — nunca dentro de un efecto.
  const [rondaPrevia, setRondaPrevia] = useState(() => claveRonda(ESTADO_INICIAL_SECUENCIAS));
  const rondaActual = claveRonda(estado);
  if (rondaActual !== rondaPrevia && !estado.terminado) {
    setRondaPrevia(rondaActual);
    setSecuencia(generarSecuencia(estado.largoActual));
    setProgresoRespuesta(0);
    setFase("mostrando");
  }

  const alTerminarRef = useRef(alTerminar);
  useEffect(() => {
    alTerminarRef.current = alTerminar;
  });

  const inicioEsperaRef = useRef(0);
  const intentosRef = useRef<IntentoSecuencia[]>([]);
  const contadorIntentoRef = useRef(0);

  // Reproduce la secuencia cada vez que cambia (ronda nueva o repetición tras un error).
  // simboloResaltado ya queda en null al terminar la ronda anterior (su propio setTimeout
  // final lo apaga antes de pasar a "esperando-respuesta"), así que no hace falta resetearlo aquí.
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    secuencia.forEach((simbolo, i) => {
      const inicio = i * (MS_SIMBOLO + MS_ENTRE_SIMBOLOS);
      timers.push(setTimeout(() => setSimboloResaltado(simbolo), inicio));
      timers.push(setTimeout(() => setSimboloResaltado(null), inicio + MS_SIMBOLO));
    });
    const finPresentacion = secuencia.length * (MS_SIMBOLO + MS_ENTRE_SIMBOLOS);
    timers.push(
      setTimeout(() => {
        inicioEsperaRef.current = performance.now();
        setFase("esperando-respuesta");
      }, finPresentacion)
    );
    return () => timers.forEach(clearTimeout);
  }, [secuencia]);

  // "terminado" se deriva de la máquina de estados en vez de asignarse con setState en un
  // efecto — evita el patrón "setState síncrono dentro de un efecto".
  const faseEfectiva: Fase = estado.terminado ? "terminado" : fase;

  // Notifica el fin del juego cuando la máquina de estados termina (efecto solo para el
  // side-effect externo de avisar al padre, no para derivar estado propio).
  useEffect(() => {
    if (!estado.terminado) return;
    alTerminarRef.current(estado.largoMaximoLogrado, intentosRef.current);
  }, [estado.terminado, estado.largoMaximoLogrado]);

  function registrarIntento(correcto: boolean, largo: number) {
    contadorIntentoRef.current += 1;
    intentosRef.current = [
      ...intentosRef.current,
      {
        itemId: `sec-intento-${contadorIntentoRef.current}`,
        correcto,
        nivel: largo,
        duracionMs: Math.round(performance.now() - inicioEsperaRef.current),
      },
    ];
  }

  function tocarSimbolo(simbolo: number) {
    if (fase !== "esperando-respuesta") return;

    if (simbolo !== secuencia[progresoRespuesta]) {
      registrarIntento(false, estado.largoActual);
      setEstado((prev) => avanzarSecuencia(prev, false));
      return;
    }

    const siguienteProgreso = progresoRespuesta + 1;
    if (siguienteProgreso >= secuencia.length) {
      registrarIntento(true, estado.largoActual);
      setEstado((prev) => avanzarSecuencia(prev, true));
      return;
    }
    setProgresoRespuesta(siguienteProgreso);
  }

  return {
    largoActual: estado.largoActual,
    fase: faseEfectiva,
    simboloResaltado,
    progresoRespuesta,
    tocarSimbolo,
  };
}
