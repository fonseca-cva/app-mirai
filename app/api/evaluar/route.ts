// POST /api/evaluar — Evalúa respuestas del Bloque Verbal usando IA.
// Sección 4 de la spec: la clave del proveedor vive SOLO en variable de entorno del servidor.
//
// VALIDEZ (plan de Camilo, entregas 1 y 2). Pipeline:
//   1. Validación de entrada (mínimo 120 caracteres, igual que el cliente).
//   2. ANONIMIZACIÓN obligatoria (requisito de Camilo): el texto del estudiante
//      pasa por sanitizarTextoEstudiante() ANTES de armar cualquier prompt.
//      Al proveedor viaja SOLO estímulo + rúbrica + texto anonimizado
//      (allowlist en lib/anonimizacion.ts). session_id/user_id/correo/apodo/
//      edad/curso jamás entran al prompt. El texto original se guarda en la
//      base sin alterar. Cada llamada loguea la LISTA de campos enviados.
//   3. Rechazo de copia literal (sin llamar al modelo).
//   4. Filtro de pertinencia (modelo principal) — gate serial.
//   5. Rúbrica anclada 1-5: evaluador 1 (DeepSeek) y evaluador 2 (Groq, si
//      AI_API_KEY_2 existe) EN PARALELO. El segundo es OPCIONAL: si falta o
//      falla, se puntúa con el primero y se expone acuerdo_no_disponible: true
//      (un evaluador funcionando > ninguna evaluación).
//   6. NUNCA se inventa un puntaje: sin clave, fallo o formato inválido →
//      estado 'no_evaluado'.
//   7. REINTENTO ASÍNCRONO (punto 10): si la cadena falla y el cliente envió
//      respuestaId (fila insertada en 'pendiente'), se reintenta UNA vez en
//      segundo plano con after(). Si resuelve, se actualiza la fila vía RPC
//      actualizar_evaluacion_verbal y se completa el perfil_json del informe
//      (comunicacion + carrerasRecomendadas). El estudiante ya recibió su
//      informe: la dimensión se completa sola cuando la evaluación resuelve.
//
// POLÍTICA DE DATOS (DeepSeek + Groq): documentada en lib/logic/evaluacionIA.ts.

import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  RATE_LIMIT_POR_SESSION,
  TEXTOS_COMPRENSION,
  DILEMAS_ARGUMENTACION,
  CONSIGNAS_EXPRESION,
} from "@/lib/config/rubricas";
import { CARACTERES_MINIMOS } from "@/lib/logic/verbal";
import { ejecutarCadenaVerbal } from "@/lib/logic/evaluacionIA";
import type { TareaVerbal } from "@/lib/logic/evaluacionIA";
import { recalcularPerfilConComunicacion } from "@/lib/logic/perfilServidor";
import type { PerfilResultado } from "@/lib/supabase/types";
import type {
  Respuesta,
  RespuestaActividad,
  RespuestaAsignatura,
  Aspiracion,
} from "@/lib/logic/puntaje";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
  // Id de la fila respuestas_verbal insertada en 'pendiente' por el cliente
  // antes de evaluar: habilita el reintento asíncrono (punto 10).
  respuestaId: z.number().int().positive().optional(),
  // Telemetría de control de calidad (punto 4): SOLO metadato. No va al modelo,
  // no afecta el puntaje, no se muestra al usuario.
  pegado: z.boolean().optional(),
  caracteresPegados: z.number().int().min(0).optional(),
  intento: z.number().int().min(1).max(2).optional(),
});

// ── Reintento asíncrono (punto 10) ────────────────────────────────
const reintentosEnCurso = new Set<string>();

