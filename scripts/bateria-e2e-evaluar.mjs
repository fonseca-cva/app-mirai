// Batería E2E de /api/evaluar contra el mock de proveedor IA (scripts/mock-proveedor-ia.mjs).
// Casos: válido, POBRE (revisión), DESACUERDO (revisión), ARBITRARIO (no pertinente),
// copia literal, texto corto (400) y rate limit (429).
// Uso: BASE_URL=http://localhost:3000 node scripts/bateria-e2e-evaluar.mjs
import { randomUUID } from "node:crypto";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const ENDPOINT = `${BASE}/api/evaluar`;

let pasaron = 0;
const fallos = [];

function ok(nombre) {
  pasaron++;
  console.log(`  ✅ ${nombre}`);
}
function falla(nombre, detalle) {
  fallos.push({ nombre, detalle });
  console.error(`  ❌ ${nombre}: ${detalle}`);
}

function assert(cond, nombre, detalle) {
  if (cond) ok(nombre);
  else falla(nombre, detalle);
}

async function evaluar(sessionId, payload) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, ...payload }),
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

// Textos de prueba (>= 120 chars, sin copiar estímulos, con marcadores del mock).
const textoValido = `El texto explica que la minería del cobre aporta cerca del diez por ciento del producto interno bruto y que se concentra en el norte del país. También menciona que esta actividad genera impactos ambientales importantes, como el consumo de agua y la modificación del paisaje. Yo creo que el uso de agua de mar desalinizada y de energías renovables muestra un avance positivo, aunque todavía falta equilibrar la productividad con el cuidado del medio ambiente.`;
const textoPobre = `El dilema plantea si la educación universitaria debería ser gratuita para todos los estudiantes, sin importar sus ingresos. Me parece que es una discusión relevante porque el acceso a la educación superior define oportunidades futuras. Una argumentación POBRE se limitaría a repetir la pregunta, mientras que una buena respuesta debería considerar el financiamiento, la calidad y la equidad. Por eso creo que la gratuidad debería evaluarse junto con políticas que aseguren calidad académica.`;
const textoDesacuerdo = `La consigna pide escribir una historia sobre el intercambio de colores. Mi relato trata de una persona que se despierta y descubre que el cielo ahora es verde y el pasto es azul. El DESACUERDO aparece cuando sus vecinos discuten si ese cambio es real o un sueño colectivo, y mientras unos se adaptan con humor, otros se niegan a salir de sus casas. Al final deciden convivir con la nueva paleta.`;
const textoArbitrario = `El texto trata sobre la producción de cobre en Chile y sus impactos ambientales. Mi respuesta es completamente ARBITRARIO en el sentido de que no sigue una línea clara: menciono colores, números de la suerte y recuerdos de vacaciones sin relación con la consigna ni con la lectura, solo para demostrar que un evaluador debería detectar la falta de pertinencia y no otorgar puntaje.`;
const textoCorto = "Respuesta muy breve.";

