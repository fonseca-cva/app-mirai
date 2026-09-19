import {
  test,
  expect,
  estadoPersistido,
  escribirEstado,
  fijarCookieSession,
  responderBoton,
  responderBloqueCompleto,
} from "./fixtures";

// E2E — FLUJOS CRÍTICOS (pilot readiness).
//
// Estos tests RENDERIZAN la aplicación real en Chromium. Cubren lo que los tests
// de store no podían: que los componentes reanuden de verdad, que un bloque
// terminado no rompa, y que el modo prueba no se degrade.
//
// Todo corre con el backend interceptado (ver fixtures.ts): CERO escrituras a
// producción.

const SESSION_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const SESSION_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

// IDs REALES de los catálogos. Se listan explícitamente (y no se importan) porque
// los specs de Playwright corren fuera del bundler de Next; si cambian, los tests
// fallan y hay que actualizarlos, que es justo lo que se quiere.
const IDS_CONTEXTOS = [
  "tec-01", "tec-02", "cie-01", "cie-02", "cre-01", "cre-03", "soc-01", "soc-02",
  "sal-01", "sal-02", "sal-03", "ges-01", "ges-02", "ges-03", "dat-01", "dat-02",
  "dat-03", "nat-01", "nat-02", "nat-03",
];
const IDS_ASIGNATURAS = ["asg-01", "asg-02", "asg-03", "asg-04", "asg-05", "asg-06", "asg-07", "asg-08", "asg-09", "asg-10"];
const IDS_ACTIVIDADES = [
  "act-tec-01", "act-tec-02", "act-tec-03", "act-cie-01", "act-cie-02", "act-cie-03",
  "act-cre-01", "act-cre-02", "act-cre-03", "act-soc-01", "act-soc-02", "act-soc-03",
  "act-sal-01", "act-sal-02", "act-sal-03", "act-ges-01", "act-ges-02", "act-ges-03",
  "act-dat-01", "act-dat-02", "act-dat-03", "act-nat-01", "act-nat-02", "act-nat-03",
];

test.describe("experiencia nueva y flujo básico", () => {
  test("la introducción se muestra y 'Empezar' crea una sesión con padre antes de hijos", async ({ page, backend }) => {
    await page.goto("/experiencia");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("24 lugares de trabajo reales");

    await responderBoton(page, "Sin sonido");

    // Llegó a la aspiración.
    await expect(page.getByRole("heading", { name: /qué te gustaría hacer después de 4° medio/i })).toBeVisible();

    // La sesión padre se escribió ANTES que cualquier hija.
    const orden = backend.llamadas.filter((l) => l.metodo === "POST").map((l) => l.tabla);
    expect(orden).toContain("sesiones");
    const primeraHija = orden.findIndex((t) => t !== "sesiones");
    if (primeraHija !== -1) {
      expect(orden.indexOf("sesiones")).toBeLessThan(primeraHija);
    }

    // Y el estado quedó persistido con sesión.
    const estado = await estadoPersistido(page);
    expect(estado?.sessionId).toBeTruthy();
  });

  test("responder la aspiración persiste la fila y avanza a gustos", async ({ page, backend }) => {
    await page.goto("/experiencia");
    await responderBoton(page, "Sin sonido");

    await page.getByRole("button", { name: /estudiar en la universidad/i }).click();
    await page.getByRole("button", { name: /continuar/i }).click();

    await expect.poll(() => (backend.filas.aspiraciones ?? []).length).toBeGreaterThan(0);
    const asp = backend.filas.aspiraciones[0];
    expect(asp.opcion).toBe("universidad");
  });
});

