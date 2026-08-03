// Plantilla del correo transaccional del informe vocacional.
// Camilo: HTML simple y liviano, texto plano como fallback, sin imágenes pesadas ni trackers.

import type { PerfilResultado } from "@/lib/supabase/types";
import { carreraPorId } from "@/lib/data/carreras";

function nombreCarrera(id: string): string {
  return carreraPorId(id)?.nombre ?? id;
}

export function construirCorreoInforme(perfil: PerfilResultado): { subject: string; html: string; text: string } {
  const top3 = perfil.dimensionTop3.map((d) => `${d.etiqueta} (${d.puntaje}%)`);
  const areas = perfil.carrerasRecomendadas.map(nombreCarrera);

  const subject = "Tu informe vocacional Mirai";

  const text = [
    "Tu informe vocacional Mirai",
    "",
    "Tus intereses principales:",
    ...top3.map((t) => `- ${t}`),
    "",
    "Caminos para explorar:",
    ...areas.map((a) => `- ${a}`),
    "",
    "Este informe es una orientación inicial, no un diagnóstico definitivo.",
  ].join("\n");

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
      <h1 style="font-size: 20px;">Tu informe vocacional Mirai</h1>
      <h2 style="font-size: 16px; margin-top: 24px;">Tus intereses principales</h2>
      <ul>${top3.map((t) => `<li>${t}</li>`).join("")}</ul>
      <h2 style="font-size: 16px; margin-top: 24px;">Caminos para explorar</h2>
      <ul>${areas.map((a) => `<li>${a}</li>`).join("")}</ul>
      <p style="font-size: 12px; color: #666; margin-top: 32px;">
        Este informe es una orientación inicial, no un diagnóstico definitivo.
      </p>
    </div>
  `.trim();

  return { subject, html, text };
}
