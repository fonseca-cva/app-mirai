// MOCK del proveedor de IA para pruebas end-to-end de /api/evaluar (QA local).
// NO es un LLM: devuelve respuestas deterministas según marcadores en el texto
// del estudiante, para ejercitar la LÓGICA del pipeline de validez.
// Uso: node scripts/mock-proveedor-ia.mjs (puerto 8787 por defecto).
import http from "node:http";
import fs from "node:fs";

const PUERTO = Number(process.env.PORT ?? 8787);
const LOG = process.env.MOCK_LOG ?? "/tmp/mirai-mock.log";

function log(entry) {
  fs.appendFileSync(LOG, JSON.stringify(entry) + "\n");
}

const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    let payload = {};
    try {
      payload = JSON.parse(body || "{}");
    } catch {
      /* noop */
    }
    const prompt = (payload.messages ?? []).map((m) => m.content ?? "").join("\n");
    const esPertinencia = prompt.includes("control de calidad de un test vocacional");
    const segundoEvaluador = req.url.includes("groq") || (payload.model ?? "").includes("secundario");
    const textoEstudiante = prompt.split("RESPUESTA DEL ESTUDIANTE:")[1] ?? prompt.split("ARGUMENTACIÓN DEL ESTUDIANTE:")[1] ?? prompt;

    log({ ruta: req.url, model: payload.model, esPertinencia, segundoEvaluador, promptLength: prompt.length });

    let content;
    if (esPertinencia) {
      const pertinente = !textoEstudiante.includes("ARBITRARIO");
      content = JSON.stringify({
        pertinente,
        razon: pertinente ? "La respuesta alude al estímulo." : "Texto arbitrario sin relación con la consigna.",
      });
    } else {
      // Evaluador principal: 4 salvo marcador POBRE (2). Evaluador secundario:
      // 2 si hay DESACUERDO, 5 en el resto.
      const puntaje = segundoEvaluador ? (textoEstudiante.includes("DESACUERDO") ? 2 : 5) : textoEstudiante.includes("POBRE") ? 2 : 4;
      content = JSON.stringify({
        nivel: puntaje >= 4 ? "inferencial" : "literal",
        puntaje,
        fortaleza: "Estructura clara.",
        area_mejora: "Podría agregar evidencia concreta.",
      });
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ choices: [{ message: { role: "assistant", content } }] }));
  });
});

server.listen(PUERTO, () => {
  console.log(`Mock IA escuchando en :${PUERTO} (log: ${LOG})`);
});
