"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "./useTutorial";
import { PanelDoblez, PanelPerforado, AlternativaPlegado } from "@/components/experiencia/juegos/FiguraPlegadoSVG";
import type { Eje } from "@/lib/logic/rotacion";
import { IconoOrigamiSVG, type TipoOrigami } from "@/components/experiencia/juegos/IconoOrigamiSVG";

// ── Animación CSS compartida ────────────────────────────────────────

const ANIM_STYLES = `
@keyframes mirai-pulso {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.08); }
}
@keyframes mirai-deslizar {
  0% { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes mirai-aparecer {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
@keyframes mirai-flecha {
  0% { opacity: 0; transform: translateX(-20px); }
  50% { opacity: 1; transform: translateX(0); }
  100% { opacity: 0; transform: translateX(20px); }
}
`;

const PAUSA_CICLO_MS = 1000;

interface Props {
  /** Se llama cada vez que el loop de la demo completa un ciclo (telemetría). */
  onCicloCompletado?: () => void;
}

// Frames estáticos navegables (Anterior/Siguiente) — reemplazan el loop cuando
// prefers-reduced-motion está activo. El usuario recorre las 3 imágenes a su ritmo.
function FramesEstaticos({ frames }: { frames: { titulo: string; texto: string }[] }) {
  const [i, setI] = useState(0);
  const frame = frames[i]!;

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex min-h-[110px] flex-col gap-2 rounded-[14px] bg-gris-papel/60 p-4 text-left text-sm text-tinta/70">
        <p className="font-medium text-tinta">{frame.titulo}</p>
        <p className="text-tinta/60">{frame.texto}</p>
      </div>
      <div className="flex items-center justify-between">
        <button
          onClick={() => setI((v) => Math.max(0, v - 1))}
          disabled={i === 0}
          className="rounded-[10px] border border-tinta/20 px-4 py-2 text-sm text-tinta/70 transition disabled:opacity-30"
        >
          Anterior
        </button>
        <span className="text-xs text-tinta/40">{i + 1}/{frames.length}</span>
        <button
          onClick={() => setI((v) => Math.min(frames.length - 1, v + 1))}
          disabled={i === frames.length - 1}
          className="rounded-[10px] border border-tinta/20 px-4 py-2 text-sm text-tinta/70 transition disabled:opacity-30"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

// ── Demo: Matrices ─────────────────────────────────────────────────

const PASOS_MATRICES = [
  { paso: 1, enMs: 1000 },
  { paso: 2, enMs: 2500 },
  { paso: 3, enMs: 4000 },
  { paso: 4, enMs: 5500 },
  { paso: 5, enMs: 7000 },
];
const FIN_CICLO_MATRICES_MS = 8500;

export function DemoMatrices({ onCicloCompletado }: Props) {
  const reduced = useReducedMotion();
  const [paso, setPaso] = useState(0);

  useEffect(() => {
    if (reduced) return;
    let cancelado = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    function ejecutarCiclo() {
      setPaso(0);
      PASOS_MATRICES.forEach(({ paso: p, enMs }) => {
        timers.push(setTimeout(() => { if (!cancelado) setPaso(p); }, enMs));
      });
      timers.push(setTimeout(() => {
        if (cancelado) return;
        onCicloCompletado?.();
        timers.push(setTimeout(ejecutarCiclo, PAUSA_CICLO_MS));
      }, FIN_CICLO_MATRICES_MS));
    }

    ejecutarCiclo();
    return () => { cancelado = true; timers.forEach(clearTimeout); };
  }, [reduced, onCicloCompletado]);

  if (reduced) {
    return (
      <FramesEstaticos
        frames={[
          { titulo: "Paso 1: Mira el tablero", texto: "Cuadrícula 3x3: fila de círculos, fila de cuadrados, fila de triángulos. La última celda está vacía." },
          { titulo: "Paso 2: Encuentra el patrón", texto: "Hacia la derecha aparece una figura más (1, 2, 3). Hacia abajo cambia la forma." },
          { titulo: "Paso 3: Elige la figura correcta", texto: "Si la fila es de triángulos y ya van uno y dos, la que falta son tres triángulos." },
        ]}
      />
    );
  }

  // Ítem fijo de referencia (no se genera): fila = forma, columna = cantidad (1, 2, 3).
  // Única regla, verificable en las 3 filas: "hacia la derecha aparece una figura más;
  // hacia abajo cambia la forma".
  const GLIFO_FILA = ["●", "■", "▲"];
  const CELDAS = GLIFO_FILA.flatMap((glifo) => [glifo, glifo.repeat(2), glifo.repeat(3)]);
  const ALTERNATIVAS = ["●●●", "■■■", "▲▲", "▲▲▲▲", "▲▲▲"];
  const INDICE_CORRECTO = 4;

  const celda = (i: number, contenido: string, activo: boolean) => (
    <div
      key={i}
      className={`flex h-16 w-16 items-center justify-center rounded-[10px] border-2 text-base tracking-tight transition-all duration-700 sm:h-20 sm:w-20 ${
        activo
          ? "border-coral bg-coral/10 shadow-lg"
          : i === 8
            ? "border-dashed border-tinta/30 bg-blanco-papel/70 text-tinta/40"
            : "border-transparent bg-blanco-papel/70"
      }`}
      style={activo ? { animation: "mirai-pulso 1s ease-in-out infinite" } : undefined}
    >
      {i === 8 ? "?" : contenido}
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-4">
      <style>{ANIM_STYLES}</style>
      <p className="text-sm font-medium text-teal-profundo">
        {paso === 0
          ? "Mira el tablero..."
          : paso <= 3
            ? "Observa cómo cambia cada fila"
            : paso === 4
              ? "¿Cuál completa el patrón?"
              : "✓ Hacia la derecha, una figura más. Hacia abajo, cambia la forma"}
      </p>

      <div className="grid grid-cols-3 gap-2 rounded-[14px] bg-gris-papel/60 p-3">
        {Array.from({ length: 9 }).map((_, i) => {
          const fila = Math.floor(i / 3);
          const activo = paso > fila && paso <= 4 && i !== 8;
          const resaltado = paso === 5 && i === 8;
          return celda(i, CELDAS[i] ?? "?", activo || resaltado);
        })}
      </div>

      {paso >= 4 && (
        <div className="flex gap-2">
          {ALTERNATIVAS.map((s, i) => (
            <div
              key={i}
              className={`flex h-12 w-12 items-center justify-center rounded-[10px] border text-sm tracking-tight transition-all sm:h-14 sm:w-14 ${
                paso === 5 && i === INDICE_CORRECTO
                  ? "border-teal-profundo bg-teal-profundo/10"
                  : "border-tinta/15 bg-blanco-papel/70"
              }`}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Demo: Series ────────────────────────────────────────────────────
// Serie fija de referencia (no se genera): +3 cada paso. Regla verificable por cálculo
// directo, distinta de la de matrices (que es geométrica) — acá es texto/números.

const PASOS_SERIES = [
  { paso: 1, enMs: 1000 },
  { paso: 2, enMs: 2500 },
  { paso: 3, enMs: 4000 },
  { paso: 4, enMs: 5500 },
  { paso: 5, enMs: 7000 },
];
const FIN_CICLO_SERIES_MS = 8500;

export function DemoSeries({ onCicloCompletado }: Props) {
  const reduced = useReducedMotion();
  const [paso, setPaso] = useState(0);

  useEffect(() => {
    if (reduced) return;
    let cancelado = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    function ejecutarCiclo() {
      setPaso(0);
      PASOS_SERIES.forEach(({ paso: p, enMs }) => {
        timers.push(setTimeout(() => { if (!cancelado) setPaso(p); }, enMs));
      });
      timers.push(setTimeout(() => {
        if (cancelado) return;
        onCicloCompletado?.();
        timers.push(setTimeout(ejecutarCiclo, PAUSA_CICLO_MS));
      }, FIN_CICLO_SERIES_MS));
    }

    ejecutarCiclo();
    return () => { cancelado = true; timers.forEach(clearTimeout); };
  }, [reduced, onCicloCompletado]);

  if (reduced) {
    return (
      <FramesEstaticos
        frames={[
          { titulo: "Paso 1: Mira la serie", texto: "Una fila de fichas con números, en orden, con un hueco al final." },
          { titulo: "Paso 2: Encuentra la regla", texto: "Compara cada ficha con la anterior: ¿suma, resta o multiplica siempre lo mismo?" },
          { titulo: "Paso 3: Elige lo que sigue", texto: "Si la serie sube de 3 en 3 (2, 5, 8, 11...), lo que falta es 14." },
        ]}
      />
    );
  }

  const ELEMENTOS = ["2", "5", "8", "11", "?"];
  const ALTERNATIVAS = ["12", "13", "14", "15", "10"];
  const INDICE_CORRECTO = 2;

  const ficha = (i: number, contenido: string, activo: boolean) => (
    <div
      key={i}
      className={`flex h-16 w-16 items-center justify-center rounded-[10px] border-2 font-display text-lg font-semibold tracking-tight transition-all duration-700 sm:h-20 sm:w-20 ${
        activo
          ? "border-coral bg-coral/10 shadow-lg"
          : i === ELEMENTOS.length - 1
            ? "border-dashed border-tinta/30 bg-blanco-papel/70 text-tinta/40"
            : "border-transparent bg-blanco-papel/70"
      }`}
      style={activo ? { animation: "mirai-pulso 1s ease-in-out infinite" } : undefined}
    >
      {contenido}
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-4">
      <style>{ANIM_STYLES}</style>
      <p className="text-sm font-medium text-teal-profundo">
        {paso === 0
          ? "Mira la serie..."
          : paso <= 3
            ? "Observa cómo cambia cada número"
            : paso === 4
              ? "¿Cuál sigue la regla?"
              : "✓ Cada número suma 3 al anterior"}
      </p>

      <div className="flex items-center justify-center gap-2 rounded-[14px] bg-gris-papel/60 p-3">
        {ELEMENTOS.map((s, i) => {
          const activo = paso > i && paso <= 4 && i !== ELEMENTOS.length - 1;
          const resaltado = paso === 5 && i === ELEMENTOS.length - 1;
          return ficha(i, s, activo || resaltado);
        })}
      </div>

      {paso >= 4 && (
        <div className="flex gap-2">
          {ALTERNATIVAS.map((s, i) => (
            <div
              key={i}
              className={`flex h-12 w-12 items-center justify-center rounded-[10px] border font-display text-sm font-medium tracking-tight transition-all sm:h-14 sm:w-14 ${
                paso === 5 && i === INDICE_CORRECTO
                  ? "border-teal-profundo bg-teal-profundo/10"
                  : "border-tinta/15 bg-blanco-papel/70"
              }`}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Demo: Plegado (Anexo 2 al bloqueante) ───────────────────────────
// Muestra la secuencia obligatoria doblar → perforar → desplegar, animada en loop,
// para que la mecánica se infiera sin depender de familiaridad previa con el ejercicio.

const PLIEGUES_DEMO_PLEGADO = ["vertical"] as const;
const PUNTOS_DEMO_PLEGADO = [{ x: 0.75, y: 0.35 }];
const PUNTO_REFLEJADO_DEMO = { x: 0.25, y: 0.35 };

const PASOS_PLEGADO = [
  { paso: 1, enMs: 1200 },
  { paso: 2, enMs: 2800 },
  { paso: 3, enMs: 4400 },
  { paso: 4, enMs: 6000 },
];
const FIN_CICLO_PLEGADO_MS = 7500;

export function DemoPlegado({ onCicloCompletado }: Props) {
  const reduced = useReducedMotion();
  const [paso, setPaso] = useState(0);

  useEffect(() => {
    if (reduced) return;
    let cancelado = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    function ejecutarCiclo() {
      setPaso(0);
      PASOS_PLEGADO.forEach(({ paso: p, enMs }) => {
        timers.push(setTimeout(() => { if (!cancelado) setPaso(p); }, enMs));
      });
      timers.push(setTimeout(() => {
        if (cancelado) return;
        onCicloCompletado?.();
        timers.push(setTimeout(ejecutarCiclo, PAUSA_CICLO_MS));
      }, FIN_CICLO_PLEGADO_MS));
    }

    ejecutarCiclo();
    return () => { cancelado = true; timers.forEach(clearTimeout); };
  }, [reduced, onCicloCompletado]);

  if (reduced) {
    return (
      <FramesEstaticos
        frames={[
          { titulo: "Paso 1: Se dobla por la línea", texto: "El papel tiene una línea de doblez; la flecha indica hacia dónde se pliega." },
          { titulo: "Paso 2: Se perfora doblado", texto: "La perforación atraviesa todas las capas del papel, ya doblado." },
          { titulo: "Paso 3: Se despliega", texto: "Al abrir el papel, la perforación queda reflejada al otro lado del pliegue." },
        ]}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <style>{ANIM_STYLES}</style>
      <p className="text-sm font-medium text-teal-profundo">
        {paso === 0
          ? "Mira el papel..."
          : paso === 1
            ? "Se dobla por la línea"
            : paso <= 3
              ? "Se perfora doblado — atraviesa todas las capas"
              : "✓ Al desplegar, la perforación queda reflejada"}
      </p>

      <div className="flex items-center justify-center gap-4">
        <div
          className="flex flex-col items-center gap-2"
          style={paso === 1 ? { animation: "mirai-aparecer 0.6s ease-in" } : undefined}
        >
          <div className="text-xs text-tinta/50">1. Doblez</div>
          <PanelDoblez pliegues={PLIEGUES_DEMO_PLEGADO as unknown as Eje[]} puntos={PUNTOS_DEMO_PLEGADO} />
        </div>

        {paso >= 2 && (
          <div className="flex flex-col items-center gap-2" style={{ animation: "mirai-deslizar 0.5s ease-out" }}>
            <div className="text-xs text-tinta/50">2. Perforado</div>
            <PanelPerforado pliegues={PLIEGUES_DEMO_PLEGADO as unknown as Eje[]} puntos={PUNTOS_DEMO_PLEGADO} />
          </div>
        )}

        {paso >= 4 && (
          <div className="flex flex-col items-center gap-2" style={{ animation: "mirai-deslizar 0.5s ease-out" }}>
            <div className="text-xs text-tinta/50">3. Desplegado</div>
            <AlternativaPlegado puntos={[...PUNTOS_DEMO_PLEGADO, PUNTO_REFLEJADO_DEMO]} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Demo: Secuencias ────────────────────────────────────────────────

const SECUENCIA_DEMO = [0, 2, 4]; // índices de símbolos
const SIMBOLOS: TipoOrigami[] = ["grulla", "barco", "flor", "estrella", "casa", "pez"];

export function DemoSecuencias({ onCicloCompletado }: Props) {
  const reduced = useReducedMotion();
  const [simboloActivo, setSimboloActivo] = useState<number | null>(null);
  const [paso, setPaso] = useState(0);

  useEffect(() => {
    if (reduced) return;
    let cancelado = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    function ejecutarCiclo() {
      setPaso(0);
      setSimboloActivo(null);

      SECUENCIA_DEMO.forEach((simbolo, i) => {
        const inicio = i * 900;
        timers.push(setTimeout(() => {
          if (cancelado) return;
          setSimboloActivo(simbolo);
          setPaso(i + 1);
        }, inicio));
        timers.push(setTimeout(() => { if (!cancelado) setSimboloActivo(null); }, inicio + 700));
      });

      const fin = SECUENCIA_DEMO.length * 900;
      timers.push(setTimeout(() => { if (!cancelado) setPaso(4); }, fin));
      timers.push(setTimeout(() => { if (!cancelado) setPaso(5); }, fin + 1500));

      SECUENCIA_DEMO.forEach((simbolo, i) => {
        const inicio = fin + 1500 + i * 900;
        timers.push(setTimeout(() => {
          if (cancelado) return;
          setSimboloActivo(simbolo);
          setPaso(6);
        }, inicio));
        timers.push(setTimeout(() => { if (!cancelado) setSimboloActivo(null); }, inicio + 700));
      });

      const finCiclo = fin + 1500 + SECUENCIA_DEMO.length * 900 + 500;
      timers.push(setTimeout(() => {
        if (cancelado) return;
        onCicloCompletado?.();
        timers.push(setTimeout(ejecutarCiclo, PAUSA_CICLO_MS));
      }, finCiclo));
    }

    ejecutarCiclo();
    return () => { cancelado = true; timers.forEach(clearTimeout); };
  }, [reduced, onCicloCompletado]);

  if (reduced) {
    return (
      <FramesEstaticos
        frames={[
          { titulo: "Paso 1: Observa", texto: "Aparecen figuras una por una en un orden específico." },
          { titulo: "Paso 2: Recuerda", texto: "Concéntrate en el orden exacto en que aparecen." },
          { titulo: "Paso 3: Repite", texto: "Toca los símbolos en el MISMO orden en que los viste." },
        ]}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <style>{ANIM_STYLES}</style>
      <p className="text-sm font-medium text-teal-profundo">
        {paso === 0
          ? "Mira la secuencia..."
          : paso <= 3
            ? `Símbolo ${paso} de ${SECUENCIA_DEMO.length}`
            : paso === 4
              ? "Ahora repite la secuencia"
              : paso === 5
                ? "Tócalos en el mismo orden"
                : "✓ Repite el orden exacto"}
      </p>

      <div className="grid grid-cols-3 gap-3">
        {SIMBOLOS.map((tipo, i) => (
          <div
            key={i}
            className={`flex h-16 w-16 items-center justify-center rounded-[14px] border-2 transition-all duration-500 sm:h-20 sm:w-20 ${
              simboloActivo === i
                ? "border-coral bg-coral/10"
                : paso >= 4 && SECUENCIA_DEMO.includes(i)
                  ? "border-teal-profundo/40 bg-teal-profundo/5"
                  : "border-tinta/15 bg-blanco-papel/70"
            }`}
          >
            <IconoOrigamiSVG tipo={tipo} tamano={48} titulo={`Símbolo ${i + 1}: ${tipo}`} />
          </div>
        ))}
      </div>

      {paso >= 6 && (
        <p className="text-xs text-tinta/50">
          Secuencia: {SECUENCIA_DEMO.map((i) => SIMBOLOS[i]).join(" → ")}
        </p>
      )}
    </div>
  );
}
