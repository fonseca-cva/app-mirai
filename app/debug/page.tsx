// /debug — herramienta interna de diagnóstico (punto 11 del plan de Camilo).
// Protegida con clave simple (DEBUG_KEY, cookie httpOnly) y no indexable.
// Permite probar en 10 segundos, sin hacer la experiencia completa:
//   (a) correo de prueba (Resend directo y OTP de Supabase Auth) con el
//       resultado REAL del proveedor;
//   (b) cadena completa de evaluación verbal con el JSON de cada paso y el
//       payload EXACTO enviado (vista de anonimización);
//   (c) prueba de carga de 30 evaluaciones simultáneas (anotada por Camilo).

import type { Metadata } from "next";
import { debugAutenticado, debugKeyConfigurada } from "@/lib/debug";
import { DebugLogin } from "./login";
import { DebugPanel } from "./panel";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DebugPage() {
  const autenticado = await debugAutenticado();

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-12 font-mono text-sm text-tinta">
      <h1 className="font-display text-2xl font-semibold">/debug — Diagnóstico Mirai</h1>
      {!debugKeyConfigurada() && (
        <p className="mt-4 text-red-500">
          DEBUG_KEY no configurada en este entorno: /debug está deshabilitado.
        </p>
      )}
      {autenticado ? <DebugPanel /> : <DebugLogin />}
    </main>
  );
}
