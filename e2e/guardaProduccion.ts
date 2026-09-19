#!/usr/bin/env node
// GUARDA FAIL-CLOSED CONTRA PRODUCCIÓN — se ejecuta ANTES de chromium-real.
//
// Objetivo: que sea IMPOSIBLE que una prueba @real apunte al proyecto Supabase de
// producción por accidente. Corre como `globalSetup` del proyecto `chromium-real`,
// y si algo no cuadra, ABORTA la corrida (exit ≠ 0) en vez de continuar.
//
// Comprobaciones (todas obligatorias, ninguna "por defecto"):
//   1. E2E_ALLOW_REAL_BACKEND=1 — consentimiento explícito. Sin esto, no se corre.
//   2. E2E_SUPABASE_URL y E2E_SUPABASE_ANON_KEY presentes.
//   3. E2E_SUPABASE_URL NO coincide con la URL de producción del proyecto
//      (NEXT_PUBLIC_SUPABASE_URL de .env.local / .env.production.local / entorno).
//   4. E2E_SUPABASE_URL no apunta a un host conocido de producción.
//   5. La anon key no es la misma que la de producción (si se puede comparar).
//
// NUNCA imprime los valores de las claves; solo los compara.

import { existsSync, readFileSync } from "node:fs";

const ROJO = "\x1b[31m";
const VERDE = "\x1b[32m";
const AMARILLO = "\x1b[33m";
const RESET = "\x1b[0m";

/** Lee las variables de un .env sin pisar las ya presentes en el entorno. */
function leerEnv(ruta: string): Record<string, string> {
  const vars: Record<string, string> = {};
  if (!existsSync(ruta)) return vars;
  try {
    for (const linea of readFileSync(ruta, "utf8").split("\n")) {
      const l = linea.trim();
      if (!l || l.startsWith("#")) continue;
      const i = l.indexOf("=");
      if (i === -1) continue;
      let v = l.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      vars[l.slice(0, i).trim()] = v;
    }
  } catch {
    // Un archivo ilegible no debe impedir la comprobación: simplemente no aporta
    // candidatos de producción.
  }
  return vars;
}

/**
 * Extrae el project-ref de una URL de Supabase: el subdominio antes de
 * `.supabase.co`. Es lo que identifica al proyecto de forma inequívoca.
 * Devuelve null si la URL no tiene esa forma.
 */

/** Normaliza una URL para comparar (sin barra final, en minúsculas). */
function normalizar(url: string | undefined): string {
  if (!url) return "";
  return url.trim().replace(/\/+$/, "").toLowerCase();
}

/**
 * Hosts que NUNCA son de test. Es una lista de seguridad adicional a la
 * comparación con las credenciales locales: si alguien deja un .env mal puesto,
 * esto sigue bloqueando un dominio de producción conocido.
 */
/**
 * Devuelve el project-ref de una URL de Supabase (el subdominio antes de
 * `.supabase.co`), o null si la URL no tiene esa forma.
 * NUNCA devuelve la URL completa, para no filtrar nada al registrar.
 */
function projectRefDe(url: string): string | null {
  const host = (() => {
    try {
      return new URL(url).hostname.toLowerCase();
    } catch {
      return "";
    }
  })();
  if (!host) return null;
  const m = host.match(/^([a-z0-9-]+)\.supabase\.(co|in)$/);
  return m ? m[1] : null;
}

/**
 * Referencia PARCIAL de un project-ref, para poder registrarlo sin exponerlo
 * completo: primeros 6 caracteres + longitud. Suficiente para que el fundador
 * reconozca cuál es, insuficiente para reconstruirlo.
 */
function refRef(ref: string): string {
  return `${ref.slice(0, 6)}…(${ref.length})`;
}

const HOSTS_PROHIBIDOS = [
  "miraiapp.cl",
  "www.miraiapp.cl",
  "app.miraiapp.cl",
  // El proyecto de producción del piloto (identificado por su URL real en .env.local).
  "pecijaxsuef",
];

