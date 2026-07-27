// Prueba de envío REAL de informe por correo (Fase 3, Paso 3).
// Exigida por Camilo antes del merge: crea una sesión anónima real, un resultado
// y un registro de correo, y llama a /api/enviar-informe contra un `next dev` local
// (que sí tiene RESEND_API_KEY real vía .env.local) para confirmar que Resend envía
// el correo de verdad, no la rama de simulación.
//
// Uso:
//   node --env-file=.env.local scripts/probar-envio-informe.mjs <email-destino> [base-url]
// Requiere un `next dev` corriendo en base-url (default http://localhost:3000).

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const emailDestino = process.argv[2];
const baseUrl = process.argv[3] ?? "http://localhost:3000";

if (!url || !anonKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY en el entorno.");
  process.exit(1);
}
if (!emailDestino) {
  console.error("Uso: node --env-file=.env.local scripts/probar-envio-informe.mjs <email-destino> [base-url]");
  process.exit(1);
}

const cliente = createClient(url, anonKey);

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
  capacidades: { patrones: 80, espacial: 65, memoria: 72, comunicacion: 78 },
  areasCarreras: ["Ingeniería", "Diseño", "Psicología"],
  generado_en: new Date(0).toISOString(),
};

const { error: resultadoError } = await cliente
  .from("resultados")
  .insert({ session_id: sessionId, perfil_json: perfilJson });
if (resultadoError) {
  console.error("Error creando resultado:", resultadoError.message);
  process.exit(1);
}
console.log("✅ Resultado de prueba creado");

const { error: correoError } = await cliente
  .from("correos_informe")
  .insert({ session_id: sessionId, email: emailDestino });
if (correoError) {
  console.error("Error registrando correo:", correoError.message);
  process.exit(1);
}
console.log(`✅ Correo registrado para envío — destino=${emailDestino}`);

const respuesta = await fetch(`${baseUrl}/api/enviar-informe`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${auth.session.access_token}`,
  },
  body: JSON.stringify({ sessionId }),
});

const cuerpo = await respuesta.json().catch(() => null);
console.log(`\nPOST /api/enviar-informe → ${respuesta.status}`, cuerpo);

if (respuesta.ok && cuerpo?.estado === "enviado") {
  console.log(`\n✅ Envío reportado como exitoso. Revisa la bandeja de ${emailDestino}.`);
  process.exit(0);
} else {
  console.error("\n❌ El envío falló o no fue confirmado.");
  process.exit(2);
}
