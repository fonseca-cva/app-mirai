// POST /api/evaluar — Evalúa respuestas del Bloque Verbal usando IA.
// Sección 4 de la spec: la clave del proveedor vive SOLO en variable de entorno del servidor.
//
// VALIDEZ (plan de Camilo, entrega 1, puntos 1-7). Pipeline, en orden:
//   1. Validación de entrada (mínimo 120 caracteres, igual que el cliente).
//   2. Rechazo de copia literal del estímulo (solapamiento de n-gramas) — SIN llamar al modelo.
//   3. Filtro de pertinencia (modelo principal): binario pertinente/no pertinente + razón.
//      Si NO es pertinente → NO se puntúa: estado 'no_pertinente' (el cliente ofrece 1 reintento).
//   4. Rúbrica anclada 1-5 (modelo principal).
//   5. Doble evaluación (modelo secundario si AI_API_KEY_2 está configurada): se guardan
//      ambos puntajes; si difieren en más de 1 punto → revision_requerida: true y se
//      reporta el MENOR. acuerdo_evaluadores alimenta la métrica de % de acuerdo del sistema.
//   6. NUNCA se inventa un puntaje: sin clave, fallo del proveedor o formato inválido →
//      estado 'no_evaluado' (la dimensión se reporta "sin evaluar" en el informe).
//
// POLÍTICA DE DATOS (punto 7 del plan) — verificada en fuentes oficiales:
//   * OpenRouter: no entrena con tus datos, pero los model providers pueden.
//     gpt-4o-mini es de OpenAI: su API no entrena con datos por defecto (opt-in).
//     No existe flag por request: el control es la elección de modelo/proveedor.
//   * Groq: no retiene datos de cliente en inferencia por defecto; logs de monitoreo
//     hasta 30 días; ZDR (Zero Data Retention) disponible en Data Controls (admin de la
//     org). Groq no entrena (es proveedor de inferencia).
//   * No hay flag "no entrenar" en estas APIs; documentamos la política aquí. La elección
//     definitiva de proveedor para texto escrito por menores queda sujeta a revisión legal
//     (transferencia internacional de datos). Mientras eso se resuelve, NO se cambia el
//     proveedor principal.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  EvaluacionSchema,
  PertinenciaSchema,
  promptComprension,
  promptArgumentacion,
  promptExpresion,
  promptPertinencia,
  TEXTOS_COMPRENSION,
  DILEMAS_ARGUMENTACION,
  CONSIGNAS_EXPRESION,
  RATE_LIMIT_POR_SESSION,
} from "@/lib/config/rubricas";
import { esCopiaLiteral, CARACTERES_MINIMOS } from "@/lib/logic/verbal";

// ── Rate limiter en memoria ───────────────────────────────────────
// // LIMITACIÓN: se resetea en cada cold start de Vercel.
// // PENDIENTE: migrar a rate limit persistente (Upstash/BetterStack) si hay carga real.
const contadorLlamadas = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(sessionId: string): boolean {
  const now = Date.now();
  const entry = contadorLlamadas.get(sessionId);

  if (!entry || now > entry.resetAt) {
    contadorLlamadas.set(sessionId, { count: 1, resetAt: now + 60 * 60 * 1000 }); // 1 hora
    return true;
  }

  if (entry.count >= RATE_LIMIT_POR_SESSION) return false;

  entry.count++;
  return true;
}

// ── Esquema de entrada ────────────────────────────────────────────
const EvaluarRequestSchema = z.object({
  sessionId: z.string().uuid(),
  tarea: z.enum(["comprension", "argumentacion", "expresion"]),
  texto: z.string().min(CARACTERES_MINIMOS).max(3000), // mismo mínimo que el cliente (punto 6)
  indiceTexto: z.number().int().min(0).optional(), // para comprensión: índice del texto base
  indiceDilema: z.number().int().min(0).optional(), // para argumentación: índice del dilema
  indiceExpresion: z.number().int().min(0).optional(), // para expresión: índice de la consigna
  // Telemetría de control de calidad (punto 4): SOLO metadato. No va al modelo,
  // no afecta el puntaje, no se muestra al usuario.
  pegado: z.boolean().optional(),
  caracteresPegados: z.number().int().min(0).optional(),
  intento: z.number().int().min(1).max(2).optional(),
});

