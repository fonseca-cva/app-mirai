"use client";

import { useEffect, useMemo, useRef, useState, useCallback, useSyncExternalStore, type ReactNode } from "react";
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
import { experienciaAudioAmbiente, experienciaTarjeta, juegosCognitivos } from "@/lib/config/textos";
import { useExperienciaStore } from "@/lib/store/experiencia";
import { estadoBloque } from "@/lib/store/checkpoints";
import { inicializarPersistencia } from "@/lib/store/almacenamiento";
import { sesionEnCurso } from "@/lib/store/sesion";
import {
  alDetectarUrlPrueba,
  alDescartarEnPrueba,
  alResolverVerificacion,
  alFallarVerificacion,
  bloqueaEntrada,
  mensajeBloqueo,
  puedeEntrar,
  faseInicial,
  type FaseAutorizacion,
} from "@/lib/store/modoPruebaMaquina";
import { construirSesionRow } from "@/lib/supabase/sync";

// window.location.search no emite eventos: solo importa al montar la página, así
// que un no-op como suscriptor es lo correcto. Permite derivar `urlPidePrueba`
// sin escribir estado dentro de un efecto.

// ¿Ya estamos en el cliente? useSyncExternalStore devuelve false en el servidor y
// true en el cliente, sin desajuste de hidratación. Se usa para no calcular el
// índice de gustos a partir del estado persistido durante el render del servidor
// (eso producía el error de hidratación #418).
function suscribirHidratacion(): () => void {
  return () => {};
}
function useHidratado(): boolean {
  return useSyncExternalStore(
    suscribirHidratacion,
    () => true,
    () => false
  );
}

function suscribirUrlPrueba(): () => void {
  return () => {};
}