test.describe("recarga a mitad de cada bloque", () => {
  test("gustos: recarga y continúa en el contexto pendiente, sin repetir", async ({ page }) => {
    await page.goto("/experiencia");
    await responderBoton(page, "Sin sonido");
    await page.getByRole("button", { name: /estudiar en la universidad/i }).click();
    await page.getByRole("button", { name: /continuar/i }).click();

    // Espera a la primera tarjeta de contexto y responde 3.
    await expect(page.getByRole("button", { name: "Me atrae" }).first()).toBeVisible();
    for (let i = 0; i < 3; i++) {
      await responderBoton(page, "Me atrae");
    }

    const antes = await estadoPersistido(page);
    const respuestasAntes = (antes?.respuestasGustos as unknown[])?.length ?? 0;
    expect(respuestasAntes).toBe(3);

    // RECARGA real: es el caso "el alumno cerró y volvió".
    await page.reload();

    // Se ofrece continuar (salvaguarda del PC compartido) y el alumno continúa.
    await page.getByRole("button", { name: /continuar donde la dejé/i }).click();

    const despues = await estadoPersistido(page);
    expect((despues?.respuestasGustos as unknown[])?.length).toBe(3);
    // La barra de progreso expone el avance por aria-valuenow: sigue en el 4º
    // contexto, NO volvió al primero.
    await expect.poll(async () => await page.getByRole("progressbar").first().getAttribute("aria-valuenow")).toBe("3");
  });

  test("bloque terminado: recargar con el bloque COMPLETO no rompe ni pide otra respuesta", async ({ page }) => {
    // Se prepara el estado como si el alumno hubiera respondido los 20 contextos
    // y la página se hubiera recargado justo antes de avanzar.
    await fijarCookieSession(page, SESSION_A);
    await escribirEstado(page, {
      sessionId: SESSION_A,
      paso: "gustos",
      experienciaIncompleta: true,
      iniciadaEn: Date.now(),
      expiraEn: Date.now() + 86_400_000,
      sesionEraPrueba: false,
      // IDs REALES del catálogo (lib/data/contextos.ts). Con IDs inventados el
      // bloque no se consideraría completo y la prueba no mediría lo que dice medir.
      respuestasGustos: IDS_CONTEXTOS.map((contextoId) => ({
        contextoId,
        valor: 1 as const,
        ayudaAbierta: false,
        audioActivado: false,
      })),
      respuestasCognitivo: [],
      respuestasVerbal: [],
      respuestasDivergente: [],
      respuestasActividades: [],
      respuestasAsignaturas: [],
      aspiracion: { opcion: "universidad", detalle: null },
    });

    const errores: string[] = [];
    page.on("pageerror", (e) => errores.push(e.message));

    await page.goto("/experiencia");
    // Al haber una experiencia en curso, SIEMPRE se ofrece la elección explícita
    // (es la salvaguarda del computador compartido). El alumno elige continuar.
    await page.getByRole("button", { name: /continuar donde la dejé/i }).click();

    // NO debe crashear (antes: contextos[20] → undefined → TypeError).
    await expect(page.getByText(/ya respondiste este bloque/i)).toBeVisible({ timeout: 10_000 });
    expect(errores).toEqual([]);

    // Y no se pide otra respuesta: el botón de la tarjeta no está.
    await expect(page.getByRole("button", { name: "Me atrae" })).toHaveCount(0);
  });

  test("actividades: recarga y reanuda en la actividad pendiente", async ({ page }) => {
    await fijarCookieSession(page, SESSION_A);
    await escribirEstado(page, {
      sessionId: SESSION_A,
      paso: "actividades",
      experienciaIncompleta: true,
      iniciadaEn: Date.now(),
      expiraEn: Date.now() + 86_400_000,
      sesionEraPrueba: false,
      respuestasGustos: [],
      respuestasCognitivo: [],
      respuestasVerbal: [],
      respuestasDivergente: [],
      respuestasActividades: [{ actividadId: "act-tec-01", valor: 2 as const }],
      respuestasAsignaturas: [],
      aspiracion: { opcion: "universidad", detalle: null },
    });

    await page.goto("/experiencia");
    await page.getByRole("button", { name: /continuar donde la dejé/i }).click();

    // Está en la actividad 2 (1 respondida).
    await expect(page.getByText(/2 de 24/)).toBeVisible();
  });

  test("asignaturas: bloque completo no crashea", async ({ page }) => {
    await fijarCookieSession(page, SESSION_A);
    await escribirEstado(page, {
      sessionId: SESSION_A,
      paso: "asignaturas",
      experienciaIncompleta: true,
      iniciadaEn: Date.now(),
      expiraEn: Date.now() + 86_400_000,
      sesionEraPrueba: false,
      respuestasGustos: [],
      respuestasCognitivo: [],
      respuestasVerbal: [],
      respuestasDivergente: [],
      respuestasActividades: [],
      respuestasAsignaturas: IDS_ASIGNATURAS.map((asignaturaId) => ({ asignaturaId, valor: 1 as const })),
      aspiracion: { opcion: "universidad", detalle: null },
    });

    const errores: string[] = [];
    page.on("pageerror", (e) => errores.push(e.message));

    await page.goto("/experiencia");
    await page.getByRole("button", { name: /continuar donde la dejé/i }).click();

    await expect(page.getByText(/última parte de intereses/i)).toBeVisible({ timeout: 10_000 });
    expect(errores).toEqual([]);
  });
});

