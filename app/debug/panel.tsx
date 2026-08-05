"use client";

// Panel de diagnóstico (autenticado vía cookie httpOnly — el cliente no
// conoce la clave). Muestra el resultado REAL de cada prueba: correo
// (Resend / OTP Supabase) y cadena de evaluación (pasos + payload exacto).

import { useState } from "react";

const DEMO_PII =
  "Hola, soy Juan Pérez. Mi RUT es 12.345.678-9 y mi correo es juan.perez@correo.cl. Mi teléfono es +56 9 1234 5678 y el sitio es www.ejemplo.cl. Creo que el texto muestra que la tecnología cambió la forma de estudiar: antes dependíamos de bibliotecas físicas y hoy el acceso es inmediato, pero también hay que aprender a filtrar información confiable.";

type Estado = { cargando: boolean; error: string | null; datos: unknown };

const estadoInicial: Estado = { cargando: false, error: null, datos: null };

function VerResultado({ estado }: { estado: Estado }) {
  if (estado.cargando) return <p className="text-tinta/50">Procesando…</p>;
  if (estado.error) return <p className="text-red-500">{estado.error}</p>;
  if (estado.datos === null) return null;
  return (
    <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap rounded-[10px] bg-tinta p-4 text-xs leading-relaxed text-green-300">
      {JSON.stringify(estado.datos, null, 2)}
    </pre>
  );
}

export function DebugPanel() {
  const [destino, setDestino] = useState("");
  const [correo, setCorreo] = useState<Estado>(estadoInicial);
  const [texto, setTexto] = useState(DEMO_PII);
  const [cadena, setCadena] = useState<Estado>(estadoInicial);
  const [carga, setCarga] = useState<Estado>(estadoInicial);

  const probarCorreo = async (tipo: "resend" | "otp") => {
    if (!destino.trim()) return;
    setCorreo({ cargando: true, error: null, datos: null });
    try {
      const r = await fetch("/api/debug/correo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, destino: destino.trim() }),
      });
      const datos = await r.json();
      setCorreo({ cargando: false, error: r.ok ? null : `HTTP ${r.status}: ${JSON.stringify(datos)}`, datos });
    } catch (e) {
      setCorreo({ cargando: false, error: String(e), datos: null });
    }
  };

  const correrCadena = async (modo: "cadena" | "carga") => {
    const setter = modo === "cadena" ? setCadena : setCarga;
    setter({ cargando: true, error: null, datos: null });
    try {
      const r = await fetch("/api/debug/evaluar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(modo === "cadena" ? { modo, texto } : { modo }),
      });
      const datos = await r.json();
      setter({ cargando: false, error: r.ok ? null : `HTTP ${r.status}: ${JSON.stringify(datos)}`, datos });
    } catch (e) {
      setter({ cargando: false, error: String(e), datos: null });
    }
  };

  return (
    <div className="mt-8 space-y-10">
      {/* (a) Correo */}
      <section>
        <h2 className="font-display text-lg font-semibold">1. Correo de prueba</h2>
        <p className="mt-1 text-tinta/60">
          Muestra la respuesta REAL del proveedor. <code>resend</code>: envío directo desde{" "}
          <code>informe@miraiapp.cl</code>. <code>otp</code>: correo integrado de Supabase Auth
          (con SMTP custom configurado sale por Resend vía SMTP).
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            type="email"
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            placeholder="destino@correo.cl"
            className="w-64 rounded-[10px] border border-tinta/10 px-3 py-2 outline-none focus:border-coral/50"
          />
          <button
            onClick={() => void probarCorreo("resend")}
            disabled={correo.cargando || !destino.trim()}
            className="rounded-[12px] bg-coral px-4 py-2 text-blanco-papel transition enabled:hover:opacity-90 disabled:opacity-40"
          >
            Resend directo
          </button>
          <button
            onClick={() => void probarCorreo("otp")}
            disabled={correo.cargando || !destino.trim()}
            className="rounded-[12px] bg-tinta px-4 py-2 text-blanco-papel transition enabled:hover:opacity-90 disabled:opacity-40"
          >
            OTP Supabase Auth
          </button>
        </div>
        <div className="mt-3">
          <VerResultado estado={correo} />
        </div>
      </section>

      {/* (b) Cadena completa */}
      <section>
        <h2 className="font-display text-lg font-semibold">2. Cadena de evaluación verbal</h2>
        <p className="mt-1 text-tinta/60">
          Corre la misma cadena de producción (pertinencia → evaluador 1 + 2 en paralelo).
          Devuelve el JSON de cada paso, el payload EXACTO enviado a cada proveedor y los
          marcadores de anonimización detectados.
        </p>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          className="mt-3 min-h-[120px] w-full rounded-[10px] border border-tinta/10 bg-blanco-papel p-3 outline-none focus:border-coral/50"
        />
        <div className="mt-2 flex gap-3">
          <button
            onClick={() => void correrCadena("cadena")}
            disabled={cadena.cargando}
            className="rounded-[12px] bg-coral px-4 py-2 text-blanco-papel transition enabled:hover:opacity-90 disabled:opacity-40"
          >
            {cadena.cargando ? "Evaluando…" : "Ejecutar cadena completa"}
          </button>
          <button
            onClick={() => setTexto(DEMO_PII)}
            className="rounded-[12px] border border-tinta/20 px-4 py-2 text-tinta/70 transition hover:bg-tinta/5"
          >
            Cargar texto de prueba con datos personales
          </button>
        </div>
        <div className="mt-3">
          <VerResultado estado={cadena} />
        </div>
      </section>

      {/* (c) Carga */}
      <section>
        <h2 className="font-display text-lg font-semibold">3. Carga: 30 evaluaciones simultáneas</h2>
        <p className="mt-1 text-tinta/60">
          Prueba anotada por Camilo para antes del piloto: detecta 429 del proveedor bajo carga.
        </p>
        <button
          onClick={() => void correrCadena("carga")}
          disabled={carga.cargando}
          className="mt-3 rounded-[12px] bg-tinta px-4 py-2 text-blanco-papel transition enabled:hover:opacity-90 disabled:opacity-40"
        >
          {carga.cargando ? "Corriendo 30 en paralelo…" : "Correr 30 en paralelo"}
        </button>
        <div className="mt-3">
          <VerResultado estado={carga} />
        </div>
      </section>
    </div>
  );
}
