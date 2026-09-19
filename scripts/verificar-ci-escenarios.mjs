#!/usr/bin/env node
// TABLA DE ESCENARIOS DEL WORKFLOW CI — validación de la lógica del gate.
//
// `actionlint` valida la SINTAXIS y las expresiones del workflow, pero no la
// SEMÁNTICA del gate: qué debería pasar en cada combinación de evento, rutas,
// secretos y resultado de calidad. Este script reproduce las condiciones tal como
// están escritas en .github/workflows/ci.yml y las comprueba contra los escenarios
// exigidos. Falla con exit ≠ 0 si alguna expectativa no se cumple.

import { readFileSync } from "node:fs";

const yml = readFileSync(".github/workflows/ci.yml", "utf8");

// ── Extrae las condiciones reales del YAML (no una copia a mano) ────────────
function extraerIf(job) {
  const re = new RegExp(`\\n  ${job}:\\n([\\s\\S]*?)(?=\\n  \\w[\\w-]*:\\n|$)`);
  const bloque = yml.match(re)?.[1] ?? "";
  const m = bloque.match(/\n    if: >-\n([\s\S]*?)\n    [a-z]/);
  if (m) return m[1].replace(/\n/g, " ").trim();
  const simple = bloque.match(/\n    if: (.+)/);
  return simple ? simple[1].trim() : null;
}

const IF_ESQUEMA = extraerIf("esquema");
const IF_RUTAS = extraerIf("rutas");
const IF_GATE = extraerIf("deploy-gate");

// ── Evaluador de las condiciones del workflow ──────────────────────────────
// Se evalúan las condiciones REALES (extraídas del YAML) con un contexto dado.
function evalExpresion(expr, ctx) {
  if (!expr) return true;
  let e = expr;
  // Reemplazos de las funciones/variables de GitHub Actions.
  e = e.replace(/!\s*cancelled\(\)/g, String(!ctx.cancelled));
  e = e.replace(/always\(\)/g, "true");
  e = e.replace(/github\.event_name/g, JSON.stringify(ctx.evento));
  e = e.replace(/github\.ref/g, JSON.stringify(ctx.ref));
  e = e.replace(/needs\.rutas\.outputs\.esquema_relevante/g, JSON.stringify(String(ctx.rutasRelevantes)));
  e = e.replace(/needs\.([a-zA-Z-]+)\.result/g, (_, job) => JSON.stringify(ctx.results[job] ?? "skipped"));
  e = e.replace(/needs\.esquema\.outputs\.modo/g, JSON.stringify(ctx.modoEsquema ?? ""));
  // `{{ }}` sobrantes de la sintaxis de expresiones
  e = e.replace(/\$\{\{|\}\}/g, "");
  return Boolean(new Function(`return (${e});`)());
}

// ── Simulación de un run completo ─────────────────────────────────────────
function simular({ nombre, evento, ref, rutasRelevantes, haySecretos, calidadPasa }) {
  const ctx = {
    evento,
    ref,
    rutasRelevantes,
    cancelled: false,
    results: {},
    modoEsquema: "",
  };

  // 1. `calidad` no tiene `if`: siempre corre.
  ctx.results.calidad = calidadPasa ? "success" : "failure";

  // 2. `rutas`: sin `if` en el YAML (corre siempre).
  const correRutas = evalExpresion(IF_RUTAS, ctx);
  ctx.results.rutas = correRutas ? "success" : "skipped";
  // La salida del filtro solo es fiable si el job corrió.
  if (!correRutas) ctx.rutasRelevantes = false;

  // 3. `esquema`
  const correEsquema = evalExpresion(IF_ESQUEMA, ctx);
  if (correEsquema) {
    ctx.modoEsquema = haySecretos ? "remoto" : "interno";
    // Con secretos el verificador corre estricto; sin secretos, el modo interno
    // solo existe para PR (en push sin secretos el paso falla explícitamente).
    if (haySecretos) {
      ctx.results.esquema = "success";
    } else if (evento === "pull_request") {
      ctx.results.esquema = "success"; // corre --sin-red y pasa
    } else {
      ctx.results.esquema = "failure"; // push sin secretos → falla explícita
    }
  } else {
    ctx.results.esquema = "skipped";
  }

  // 4. `deploy-gate`
  const correGate = evalExpresion(IF_GATE, ctx);
  let gate;
  if (!correGate) {
    gate = "no-ejecutado";
  } else {
    // Réplica exacta del script bash del gate.
    if (ctx.results.calidad !== "success") gate = "cerrado:calidad";
    else if (ctx.results.esquema === "skipped") {
      const esMain = evento === "push" && ref === "refs/heads/main";
      gate = esMain ? "cerrado:esquema-saltado-en-main" : "abierto:no-correspondia";
    } else if (ctx.results.esquema !== "success") gate = "cerrado:esquema-fallo";
    else if (ctx.modoEsquema === "interno") {
      const esMain = evento === "push" && ref === "refs/heads/main";
      gate = esMain ? "cerrado:interno-en-main" : "abierto:interno-no-acredita";
    } else gate = "abierto:verificado";
  }

  return { nombre, correEsquema, modo: ctx.modoEsquema || "-", gate };
}

