// POST /api/enviar-informe — ELIMINADO en Tanda B.
//
// Este endpoint enviaba el resumen breve del informe por correo. Camilo pidió
// reemplazarlo por un correo corto que lleve al informe permanente
// (/informe/[token]): el nuevo endpoint es /api/enviar-informe-permanente.
// Se deja este stub 410 para que cualquier llamada vieja (o cliente desactualizado)
// reciba una respuesta honesta en vez de un 404 o un envío fantasma.

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Este endpoint fue reemplazado por /api/enviar-informe-permanente" },
    { status: 410 }
  );
}
