import { test as base, expect, type Page } from "@playwright/test";

// ARNÉS DE PRUEBAS E2E — pilot readiness.
//
// Garantías que implementa este archivo:
//   1. NO se escribe en producción: TODA petición a Supabase y a /api/* está
//      interceptada por defecto y responde desde memoria. Si una prueba necesita
//      el backend real, debe pedirlo explícitamente con la fixture `sinMocks`.
//   2. Estado del navegador limpio y determinista: localStorage y cookies se
//      controlan por prueba, para simular recarga, segundo alumno y cookies
//      ajenas.
//   3. Registro de las escrituras intentadas, para poder afirmar "cero escrituras"
//      (el caso crítico de la autorización de prueba pendiente).

// ── Estado simulado del backend ────────────────────────────────────────────
export interface BackendFalso {
  // Filas escritas, por tabla. Permite afirmar idempotencia y ausencia de escrituras.
  filas: Record<string, Array<Record<string, unknown>>>;
  // Llamadas registradas, en orden.
  llamadas: Array<{ metodo: string; tabla: string; onConflict?: string }>;
  // Control de respuestas.
  authPruebaOk: boolean; // /api/debug/verificar-prueba
  fallarEscrituras: Set<string>; // tablas que deben fallar
  // Modo "corte de red tras escribir" (simula timeout con la fila ya insertada).
  perderRespuestaTrasEscribir: Set<string>;
}

function crearBackendFalso(): BackendFalso {
  return {
    filas: {},
    llamadas: [],
    authPruebaOk: true,
    fallarEscrituras: new Set(),
    perderRespuestaTrasEscribir: new Set(),
  };
}

// Clave única por tabla, igual que los índices de la migración 00020.
function claveDe(tabla: string, fila: Record<string, unknown>): string {
  switch (tabla) {
    case "sesiones":
      return String(fila.id);
    case "respuestas_gustos":
      return `${fila.session_id}|${fila.contexto_id}`;
    case "respuestas_cognitivo":
      return `${fila.session_id}|${fila.juego}|${fila.item_id}`;
    case "respuestas_verbal":
      return `${fila.session_id}|${fila.tarea}`;
    case "respuestas_actividades":
      return `${fila.session_id}|${fila.actividad_id}`;
    case "respuestas_asignaturas":
      return `${fila.session_id}|${fila.asignatura_id}`;
    case "respuestas_divergente":
      return `${fila.session_id}|${fila.objeto}`;
    case "aspiraciones":
      return String(fila.session_id);
    case "resultados":
      return String(fila.session_id);
    case "tutorial_estado":
      return `${fila.session_id}|${fila.juego}`;
    default:
      return JSON.stringify(fila);
  }
}

/**
 * Intercepta Supabase (PostgREST y Auth) y las rutas /api/* de la app.
 * Modela un PostgREST mínimo: upsert idempotente por clave, inserts, selects.
 */
