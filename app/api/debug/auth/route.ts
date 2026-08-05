// POST /api/debug/auth — autentica la herramienta de diagnóstico con la clave
// simple (DEBUG_KEY). NUNCA se loguea ni se devuelve la clave; la cookie lleva
// un hash httpOnly de 8 horas.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  DEBUG_COOKIE,
  DEBUG_COOKIE_MAX_AGE,
  debugKeyConfigurada,
  hashClave,
} from "@/lib/debug";

const Schema = z.object({ clave: z.string().min(1).max(200) });

export async function POST(request: NextRequest) {
  if (!debugKeyConfigurada()) {
    return NextResponse.json({ error: "DEBUG_KEY no configurada" }, { status: 503 });
  }

  const parsed = Schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { clave } = parsed.data;
  if (clave !== process.env.DEBUG_KEY) {
    return NextResponse.json({ error: "Clave incorrecta" }, { status: 401 });
  }

  const respuesta = NextResponse.json({ ok: true }, { status: 200 });
  respuesta.cookies.set(DEBUG_COOKIE, hashClave(clave), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DEBUG_COOKIE_MAX_AGE,
  });
  return respuesta;
}
