"use client";

// Login de la herramienta /debug: envía la clave simple a /api/debug/auth,
// que la valida server-side y fija la cookie httpOnly. La clave nunca se
// guarda en el cliente ni viaja en URLs.

import { useState } from "react";

export function DebugLogin() {
  const [clave, setClave] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "error">("idle");

  const entrar = async () => {
    if (!clave.trim()) return;
    setEstado("enviando");
    try {
      const r = await fetch("/api/debug/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clave: clave.trim() }),
      });
      if (!r.ok) {
        setEstado("error");
        return;
      }
      window.location.reload();
    } catch {
      setEstado("error");
    }
  };

  return (
    <section className="mt-10 max-w-sm rounded-[14px] border border-tinta/10 bg-blanco-papel p-6">
      <label className="block text-sm font-medium text-tinta/70" htmlFor="debug-clave">
        Clave de diagnóstico
      </label>
      <input
        id="debug-clave"
        type="password"
        value={clave}
        onChange={(e) => setClave(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && void entrar()}
        className="mt-2 w-full rounded-[10px] border border-tinta/10 px-3 py-2 outline-none focus:border-coral/50"
        autoFocus
      />
      <button
        onClick={() => void entrar()}
        disabled={estado === "enviando" || !clave.trim()}
        className="mt-4 rounded-[12px] bg-tinta px-5 py-2 text-white transition enabled:hover:opacity-90 disabled:opacity-40"
      >
        {estado === "enviando" ? "Validando..." : "Entrar"}
      </button>
      {estado === "error" && <p className="mt-3 text-sm text-red-500">Clave incorrecta.</p>}
    </section>
  );
}