// ── Escenarios exigidos ───────────────────────────────────────────────────
const escenarios = [
  {
    nombre: "PR interno relevante",
    caso: { evento: "pull_request", ref: "refs/pull/1/merge", rutasRelevantes: true, haySecretos: true, calidadPasa: true },
    esperado: { correEsquema: true, modo: "remoto", gate: "abierto:verificado" },
  },
  {
    nombre: "PR interno irrelevante",
    caso: { evento: "pull_request", ref: "refs/pull/2/merge", rutasRelevantes: false, haySecretos: true, calidadPasa: true },
    esperado: { correEsquema: false, modo: "-", gate: "abierto:no-correspondia" },
  },
  {
    nombre: "PR fork relevante SIN secretos",
    caso: { evento: "pull_request", ref: "refs/pull/3/merge", rutasRelevantes: true, haySecretos: false, calidadPasa: true },
    esperado: { correEsquema: true, modo: "interno", gate: "abierto:interno-no-acredita" },
  },
  {
    nombre: "PR fork irrelevante",
    caso: { evento: "pull_request", ref: "refs/pull/4/merge", rutasRelevantes: false, haySecretos: false, calidadPasa: true },
    esperado: { correEsquema: false, modo: "-", gate: "abierto:no-correspondia" },
  },
  {
    nombre: "push a main CON secretos",
    caso: { evento: "push", ref: "refs/heads/main", rutasRelevantes: false, haySecretos: true, calidadPasa: true },
    esperado: { correEsquema: true, modo: "remoto", gate: "abierto:verificado" },
  },
  {
    nombre: "push a main SIN secretos",
    caso: { evento: "push", ref: "refs/heads/main", rutasRelevantes: false, haySecretos: false, calidadPasa: true },
    esperado: { correEsquema: true, modo: "interno", gate: "cerrado:esquema-fallo" },
  },
  {
    nombre: "fallo de calidad (PR relevante)",
    caso: { evento: "pull_request", ref: "refs/pull/5/merge", rutasRelevantes: true, haySecretos: true, calidadPasa: false },
    esperado: { correEsquema: true, modo: "remoto", gate: "cerrado:calidad" },
  },
];

let fallas = 0;
console.log("═══ Tabla de escenarios del CI ═══\n");
console.log("Escenario".padEnd(32), "esquema".padEnd(9), "modo".padEnd(8), "gate");
console.log("-".repeat(80));

for (const { nombre, caso, esperado } of escenarios) {
  const r = simular({ nombre, ...caso });
  const okEsq = r.correEsquema === esperado.correEsquema;
  const okModo = r.modo === esperado.modo;
  const okGate = r.gate === esperado.gate;
  const ok = okEsq && okModo && okGate;
  if (!ok) fallas++;

  console.log(
    (ok ? "✅ " : "❌ ") + nombre.padEnd(29),
    String(r.correEsquema).padEnd(9),
    r.modo.padEnd(8),
    r.gate
  );
  if (!ok) {
    console.log(`     esperado: esquema=${esperado.correEsquema} modo=${esperado.modo} gate=${esperado.gate}`);
  }
}

console.log("\n═══ Resumen ═══");
if (fallas > 0) {
  console.log(`   ${fallas} escenario(s) NO cumplen lo esperado.`);
  process.exit(1);
}
console.log("   Todos los escenarios cumplen lo esperado.");
