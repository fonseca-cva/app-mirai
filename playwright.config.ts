import { defineConfig, devices } from "@playwright/test";

// CONFIGURACIÓN DE PRUEBAS E2E — pilot readiness.
//
// Objetivos (según lo pedido):
//   * Ejecutar contra el servidor LOCAL de Next.js (nunca contra producción).
//   * No escribir en producción durante los tests.
//   * Interceptar las APIs externas / Supabase cuando el caso NO requiera
//     integración real.
//   * Un proyecto SEPARADO para los casos que sí necesitan un entorno Supabase de
//     test.
//   * Cubrir recarga, cookies, localStorage, modo prueba simple/real y
//     computadores compartidos.
//
// ── DOS PROYECTOS ──────────────────────────────────────────────────────────
//   chromium-mock : por defecto. `page.route()` intercepta Supabase y /api/*, así
//                   que NO toca ningún backend. Es el que corre en CI y en local
//                   sin credenciales. Es el que garantiza "no escribir en
//                   producción".
//   chromium-real : solo los tests marcados con @real. Usa un entorno Supabase de
//                   TEST (nunca producción). Se salta automáticamente si no hay
//                   E2E_SUPABASE_URL / E2E_SUPABASE_ANON_KEY configuradas.
//
// ── SEGURIDAD ──────────────────────────────────────────────────────────────
// Este archivo NO debe apuntar nunca a producción. Las variables `E2E_*` son
// distintas de las `NEXT_PUBLIC_*` del deploy, justamente para que sea imposible
// apuntar al proyecto real por accidente.

const BASE_URL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100";

export default defineConfig({
  // GUARDA FAIL-CLOSED contra producción: corre ANTES de cualquier test y solo
  // actúa cuando el proyecto activo es `chromium-real` (los mocks no tocan ningún
  // backend). Comprueba E2E_ALLOW_REAL_BACKEND, la presencia de credenciales y que
  // NO coincidan con las de producción; si algo falla, ABORTA la corrida.
  globalSetup: "./e2e/guardaProduccion.ts",

  testDir: "./e2e",
  // Los tests de este directorio son de integración real: no comparten estado, así
  // que se ejecutan en serie para que las aserciones sobre localStorage/cookies
  // sean deterministas.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  timeout: 30_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    // El locale importa: la UI está en español de Chile.
    locale: "es-CL",
    timezoneId: "America/Santiago",
  },

  projects: [
    {
      name: "chromium-mock",
      use: { ...devices["Desktop Chrome"] },
      // Selección por ARCHIVO, no por título: Playwright interpreta "@algo" en el
      // nombre de un test como anotación y lo filtra del listado. `testMatch` y
      // `testIgnore` por archivo son inequívocos.
      testIgnore: /(real|real-smoke)\.spec\.ts/,
    },
    {
      name: "chromium-real",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /(real|real-smoke)\.spec\.ts/,
      // NO hay testIgnore ni skip condicional: si falta el entorno de test, la
      // guarda de `globalSetup` ABORTA la corrida con exit ≠ 0. Omitir la suite en
      // silencio daría una falsa impresión de éxito, que es justo lo que se quiere
      // evitar. Ver docs/e2e.md.
    },
  ],

  // Servidor de Next en el puerto 3100 (distinto del dev habitual, para no chocar)
  // y con las env de E2E. `reuseExistingServer` en local acelera las corridas.
  webServer: {
    command: "npm run start:e2e",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // IMPORTANTE: se definen SIEMPRE, para que `next build` NO lea `.env.local` y
      // el servidor de pruebas no herede las credenciales de PRODUCCIÓN en silencio
      // —que es justo lo que hay que evitar.
      //
      // Cuando NO hay entorno de test se usa un origen FICTICIO
      // (e2e-backend.invalido) en vez de dejarlas vacías: con vacío, `supabase`
      // queda en null, el cliente no intenta sincronizar, `syncSesion` devuelve
      // false y el CTA de la intro BLOQUEA la experiencia ("No pudimos preparar tu
      // experiencia"). Con un origen ficticio, el cliente crea el objeto y las
      // peticiones las intercepta el mock (que responde en memoria). `.invalid` es
      // un TLD reservado por RFC 2606: no resuelve nunca, así que no puede llegar a
      // ningún backend real ni por accidente.
      NEXT_PUBLIC_SUPABASE_URL:
        process.env.E2E_SUPABASE_URL ?? "https://e2e-backend.invalid",
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.E2E_SUPABASE_ANON_KEY ?? "anon-key-ficticia-para-mocks",
      // La modalidad de almacenamiento se fija explícitamente para que los E2E no
      // dependan del entorno: sessionStorage (piloto escolar) por defecto.
      NEXT_PUBLIC_MIRAI_ALMACENAMIENTO: process.env.NEXT_PUBLIC_MIRAI_ALMACENAMIENTO ?? "sessionStorage",
      // CLAVE DEL MODO PRUEBA — SIN FALLBACK A PRODUCCIÓN.
      //
      // El servidor valida `DEBUG_KEY`; el navegador envía `E2E_DEBUG_KEY` por la
      // URL. Se inyecta la de test para que ambos coincidan.
      //
      // NUNCA se usa `process.env.DEBUG_KEY` como respaldo: en un shell con el
      // entorno de producción cargado, ese fallback haría que el servidor de
      // pruebas arrancara con la CLAVE REAL — y eso ocurre ANTES de que
      // `globalSetup` pueda abortar, porque Next se levanta primero.
      //
      // En `chromium-mock` no hay `E2E_DEBUG_KEY` (no se exige), así que el valor es
      // "" y el modo prueba queda deshabilitado en el servidor: da igual, porque las
      // rutas están interceptadas y ningún test mock depende de autorizar /debug.
      DEBUG_KEY: process.env.E2E_DEBUG_KEY ?? "",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
