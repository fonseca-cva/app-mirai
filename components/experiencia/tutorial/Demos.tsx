"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "./useTutorial";

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
@keyframes mirai-girar {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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

// ── Demo: Matrices ─────────────────────────────────────────────────

export function DemoMatrices({ onTerminada }: { onTerminada: () => void }) {
  const reduced = useReducedMotion();
  const [paso, setPaso] = useState(0);

  useEffect(() => {
    if (reduced) {
      // Modo estático: muestra 3 cuadros secuenciales
      const t = setTimeout(onTerminada, 4000);
      return () => clearTimeout(t);
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    // Paso 0: mostrar grid → 1: resaltar fila 1 → 2: resaltar fila 2 → 3: resaltar fila 3
    // → 4: marcar respuesta → 5: terminar
    [1000, 2500, 4000, 5500, 7000].forEach((ms, i) => {
      timers.push(setTimeout(() => setPaso(i + 1), ms));
    });
    timers.push(setTimeout(onTerminada, 8500));
    return () => timers.forEach(clearTimeout);
  }, [reduced, onTerminada]);

  if (reduced) {
    return (
      <div className="flex flex-col gap-4">
        <style>{ANIM_STYLES}</style>
        <div className="flex flex-col gap-2 rounded-[14px] bg-gris-papel/60 p-4 text-left text-sm text-tinta/70">
          <p className="font-medium text-tinta">Paso 1: Mira el tablero</p>
          <p className="text-tinta/60">Aparece una cuadrícula 3x3 con figuras. La última celda está vacía.</p>
        </div>
        <div className="flex flex-col gap-2 rounded-[14px] bg-gris-papel/60 p-4 text-left text-sm text-tinta/70">
          <p className="font-medium text-tinta">Paso 2: Encuentra el patrón</p>
          <p className="text-tinta/60">Cada fila transforma las figuras con la misma regla (rotación, forma o tono).</p>
        </div>
        <div className="flex flex-col gap-2 rounded-[14px] bg-gris-papel/60 p-4 text-left text-sm text-tinta/70">
          <p className="font-medium text-tinta">Paso 3: Elige la figura correcta</p>
          <p className="text-tinta/60">Selecciona entre 5 alternativas la que completa el patrón.</p>
        </div>
      </div>
    );
  }

  const celda = (i: number, label: string, activo: boolean) => (
    <div
      key={i}
      className={`flex h-16 w-16 items-center justify-center rounded-[10px] border-2 text-lg transition-all duration-700 sm:h-20 sm:w-20 ${
        activo
          ? "border-coral bg-coral/10 shadow-lg"
          : i === 8
            ? "border-dashed border-tinta/30 bg-blanco-papel/70 text-tinta/40"
            : "border-transparent bg-blanco-papel/70"
      }`}
      style={activo ? { animation: "mirai-pulso 1s ease-in-out infinite" } : undefined}
    >
      {i === 8 ? "?" : label}
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-4">
      <style>{ANIM_STYLES}</style>
      <p className="text-sm font-medium text-teal-profundo" style={{ animation: "mirai-aparecer 0.5s ease-out" }}>
        {paso === 0 ? "Mira el tablero..." : paso <= 3 ? "Observa cómo cambia cada fila" : paso === 4 ? "¿Cuál completa el patrón?" : ""}
      </p>

      <div className="grid grid-cols-3 gap-2 rounded-[14px] bg-gris-papel/60 p-3">
        {Array.from({ length: 9 }).map((_, i) => {
          const fila = Math.floor(i / 3);
          const activo = paso > fila && paso <= 4 && i !== 8;
          const resaltado = paso === 5 && i === 8;
          return celda(i, ["△", "○", "◇", "⬡", "□", "⏢", "⬠", "⬟", "?"][i] ?? "?", activo || resaltado);
        })}
      </div>

      {paso >= 4 && paso <= 5 && (
        <div className="flex gap-2" style={{ animation: "mirai-aparecer 0.5s ease-out" }}>
          {["△", "○", "◇", "⬡", "□"].map((s, i) => (
            <div
              key={i}
              className={`flex h-12 w-12 items-center justify-center rounded-[10px] border text-base transition-all sm:h-14 sm:w-14 ${
                paso === 5 && i === 2
                  ? "border-teal-profundo bg-teal-profundo/10"
                  : "border-tinta/15 bg-blanco-papel/70"
              }`}
            >
              {s}
            </div>
          ))}
        </div>
      )}

      {paso >= 4 && (
        <p className="text-xs text-tinta/50">
          {paso === 4 ? "Toca la alternativa correcta" : "✓ Cada fila rota 45° a la derecha"}
        </p>
      )}
    </div>
  );
}

// ── Demo: Rotación ──────────────────────────────────────────────────

export function DemoRotacion({ onTerminada }: { onTerminada: () => void }) {
  const reduced = useReducedMotion();
  const [paso, setPaso] = useState(0);

  useEffect(() => {
    if (reduced) {
      const t = setTimeout(onTerminada, 4000);
      return () => clearTimeout(t);
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    [800, 2000, 3200, 4500, 5800, 7000].forEach((ms, i) => {
      timers.push(setTimeout(() => setPaso(i + 1), ms));
    });
    timers.push(setTimeout(onTerminada, 8500));
    return () => timers.forEach(clearTimeout);
  }, [reduced, onTerminada]);

  if (reduced) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 rounded-[14px] bg-gris-papel/60 p-4 text-left text-sm text-tinta/70">
          <p className="font-medium text-tinta">Paso 1: Mira la pieza</p>
          <p className="text-tinta/60">Una figura asimétrica de papel aparece como referencia.</p>
        </div>
        <div className="flex flex-col gap-2 rounded-[14px] bg-gris-papel/60 p-4 text-left text-sm text-tinta/70">
          <p className="font-medium text-tinta">Paso 2: Gírala en tu cabeza</p>
          <p className="text-tinta/60">Imagina la figura rotando hasta quedar en otra orientación.</p>
        </div>
        <div className="flex flex-col gap-2 rounded-[14px] bg-gris-papel/60 p-4 text-left text-sm text-tinta/70">
          <p className="font-medium text-tinta">Paso 3: Encuentra la coincidencia</p>
          <p className="text-tinta/60">Entre 4 alternativas, elige la que muestra la pieza ya rotada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <style>{ANIM_STYLES}</style>
      <p className="text-sm font-medium text-teal-profundo" style={{ animation: "mirai-aparecer 0.5s ease-out" }}>
        {paso === 0 ? "Mira la pieza de referencia..." : paso <= 3 ? "Gírala en tu cabeza" : "¿Cuál coincide?"}
      </p>

      <div className="flex items-center justify-center gap-8">
        {/* Pieza de referencia */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-xs text-tinta/50">Referencia</div>
          <svg width={80} height={80} viewBox="0 0 80 80">
            <polygon
              points="40,10 65,20 60,55 30,65 15,40"
              fill="var(--color-teal-medio)"
              stroke="var(--color-teal-profundo)"
              strokeWidth={2}
              strokeLinejoin="round"
              style={
                paso >= 2 && paso <= 4
                  ? { transformOrigin: "40px 40px", animation: "mirai-girar 2s ease-in-out infinite" }
                  : paso >= 5
                    ? { transformOrigin: "40px 40px", transform: "rotate(90deg)" }
                    : undefined
              }
            />
          </svg>
        </div>

        {paso >= 3 && (
          <>
            <svg width={24} height={24} viewBox="0 0 24 24" style={{ animation: "mirai-flecha 1.5s ease-in-out infinite" }}>
              <path d="M5 12h14M13 5l7 7-7 7" fill="none" stroke="var(--color-coral)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            {/* Alternativas */}
            <div className="flex gap-2">
              {[0, 90, 180, 270].map((ang, i) => (
                <div
                  key={i}
                  className={`flex h-14 w-14 items-center justify-center rounded-[10px] border transition-all ${
                    paso >= 5 && i === 1
                      ? "border-teal-profundo bg-teal-profundo/10"
                      : "border-tinta/15 bg-blanco-papel/70"
                  } ${i === 0 ? "opacity-40" : ""}`}
                >
                  <svg width={40} height={40} viewBox="0 0 80 80">
                    <polygon
                      points="40,10 65,20 60,55 30,65 15,40"
                      fill="var(--color-teal-medio)"
                      stroke="var(--color-teal-profundo)"
                      strokeWidth={2}
                      strokeLinejoin="round"
                      style={{ transformOrigin: "40px 40px", transform: `rotate(${ang}deg)` }}
                    />
                  </svg>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {paso >= 5 && (
        <p className="text-xs text-tinta/50">✓ La pieza gira 90° sin cambiar de forma</p>
      )}
    </div>
  );
}

// ── Demo: Secuencias ────────────────────────────────────────────────

export function DemoSecuencias({ onTerminada }: { onTerminada: () => void }) {
  const reduced = useReducedMotion();
  const [simboloActivo, setSimboloActivo] = useState<number | null>(null);
  const [paso, setPaso] = useState(0);

  const SECUENCIA_DEMO = [0, 2, 4]; // índices de símbolos
  const SIMBOLOS = ["△", "○", "◇", "⬡", "□", "⏢"];

  useEffect(() => {
    if (reduced) {
      const t = setTimeout(onTerminada, 4000);
      return () => clearTimeout(t);
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    // Mostrar secuencia: cada símbolo 700ms, 200ms entre ellos
    SECUENCIA_DEMO.forEach((simbolo, i) => {
      const inicio = i * 900;
      timers.push(setTimeout(() => {
        setSimboloActivo(simbolo);
        setPaso(i + 1);
      }, inicio));
      timers.push(setTimeout(() => setSimboloActivo(null), inicio + 700));
    });
    // Pausa, luego mostrar "ahora repite"
    const fin = SECUENCIA_DEMO.length * 900;
    timers.push(setTimeout(() => setPaso(4), fin));
    timers.push(setTimeout(() => setPaso(5), fin + 1500));

    // Repetir la secuencia destacada
    SECUENCIA_DEMO.forEach((simbolo, i) => {
      const inicio = fin + 1500 + i * 900;
      timers.push(setTimeout(() => {
        setSimboloActivo(simbolo);
        setPaso(6);
      }, inicio));
      timers.push(setTimeout(() => setSimboloActivo(null), inicio + 700));
    });
    timers.push(setTimeout(onTerminada, fin + 1500 + SECUENCIA_DEMO.length * 900 + 500));
    return () => timers.forEach(clearTimeout);
  }, [reduced, onTerminada]);

  if (reduced) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 rounded-[14px] bg-gris-papel/60 p-4 text-left text-sm text-tinta/70">
          <p className="font-medium text-tinta">Paso 1: Observa</p>
          <p className="text-tinta/60">Aparecen figuras una por una en un orden específico.</p>
        </div>
        <div className="flex flex-col gap-2 rounded-[14px] bg-gris-papel/60 p-4 text-left text-sm text-tinta/70">
          <p className="font-medium text-tinta">Paso 2: Recuerda</p>
          <p className="text-tinta/60">Concéntrate en el orden exacto en que aparecen.</p>
        </div>
        <div className="flex flex-col gap-2 rounded-[14px] bg-gris-papel/60 p-4 text-left text-sm text-tinta/70">
          <p className="font-medium text-tinta">Paso 3: Repite</p>
          <p className="text-tinta/60">Toca los símbolos en el MISMO orden en que los viste.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <style>{ANIM_STYLES}</style>
      <p className="text-sm font-medium text-teal-profundo" style={{ animation: "mirai-aparecer 0.5s ease-out" }}>
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
        {SIMBOLOS.map((s, i) => (
          <div
            key={i}
            className={`flex h-16 w-16 items-center justify-center rounded-[14px] border-2 text-xl transition-all duration-500 sm:h-20 sm:w-20 ${
              simboloActivo === i
                ? "border-coral bg-coral/10"
                : paso >= 4 && SECUENCIA_DEMO.includes(i)
                  ? "border-teal-profundo/40 bg-teal-profundo/5"
                  : "border-tinta/15 bg-blanco-papel/70"
            }`}
          >
            {s}
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
