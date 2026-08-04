"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { informe, lecturasPorDimension, bloqueAspiracion, miCuenta } from "@/lib/config/textos";
import { useExperienciaStore } from "@/lib/store/experiencia";
import { calcularPuntajesIntegrados, detectarDiscrepancia } from "@/lib/logic/puntaje";
import { calcularPuntajesCognitivo } from "@/lib/logic/puntajeCognitivo";
import { recomendarCarreras } from "@/lib/logic/matching";
import { contextos } from "@/lib/data/contextos";
import { carreraPorId, type Carrera } from "@/lib/data/carreras";
import { GruaOrigami } from "@/components/origami/GruaOrigami";
import { obtenerAccessToken, supabase } from "@/lib/supabase/client";
import { sanitizarApodo } from "@/lib/logic/cuenta";
import type { PerfilResultado } from "@/lib/supabase/types";

// --- Helper para convertir puntaje numérico a etiqueta de capacidad ---
function etiquetaCapacidad(puntaje: number): string {
  if (puntaje >= 80) return informe.rangoCapacidad.muyAlto;
  if (puntaje >= 60) return informe.rangoCapacidad.alto;
  if (puntaje >= 40) return informe.rangoCapacidad.medio;
  return informe.rangoCapacidad.bajo;
}

interface Props {
  onVolver?: () => void; // opcional, para cerrar la experiencia
  // Modo estático (Tanda B): renderiza el informe desde una fila guardada
  // (/informe/[token]) en vez de calcularlo desde el store. No muestra el
  // bloque de guardar: la URL permanente ya es el acceso al informe.
  perfil?: PerfilResultado | null;
}

