// Test de regresión (mismo bug reportado por Camilo, 2026-09-09, cubriendo la
// SEGUNDA ruta): confirma que /api/evaluar también evalúa contra el estímulo que
// corresponde a los índices recibidos — la ruta que persiste en producción — y no
// solo /api/debug/evaluar. Ambas rutas comparten la misma función
// (estimuloVerbalDe, lib/logic/verbal.ts), así que este test también protege
// contra que alguna de las dos vuelva a divergir de la otra.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { TEXTOS_COMPRENSION, DILEMAS_ARGUMENTACION, CONSIGNAS_EXPRESION } from "@/lib/config/rubricas";

const ejecutarCadenaVerbalMock = vi.fn();

vi.mock("@/lib/logic/evaluacionIA", () => ({
  ejecutarCadenaVerbal: (...args: unknown[]) => ejecutarCadenaVerbalMock(...args),
}));

function fakeRequest(body: unknown) {
  return {
    json: async () => body,
    headers: { get: () => null },
  } as unknown as import("next/server").NextRequest;
}

const SESSION_ID = "b3f1c2d4-aaaa-4bbb-8ccc-000000000001";
const TEXTO_VALIDO =
  "texto de prueba del estudiante, con más de ciento veinte caracteres para pasar cualquier validación mínima de longitud del bloque verbal.";

describe("/api/evaluar — el índice recibido decide el estímulo evaluado (mismo contrato que /api/debug/evaluar)", () => {
  beforeEach(() => {
    ejecutarCadenaVerbalMock.mockReset();
    ejecutarCadenaVerbalMock.mockResolvedValue({
      estado: "evaluado",
      mensaje: null,
      evaluacion: { nivel: "inferencial", puntaje: 4, fortaleza: "x", area_mejora: "y" },
      evaluacion2: null,
      acuerdo_evaluadores: true,
      revision_requerida: false,
      acuerdo_no_disponible: false,
    });
  });

  it("con indiceTexto=2 evalúa contra TEXTOS_COMPRENSION[2]", async () => {
    const { POST } = await import("@/app/api/evaluar/route");
    await POST(
      fakeRequest({
        sessionId: SESSION_ID,
        tarea: "comprension",
        texto: TEXTO_VALIDO,
        indiceTexto: 2,
      })
    );

    expect(ejecutarCadenaVerbalMock).toHaveBeenCalledTimes(1);
    const args = ejecutarCadenaVerbalMock.mock.calls[0][0];
    expect(args.estimulo).toBe(TEXTOS_COMPRENSION[2]);
  });

  it("con indiceDilema=1 evalúa el dilema correcto en argumentación", async () => {
    const { POST } = await import("@/app/api/evaluar/route");
    await POST(
      fakeRequest({
        sessionId: SESSION_ID,
        tarea: "argumentacion",
        texto: TEXTO_VALIDO,
        indiceDilema: 1,
      })
    );

    const args = ejecutarCadenaVerbalMock.mock.calls[0][0];
    expect(args.estimulo).toBe(DILEMAS_ARGUMENTACION[1]);
  });

  it("con indiceExpresion=2 evalúa la consigna correcta en expresión", async () => {
    const { POST } = await import("@/app/api/evaluar/route");
    await POST(
      fakeRequest({
        sessionId: SESSION_ID,
        tarea: "expresion",
        texto: TEXTO_VALIDO,
        indiceExpresion: 2,
      })
    );

    const args = ejecutarCadenaVerbalMock.mock.calls[0][0];
    expect(args.estimulo).toBe(CONSIGNAS_EXPRESION[2]);
  });
});
