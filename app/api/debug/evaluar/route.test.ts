// Test de regresión (bug reportado por Camilo, 2026-09-09): esta ruta evaluaba
// SIEMPRE contra el estímulo [0], sin importar qué índice mostraba BloqueVerbal.tsx
// al alumno. Verifica, contra el handler REAL (no una copia leída), que el
// estímulo que recibe ejecutarCadenaVerbal es el que corresponde a los índices que
// manda el cliente — igual que /api/evaluar.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createHash } from "node:crypto";
import { TEXTOS_COMPRENSION, DILEMAS_ARGUMENTACION, CONSIGNAS_EXPRESION } from "@/lib/config/rubricas";

const DEBUG_KEY = "clave-de-prueba-2026";
const COOKIE_VALIDA = createHash("sha256").update(DEBUG_KEY).digest("hex");

const ejecutarCadenaVerbalMock = vi.fn();

vi.mock("@/lib/logic/evaluacionIA", () => ({
  ejecutarCadenaVerbal: (...args: unknown[]) => ejecutarCadenaVerbalMock(...args),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (nombre: string) =>
      nombre === "mirai_debug_auth" ? { value: COOKIE_VALIDA } : undefined,
  }),
}));

function fakeRequest(body: unknown) {
  return { json: async () => body } as unknown as import("next/server").NextRequest;
}

describe("/api/debug/evaluar — el índice recibido decide el estímulo evaluado", () => {
  beforeEach(() => {
    vi.stubEnv("DEBUG_KEY", DEBUG_KEY);
    ejecutarCadenaVerbalMock.mockReset();
    ejecutarCadenaVerbalMock.mockResolvedValue({
      estado: "evaluado",
      mensaje: null,
      evaluacion: { nivel: "inferencial", puntaje: 4, fortaleza: "x", area_mejora: "y" },
      evaluacion2: null,
      acuerdo_evaluadores: true,
      revision_requerida: false,
      acuerdo_no_disponible: false,
      proveedorInfo: null,
      textoLimpio: "texto",
      pasos: [],
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("con indiceTexto=2 evalúa contra TEXTOS_COMPRENSION[2], NO contra [0]", async () => {
    const { POST } = await import("@/app/api/debug/evaluar/route");
    await POST(
      fakeRequest({
        modo: "cadena",
        tarea: "comprension",
        texto: "texto de prueba del estudiante, con más de ciento veinte caracteres para pasar cualquier validación mínima.",
        indiceTexto: 2,
      })
    );

    expect(ejecutarCadenaVerbalMock).toHaveBeenCalledTimes(1);
    const args = ejecutarCadenaVerbalMock.mock.calls[0][0];
    expect(args.estimulo).toBe(TEXTOS_COMPRENSION[2]);
    expect(args.estimulo).not.toBe(TEXTOS_COMPRENSION[0]);
  });

  it("con indiceDilema=1 evalúa el dilema correcto en argumentación", async () => {
    const { POST } = await import("@/app/api/debug/evaluar/route");
    await POST(
      fakeRequest({
        modo: "cadena",
        tarea: "argumentacion",
        texto: "texto de prueba del estudiante, con más de ciento veinte caracteres para pasar cualquier validación mínima.",
        indiceDilema: 1,
      })
    );

    const args = ejecutarCadenaVerbalMock.mock.calls[0][0];
    expect(args.estimulo).toBe(DILEMAS_ARGUMENTACION[1]);
  });

  it("con indiceExpresion=2 evalúa la consigna correcta en expresión", async () => {
    const { POST } = await import("@/app/api/debug/evaluar/route");
    await POST(
      fakeRequest({
        modo: "cadena",
        tarea: "expresion",
        texto: "texto de prueba del estudiante, con más de ciento veinte caracteres para pasar cualquier validación mínima.",
        indiceExpresion: 2,
      })
    );

    const args = ejecutarCadenaVerbalMock.mock.calls[0][0];
    expect(args.estimulo).toBe(CONSIGNAS_EXPRESION[2]);
  });

  it("sin índice (compatibilidad hacia atrás) sigue cayendo en [0]", async () => {
    const { POST } = await import("@/app/api/debug/evaluar/route");
    await POST(
      fakeRequest({
        modo: "cadena",
        tarea: "comprension",
        texto: "texto de prueba del estudiante, con más de ciento veinte caracteres para pasar cualquier validación mínima.",
      })
    );

    const args = ejecutarCadenaVerbalMock.mock.calls[0][0];
    expect(args.estimulo).toBe(TEXTOS_COMPRENSION[0]);
  });
});
