// Helper compartido de autenticación del /debug — SOLO server-side.
// La página y las rutas API de diagnóstico validan una cookie httpOnly cuyo
// valor es un hash de DEBUG_KEY: la clave simple nunca viaja por JS ni por URL.
// Sin DEBUG_KEY configurada en el entorno, /debug queda deshabilitado.

import { createHash } from "node:crypto";
import { cookies } from "next/headers";

export const DEBUG_COOKIE = "mirai_debug_auth";
export const DEBUG_COOKIE_MAX_AGE = 8 * 60 * 60; // 8 horas

export function hashClave(clave: string): string {
  return createHash("sha256").update(clave).digest("hex");
}

export function debugKeyConfigurada(): boolean {
  return (process.env.DEBUG_KEY ?? "").length > 0;
}

export async function debugAutenticado(): Promise<boolean> {
  if (!debugKeyConfigurada()) return false;
  const cookieStore = await cookies();
  const valor = cookieStore.get(DEBUG_COOKIE)?.value;
  if (!valor) return false;
  return valor === hashClave(process.env.DEBUG_KEY as string);
}
