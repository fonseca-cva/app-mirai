"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import {
  ESTADO_FASE_INICIAL,
  MS_ENTRE_SIMBOLOS,
  MS_PAUSA_FIN_PRESENTACION,
  MS_SIMBOLO,
  MS_TIMEOUT_RESPUESTA,
  MS_TRANSICION_RONDA,
  SIMBOLOS_SECUENCIAS,
  reducirFaseSecuencias,
} from "@/lib/logic/secuencias";

const MS_CHEQUEO_TIMEOUT = 1000;

export interface IntentoSecuencia {
  itemId: string;
  correcto: boolean;
  nivel: number; // el largo intentado
  duracionMs: number;
  repetidoPorTimeout: boolean;
}

function generarSecuencia(largo: number): number[] {
  return Array.from({ length: largo }, () => Math.floor(Math.random() * SIMBOLOS_SECUENCIAS));
}

// Hook que envuelve la máquina de fases pura (lib/logic/secuencias.ts, Anexo 3) con la
// reproducción temporizada y la captura de toques del pad. La máquina decide QUÉ fase
// corresponde (mostrando/pausa/esperando-respuesta/transición/timeout/terminado); este hook
// solo dispara los temporizadores reales y traduce eventos del usuario en eventos de la máquina.
// Reporta cada intento (uno por fila en respuestas_cognitivo) además del largo máximo logrado.
export function useSecuencias(
  alTerminar: (largoMaximoLogrado: number, intentos: IntentoSecuencia[]) => void
) {
  const [estadoFase, dispatch] = useReducer(reducirFaseSecuencias, ESTADO_FASE_INICIAL);
  const [secuencia, setSecuencia] = useState<number[]>(() =>
    generarSecuencia(ESTADO_FASE_INICIAL.estado.largoActual)
  );
  const [simboloResaltado, setSimboloResaltado] = useState<number | null>(null);
  const [progresoRespuesta, setProgresoRespuesta] = useState(0);

  // Patrón oficial de React para "ajustar estado cuando cambia algo derivado del render"
  // (ver react.dev "Adjusting state when a prop changes"): cada vez que la máquina de fases
  // pide una nueva presentación (generacionMostrando cambia), se regenera la secuencia en el
  // mismo render — nunca dentro de un efecto.
  const [generacionPrevia, setGeneracionPrevia] = useState(estadoFase.generacionMostrando);
  if (estadoFase.generacionMostrando !== generacionPrevia) {
    setGeneracionPrevia(estadoFase.generacionMostrando);
    setSecuencia(generarSecuencia(estadoFase.estado.largoActual));
    setProgresoRespuesta(0);
  }

  const alTerminarRef = useRef(alTerminar);
  useEffect(() => {
    alTerminarRef.current = alTerminar;
  });

  const inicioEsperaRef = useRef(0);
  const ultimaInteraccionRef = useRef(0);
  const intentosRef = useRef<IntentoSecuencia[]>([]);
  const contadorIntentoRef = useRef(0);

  // Reproduce la secuencia cada vez que cambia (ronda nueva o repetición tras timeout) y, al
  // terminar, avisa a la máquina de fases que la presentación acabó.
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    secuencia.forEach((simbolo, i) => {
      const inicio = i * (MS_SIMBOLO + MS_ENTRE_SIMBOLOS);
      timers.push(setTimeout(() => setSimboloResaltado(simbolo), inicio));
      timers.push(setTimeout(() => setSimboloResaltado(null), inicio + MS_SIMBOLO));
    });
    const finPresentacion = secuencia.length * (MS_SIMBOLO + MS_ENTRE_SIMBOLOS);
    timers.push(setTimeout(() => dispatch({ tipo: "FIN_PRESENTACION" }), finPresentacion));
    return () => timers.forEach(clearTimeout);
  }, [secuencia]);

  // Pausa en blanco (900ms) antes de habilitar la respuesta.
  useEffect(() => {
    if (estadoFase.fase !== "pausa") return;
    const t = setTimeout(() => {
      inicioEsperaRef.current = performance.now();
      dispatch({ tipo: "FIN_PAUSA" });
    }, MS_PAUSA_FIN_PRESENTACION);
    return () => clearTimeout(t);
  }, [estadoFase.fase]);

  // Timeout de inactividad: se reinicia en cada toque (tocarSimbolo) para no cortar a un
  // usuario que responde lento pero sigue interactuando.
  useEffect(() => {
    if (estadoFase.fase !== "esperando-respuesta") return;
    ultimaInteraccionRef.current = performance.now();
    const intervalo = setInterval(() => {
      if (performance.now() - ultimaInteraccionRef.current < MS_TIMEOUT_RESPUESTA) return;
      if (estadoFase.timeoutUsadoEnRonda) {
        registrarIntento(false, estadoFase.estado.largoActual, true);
      }
      dispatch({ tipo: "TIMEOUT" });
    }, MS_CHEQUEO_TIMEOUT);
    return () => clearInterval(intervalo);
  }, [estadoFase.fase, estadoFase.timeoutUsadoEnRonda, estadoFase.estado]);

  // Transición entre rondas: mínimo 1.2s con mensaje antes de la próxima presentación.
  useEffect(() => {
    if (estadoFase.fase !== "transicion") return;
    const t = setTimeout(() => dispatch({ tipo: "FIN_TRANSICION" }), MS_TRANSICION_RONDA);
    return () => clearTimeout(t);
  }, [estadoFase.fase]);

  // Notifica el fin del juego cuando la máquina de fases llega a "terminado".
  useEffect(() => {
    if (estadoFase.fase !== "terminado") return;
    alTerminarRef.current(estadoFase.estado.largoMaximoLogrado, intentosRef.current);
  }, [estadoFase.fase, estadoFase.estado.largoMaximoLogrado]);

  function registrarIntento(correcto: boolean, largo: number, repetidoPorTimeout: boolean) {
    contadorIntentoRef.current += 1;
    intentosRef.current = [
      ...intentosRef.current,
      {
        itemId: `sec-intento-${contadorIntentoRef.current}`,
        correcto,
        nivel: largo,
        duracionMs: Math.round(performance.now() - inicioEsperaRef.current),
        repetidoPorTimeout,
      },
    ];
  }

  function tocarSimbolo(simbolo: number) {
    if (estadoFase.fase !== "esperando-respuesta") return;
    ultimaInteraccionRef.current = performance.now();

    if (simbolo !== secuencia[progresoRespuesta]) {
      registrarIntento(false, estadoFase.estado.largoActual, estadoFase.timeoutUsadoEnRonda);
      dispatch({ tipo: "RESPUESTA_INCORRECTA" });
      return;
    }

    const siguienteProgreso = progresoRespuesta + 1;
    if (siguienteProgreso >= secuencia.length) {
      registrarIntento(true, estadoFase.estado.largoActual, estadoFase.timeoutUsadoEnRonda);
      dispatch({ tipo: "RESPUESTA_CORRECTA" });
      return;
    }
    setProgresoRespuesta(siguienteProgreso);
  }

  function repetirRonda() {
    if (estadoFase.fase !== "timeout") return;
    dispatch({ tipo: "REPETIR_RONDA" });
  }

  return {
    largoActual: estadoFase.estado.largoActual,
    fase: estadoFase.fase,
    tipoTransicion: estadoFase.tipoTransicion,
    simboloResaltado,
    progresoRespuesta,
    tocarSimbolo,
    repetirRonda,
  };
}
