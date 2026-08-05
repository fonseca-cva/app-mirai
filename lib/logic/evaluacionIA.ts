// PIPELINE DE EVALUACIÓN VERBAL COMPARTIDO — usado por /api/evaluar (producción)
// y por /api/debug/evaluar (diagnóstico). Un solo código, cero drift entre ambos.
//
// POLÍTICA DE DATOS (requisito de Camilo) — verificada en fuentes oficiales:
//   * DeepSeek (API, deepseek-chat): los datos enviados a la API NO se usan para
//     entrenar modelos (política de privacidad de DeepSeek: los datos de API se
//     usan solo para entregar el servicio; retención limitada de logs para
//     monitoreo/abuso, no para entrenamiento).
//   * Groq (API, llama-3.3-70b-versatile): Groq es proveedor de inferencia, NO
//     entrena con datos de clientes. Retiene datos de solicitudes hasta 30 días
//     para monitoreo de seguridad/abuso; ofrece Zero Data Retention (ZDR) vía
//     Data Controls para cuentas enterprise.
//   * Ninguna de estas APIs expone un flag por request para desactivar
//     entrenamiento: ambas documentan que no entrenan con datos de API por
//     defecto, así que el control es la elección de proveedor (ya elegidos).
//   * ANONIMIZACIÓN OBLIGATORIA: antes de cualquier llamada, el texto del
//     estudiante pasa por sanitizarTextoEstudiante() (RUT/teléfono/correo/URL →
//     marcadores). El payload contiene SOLO estímulo + rúbrica + texto
//     anonimizado (allowlist en lib/anonimizacion.ts). La triangulación con el
//     perfil ocurre únicamente en nuestro servidor.
//   * Registro auditable: cada llamada loguea la LISTA de campos enviados
//     (nunca el contenido) con sessionId + paso + proveedor + status.

import {
  EvaluacionSchema,
  PertinenciaSchema,
  promptComprension,
  promptArgumentacion,
  promptExpresion,
  promptPertinencia,
} from "@/lib/config/rubricas";
import { esCopiaLiteral } from "@/lib/logic/verbal";
import {
  CAMPOS_ENVIADOS_AL_PROVEEDOR,
  sanitizarTextoEstudiante,
  type MarcadoresDetectados,
} from "@/lib/anonimizacion";

// Timeout por llamada al proveedor. 30s: la cadena (pertinencia + 2 evaluadores
// en paralelo) nunca puede exceder ~2×30s, muy bajo del límite de Vercel.
export const TIMEOUT_IA_MS = 30_000;

export type TareaVerbal = "comprension" | "argumentacion" | "expresion";

// ── Proveedores ───────────────────────────────────────────────────
// Claves SOLO en variables de entorno del servidor (Vercel). Sin clave → null
// → la evaluación queda 'no_evaluado' (NUNCA se inventa un puntaje).
export interface ProveedorConfig {
  nombre: string;
  url: string;
  apiKey: string;
  model: string;
}

export function proveedorPrincipal(): ProveedorConfig | null {
  const apiKey = process.env.AI_API_KEY ?? "";
  if (!apiKey) return null;
  return {
    nombre: "DeepSeek",
    url: process.env.AI_PROVIDER_URL ?? "https://api.deepseek.com/chat/completions",
    apiKey,
    model: process.env.AI_MODEL ?? "deepseek-chat",
  };
}

export function proveedorSecundario(): ProveedorConfig | null {
  const apiKey = process.env.AI_API_KEY_2 ?? "";
  if (!apiKey) return null;
  return {
    nombre: "Groq",
    url: process.env.AI_PROVIDER_URL_2 ?? "https://api.groq.com/openai/v1/chat/completions",
    apiKey,
    model: process.env.AI_MODEL_2 ?? "llama-3.3-70b-versatile",
  };
}

// ── Llamada al proveedor (OpenAI-compatible) ──────────────────────
export interface ResultadoLlamada {
  ok: boolean;
  content: string | null; // salida textual del modelo (null si falló)
  status: number | null; // HTTP status del proveedor (null si excepción/red)
  error: string | null; // mensaje textual del proveedor o excepción
  proveedor: string;
  modelo: string;
}

