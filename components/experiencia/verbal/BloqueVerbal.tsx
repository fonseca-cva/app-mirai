"use client";

import { useState, useCallback } from "react";
import { bloqueVerbal, juegosCognitivos } from "@/lib/config/textos";
import { TEXTOS_COMPRENSION, DILEMAS_ARGUMENTACION, CONSIGNAS_EXPRESION } from "@/lib/config/rubricas";
import { useExperienciaStore, type RespuestaVerbal } from "@/lib/store/experiencia";
import type { RespuestaVerbalRow } from "@/lib/supabase/types";

interface Props {
  onCompletar: () => void;
  onPausar: () => void;
}

type Tarea = "comprension" | "argumentacion" | "expresion";

export function BloqueVerbal({ onCompletar, onPausar }: Props) {
  const [tarea, setTarea] = useState<Tarea>("comprension");
  const [texto, setTexto] = useState("");
  const [evaluando, setEvaluando] = useState(false);
  const [error, setError] = useState(false);
  const [hecho, setHecho] = useState(false);
  // Validez (plan de Camilo): reintento único tras respuesta no pertinente.
  const [avisoPertinencia, setAvisoPertinencia] = useState<string | null>(null);
  // Telemetría de control de calidad (punto 4): evento paste en el textarea.
  // Uso EXCLUSIVO de QA — no afecta puntaje, no se muestra al usuario.
  const [pegado, setPegado] = useState(false);
  const [caracteresPegados, setCaracteresPegados] = useState(0);
  const sessionId = useExperienciaStore((s) => s.sessionId);
  const agregarRespuestaVerbal = useExperienciaStore((s) => s.agregarRespuestaVerbal);
  const sincronizarBloque = useExperienciaStore((s) => s.sincronizarBloque);

  // Índices determinísticos para textos/dilemas/consignas basados en sessionId
  const indiceTexto = sessionId ? sessionId.charCodeAt(0) % TEXTOS_COMPRENSION.length : 0;
  const indiceDilema = sessionId ? sessionId.charCodeAt(1) % DILEMAS_ARGUMENTACION.length : 0;
  const indiceExpresion = sessionId ? sessionId.charCodeAt(2) % CONSIGNAS_EXPRESION.length : 0;

  const textoBase =
    tarea === "comprension"
      ? TEXTOS_COMPRENSION[indiceTexto]
      : tarea === "argumentacion"
        ? DILEMAS_ARGUMENTACION[indiceDilema]
        : CONSIGNAS_EXPRESION[indiceExpresion];

  const config =
    tarea === "comprension"
      ? bloqueVerbal.comprension
      : tarea === "argumentacion"
        ? bloqueVerbal.argumentacion
        : bloqueVerbal.expresion;
  const caracteresMinimos = config.minimoCaracteres;

  // Número de intento por tarea: 1 = primer envío; 2 = único reintento tras
  // respuesta no pertinente (máximo un reintento, plan de Camilo punto 2).
  const [intentos, setIntentos] = useState<Record<Tarea, number>>({
    comprension: 1,
    argumentacion: 1,
    expresion: 1,
  });

  // Registro del evento paste (control de calidad únicamente): cuantos
  // caracteres se pegaron en total (el contador acumula por envío).
  const manejarPaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const textoPegado = e.clipboardData?.getData("text") ?? "";
    setPegado(true);
    setCaracteresPegados((prev) => prev + textoPegado.length);
  }, []);

  const avanzarTarea = useCallback(() => {
    setTexto("");
    setAvisoPertinencia(null);
    setPegado(false);
    setCaracteresPegados(0);
    setError(false);

    if (tarea === "comprension") {
      setTarea("argumentacion");
    } else if (tarea === "argumentacion") {
      setTarea("expresion");
    } else {
      setHecho(true);

      // Bloque C (verbal) completado: sync de las respuestas (comprensión +
      // argumentación + expresión), incluida la telemetría de QA de validez.
      if (sessionId) {
        const respuestas = useExperienciaStore.getState().respuestasVerbal;
        sincronizarBloque(
          respuestas.map((r, i) => ({
            id: `verbal-${sessionId}-${i}`,
            tipo: "verbal" as const,
            payload: {
              session_id: sessionId,
              tarea: r.tarea,
              texto: r.texto,
              evaluacion_json: r.evaluacion as RespuestaVerbalRow["evaluacion_json"],
              estado: r.estado,
              pegado: r.pegado,
              caracteres_pegados: r.caracteresPegados,
              revision_requerida: r.revisionRequerida,
              intento: r.intento,
            },
          }))
        );
      }
    }
  }, [tarea, sessionId, sincronizarBloque]);

  const manejarEnvio = useCallback(async () => {
    if (texto.trim().length < caracteresMinimos || evaluando) return;

    const intentoActual = intentos[tarea];
    setEvaluando(true);
    setError(false);

    try {
      // Intentar llamar al endpoint real. Se envían pegado/caracteresPegados/intento
      // SOLO como metadato de control de calidad (no van al modelo, no afectan puntaje).
      const respuesta = await fetch("/api/evaluar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          tarea,
          texto: texto.trim(),
          indiceTexto,
          indiceDilema,
          indiceExpresion,
          pegado,
          caracteresPegados,
          intento: intentoActual,
        }),
      });

      if (!respuesta.ok) {
        throw new Error(`HTTP ${respuesta.status}`);
      }

      const data = await respuesta.json();

      if (data.estado === "evaluado") {
        agregarRespuestaVerbal({
          tarea,
          texto: texto.trim(),
          evaluacion: data.evaluacion as RespuestaVerbal["evaluacion"],
          estado: "evaluado",
          pegado,
          caracteresPegados,
          revisionRequerida: data.revision_requerida === true,
          intento: intentoActual,
        });
        avanzarTarea();
        return;
      }

      if (data.estado === "no_pertinente") {
        if (intentoActual === 1) {
          // Se guarda la respuesta rechazada (QA/trazabilidad) y se ofrece el
          // único reintento permitido. El texto se mantiene para reescribir.
          agregarRespuestaVerbal({
            tarea,
            texto: texto.trim(),
            evaluacion: null,
            estado: "no_pertinente",
            pegado,
            caracteresPegados,
            intento: 1,
          });
          setIntentos((prev) => ({ ...prev, [tarea]: 2 }));
          setAvisoPertinencia(
            data.mensaje ?? "Parece que tu respuesta no habla del texto que leíste. ¿Quieres intentarlo de nuevo?"
          );
          setPegado(false);
          setCaracteresPegados(0);
          return;
        }
        // Segundo envío también no pertinente: la dimensión queda sin evaluar.
        agregarRespuestaVerbal({
          tarea,
          texto: texto.trim(),
          evaluacion: null,
          estado: "no_pertinente",
          pegado,
          caracteresPegados,
          intento: 2,
        });
        avanzarTarea();
        return;
      }

      if (data.estado === "no_evaluado") {
        // Sin proveedor, fallo o formato inválido: NUNCA se inventa un puntaje.
        console.warn(`[verbal] ${data.mensaje ?? "Evaluación no disponible"}`);
        agregarRespuestaVerbal({
          tarea,
          texto: texto.trim(),
          evaluacion: null,
          estado: "no_evaluado",
          pegado,
          caracteresPegados,
          intento: intentoActual,
        });
        avanzarTarea();
        return;
      }

      // 'pendiente' (u otro estado): se guarda sin evaluación y se continúa.
      agregarRespuestaVerbal({
        tarea,
        texto: texto.trim(),
        evaluacion: null,
        estado: data.estado === "pendiente" ? "pendiente" : "no_evaluado",
        pegado,
        caracteresPegados,
        intento: intentoActual,
      });
      avanzarTarea();
    } catch {
      // API no disponible: se continúa SIN puntaje (antes se fabricaba uno por
      // longitud — bug de validez reportado por Camilo; eliminado).
      console.warn("[verbal] API no disponible, respuesta queda sin evaluar");
      agregarRespuestaVerbal({
        tarea,
        texto: texto.trim(),
        evaluacion: null,
        estado: "no_evaluado",
        pegado,
        caracteresPegados,
        intento: intentoActual,
      });
      avanzarTarea();
    } finally {
      setEvaluando(false);
    }
  }, [texto, tarea, sessionId, indiceTexto, indiceDilema, indiceExpresion, agregarRespuestaVerbal, avanzarTarea, caracteresMinimos, intentos, pegado, caracteresPegados, evaluando]);

  const omitirTarea = useCallback(() => {
    // Salida sin responder (tras aviso de pertinencia): dimensión sin evaluar.
    if (evaluando) return;
    agregarRespuestaVerbal({
      tarea,
      texto: texto.trim(),
      evaluacion: null,
      estado: "no_evaluado",
      pegado,
      caracteresPegados,
      intento: intentos[tarea],
    });
    avanzarTarea();
  }, [tarea, texto, pegado, caracteresPegados, intentos, evaluando, agregarRespuestaVerbal, avanzarTarea]);

  if (hecho) {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="font-display text-xl text-tinta/80">¡Bien! Tercer pliegue listo.</p>
        <button
          onClick={onCompletar}
          className="rounded-[14px] bg-coral px-6 py-3 text-base font-medium text-blanco-papel transition hover:opacity-90"
        >
          {juegosCognitivos.seguir}
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-16 sm:px-8">
      <button
        onClick={onPausar}
        className="self-end rounded-full bg-blanco-papel/90 px-3 py-1.5 text-sm text-tinta/60 underline shadow-sm"
      >
        {juegosCognitivos.pausa}
      </button>

      <h1 className="font-display text-2xl font-semibold">{config.titulo}</h1>

      <div className="rounded-[14px] bg-papel-sombra/50 p-4 sm:p-6">
        <p className="text-base leading-relaxed text-tinta/80">{textoBase}</p>
      </div>

      {/* ITERACIÓN 3: consigna + mini-ejemplo en panel colapsable, abierto por defecto,
          visible mientras el estudiante escribe (punto 9 de la spec). */}
      <details open className="rounded-[10px] border border-teal-profundo/20 bg-teal-profundo/5 text-sm">
        <summary className="cursor-pointer select-none px-4 py-3 font-medium text-teal-profundo/80">
          Instrucciones
        </summary>
        <div className="px-4 pb-3">
          <p className="text-tinta/60">{config.instrucciones}</p>
          <p className="mt-2 text-teal-profundo/80">{bloqueVerbal.miniEjemplo}</p>
          <p className="mt-1 text-xs text-tinta/50">{bloqueVerbal.disclaimer}</p>
        </div>
      </details>

      {avisoPertinencia && (
        <div className="rounded-[14px] border border-dorado/40 bg-dorado/10 p-4">
          <p className="text-sm text-tinta/90">{avisoPertinencia}</p>
        </div>
      )}

      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onPaste={manejarPaste}
        placeholder={config.placeholder}
        className="min-h-[160px] w-full resize-y rounded-[14px] border border-tinta/10 bg-blanco-papel p-4 text-base text-tinta outline-none transition focus:border-coral/50 focus:ring-2 focus:ring-coral/20"
        disabled={evaluando}
        aria-label={config.etiqueta}
      />

      <div className="flex items-center justify-between">
        <span className={`text-sm ${texto.length < caracteresMinimos ? "text-tinta/40" : "text-tinta/60"}`}>
          {texto.length}/{caracteresMinimos} {config.minimoCaracteres ? bloqueVerbal.comprension.contadorCaracteres : ""}
        </span>

        <div className="flex items-center gap-3">
          {avisoPertinencia && (
            <button
              onClick={omitirTarea}
              disabled={evaluando}
              className="text-sm text-tinta/50 underline transition hover:text-tinta/80 disabled:opacity-40"
            >
              {bloqueVerbal.omitir}
            </button>
          )}
          <button
            onClick={manejarEnvio}
            disabled={texto.trim().length < caracteresMinimos || evaluando}
            className="rounded-[14px] bg-coral px-6 py-3 text-base font-medium text-blanco-papel transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {evaluando
              ? `${bloqueVerbal.evaluando}...`
              : avisoPertinencia
                ? bloqueVerbal.reintentar
                : config.siguienteCta}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500">{bloqueVerbal.error}</p>
      )}
    </section>
  );
}
