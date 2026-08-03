// E2E de conversión anónimo → cuenta con PRESERVACIÓN de datos (Tanda A).
//
// Camilo exige: "crear sesión anónima, completar experiencia, vincular correo,
// confirmar que el informe sigue ahí". Este script automatiza la verificación:
//
//   1. Crea una sesión anónima y registra su auth.uid().
//   2. Inserta una fila de prueba (simula respuestas/resultado del informe).
//   3. Envía la confirmación de correo vía updateUser({ email }) — el mecanismo
//      que mantiene el MISMO auth.uid() al convertir el usuario anónimo.
//   4. Pide que abras el enlace del correo (paso humano, en cualquier navegador).
//   5. Confirma por API que el uid NO cambió y que la fila sigue accesible.
//
// Requiere: proyecto real con 00012 aplicada, proveedor de email configurado y
// "Secure email change" activo (default). Usa un correo DESECHABLE: si el correo
// ya pertenece a otra cuenta, el flujo no puede continuar (error claro al final).
//
// Uso:
//   EMAIL_PRUEBA=correo@descartable.cl node --env-file=.env.local scripts/verificar-conversion-cuenta.mjs
// Variables opcionales: REDIRECT_URL (default http://localhost:3000/guardar-informe),
// MIRA_ESPERA_MS (default 180000).

import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const email = process.env.EMAIL_PRUEBA;
const redirectUrl = process.env.REDIRECT_URL ?? "http://localhost:3000/guardar-informe";
const esperaMs = Number(process.env.MIRA_ESPERA_MS ?? 180000);

if (!url || !anonKey || !email) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / EMAIL_PRUEBA. " +
    "Uso: EMAIL_PRUEBA=correo@descartable.cl node --env-file=.env.local scripts/verificar-conversion-cuenta.mjs"
  );
  process.exit(1);
}

let fallas = 0;
function reportar(nombre, ok, detalle) {
  console.log(`${ok ? "✅" : "❌"} ${nombre}${detalle ? " — " + detalle : ""}`);
  if (!ok) fallas++;
}

// ── 1) Sesión anónima ──────────────────────────────────────────────
const cliente = createClient(url, anonKey);
const { data: anon, error: anonError } = await cliente.auth.signInAnonymously();
if (anonError || !anon.user) {
  console.error("No se pudo crear la sesión anónima:", anonError?.message);
  process.exit(1);
}
const uidAnonimo = anon.user.id;
reportar("Sesión anónima creada", true, uidAnonimo);

// ── 2) Fila de prueba (simula los datos del informe) ───────────────
const sesionIdPrueba = randomUUID();
const marcador = `conversion-cuenta-${Date.now()}`;
const { error: insertError } = await cliente
  .from("sesiones")
  .insert({ id: sesionIdPrueba, dispositivo: marcador });
reportar("Fila de prueba insertada bajo el uid anónimo", !insertError, insertError?.message);
if (insertError) process.exit(1);

// ── 3) Envío de la confirmación de correo (mismo uid) ──────────────
const { error: updateError } = await cliente.auth.updateUser({
  email,
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
reportar("Correo de confirmación enviado", true, email);

console.log(`\n👉 Abre el enlace del correo en un navegador (cualquiera). Esperando confirmación (hasta ${Math.round(esperaMs / 1000)}s)...\n`);

// ── 4+5) Esperar la confirmación y verificar preservación ──────────
const inicio = Date.now();
let verificado = false;

while (Date.now() - inicio < esperaMs) {
  const { data, error } = await cliente.auth.getUser();
  if (!error && data.user) {
    const usuario = data.user;
    if (usuario.email === email && usuario.email_confirmed_at) {
      verificado = true;

      reportar(
        "El uid NO cambió tras vincular el correo",
        usuario.id === uidAnonimo,
        `${usuario.id}`
      );

      // La fila de prueba sigue accesible con la MISMA sesión (RLS por uid).
      const { data: filas, error: lecturaError } = await cliente
        .from("sesiones")
        .select("id, dispositivo")
        .eq("id", sesionIdPrueba)
        .single();
      reportar(
        "La fila del informe sigue accesible tras la conversión",
        !lecturaError && filas?.dispositivo === marcador,
        lecturaError ? lecturaError.message : "fila intacta"
      );

      const { data: infoCuenta } = await cliente.auth.getSession();
      reportar(
        "La sesión conserva el correo vinculado",
        infoCuenta?.session?.user?.email === email,
        infoCuenta?.session?.user?.email ?? "sin email en sesión local"
      );
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 3000));
}

if (!verificado) {
  console.error(
    `\n❌ Tiempo de espera agotado (${Math.round(esperaMs / 1000)}s). No se confirmó el correo.\n` +
    "Revisa: ¿llegó el correo? ¿hiciste clic en el enlace? ¿el proveedor de email está configurado?"
  );
  process.exit(2);
}

console.log(fallas === 0 ? "\nConversión OK: datos preservados con el mismo auth.uid()." : `\n${fallas} verificación(es) fallida(s).`);
process.exit(fallas === 0 ? 0 : 2);
