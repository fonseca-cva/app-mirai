// GET /api/debug/verificar-prueba — revalidation server-side del modo prueba.
// Confirma que la cookie httpOnly de /debug sigue siendo válida (hash de DEBUG_KEY).
// Es la ÚNICA puerta que permite escribir con es_prueba=true: solo si esta ruta
// responde ok=true se habilita el modo y se escriben datos de prueba. Sin cookies
// válida → 401/403 → el store desactiva el modo y no escribe nada (aislamiento 00017).
//
// No toca Supabase ni tiene efectos secundarios: es un check puro de cookie.

import { NextResponse } from "next/server";
import { debugAutenticado, debugKeyConfigurada } from "@/lib/debug";

export async function GET() {
  if (!debugKeyConfigurada()) {
    return NextResponse.json({ ok: false, razon: "DEBUG_KEY_no_configurada" }, { status: 503 });
  }
  const ok = await debugAutenticado();
  return NextResponse.json({ ok }, { status: ok ? 200 : 401 });
}
