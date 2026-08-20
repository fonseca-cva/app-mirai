// GET /api/debug/env-check — diagnóstico de runtime para las variables de IA.
// `vercel env ls` no prueba ausencia: variables Shared/Sensitive a nivel de
// equipo no son listables por CLI ni dashboard. La única prueba válida es
// preguntarle al runtime de producción si `process.env` las tiene definidas.
// Nunca se expone el valor, ni prefijo, ni sufijo — solo si está definida y
// cuántos caracteres tiene.

import { NextResponse } from "next/server";
import { debugAutenticado, debugKeyConfigurada } from "@/lib/debug";

const VARIABLES = [
  "AI_API_KEY",
  "AI_API_KEY_2",
  "AI_PROVIDER_URL",
  "AI_MODEL",
  "AI_PROVIDER_URL_2",
  "AI_MODEL_2",
  "DEBUG_KEY",
] as const;

export async function GET() {
  if (!debugKeyConfigurada()) {
    return NextResponse.json({ ok: false, razon: "DEBUG_KEY_no_configurada" }, { status: 503 });
  }
  if (!(await debugAutenticado())) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const variables = Object.fromEntries(
    VARIABLES.map((nombre) => {
      const valor = process.env[nombre] ?? "";
      return [nombre, { definida: valor.length > 0, largo: valor.length }];
    })
  );

  return NextResponse.json({ ok: true, entorno: process.env.VERCEL_ENV ?? "local", variables });
}