interface CtxLlamada {
  sessionId: string; // SOLO para logs del servidor; jamás entra al prompt
  paso: string;
}

export async function llamarIA(
  prompt: string,
  proveedor: ProveedorConfig | null,
  ctx: CtxLlamada
): Promise<ResultadoLlamada> {
  const base = {
    proveedor: proveedor?.nombre ?? "sin_proveedor",
    modelo: proveedor?.model ?? "—",
  };

  if (!proveedor) {
    // Sin clave configurada: no se llama a nada. Audit trail igualmente.
    console.log(
      `[evaluar] IA sin_proveedor sessionId=${ctx.sessionId} paso=${ctx.paso} campos=${CAMPOS_ENVIADOS_AL_PROVEEDOR.join(",")}`
    );
    return { ok: false, content: null, status: null, error: "sin_proveedor", ...base };
  }

  // Registro auditable: lista de campos enviados (no el contenido).
  console.log(
    `[evaluar] IA enviar sessionId=${ctx.sessionId} paso=${ctx.paso} proveedor=${proveedor.nombre} modelo=${proveedor.model} campos=${CAMPOS_ENVIADOS_AL_PROVEEDOR.join(",")}`
  );

  try {
    const respuesta = await fetch(proveedor.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${proveedor.apiKey}`,
      },
      body: JSON.stringify({
        model: proveedor.model,
        messages: [
          {
            role: "system",
            content:
              "Eres un evaluador vocacional. Evalúas estructura y comprensión, nunca la opinión del estudiante. Respondes solo en JSON según el esquema indicado.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3, // baja para consistencia en evaluación
        max_tokens: 500,
      }),
      signal: AbortSignal.timeout(TIMEOUT_IA_MS),
    });

    if (!respuesta.ok) {
      const cuerpo = await respuesta.text();
      console.error(
        `[evaluar] IA error sessionId=${ctx.sessionId} paso=${ctx.paso} proveedor=${proveedor.nombre} status=${respuesta.status} cuerpo=${cuerpo.slice(0, 500)}`
      );
      return { ok: false, content: null, status: respuesta.status, error: cuerpo.slice(0, 1000), ...base };
    }

    const data = await respuesta.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";
    console.log(
      `[evaluar] IA ok sessionId=${ctx.sessionId} paso=${ctx.paso} proveedor=${proveedor.nombre} status=200`
    );
    return { ok: true, content, status: 200, error: null, ...base };
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : String(err);
    console.error(
      `[evaluar] IA excepción sessionId=${ctx.sessionId} paso=${ctx.paso} proveedor=${proveedor.nombre} error=${mensaje}`
    );
    return { ok: false, content: null, status: null, error: mensaje, ...base };
  }
}

// ── Extracción de JSON (puede venir envuelto en ```json ... ```) ──
export function extraerJson(raw: string): unknown {
  const sinFences = raw.replace(/```json\s*/gi, "").replace(/```\s*$/gi, "").trim();
  try {
    return JSON.parse(sinFences);
  } catch {
    const inicio = sinFences.indexOf("{");
    const fin = sinFences.lastIndexOf("}");
    if (inicio === -1 || fin === -1 || fin <= inicio) return null;
    try {
      return JSON.parse(sinFences.slice(inicio, fin + 1));
    } catch {
      return null;
    }
  }
}

// ── Cadena completa de evaluación ─────────────────────────────────
export interface PasoCadena {
  paso: "pertinencia" | "evaluador_1" | "evaluador_2";
  proveedor: string;
  modelo: string;
  ok: boolean;
  status: number | null;
  error: string | null;
  raw: string | null; // salida textual del modelo (para /debug y auditoría)
  parseado: unknown | null;
  // Payload EXACTO enviado al proveedor (vista de anonimización en /debug):
  // permite verificar en cualquier momento qué viaja y qué no.
  promptEnviado: string;
}

export interface ResultadoCadena {
  estado: "evaluado" | "no_pertinente" | "no_evaluado";
  razon?: string;
  mensaje: string;
  evaluacion?: { nivel: "literal" | "inferencial" | "critico"; puntaje: number; fortaleza: string; area_mejora: string };
  evaluacion2?: { nivel: "literal" | "inferencial" | "critico"; puntaje: number; fortaleza: string; area_mejora: string } | null;
  acuerdo_evaluadores: boolean;
  revision_requerida: boolean;
  acuerdo_no_disponible: boolean; // true si el 2º evaluador no está configurado o falló
  pasos: PasoCadena[];
  textoLimpio: string;
  marcadores: MarcadoresDetectados;
  proveedorInfo: {
    principal: { nombre: string; modelo: string } | null;
    secundario: { nombre: string; modelo: string } | null;
    timeoutMs: number;
  };
}

export async function ejecutarCadenaVerbal(opts: {
  sessionId: string;
  tarea: TareaVerbal;
  estimulo: string;
  texto: string;
}): Promise<ResultadoCadena> {
  const { sessionId, tarea, estimulo } = opts;

  // ANONIMIZACIÓN: el texto original se guarda en la base tal cual; lo único
  // que viaja es la versión limpia. El estímulo viene de nuestros bancos y la
  // rúbrica es constante: ni uno ni otra pueden contener datos personales.
  const { texto: textoLimpio, marcadores } = sanitizarTextoEstudiante(opts.texto);

  const principal = proveedorPrincipal();
  const secundario = proveedorSecundario();
  const proveedorInfo = {
    principal: principal ? { nombre: principal.nombre, modelo: principal.model } : null,
    secundario: secundario ? { nombre: secundario.nombre, modelo: secundario.model } : null,
    timeoutMs: TIMEOUT_IA_MS,
  };

  // Paso 1: rechazo de copia literal — SIN llamar al modelo.
  if (esCopiaLiteral(textoLimpio, estimulo)) {
    return {
      estado: "no_pertinente",
      razon: "copia_literal",
      mensaje: "Tu respuesta repite el texto original. Cuéntalo con tus propias palabras.",
      acuerdo_evaluadores: false,
      revision_requerida: false,
      acuerdo_no_disponible: true,
      pasos: [],
      textoLimpio,
      marcadores,
      proveedorInfo,
    };
  }

  const pasos: PasoCadena[] = [];

  // Paso 2: filtro de pertinencia (modelo principal).
  const promptPertinenciaCompleto = promptPertinencia(estimulo, textoLimpio);
  const rawPertinencia = await llamarIA(
    promptPertinenciaCompleto,
    principal,
    { sessionId, paso: "pertinencia" }
  );
  const parsePertinencia =
    rawPertinencia.ok && rawPertinencia.content
      ? PertinenciaSchema.safeParse(extraerJson(rawPertinencia.content))
      : null;
  pasos.push({
    paso: "pertinencia",
    proveedor: rawPertinencia.proveedor,
    modelo: rawPertinencia.modelo,
    ok: rawPertinencia.ok && parsePertinencia?.success === true,
    status: rawPertinencia.status,
    error: rawPertinencia.error,
    raw: rawPertinencia.content,
    parseado: parsePertinencia?.success ? parsePertinencia.data : (parsePertinencia?.error ?? null),
    promptEnviado: promptPertinenciaCompleto,
  });

  if (!rawPertinencia.ok || !rawPertinencia.content) {
    // No se pudo verificar pertinencia → no se puntúa (conservador y válido).
    return {
      estado: "no_evaluado",
      mensaje: "No se pudo evaluar tu respuesta en este momento.",
      acuerdo_evaluadores: false,
      revision_requerida: false,
      acuerdo_no_disponible: true,
      pasos,
      textoLimpio,
      marcadores,
      proveedorInfo,
    };
  }

  const pertinencia = PertinenciaSchema.safeParse(extraerJson(rawPertinencia.content));
  if (!pertinencia.success || !pertinencia.data.pertinente) {
    return {
      estado: "no_pertinente",
      razon: pertinencia.success ? pertinencia.data.razon : "sin_razon",
      mensaje:
        "Parece que tu respuesta no habla del texto que leíste. ¿Quieres intentarlo de nuevo?",
      acuerdo_evaluadores: false,
      revision_requerida: false,
      acuerdo_no_disponible: true,
      pasos,
      textoLimpio,
      marcadores,
      proveedorInfo,
    };
  }

  // Paso 3: rúbrica anclada. Evaluador 1 (principal) y, si existe, evaluador 2
  // (secundario) EN PARALELO — nunca en serie. El segundo es OPCIONAL: si no
  // está configurado o falla, se puntúa con el primero y se marca
  // acuerdo_no_disponible (un evaluador funcionando > ninguna evaluación).
  const rubricaPrompt =
    tarea === "comprension"
      ? promptComprension(estimulo)
      : tarea === "argumentacion"
        ? promptArgumentacion(estimulo)
        : promptExpresion(estimulo);

  const promptCompleto = `${rubricaPrompt}\n\n${textoLimpio}`;

  const llamada1 = llamarIA(promptCompleto, principal, { sessionId, paso: "evaluador_1" });
  const llamada2 = secundario
    ? llamarIA(promptCompleto, secundario, { sessionId, paso: "evaluador_2" })
    : null;

  const [raw1, raw2] = await Promise.all([llamada1, llamada2]);

  const parse1 =
    raw1.ok && raw1.content
      ? EvaluacionSchema.safeParse(extraerJson(raw1.content))
      : null;
  pasos.push({
    paso: "evaluador_1",
    proveedor: raw1.proveedor,
    modelo: raw1.modelo,
    ok: raw1.ok && parse1?.success === true,
    status: raw1.status,
    error: raw1.error,
    raw: raw1.content,
    parseado: parse1?.success ? parse1.data : (parse1?.error ?? null),
    promptEnviado: promptCompleto,
  });

  let evaluacion2: ResultadoCadena["evaluacion2"] = null;
  let acuerdo_no_disponible = true;
  if (secundario && raw2) {
    const parse2 =
      raw2.ok && raw2.content
        ? EvaluacionSchema.safeParse(extraerJson(raw2.content))
        : null;
    pasos.push({
      paso: "evaluador_2",
      proveedor: raw2.proveedor,
      modelo: raw2.modelo,
      ok: raw2.ok && parse2?.success === true,
      status: raw2.status,
      error: raw2.error,
      raw: raw2.content,
      parseado: parse2?.success ? parse2.data : (parse2?.error ?? null),
      promptEnviado: promptCompleto,
    });
    if (parse2?.success) {
      evaluacion2 = parse2.data;
      acuerdo_no_disponible = false;
    }
  }

  // Evaluador 1 falló o formato inválido → no hay evaluación reportable.
  if (!raw1.ok || !raw1.content || !parse1?.success) {
    return {
      estado: "no_evaluado",
      mensaje: "No se pudo evaluar tu respuesta en este momento.",
      acuerdo_evaluadores: false,
      revision_requerida: false,
      acuerdo_no_disponible,
      pasos,
      textoLimpio,
      marcadores,
      proveedorInfo,
    };
  }

  // Acuerdo: solo existe si AMBOS evaluadores respondieron y coincidieron
  // (diferencia ≤ 1 punto). Sin secundario, o si falla → acuerdo_no_disponible.
  let evaluacionReportada = parse1.data;
  let acuerdoEvaluadores = false;
  let revisionRequerida = false;

  if (evaluacion2) {
    const diferencia = Math.abs(parse1.data.puntaje - evaluacion2.puntaje);
    if (diferencia > 1) {
      revisionRequerida = true;
      // Se reporta el MENOR de los dos puntajes.
      evaluacionReportada = parse1.data.puntaje <= evaluacion2.puntaje ? parse1.data : evaluacion2;
    } else {
      acuerdoEvaluadores = true;
    }
  } else if (secundario) {
    // El segundo evaluador falló o devolvió formato inválido: se reporta el
    // primero y se marca para revisión (no se descarta la evaluación válida).
    revisionRequerida = true;
  }

  return {
    estado: "evaluado",
    mensaje: "Evaluación completada.",
    evaluacion: evaluacionReportada,
    evaluacion2,
    acuerdo_evaluadores: acuerdoEvaluadores,
    revision_requerida: revisionRequerida,
    acuerdo_no_disponible,
    pasos,
    textoLimpio,
    marcadores,
    proveedorInfo,
  };
}
