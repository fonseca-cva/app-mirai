// ANONIMIZACIÓN DEL BLOQUE VERBAL — requisito de Camilo (obligatorio).
//
// Lo ÚNICO que sale hacia cualquier proveedor de IA es: el texto del estímulo,
// el texto escrito por el estudiante y la rúbrica. PROHIBIDO enviar session_id,
// user_id, correo, apodo, edad, curso o cualquier otro campo.
//
// Estrategia de doble capa:
//   1. Allowlist de construcción: el payload al proveedor se arma SOLO con
//      construirPromptSeguro({ estimulo, rubrica, texto }) — la firma de la
//      función no acepta ningún otro campo, así que no puede filtrarse nada.
//   2. Limpieza del texto del estudiante: patrones evidentes de datos
//      personales (RUT, teléfonos chilenos, correos, URLs) se reemplazan por
//      marcadores ANTES de entrar al prompt. El texto original completo se
//      guarda en nuestra base (respuestas_verbal.texto) sin alterarse.
//
// La triangulación con el resto del perfil ocurre SOLO en nuestro servidor:
// el proveedor devuelve un puntaje sobre un texto sin dueño y la plataforma
// es la única que lo une a la sesión.

// ── Allowlist: campos que pueden viajar al proveedor ──────────────
export const CAMPOS_ENVIADOS_AL_PROVEEDOR = [
  "estimulo",
  "rubrica",
  "texto_estudiante_anonimizado",
] as const;

export type CampoEnviado = (typeof CAMPOS_ENVIADOS_AL_PROVEEDOR)[number];

// ── Marcadores ────────────────────────────────────────────────────
export const MARCADORES = {
  rut: "[RUT]",
  telefono: "[TELÉFONO]",
  correo: "[CORREO]",
  url: "[URL]",
} as const;

export interface MarcadoresDetectados {
  rut: number;
  telefono: number;
  correo: number;
  url: number;
}

// ── Patrones (orden importa: RUT primero, antes de teléfono/URL) ──
// RUT con puntos y guion (12.345.678-9), RUT sin puntos con guion (12345678-9).
const PATRON_RUT = /\b\d{1,2}(?:\.\d{3}){2}-[\dkK]\b|\b\d{7,8}-[\dkK]\b/g;
// Teléfonos chilenos: móvil 9XXXXXXXX y fijo 2XXXXXXXX, con +56/56 opcional y
// separadores espacio/guion. Se aplica DESPUÉS del RUT (para no capturar el DV).
const PATRON_TELEFONO =
  /\b(?:\+?56[\s-]?)?(?:9|2)[\s-]?\d{4}[\s-]?\d{4}\b/g;
const PATRON_CORREO = /\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b/g;
const PATRON_URL = /\bhttps?:\/\/[^\s<>"']+|\bwww\.[^\s<>"']+/g;

/**
 * Reemplaza patrones evidentes de datos personales por marcadores.
 * NO altera el resto del texto. No es un filtro semántico: si el estudiante
 * escribe su nombre (que no conocemos), no hay patrón que detectar; la
 * advertencia en pantalla (bloqueVerbal.avisoDatosPersonales) cubre ese caso.
 */
export function sanitizarTextoEstudiante(texto: string): {
  texto: string;
  marcadores: MarcadoresDetectados;
} {
  const contar = (re: RegExp, fuente: string): number =>
    (fuente.match(re) ?? []).length;

  const rut = contar(PATRON_RUT, texto);
  let limpio = texto.replace(PATRON_RUT, MARCADORES.rut);

  const telefono = contar(PATRON_TELEFONO, limpio);
  limpio = limpio.replace(PATRON_TELEFONO, MARCADORES.telefono);

  const correo = contar(PATRON_CORREO, limpio);
  limpio = limpio.replace(PATRON_CORREO, MARCADORES.correo);

  const url = contar(PATRON_URL, limpio);
  limpio = limpio.replace(PATRON_URL, MARCADORES.url);

  return {
    texto: limpio,
    marcadores: { rut, telefono, correo, url },
  };
}

// ── Constructor del payload: allowlist de campos ───────────────────
// Única vía autorizada para armar lo que viaja al proveedor. La firma solo
// acepta estímulo + rúbrica + texto del estudiante; cualquier otro campo es
// imposible de enviar por construcción.
export interface PayloadSeguro {
  estimulo: string;
  rubrica: string;
  texto: string; // ya anonimizado
}

export function construirPayloadSeguro(opts: {
  estimulo: string;
  rubrica: string;
  texto: string;
}): { payload: PayloadSeguro; marcadores: MarcadoresDetectados } {
  const { texto, marcadores } = sanitizarTextoEstudiante(opts.texto);
  return {
    payload: {
      estimulo: opts.estimulo,
      rubrica: opts.rubrica,
      texto,
    },
    marcadores,
  };
}

/**
 * Prompt final en el formato que consume el proveedor (un solo string).
 * Solo los campos del allowlist pueden aparecer en él.
 */
export function construirPromptSeguro(opts: {
  estimulo: string;
  rubrica: string;
  texto: string;
}): { prompt: string; marcadores: MarcadoresDetectados } {
  const { payload, marcadores } = construirPayloadSeguro(opts);
  return {
    prompt: [
      `# Estímulo\n${payload.estimulo}`,
      `# Rúbrica\n${payload.rubrica}`,
      `# Respuesta del estudiante (anonimizada)\n${payload.texto}`,
    ].join("\n\n"),
    marcadores,
  };
}
