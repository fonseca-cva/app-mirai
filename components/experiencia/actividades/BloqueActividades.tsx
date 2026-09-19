"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { siguienteIndicePendiente, estadoBloque } from "@/lib/store/checkpoints";
import { actividades } from "@/lib/data/actividades";
import { IconoContexto } from "@/components/origami/IconoContexto";
import { BarraProgreso } from "@/components/experiencia/BarraProgreso";
import { FoldTransition } from "@/components/origami/FoldTransition";
import { useExperienciaStore } from "@/lib/store/experiencia";
import { bloqueActividades, juegosCognitivos } from "@/lib/config/textos";


// ¿Ya estamos en el cliente (post-hidratación)? useSyncExternalStore es la forma
// idónea: devuelve false en el snapshot del servidor y true en el del cliente, sin
// provocar desajuste de hidratación ni setState dentro de un efecto. Se usa para
// calcular el índice de arranque solo cuando el estado persistido ya está
// disponible (que es exclusivamente en el cliente).
function suscribirHidratacion(): () => void {
  return () => {};
}

export function useHidratado(): boolean {
  return useSyncExternalStore(
    suscribirHidratacion,
    () => true,
    () => false
  );
}

interface Props {
  onCompletar: () => void;
  onPausar: () => void;
}

// Bloque A2 (Tanda F, pilar de intereses): 24 actividades y pasatiempos,
// una tarjeta rápida por pantalla, escala de 3 puntos. Objetivo: ~2 min.
// Los 24 ítems se sincronizan juntos a respuestas_actividades al cerrarse.
export function BloqueActividades({ onCompletar, onPausar }: Props) {
  const [guardando, setGuardando] = useState(false);
  const sessionId = useExperienciaStore((s) => s.sessionId);
  const agregarRespuestaActividad = useExperienciaStore((s) => s.agregarRespuestaActividad);
  const sincronizarBloque = useExperienciaStore((s) => s.sincronizarBloque);
  const respondidas = useExperienciaStore((s) => s.respuestasActividades);

  // Índice de arranque DERIVADO de las respuestas persistidas: al recargar, el
  // bloque abre en la primera actividad pendiente en vez de volver al ítem 0.
  // El índice local solo avanza mientras el alumno responde en esta pestaña.
  // Índice del ítem en curso. El de ARRANQUE se deriva del estado persistido, que
  // existe solo en el cliente. Para no desajustar la hidratación (React #418), se
  // usa `useHidratado()`: en el servidor el índice es 0 y en el cliente pasa al
  // primer pendiente, de forma que el render es consistente en ambos.
  const hidratado = useHidratado();
  const [indiceManual, setIndiceManual] = useState<number | null>(null);
  const indice =
    indiceManual ?? (hidratado ? siguienteIndicePendiente(actividades, respondidas.map((r) => r.actividadId)) : 0);
  const setIndice = setIndiceManual;

  // Estado del bloque: si ya está completo (p. ej. al recargar una experiencia
  // terminada), `item` es null y NO se indexa fuera del catálogo. Antes esto era
  // `actividades[indice]` → undefined → crash en `actividad.id`.
  const bloque = estadoBloque(actividades, respondidas.map((r) => r.actividadId), indice);

  // `hecho` se marca al cerrar el bloque (respuesta del último ítem) o si el
  // bloque YA estaba completo al reanudar. Se DERIVA en el render en vez de
  // sincronizarse con un efecto (evita el render en cascada que marca
  // react-hooks/set-state-in-effect y también el desajuste de hidratación).
  const [hechoAlResponder, setHecho] = useState(false);
  const hecho = hechoAlResponder || bloque.estado === "completo";
  const actividad = bloque.item;
  const esUltimo = bloque.esUltimo;

  // Bloque ya completo al montar: se muestra la pantalla de terminado sin pedir
  // otra respuesta. `hecho` se inicializa con ese estado para que el alumno no
  // vea una tarjeta vacía ni un ítem repetido.
  const responder = useCallback(
    async (valor: 0 | 1 | 2) => {
      if (guardando) return;
      // Nunca se responde sin ítem: si el bloque ya está completo, no se pide
      // otra respuesta (y no se accede a un elemento inexistente).
      if (!actividad) return;
      agregarRespuestaActividad({ actividadId: actividad.id, valor });

      if (!esUltimo) {
        setIndice(indice + 1);
        return;
      }

      // Último ítem: sync de las 24 respuestas juntas y cierre del bloque.
      setGuardando(true);
      if (sessionId) {
        const respuestas = useExperienciaStore.getState().respuestasActividades;
        await sincronizarBloque([
          {
            id: `actividades-${sessionId}`,
            tipo: "actividades",
            payload: respuestas.map((r) => ({
              session_id: sessionId,
              actividad_id: r.actividadId,
              valor: r.valor,
            })),
          },
        ]);
      }
      setGuardando(false);
      setHecho(true);
    },
    [guardando, esUltimo, indice, actividad, sessionId, agregarRespuestaActividad, sincronizarBloque]
  );

  if (hecho) {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="font-display text-xl text-tinta/80">{bloqueActividades.hecho}</p>
        <button
          onClick={onCompletar}
          className="rounded-[14px] bg-coral px-6 py-3 text-base font-medium text-blanco-papel transition hover:opacity-90"
        >
          {juegosCognitivos.seguir}
        </button>
      </section>
    );
  }

  // Guarda de render: sin ítem que mostrar (bloque completo) se muestra el cierre
  // en vez de una tarjeta vacía. Es la otra mitad de la corrección de "recargar
  // un bloque terminado": no basta con no indexar; tampoco hay que renderizar.
  if (!actividad) {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="font-display text-xl text-tinta/80">{bloqueActividades.hecho}</p>
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
    <section className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-16 sm:px-8">
      <BarraProgreso actual={indice} total={actividades.length} ariaLabel="actividad" />

      <p className="text-sm text-teal-profundo/70">
        {bloqueActividades.titulo} — {indice + 1} {bloqueActividades.contadorDe} {actividades.length}
      </p>

      <FoldTransition llave={actividad.id}>
        <div className="flex w-full max-w-sm flex-col items-center gap-4 p-8 text-center">
          <IconoContexto dimension={actividad.dimension} className="h-14 w-14" />
          <h2 className="font-display text-2xl font-semibold leading-snug">
            {actividad.texto}
          </h2>
          <p className="text-sm text-tinta/50">{bloqueActividades.bajada}</p>

          <div className="mt-2 flex w-full flex-col gap-2">
            {bloqueActividades.botones.map((boton) => (
              <button
                key={boton.valor}
                onClick={() => responder(boton.valor as 0 | 1 | 2)}
                disabled={guardando}
                className={`rounded-[14px] px-4 py-3 text-sm font-medium transition enabled:hover:opacity-90 disabled:opacity-40 ${
                  boton.valor === 2
                    ? "bg-coral text-blanco-papel"
                    : "border border-tinta/20 hover:border-tinta/40"
                }`}
              >
                {boton.label}
              </button>
            ))}
          </div>
        </div>
      </FoldTransition>

      <button onClick={onPausar} className="text-sm text-tinta/60 underline">
        {bloqueActividades.pausa}
      </button>
    </section>
  );
}
