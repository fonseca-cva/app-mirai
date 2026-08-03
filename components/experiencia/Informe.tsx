"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { informe, lecturasPorDimension, bloqueAspiracion } from "@/lib/config/textos";
import { useExperienciaStore } from "@/lib/store/experiencia";
import { calcularPuntajesIntegrados } from "@/lib/logic/puntaje";
import { calcularPuntajesCognitivo } from "@/lib/logic/puntajeCognitivo";
import { recomendarCarreras } from "@/lib/logic/matching";
import { contextos } from "@/lib/data/contextos";
import { GruaOrigami } from "@/components/origami/GruaOrigami";
import { obtenerAccessToken } from "@/lib/supabase/client";

// --- Helper para convertir puntaje numérico a etiqueta de capacidad ---
function etiquetaCapacidad(puntaje: number): string {
  if (puntaje >= 80) return informe.rangoCapacidad.muyAlto;
  if (puntaje >= 60) return informe.rangoCapacidad.alto;
  if (puntaje >= 40) return informe.rangoCapacidad.medio;
  return informe.rangoCapacidad.bajo;
}

interface Props {
  onVolver?: () => void; // opcional, para cerrar la experiencia
}

export function Informe({ onVolver }: Props) {
  const [animacionLista, setAnimacionLista] = useState(false);
  const [correo, setCorreo] = useState("");
  const [correoEnviado, setCorreoEnviado] = useState(false);
  const [correoError, setCorreoError] = useState(false);

  const sessionId = useExperienciaStore((s) => s.sessionId);
  const respuestasGustos = useExperienciaStore((s) => s.respuestasGustos);
  const respuestasActividades = useExperienciaStore((s) => s.respuestasActividades);
  const respuestasAsignaturas = useExperienciaStore((s) => s.respuestasAsignaturas);
  const aspiracion = useExperienciaStore((s) => s.aspiracion);
  const respuestasCognitivo = useExperienciaStore((s) => s.respuestasCognitivo);
  const respuestasVerbal = useExperienciaStore((s) => s.respuestasVerbal);
  const sincronizarBloque = useExperienciaStore((s) => s.sincronizarBloque);
  const resultadoSincronizado = useRef(false);

  // Bloque Integración: el perfil de intereses del informe usa el puntaje
  // integrado (45% contextos + 40% actividades/asignaturas + 15% aspiración).
  const puntajesDimension = useMemo(
    () => calcularPuntajesIntegrados(respuestasGustos, respuestasActividades, respuestasAsignaturas, aspiracion),
    [respuestasGustos, respuestasActividades, respuestasAsignaturas, aspiracion]
  );
  const top3 = puntajesDimension.slice(0, 3);

  // Puntaje verbal
  const evaluacionVerbal = respuestasVerbal.find((r) => r.estado === "evaluado" && r.evaluacion);
  const puntajeVerbal = evaluacionVerbal
    ? (evaluacionVerbal.evaluacion as { puntaje?: number })?.puntaje ?? null
    : null;

  // Normalizar comunicación a 0-100 desde el puntaje de verbal (1-5 → 0-100)
  const puntajeComunicacion = puntajeVerbal ? Math.round((puntajeVerbal / 5) * 100) : 0;

  // Puntajes cognitivos
  const correctasMatrices = respuestasCognitivo.filter((r) => r.juego === "matrices" && r.correcto).length;
  const correctasRotacion = respuestasCognitivo.filter((r) => r.juego === "pliegues" && r.correcto).length;
  const secuencias = respuestasCognitivo.filter((r) => r.juego === "secuencias");
  const largoMaximo = Math.max(...secuencias.map((r) => r.nivel), 0);

  const puntajesCognitivo = calcularPuntajesCognitivo(correctasMatrices, correctasRotacion, largoMaximo, puntajeComunicacion);

  // Carreras recomendadas (matching v2 sobre carreras curadas)
  const carrerasRecomendadas = useMemo(
    () => recomendarCarreras(puntajesDimension, puntajesCognitivo),
    [puntajesDimension, puntajesCognitivo]
  );

  const perfilResultado = useMemo(
    () => ({
      dimensionTop3: top3.map((d) => ({ codigo: d.dimension, etiqueta: d.etiqueta, puntaje: d.puntaje })),
      capacidades: {
        patrones: puntajesCognitivo.patrones,
        espacial: puntajesCognitivo.espacial,
        memoria: puntajesCognitivo.memoria,
        comunicacion: puntajeComunicacion,
      },
      carrerasRecomendadas: carrerasRecomendadas.map((c) => c.carrera.id),
      generado_en: new Date().toISOString(),
    }),
    [top3, puntajesCognitivo, puntajeComunicacion, carrerasRecomendadas]
  );

  // Bloque D (informe) generado: sync del perfil de resultados, una sola vez por sesión.
  useEffect(() => {
    if (resultadoSincronizado.current || !sessionId) return;
    resultadoSincronizado.current = true;
    sincronizarBloque([
      { id: `resultado-${sessionId}`, tipo: "resultado", payload: { session_id: sessionId, perfil_json: perfilResultado } },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, sincronizarBloque]);

  // Animación de la grulla: se salta después de 3s o al hacer clic
  if (!animacionLista) {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
        <GruaOrigami className="h-32 w-32" animarEntrada />
        <p className="font-display text-xl text-tinta/70">{informe.subtitulo}</p>
        <button
          onClick={() => setAnimacionLista(true)}
          className="text-sm text-tinta/50 underline transition hover:text-tinta/80"
        >
          {informe.saltarAnimacion}
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-8">
      {/* Título */}
      <h1 className="font-display text-3xl font-semibold">{informe.titulo}</h1>
      <p className="mt-2 text-base text-tinta/60">{informe.subtitulo}</p>

      {/* 1. Perfil de intereses */}
      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold">{informe.seccionIntereses}</h2>
        <div className="mt-4 space-y-4">
          {top3.map((dim, i) => (
            <div key={dim.dimension}>
              <div className="flex items-baseline justify-between">
                <span className="text-base font-medium text-tinta">
                  {i + 1}. {dim.etiqueta}
                </span>
                <span className="text-sm text-tinta/50">{dim.puntaje}%</span>
              </div>
              {/* Barra estilo tira de papel */}
              <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-papel-sombra/60">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-salvia to-teal transition-all duration-700"
                  style={{ width: `${dim.puntaje}%` }}
                  role="progressbar"
                  aria-valuenow={dim.puntaje}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${dim.etiqueta}: ${dim.puntaje}%`}
                />
              </div>
              {/* Lectura amable */}
              {lecturasPorDimension[dim.dimension] && (
                <p className="mt-1 text-sm text-tinta/60">{lecturasPorDimension[dim.dimension]}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 1.5 Convergencia: de dónde sale el perfil de intereses (45/40/15) */}
      <section className="mt-8 rounded-2xl bg-papel-sombra/40 p-4">
        <h3 className="font-display text-base font-semibold">{informe.seccionConvergencia}</h3>
        <p className="mt-1 text-sm text-tinta/60">{informe.textoConvergencia}</p>
        <ul className="mt-3 space-y-1 text-sm text-tinta/80">
          <li>{informe.fuenteGustos}</li>
          <li>{informe.fuenteActividades}</li>
          <li>{informe.fuenteAsignaturas}</li>
          <li>{informe.fuenteAspiracion}</li>
        </ul>
        {aspiracion && (
          <p className="mt-2 text-sm text-tinta/70">
            {informe.elegisteAspiracion}{" "}
            <span className="font-medium text-tinta">
              {bloqueAspiracion.opciones.find((o) => o.valor === aspiracion.opcion)?.label ?? aspiracion.opcion}
            </span>
          </p>
        )}
      </section>

      {/* 2. Capacidades */}
      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold">{informe.seccionCapacidades}</h2>
        <div className="mt-4 space-y-4">
          {[
            { key: "patrones", label: informe.leyendaCapacidades.patrones, valor: puntajesCognitivo.patrones },
            { key: "espacial", label: informe.leyendaCapacidades.espacial, valor: puntajesCognitivo.espacial },
            { key: "memoria", label: informe.leyendaCapacidades.memoria, valor: puntajesCognitivo.memoria },
            { key: "comunicacion", label: informe.leyendaCapacidades.comunicacion, valor: puntajeComunicacion },
          ].map((cap) => (
            <div key={cap.key}>
              <div className="flex items-baseline justify-between">
                <span className="text-base font-medium text-tinta">
                  {informe.etiquetaCapacidades(cap.label)}
                </span>
                <span className="text-sm text-tinta/50">{etiquetaCapacidad(cap.valor)}</span>
              </div>
              <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-papel-sombra/60">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-coral/70 to-dorado transition-all duration-700"
                  style={{ width: `${cap.valor}%` }}
                  role="progressbar"
                  aria-valuenow={cap.valor}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${cap.label}: ${etiquetaCapacidad(cap.valor)}`}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Caminos para explorar */}
      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold">{informe.seccionCaminos}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {carrerasRecomendadas.map((rec) => (
            <div
              key={rec.carrera.id}
              className="rounded-[14px] border border-tinta/10 bg-blanco-papel p-4 transition hover:border-tinta/20"
            >
              <h3 className="font-display text-lg font-medium text-tinta">{rec.carrera.nombre}</h3>
              {rec.carrera.notaHonesta && (
                <p className="mt-1 text-sm text-tinta/60">{rec.carrera.notaHonesta}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 4. Cierre honesto */}
      <section className="mt-12 rounded-[14px] bg-papel-sombra/30 p-6 text-center">
        <p className="text-base leading-relaxed text-tinta/80">{informe.cierre}</p>
      </section>

      {/* 5. Correo opcional */}
      <section className="mt-8">
        <p className="text-sm text-tinta/60">{informe.correoOpcional}</p>
        <div className="mt-2 flex gap-2">
          <input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder={informe.correoPlaceholder}
            className="flex-1 rounded-[14px] border border-tinta/10 bg-blanco-papel px-4 py-2 text-sm text-tinta outline-none transition focus:border-coral/50"
            aria-label={informe.correoOpcional}
          />
          <button
            onClick={async () => {
              if (!correo.trim() || !sessionId) return;
              setCorreoError(false);
              try {
                // Reintenta el upsert de resultados por si el sync del efecto (al montar)
                // todavía no terminó — evita que /api/enviar-informe no encuentre la fila.
                await sincronizarBloque([
                  { id: `resultado-${sessionId}`, tipo: "resultado", payload: { session_id: sessionId, perfil_json: perfilResultado } },
                  { id: `correo-${sessionId}`, tipo: "correo", payload: { session_id: sessionId, email: correo.trim() } },
                ]);

                const token = await obtenerAccessToken();
                if (!token) throw new Error("sin sesión");

                const respuesta = await fetch("/api/enviar-informe", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ sessionId }),
                });
                if (!respuesta.ok) throw new Error("envío falló");

                setCorreoEnviado(true);
              } catch {
                setCorreoError(true);
              }
            }}
            disabled={!correo.trim() || correoEnviado}
            className="rounded-[14px] bg-coral px-4 py-2 text-sm font-medium text-blanco-papel transition enabled:hover:opacity-90 disabled:opacity-40"
          >
            {correoEnviado ? informe.correoGracias : informe.correoEnviar}
          </button>
        </div>
        {correoError && <p className="mt-1 text-sm text-red-500">{informe.correoError}</p>}
      </section>

      {/* Disclaimer */}
      <p className="mt-12 text-xs text-tinta/40">{informe.disclaimer}</p>

      {/* Volver */}
      {onVolver && (
        <div className="mt-8 text-center">
          <button
            onClick={onVolver}
            className="rounded-[14px] bg-tinta px-6 py-3 text-base font-medium text-blanco-papel transition hover:opacity-90"
          >
            Volver al inicio
          </button>
        </div>
      )}
    </section>
  );
}
