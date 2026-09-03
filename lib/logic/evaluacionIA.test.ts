// Test pedido por Camilo tras el fix del evaluador secundario (Groq,
// llama-3.3-70b-versatile deprecado → openai/gpt-oss-120b): confirmar CON UN
// TEST, no por lectura, que si el evaluador secundario falla (clave inválida
// o URL inexistente) la cadena igual queda 'evaluado' con el puntaje del
// evaluador principal, marcando acuerdo_no_disponible: true.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ejecutarCadenaVerbal } from "@/lib/logic/evaluacionIA";

const ESTIMULO =
  "La ciudad de Valdivia enfrenta un dilema: reconstruir el puente histórico dañado por el terremoto respetando su diseño original, o levantar uno nuevo más resistente pero sin valor patrimonial.";

const TEXTO_ESTUDIANTE =
  "Creo que Valdivia debería priorizar la seguridad de las personas por sobre la nostalgia. El texto menciona que el puente original ya falló una vez con el terremoto, así que insistir en la misma estructura es arriesgar que vuelva a pasar. Se podría buscar un diseño nuevo que rescate algunos elementos visuales del original, como el color o la forma de los arcos, sin repetir la misma ingeniería que ya demostró ser insuficiente.";

function respuestaOk(body: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

function contentEvaluacion(puntaje: number) {
  return JSON.stringify({
    nivel: "inferencial",
    puntaje,
    fortaleza: "Usa evidencia concreta del estímulo.",
    area_mejora: "Podría profundizar la comparación de costos.",
  });
}

const CONTENT_PERTINENTE = JSON.stringify({ pertinente: true, razon: "Responde directamente al dilema planteado." });

describe("ejecutarCadenaVerbal — caída del evaluador secundario", () => {
  beforeEach(() => {
    vi.stubEnv("AI_API_KEY", "clave-principal-valida");
    vi.stubEnv("AI_PROVIDER_URL", "https://api.deepseek.com/chat/completions");
    vi.stubEnv("AI_MODEL", "deepseek-chat");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("clave inválida en el secundario (401) → queda evaluado con el principal y acuerdo_no_disponible=true", async () => {
    vi.stubEnv("AI_API_KEY_2", "clave-invalida-truncada");
    vi.stubEnv("AI_PROVIDER_URL_2", "https://api.groq.com/openai/v1/chat/completions");
    vi.stubEnv("AI_MODEL_2", "openai/gpt-oss-120b");

    const fetchMock = vi.fn();
    fetchMock
      .mockResolvedValueOnce(respuestaOk({ choices: [{ message: { content: CONTENT_PERTINENTE } }] })) // pertinencia (principal)
      .mockResolvedValueOnce(respuestaOk({ choices: [{ message: { content: contentEvaluacion(4) } }] })) // evaluador_1 (principal)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ error: { message: "Invalid API Key", code: "invalid_api_key" } }),
      }); // evaluador_2 (secundario, Groq) — clave inválida
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await ejecutarCadenaVerbal({
      sessionId: "test-caida-secundario-401",
      tarea: "comprension",
      estimulo: ESTIMULO,
      texto: TEXTO_ESTUDIANTE,
    });

    expect(resultado.estado).toBe("evaluado");
    expect(resultado.acuerdo_no_disponible).toBe(true);
    expect(resultado.revision_requerida).toBe(true);
    expect(resultado.acuerdo_evaluadores).toBe(false);
    expect(resultado.evaluacion2).toBeNull();
    expect(resultado.evaluacion).toEqual({
      nivel: "inferencial",
      puntaje: 4,
      fortaleza: "Usa evidencia concreta del estímulo.",
      area_mejora: "Podría profundizar la comparación de costos.",
    });
    const pasoSecundario = resultado.pasos.find((p) => p.paso === "evaluador_2");
    expect(pasoSecundario?.ok).toBe(false);
    expect(pasoSecundario?.status).toBe(401);
  });

  it("URL inexistente en el secundario (fetch lanza excepción de red) → mismo resultado, evaluado con el principal", async () => {
    vi.stubEnv("AI_API_KEY_2", "clave-secundaria-cualquiera");
    vi.stubEnv("AI_PROVIDER_URL_2", "https://dominio-que-no-existe.invalid/v1/chat/completions");
    vi.stubEnv("AI_MODEL_2", "openai/gpt-oss-120b");

    const fetchMock = vi.fn();
    fetchMock
      .mockResolvedValueOnce(respuestaOk({ choices: [{ message: { content: CONTENT_PERTINENTE } }] })) // pertinencia
      .mockResolvedValueOnce(respuestaOk({ choices: [{ message: { content: contentEvaluacion(3) } }] })) // evaluador_1
      .mockRejectedValueOnce(new Error("fetch failed: getaddrinfo ENOTFOUND dominio-que-no-existe.invalid")); // evaluador_2
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await ejecutarCadenaVerbal({
      sessionId: "test-caida-secundario-red",
      tarea: "comprension",
      estimulo: ESTIMULO,
      texto: TEXTO_ESTUDIANTE,
    });

    expect(resultado.estado).toBe("evaluado");
    expect(resultado.acuerdo_no_disponible).toBe(true);
    expect(resultado.revision_requerida).toBe(true);
    expect(resultado.evaluacion2).toBeNull();
    expect(resultado.evaluacion?.puntaje).toBe(3);
    const pasoSecundario = resultado.pasos.find((p) => p.paso === "evaluador_2");
    expect(pasoSecundario?.ok).toBe(false);
    expect(pasoSecundario?.status).toBeNull();
    expect(pasoSecundario?.error).toContain("ENOTFOUND");
  });

  it("control: si AMBOS evaluadores responden y concuerdan, acuerdo_no_disponible=false", async () => {
    vi.stubEnv("AI_API_KEY_2", "clave-secundaria-valida");
    vi.stubEnv("AI_PROVIDER_URL_2", "https://api.groq.com/openai/v1/chat/completions");
    vi.stubEnv("AI_MODEL_2", "openai/gpt-oss-120b");

    const fetchMock = vi.fn();
    fetchMock
      .mockResolvedValueOnce(respuestaOk({ choices: [{ message: { content: CONTENT_PERTINENTE } }] }))
      .mockResolvedValueOnce(respuestaOk({ choices: [{ message: { content: contentEvaluacion(4) } }] }))
      .mockResolvedValueOnce(respuestaOk({ choices: [{ message: { content: contentEvaluacion(4) } }] }));
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await ejecutarCadenaVerbal({
      sessionId: "test-control-ambos-ok",
      tarea: "comprension",
      estimulo: ESTIMULO,
      texto: TEXTO_ESTUDIANTE,
    });

    expect(resultado.estado).toBe("evaluado");
    expect(resultado.acuerdo_no_disponible).toBe(false);
    expect(resultado.acuerdo_evaluadores).toBe(true);
    expect(resultado.revision_requerida).toBe(false);
  });
});
