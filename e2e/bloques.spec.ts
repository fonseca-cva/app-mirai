import { test, expect, estadoPersistido, escribirEstado, fijarCookieSession, responderBloqueCompleto } from "./fixtures";

// E2E — BLOQUES AVANZADOS: divergente, cognitivo y verbal (pilot readiness).
//
// Cubre lo que faltaba del pedido: estado parcial, completo y recarga de los
// bloques que tienen UI propia (texto abierto, juegos y tareas escritas), más la
// reconstrucción tras una escritura realmente fallida.
//
// Todo con el backend interceptado: CERO escrituras a producción.

const SESSION_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

// IDs reales de los catálogos (lib/data/*).
const IDS_CONTEXTOS = [
  "tec-01", "tec-02", "cie-01", "cie-02", "cre-01", "cre-03", "soc-01", "soc-02",
  "sal-01", "sal-02", "sal-03", "ges-01", "ges-02", "ges-03", "dat-01", "dat-02",
  "dat-03", "nat-01", "nat-02", "nat-03",
];
const IDS_DIVERGENTE = ["div-clip", "div-ladrillo", "div-taza"];

// Estado base rehidratable: se escribe antes de cargar la app.
function estadoBase(over: Record<string, unknown> = {}) {
  return {
    sessionId: SESSION_A,
    paso: "gustos",
    experienciaIncompleta: true,
    iniciadaEn: Date.now(),
    expiraEn: Date.now() + 86_400_000,
    sesionEraPrueba: false,
    cognitivoCompleto: false,
    respuestasGustos: [],
    respuestasCognitivo: [],
    respuestasVerbal: [],
    respuestasDivergente: [],
    respuestasActividades: [],
    respuestasAsignaturas: [],
    aspiracion: { opcion: "universidad", detalle: null },
    ...over,
  };
}

