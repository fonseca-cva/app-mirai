// register() corre UNA VEZ por instancia de servidor, antes de aceptar
// requests (estable desde Next 15, sin flag de config). Es el único lugar del
// repo donde un problema de configuración se "avisa solo": antes de esto,
// dependía de que alguien notara el síntoma o entrara a /debug (Camilo,
// 2026-09-10 — "que la próxima vez esto no dependa de que yo note la
// contradicción").
//
// Verifica exactamente lo que causó el incidente de enviar-informe-permanente:
// no solo que RESEND_API_KEY exista, sino que Resend la acepte de verdad. Una
// clave presente pero inválida/revocada, o un dominio remitente no verificado,
// nunca se habría visto con un simple "¿está la env var seteada?".
//
// No bloquea el arranque si Resend está caído o lento: timeout corto y
// try/catch total, porque un chequeo de diagnóstico jamás debe poder tumbar el
// servidor.

export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;

  const apiKey = process.env.RESEND_API_KEY ?? "";
  if (!apiKey) {
    console.error(
      "[startup-check] RESEND_API_KEY no está configurada — el envío de correos (informe permanente, magic link) va a fallar en producción."
    );
    return;
  }

  try {
    const respuesta = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!respuesta.ok) {
      const cuerpo = await respuesta.text();
      console.error(
        `[startup-check] RESEND_API_KEY presente pero Resend respondió ${respuesta.status} en /domains: ${cuerpo.slice(0, 500)}`
      );
      return;
    }
    const { data } = (await respuesta.json()) as { data?: Array<{ name: string; status: string }> };
    const noVerificados = (data ?? []).filter((d) => d.status !== "verified");
    if (noVerificados.length > 0) {
      console.error(
        `[startup-check] Dominio(s) de Resend sin verificar: ${noVerificados.map((d) => `${d.name} (${d.status})`).join(", ")}`
      );
    }
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : String(err);
    console.error(`[startup-check] No se pudo verificar Resend al arrancar: ${mensaje}`);
  }
}