async function montarMocks(page: Page, backend: BackendFalso) {
  // ── Supabase PostgREST ───────────────────────────────────────────────────
  await page.route("**/rest/v1/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    // /rest/v1/<tabla>
    const tabla = url.pathname.split("/rest/v1/")[1]?.split("/")[0] ?? "desconocida";
    const metodo = req.method();
    const onConflict = url.searchParams.get("on_conflict") ?? undefined;

    if (metodo === "GET" || metodo === "HEAD") {
      backend.llamadas.push({ metodo, tabla });
      const filas = backend.filas[tabla] ?? [];
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(filas) });
    }

    if (metodo === "POST") {
      backend.llamadas.push({ metodo, tabla, onConflict });
      const cuerpo = req.postDataJSON();
      const entrantes: Array<Record<string, unknown>> = Array.isArray(cuerpo) ? cuerpo : [cuerpo];

      // El upsert requiere la restricción única (migración 00020). Si la prueba
      // simula que no existe, se devuelve 42P10 como en producción.
      if (backend.fallarEscrituras.has(tabla)) {
        return route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ code: "42P10", message: "there is no unique or exclusion constraint matching the ON CONFLICT specification" }),
        });
      }

      backend.filas[tabla] ??= [];
      for (const fila of entrantes) {
        const clave = claveDe(tabla, fila);
        const existente = backend.filas[tabla].findIndex((existenteFila) => claveDe(tabla, existenteFila) === clave);
        if (existente === -1) backend.filas[tabla].push({ ...fila, id: fila.id ?? backend.filas[tabla].length + 1 });
        // Si el índice no existe, un upsert sería un error; con índice, reemplaza.
        else backend.filas[tabla][existente] = { ...backend.filas[tabla][existente], ...fila };
      }

      // Corte de red DESPUÉS de escribir: la fila quedó, la respuesta se pierde.
      if (backend.perderRespuestaTrasEscribir.has(tabla)) {
        return route.abort("connectionfailed");
      }
      const escritas = entrantes.map((f) => ({ id: 1 }));
      return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(escritas) });
    }

    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
  });

  // ── Supabase Auth ────────────────────────────────────────────────────────
  await page.route("**/auth/v1/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.includes("/token")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "token-de-prueba",
          token_type: "bearer",
          expires_in: 3600,
          refresh_token: "refresh-de-prueba",
          user: { id: "00000000-0000-4000-8000-000000000001", is_anonymous: true },
        }),
      });
    }
    if (url.pathname.includes("/user")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: "00000000-0000-4000-8000-000000000001", is_anonymous: true }),
      });
    }
    if (url.pathname.includes("/logout")) {
      return route.fulfill({ status: 204, body: "" });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
  });

  // ── Rutas /api/* de la app ───────────────────────────────────────────────
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());

    // Autorización de modo prueba: el interruptor central de las pruebas.
    if (url.pathname === "/api/debug/verificar-prueba") {
      return route.fulfill({
        status: backend.authPruebaOk ? 200 : 401,
        contentType: "application/json",
        body: JSON.stringify({ ok: backend.authPruebaOk }),
      });
    }
    if (url.pathname === "/api/debug/auth") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    }

    // Evaluación verbal: respuesta estable y sin coste.
    if (url.pathname === "/api/evaluar" || url.pathname === "/api/debug/evaluar") {
      const cuerpo = route.request().postDataJSON() as { respuestaId?: number; tarea?: string };
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          estado: "evaluado",
          pertinente: true,
          evaluacion: { nivel: "inferencial", puntaje: 4, fortaleza: "Claridad", area_mejora: "Profundidad" },
          revision_requerida: false,
          acuerdo_no_disponible: true,
          respuestaId: cuerpo?.respuestaId ?? null,
        }),
      });
    }

    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
}

// ── Fixtures ──────────────────────────────────────────────────────────────
export const test = base.extend<{
  backend: BackendFalso;
  // Por defecto TODAS las pruebas usan mocks (cero escrituras a producción).
  // `sinMocks` desactiva la interceptación para los tests @real.
  sinMocks: boolean;
}>({
  backend: async ({}, use) => {
    await use(crearBackendFalso());
  },

  sinMocks: [false, { option: true }],

  page: async ({ page, backend, sinMocks }, use) => {
    if (!sinMocks) {
      await montarMocks(page, backend);
    }
    // Estado limpio ANTES de cargar la app. El orden importa: hay que limpiar con
    // el navegador en un origen válido pero ANTES de que la app se monte. Si se
    // limpiara después del `goto`, el store ya se habría rehidratado y aparecería
    // la pantalla de "Continuar" con estado del test anterior (ese fue el bug del
    // arnés que hacía fallar 10 pruebas).
    await page.goto("/robots.txt");
    // Se limpian AMBOS almacenes: la app usa sessionStorage por defecto (piloto
    // escolar) y localStorage en la modalidad b2c. Limpiar solo uno dejaría estado
    // del test anterior y produciría falsos positivos de reanudación.
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await page.context().clearCookies();
    await use(page);
  },
});

