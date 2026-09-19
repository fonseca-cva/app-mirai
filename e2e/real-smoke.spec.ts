import { test, expect, estadoPersistido } from "./fixtures";

// SMOKE E2E REAL — navegador → aplicación → Supabase de TEST.
//
// Diferencia con `real.spec.ts`: ese llama al SDK directamente (integración de
// esquema). ESTE sí es E2E: usa `page`, abre la aplicación en el servidor local,
// interactúa con la UI como un alumno y comprueba desde otro cliente que las filas
// quedaron persistidas en Supabase.
//
// `sinMocks = true`: la interceptación está DESACTIVADA a propósito, porque lo que
// se quiere verificar es precisamente la escritura real.
//
// ── SIN CAMINOS DE FALSO VERDE ────────────────────────────────────────────────
// Este archivo NO tiene ninguna rama que apruebe sin consultar Supabase:
//   * si no se obtiene el token del alumno → FALLA (no se anota y sigue);
//   * la sesión y la aspiración se verifican OBLIGATORIAMENTE contra Supabase;
//   * se comprueba `es_prueba = true` en la FILA (no solo el flag del store).
//
// Seguridad: la sesión se crea con `es_prueba = true`, se limpia en `finally` y la
// corrida está protegida por la guarda de `globalSetup`. Ver docs/e2e.md.

const T = 60_000;

/**
 * Lee el access token de la sesión anónima que guardó el SDK en el navegador.
 *
 * CARRERA TEMPORAL (causa del fallo anterior): la aplicación usa `createClient` de
 * `@supabase/supabase-js` (no `@supabase/ssr`), así que la sesión anónima termina en
 * `localStorage` — pero se escribe DESPUÉS de que `signInAnonymously()` resuelve, que
 * ocurre dentro de `crearEnIntro()`, al crear la sesión padre. Una lectura inmediata
 * llegaba antes de que el SDK hubiera persistido el token y devolvía null.
 *
 * Por eso aquí se ESPERA (hasta 25 s) a que la clave `sb-*` exista y traiga el
 * access_token. Sin token, el poll falla y la prueba falla: sigue siendo fail-closed,
 * solo que ahora distingue "no ha llegado todavía" de "no va a llegar".
 */
async function tokenDelAlumno(page: import("@playwright/test").Page): Promise<string> {
  await expect
    .poll(
      async () =>
        await page.evaluate(() => {
          // El SDK de Supabase guarda la sesión bajo una clave que empieza por "sb-".
          for (const clave of Object.keys(window.localStorage)) {
            if (!clave.startsWith("sb-")) continue;
            const raw = window.localStorage.getItem(clave);
            if (!raw) continue;
            try {
              const parsed = JSON.parse(raw) as { access_token?: string };
              if (parsed?.access_token) return parsed.access_token;
            } catch {
              // se ignora y se sigue buscando
            }
          }
          return null;
        }),
      {
        timeout: 25_000,
        message:
          "No se obtuvo el access token del alumno desde el navegador (clave sb-* en " +
          "localStorage): sin él no se puede verificar la persistencia en Supabase. " +
          "El smoke NO puede aprobar sin consultar.",
      }
    )
    .not.toBeNull();

  // Cinturón y tirantes: el poll garantiza que existe; se relee para devolverlo tipado.
  const token = await page.evaluate(() => {
    for (const clave of Object.keys(window.localStorage)) {
      if (!clave.startsWith("sb-")) continue;
      const raw = window.localStorage.getItem(clave);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw) as { access_token?: string };
        if (parsed?.access_token) return parsed.access_token;
      } catch {
        // sigue
      }
    }
    return null;
  });
  if (!token) {
    throw new Error("El token desapareció entre el poll y la relectura.");
  }
  return token;
}