async function reintentarEvaluacion(opts: {
  sessionId: string;
  tarea: TareaVerbal;
  estimulo: string;
  texto: string;
  respuestaId: number;
  intento: number;
  authHeader: string | null;
}): Promise<void> {
  const clave = `${opts.sessionId}:${opts.tarea}:${opts.intento}:${opts.respuestaId}`;
  if (reintentosEnCurso.has(clave)) return;
  reintentosEnCurso.add(clave);

  try {
    const r = await ejecutarCadenaVerbal({
      sessionId: opts.sessionId,
      tarea: opts.tarea,
      estimulo: opts.estimulo,
      texto: opts.texto,
    });

    if (r.estado !== "evaluado" || !r.evaluacion) {
      console.log(
        `[evaluar] reintento sin resultado sessionId=${opts.sessionId} estado=${r.estado}`
      );
      return;
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !opts.authHeader) {
      console.warn(
        `[evaluar] reintento sin sesión para actualizar sessionId=${opts.sessionId} (authHeader ausente)`
      );
      return;
    }

    // Cliente as-user con el JWT capturado del request: RLS aplica normal.
    const cliente = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: opts.authHeader } },
    });

    // 1) Persistir la evaluación en la fila (RPC con verificación de propiedad
    //    y guarda de terminalidad: no pisa filas ya 'evaluado').
    const { data: filaOk, error: errFila } = await cliente.rpc(
      "actualizar_evaluacion_verbal",
      {
        p_id: opts.respuestaId,
        p_evaluacion_json: r.evaluacion,
        p_estado: "evaluado",
        p_revision_requerida: r.revision_requerida,
        p_acuerdo_no_disponible: r.acuerdo_no_disponible,
      }
    );
    if (errFila) {
      console.error(
        `[evaluar] reintento: RPC falló sessionId=${opts.sessionId} error=${errFila.message}`
      );
      return;
    }
    console.log(
      `[evaluar] reintento ok sessionId=${opts.sessionId} fila=${opts.respuestaId} actualizada=${filaOk}`
    );

    // 2) Completar el informe guardado (snapshot perfil_json): solo si quedó
    //    con comunicacion null (el reintento no pisa una evaluación posterior).
    const { data: filaResultado } = await cliente
      .from("resultados")
      .select("perfil_json")
      .eq("session_id", opts.sessionId)
      .maybeSingle();

    const perfilAnterior = filaResultado?.perfil_json as PerfilResultado | undefined;
    if (perfilAnterior && perfilAnterior.capacidades?.comunicacion == null) {
      const [gustos, actividades, asignaturas, aspiracion, cognitivo] =
        await Promise.all([
          cliente.from("respuestas_gustos").select("contexto_id, valor").eq("session_id", opts.sessionId),
          cliente.from("respuestas_actividades").select("actividad_id, valor").eq("session_id", opts.sessionId),
          cliente.from("respuestas_asignaturas").select("asignatura_id, valor").eq("session_id", opts.sessionId),
          cliente.from("aspiraciones").select("opcion, detalle").eq("session_id", opts.sessionId).maybeSingle(),
          cliente.from("respuestas_cognitivo").select("juego, correcto, nivel").eq("session_id", opts.sessionId),
        ]);

      const filas = {
        gustos: (gustos?.data ?? []).map((g): Respuesta => ({
          contextoId: g.contexto_id,
          valor: g.valor,
        })),
        actividades: (actividades?.data ?? []).map((a): RespuestaActividad => ({
          actividadId: a.actividad_id,
          valor: a.valor,
        })),
        asignaturas: (asignaturas?.data ?? []).map((a): RespuestaAsignatura => ({
          asignaturaId: a.asignatura_id,
          valor: a.valor,
        })),
        aspiracion: (aspiracion?.data as Aspiracion | null) ?? null,
        cognitivo: cognitivo?.data ?? [],
      };

      const perfilNuevo = recalcularPerfilConComunicacion(
        perfilAnterior,
        filas,
        Math.round((r.evaluacion.puntaje / 5) * 100)
      );

      const { error: errPerfil } = await cliente
        .from("resultados")
        .update({ perfil_json: perfilNuevo })
        .eq("session_id", opts.sessionId);

      if (errPerfil) {
        console.error(
          `[evaluar] reintento: perfil no actualizado sessionId=${opts.sessionId} error=${errPerfil.message}`
        );
      } else {
        console.log(
          `[evaluar] reintento: perfil completado sessionId=${opts.sessionId} comunicacion=${perfilNuevo.capacidades.comunicacion}`
        );
      }
    }
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : String(err);
    console.error(
      `[evaluar] reintento error sessionId=${opts.sessionId} error=${mensaje}`
    );
  } finally {
    reintentosEnCurso.delete(clave);
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

    // Cadena completa (anonimización → copia literal → pertinencia →
    // evaluador 1 + evaluador 2 en paralelo). Compartida con /debug.
    const resultado = await ejecutarCadenaVerbal({
      sessionId,
      tarea,
      estimulo,
      texto,
    });

    // Reintento asíncrono: solo cuando la cadena falló (no_evaluado) y el
    // cliente nos dio la fila 'pendiente' para completar.
    if (resultado.estado === "no_evaluado" && parsed.data.respuestaId) {
      const authHeader = request.headers.get("authorization");
      after(() => {
        void reintentarEvaluacion({
          sessionId,
          tarea,
          estimulo,
          texto,
          respuestaId: parsed.data.respuestaId as number,
          intento: parsed.data.intento ?? 1,
          authHeader,
        });
      });
    }

    if (resultado.estado === "evaluado") {
      return NextResponse.json(
        {
          estado: "evaluado",
          pertinente: true,
          evaluacion: resultado.evaluacion,
          evaluacion2: resultado.evaluacion2,
          revision_requerida: resultado.revision_requerida,
          acuerdo_evaluadores: resultado.acuerdo_evaluadores,
          acuerdo_no_disponible: resultado.acuerdo_no_disponible,
        },
        { status: 200 }
      );
    }

    if (resultado.estado === "no_pertinente") {
      return NextResponse.json(
        {
          estado: "no_pertinente",
          razon: resultado.razon,
          mensaje: resultado.mensaje,
        },
        { status: 200 }
      );
    }

    // no_evaluado: sin proveedor, fallo del proveedor o formato inválido.
    return NextResponse.json(
      { estado: "no_evaluado", mensaje: resultado.mensaje },
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
