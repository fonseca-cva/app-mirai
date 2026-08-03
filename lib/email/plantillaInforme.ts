// Plantilla del correo del informe permanente (Tanda B).
// Regla de Camilo: un correo CORTO que lleve al informe — "Tu informe de Mirai
// está acá: [enlace]". HTML simple y liviano, texto plano de respaldo, sin
// trackers de apertura (ni pixel, ni imágenes, ni analytics).

export function construirCorreoInformePermanente(enlace: string): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Tu informe de Mirai está acá";

  const text = [
    "Hola,",
    "",
    "Tu informe de Mirai está acá:",
    enlace,
    "",
    "Guárdalo y míralo cuando quieras. Compártelo solo con quien tú quieras.",
    "",
    "Mirai — orientación vocacional con datos, no un veredicto.",
  ].join("\n");

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
      <p>Hola,</p>
      <p>Tu informe de Mirai está acá:</p>
      <p><a href="${enlace}" style="color: #e05252;">${enlace}</a></p>
      <p style="font-size: 12px; color: #666;">Guárdalo y míralo cuando quieras. Compártelo solo con quien tú quieras.</p>
    </div>
  `.trim();

  return { subject, html, text };
}