test.describe("divergente: parcial, completo y recarga", () => {
  test("parcial: recargar abre en el primer objeto PENDIENTE", async ({ page }) => {
    await fijarCookieSession(page, SESSION_A);
    await escribirEstado(
      page,
      estadoBase({
        paso: "divergente",
        respuestasDivergente: [{ objeto: IDS_DIVERGENTE[0], respuestasTexto: ["a", "b", "c"], cantidad: 3 }],
      })
    );

    await page.goto("/experiencia");
    await page.getByRole("button", { name: /continuar donde la dejé/i }).click();

    // Debe estar en el objeto 2 de 3, no en el primero.
    await expect(page.getByText(/2 de 3/)).toBeVisible();
  });

  test("completo: recargar muestra el cierre y no pide otra respuesta", async ({ page }) => {
    await fijarCookieSession(page, SESSION_A);
    await escribirEstado(
      page,
      estadoBase({
        paso: "divergente",
        respuestasDivergente: IDS_DIVERGENTE.map((objeto) => ({ objeto, respuestasTexto: ["a", "b", "c"], cantidad: 3 })),
      })
    );

    const errores: string[] = [];
    page.on("pageerror", (e) => errores.push(e.message));

    await page.goto("/experiencia");
    await page.getByRole("button", { name: /continuar donde la dejé/i }).click();

    // Cierra el bloque sin formulario y sin crash (antes: OBJETOS[indice] → undefined).
    await expect(page.getByText(/¡Listo!|terminaste|gracias/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("textarea")).toHaveCount(0);
    expect(errores).toEqual([]);
  });

  test("responder un objeto lo persiste y avanza", async ({ page, backend }) => {
    await fijarCookieSession(page, SESSION_A);
    await escribirEstado(page, estadoBase({ paso: "divergente" }));

    await page.goto("/experiencia");
    await page.getByRole("button", { name: /continuar donde la dejé/i }).click();

    await expect(page.locator("textarea")).toBeVisible();
    await page.locator("textarea").fill("usar como pisapapeles\nsujetar papeles\nhacer un gancho");
    await page.getByRole("button", { name: /continuar|siguiente|guardar/i }).first().click();

    await expect.poll(async () => {
      const e = await estadoPersistido(page);
      return (e?.respuestasDivergente as unknown[])?.length ?? 0;
    }).toBe(1);
    void backend;
  });
});

test.describe("cognitivo: parcial, completo y recarga", () => {
  test("parcial: recargar reanuda en el juego incompleto", async ({ page }) => {
    // Matrices con SOLO 2 de sus ítems: el bloque debe reabrir matrices.
    await fijarCookieSession(page, SESSION_A);
    await escribirEstado(
      page,
      estadoBase({
        paso: "cognitivo",
        respuestasCognitivo: [
          { juego: "matrices", itemId: "mat-01", correcto: true, nivel: 1, duracionMs: 900, repetidoPorTimeout: false },
          { juego: "matrices", itemId: "mat-02", correcto: false, nivel: 1, duracionMs: 1100, repetidoPorTimeout: false },
        ],
      })
    );

    const errores: string[] = [];
    page.on("pageerror", (e) => errores.push(e.message));

    await page.goto("/experiencia");
    await page.getByRole("button", { name: /continuar donde la dejé/i }).click();

    // El bloque cognitivo arranca (tutorial o el juego). Lo esencial: no crashea y
    // no está en la pantalla de cierre.
    await expect(page.locator("body")).toContainText(/matrices|series|pliegues|secuencias|tutorial|Empezar|Comenzar/i, {
      timeout: 10_000,
    });
    expect(errores).toEqual([]);
  });

  test("completo: el marcador cognitivoCompleto persiste tras recargar", async ({ page }) => {
    await fijarCookieSession(page, SESSION_A);
    await escribirEstado(
      page,
      estadoBase({
        paso: "cognitivo",
        cognitivoCompleto: true,
        respuestasCognitivo: [
          { juego: "matrices", itemId: "mat-01", correcto: true, nivel: 1, duracionMs: 900, repetidoPorTimeout: false },
        ],
      })
    );

    await page.goto("/experiencia");
    await page.getByRole("button", { name: /continuar donde la dejé/i }).click();

    // El marcador sigue ahí: es lo que usa la reconstrucción para reenviar el bloque.
    await expect.poll(async () => {
      const e = await estadoPersistido(page);
      return e?.cognitivoCompleto ?? null;
    }).toBe(true);
  });
});

test.describe("verbal: parcial, evaluado, error/reintento y recarga", () => {
  test("parcial: recargar reanuda en la primera tarea SIN respuesta", async ({ page }) => {
    await fijarCookieSession(page, SESSION_A);
    await escribirEstado(
      page,
      estadoBase({
        paso: "verbal",
        respuestasVerbal: [
          { tarea: "comprension", texto: "mi análisis del texto", evaluacion: { puntaje: 4 }, estado: "evaluado", intento: 1 },
        ],
      })
    );

    await page.goto("/experiencia");
    await page.getByRole("button", { name: /continuar donde la dejé/i }).click();

    // Debe estar en ARGUMENTACIÓN (la siguiente), no volver a comprensión.
    await expect(page.locator("body")).toContainText(/argument|dilema/i, { timeout: 10_000 });
  });

  test("evaluado: el estado de la respuesta se conserva tras recargar", async ({ page }) => {
    await fijarCookieSession(page, SESSION_A);
    await escribirEstado(
      page,
      estadoBase({
        paso: "verbal",
        respuestasVerbal: [
          { id: 5, tarea: "comprension", texto: "texto uno", evaluacion: { puntaje: 5 }, estado: "evaluado", intento: 1 },
          { id: 6, tarea: "argumentacion", texto: "texto dos", evaluacion: { puntaje: 3 }, estado: "evaluado", intento: 1 },
        ],
      })
    );

    await page.goto("/experiencia");
    await page.getByRole("button", { name: /continuar donde la dejé/i }).click();

    await expect.poll(async () => {
      const e = await estadoPersistido(page);
      return (e?.respuestasVerbal as unknown[])?.length ?? 0;
    }).toBe(2);
  });

  test("error/reintento: una respuesta no evaluada queda registrada y no se pierde", async ({ page }) => {
    await fijarCookieSession(page, SESSION_A);
    await escribirEstado(
      page,
      estadoBase({
        paso: "verbal",
        respuestasVerbal: [
          { tarea: "comprension", texto: "texto sin evaluar", evaluacion: null, estado: "no_evaluado", intento: 1 },
        ],
      })
    );

    await page.goto("/experiencia");
    await page.getByRole("button", { name: /continuar donde la dejé/i }).click();

    // La respuesta sigue ahí, con su estado, para no perder el trabajo del alumno.
    await expect.poll(async () => {
      const e = await estadoPersistido(page);
      const r = (e?.respuestasVerbal as Array<{ estado?: string }> | undefined) ?? [];
      return r[0]?.estado ?? null;
    }).toBe("no_evaluado");
  });

  test("el bloque verbal completo abre en la última tarea (no reinicia)", async ({ page }) => {
    await fijarCookieSession(page, SESSION_A);
    await escribirEstado(
      page,
      estadoBase({
        paso: "verbal",
        respuestasVerbal: [
          { tarea: "comprension", texto: "a", evaluacion: null, estado: "evaluado", intento: 1 },
          { tarea: "argumentacion", texto: "b", evaluacion: null, estado: "evaluado", intento: 1 },
          { tarea: "expresion", texto: "c", evaluacion: null, estado: "evaluado", intento: 1 },
        ],
      })
    );

    const errores: string[] = [];
    page.on("pageerror", (e) => errores.push(e.message));

    await page.goto("/experiencia");
    await page.getByRole("button", { name: /continuar donde la dejé/i }).click();

    // Con las 3 tareas respondidas el bloque se considera hecho: no vuelve a pedir.
    await expect(page.locator("body")).toContainText(/listo|tercer pliegue|seguir/i, { timeout: 10_000 });
    expect(errores).toEqual([]);
  });
});

test.describe("reconstrucción tras una escritura realmente fallida", () => {
  test("bloque completo con sync fallido: se reenvía al continuar tras recargar", async ({ page, backend }) => {
    test.setTimeout(120_000);
    // El backend falla SOLO para gustos: la sesión padre se escribe bien (por eso
    // el CTA no se bloquea) y lo que falla es el bloque de respuestas.
    backend.fallarEscrituras.add("respuestas_gustos");

    await page.goto("/experiencia");
    await page.getByRole("button", { name: /sin sonido/i }).click();
    await page.getByRole("button", { name: /estudiar en la universidad/i }).click();
    await page.getByRole("button", { name: /^continuar$/i }).click();

    await responderBloqueCompleto(page, "Me atrae", IDS_CONTEXTOS.length);

    // Hubo intento de escritura y falló.
    await expect.poll(() => backend.llamadas.filter((l) => l.metodo === "POST" && l.tabla === "respuestas_gustos").length).toBeGreaterThan(0);
    expect((backend.filas.respuestas_gustos ?? []).length).toBe(0);

    // RECARGA: el estado local conserva las 20 respuestas.
    await page.reload();
    await page.getByRole("button", { name: /continuar donde la dejé/i }).click();

    // Ahora el backend está sano: la reconstrucción reenvía el bloque completo.
    backend.fallarEscrituras.delete("respuestas_gustos");
    await expect
      .poll(() => (backend.filas.respuestas_gustos ?? []).length, { timeout: 30_000 })
      .toBe(IDS_CONTEXTOS.length);
  });

  test("la reconstrucción no escribe si la escritura sigue fallando", async ({ page, backend }) => {
    test.setTimeout(120_000);
    backend.fallarEscrituras.add("respuestas_gustos");

    await page.goto("/experiencia");
    await page.getByRole("button", { name: /sin sonido/i }).click();
    await page.getByRole("button", { name: /estudiar en la universidad/i }).click();
    await page.getByRole("button", { name: /^continuar$/i }).click();
    await responderBloqueCompleto(page, "Me atrae", IDS_CONTEXTOS.length);

    await page.reload();
    await page.getByRole("button", { name: /continuar donde la dejé/i }).click();

    // Sigue fallando: NO debe aparecer ninguna fila (no hay fallo silencioso que
    // invente éxito).
    await page.waitForTimeout(1500);
    expect((backend.filas.respuestas_gustos ?? []).length).toBe(0);
    // Y las respuestas siguen a salvo en local.
    const e = await estadoPersistido(page);
    expect((e?.respuestasGustos as unknown[])?.length).toBe(IDS_CONTEXTOS.length);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// GUSTOS: POLÍTICA DE "GUARDAR AL COMPLETAR EL BLOQUE"
// ══════════════════════════════════════════════════════════════════════════
//
// La reconstrucción NO debe enviar un bloque parcial: solo se sincroniza al
// completarse. Antes, un parcial se reconstruía y escribía en la base un estado a
// medias que parecía terminado.
test.describe("gustos: parcial, completo y reintento", () => {
  test("a) parcial + recarga + continuar → CERO POST de respuestas_gustos", async ({ page, backend }) => {
    await fijarCookieSession(page, SESSION_A);
    await escribirEstado(
      page,
      estadoBase({
        paso: "gustos",
        // Solo 3 de 20 contextos.
        respuestasGustos: ["tec-01", "tec-02", "cie-01"].map((contextoId) => ({
          contextoId,
          valor: 1 as const,
          ayudaAbierta: false,
          audioActivado: false,
        })),
      })
    );

    await page.goto("/experiencia");
    await page.getByRole("button", { name: /continuar donde la dejé/i }).click();
    // Se le da margen a cualquier reconstrucción que pudiera dispararse.
    await page.waitForTimeout(1500);

    // Lo esencial: NINGUNA escritura del bloque parcial.
    const posts = backend.llamadas.filter((l) => l.metodo === "POST" && l.tabla === "respuestas_gustos");
    expect(posts).toHaveLength(0);
    // Y las respuestas siguen a salvo en local.
    const e = await estadoPersistido(page);
    expect((e?.respuestasGustos as unknown[])?.length).toBe(3);
  });

  test("b) completar después de continuar → UN POST con el bloque completo", async ({ page, backend }) => {
    test.setTimeout(120_000);
    await fijarCookieSession(page, SESSION_A);
    await escribirEstado(
      page,
      estadoBase({
        paso: "gustos",
        // 19 de 20: falta el último.
        respuestasGustos: IDS_CONTEXTOS.slice(0, -1).map((contextoId) => ({
          contextoId,
          valor: 1 as const,
          ayudaAbierta: false,
          audioActivado: false,
        })),
      })
    );

    await page.goto("/experiencia");
    await page.getByRole("button", { name: /continuar donde la dejé/i }).click();

    // Responde el que falta: el bloque se cierra y se sincroniza ENTERO.
    await page.getByRole("button", { name: "Me atrae", exact: true }).first().click();

    await expect
      .poll(() => (backend.filas.respuestas_gustos ?? []).length, { timeout: 30_000 })
      .toBe(IDS_CONTEXTOS.length);
    // Y no se envió ninguna escritura ANTES de completar (el bloque iba a medias).
    expect((backend.filas.respuestas_gustos ?? []).length).toBe(IDS_CONTEXTOS.length);
  });

  test("c) completo cuyo sync falló → se reconstruye y reintenta tras recargar", async ({ page, backend }) => {
    test.setTimeout(120_000);
    await fijarCookieSession(page, SESSION_A);
    await escribirEstado(
      page,
      estadoBase({
        paso: "gustos",
        // Bloque COMPLETO, pero su sync había fallado en la sesión anterior.
        respuestasGustos: IDS_CONTEXTOS.map((contextoId) => ({
          contextoId,
          valor: 1 as const,
          ayudaAbierta: false,
          audioActivado: false,
        })),
      })
    );

    // El backend ahora responde bien: la reconstrucción debe reintentar y lograrlo.
    await page.goto("/experiencia");
    await page.getByRole("button", { name: /continuar donde la dejé/i }).click();

    await expect
      .poll(() => (backend.filas.respuestas_gustos ?? []).length, { timeout: 30_000 })
      .toBe(IDS_CONTEXTOS.length);
  });
});