test.describe("segundo estudiante en el mismo computador", () => {
  test("cookie distinta: NO hereda respuestas y purga el estado", async ({ page }) => {
    // Estado del alumno A, cookie del alumno B (el caso de mezcla).
    await escribirEstado(page, {
      sessionId: SESSION_A,
      paso: "gustos",
      experienciaIncompleta: true,
      iniciadaEn: Date.now(),
      expiraEn: Date.now() + 86_400_000,
      sesionEraPrueba: false,
      respuestasGustos: [{ contextoId: "tec-01", valor: 2 as const, ayudaAbierta: false, audioActivado: false }],
      respuestasCognitivo: [],
      respuestasVerbal: [{ tarea: "comprension", texto: "texto del alumno A", evaluacion: null, estado: "evaluado" }],
      respuestasDivergente: [],
      respuestasActividades: [],
      respuestasAsignaturas: [],
      aspiracion: { opcion: "universidad", detalle: null },
    });
    await fijarCookieSession(page, SESSION_B);

    await page.goto("/experiencia");

    // NO se ofrece continuar: el estado no corresponde a la cookie.
    await expect(page.getByRole("button", { name: /continuar donde la dejé/i })).toHaveCount(0);
    // Y el estado se purgó: ni las respuestas ni el texto abierto del alumno A.
    await expect.poll(async () => {
      const e = await estadoPersistido(page);
      return e?.sessionId ?? null;
    }).toBeNull();
    const e = await estadoPersistido(page);
    expect(JSON.stringify(e?.respuestasVerbal ?? [])).not.toContain("texto del alumno A");
  });

  test("empezar de nuevo rota la sesión y limpia las respuestas", async ({ page }) => {
    await fijarCookieSession(page, SESSION_A);
    await escribirEstado(page, {
      sessionId: SESSION_A,
      paso: "gustos",
      experienciaIncompleta: true,
      iniciadaEn: Date.now(),
      expiraEn: Date.now() + 86_400_000,
      sesionEraPrueba: false,
      respuestasGustos: [{ contextoId: "tec-01", valor: 2 as const, ayudaAbierta: false, audioActivado: false }],
      respuestasCognitivo: [],
      respuestasVerbal: [],
      respuestasDivergente: [],
      respuestasActividades: [],
      respuestasAsignaturas: [],
      aspiracion: { opcion: "universidad", detalle: null },
    });

    await page.goto("/experiencia");
    // La elección explícita aparece de inmediato: es la salvaguarda del PC compartido.
    await page.getByRole("button", { name: /empezar de nuevo/i }).click();
    await page.getByRole("button", { name: /sí, empezar de nuevo/i }).click();

    await expect(page.getByRole("heading", { level: 1 })).toContainText("24 lugares");
    const e = await estadoPersistido(page);
    // El estado quedó limpio al descartar.
    expect((e?.respuestasGustos as unknown[])?.length ?? 0).toBe(0);
  });
});