function abortar(razones: string[]): never {
  console.error(`\n${ROJO}✗ chromium-real ABORTADO — guarda de protección de producción${RESET}\n`);
  for (const r of razones) console.error(`  • ${r}`);
  console.error(
    `\n  Las pruebas @real NO se ejecutaron. Esto es intencional: es preferible que no\n` +
      `  corran a que escriban en producción.\n\n` +
      `  Para habilitarlas, configura un proyecto Supabase de TEST y exporta:\n` +
      `    E2E_ALLOW_REAL_BACKEND=1\n` +
      `    E2E_SUPABASE_URL=https://<proyecto-de-test>.supabase.co\n` +
      `    E2E_SUPABASE_ANON_KEY=<anon key del proyecto de TEST>\n` +
      `    E2E_DEBUG_KEY=<clave del modo prueba, distinta de producción>\n` +
      `  Ver docs/e2e.md.\n`
  );
  process.exit(1);
}

// BUG CORREGIDO: la versión anterior detectaba el proyecto leyendo `process.argv`,
// que NO contiene el nombre del proyecto. La guarda retornaba siempre sin validar
// nada, así que chromium-real podía apuntar a producción sin que nadie lo frenara
// — exactamente el fallo que esta guarda debe evitar.
//
// Detección fiable: Playwright expone el proyecto activo en `config.projects`, y
// `globalSetup` recibe la config completa. Además se respeta
// `PLAYWRIGHT_PROJECT_FILTER` (lo que usa el runner) como respaldo.
export default function globalSetup(config: { projects?: Array<{ name?: string; grep?: unknown }> } = {}) {
  // DETECCIÓN DEL PROYECTO REAL:
  // `globalSetup` corre una vez para toda la invocación, y `config.projects` lista
  // TODOS los proyectos del archivo (incluido chromium-real aunque el usuario haya
  // pedido solo chromium-mock). Por eso no basta con mirar los nombres: hay que ver
  // si el proyecto que CORRE es el real.
  //
  // Señal fiable: Playwright respeta `--project=` y la variable
  // PLAYWRIGHT_PROJECT_FILTER. Si el usuario pidió explícitamente otro proyecto,
  // este setup no tiene por qué exigir credenciales de test.
  const filtro = [process.env.PLAYWRIGHT_PROJECT_FILTER ?? "", ...process.argv.slice(2)].join(" ");
  const pidioOtroProyecto = /chromium-mock/.test(filtro) && !/chromium-real/.test(filtro);
  const pidioRealExplicito = /chromium-real/.test(filtro);

  // ¿Corre el real? Si se pidió explícitamente, sí. Si no se pidió ningún proyecto
  // concreto, corre TODO (incluido el real), así que también hay que validar.
  const proyectosDelArchivo = (config.projects ?? []).map((p) => p.name);
  const existeReal = proyectosDelArchivo.includes("chromium-real");
  const correReal = existeReal && !pidioOtroProyecto;

  if (!correReal) {
    if (pidioRealExplicito) {
      // No debería ocurrir (si lo pidió, correReal sería true), pero si pasa, se
      // aborta en vez de arriesgar que @real corra sin validar.
      abortar(["No se pudo confirmar el proyecto activo, pero se pidió chromium-real."]);
    }
    return;
  }

  const razones: string[] = [];

  // 1. Consentimiento explícito.
  if (process.env.E2E_ALLOW_REAL_BACKEND !== "1") {
    razones.push(
      "Falta E2E_ALLOW_REAL_BACKEND=1 (consentimiento explícito para usar un backend real)."
    );
  }

  // 2. Credenciales de test presentes.
  const e2eUrl = process.env.E2E_SUPABASE_URL ?? "";
  const e2eKey = process.env.E2E_SUPABASE_ANON_KEY ?? "";
  if (!e2eUrl) razones.push("Falta E2E_SUPABASE_URL.");
  if (!e2eKey) razones.push("Falta E2E_SUPABASE_ANON_KEY.");

  // 2b. Clave del modo prueba. El smoke abre la app con ?prueba=1&clave=…, así que
  //     necesita la MISMA clave que el servidor validará como DEBUG_KEY. Sin ella,
  //     la app muestra el fail-stop "Modo prueba detenido" y el smoke no podría
  //     verificar nada.
  const e2eDebugKey = process.env.E2E_DEBUG_KEY ?? "";
  if (!e2eDebugKey) {
    razones.push(
      "Falta E2E_DEBUG_KEY (la clave del modo prueba que el smoke usa para autorizar " +
        "?prueba=1). Debe coincidir con el DEBUG_KEY que se inyecta al servidor local."
    );
  }

  // 3. Comparación con las credenciales de PRODUCCIÓN del propio repo.
  const envLocal = leerEnv(".env.local");
  const envProdLocal = leerEnv(".env.production.local");
  const prodUrl = normalizar(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? envLocal.NEXT_PUBLIC_SUPABASE_URL ?? envProdLocal.NEXT_PUBLIC_SUPABASE_URL ?? ""
  );
  const prodKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? envLocal.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? envProdLocal.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (prodUrl && normalizar(e2eUrl) === prodUrl) {
    razones.push(
      "E2E_SUPABASE_URL coincide con la URL de PRODUCCIÓN (NEXT_PUBLIC_SUPABASE_URL). " +
        "Usa un proyecto de test/staging distinto."
    );
  }
  if (prodKey && e2eKey && prodKey === e2eKey) {
    razones.push(
      "E2E_SUPABASE_ANON_KEY es la MISMA clave que la de producción. Usa el proyecto de test."
    );
  }

  // 3b. La clave de prueba NO puede ser la de producción.
  const prodDebugKey = process.env.DEBUG_KEY ?? envLocal.DEBUG_KEY ?? envProdLocal.DEBUG_KEY ?? "";
  if (prodDebugKey && e2eDebugKey && prodDebugKey === e2eDebugKey) {
    razones.push(
      "E2E_DEBUG_KEY es la MISMA clave que el DEBUG_KEY de producción. Usa una clave " +
        "distinta para el entorno de test: si se filtra, no debe abrir /debug real."
    );
  }

  // 4. Hosts prohibidos.
  const host = (() => {
    try {
      return new URL(e2eUrl).hostname.toLowerCase();
    } catch {
      return "";
    }
  })();
  if (e2eUrl && !host) {
    razones.push("E2E_SUPABASE_URL no es una URL válida.");
  }
  if (host && HOSTS_PROHIBIDOS.some((h) => host.includes(h))) {
    razones.push(`El host de E2E_SUPABASE_URL está en la lista de prohibidos (${host}).`);
  }

  // 4b. VALIDACIÓN ESTRICTA DE LA URL DE STAGING Y COMPARACIÓN POR PROJECT-REF.
  //
  // Comparar la URL completa no basta: `https://x.supabase.co` y
  // `https://x.supabase.co/` son el mismo proyecto con distinto texto, y una URL
  // con un path o un query distinto también pasaría. El identificador real es el
  // PROJECT-REF (el subdominio). Aquí se exige que exista y se compara.
  const refStaging = projectRefDe(e2eUrl);
  if (e2eUrl && !refStaging) {
    razones.push(
      "E2E_SUPABASE_URL no tiene la forma de un proyecto Supabase " +
        "(se esperaba https://<project-ref>.supabase.co). No se puede identificar el proyecto."
    );
  }

  // Si NO se puede identificar la referencia de producción, se ABORTA: sin ese
  // dato no hay forma de demostrar que staging no es producción. Antes esto era
  // solo un aviso, así que un repo sin `.env.local` podía correr @real sin
  // comparación alguna.
  const refProd = projectRefDe(prodUrl);
  if (!prodUrl) {
    razones.push(
      "No se pudo identificar la URL de PRODUCCIÓN (NEXT_PUBLIC_SUPABASE_URL no está " +
        "en el entorno ni en .env.local ni en .env.production.local). Sin ese dato no se " +
        "puede demostrar que staging no es producción."
    );
  } else if (!refProd) {
    razones.push(
      "La URL de producción no tiene la forma de un proyecto Supabase, así que no se " +
        "puede comparar con staging."
    );
  } else if (refStaging && refStaging === refProd) {
    razones.push(
      `Staging y producción tienen el MISMO project-ref (${refRef(refStaging)}). ` +
        "Usa un proyecto distinto."
    );
  }

  if (razones.length > 0) abortar(razones);

  // REPORTE de lo comparado, sin exponer claves ni URLs completas: solo los
  // project-ref (parcialmente) y el resultado.
  console.log(`${VERDE}✓ Guarda de producción OK${RESET}: chromium-real usará un backend de TEST.`);
  console.log(`  project-ref staging : ${refRef(refStaging as string)}`);
  console.log(`  project-ref prod    : ${refRef(refProd as string)}`);
  console.log(`  ¿coinciden?         : NO → SEGURO`);
  console.log(`  consentimiento      : E2E_ALLOW_REAL_BACKEND=1`);
  console.log(`  credenciales        : URL, publishable key y E2E_DEBUG_KEY presentes`);
}
