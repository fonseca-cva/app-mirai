"use client";

import { useState } from "react";
import { itemsMatrices } from "@/lib/data/matrices";
import { itemsRotacion } from "@/lib/data/rotacion";
import { BloqueMatrices, type ResultadoMatrices } from "@/components/experiencia/juegos/BloqueMatrices";
import { BloqueRotacion, type ResultadoRotacion } from "@/components/experiencia/juegos/BloqueRotacion";
import { BloqueSecuencias, type ResultadoSecuencias } from "@/components/experiencia/juegos/BloqueSecuencias";
import { useExperienciaStore } from "@/lib/store/experiencia";
import { juegosCognitivos } from "@/lib/config/textos";

interface Props {
  onCompletar: () => void;
  onPausar: () => void;
}

type Juego = "matrices" | "rotacion" | "secuencias";

const NIVEL_POR_DIFICULTAD = { facil: 1, media: 2, dificil: 3 } as const;

// Orquesta el Bloque B completo (sección 3 de la spec): Matrices → Rotación → Secuencias,
// en orden fijo, despachando cada respuesta al store para su sync posterior con Supabase.
export function BloqueCognitivo({ onCompletar, onPausar }: Props) {
  const [juego, setJuego] = useState<Juego>("matrices");
  const sessionId = useExperienciaStore((s) => s.sessionId);
  const agregarRespuestaCognitivo = useExperienciaStore((s) => s.agregarRespuestaCognitivo);
  const sincronizarBloque = useExperienciaStore((s) => s.sincronizarBloque);

  function registrarMatrices(resultados: ResultadoMatrices[]) {
    resultados.forEach((r) => {
      const item = itemsMatrices.find((i) => i.id === r.itemId);
      agregarRespuestaCognitivo({
        juego: "matrices",
        itemId: r.itemId,
        correcto: r.correcto,
        nivel: item ? NIVEL_POR_DIFICULTAD[item.dificultad] : 1,
        duracionMs: r.duracionMs,
      });
    });
    setJuego("rotacion");
  }

  function registrarRotacion(resultados: ResultadoRotacion[]) {
    resultados.forEach((r) => {
      const item = itemsRotacion.find((i) => i.id === r.itemId);
      agregarRespuestaCognitivo({
        juego: "rotacion",
        itemId: r.itemId,
        correcto: r.correcto,
        nivel: item ? NIVEL_POR_DIFICULTAD[item.dificultad] : 1,
        duracionMs: r.duracionMs,
      });
    });
    setJuego("secuencias");
  }

  function registrarSecuencias(resultado: ResultadoSecuencias) {
    resultado.intentos.forEach((intento) => {
      agregarRespuestaCognitivo({
        juego: "secuencias",
        itemId: intento.itemId,
        correcto: intento.correcto,
        nivel: intento.nivel,
        duracionMs: intento.duracionMs,
      });
    });

    // Bloque B (cognitivo) completado: sync de todas las respuestas de los 3 juegos.
    if (sessionId) {
      const respuestas = useExperienciaStore.getState().respuestasCognitivo;
      sincronizarBloque([
        {
          id: `cognitivo-${sessionId}`,
          tipo: "cognitivo",
          payload: respuestas.map((r) => ({
            session_id: sessionId,
            juego: r.juego,
            item_id: r.itemId,
            correcto: r.correcto,
            nivel: r.nivel,
            duracion_ms: r.duracionMs,
          })),
        },
      ]);
    }

    onCompletar();
  }

  const contenido =
    juego === "matrices" ? (
      <BloqueMatrices onCompletar={registrarMatrices} />
    ) : juego === "rotacion" ? (
      <BloqueRotacion onCompletar={registrarRotacion} />
    ) : (
      <BloqueSecuencias onCompletar={registrarSecuencias} />
    );

  return (
    <div className="relative">
      <button
        onClick={onPausar}
        className="fixed right-4 top-4 z-10 rounded-full bg-blanco-papel/90 px-3 py-1.5 text-sm text-tinta/60 underline shadow-sm"
      >
        {juegosCognitivos.pausa}
      </button>
      {contenido}
    </div>
  );
}