// ── Utilidades compartidas ────────────────────────────────────────────────

/** Lee el estado persistido por zustand. Requiere estar en el origen de la app. */
export async function estadoPersistido(page: Page): Promise<Record<string, unknown> | null> {
  // Si aún no se navegó a la app (p. ej. el test prepara el estado antes del
  // primer goto), hay que estar en el origen para poder tocar localStorage.
  if (!page.url().startsWith("http")) {
    await page.goto("/robots.txt");
  }
  return await page.evaluate(() => {
    const raw =
      window.sessionStorage.getItem("mirai-experiencia") ?? window.localStorage.getItem("mirai-experiencia");
    if (!raw) return null;
    try {
      return JSON.parse(raw).state;
    } catch {
      return null;
    }
  });
}

/** Escribe a mano el estado persistido (simula otro alumno / manipulación). */
export async function escribirEstado(page: Page, state: Record<string, unknown>, version = 3) {
  // Igual que arriba: el estado se escribe ANTES de cargar /experiencia, así que
  // primero hay que estar en el origen.
  if (!page.url().startsWith("http")) {
    await page.goto("/robots.txt");
  }
  await page.evaluate(
    ([s, v]) => {
      // Se escribe en AMBOS: la modalidad (sessionStorage por defecto) la decide el
      // entorno, y así la prueba no depende de cuál esté configurada.
      const payload = JSON.stringify({ state: s, version: v });
      window.sessionStorage.setItem("mirai-experiencia", payload);
      window.localStorage.setItem("mirai-experiencia", payload);
    },
    [state, version] as const
  );
}

/** Fija la cookie de sesión (simula la cookie de otro alumno). */
export async function fijarCookieSession(page: Page, sessionId: string) {
  // addCookies necesita una URL del origen de la app (no requiere navegar).
  await page.context().addCookies([
    { name: "mirai_session_id", value: sessionId, url: "http://127.0.0.1:3100", sameSite: "Lax" },
  ]);
}

/**
 * Responde un ítem de un bloque pulsando el botón cuyo texto coincide EXACTAMENTE.
 *
 * La coincidencia exacta es importante: `getByRole(..., { name: "Me gusta" })`
 * también matchea "No me gusta" (substring), y Playwright devolvía el botón
 * equivocado. Con `{ exact: true }` el selector es inequívoco.
 */
export async function responderBoton(page: Page, texto: RegExp | string) {
  if (typeof texto === "string") {
    await page.getByRole("button", { name: texto, exact: true }).first().click();
    return;
  }
  await page.getByRole("button", { name: texto }).first().click();
}

/**
 * Responde TODOS los ítems de un bloque de tarjetas, esperando a que el progreso
 * avance en cada uno.
 *
 * Sin la espera, los clics se disparan más rápido de lo que el bloque actualiza su
 * índice: el clic se resuelve contra el botón anterior y el bloque no avanza (el
 * test se quedaba a mitad). La barra de progreso es el indicador fiable de avance.
 */
export async function responderBloqueCompleto(
  page: Page,
  texto: string,
  total: number,
  opciones: { conReload?: boolean } = {}
) {
  const progreso = page.getByRole("progressbar").first();
  for (let i = 0; i < total; i++) {
    const boton = page.getByRole("button", { name: texto, exact: true }).first();
    // La tarjeta se monta con una animación de pliegue (FoldTransition): durante
    // ella el elemento "no es estable" y Playwright rechaza el clic. Se espera a
    // que la animación termine antes de pulsar.
    await boton.waitFor({ state: "visible" });
    await page.waitForTimeout(120);
    await boton.click();
    // El avance se refleja en aria-valuenow (de i a i+1). Se espera salvo en el
    // último ítem, donde el bloque puede cerrarse y desmontar la barra.
    if (i + 1 < total && !opciones.conReload) {
      await expect
        .poll(async () => Number(await progreso.getAttribute("aria-valuenow")), { timeout: 5_000 })
        .toBeGreaterThan(i);
    }
  }
}

export { expect };
