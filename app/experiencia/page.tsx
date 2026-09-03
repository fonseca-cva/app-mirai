"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { IntroExperiencia } from "@/components/experiencia/IntroExperiencia";
import { TarjetaContexto } from "@/components/experiencia/TarjetaContexto";
import { BarraProgreso } from "@/components/experiencia/BarraProgreso";
import { ResultadoParcial } from "@/components/experiencia/ResultadoParcial";
import { FoldTransition } from "@/components/origami/FoldTransition";
import { BloqueCognitivo } from "@/components/experiencia/juegos/BloqueCognitivo";
import { BloqueVerbal } from "@/components/experiencia/verbal/BloqueVerbal";
import { BloqueDivergente } from "@/components/experiencia/divergente/BloqueDivergente";
import { Informe } from "@/components/experiencia/Informe";
import { useAudioAmbiente } from "@/components/experiencia/useAudioAmbiente";
import { contextos } from "@/lib/data/contextos";
import { BloqueActividades } from "@/components/experiencia/actividades/BloqueActividades";
import { BloqueAsignaturas } from "@/components/experiencia/asignaturas/BloqueAsignaturas";
import { PantallaAspiracion } from "@/components/experiencia/aspiracion/PantallaAspiracion";
import { calcularPuntajesIntegrados } from "@/lib/logic/puntaje";
import { experienciaAudioAmbiente, experienciaTarjeta } from "@/lib/config/textos";
import { useExperienciaStore } from "@/lib/store/experiencia";
import { construirSesionRow } from "@/lib/supabase/sync";