export default function ExperienciaPage() {
  const paso = useExperienciaStore((s) => s.paso);
  const pausado = useExperienciaStore((s) => s.pausado);
  const sessionId = useExperienciaStore((s) => s.sessionId);
  const respuestasGustos = useExperienciaStore((s) => s.respuestasGustos);
  const respuestasActividades = useExperienciaStore((s) => s.respuestasActividades);
  const respuestasAsignaturas = useExperienciaStore((s) => s.respuestasAsignaturas);
  const aspiracion = useExperienciaStore((s) => s.aspiracion);
  const audioActivado = useExperienciaStore((s) => s.audioActivado);
  const iniciarNuevaExperiencia = useExperienciaStore((s) => s.iniciarNuevaExperiencia);
  const retomarExperiencia = useExperienciaStore((s) => s.retomarExperiencia);
  const descartarExperiencia = useExperienciaStore((s) => s.descartarExperiencia);
  const irAPaso = useExperienciaStore((s) => s.irAPaso);
  const pausar = useExperienciaStore((s) => s.pausar);
  const reanudar = useExperienciaStore((s) => s.reanudar);
  const activarAudio = useExperienciaStore((s) => s.activarAudio);
  const agregarRespuestaGustos = useExperienciaStore((s) => s.agregarRespuestaGustos);
  const sincronizarBloque = useExperienciaStore((s) => s.sincronizarBloque);
  const modoPrueba = useExperienciaStore((s) => s.modoPrueba);
  const setModoPrueba = useExperienciaStore((s) => s.setModoPrueba);
  const modoPruebaReal = useExperienciaStore((s) => s.modoPruebaReal);
  const setModoPruebaReal = useExperienciaStore((s) => s.setModoPruebaReal);
  const hayExperienciaReanudable = useExperienciaStore((s) => s.hayExperienciaReanudable);
  const marcarExperienciaIncompleta = useExperienciaStore((s) => s.marcarExperienciaIncompleta);
  const pruebaRealCortada = useExperienciaStore((s) => s.pruebaRealCortada);
  const rellenarBloqueAlAzar = useExperienciaStore((s) => s.rellenarBloqueAlAzar);
  const encolarSesionPadre = useExperienciaStore((s) => s.encolarSesionPadre);
  const purgarEstadoInvalido = useExperienciaStore((s) => s.purgarEstadoInvalido);
  const reconstruirTareasPendientes = useExperienciaStore((s) => s.reconstruirTareasPendientes);
  const sesionEraPrueba = useExperienciaStore((s) => s.sesionEraPrueba);

  const [muted, setMuted] = useState(false);
  const [rellenando, setRellenando] = useState(false);
  // Estado de la autorización de modo prueba, extraído a una máquina de estados
  // comprobable (lib/store/modoPrueba.ts):
  //   * 'no-pedida'  → flujo normal, no se valida nada (cero overhead).
  //   * 'validando'  → ?prueba=1 en curso. BLOQUEA la entrada (ver abajo): antes
  //                    la interfaz no se bloqueaba, así que un clic rápido en
  //                    "Empezar" durante el fetch creaba y escribía la sesión
  //                    ANTES de saber si la prueba estaba autorizada.
  //   * 'autorizada' → cookie válida, se puede escribir con es_prueba.
  //   * 'fallida'    → se detiene con mensaje visible; NUNCA se sigue como normal.
  // ¿La URL pidió modo prueba? Es una lectura PURA de window.location, así que se
  // deriva con useSyncExternalStore en vez de escribirse en un useState dentro del
  // efecto (eso provocaba un render en cascada — react-hooks/set-state-in-effect).
  // En el servidor devuelve false.
  const urlPidePrueba = useSyncExternalStore(
    suscribirUrlPrueba,
    () => new URLSearchParams(window.location.search).get("prueba") === "1",
    () => false
  );
  // La fase arranca desde la máquina, PERO el inicializador de useState NO es la
  // garantía de bloqueo (ver la condición efectiva más abajo):
  //   * `useSyncExternalStore` devuelve false en el snapshot del SERVIDOR, así que
  //     en SSR/primera hidratación `urlPidePrueba` es false y la fase nacería
  //     'no-pedida';
  //   * cuando el snapshot del cliente pasa a true, useState NO se reinicializa.
  // Por eso el bloqueo se calcula con `urlPidePrueba` en cada render, y el efecto
  // mueve la fase a 'validando' explícitamente al detectar la URL.
  const [faseAutorizacionPrueba, setFaseAutorizacionPrueba] = useState<FaseAutorizacion>(() =>
    faseInicial(urlPidePrueba)
  );
  const [revalidando, setRevalidando] = useState(false);

  // Tipo de prueba pedido por la URL: "real" (?prueba=1&real=1) usa /api/evaluar
  // (persiste igual que producción); "simple" usa /api/debug/evaluar (no persiste).
  // Se DERIVA de la URL y se conserva, para que reautorizar tras "Empezar de nuevo"
  // no degrade una prueba real a simple (el bug: reautorizarPrueba solo activaba
  // modoPrueba, así que el bloque verbal volvía a /api/debug/evaluar).
  const pidePruebaReal = useSyncExternalStore(
    suscribirUrlPrueba,
    () => new URLSearchParams(window.location.search).get("real") === "1",
    () => false
  );
  // Decisión de retomar-vs-empezar (pilot readiness, PC compartido): si el
  // navegador tiene una cookie de sesión al montar, NO se entra solo — se le
  // pregunta al alumno, porque la sesión puede ser del compañero anterior.
  // decisionTomada = el alumno ya eligió (o no había nada que retomar).
  const [decisionTomada, setDecisionTomada] = useState(false);
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false);
  // Mientras se crea/confirma la sesión padre, el CTA queda bloqueado y no se
  // avanza a aspiración. Si no se pudo asegurar, se muestra un error con reintento
  // en vez de seguir hacia un flujo que escribiría sin padre.
  const [creandoSesion, setCreandoSesion] = useState(false);
  const [errorCrearSesion, setErrorCrearSesion] = useState<string | null>(null);

  // Nota: la decisión de retomar usa `hayExperienciaReanudable()` del store, que
  // aplica la coherencia cookie ↔ estado persistido (ver lib/store/sesion.ts). Ya
  // NO basta con "existe una cookie", que era lo que permitía mezclar el estado
  // de un alumno con la cookie de otro.
  const audioRef = useRef<HTMLAudioElement>(null);
  const gustosSincronizados = useRef(false);

  // Al montar, el efecto SOLO purga el estado incoherente con la cookie (cookie
  // ausente/distinta o expirado). NO sincroniza ni reconstruye NADA.
  //
  // Por qué es importante que no reconstruya acá: el alumno todavía no eligió
  // "Continuar". Escribir antes de esa decisión significaría (a) persistir datos
  // de una experiencia que el siguiente alumno va a descartar, y (b) hacerlo con
  // `modoPrueba === false` (no se persiste y aún no se reautorizó), recreando una
  // sesión de prueba COMO REAL si su fila padre no existía. La reconstrucción vive
  // ahora en `continuarEnCurso`, después de decidir y de autorizar.
  // ARRANQUE DE LA PERSISTENCIA — orden determinista.
  //
  // El store usa `skipHydration`, así que NO se hidrata solo: aquí se hace en el
  // orden correcto (migrar → rehidratar → purgar). Antes, zustand hidrataba al
  // crear el store (antes de migrar) y el estado migrado se ignoraba hasta una
  // segunda recarga.
  //
  // Mientras esto corre, `hidratado` es false y la página muestra el placeholder:
  // no se decide nada de reanudación antes de tener el estado definitivo.
  const [persistenciaLista, setPersistenciaLista] = useState(false);

  useEffect(() => {
    let activo = true;
    void (async () => {
      await inicializarPersistencia({
        rehydrate: () => useExperienciaStore.persist.rehydrate(),
        leerCookie: sesionEnCurso,
      });
      if (!activo) return;
      // Recién ahora, con el estado definitivo en memoria: purgar lo incoherente.
      purgarEstadoInvalido();
      setPersistenciaLista(true);
    })();
    return () => {
      activo = false;
    };
  }, [purgarEstadoInvalido]);

  // Al montar, resolvemos el estado inicial de la experiencia:
  //   * Con sesión EN CURSO en el navegador → mostramos la pantalla de decisión
  //     ("Continuar" vs "Empezar de nuevo"). Nunca se entra a la experiencia
  //     arrastrando las respuestas de otro alumno del mismo PC.
  //   * Sin sesión en curso → no creamos nada todavía; el sessionId nuevo nace
  //     cuando el alumno pulsa "Empezar" en la intro.

  // Al montar, resolvemos el estado inicial de la experiencia:
  //   * Con sesión EN CURSO en el navegador → mostramos la pantalla de decisión
  //     ("Continuar" vs "Empezar de nuevo"). Nunca se entra a la experiencia
  //     arrastrando las respuestas de otro alumno del mismo PC.
  //   * Sin sesión en curso → no creamos nada todavía; el sessionId nuevo nace
  //     cuando el alumno pulsa "Empezar" en la intro.
  //
  // REGRESIÓN CORREGIDA (doble rotación de sesión): antes, "Empezar de nuevo" en
  // ESTA pantalla ya creaba una sesión, y luego la intro volvía a llamar
  // iniciarNuevaExperiencia() al pulsar su CTA → dos sessionIds por experiencia,
  // el primero huérfano. Ahora "Empezar de nuevo" solo DESCARTA (rotar es crear,
  // y crear ocurre una sola vez, en el CTA de la intro). Y "Continuar" retoma el
  // MISMO sessionId, así que el CTA de la intro ya no debe crear nada: para eso
  // existe `crearEnIntro`.
  // Reautoriza tras "Empezar de nuevo" dentro de una URL de prueba: el descarte
  // apaga el modo y el efecto de arriba no vuelve a correr (sus deps no cambian),
  // así que sin esto la prueba se degradaría a flujo normal en silencio.
  const reautorizarPrueba = useCallback(async (): Promise<boolean> => {
    if (!urlPidePrueba) return true;
    setRevalidando(true);
    setFaseAutorizacionPrueba(alDescartarEnPrueba());
    try {
      const r = await fetch("/api/debug/verificar-prueba", { cache: "no-store" });
      const data = (await r.json()) as { ok?: boolean };
      if (data?.ok === true) {
        setModoPrueba(true);
        // CONSERVA el tipo de prueba pedido en la URL: sin esto, una prueba real
        // reautorizada seguía marcada como real en modoPruebaReal=false y el bloque
        // verbal caía a /api/debug/evaluar (dejaba de persistir sin avisar).
        setModoPruebaReal(pidePruebaReal);
        setFaseAutorizacionPrueba(alResolverVerificacion("validando", true, pidePruebaReal));
        setRevalidando(false);
        return true;
      }
    } catch {
      // cae al fail-stop de abajo
    }
    setModoPrueba(false);
    setModoPruebaReal(false);
    setFaseAutorizacionPrueba(alFallarVerificacion());
    setRevalidando(false);
    return false;
  }, [urlPidePrueba, pidePruebaReal, setModoPrueba, setModoPruebaReal]);

  const empezarNueva = useCallback(async () => {
    descartarExperiencia();
    // Dentro de una URL de prueba, "Empezar de nuevo" NO puede degradar la
    // experiencia a flujo normal: se reautoriza antes de continuar.
    await reautorizarPrueba();
    setDecisionTomada(true);
    setConfirmandoDescarte(false);
  }, [descartarExperiencia, reautorizarPrueba]);

  const continuarEnCurso = useCallback(async () => {
    // Se lee ANTES de retomar: si el estado se purga (incoherente), ya no importa.
    const requiereAutorizacionPrueba = sesionEraPrueba;
    const retomada = retomarExperiencia();
    // Si el estado persistido no es coherente con la cookie (o no hay cookie), se
    // purga y el CTA de la intro creará la sesión nueva.
    if (!retomada) {
      descartarExperiencia();
      setDecisionTomada(true);
      setConfirmandoDescarte(false);
      return;
    }

    // 1) Si la sesión se creó en modo prueba, hay que REAUTORIZAR antes de
    //    reconstruir nada. El metadato `sesionEraPrueba` no autoriza: solo obliga
    //    a revalidar. Si no se puede, se detiene el flujo y NUNCA se reconstruye
    //    como sesión normal (eso contaminaría las métricas con datos de prueba).
    if (requiereAutorizacionPrueba) {
      const autorizada = await reautorizarPrueba();
      if (!autorizada) {
        // El fail-stop visible ya está activo (fase 'fallida'): no se escribe nada.
        setDecisionTomada(true);
        setConfirmandoDescarte(false);
        return;
      }
    }

    // 2) Recién ahora, con la decisión tomada y la autorización resuelta, se
    //    reconstruyen las tareas pendientes desde el ESTADO rehidratado.
    await reconstruirTareasPendientes();
    setDecisionTomada(true);
    setConfirmandoDescarte(false);
  }, [retomarExperiencia, descartarExperiencia, sesionEraPrueba, reautorizarPrueba, reconstruirTareasPendientes]);

  // El CTA de la intro crea la sesión SOLO si no hay una ya en curso, marca la
  // experiencia como reanudable y ENCOLA LA SESIÓN PADRE antes de cualquier dato
  // hijo. Antes la fila de `sesiones` se creaba recién al completar los contextos,
  // así que la aspiración (que va justo antes) intentaba escribirse sin padre.
  const crearEnIntro = useCallback(async (): Promise<boolean> => {
    // Primero se cierra la pantalla de decisión: si se marcara la experiencia como
    // incompleta antes de esto, el re-render intermedio la haría reaparecer.
    setDecisionTomada(true);
    if (!sesionEnCurso()) iniciarNuevaExperiencia();
    marcarExperienciaIncompleta();
    // Padre primero: deja la fila de sesiones confirmada/encolada antes de que
    // aspiración u otro bloque hijo intente escribir. Devuelve false si no se pudo
    // asegurar (ni confirmada ni encolada de forma durable).
    return await encolarSesionPadre();
  }, [iniciarNuevaExperiencia, marcarExperienciaIncompleta, encolarSesionPadre]);

  // ACTIVACIÓN DEL MODO PRUEBA (?prueba=1[&clave=…][&real=1]).
  //
  // La cookie httpOnly de /debug es la única puerta que permite escribir con
  // es_prueba=true; se revalida server-side acá. Si viene ?clave=… se autentica
  // primero contra /api/debug/auth (una sola pantalla).
  //
  // REGRESIÓN CORREGIDA (una prueba se guardaba como sesión real): el efecto
  // activaba modoPrueba, pero el CTA de la intro llamaba iniciarNuevaExperiencia(),
  // que ANTES lo reseteaba a false. El tester pulsaba "Empezar" y la sesión caía
  // como REAL (es_prueba=false). Peor: como modoPrueba ya era false, la barra
  // "MODO PRUEBA" tampoco se mostraba y nadie lo notaba. Ahora son dos defensas:
  //   1. iniciarNuevaExperiencia() NO toca modoPrueba (ver lib/store/experiencia.ts).
  //   2. sincronizarBloque revalida la cookie ANTES de cada escritura y, si falla,
  //      no escribe nada (aislamiento 00017).
  // Y si la autorización no se confirma, el flujo se DETIENE con un mensaje
  // visible en vez de seguir: es preferible a escribir sin la marca es_prueba.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!urlPidePrueba) return;
    const params = new URLSearchParams(window.location.search);
    const clave = params.get("clave");
    const pideReal = pidePruebaReal;

    let activo = true;

    // NO se escribe la fase acá. La transición a 'validando' se DERIVA en el
    // render (`faseEfectiva` más abajo): mientras la URL pida prueba y no haya
    // resultado, la fase efectiva es 'validando'. Así el bloqueo no depende de
    // que un efecto se ejecute, que era el hueco de la carrera SSR/hidratación
    // (el inicializador de useState no se re-ejecuta al cambiar el snapshot).
    const fallar = () => {
      if (!activo) return;
      setModoPrueba(false);
      setModoPruebaReal(false);
      setFaseAutorizacionPrueba(alFallarVerificacion());
    };

    const revalidar = () =>
      fetch("/api/debug/verificar-prueba", { cache: "no-store" })
        .then((r) => r.json())
        .then((data: { ok?: boolean }) => {
          if (!activo) return;
          if (data?.ok === true) {
            setModoPrueba(true);
            setModoPruebaReal(pideReal);
            setFaseAutorizacionPrueba(alResolverVerificacion("validando", true, pideReal));
          } else {
            // Fail-closed: se apagan AMBOS y la fase queda fallida, que es lo que
            // bloquea la experiencia más abajo. NUNCA se degrada a flujo normal.
            fallar();
          }
        })
        .catch(fallar);

    if (clave) {
      fetch("/api/debug/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clave }),
      })
        .then(() => revalidar())
        .catch(fallar);
    } else {
      revalidar();
    }

    return () => {
      activo = false;
    };
  }, [setModoPrueba, setModoPruebaReal, urlPidePrueba, pidePruebaReal]);

  // ¿Hay que bloquear la entrada? Sí mientras se valida una URL de prueba, o si
  // falló. Sin esto, "validando" dejaba pasar y se escribía antes de autorizar.
  // Derivado de la máquina de estados (lib/store/modoPruebaMaquina.ts), que es lo
  // que cubren los tests: 'validando' y 'fallida' bloquean; 'no-pedida' y
  // 'autorizada' dejan entrar.
  // CONDICIÓN EFECTIVA (no depende del inicializador de useState): si la URL pide
  // prueba y la fase no es 'autorizada', la entrada está bloqueada. Esto cubre el
  // hueco SSR/hidratación: aunque la fase nazca 'no-pedida' en el primer render de
  // cliente (porque el snapshot del servidor era false), `urlPidePrueba` ya es
  // true y la entrada queda cerrada igual.
  // FASE EFECTIVA: si la URL pide prueba y aún no hay resultado, la fase es
  // 'validando' sin necesidad de escribir estado. Esto cierra la carrera completa
  // (SSR → hidratación → fetch) porque no depende de ningún efecto.
  const faseEfectiva: FaseAutorizacion =
    urlPidePrueba && faseAutorizacionPrueba === "no-pedida" ? alDetectarUrlPrueba() : faseAutorizacionPrueba;

  const bloqueoPorAutorizacion =
    (urlPidePrueba && faseEfectiva !== "autorizada") || bloqueaEntrada(faseEfectiva) || revalidando;
  const entradaPermitida = !bloqueoPorAutorizacion && puedeEntrar(faseEfectiva) && !revalidando;

  // Fail-stop de modo prueba (SIMPLE y REAL): si se pidió ?prueba=1 y la
  // autorización no se confirmó, NO se entra a la experiencia. Antes esto solo
  // detenía el modo prueba REAL: una prueba simple que perdía la cookie a mitad
  // del flujo veía cómo sincronizarBloque apagaba el modo en silencio y un bloque
  // posterior se escribía COMO REAL. Ahora ambos modos se detienen visiblemente.
  const mensajeBloqueoModoPrueba = mensajeBloqueo(faseEfectiva);

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

  // En el servidor no hay estado persistido: el índice es 0 y el cliente pasa al
  // real tras hidratar. Sin esto, SSR y cliente renderizaban tarjetas distintas.
  const hidratado = useHidratado();
  const indice = hidratado ? respuestasGustos.length : 0;
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
  // Estado del bloque de gustos derivado: al recargar una experiencia con los 20
  // contextos ya respondidos, `siguienteIndicePendiente` daba 20 y
  // `contextos[20]` era undefined → crash. `estadoBloque` devuelve item=null en
  // ese caso, y abajo se muestra el cierre en vez de la tarjeta.
  const bloqueGustos = estadoBloque(contextos, respuestasGustos.map((r) => r.contextoId), indice);
  const contextoActual = bloqueGustos.item;
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
    // Bloque ya completo: no se pide ni se registra otra respuesta.
    if (!contextoActual) return;
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

  // Fail-stop de modo prueba: se bloquea toda la experiencia con un mensaje
  // visible en vez de seguir en silencio, tanto si la autorización inicial
  // (?prueba=1) falló como si la cookie se perdió a mitad de la sesión
  // (pruebaRealCortada, marcada por sincronizarBloque).
  const mensajeBloqueoPrueba =
    mensajeBloqueoModoPrueba ??
    (pruebaRealCortada
      ? "El modo prueba real se detuvo: la cookie de acceso de /debug dejó de ser válida a mitad de la experiencia. No se continúa para evitar una sesión que no quede marcada como prueba."
      : null);

  // HIDRATACIÓN: el estado persistido (paso, respuestas) vive en el cliente, así
  // que el primer render de cliente NO puede coincidir con el del servidor si se
  // usa directamente. Se muestra un placeholder idéntico en ambos hasta hidratar
  // (React error #418 en cada reanudación si no se hace). El árbol real se
  // renderiza en el siguiente render, ya con el estado del navegador.
  if (!hidratado || !persistenciaLista) {
    return (
      <section className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-tinta/50">Cargando…</p>
      </section>
    );
  }

  // Puerta de entrada: mientras se valida una URL de prueba NO se muestra ningún
  // CTA que pueda crear o escribir una sesión, y si falló se explica por qué.
  if (bloqueoPorAutorizacion) {
    return (
      <section className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
        {faseEfectiva === "fallida" || mensajeBloqueoPrueba ? (
          <>
            <p className="font-display text-xl text-tinta/80">Modo prueba detenido</p>
            <p className="text-sm text-tinta/60">
              {mensajeBloqueoPrueba ??
                "No se pudo activar el modo prueba: la cookie de acceso de /debug no es válida o expiró."}
            </p>
          </>
        ) : (
          <>
            <p className="font-display text-xl text-tinta/80">Verificando acceso de prueba…</p>
            <p className="text-sm text-tinta/50">Un momento. No cierres esta página.</p>
          </>
        )}
      </section>
    );
  }

  if (mensajeBloqueoPrueba) {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="font-display text-xl text-tinta/80">Modo prueba detenido</p>
        <p className="max-w-md text-sm text-tinta/60">{mensajeBloqueoPrueba}</p>
      </section>
    );
  }

  let contenido: ReactNode;

  // Pantalla de decisión de PC compartido: se muestra si hay una experiencia
  // REANUDABLE (sesión en curso + marcada como incompleta). Solo una vez
  // (decisionTomada pasa a true al elegir). Es la única puerta por la que un
  // alumno puede adoptar la sesión de otro, y siempre es una elección explícita.
  //
  // Condición de la pantalla de decisión (PC compartido). Dos exigencias que se
  // pelean entre sí, resueltas así:
  //
  //  a) DEBE aparecer cada vez que el navegador abre con una experiencia en curso
  //     sin que el alumno haya elegido en ESTA carga. Es la única puerta por la que
  //     alguien puede adoptar la sesión de otro: si no aparece, el alumno 2 del
  //     mismo computador hereda la sesión del alumno 1 en silencio. (Antes la
  //     condición exigía `paso === "intro"`, así que al reanudar NO aparecía
  //     nunca: la app retomaba automáticamente. Ese era el bug.)
  //
  //  b) NO puede reaparecer al pulsar "Empezar" en la intro. `crearEnIntro()` marca
  //     la experiencia como incompleta y, en ese intermedio, el árbol re-renderiza
  //     y caía acá: el alumno quedaba en un bucle.
  //
  // `yaEligioEnEstaCarga` (no `decisionTomada`) distingue (b): se pone en true al
  // elegir y también al empezar una experiencia, de modo que la pantalla solo
  // depende de si hubo una elección, no de en qué paso está el store.
  if (!decisionTomada && hayExperienciaReanudable()) {
    contenido = (
      <section className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-6 px-4 text-center">
        <h1 className="font-display text-2xl font-semibold text-tinta/90">
          Encontramos una experiencia empezada en este computador
        </h1>
        <p className="text-base text-tinta/70">
          Si es tuya y quedó a medias, puedes continuarla donde la dejaste. Si no la
          empezaste tú (o quieres partir de cero), elige empezar de nuevo: se borran
          las respuestas anteriores.
        </p>
        {confirmandoDescarte ? (
          <div className="flex w-full flex-col gap-3">
            <p className="text-sm text-tinta/70">
              ¿Seguro? Se borrarán las respuestas guardadas en este computador.
            </p>
            <button
              onClick={empezarNueva}
              className="rounded-[14px] bg-coral px-8 py-3 text-base font-medium text-blanco-papel transition hover:opacity-90"
            >
              Sí, empezar de nuevo
            </button>
            <button
              onClick={() => setConfirmandoDescarte(false)}
              className="rounded-[14px] border border-tinta/20 px-8 py-3 text-base font-medium transition hover:border-tinta/40"
            >
              Volver
            </button>
          </div>
        ) : (
          <div className="flex w-full flex-col gap-3">
            <button
              onClick={() => void continuarEnCurso()}
              className="rounded-[14px] bg-coral px-8 py-3 text-base font-medium text-blanco-papel transition hover:opacity-90"
            >
              Continuar donde la dejé
            </button>
            <button
              onClick={() => setConfirmandoDescarte(true)}
              className="rounded-[14px] border border-tinta/20 px-8 py-3 text-base font-medium transition hover:border-tinta/40"
            >
              Empezar de nuevo
            </button>
          </div>
        )}
      </section>
    );
  } else if (paso === "intro") {
    contenido = (
      <IntroExperiencia
        onEmpezar={(conAudio) => {
          void (async () => {
            // Guarda real: no se crea ni escribe una sesión si la autorización de
            // prueba aún no se resolvió (o falló). `entradaPermitida` sale de la
            // máquina de estados, que es lo que cubren los tests.
            if (!entradaPermitida) return;
            setCreandoSesion(true);

            // `crearEnIntro` crea la sesión SOLO si no hay una en curso: tras
            // "Continuar" se conserva el mismo sessionId (no se rota). Es el único
            // punto de creación de sesión por experiencia, y AHORA se espera:
            // antes se avanzaba a aspiración con `void crearEnIntro()` y el hijo
            // podía intentar escribir antes de que el padre existiera.
            let asegurada = false;
            try {
              asegurada = await crearEnIntro();
            } catch {
              asegurada = false;
            }

            if (!asegurada) {
              // No se avanza: se muestra el error con opción de reintentar.
              setCreandoSesion(false);
              setErrorCrearSesion(
                "No pudimos preparar tu experiencia (no se pudo guardar la sesión). Revisa tu conexión e inténtalo de nuevo."
              );
              return;
            }

            setErrorCrearSesion(null);
            // Se marca la decisión ANTES de avanzar: así esta pantalla no puede
            // volver a aparecer en el intermedio entre crear la sesión y cambiar
            // de paso.
            setDecisionTomada(true);
            activarAudio(conAudio);
            irAPaso("aspiracion");
            setCreandoSesion(false);
          })();
        }}
        creando={creandoSesion}
        error={errorCrearSesion}
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
    // Al volver al inicio desde el informe, se cierra la experiencia de este
    // navegador: se borra la cookie de sesión y el estado local, para que el
    // alumno siguiente del mismo computador no pueda retomar la sesión ajena.
    // Esto NO borra nada en la base: la sesión y sus respuestas ya quedaron
    // persistidas y el informe permanente sigue accesible por correo y token.
    contenido = (
      <Informe
        onVolver={() => {
          descartarExperiencia();
        }}
      />
    );
  } else if (!contextoActual) {
    // Los 20 contextos ya están respondidos (bloque completo en el estado) pero el
    // paso sigue en "gustos": esto pasa al recargar justo antes de avanzar. Se
    // ofrece continuar de forma controlada en vez de renderizar una tarjeta vacía.
    contenido = (
      <section className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="font-display text-xl text-tinta/80">Ya respondiste este bloque.</p>
        <button
          onClick={() => irAPaso("actividades")}
          className="rounded-[14px] bg-coral px-6 py-3 text-base font-medium text-blanco-papel transition hover:opacity-90"
        >
          {juegosCognitivos.seguir}
        </button>
      </section>
    );
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
        <div
          className={`fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-4 px-4 py-2 text-sm font-medium shadow-md ${
            modoPruebaReal ? "bg-red-600 text-blanco-papel" : "bg-dorado text-tinta"
          }`}
        >
          <span>
            {modoPruebaReal
              ? "MODO PRUEBA REAL — se guarda en la base"
              : "MODO PRUEBA — datos sintéticos, no se cuentan en las métricas"}
          </span>
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
