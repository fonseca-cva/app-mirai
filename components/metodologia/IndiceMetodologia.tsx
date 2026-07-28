'use client';

import { useState } from "react";
import { metodologiaIndice } from "@/lib/config/textos";

export function IndiceMetodologia() {
  const [abierto, setAbierto] = useState(false);

  return (
    <nav className="mb-12 rounded-[14px] border border-tinta/10 bg-blanco-papel p-4 shadow-sm" aria-label="Índice de secciones">
      <button
        onClick={() => setAbierto(!abierto)}
        className="flex w-full items-center justify-between text-left font-display text-sm font-semibold text-tinta sm:hidden"
        aria-expanded={abierto}
      >
        <span>Índice</span>
        <svg
          className={`h-4 w-4 transition-transform ${abierto ? "rotate-180" : ""}`}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <polyline points="4,6 8,10 12,6" />
        </svg>
      </button>
      <ul className={`mt-2 space-y-1 sm:mt-0 sm:flex sm:flex-wrap sm:gap-x-6 sm:gap-y-1 ${abierto ? "block" : "hidden sm:flex"}`}>
        {metodologiaIndice.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              className="block text-sm text-tinta/70 transition hover:text-coral sm:inline"
              onClick={() => setAbierto(false)}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