async function main() {
  console.log(`Batería E2E /api/evaluar → ${ENDPOINT}\n`);

  // ── 1. Respuesta válida (comprensión, sin marcadores) ──
  {
    const { status, body } = await evaluar(randomUUID(), {
      tarea: "comprension",
      texto: textoValido,
      indiceTexto: 0,
    });
    assert(status === 200, "1. Válida → 200", `status=${status}`);
    assert(body?.estado === "evaluado", "1. Válida → estado 'evaluado'", JSON.stringify(body));
    assert(body?.pertinente === true, "1. Válida → pertinente true", JSON.stringify(body));
    assert(body?.evaluacion?.puntaje === 4, "1. Válida → puntaje 4 (principal)", `puntaje=${body?.evaluacion?.puntaje}`);
    assert(body?.revision_requerida === false, "1. Válida → sin revisión", `revision=${body?.revision_requerida}`);
    assert(body?.acuerdo_evaluadores === true, "1. Válida → acuerdo evaluadores", `acuerdo=${body?.acuerdo_evaluadores}`);
    assert(body?.evaluacion2?.puntaje === 5, "1. Válida → secundario 5", `secundario=${body?.evaluacion2?.puntaje}`);
  }

  // ── 2. Marcador POBRE → principal 2, secundario 5 → revisión, se reporta el menor ──
  {
    const { status, body } = await evaluar(randomUUID(), {
      tarea: "argumentacion",
      texto: textoPobre,
      indiceDilema: 0,
    });
    assert(status === 200 && body?.estado === "evaluado", "2. POBRE → evaluado", `status=${status} body=${JSON.stringify(body)}`);
    assert(body?.evaluacion?.puntaje === 2, "2. POBRE → puntaje reportado 2 (menor)", `puntaje=${body?.evaluacion?.puntaje}`);
    assert(body?.evaluacion2?.puntaje === 5, "2. POBRE → secundario 5", `secundario=${body?.evaluacion2?.puntaje}`);
    assert(body?.revision_requerida === true, "2. POBRE → revision_requerida true", `revision=${body?.revision_requerida}`);
    assert(body?.acuerdo_evaluadores === false, "2. POBRE → acuerdo false", `acuerdo=${body?.acuerdo_evaluadores}`);
  }

  // ── 3. Marcador DESACUERDO → principal 4, secundario 2 → revisión, se reporta el menor ──
  {
    const { status, body } = await evaluar(randomUUID(), {
      tarea: "expresion",
      texto: textoDesacuerdo,
      indiceExpresion: 0,
    });
    assert(status === 200 && body?.estado === "evaluado", "3. DESACUERDO → evaluado", `status=${status} body=${JSON.stringify(body)}`);
    assert(body?.evaluacion?.puntaje === 2, "3. DESACUERDO → puntaje reportado 2 (menor)", `puntaje=${body?.evaluacion?.puntaje}`);
    assert(body?.evaluacion2?.puntaje === 2, "3. DESACUERDO → secundario 2", `secundario=${body?.evaluacion2?.puntaje}`);
    assert(body?.revision_requerida === true, "3. DESACUERDO → revision_requerida true", `revision=${body?.revision_requerida}`);
    assert(body?.acuerdo_evaluadores === false, "3. DESACUERDO → acuerdo false", `acuerdo=${body?.acuerdo_evaluadores}`);
  }

  // ── 4. Marcador ARBITRARIO → no pertinente, sin puntaje ──
  {
    const { status, body } = await evaluar(randomUUID(), {
      tarea: "comprension",
      texto: textoArbitrario,
      indiceTexto: 0,
    });
    assert(status === 200, "4. ARBITRARIO → 200", `status=${status}`);
    assert(body?.estado === "no_pertinente", "4. ARBITRARIO → estado 'no_pertinente'", JSON.stringify(body));
    assert(body?.razon && body.razon !== "copia_literal", "4. ARBITRARIO → razón de pertinencia (no copia)", `razon=${body?.razon}`);
  }

  // ── 5. Copia literal del estímulo → rechazo sin llamar al modelo ──
  {
    const estimulo = `En Chile, la producción de cobre representa aproximadamente el 10% del PIB nacional. La minería se concentra principalmente en el norte del país, en regiones como Antofagasta y Tarapacá. Grandes empresas estatales y privadas operan yacimientos que extraen el mineral desde hace más de un siglo. Sin embargo, la actividad minera también genera impactos ambientales significativos: consumo intensivo de agua, modificación del paisaje y emisiones de material particulado. En los últimos años, se han implementado tecnologías para reducir el consumo de agua fresca, como el uso de agua de mar desalinizada. Además, algunas faenas han comenzado a utilizar energías renovables para sus operaciones. La minería del cobre sigue siendo un pilar de la economía chilena, pero enfrenta el desafío de equilibrar productividad con sostenibilidad ambiental.`;
    const { status, body } = await evaluar(randomUUID(), {
      tarea: "comprension",
      texto: estimulo, // copia exacta del estímulo 0
      indiceTexto: 0,
    });
    assert(status === 200, "5. Copia literal → 200", `status=${status}`);
    assert(body?.estado === "no_pertinente", "5. Copia literal → estado 'no_pertinente'", JSON.stringify(body));
    assert(body?.razon === "copia_literal", "5. Copia literal → razon 'copia_literal'", `razon=${body?.razon}`);
  }

  // ── 6. Texto corto (< 120 chars) → 400 ──
  {
    const { status, body } = await evaluar(randomUUID(), {
      tarea: "expresion",
      texto: textoCorto,
      indiceExpresion: 0,
    });
    assert(status === 400, "6. Texto corto → 400", `status=${status} body=${JSON.stringify(body)}`);
  }

  // ── 7. Rate limit: 9 llamadas OK por sesión, la 10ma → 429 ──
  {
    const sid = randomUUID();
    let novenaOk = true;
    for (let i = 1; i <= 9; i++) {
      const { status } = await evaluar(sid, {
        tarea: "comprension",
        texto: textoValido,
        indiceTexto: 0,
      });
      if (status !== 200) {
        novenaOk = false;
        falla(`7. Rate limit → llamada ${i} esperaba 200`, `status=${status}`);
        break;
      }
    }
    if (novenaOk) ok("7. Rate limit → 9 llamadas OK (200)");
    const { status, body } = await evaluar(sid, {
      tarea: "comprension",
      texto: textoValido,
      indiceTexto: 0,
    });
    assert(status === 429, "7. Rate limit → llamada 10 = 429", `status=${status} body=${JSON.stringify(body)}`);
  }

  console.log(`\nResultado: ${pasaron} checks OK, ${fallos.length} fallos`);
  if (fallos.length) {
    console.error("\nFallos:");
    for (const f of fallos) console.error(`  - ${f.nombre}: ${f.detalle}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Error fatal en la batería:", err);
  process.exit(2);
});