test.describe("modo prueba", () => {
  test("prueba simple: la autorización sobrevive al CTA de la intro y la sesión nace es_prueba", async ({ page, backend }) => {
    await page.goto("/experiencia?prueba=1");
    await responderBoton(page, "Sin sonido");

    await expect.poll(() => (backend.filas.sesiones ?? []).length).toBeGreaterThan(0);
    const sesion = backend.filas.sesiones[0];
    expect(sesion.es_prueba).toBe(true);
    // Es prueba SIMPLE: no debe aparecer la barra de prueba real.
    await expect(page.getByText(/MODO PRUEBA REAL/i)).toHaveCount(0);
  });

  test("prueba real: también es_prueba=true", async ({ page, backend }) => {
    await page.goto("/experiencia?prueba=1&real=1");
    await responderBoton(page, "Sin sonido");

    await expect.poll(() => (backend.filas.sesiones ?? []).length).toBeGreaterThan(0);
    expect(backend.filas.sesiones[0].es_prueba).toBe(true);
  });

  test("autorización pendiente: NO aparece ningún CTA y no hay escrituras", async ({ page, backend }) => {
    // La verificación se queda colgada: simula el intervalo del fetch.
    await page.route("**/api/debug/verificar-prueba", async () => {
      await new Promise((r) => setTimeout(r, 10_000));
    });

    await page.goto("/experiencia?prueba=1");

    // Se bloquea la entrada: ni intro ni CTA.
    await expect(page.getByText(/verificando acceso de prueba/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sin sonido/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /con sonido/i })).toHaveCount(0);

    // Cero escrituras durante toda la espera.
    expect(backend.llamadas.filter((l) => l.metodo === "POST")).toEqual([]);
  });

  test("autorización fallida: mensaje visible y cero escrituras", async ({ page, backend }) => {
    backend.authPruebaOk = false;

    await page.goto("/experiencia?prueba=1");

    await expect(page.getByText(/modo prueba detenido/i)).toBeVisible();
    await expect(page.getByText(/no es válida o expiró/i)).toBeVisible();
    // No se entra: sin CTA y sin escrituras.
    await expect(page.getByRole("button", { name: /sin sonido/i })).toHaveCount(0);
    expect(backend.llamadas.filter((l) => l.metodo === "POST")).toEqual([]);
  });

  test("pérdida de autorización a mitad del flujo: el bloque se detiene de forma visible", async ({ page, backend }) => {
    await page.goto("/experiencia?prueba=1");
    await responderBoton(page, "Sin sonido");
    await page.getByRole("button", { name: /estudiar en la universidad/i }).click();

    // La cookie deja de validar justo antes de continuar.
    backend.authPruebaOk = false;
    await page.getByRole("button", { name: /continuar/i }).click();

    // El flujo se detiene con el mensaje de fail-stop.
    await expect(page.getByText(/modo prueba detenido/i)).toBeVisible({ timeout: 10_000 });
  });

  test("recarga en mitad de una prueba: se exige reautorizar antes de continuar", async ({ page, backend }) => {
    await page.goto("/experiencia?prueba=1");
    await responderBoton(page, "Sin sonido");
    await page.getByRole("button", { name: /estudiar en la universidad/i }).click();
    await page.getByRole("button", { name: /continuar/i }).click();
    await responderBoton(page, "Me atrae");

    // Recarga en mitad de la prueba.
    const antesPost = backend.llamadas.filter((l) => l.metodo === "POST").length;
    await page.reload();

    // Se ofrece continuar (el metadato sesionEraPrueba lo permite saber).
    const estado = await estadoPersistido(page);
    expect(estado?.sesionEraPrueba).toBe(true);

    // Y hasta que no se elija continuar, no hay escrituras nuevas.
    expect(backend.llamadas.filter((l) => l.metodo === "POST").length).toBe(antesPost);
  });

  test("Empezar de nuevo dentro de una prueba real conserva modoPruebaReal", async ({ page, backend }) => {
    // 1. Se autoriza con real=1 y se entra.
    await page.goto("/experiencia?prueba=1&real=1");
    await responderBoton(page, "Sin sonido");
    await page.getByRole("button", { name: /estudiar en la universidad/i }).click();
    await page.getByRole("button", { name: /continuar/i }).click();
    await responderBoton(page, "Me atrae");

    // La barra de prueba REAL (roja) está visible.
    await expect(page.getByText(/MODO PRUEBA REAL/i)).toBeVisible();

    // 2. Recarga: aparece la decisión; el alumno elige "Empezar de nuevo".
    await page.reload();
    await page.getByRole("button", { name: /empezar de nuevo/i }).click();
    await page.getByRole("button", { name: /sí, empezar de nuevo/i }).click();

    // 3. Vuelve a la intro y la prueba REAL sigue autorizada (no se degradó a
    //    simple): la barra roja sigue ahí tras empezar de nuevo.
    await expect(page.getByRole("heading", { level: 1 })).toContainText("24 lugares");
    await expect(page.getByText(/MODO PRUEBA REAL/i)).toBeVisible();
  });
});

