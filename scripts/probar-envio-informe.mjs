// Prueba de envío REAL del correo del informe permanente (Tanda B).
// Verifica el flujo completo nuevo: sesión anónima → resultado con token →
// conversión de cuenta (enlace mágico) → POST /api/enviar-informe-permanente
// con el enlace /informe/[token] contra un `next dev` local (que sí tiene
// RESEND_API_KEY real vía .env.local) para confirmar que Resend envía de verdad,
// no la rama de simulación.
//
// El correo destinatario es el de la cuenta tras la conversión (auth), así que
// este script requiere el paso humano de abrir el enlace de confirmación (igual
// que verificar-conversion-cuenta.mjs).
//
// Uso:
//   EMAIL_PRUEBA=correo@descartable.cl node --env-file=.env.local scripts/probar-envio-informe.mjs [base-url]
// Requiere: migraciones 00012 y 00013 aplicadas, proveedor de email en Supabase,
// un `next dev` corriendo en base-url (default http://localhost:3000).

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const emailDestino = process.env.EMAIL_PRUEBA;
const baseUrl = process.argv[2] ?? "http://localhost:3000";
const redirectUrl = process.env.REDIRECT_URL ?? "http://localhost:3000/guardar-informe";
const esperaMs = Number(process.env.MIRA_ESPERA_MS ?? 180000);

if (!url || !anonKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY en el entorno.");
  process.exit(1);
}
if (!emailDestino) {
  console.error("Uso: EMAIL_PRUEBA=correo@descartable.cl node --env-file=.env.local scripts/probar-envio-informe.mjs [base-url]");
  process.exit(1);
}

const cliente = createClient(url, anonKey);

// ── 1) Sesión anónima + filas de prueba ─────────────────────────────
const { data: auth, error: authError } = await cliente.auth.signInAnonymously();
if (authError || !auth.user || !auth.session) {
  console.error("No se pudo crear sesión anónima:", authError);
  process.exit(1);
}
console.log(`✅ Sesión anónima creada — auth.uid()=${auth.user.id}`);

const sessionId = randomUUID();
const { error: sesionError } = await cliente
  .from("sesiones")
  .insert({ id: sessionId, dispositivo: "prueba-envio-informe" });
if (sesionError) {
  console.error("Error creando sesión:", sesionError.message);
  process.exit(1);
}
console.log(`✅ Sesión de negocio creada — session_id=${sessionId}`);

const perfilJson = {
  dimensionTop3: [
    { codigo: "I", etiqueta: "Investigativo", puntaje: 88 },
    { codigo: "A", etiqueta: "Artístico", puntaje: 74 },
    { codigo: "S", etiqueta: "Social", puntaje: 61 },
  ],
  capacidades: { patrones: 80, numerico: 60, espacial: 65, memoria: 72, comunicacion: 78 },
  carrerasRecomendadas: ["medicina", "enfermeria", "psicologia"],
  generado_en: new Date(0).toISOString(),
};

const { data: resultado, error: resultadoError } = await cliente
  .from("resultados")
  .insert({ session_id: sessionId, perfil_json: perfilJson })
  .select("token")
  .single();
if (resultadoError || !resultado?.token) {
  console.error("Error creando resultado (¿migración 00013 aplicada?):", resultadoError?.message);
  process.exit(1);
}
console.log(`✅ Resultado de prueba creado — token=${resultado.token}`);

// ── 2) Conversión: vincular el correo (mismo uid) ───────────────────
const { error: updateError } = await cliente.auth.updateUser({
  email: emailDestino,
  options: { emailRedirectTo: redirectUrl },
});
if (updateError) {
  console.error(
    `\n❌ updateUser({ email }) falló: ${updateError.message}\n` +
    "Posibles causas: el correo ya pertenece a otra cuenta (usa uno desechable nuevo) " +
    "o el proyecto no tiene proveedor de email configurado."
  );
  process.exit(2);
}
console.log(`✅ Correo de confirmación enviado — destino=${emailDestino}`);
console.log(`\n👉 Abre el enlace del correo en un navegador (cualquiera). Esperando confirmación (hasta ${Math.round(esperaMs / 1000)}s)...\n`);

const inicio = Date.now();
let confirmado = false;
while (Date.now() - inicio < esperaMs) {
  const { data, error } = await cliente.auth.getUser();
  if (!error && data.user && data.user.email === emailDestino && data.user.email_confirmed_at) {
    confirmado = true;
    break;
  }
  await new Promise((r) => setTimeout(r, 3000));
}
if (!confirmado) {
  console.error("\n❌ No se confirmó la vinculación del correo a tiempo.");
  process.exit(2);
}
console.log("✅ Cuenta vinculada — correo confirmado");

// ── 3) Llamada al route del envío (Bearer + sessionId) ──────────────
const { data: sesion } = await cliente.auth.getSession();
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

const respuesta = await fetch(`${baseUrl}/api/enviar-informe-permanente`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${sesion.session.access_token}`,
    ...(bypassSecret ? { "x-vercel-protection-bypass": bypassSecret } : {}),
  },
  body: JSON.stringify({ sessionId }),
});

const cuerpo = await respuesta.json().catch(() => null);
console.log(`\nPOST /api/enviar-informe-permanente → ${respuesta.status}`, cuerpo);

if (respuesta.ok && cuerpo?.estado === "enviado") {
  console.log(`\n✅ Envío reportado como exitoso. Revisa la bandeja de ${emailDestino}:`);
  console.log(`   el correo debe contener el enlace ${baseUrl}/informe/${resultado.token}`);
  process.exit(0);
} else {
  console.error("\n❌ El envío falló o no fue confirmado.");
  process.exit(2);
}
