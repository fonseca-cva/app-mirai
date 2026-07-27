"use client";

import { useEffect, useMemo } from "react";
import { IntroExperiencia } from "@/components/experiencia/IntroExperiencia";
import { TarjetaContexto } from "@/components/experiencia/TarjetaContexto";
import { BarraProgreso } from "@/components/experiencia/BarraProgreso";
import { ResultadoParcial } from "@/components/experiencia/ResultadoParcial";
import { FoldTransition } from "@/components/origami/FoldTransition";
import { BloqueCognitivo } from "@/components/experiencia/juegos/BloqueCognitivo";
import { BloqueVerbal } from "@/components/experiencia/verbal/BloqueVerbal";
import { Informe } from "@/components/experiencia/Informe";
import { contextos } from "@/lib/data/contextos";
import { calcularPuntajes } from "@/lib/logic/puntaje";
import { experienciaTarjeta } from "@/lib/config/textos";
import { useExperienciaStore } from "@/lib/store/experiencia";

export default function ExperienciaPage() {
  const paso = useExperienciaStore((s) => s.paso);
  const pausado = useExperienciaStore((s) => s.pausado);
  const sessionId = useExperienciaStore((s) => s.sessionId);
  const respuestasGustos = useExperienciaStore((s) => s.respuestasGustos);
  const inicializarSesion = useExperienciaStore((s) => s.inicializarSesion);
  const irAPaso = useExperienciaStore((s) => s.irAPaso);
  const pausar = useExperienciaStore((s) => s.pausar);
  const reanudar = useExperienciaStore((s) => s.reanudar);
  const agregarRespuestaGustos = useExperienciaStore((s) => s.agregarRespuestaGustos);
  const sincronizarBloque = useExperienciaStore((s) => s.sincronizarBloque);

  useEffect(() => {
    inicializarSesion();
  }, [inicializarSesion]);

  const indice = respuestasGustos.length;
  const top3 = useMemo(() => calcularPuntajes(respuestasGustos).slice(0, 3), [respuestasGustos]);

  // Bloque A (gustos) completado: sync de la sesión + todas sus respuestas.
  // La sesión debe crearse primero (FK session_id → sesiones.id en la migración 00001).
  useEffect(() => {
    if (paso !== "gustos" || indice < contextos.length || !sessionId) return;
    sincronizarBloque([
      {
        id: `sesion-${sessionId}`,
        tipo: "sesion",
        payload: {
          id: sessionId,
          creada_en: new Date().toISOString(),
          edad: null,
          curso: null,
          dispositivo: typeof navigator !== "undefined" ? navigator.userAgent : null,
        },
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
        })),
      },
    ]);
  }, [paso, indice, sessionId, respuestasGustos, sincronizarBloque]);

  function responderGustos(valor: 0 | 1 | 2, ayudaAbierta: boolean) {
    const contextoActual = contextos[indice];
    agregarRespuestaGustos({ contextoId: contextoActual.id, valor, ayudaAbierta });
  }

  if (paso === "intro") {
    return <IntroExperiencia onEmpezar={() => irAPaso("gustos")} />;
  }

  // Pausa global (spec sección 6): válida en cualquier bloque con progreso que retomar
  // (gustos, cognitivo, verbal). El informe es la pantalla final, no requiere pausa.
  if (pausado && paso !== "informe") {
    return (
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
  }

  if (paso === "gustos" && indice >= contextos.length) {
    return <ResultadoParcial top3={top3} onContinuar={() => irAPaso("cognitivo")} />;
  }

  if (paso === "cognitivo") {
    return <BloqueCognitivo onCompletar={() => irAPaso("verbal")} onPausar={pausar} />;
  }

  if (paso === "verbal") {
    return <BloqueVerbal onCompletar={() => irAPaso("informe")} onPausar={pausar} />;
  }

  if (paso === "informe") {
    return <Informe />;
  }

  // Paso gustos activo: mostrar tarjetas una a una
  const contextoActual = contextos[indice];

  return (
    <section className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-16 sm:px-8">
      <BarraProgreso actual={indice} total={contextos.length} />

      <FoldTransition llave={contextoActual.id}>
        <TarjetaContexto contexto={contextoActual} onResponder={responderGustos} />
      </FoldTransition>
      <button onClick={pausar} className="text-sm text-tinta/60 underline">
        {experienciaTarjeta.pausa}
      </button>
    </section>
  );
}
