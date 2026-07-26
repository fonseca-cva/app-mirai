// POST /api/evaluar — Evalúa respuestas del Bloque Verbal usando IA.
// Sección 4 de la spec: la clave del proveedor vive SOLO en variable de entorno del servidor.
// // LIMITACIÓN: rate limit en Map-en-memoria se resetea en cada cold start de Vercel.
// // PENDIENTE: migrar a rate limit persistente (Upstash/BetterStack) si hay carga real.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { EvaluacionSchema, promptComprension, promptArgumentacion, TEXTOS_COMPRENSION, DILEMAS_ARGUMENTACION, RATE_LIMIT_POR_SESSION } from "@/lib/config/rubricas";

// ── Rate limiter en memoria ───────────────────────────────────────
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
  tarea: z.enum(["comprension", "argumentacion"]),
  texto: z.string().min(1).max(3000),
  indiceTexto: z.number().int().min(0).optional(), // para comprensión: índice del texto base
  indiceDilema: z.number().int().min(0).optional(), // para argumentación: índice del dilema
});

// ── Proveedor de IA (OpenRouter-compatible) ───────────────────────
// Se configura con variable de entorno. Fallback: si no hay clave, responde simulado.
const PROVEEDOR_URL = process.env.AI_PROVIDER_URL ?? "https://openrouter.ai/api/v1/chat/completions";
const API_KEY = process.env.AI_API_KEY ?? "";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function llamarIA(prompt: string): Promise<string | null> {
  if (!API_KEY) {
    // Sin clave configurada: responder simulado para desarrollo.
    // // DECISIÓN: en desarrollo se puede probar el flujo sin llamar a la API real.
    return JSON.stringify({
      nivel: "inferencial",
      puntaje: 3,
      fortaleza: "Logra conectar ideas principales del texto.",
      area_mejora: "Podría profundizar en el análisis crítico y respaldar con ejemplos concretos.",
    });
  }

  const messages: ChatMessage[] = [
    { role: "system", content: "Eres un evaluador vocacional. Evalúas estructura y comprensión, nunca la opinión del estudiante. Respondes solo en JSON según el esquema indicado." },
    { role: "user", content: prompt },
  ];

  try {
    const respuesta = await fetch(PROVEEDOR_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL ?? "openai/gpt-4o-mini",
        messages,
        temperature: 0.3, // baja para consistencia en evaluación
        max_tokens: 400,
      }),
      signal: AbortSignal.timeout(15000), // 15s máximo (spec sección 4)
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

    const { sessionId, tarea, texto, indiceTexto, indiceDilema } = parsed.data;

    // Rate limit
    if (!checkRateLimit(sessionId)) {
      return NextResponse.json(
        { error: "Límite de evaluaciones alcanzado para esta sesión. Intenta más tarde." },
        { status: 429 }
      );
    }

    // Construir prompt según la tarea
    const prompt =
      tarea === "comprension"
        ? promptComprension(TEXTOS_COMPRENSION[indiceTexto ?? 0])
        : promptArgumentacion(DILEMAS_ARGUMENTACION[indiceDilema ?? 0]);

    const promptCompleto = prompt + "\n\n" + texto;

    // Llamar a la IA
    const raw = await llamarIA(promptCompleto);

    if (!raw) {
      return NextResponse.json(
        { estado: "pendiente", mensaje: "No se pudo evaluar en este momento. Intenta de nuevo más tarde." },
        { status: 200 } // 200, no 500: el flujo no se bloquea (spec sección 4)
      );
    }

    // Extraer JSON de la respuesta (puede venir con markdown ```json ... ```)
    const jsonStr = raw.replace(/```json\s*/gi, "").replace(/```\s*$/gi, "").trim();
    const evaluacion = EvaluacionSchema.safeParse(JSON.parse(jsonStr));

    if (!evaluacion.success) {
      console.error("[evaluar] Invalid AI response format:", raw);
      return NextResponse.json(
        { estado: "pendiente", mensaje: "Formato de evaluación inválido. Reintentando..." },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { estado: "evaluado", evaluacion: evaluacion.data },
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