export function Informe({ onVolver, perfil }: Props) {
  const modoEstatico = !!perfil;
  const [animacionLista, setAnimacionLista] = useState(false);
  const [guardarCorreo, setGuardarCorreo] = useState("");
  const [guardarApodo, setGuardarApodo] = useState("");
  const [guardarEstado, setGuardarEstado] = useState<
    "idle" | "enviando" | "enviado" | "yaTenias" | "limite" | "error"
  >("idle");

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
  const top3 = useMemo(() => {
    if (perfil) {
      // La fila guardada usa `codigo`; el render espera `dimension` (misma clave).
      return perfil.dimensionTop3.map((d) => ({
        dimension: d.codigo,
        etiqueta: d.etiqueta,
        puntaje: d.puntaje,
      }));
    }
    return puntajesDimension.slice(0, 3);
  }, [perfil, puntajesDimension]);

  const discrepancia = useMemo(
    () =>
      perfil
        ? (perfil.discrepancia ?? null)
        : detectarDiscrepancia(respuestasGustos, respuestasActividades, respuestasAsignaturas, aspiracion),
    [perfil, respuestasGustos, respuestasActividades, respuestasAsignaturas, aspiracion]
  );

  // En modo estático la aspiración viene en la fila guardada (campo opcional).
  const aspiracionVista = perfil ? (perfil.aspiracion ?? null) : aspiracion;

  // Puntaje verbal
  const evaluacionVerbal = respuestasVerbal.find((r) => r.estado === "evaluado" && r.evaluacion);
  const puntajeVerbal = evaluacionVerbal
    ? (evaluacionVerbal.evaluacion as { puntaje?: number })?.puntaje ?? null
    : null;

  // Normalizar comunicación a 0-100 desde el puntaje de verbal (1-5 → 0-100).
  // Validez (plan de Camilo): sin evaluación válida → null, NUNCA un 0 inventado.
  // En modo estático el valor viene guardado en la fila (puede ser null en filas nuevas).
  const puntajeComunicacion = useMemo(() => {
    if (perfil) return perfil.capacidades.comunicacion;
    return puntajeVerbal ? Math.round((puntajeVerbal / 5) * 100) : null;
  }, [perfil, puntajeVerbal]);

  // Puntajes cognitivos (matrices/rotación/series/secuencias). En modo estático
  // se reconstruyen desde la fila; numerico es opcional (filas previas, 0 como
  // valor defensivo).
  const correctasMatrices = respuestasCognitivo.filter((r) => r.juego === "matrices" && r.correcto).length;
  const correctasRotacion = respuestasCognitivo.filter((r) => r.juego === "pliegues" && r.correcto).length;
  const correctasSeries = respuestasCognitivo.filter((r) => r.juego === "series" && r.correcto).length;
  const secuencias = respuestasCognitivo.filter((r) => r.juego === "secuencias");
  const largoMaximo = Math.max(...secuencias.map((r) => r.nivel), 0);

  const puntajesCognitivo = useMemo(() => {
    if (perfil) {
      const c = perfil.capacidades;
      return {
        patrones: c.patrones,
        numerico: c.numerico ?? 0,
        espacial: c.espacial,
        memoria: c.memoria,
        comunicacion: c.comunicacion,
      };
    }
    return calcularPuntajesCognitivo(
      correctasMatrices,
      correctasRotacion,
      largoMaximo,
      puntajeComunicacion,
      correctasSeries
    );
  }, [perfil, correctasMatrices, correctasRotacion, largoMaximo, puntajeComunicacion, correctasSeries]);

  // Carreras recomendadas (matching v2 sobre carreras curadas). En modo
  // estático se reconstruyen desde los ids guardados (carreraPorId).
  const carrerasRecomendadas = useMemo(
    () =>
      perfil
        ? perfil.carrerasRecomendadas
            .map((id) => ({ carrera: carreraPorId(id) }))
            .filter((r): r is { carrera: Carrera } => !!r.carrera)
        : recomendarCarreras(puntajesDimension, puntajesCognitivo),
    [perfil, puntajesDimension, puntajesCognitivo]
  );

  const perfilResultado = useMemo(
    () => ({
      dimensionTop3: top3.map((d) => ({ codigo: d.dimension, etiqueta: d.etiqueta, puntaje: d.puntaje })),
      capacidades: {
        patrones: puntajesCognitivo.patrones,
        numerico: puntajesCognitivo.numerico,
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
    if (modoEstatico || resultadoSincronizado.current || !sessionId) return;
    resultadoSincronizado.current = true;
    sincronizarBloque([
      { id: `resultado-${sessionId}`, tipo: "resultado", payload: { session_id: sessionId, perfil_json: perfilResultado } },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modoEstatico, sessionId, sincronizarBloque]);

  // Tanda A: vincula el correo a la sesión anónima. La conversión usa
  // updateUser({ email }) en el route, que mantiene el MISMO auth.uid(), así que
  // todas las filas de respuestas/resultados quedan bajo la cuenta nueva.
  const enviarVincular = async () => {
    if (!guardarCorreo.trim() || !sessionId) return;
    setGuardarEstado("enviando");
    try {
      // Guardamos el uid anónimo actual para que /guardar-informe confirme que la
      // cuenta vinculada es la misma (conversión con preservación, no merge).
      const { data: sesionActual } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
      const uidAnonimo = sesionActual.session?.user.id;
      if (!uidAnonimo) throw new Error("sin sesión");
      sessionStorage.setItem("mirai_uid_anonimo", uidAnonimo);
      // /guardar-informe usa este id para pedir el correo con el enlace
      // permanente (el token vive en la fila de resultados, RLS por uid).
      sessionStorage.setItem("mirai_sesion_id", sessionId);

      // El apodo no viaja por la red ni a logs: se aplica en /guardar-informe
      // vía updateUser({ data: { apodo } }).
      const apodoLimpio = sanitizarApodo(guardarApodo);
      if (apodoLimpio) sessionStorage.setItem("mirai_apodo_pendiente", apodoLimpio);

      const token = await obtenerAccessToken();
      if (!token) throw new Error("sin sesión");

      const respuesta = await fetch("/api/vincular-cuenta", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ correo: guardarCorreo.trim() }),
      });
      if (respuesta.status === 429) {
        setGuardarEstado("limite");
        return;
      }
      if (!respuesta.ok) throw new Error("envío falló");

      const cuerpo = (await respuesta.json()) as { yaTeniasCuenta?: boolean };
      setGuardarEstado(cuerpo.yaTeniasCuenta ? "yaTenias" : "enviado");
    } catch {
      setGuardarEstado("error");
    }
  };

  // Animación de la grulla: se salta después de 3s o al hacer clic.
  // En modo estático (informe desde /informe/[token]) no hay animación.
  if (!modoEstatico && !animacionLista) {
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
        {aspiracionVista && (
          <p className="mt-2 text-sm text-tinta/70">
            {informe.elegisteAspiracion}{" "}
            <span className="font-medium text-tinta">
              {bloqueAspiracion.opciones.find((o) => o.valor === aspiracionVista.opcion)?.label ?? aspiracionVista.opcion}
            </span>
          </p>
        )}
        {discrepancia && (
          <p className="mt-3 rounded-[10px] bg-blanco-papel p-3 text-sm text-tinta/80">
            <span className="font-medium text-tinta">{informe.discrepanciaTitulo}. </span>
            {informe.discrepanciaTexto(discrepancia.etiquetaGustos, discrepancia.etiquetaActividades)}
          </p>
        )}
      </section>

      {/* 2. Capacidades */}
      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold">{informe.seccionCapacidades}</h2>
        <div className="mt-4 space-y-4">
          {[
            { key: "patrones", label: informe.leyendaCapacidades.patrones, valor: puntajesCognitivo.patrones },
            { key: "numerico", label: informe.leyendaCapacidades.numerico, valor: puntajesCognitivo.numerico },
            { key: "espacial", label: informe.leyendaCapacidades.espacial, valor: puntajesCognitivo.espacial },
            { key: "memoria", label: informe.leyendaCapacidades.memoria, valor: puntajesCognitivo.memoria },
            { key: "comunicacion", label: informe.leyendaCapacidades.comunicacion, valor: puntajeComunicacion },
          ].map((cap) => (
            <div key={cap.key}>
              {cap.valor === null ? (
                <>
                  <div className="flex items-baseline justify-between">
                    <span className="text-base font-medium text-tinta">
                      {informe.etiquetaCapacidades(cap.label)}
                    </span>
                    <span className="text-sm text-tinta/50">{informe.sinEvaluar}</span>
                  </div>
                  <p className="mt-1 text-sm text-tinta/50">{informe.sinEvaluarNota}</p>
                </>
              ) : (
                <>
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
                </>
              )}
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

      {/* 5. Guardar informe (Tanda A): vincula el correo a la sesión anónima.
          No se muestra en modo estático: la URL permanente ya es el acceso. */}
      {!modoEstatico && (
      <section className="mt-8 rounded-[14px] bg-papel-sombra/30 p-5">
        <h2 className="font-display text-lg font-semibold">{informe.guardarTitulo}</h2>
        <p className="mt-1 text-sm text-tinta/60">{informe.guardarTexto}</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            value={guardarCorreo}
            onChange={(e) => setGuardarCorreo(e.target.value)}
            placeholder={informe.guardarCorreoPlaceholder}
            className="flex-1 rounded-[14px] border border-tinta/10 bg-blanco-papel px-4 py-2 text-sm text-tinta outline-none transition focus:border-coral/50"
            aria-label={informe.guardarCorreoPlaceholder}
          />
          <button
            onClick={enviarVincular}
            disabled={guardarEstado === "enviando" || guardarEstado === "enviado" || !guardarCorreo.trim()}
            className="rounded-[14px] bg-coral px-4 py-2 text-sm font-medium text-blanco-papel transition enabled:hover:opacity-90 disabled:opacity-40"
          >
            {guardarEstado === "enviado" ? informe.guardarEnviado : informe.guardarBoton}
          </button>
        </div>
        <input
          type="text"
          value={guardarApodo}
          onChange={(e) => setGuardarApodo(e.target.value)}
          maxLength={20}
          placeholder={informe.guardarApodoPlaceholder}
          className="mt-2 w-full rounded-[14px] border border-tinta/10 bg-blanco-papel px-4 py-2 text-sm text-tinta outline-none transition focus:border-coral/50 sm:w-1/2"
          aria-label={informe.guardarApodoPlaceholder}
        />
        {guardarEstado === "enviado" && (
          <>
            <p className="mt-2 text-sm text-salvia">{informe.guardarExito}</p>
            <a
              href="/mi-cuenta"
              className="mt-1 inline-block text-sm font-medium text-coral underline transition hover:opacity-80"
            >
              {miCuenta.verMisInformes}
            </a>
          </>
        )}
        {guardarEstado === "yaTenias" && <p className="mt-2 text-sm text-tinta/70">{informe.guardarYaTenias}</p>}
        {guardarEstado === "limite" && <p className="mt-2 text-sm text-red-500">{informe.guardarLimite}</p>}
        {guardarEstado === "error" && <p className="mt-2 text-sm text-red-500">{informe.guardarError}</p>}
      </section>
      )}

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
