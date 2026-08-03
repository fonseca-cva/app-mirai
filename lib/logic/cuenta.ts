// Validación y sanitización de los datos de cuenta (Tanda A).
// Política de Camilo: se pide SOLO correo + apodo opcional. Sin contraseñas,
// sin nombre real, sin RUT, sin teléfono, sin colegio.
//
// El apodo se sanitiza en el cliente (antes de guardarlo en sessionStorage y de
// pasarlo a updateUser) y nunca viaja por la red: el route /api/vincular-cuenta
// solo recibe el correo.

import { z } from "zod";

export const APODO_MAX_CODEPOINTS = 20;

// Correo: trim + minúsculas + formato básico. Se normaliza antes de llegar al RPC
// de rate limit (las cuentas se hacen sobre la versión normalizada).
export const correoSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Correo demasiado corto")
  .max(254, "Correo demasiado largo")
  .email("Correo inválido");

// Esquema del body del route. El apodo viaja como opcional y con tope amplio en
// code units; el límite real (20 code points) lo aplica sanitizarApodo().
export const vincularCuentaSchema = z.object({
  correo: correoSchema,
});

// Apodo: opcional, máx 20 code points, sin caracteres de control. No valida que
// sea un nombre real (política: es un apodo, el usuario puede inventar uno).
export function sanitizarApodo(valor: string): string {
  const limpio = valor
    // elimina caracteres de control (incluye saltos de línea y tabulaciones)
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    // colapsa espacios repetidos y recorta extremos
    .replace(/\s+/g, " ")
    .trim();
  // Array.from respeta code points: un emoji cuenta como un carácter.
  return Array.from(limpio).slice(0, APODO_MAX_CODEPOINTS).join("");
}
