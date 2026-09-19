import { test, expect } from "./fixtures";

// INTEGRACIÓN SUPABASE REAL — NO es E2E de navegador.
//
// Aclaración importante (antes estaban mal nombradas como "E2E @real"): estos casos
// llaman a @supabase/supabase-js DIRECTAMENTE, sin `page`, sin navegador y sin la
// aplicación. Son pruebas de INTEGRACIÓN DEL ESQUEMA: comprueban que las tablas,
// constraints y RPC realmente existen y se comportan como el código espera.
//
// El smoke que SÍ es E2E de navegador (page → UI → Supabase) vive en
// e2e/real-smoke.spec.ts.
//
// Requisitos: un proyecto Supabase de TEST. `globalSetup` (e2e/guardaProduccion.ts)
// ABORTA la corrida si las credenciales apuntan a producción.
//
// DATOS: todas las filas se crean con `es_prueba = true` y se limpian en `finally`.
// El RPC de auditoría (00019) NO permite borrar sus registros desde el cliente, así
// que esos quedan en el proyecto de staging — ver la nota al final del archivo.

const T = 30_000;

async function clienteNuevo() {
  const { createClient } = await import("@supabase/supabase-js");
  const cliente = createClient(process.env.E2E_SUPABASE_URL as string, process.env.E2E_SUPABASE_ANON_KEY as string, {
    auth: { persistSession: false },
  });
  const { error } = await cliente.auth.signInAnonymously();
  if (error) throw new Error(`No se pudo crear la sesión anónima: ${error.message}`);
  return cliente;
}

/**
 * Borra una sesión de prueba exigiendo que REALMENTE se elimine.
 *
 * POR QUÉ: sin política RLS `FOR DELETE`, PostgREST afecta 0 filas y devuelve
 * `error = null`. Un `await delete()` daba "éxito" sin borrar nada, y así se
 * acumularon 17 sesiones `es_prueba = true` en staging (2026-09-19). Esta función
 * usa `.select("id")` para RECIBIR las filas afectadas y falla si no es exactamente 1.
 *
 * Requiere la migración 00023 (política de DELETE para sesiones propias de prueba).
 */
async function borrarSesionDePrueba(
  cliente: Awaited<ReturnType<typeof clienteNuevo>>,
  id: string
): Promise<void> {
  const { data, error } = await cliente.from("sesiones").delete().eq("id", id).select("id");

  if (error) {
    throw new Error(`delete de ${id.slice(0, 8)}… falló: ${error.code} ${error.message}`);
  }
  if (!data || data.length !== 1 || data[0]?.id !== id) {
    // Dos causas posibles, ambas graves:
    //   * falta la política DELETE (00023) → RLS afecta 0 filas en silencio;
    //   * la fila no era de este usuario o no era es_prueba=true.
    // En ambos casos la sesión QUEDA en la base: se reporta como fuga, no como éxito.
    throw new Error(
      `delete de ${id.slice(0, 8)}… afectó ${data?.length ?? 0} filas (se esperaba 1). ` +
        `¿Falta la política DELETE de la migración 00023? La sesión quedó SIN BORRAR.`
    );
  }
}

/** Crea una sesión padre de prueba y devuelve limpieza para `finally`. */
async function conSesionDePrueba(cliente: Awaited<ReturnType<typeof clienteNuevo>>) {
  const id = crypto.randomUUID();
  const { error } = await cliente.from("sesiones").insert({ id, dispositivo: "e2e-integracion", es_prueba: true });
  if (error) throw new Error(`No se pudo crear la sesión de prueba: ${error.message}`);
  return {
    id,
    limpiar: async () => {
      // Verificación ESTRICTA: exige que se borre 1 fila. `ON DELETE CASCADE`
      // arrastra las hijas. Si no borra, LANZA (no se traga la fuga).
      await borrarSesionDePrueba(cliente, id);
    },
  };
}