export default function ExperienciaPage() {
  const paso = useExperienciaStore((s) => s.paso);
  const pausado = useExperienciaStore((s) => s.pausado);
  const sessionId = useExperienciaStore((s) => s.sessionId);
  const respuestasGustos = useExperienciaStore((s) => s.respuestasGustos);
  const respuestasActividades = useExperienciaStore((s) => s.respuestasActividades);
  const respuestasAsignaturas = useExperienciaStore((s) => s.respuestasAsignaturas);
  const aspiracion = useExperienciaStore((s) => s.aspiracion);
  const audioActivado = useExperienciaStore((s) => s.audioActivado);
  const inicializarSesion = useExperienciaStore((s) => s.inicializarSesion);
  const irAPaso = useExperienciaStore((s) => s.irAPaso);
  const pausar = useExperienciaStore((s) => s.pausar);
  const reanudar = useExperienciaStore((s) => s.reanudar);
  const activarAudio = useExperienciaStore((s) => s.activarAudio);
  const agregarRespuestaGustos = useExperienciaStore((s) => s.agregarRespuestaGustos);
  const sincronizarBloque = useExperienciaStore((s) => s.sincronizarBloque);
  const modoPrueba = useExperienciaStore((s) => s.modoPrueba);
  const setModoPrueba = useExperienciaStore((s) => s.setModoPrueba);
  const rellenarBloqueAlAzar = useExperienciaStore((s) => s.rellenarBloqueAlAzar);

  const [muted, setMuted] = useState(false);
  const [rellenando, setRellenando] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const gustosSincronizados = useRef(false);

  useEffect(() => {
    inicializarSesion();
  }, [inicializarSesion]);

  // Activación del modo prueba (Entrega 2): ?prueba=1 revalida contra la cookie
  // httpOnly de /debug (única puerta de escritura con es_prueba=true). Si la
  // revalidación falla (sin cookie, DEBUG_KEY no configurada, etc.) no hace nada.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("prueba") !== "1") return;
    fetch("/api/debug/verificar-prueba", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { ok?: boolean }) => {
        if (data?.ok === true) setModoPrueba(true);
      })
      .catch(() => {});
  }, [setModoPrueba]);

  const BLOQUES_RELLENABLES = new Set([
    "aspiracion",
    "gustos",
    "actividades",
    "asignaturas",
    "cognitivo",
    "divergente",
  ]);

  async function rellenarAlAzar() {
    if (rellenando) return;
    setRellenando(true);
    await rellenarBloqueAlAzar(paso);
    setRellenando(false);
  }

  const indice = respuestasGustos.length;
  // Bloque Integración: el top3 del primer pliegue usa el puntaje integrado
  // (45% contextos + 40% actividades/asignaturas + 15% aspiración), no solo A1.
  const top3 = useMemo(
    () =>
      calcularPuntajesIntegrados(respuestasGustos, respuestasActividades, respuestasAsignaturas, aspiracion).slice(
        0,
        3
      ),
    [respuestasGustos, respuestasActividades, respuestasAsignaturas, aspiracion]
  );
  const contextoActual = contextos[indice];
  const audioEfectivo = audioActivado && !muted;
  useAudioAmbiente(
    audioRef,
    paso === "gustos" ? contextoActual?.escenaId : undefined,
    audioEfectivo
  );

  // Bloque A (gustos) completado: sync de la sesión + todas sus respuestas.
  // La sesión debe crearse primero (FK session_id → sesiones.id en la migración 00001).
  // Guarda de ref: con el avance automático a actividades el paso ya no permanece
  // en "gustos" al completarse, así que el disparo único va por la condición.
  useEffect(() => {
    if (gustosSincronizados.current || !sessionId || indice < contextos.length) return;
    gustosSincronizados.current = true;
    // Aislamiento 00017: la fila de sesión se construye SIEMPRE vía
    // construirSesionRow. Si el modo prueba está activo, es_prueba se fuerza a true
    // ahí (y solo ahí); en flujo normal el campo se omite (BD default false). Este es
    // el ÚNICO punto de escritura de la sesión en todo el repo — verificado por grep.
    sincronizarBloque([
      {
        id: `sesion-${sessionId}`,
        tipo: "sesion",
        payload: construirSesionRow(sessionId, modoPrueba, {
          edad: null,
          curso: null,
          dispositivo: typeof navigator !== "undefined" ? navigator.userAgent : null,
        }),
      },
      {
        id: `gustos-${sessionId}`,
        tipo: "gustos",
        payload: respuestasGustos.map((r) => ({
          session_id: sessionId,
          contexto_id: r.contextoId,
          valor: r.valor,
          latencia_ms: null,
          ayuda_abierta: r.ayudaAbierta ?? false,
          audio_activado: r.audioActivado ?? false,
        })),
      },
    ]);
  }, [paso, indice, sessionId, respuestasGustos, sincronizarBloque, modoPrueba]);

  function responderGustos(valor: 0 | 1 | 2, ayudaAbierta: boolean) {
    agregarRespuestaGustos({
      contextoId: contextoActual.id,
      valor,
      ayudaAbierta,
      audioActivado: audioEfectivo,
    });
    // Bloque Integración: al completar los 20 contextos se avanza directo a
    // actividades; el "primer pliegue" (ResultadoParcial) se muestra al cerrar
    // el pilar completo de intereses, tras asignaturas.
    if (indice + 1 >= contextos.length) irAPaso("actividades");
  }

  let contenido: ReactNode;

  if (paso === "intro") {
    contenido = (
      <IntroExperiencia
        onEmpezar={(conAudio) => {
          activarAudio(conAudio);
          irAPaso("aspiracion");
        }}
      />
    );
  } else if (pausado && paso !== "informe") {
    // Pausa global (spec sección 6): válida en cualquier bloque con progreso que retomar
    // (gustos, actividades, asignaturas, cognitivo, verbal). La aspiración y el
    // resultado parcial son pantallas sin progreso (no tienen botón pausa) y el
    // informe es la pantalla final.
    contenido = (
      <section className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-tinta/70">Pausado. Vuelve cuando quieras.</p>
        <button
          onClick={reanudar}
          className="rounded-[14px] bg-coral px-6 py-3 text-base font-medium text-blanco-papel transition hover:opacity-90"
        >
          {experienciaTarjeta.reanudar}
        </button>
      </section>
    );
  } else if (paso === "actividades") {
    contenido = <BloqueActividades onCompletar={() => irAPaso("asignaturas")} onPausar={pausar} />;
  } else if (paso === "asignaturas") {
    contenido = <BloqueAsignaturas onCompletar={() => irAPaso("resultadoParcial")} onPausar={pausar} />;
  } else if (paso === "resultadoParcial") {
    contenido = <ResultadoParcial top3={top3} onContinuar={() => irAPaso("cognitivo")} />;
  } else if (paso === "aspiracion") {
    contenido = <PantallaAspiracion onContinuar={() => irAPaso("gustos")} />;
  } else if (paso === "cognitivo") {
    contenido = <BloqueCognitivo onCompletar={() => irAPaso("verbal")} onPausar={pausar} />;
  } else if (paso === "verbal") {
    contenido = <BloqueVerbal onCompletar={() => irAPaso("divergente")} onPausar={pausar} />;
  } else if (paso === "divergente") {
    contenido = <BloqueDivergente onCompletar={() => irAPaso("informe")} onPausar={pausar} />;
  } else if (paso === "informe") {
    contenido = <Informe />;
  } else {
    // Paso gustos activo: mostrar tarjetas una a una
    contenido = (
      <section className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-16 sm:px-8">
        <audio ref={audioRef} preload="none" />
        <BarraProgreso actual={indice} total={contextos.length} />

        <FoldTransition llave={contextoActual.id}>
          <TarjetaContexto contexto={contextoActual} onResponder={responderGustos} />
        </FoldTransition>
        <div className="flex items-center gap-4">
          <button onClick={pausar} className="text-sm text-tinta/60 underline">
            {experienciaTarjeta.pausa}
          </button>
          {audioActivado && (
            <button
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? experienciaAudioAmbiente.activarSonido : experienciaAudioAmbiente.silenciar}
              className="text-sm text-tinta/60 underline"
            >
              {muted ? experienciaAudioAmbiente.activarSonido : experienciaAudioAmbiente.silenciar}
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <>
      {modoPrueba && (
        <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-4 bg-dorado px-4 py-2 text-sm font-medium text-tinta shadow-md">
          <span>MODO PRUEBA — datos sintéticos, no se cuentan en las métricas</span>
          {BLOQUES_RELLENABLES.has(paso) && (
            <button
              onClick={rellenarAlAzar}
              disabled={rellenando}
              className="rounded-full bg-tinta px-3 py-1 text-blanco-papel underline-offset-2 transition enabled:hover:opacity-90 disabled:opacity-50"
            >
              {rellenando ? "Rellenando…" : "Rellenar al azar"}
            </button>
          )}
        </div>
      )}
      {contenido}
    </>
  );
}