// ── Proveedores de IA (OpenRouter/Groq-compatibles) ───────────────
interface ProveedorConfig {
  url: string;
  apiKey: string;
  model: string;
}

// Evaluador principal. Sin AI_API_KEY → null (NO se simula: la evaluación queda 'no_evaluado').
function proveedorPrincipal(): ProveedorConfig | null {
  const apiKey = process.env.AI_API_KEY ?? "";
  if (!apiKey) return null;
  return {
    url: process.env.AI_PROVIDER_URL ?? "https://openrouter.ai/api/v1/chat/completions",
    apiKey,
    model: process.env.AI_MODEL ?? "openai/gpt-4o-mini",
  };
}

// Segundo evaluador (doble evaluación, punto 5). Groq es aceptable. Sin clave → un solo
// evaluador (comportamiento degradado documentado: revision_requerida siempre false).
function proveedorSecundario(): ProveedorConfig | null {
  const apiKey = process.env.AI_API_KEY_2 ?? "";
  if (!apiKey) return null;
  return {
    url: process.env.AI_PROVIDER_URL_2 ?? "https://api.groq.com/openai/v1/chat/completions",
    apiKey,
    model: process.env.AI_MODEL_2 ?? "llama-3.3-70b-versatile",
  };
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function llamarIA(prompt: string, proveedor: ProveedorConfig | null): Promise<string | null> {
  if (!proveedor) return null; // sin proveedor → no se evalúa, nunca se inventa

  const messages: ChatMessage[] = [
    { role: "system", content: "Eres un evaluador vocacional. Evalúas estructura y comprensión, nunca la opinión del estudiante. Respondes solo en JSON según el esquema indicado." },
    { role: "user", content: prompt },
  ];

  try {
    const respuesta = await fetch(proveedor.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${proveedor.apiKey}`,
      },
      body: JSON.stringify({
        model: proveedor.model,
        messages,
        temperature: 0.3, // baja para consistencia en evaluación
        max_tokens: 500,
      }),
      signal: AbortSignal.timeout(20000), // 20s: pertinencia + rúbrica exigen más margen
    });

    if (!respuesta.ok) {
      console.error(`[evaluar] API responded ${respuesta.status}: ${await respuesta.text()}`);
      return null;
    }

    const data = await respuesta.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";
    return content;
  } catch (err) {
    console.error("[evaluar] Error calling AI provider:", err);
    return null;
  }
}

// Extrae el JSON de la respuesta (puede venir envuelto en ```json ... ```).
function extraerJson(raw: string): unknown {
  const sinFences = raw.replace(/```json\s*/gi, "").replace(/```\s*$/gi, "").trim();
  try {
    return JSON.parse(sinFences);
  } catch {
    // Último recurso: recortar desde el primer "{" hasta el último "}".
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

// ── POST handler ──────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = EvaluarRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", detalle: parsed.error.issues },
        { status: 400 }
      );
    }

    const { sessionId, tarea, texto, indiceTexto, indiceDilema, indiceExpresion } = parsed.data;

    // Rate limit
    if (!checkRateLimit(sessionId)) {
      return NextResponse.json(
        { error: "Límite de evaluaciones alcanzado para esta sesión. Intenta más tarde." },
        { status: 429 }
      );
    }

    // Estímulo correspondiente a la tarea (para pertinencia y copia literal).
    const estimulo =
      tarea === "comprension"
        ? TEXTOS_COMPRENSION[indiceTexto ?? 0]
        : tarea === "argumentacion"
          ? DILEMAS_ARGUMENTACION[indiceDilema ?? 0]
          : CONSIGNAS_EXPRESION[indiceExpresion ?? 0];

    // ── Paso 1: rechazo de copia literal (punto 6) — sin llamar al modelo ──
    if (esCopiaLiteral(texto, estimulo)) {
      return NextResponse.json(
        {
          estado: "no_pertinente",
          razon: "copia_literal",
          mensaje: "Tu respuesta repite el texto original. Cuéntalo con tus propias palabras.",
        },
        { status: 200 }
      );
    }

    const principal = proveedorPrincipal();

    // ── Paso 2: filtro de pertinencia (punto 2) ──
    const rawPertinencia = await llamarIA(promptPertinencia(estimulo, texto), principal);
    if (rawPertinencia === null) {
      // No se pudo verificar pertinencia → no se puntúa (conservador y válido).
      return NextResponse.json(
        { estado: "no_evaluado", mensaje: "No se pudo evaluar tu respuesta en este momento." },
        { status: 200 }
      );
    }
    const pertinencia = PertinenciaSchema.safeParse(extraerJson(rawPertinencia));
    if (!pertinencia.success || !pertinencia.data.pertinente) {
      return NextResponse.json(
        {
          estado: "no_pertinente",
          razon: pertinencia.success ? pertinencia.data.razon : "sin_razon",
          mensaje: "Parece que tu respuesta no habla del texto que leíste. ¿Quieres intentarlo de nuevo?",
        },
        { status: 200 }
      );
    }

    // ── Paso 3: rúbrica anclada (evaluador principal) ──
    const prompt =
      tarea === "comprension"
        ? promptComprension(estimulo)
        : tarea === "argumentacion"
          ? promptArgumentacion(estimulo)
          : promptExpresion(estimulo);

    const promptCompleto = prompt + "\n\n" + texto;

    const raw1 = await llamarIA(promptCompleto, principal);
    if (raw1 === null) {
      return NextResponse.json(
        { estado: "no_evaluado", mensaje: "No se pudo evaluar tu respuesta en este momento." },
        { status: 200 }
      );
    }
    const eval1 = EvaluacionSchema.safeParse(extraerJson(raw1));
    if (!eval1.success) {
      console.error("[evaluar] Invalid AI response format (evaluador 1):", raw1);
      return NextResponse.json(
        { estado: "no_evaluado", mensaje: "No se pudo evaluar tu respuesta en este momento." },
        { status: 200 }
      );
    }

    // ── Paso 4: doble evaluación (punto 5) ──
    const secundario = proveedorSecundario();
    let evaluacionReportada = eval1.data;
    let evaluacion2: typeof eval1.data | null = null;
    // El acuerdo solo existe si AMBOS evaluadores respondieron y coincidieron:
    // sin secundario configurado, o si este falla, NO hay acuerdo que reportar.
    let acuerdoEvaluadores = false;
    let revisionRequerida = false;

    if (secundario) {
      const raw2 = await llamarIA(promptCompleto, secundario);
      const eval2 = raw2 === null ? null : EvaluacionSchema.safeParse(extraerJson(raw2));
      if (eval2?.success) {
        evaluacion2 = eval2.data;
        const diferencia = Math.abs(eval1.data.puntaje - eval2.data.puntaje);
        if (diferencia > 1) {
          revisionRequerida = true;
          // Se usa el MENOR de los dos puntajes.
          evaluacionReportada =
            eval1.data.puntaje <= eval2.data.puntaje ? eval1.data : eval2.data;
        } else {
          acuerdoEvaluadores = true;
        }
      } else {
        // El segundo evaluador falló o devolvió formato inválido: se reporta el
        // primero y se marca para revisión (no se descarta la evaluación válida).
        revisionRequerida = true;
        if (raw2 !== null) console.error("[evaluar] Invalid AI response format (evaluador 2):", raw2);
      }
    }

    return NextResponse.json(
      {
        estado: "evaluado",
        pertinente: true,
        evaluacion: evaluacionReportada,
        evaluacion2,
        revision_requerida: revisionRequerida,
        acuerdo_evaluadores: acuerdoEvaluadores,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[evaluar] Unexpected error:", err);
    return NextResponse.json(
      { estado: "error", mensaje: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