test.describe("integración Supabase real (esquema, RPC y RLS)", () => {
  test.describe.configure({ mode: "serial" });

  test("a) crea la sesión padre con es_prueba=true y la lee de vuelta", async () => {
    test.setTimeout(T);
    const cliente = await clienteNuevo();
    let limpiar = async () => {};
    try {
      const sesion = await conSesionDePrueba(cliente);
      limpiar = sesion.limpiar;

      const { data, error } = await cliente.from("sesiones").select("id,es_prueba").eq("id", sesion.id).maybeSingle();
      expect(error).toBeNull();
      expect(data?.id).toBe(sesion.id);
      expect(data?.es_prueba).toBe(true);
    } finally {
      await limpiar();
      await cliente.auth.signOut({ scope: "local" }).catch(() => undefined);
    }
  });

  test("b) la escritura repetida de un bloque es IDEMPOTENTE (requiere 00020)", async () => {
    test.setTimeout(T);
    const cliente = await clienteNuevo();
    let limpiar = async () => {};
    try {
      const sesion = await conSesionDePrueba(cliente);
      limpiar = sesion.limpiar;

      const fila = {
        session_id: sesion.id,
        contexto_id: "tec-01",
        valor: 2,
        latencia_ms: null,
        ayuda_abierta: false,
        audio_activado: false,
      };

      const r1 = await cliente.from("respuestas_gustos").upsert([fila], { onConflict: "session_id,contexto_id" });
      if (r1.error?.code === "42P10") {
        throw new Error("Falta el índice único de la migración 00020 (42P10): aplicar antes de correr esto.");
      }
      expect(r1.error, `1ª escritura: ${r1.error?.message}`).toBeNull();

      const r2 = await cliente.from("respuestas_gustos").upsert([fila], { onConflict: "session_id,contexto_id" });
      expect(r2.error, `2ª escritura: ${r2.error?.message}`).toBeNull();

      const { data } = await cliente.from("respuestas_gustos").select("id,valor").eq("session_id", sesion.id).eq("contexto_id", "tec-01");
      // Repetir NO duplica y conserva el valor.
      expect(data?.length).toBe(1);
      expect(data?.[0]?.valor).toBe(2);
    } finally {
      await limpiar();
      await cliente.auth.signOut({ scope: "local" }).catch(() => undefined);
    }
  });

  test("c) RPC verbal: 'actualizado' → 'ya_evaluado' → 'inexistente', sin pisar la evaluación", async () => {
    test.setTimeout(T);
    const cliente = await clienteNuevo();
    let limpiar = async () => {};
    try {
      const sesion = await conSesionDePrueba(cliente);
      limpiar = sesion.limpiar;

      const { data: fila, error: eIns } = await cliente
        .from("respuestas_verbal")
        .insert({ session_id: sesion.id, tarea: "comprension", texto: "texto de integración", estado: "pendiente" })
        .select("id")
        .maybeSingle();
      if (eIns?.code === "42703" || eIns?.code === "42P01") {
        throw new Error(`Faltan columnas/tabla de 00015/00018: ${eIns.message}`);
      }
      expect(eIns, `insert verbal: ${eIns?.message}`).toBeNull();

      const evaluacion = { puntaje: 4, nivel: "inferencial", fortaleza: "Claridad", area_mejora: "Profundidad" };
      const args = {
        p_id: fila?.id,
        p_evaluacion_json: evaluacion,
        p_estado: "evaluado",
        p_revision_requerida: false,
        p_acuerdo_no_disponible: false,
      };

      // ── PRIMERA llamada: debe escribir y decir 'actualizado' ──────────────
      const r1 = await cliente.rpc("actualizar_evaluacion_verbal_resultado", args);
      if (r1.error?.code === "PGRST202") {
        throw new Error("No existe actualizar_evaluacion_verbal_resultado: aplicar la migración 00021.");
      }
      expect(r1.error, `1ª llamada: ${r1.error?.message}`).toBeNull();
      expect(r1.data).toBe("actualizado");

      // ── SEGUNDA llamada sobre la MISMA fila terminal: 'ya_evaluado' ───────
      // Este es el caso que antes se reportaba como fallo y dejaba la respuesta
      // atrapada en la cola para siempre.
      const r2 = await cliente.rpc("actualizar_evaluacion_verbal_resultado", {
        ...args,
        p_evaluacion_json: { puntaje: 1 }, // intento de pisarla
      });
      expect(r2.error, `2ª llamada: ${r2.error?.message}`).toBeNull();
      expect(r2.data).toBe("ya_evaluado");

      // ── Confirma que la segunda llamada NO cambió la evaluación original ──
      const { data: guardada } = await cliente
        .from("respuestas_verbal")
        .select("estado,evaluacion_json")
        .eq("id", fila?.id)
        .maybeSingle();
      expect(guardada?.estado).toBe("evaluado");
      expect((guardada?.evaluacion_json as { puntaje?: number } | null)?.puntaje).toBe(4);

      // ── id INEXISTENTE: 'inexistente' ─────────────────────────────────────
      const r3 = await cliente.rpc("actualizar_evaluacion_verbal_resultado", { ...args, p_id: 0 });
      expect(r3.error, `id inexistente: ${r3.error?.message}`).toBeNull();
      expect(r3.data).toBe("inexistente");

      // ── OTRO USUARIO: también 'inexistente' (no filtra filas ajenas) ──────
      const otro = await clienteNuevo();
      try {
        const r4 = await otro.rpc("actualizar_evaluacion_verbal_resultado", args);
        expect(r4.error, `otro usuario: ${r4.error?.message}`).toBeNull();
        // La fila existe, pero NO es suya: se responde igual que si no existiera.
        expect(r4.data).toBe("inexistente");
      } finally {
        await otro.auth.signOut({ scope: "local" }).catch(() => undefined);
      }
    } finally {
      await limpiar();
      await cliente.auth.signOut({ scope: "local" }).catch(() => undefined);
    }
  });

  test("d) RPC de auditoría del informe: persiste y devuelve el id", async () => {
    test.setTimeout(T);
    const cliente = await clienteNuevo();
    try {
      // La migración 00019 debe devolver el id insertado para poder VERIFICAR la
      // persistencia (antes solo se comprobaba que no hubiera error, lo que no
      // demuestra que la fila exista). Ver `docs/migraciones-pendientes.md`.
      const correo = `e2e-integracion-${crypto.randomUUID()}@example.invalid`;
      const { data, error } = await cliente.rpc("registrar_envio_informe", {
        p_correo: correo,
        p_ok: true,
        p_status_http: 200,
        p_resend_id: "e2e-integracion-id",
        p_error: null,
      });

      if (error?.code === "PGRST202") {
        throw new Error("No existe registrar_envio_informe: aplicar la migración 00019.");
      }
      expect(error, `auditoría: ${error?.message}`).toBeNull();

      // La migración 00019 REVISADA devuelve `BIGINT` con el id insertado. NO se
      // acepta VOID: con VOID solo se comprobaría que la llamada no dio error, lo
      // que no demuestra que la fila exista. Si `data` es null/undefined, staging
      // NO tiene la versión correcta de la migración y este test debe FALLAR.
      //
      // Nota sobre el tipo: PostgREST serializa el BIGINT como número JSON cuando
      // cabe en el rango seguro de JS, así que se acepta `number`. Un bigint nativo
      // no aparece por JSON; si algún día se devolviera como string, esta aserción
      // lo detectaría (y habría que ajustarla a propósito).
      expect(data, "registrar_envio_informe devolvió null/undefined: staging no tiene la migración 00019 revisada (debe devolver BIGINT)").not.toBeNull();
      expect(typeof data, "el retorno debe ser un número (id insertado)").toBe("number");
      expect(Number(data), "el id insertado debe ser mayor que 0").toBeGreaterThan(0);

      // El registro de auditoría NO se puede borrar desde el cliente (sin grants de
      // DELETE): queda en el proyecto de staging con un correo `@example.invalid`
      // que lo identifica. Por eso staging debe poder resetearse.
    } finally {
      await cliente.auth.signOut({ scope: "local" }).catch(() => undefined);
    }
  });

  test("e) RLS: B no puede insertar ni actualizar en NINGUNA tabla hija de A", async () => {
    test.setTimeout(T);
    const a = await clienteNuevo();
    const b = await clienteNuevo();
    const aLimpiar: string[] = [];
    try {
      // ── DOS SESIONES DE A ─────────────────────────────────────────────────
      // `sesionValidacion`: donde A DEMUESTRA que el payload es válido.
      // `sesionObjetivo`  : donde B intenta insertar lo mismo.
      // Se usan sesiones distintas a propósito: si se usara la misma, una
      // restricción UNIQUE podría dar 23505 y el test aprobaría por el motivo
      // equivocado (no por RLS).
      const sesionValidacion = await conSesionDePrueba(a);
      const sesionObjetivo = await conSesionDePrueba(a);
      aLimpiar.push(sesionValidacion.id, sesionObjetivo.id);

      // ── PAYLOADS VÁLIDOS ──────────────────────────────────────────────────
      // Cada uno cumple los CHECK reales del esquema. `conSesion` construye la fila
      // para una sesión concreta, y `clave` permite variar el valor único cuando la
      // tabla tiene UNIQUE (evita 23505 al insertar lo mismo en otra sesión).
      const casos: Array<{
        tabla: string;
        fila: (sessionId: string, sufijo: string) => Record<string, unknown>;
      }> = [
        {
          tabla: "respuestas_gustos",
          fila: (sid, sufijo) => ({ session_id: sid, contexto_id: `tec-01-${sufijo}`, valor: 2, latencia_ms: null, ayuda_abierta: false, audio_activado: false }),
        },
        {
          tabla: "respuestas_cognitivo",
          fila: (sid, sufijo) => ({ session_id: sid, juego: "matrices", item_id: `mat-01-${sufijo}`, correcto: true, nivel: 1, duracion_ms: 900, repetido_timeout: false }),
        },
        {
          tabla: "respuestas_verbal",
          fila: (sid, sufijo) => ({ session_id: sid, tarea: "comprension", texto: `texto ${sufijo}`, estado: "pendiente", pegado: false, caracteres_pegados: 0, revision_requerida: false, intento: 1 }),
        },
        {
          // `objeto` es libre (TEXT), pero se varía para que el UNIQUE
          // (session_id, objeto) no dé 23505 entre sesiones.
          tabla: "respuestas_divergente",
          fila: (sid, sufijo) => ({ session_id: sid, objeto: `div-clip-${sufijo}`, respuestas_texto: ["idea"], cantidad: 1 }),
        },
        {
          tabla: "respuestas_actividades",
          fila: (sid, sufijo) => ({ session_id: sid, actividad_id: `act-tec-01-${sufijo}`, valor: 1 }),
        },
        {
          tabla: "respuestas_asignaturas",
          fila: (sid, sufijo) => ({ session_id: sid, asignatura_id: `asg-01-${sufijo}`, valor: 1 }),
        },
        {
          tabla: "aspiraciones",
          fila: (sid) => ({ session_id: sid, opcion: "universidad", detalle: null }),
        },
        {
          tabla: "tutorial_estado",
          fila: (sid) => ({ session_id: sid, juego: "matrices", tutorial_visto: true, practica_dominada: null, demo_loops_vistos: 0, uso_atras: 0, uso_saltar_tutorial: false }),
        },
        {
          // `perfil_json` es NOT NULL: se usa `{}` como pide la corrección.
          tabla: "resultados",
          fila: (sid) => ({ session_id: sid, perfil_json: {} }),
        },
        {
          // `estado` tiene DEFAULT y CHECK válido; se OMITE para no depender de él.
          tabla: "correos_informe",
          fila: (sid, sufijo) => ({ session_id: sid, email: `e2e-${sufijo}@example.invalid` }),
        },
      ];

      // ── 1. A DEMUESTRA que cada payload es VÁLIDO ─────────────────────────
      // Sin este paso, un test de RLS puede "aprobar" porque el payload era
      // inválido y fallaba por otra razón (CHECK, NOT NULL, tipo…).
      for (const { tabla, fila } of casos) {
        const { error } = await a.from(tabla).insert(fila(sesionValidacion.id, "validacion"));
        expect(
          error,
          `El payload de ${tabla} NO es válido (A debería poder insertarlo): ${error?.code} ${error?.message}`
        ).toBeNull();
      }

      // ── 2. B intenta insertar los MISMOS payloads válidos en la sesión de A ─
      for (const { tabla, fila } of casos) {
        const { error } = await b.from(tabla).insert(fila(sesionObjetivo.id, "ajeno"));
        expect(error, `B NO debería poder insertar en ${tabla}`).not.toBeNull();
        // Se exige ESPECÍFICAMENTE un rechazo de RLS. Cualquier otro error
        // (23505, 23514, 23502…) significaría que el test no está midiendo RLS.
        expect(
          error?.code,
          `${tabla}: se esperaba 42501 (RLS) pero llegó ${error?.code}: ${error?.message}`
        ).toBe("42501");
      }

      // ── 3. B intenta ACTUALIZAR las filas de A ────────────────────────────
      // RLS filtra en el UPDATE: 0 filas afectadas (no necesariamente error).
      const { data: actualizadas, error: eUpdate } = await b
        .from("respuestas_gustos")
        .update({ valor: 0 })
        .eq("session_id", sesionValidacion.id)
        .select("id");
      expect(eUpdate, `update ajeno: ${eUpdate?.message}`).toBeNull();
      expect(actualizadas ?? [], "B no debería haber actualizado ninguna fila de A").toHaveLength(0);

      // ── 4. A SÍ puede insertar y hacer UPSERT en lo suyo ──────────────────
      const { error: eInsertPropio } = await a.from("respuestas_gustos").insert({
        session_id: sesionObjetivo.id,
        contexto_id: "tec-99",
        valor: 2,
        latencia_ms: null,
        ayuda_abierta: false,
        audio_activado: false,
      });
      expect(eInsertPropio, `A debería poder insertar en su sesión: ${eInsertPropio?.message}`).toBeNull();

      const { error: eUpsertPropio } = await a
        .from("respuestas_gustos")
        .upsert(
          { session_id: sesionObjetivo.id, contexto_id: "tec-99", valor: 1, latencia_ms: null, ayuda_abierta: false, audio_activado: false },
          { onConflict: "session_id,contexto_id" }
        );
      if (eUpsertPropio?.code === "42P10") {
        throw new Error("Falta el índice único de 00020 (42P10): aplicar antes de correr esto.");
      }
      expect(eUpsertPropio, `A debería poder hacer upsert: ${eUpsertPropio?.message}`).toBeNull();
      // El upsert ACTUALIZÓ, no duplicó.
      const { data: filasTec99 } = await a
        .from("respuestas_gustos")
        .select("valor")
        .eq("session_id", sesionObjetivo.id)
        .eq("contexto_id", "tec-99");
      expect(filasTec99 ?? []).toHaveLength(1);
      expect(filasTec99?.[0]?.valor).toBe(1);

      // ── 5. NO quedó ninguna fila de B ─────────────────────────────────────
      // Se comprueba desde A (dueño de la sesión objetivo): si B hubiera logrado
      // escribir, A lo vería.
      for (const { tabla } of casos) {
        const { data } = await a.from(tabla).select("id").eq("session_id", sesionObjetivo.id);
        if (tabla === "respuestas_gustos") {
          // A insertó su propia fila tec-99 en la sesión objetivo: solo esa.
          expect(data ?? [], `${tabla}: solo la fila legítima de A`).toHaveLength(1);
        } else {
          expect(data ?? [], `${tabla}: B fue rechazado, no debe haber filas`).toHaveLength(0);
        }
      }

      // Y el valor de la sesión de validación NO cambió con el update de B.
      const { data: validacion } = await a
        .from("respuestas_gustos")
        .select("valor")
        .eq("session_id", sesionValidacion.id)
        .eq("contexto_id", "tec-01-validacion")
        .maybeSingle();
      expect(validacion?.valor).toBe(2);
    } finally {
      // Cleanup de TODAS las sesiones creadas, aunque una aserción haya fallado.
      // Se acumulan los errores para reportarlos juntos sin enmascarar el resultado
      // del test, pero SIN silenciarlos: una fuga de datos de prueba debe verse.
      const fallosLimpieza: string[] = [];
      for (const id of aLimpiar) {
        try {
          await borrarSesionDePrueba(a, id);
        } catch (e) {
          fallosLimpieza.push(e instanceof Error ? e.message : String(e));
        }
      }
      // FALLO DE PRUEBA, NO ADVERTENCIA: si alguna sesión quedó sin borrar, el test
      // debe quedar en ROJO. Un `console.warn` no falla el test, así que la fuga
      // quedaba invisible en el resultado.
      // `expect.soft` acumula el fallo sin lanzar, para que el bloque siga cerrando
      // las sesiones restantes y para no enmascarar el error original del test.
      if (fallosLimpieza.length > 0) {
        expect.soft(
          fallosLimpieza,
          `FUGA en la limpieza: ${fallosLimpieza.length} sesión(es) de prueba quedaron en staging:\n  ` +
            fallosLimpieza.join("\n  ")
        ).toHaveLength(0);
      }
      await a.auth.signOut({ scope: "local" }).catch(() => undefined);
      await b.auth.signOut({ scope: "local" }).catch(() => undefined);
    }
  });
});

// NOTA SOBRE LIMPIEZA (honestidad sobre lo que NO se limpia):
//   * sesiones y sus hijas (respuestas_*) → se borran en `finally` (CASCADE).
//   * envios_otp → lo escribe el RPC de rate limit; no hay DELETE para el cliente.
//   * envios_informe_permanente → igual: sin grants de DELETE.
//   * usuarios anónimos → NO se pueden borrar desde el cliente.
// Por eso estos tests DEBEN correr contra un proyecto de STAGING que se pueda
// resetear, nunca contra producción. La guarda de `globalSetup` lo impone.