/** Cliente que opera COMO EL ALUMNO (mismo auth.uid()), para que la RLS lo deje leer. */
async function clienteComoAlumno(token: string) {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(process.env.E2E_SUPABASE_URL as string, process.env.E2E_SUPABASE_ANON_KEY as string, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

/** URL de la experiencia con la clave de prueba correctamente codificada. */
function urlExperienciaPrueba(): string {
  const clave = process.env.E2E_DEBUG_KEY as string;
  return `/experiencia?prueba=1&clave=${encodeURIComponent(clave)}`;
}

test.describe("smoke E2E real (navegador → UI → Supabase)", () => {
  // `sinMocks: true` desactiva la interceptación: la app habla con el backend real.
  test.use({ sinMocks: true });

  test("la UI autoriza la prueba, crea la sesión y persiste la aspiración verificada en Supabase", async ({ page }) => {
    test.setTimeout(T);

    // Ambas viven FUERA del try para que el `finally` pueda usarlas. Antes el token
    // se buscaba de nuevo dentro del finally y, si no aparecía, la sesión quedaba sin
    // borrar: esta variable evita esa segunda búsqueda.
    let sessionId: string | null = null;
    let token: string | null = null;

    try {
      // ── 1. Abrir la app con la clave de prueba en la URL ────────────────────
      await page.goto(urlExperienciaPrueba());

      // ── 2. La autorización debe ser ACEPTADA antes de tocar el CTA ──────────
      // Si DEBUG_KEY no está configurada en el servidor, la app muestra el
      // fail-stop "Modo prueba detenido" y este test debe fallar aquí, no seguir
      // fingiendo que probó algo.
      await expect(
        page.getByText(/modo prueba detenido/i),
        "El servidor rechazó la clave de prueba: ¿está DEBUG_KEY inyectada en el webServer?"
      ).toHaveCount(0, { timeout: 15_000 });

      // La intro aparece (autorización aceptada: no hay pantalla de bloqueo).
      await expect(page.getByRole("button", { name: "Sin sonido", exact: true })).toBeVisible({ timeout: 15_000 });

      // ── 3. Crear la sesión DESDE LA UI ──────────────────────────────────────
      // En una visita limpia no hay decisión previa; si la hubiera, se empieza de 0.
      const btnEmpezarNuevo = page.getByRole("button", { name: /empezar de nuevo/i });
      if (await btnEmpezarNuevo.isVisible().catch(() => false)) {
        await btnEmpezarNuevo.click();
      }
      await page.getByRole("button", { name: "Sin sonido", exact: true }).click();

      // ── 4. ESPERAR a que `crearEnIntro()` TERMINE ───────────────────────────
      // La pantalla de aspiración solo aparece cuando la sesión padre ya se creó y se
      // aseguró (`crearEnIntro` es async y la app avanzaba con `void`). Ese es el
      // punto de sincronización correcto: antes de que aparezca, el SDK todavía no
      // ha persistido el token y el store aún no tiene el sessionId.
      await expect(
        page.getByRole("button", { name: /estudiar en la universidad/i }),
        "No apareció la pantalla de aspiración: `crearEnIntro()` no terminó (¿falló el alta de la sesión padre?)"
      ).toBeVisible({ timeout: 30_000 });

      // El sessionId ya está en el store (no puede haber aspiración sin sesión).
      const e = await estadoPersistido(page);
      sessionId = (e?.sessionId as string | null) ?? null;
      expect(sessionId, "La app mostró la aspiración pero el store no tiene sessionId").not.toBeNull();

      // ── 5. Verificar la SESIÓN contra Supabase (obligatorio) ────────────────
      // El token se guarda en `token` (variable exterior) para reutilizarlo en el
      // `finally`: así la limpieza no depende de volver a encontrarlo.
      token = await tokenDelAlumno(page);
      const comoAlumno = await clienteComoAlumno(token);

      const { data: sesion, error: eSesion } = await comoAlumno
        .from("sesiones")
        .select("id,es_prueba")
        .eq("id", sessionId)
        .maybeSingle();

      expect(eSesion, `lectura de la sesión: ${eSesion?.message}`).toBeNull();
      expect(sesion, "La sesión NO quedó persistida en Supabase.").not.toBeNull();
      expect(sesion?.id).toBe(sessionId);
      // Se comprueba en la FILA, no en el store: es lo que garantiza que los datos
      // de prueba queden aislados de las métricas reales.
      expect(sesion?.es_prueba).toBe(true);

      // ── 6. Responder la ASPIRACIÓN desde la UI ──────────────────────────────
      await page.getByRole("button", { name: /estudiar en la universidad/i }).click();
      await page.getByRole("button", { name: /^continuar$/i }).click();

      // ── 7. Verificar la ASPIRACIÓN contra Supabase (obligatorio) ────────────
      await expect
        .poll(
          async () => {
            const { data } = await comoAlumno
              .from("aspiraciones")
              .select("opcion,session_id")
              .eq("session_id", sessionId)
              .maybeSingle();
            return data?.opcion ?? null;
          },
          { timeout: 25_000 }
        )
        .toBe("universidad");

      // Y su sesión padre es la misma que se verificó arriba.
      const { data: aspiracion } = await comoAlumno
        .from("aspiraciones")
        .select("session_id")
        .eq("session_id", sessionId)
        .maybeSingle();
      expect(aspiracion?.session_id).toBe(sessionId);
    } finally {
      // LIMPIEZA garantizada aunque falle una aserción. Se borra la sesión padre
      // (ON DELETE CASCADE arrastra la aspiración y las demás hijas).
      //
      // Se usa el `token` YA OBTENIDO, sin volver a buscarlo: la versión anterior
      // hacía una segunda lectura del storage y, si no encontraba el token (que es
      // justo lo que hizo fallar el test), NO borraba la sesión y la dejaba huérfana.
      // FALLO DE PRUEBA, NO ADVERTENCIA: si la limpieza no borra exactamente la fila
      // esperada, la prueba debe quedar en ROJO. Un `console.warn` no falla el test,
      // así que una fuga de datos de prueba quedaba invisible en el resultado.
      // Se usa `expect.soft` para NO enmascarar el error original que pudo provocar
      // el paso por el `finally`: el test sigue reportando su fallo real y ADEMÁS
      // registra la fuga.
      if (sessionId && token) {
        try {
          const limpiador = await clienteComoAlumno(token);
          // Sin política RLS `FOR DELETE`, PostgREST afecta 0 filas y devuelve
          // `error = null`: un `await delete()` reportaba éxito sin borrar nada, y
          // así se acumularon 17 sesiones `es_prueba = true` en staging. Por eso se
          // pide `.select("id")` para RECIBIR las filas afectadas y se exige
          // exactamente 1.
          const { data, error } = await limpiador.from("sesiones").delete().eq("id", sessionId).select("id");

          expect.soft(
            error,
            `No se pudo limpiar la sesión ${sessionId.slice(0, 8)}…: ${error?.code} ${error?.message}. ` +
              `La sesión quedó en staging (es_prueba=true) y hay que borrarla a mano.`
          ).toBeNull();

          if (!error) {
            expect.soft(
              data?.length ?? 0,
              `FUGA: el delete de ${sessionId.slice(0, 8)}… afectó ${data?.length ?? 0} filas ` +
                `(se esperaba 1). ¿Falta la política DELETE de la migración 00023? ` +
                `La sesión quedó en staging y hay que borrarla a mano (es_prueba=true).`
            ).toBe(1);

            expect.soft(
              data?.[0]?.id,
              `FUGA: el delete afectó una fila distinta de la esperada (${sessionId.slice(0, 8)}…).`
            ).toBe(sessionId);
          }
        } catch (e) {
          expect.soft(
            null,
            `Excepción al limpiar la sesión ${sessionId.slice(0, 8)}…: ${String(e)}. ` +
              `La sesión quedó en staging (es_prueba=true).`
          ).not.toBeNull();
        }
      } else if (sessionId && !token) {
        // Hay sesión creada pero no hubo token para borrarla: es una fuga y la
        // prueba debe fallar, no solo avisar.
        expect.soft(
          null,
          `FUGA: la sesión ${sessionId.slice(0, 8)}… quedó sin limpiar porque no se obtuvo token. ` +
            `Borrarla a mano en staging (es_prueba=true, creada por este test).`
        ).not.toBeNull();
      }
    }
  });
});

// NOTA: la verificación de `es_prueba = true` en la FILA está integrada en el caso
// de arriba (paso 4). El caso separado que solo miraba el estado local y dejaba una
// sesión sin limpiar se ELIMINÓ: no aportaba verificación real y generaba basura.
