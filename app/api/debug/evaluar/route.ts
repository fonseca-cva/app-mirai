// POST /api/debug/evaluar — campo de prueba de la cadena de evaluación verbal
// (punto 11). Corre la MISMA cadena que producción (lib/logic/evaluacionIA.ts)
// y devuelve el JSON de cada paso (pertinencia, evaluador 1, evaluador 2,
// acuerdo), el payload EXACTO enviado a cada proveedor (vista de anonimización)
// y los marcadores de datos personales detectados.
//
//   { modo: "cadena", texto: "..." }  → una cadena completa
//   { modo: "carga", cargaN?: number } → N cadenas en paralelo (default 30,
//     prueba de carga anotada por Camilo: detecta 429 del proveedor bajo carga)
//
// Cada corrida usa un sessionId aleatorio: no toca el rate limit real.

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { debugAutenticado } from "@/lib/debug";
import { ejecutarCadenaVerbal } from "@/lib/logic/evaluacionIA";
import type { TareaVerbal } from "@/lib/logic/evaluacionIA";
import { TEXTOS_COMPRENSION, DILEMAS_ARGUMENTACION, CONSIGNAS_EXPRESION } from "@/lib/config/rubricas";
import { sanitizarTextoEstudiante } from "@/lib/anonimizacion";

const Schema = z.object({
  modo: z.enum(["cadena", "carga"]).default("cadena"),
  texto: z.string().max(3000).optional(),
  tarea: z.enum(["comprension", "argumentacion", "expresion"]).default("comprension"),
  cargaN: z.number().int().min(1).max(60).optional(),
});

const DEMO_PII =
  "Hola, soy Juan Pérez. Mi RUT es 12.345.678-9 y mi correo es juan.perez@correo.cl. Mi teléfono es +56 9 1234 5678 y el sitio es www.ejemplo.cl. Creo que el texto muestra que la tecnología cambió la forma de estudiar: antes dependíamos de bibliotecas físicas y hoy el acceso es inmediato, pero también hay que aprender a filtrar información confiable.";

function estimuloDe(tarea: TareaVerbal): string {
  if (tarea === "comprension") return TEXTOS_COMPRENSION[0];
  if (tarea === "argumentacion") return DILEMAS_ARGUMENTACION[0];
  return CONSIGNAS_EXPRESION[0];
}

export async function POST(request: NextRequest) {
  if (!(await debugAutenticado())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = Schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalle: parsed.error.issues }, { status: 400 });
  }

  const { modo, tarea, cargaN } = parsed.data;
  const texto = parsed.data.texto ?? DEMO_PII;
  const estimulo = estimuloDe(tarea);

  if (modo === "carga") {
    const n = cargaN ?? 30;
    const inicio = Date.now();
    const corridas = Array.from({ length: n }, () =>
      ejecutarCadenaVerbal({
        sessionId: randomUUID(),
        tarea,
        estimulo,
        texto,
      })
    );
    const resultados = await Promise.allSettled(corridas);

    let evaluado = 0;
    let noPertinente = 0;
    let noEvaluado = 0;
    let errores = 0;
    let status429 = 0;
    const fallas: Array<{ sessionId: string; paso: string; status: number | null; error: string | null }> = [];

    resultados.forEach((r, i) => {
      if (r.status === "rejected") {
        errores++;
        return;
      }
      const res = r.value;
      if (res.estado === "evaluado") evaluado++;
      else if (res.estado === "no_pertinente") noPertinente++;
      else noEvaluado++;

      for (const paso of res.pasos) {
        if (paso.status === 429) status429++;
        if (!paso.ok) {
          fallas.push({ sessionId: `#${i + 1}`, paso: paso.paso, status: paso.status, error: paso.error?.slice(0, 300) ?? null });
        }
      }
    });

    const ms = Date.now() - inicio;
    console.log(`[debug/evaluar] carga n=${n} ms=${ms} evaluado=${evaluado} no_pertinente=${noPertinente} no_evaluado=${noEvaluado} 429=${status429}`);
    return NextResponse.json(
      {
        modo: "carga",
        n,
        duracionMs: ms,
        distribucion: { evaluado, no_pertinente: noPertinente, no_evaluado: noEvaluado, errores },
        status429,
        fallas: fallas.slice(0, 20),
        proveedorInfo: resultados.find((r) => r.status === "fulfilled")?.value?.proveedorInfo ?? null,
      },
      { status: 200 }
    );
  }

  const resultado = await ejecutarCadenaVerbal({
    sessionId: randomUUID(),
    tarea,
    estimulo,
    texto,
  });

  // Vista de anonimización: lo que se envió + lo que se detectó/limpió.
  const anonimizacion = sanitizarTextoEstudiante(texto);

  return NextResponse.json(
    {
      modo: "cadena",
      estado: resultado.estado,
      mensaje: resultado.mensaje,
      evaluacion: resultado.evaluacion ?? null,
      evaluacion2: resultado.evaluacion2 ?? null,
      acuerdo_evaluadores: resultado.acuerdo_evaluadores,
      revision_requerida: resultado.revision_requerida,
      acuerdo_no_disponible: resultado.acuerdo_no_disponible,
      proveedorInfo: resultado.proveedorInfo,
      anonimizacion: {
        marcadores: anonimizacion.marcadores,
        textoOriginal: texto,
        textoLimpio: resultado.textoLimpio,
      },
      pasos: resultado.pasos,
    },
    { status: 200 }
  );
}
