'use client';

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Articulo } from "@/lib/articulos";

type Publico = 'estudiante' | 'apoderado' | 'orientador';

const ETIQUETA_PUBLICO: Record<Publico, string> = {
  estudiante: 'Estudiante',
  apoderado: 'Apoderado',
  orientador: 'Orientador',
};

interface Props {
  articulos: Articulo[];
  moldes: string[];
}

export function ArticulosIndexClient({ articulos, moldes }: Props) {
  const [filtroPublico, setFiltroPublico] = useState<Publico | 'todas'>('todas');
  const [filtroMolde, setFiltroMolde] = useState<string | 'todos'>('todos');

  const filtrados = useMemo(() => {
    let resultado = articulos;
    if (filtroPublico !== 'todas') {
      resultado = resultado.filter((a) => a.publico === filtroPublico);
    }
    if (filtroMolde !== 'todos') {
      resultado = resultado.filter((a) => a.molde === filtroMolde);
    }
    return resultado;
  }, [articulos, filtroPublico, filtroMolde]);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <fieldset className="space-y-3">
        <legend className="font-display text-base font-medium text-tinta">Filtrar por</legend>

        <div className="flex flex-wrap gap-2">
          {/* Público */}
          <div className="flex items-center gap-1 rounded-xl border border-tinta/15 bg-blanco-papel p-1">
            {(['todas', 'estudiante', 'apoderado', 'orientador'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setFiltroPublico(p)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  filtroPublico === p
                    ? 'bg-coral text-blanco-papel'
                    : 'text-tinta/60 hover:text-tinta hover:bg-tinta/5'
                }`}
              >
                {p === 'todas' ? 'Todas las audiencias' : ETIQUETA_PUBLICO[p]}
              </button>
            ))}
          </div>

          {/* Molde / Tema */}
          <select
            value={filtroMolde}
            onChange={(e) => setFiltroMolde(e.target.value)}
            className="cursor-pointer rounded-xl border border-tinta/15 bg-blanco-papel px-3 py-1.5 text-xs font-medium text-tinta/70 transition hover:text-tinta"
          >
            <option value="todos">Todos los temas</option>
            {moldes.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </fieldset>

      {/* Lista de artículos */}
      {filtrados.length === 0 ? (
        <p className="text-sm text-tinta/50">No hay artículos con esos filtros.</p>
      ) : (
        <ul className="space-y-4">
          {filtrados.map((articulo) => (
            <li key={articulo.slug}>
              <Link
                href={`/articulos/${articulo.slug}`}
                className="group block rounded-2xl border border-tinta/10 bg-blanco-papel p-5 transition hover:border-coral/30 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1.5">
                    <h2 className="font-display text-lg font-medium leading-snug text-tinta group-hover:text-coral transition">
                      {articulo.titulo}
                    </h2>
                    <p className="text-sm leading-relaxed text-tinta/60 line-clamp-2">
                      {articulo.resumen}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="rounded-full bg-tinta/5 px-2.5 py-0.5 text-[11px] font-medium text-tinta/60">
                        {articulo.molde}
                      </span>
                      <span className="rounded-full bg-coral/10 px-2.5 py-0.5 text-[11px] font-medium text-coral/80">
                        {ETIQUETA_PUBLICO[articulo.publico]}
                      </span>
                    </div>
                  </div>
                  <svg
                    className="mt-1 h-5 w-5 shrink-0 text-tinta/30 transition group-hover:text-coral group-hover:translate-x-0.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="pt-2 text-xs text-tinta/40">
        {filtrados.length} artículo{filtrados.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