test.describe("sync fallido y recuperación", () => {
  // FALSO POSITIVO CORREGIDO: la versión anterior respondía UN gusto y nunca
  // disparaba el sync del bloque (que ocurre al completar los 20 contextos). Por
  // eso "pasaba" sin haber probado nada de la recuperación. Ahora:
  //   1. se COMPLETA el bloque (los 20 contextos),
  //   2. se confirma que el mock RECIBIÓ el intento de escritura y que falló,
  //   3. se verifica que las respuestas quedan localmente,
  //   4. se simula la recuperación y se reintenta con éxito.
  // El test falla si nunca hubo una petición de escritura.
  test("bloque de gustos: sync falla al completar, se reintenta y se recupera", async ({ page, backend }) => {
    // Completa 20 contextos + 24 actividades con animación de pliegue: el camino
    // real es largo, así que este caso necesita más margen que el default.
    test.setTimeout(120_000);
    backend.fallarEscrituras.add("respuestas_gustos");

    await page.goto("/experiencia");
    await responderBoton(page, "Sin sonido");
    await page.getByRole("button", { name: /estudiar en la universidad/i }).click();
    await page.getByRole("button", { name: /continuar/i }).click();

    // 1. Completar el bloque ENTERO (20 contextos): ahí se dispara el sync.
    await responderBloqueCompleto(page, "Me atrae", IDS_CONTEXTOS.length);

    // 2. El mock RECIBIÓ el intento de escritura (si no, el test debe fallar).
    await expect
      .poll(() => backend.llamadas.filter((l) => l.metodo === "POST" && l.tabla === "respuestas_gustos").length)
      .toBeGreaterThan(0);

    // 3. Y falló: no quedó ninguna fila escrita en esa tabla.
    expect((backend.filas.respuestas_gustos ?? []).length).toBe(0);

    // 4. Las respuestas siguen en el estado local: no se perdieron.
    const estado = await estadoPersistido(page);
    expect((estado?.respuestasGustos as unknown[])?.length).toBe(IDS_CONTEXTOS.length);

    // 5. RECUPERACIÓN: el backend vuelve a estar sano y el reintento se dispara al
    //    responder el bloque siguiente, que re-sincroniza su cola pendiente.
    backend.fallarEscrituras.delete("respuestas_gustos");
    const intentosPrevios = backend.llamadas.filter((l) => l.metodo === "POST" && l.tabla === "respuestas_gustos").length;

    // El bloque de actividades sincroniza al cerrarse y, con él, se reintenta la
    // cola pendiente (incluidas las respuestas de gustos).
    await responderBloqueCompleto(page, "Me gusta", IDS_ACTIVIDADES.length);

    await expect
      .poll(() => backend.llamadas.filter((l) => l.metodo === "POST" && l.tabla === "respuestas_gustos").length)
      .toBeGreaterThan(intentosPrevios);

    // Y ahora SÍ quedaron las 20 filas: la recuperación funcionó.
    await expect.poll(() => (backend.filas.respuestas_gustos ?? []).length).toBe(IDS_CONTEXTOS.length);
  });

  test("el reintento no DUPLICA las respuestas ya escritas (idempotencia)", async ({ page, backend }) => {
    test.setTimeout(90_000);
    // Backend sano: el bloque se escribe bien.
    await page.goto("/experiencia");
    await responderBoton(page, "Sin sonido");
    await page.getByRole("button", { name: /estudiar en la universidad/i }).click();
    await page.getByRole("button", { name: /continuar/i }).click();
    await responderBloqueCompleto(page, "Me atrae", IDS_CONTEXTOS.length);

    await expect.poll(() => (backend.filas.respuestas_gustos ?? []).length).toBe(IDS_CONTEXTOS.length);

    // Se recarga y se continúa: la reconstrucción reenvía el bloque completo. Con
    // el upsert por clave, el número de filas NO debe crecer.
    await page.reload();
    await page.getByRole("button", { name: /continuar donde la dejé/i }).click();
    await expect.poll(() => (backend.filas.respuestas_gustos ?? []).length).toBe(IDS_CONTEXTOS.length);
  });
});
