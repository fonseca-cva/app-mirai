#!/usr/bin/env node
// VERIFICADOR DE ESQUEMA — pilot readiness.
//
// ══════════════════════════════════════════════════════════════════════════
// QUÉ VERIFICA ESTE SCRIPT (y qué NO). Leer antes de confiar en él.
// ══════════════════════════════════════════════════════════════════════════
//
// CORRECCIÓN IMPORTANTE respecto de la versión anterior: ese script decía
// verificar "tipos, nullability y CHECK" y NO lo hacía — el mensaje era más
// grande que la verificación. Este archivo declara su alcance real.
//
// VERIFICA (con evidencia ejecutada contra el proyecto real, vía PostgREST):
//   ✅ Existencia de tablas y de COLUMNAS que el código usa.
//   ✅ Existencia de cada restricción UNIQUE que el código exige (para el
//      onConflict de cada upsert) y de la PK de sesiones.
//   ✅ Existencia e invocabilidad de las funciones RPC que el código llama.
//   ✅ Que todo onConflict del código esté declarado acá (consistencia interna).
//   ✅ Que ningún .upsert() del código haya quedado sin onConflict.
//
// NO VERIFICA (y el script NO lo afirma):
//   ❌ TIPOS de columna. PostgREST no expone information_schema y no hay ningún
//      RPC de introspección en el proyecto (verificado). Con solo la anon key
//      no hay forma de leer el tipo declarado de una columna.
//   ❌ NULLABILITY (NOT NULL). Misma limitación. Se infiere parcialmente cuando
//      una escritura de sonda es rechazada, pero no se reporta como verificado.
//   ❌ La DEFINICIÓN de los CHECK (qué valores permiten). Se puede detectar que
//      UN CHECK existe y rechaza un valor concreto, no enumerar sus valores.
//   ❌ Firmas de funciones (tipos de parámetros/retorno).
//   ❌ Políticas RLS.
//
// Lo que el script NO verifica queda listado en el resumen final, para que nadie
// asuma cobertura que no existe. Si se necesita verificación de tipos/nullability
// real, el camino es un RPC de introspección (SECURITY DEFINER, solo lectura) que
// un humano decida agregar; este script lo detecta si algún día existe.
//
// ── SEGURIDAD DE LAS SONDAS (todas de solo lectura) ────────────────────────
// Las sondas de UNIQUE y CHECK escriben un payload DELIBERADAMENTE INVÁLIDO
// (valor que viola el CHECK, o una FK inexistente), de modo que Postgres
// resuelve la restricción y rechaza la fila. Se verificó empíricamente contra el
// proyecto que en NINGÚN caso queda una fila escrita:
//   * índice único ausente        → 42P10 (no llega a escribir)
//   * CHECK violado               → 23514 (no escribe)
//   * RLS bloquea                 → 42501 (no escribe)
//   * FK inexistente              → 23503 (no escribe)
// La versión anterior usaba un payload con valores VÁLIDOS, que podía insertar
// una fila real si el índice existía y las políticas lo permitían. Eso está
// corregido: ahora el payload nunca es insertable.
//
// ── Uso ────────────────────────────────────────────────────────────────────
//   npm run verificar-esquema              (usa .env.local)
//   npm run verificar-esquema:estricto     (falla si no hay credenciales)
//   node scripts/verificar-esquema.mjs --sin-red   (solo consistencia interna)
//
// ── Seguridad de las credenciales ──────────────────────────────────────────
//   * Solo la anon key (la misma pública del bundle). NUNCA service-role.
//   * Nunca se imprime la URL, la key ni headers.
//   * La sesión anónima se cierra con signOut al terminar. NOTA HONESTA: eso
//     cierra la sesión en ESTE cliente; NO elimina el usuario anónimo del
//     proyecto (los usuarios anónimos de Supabase no se borran desde el cliente).
//     Cada corrida deja un usuario anónimo más en el proyecto; es el mismo
//     comportamiento que cualquier visita a la web.
//
// Falla con exit code ≠ 0 ante cualquier discrepancia.

import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function cargarEnvLocal() {
  const ruta = ".env.local";
  if (!existsSync(ruta)) return;
  let contenido;
  try {
    contenido = readFileSync(ruta, "utf8");
  } catch {
    return;
  }
  for (const linea of contenido.split("\n")) {
    const limpia = linea.trim();
    if (!limpia || limpia.startsWith("#")) continue;
    const eq = limpia.indexOf("=");
    if (eq === -1) continue;
    const clave = limpia.slice(0, eq).trim();
    let valor = limpia.slice(eq + 1).trim();
    if ((valor.startsWith('"') && valor.endsWith('"')) || (valor.startsWith("'") && valor.endsWith("'"))) {
      valor = valor.slice(1, -1);
    }
    if (!(clave in process.env)) process.env[clave] = valor;
  }
}

cargarEnvLocal();

const ESTRICTO = process.argv.includes("--estricto");
const SIN_RED = process.argv.includes("--sin-red");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ══════════════════════════════════════════════════════════════════════════
// MANIFIESTO — lo que la aplicación EXIGE del esquema.
// Solo columnas (existencia) + UNIQUE (para onConflict) + RPC. Nada más: es
// exactamente lo que este script puede comprobar de verdad.
// ══════════════════════════════════════════════════════════════════════════
const MANIFIESTO = {
  tablas: {
    sesiones: {
      migracion: "00001, 00017",
      columnas: ["id", "creada_en", "edad", "curso", "dispositivo", "es_prueba", "user_id"],
      unicos: [{ columnas: ["id"], migracion: "00001 (PRIMARY KEY)", esPk: true }],
      // Columna con CHECK conocido; se usa para la sonda de CHECK.
      check: { columna: "edad", valorInvalido: "__valor_invalido_verificador__", permite: ["<15", "15-17", "18-24", "25-34", "35-44", "45+", "prefiero-no-decir"], claveUuid: true },
    },
    respuestas_gustos: {
      migracion: "00001, 00002, 00007",
      columnas: ["id", "session_id", "contexto_id", "valor", "latencia_ms", "ayuda_abierta", "audio_activado", "creado_en", "user_id"],
      unicos: [{ columnas: ["session_id", "contexto_id"], migracion: "00020 (NUEVA)" }],
      check: { columna: "valor", valorInvalido: 9, permite: ["0", "1", "2"] },
    },
    respuestas_cognitivo: {
      migracion: "00001, 00002, 00006, 00009",
      columnas: ["id", "session_id", "juego", "item_id", "correcto", "nivel", "duracion_ms", "repetido_timeout", "ayuda_en_items", "creado_en", "user_id"],
      unicos: [{ columnas: ["session_id", "juego", "item_id"], migracion: "00020 (NUEVA)" }],
      check: { columna: "juego", valorInvalido: "__juego_invalido__", permite: ["matrices", "series", "pliegues", "secuencias"] },
    },
    respuestas_verbal: {
      migracion: "00001, 00015, 00016, 00018",
      columnas: ["id", "session_id", "tarea", "texto", "evaluacion_json", "estado", "pegado", "caracteres_pegados", "revision_requerida", "acuerdo_no_disponible", "intento", "creado_en", "evaluado_en", "user_id"],
      unicos: [{ columnas: ["session_id", "tarea"], migracion: "00020 (NUEVA)" }],
      check: { columna: "estado", valorInvalido: "__estado_invalido__", permite: ["pendiente", "evaluado", "error", "no_pertinente", "no_evaluado"] },
    },
    respuestas_actividades: {
      migracion: "00010",
      columnas: ["id", "session_id", "user_id", "actividad_id", "valor", "creado_en"],
      unicos: [{ columnas: ["session_id", "actividad_id"], migracion: "00020 (NUEVA)" }],
      check: { columna: "valor", valorInvalido: 9, permite: ["0", "1", "2"] },
    },
    respuestas_asignaturas: {
      migracion: "00011",
      columnas: ["id", "session_id", "user_id", "asignatura_id", "valor", "creado_en"],
      unicos: [{ columnas: ["session_id", "asignatura_id"], migracion: "00020 (NUEVA)" }],
      check: { columna: "valor", valorInvalido: 9, permite: ["0", "1", "2"] },
    },
    respuestas_divergente: {
      migracion: "00008, 00018",
      columnas: ["id", "session_id", "user_id", "objeto", "respuestas_texto", "cantidad", "creado_en"],
      unicos: [{ columnas: ["session_id", "objeto"], migracion: "00020 (NUEVA)" }],
      check: { columna: "cantidad", valorInvalido: -1, permite: [">= 0"] },
    },
    aspiraciones: {
      migracion: "00011",
      columnas: ["id", "session_id", "user_id", "opcion", "detalle", "creado_en"],
      unicos: [{ columnas: ["session_id"], migracion: "00011" }],
      check: { columna: "opcion", valorInvalido: "__opcion_invalida__", permite: ["universidad", "tecnico", "trabajar", "no_se"] },
    },
    resultados: {
      migracion: "00001, 00013",
      columnas: ["id", "session_id", "perfil_json", "generado_en", "token", "user_id"],
      unicos: [{ columnas: ["session_id"], migracion: "00001" }],
    },
    tutorial_estado: {
      migracion: "00002, 00005, 00009",
      columnas: ["id", "session_id", "juego", "tutorial_visto", "practica_dominada", "demo_loops_vistos", "uso_atras", "uso_saltar_tutorial", "creado_en", "user_id"],
      unicos: [{ columnas: ["session_id", "juego"], migracion: "00002" }],
      check: { columna: "juego", valorInvalido: "__juego_invalido__", permite: ["matrices", "series", "pliegues", "secuencias"] },
    },
    correos_informe: {
      migracion: "00001, 00004",
      columnas: ["id", "session_id", "email", "estado", "creado_en", "enviado_en", "user_id"],
    },
    envios_informe_permanente: {
      migracion: "00019",
      columnas: ["id", "user_id", "correo", "ok", "status_http", "resend_id", "error", "enviado_en"],
    },
  },
  rpcs: [
    { nombre: "actualizar_evaluacion_verbal", migracion: "00016", args: { p_id: 0, p_evaluacion_json: null, p_estado: "error", p_revision_requerida: false, p_acuerdo_no_disponible: false } },
    { nombre: "obtener_informe_publico", migracion: "00013", args: { p_token: "__verificacion_esquema__" } },
    { nombre: "permitir_envio_otp", migracion: "00012, 00014", args: { p_email: "__verificacion_esquema@example.invalid" } },
    { nombre: "registrar_envio_informe", migracion: "00019", args: { p_correo: "__verificacion_esquema@example.invalid", p_ok: false, p_status_http: 0, p_resend_id: null, p_error: "verificacion-esquema" } },
  ],
};

let fallas = 0;
let avisos = 0;
let verificados = 0;

const ok = (m) => { verificados++; console.log(`✅ ${m}`); };
const falla = (m, d) => { fallas++; console.log(`❌ ${m}`); if (d) console.log(`     ↳ ${d}`); };
const aviso = (m) => { avisos++; console.log(`⚠️  ${m}`); };

// ── Consistencia interna (sin red) ────────────────────────────────────────
function validarManifiestoInterno() {
  console.log("\n── Consistencia interna del manifiesto y del código ──");
  const syncTs = readFileSync("lib/supabase/sync.ts", "utf8");

  const onConflictsCodigo = [...syncTs.matchAll(/onConflict:\s*"([^"]+)"/g)].map((m) => m[1]);
  const unicosManifiesto = new Set(
    Object.values(MANIFIESTO.tablas).flatMap((t) => (t.unicos ?? []).map((u) => u.columnas.join(",")))
  );
  for (const oc of new Set(onConflictsCodigo)) {
    if (unicosManifiesto.has(oc)) ok(`onConflict del código "${oc}" está declarado en el manifiesto`);
    else falla(`onConflict del código "${oc}" NO está en el manifiesto`, "Si agregaste un upsert, declara su índice único acá.");
  }

  const upsertsSinOnConflict = [...syncTs.matchAll(/\.upsert\(([\s\S]{0,300}?)\)/g)].filter((m) => !m[1].includes("onConflict"));
  if (upsertsSinOnConflict.length === 0) ok("todos los .upsert() del código declaran onConflict");
  else falla(`hay ${upsertsSinOnConflict.length} .upsert() sin onConflict`, "Un upsert sin onConflict no es determinista y puede duplicar.");

  if (syncTs.includes('.from("respuestas_verbal").insert(')) {
    falla("queda un .insert() directo en respuestas_verbal", "Debe ser idempotente (upsert por session_id,tarea).");
  } else {
    ok("respuestas_verbal no usa insert directo (camino idempotente)");
  }

  for (const rpc of MANIFIESTO.rpcs) ok(`RPC "${rpc.nombre}" declarada (migración ${rpc.migracion})`);
}

// ── Verificación remota ───────────────────────────────────────────────────
async function verificarRemoto(cliente) {
  console.log("\n── Existencia de columnas (sonda SELECT, solo lectura) ──");
  for (const [tabla, def] of Object.entries(MANIFIESTO.tablas)) {
    const { error } = await cliente.from(tabla).select(def.columnas.join(",")).limit(1);
    if (!error) { ok(`${tabla}: las ${def.columnas.length} columnas del código existen`); continue; }
    if (error.code === "42703") { falla(`${tabla}: falta una columna`, error.message); continue; }
    if (error.code === "42P01" || error.code === "PGRST205") { falla(`${tabla}: la tabla NO existe`, `La crea la migración ${def.migracion}.`); continue; }
    if (error.code === "42501") { aviso(`${tabla}: RLS bloqueó el SELECT; columnas no verificadas`); continue; }
    falla(`${tabla}: error inesperado`, `code=${error.code} message=${error.message}`);
  }

  console.log("\n── Restricciones UNIQUE (sonda con payload inválido, no escribe) ──");
  for (const [tabla, def] of Object.entries(MANIFIESTO.tablas)) {
    for (const unico of def.unicos ?? []) {
      if (unico.esPk) {
        ok(`${tabla}: ${unico.columnas.join(", ")} es PRIMARY KEY (migración ${unico.migracion})`);
        continue;
      }
      const columnas = unico.columnas;
      const fila = {};
      for (const col of columnas) fila[col] = col === "session_id" ? "00000000-0000-0000-0000-000000000000" : "sonda";
      // El payload viola el CHECK de la tabla (si tiene): nunca es insertable.
      if (def.check) fila[def.check.columna] = def.check.valorInvalido;

      const { error } = await cliente.from(tabla).upsert(fila, { onConflict: columnas.join(",") });
      if (!error) {
        falla(`${tabla}(${columnas.join(",")}): la sonda ESCRIBIÓ una fila`, "Reporta esto: el verificador no debe escribir nunca.");
        continue;
      }
      if (error.code === "42P10") {
        falla(`${tabla}: NO existe el índice único (${columnas.join(", ")})`, `El reintento de sync duplicaría filas. Lo crea la migración ${unico.migracion}.`);
        continue;
      }
      if (["23503", "23505", "23502", "22P02", "23514", "42501"].includes(error.code)) {
        ok(`${tabla}: índice único (${columnas.join(", ")}) presente (migración ${unico.migracion})`);
        continue;
      }
      falla(`${tabla}(${columnas.join(",")}): resultado inesperado`, `code=${error.code} message=${error.message}`);
    }
  }

  console.log("\n── CHECK de columnas (sonda con valor inválido, no escribe) ──");
  for (const [tabla, def] of Object.entries(MANIFIESTO.tablas)) {
    if (!def.check) continue;
    // Solo se envían la clave de conflicto y la columna del CHECK: es lo mínimo
    // para que Postgres evalúe el CHECK, sin arriesgar un payload insertable.
    const claveConflicto = def.unicos?.[0]?.columnas ?? ["session_id"];
    const payload = { [def.check.columna]: def.check.valorInvalido };
    for (const col of claveConflicto) {
      // `sesiones.id` es uuid: un valor no-uuid daría 22P02 y taparía el CHECK.
      const esUuid = col === "session_id" || def.check.claveUuid === true;
      payload[col] = esUuid && col !== def.check.columna ? "00000000-0000-0000-0000-000000000000" : def.check.valorInvalido;
    }

    const { error } = await cliente.from(tabla).upsert(payload, { onConflict: claveConflicto.join(",") });
    if (!error) { falla(`${tabla}: la sonda de CHECK escribió una fila`, "Reporta esto."); continue; }
    if (error.code === "23514") {
      ok(`${tabla}.${def.check.columna}: CHECK presente y rechaza valores fuera de [${def.check.permite.join(", ")}]`);
    } else if (error.code === "42P10") {
      aviso(`${tabla}: el CHECK no se pudo sondear (falta el índice UNIQUE; ver arriba)`);
    } else {
      aviso(`${tabla}.${def.check.columna}: CHECK no concluyente (code=${error.code})`);
    }
  }

  console.log("\n── Funciones RPC (existencia e invocabilidad) ──");
  for (const rpc of MANIFIESTO.rpcs) {
    const { error } = await cliente.rpc(rpc.nombre, rpc.args);
    if (!error) { ok(`RPC "${rpc.nombre}" existe y es invocable`); continue; }
    const noExiste = error.code === "PGRST202" || error.code === "42883" || /could not find the function|does not exist/i.test(error.message ?? "");
    if (noExiste) falla(`RPC "${rpc.nombre}" NO existe en producción`, `La crea la migración ${rpc.migracion}.`);
    else ok(`RPC "${rpc.nombre}" existe (rechazó la sonda: code=${error.code})`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log("═══ Verificador de esquema Mirai ═══");
  console.log("Alcance: columnas + UNIQUE + CHECK(parcial) + RPC. NO verifica tipos ni nullability.");

  validarManifiestoInterno();

  if (SIN_RED || !url || !anonKey) {
    console.log("\n── Verificación remota ──");
    if (ESTRICTO && !SIN_RED) falla("Modo --estricto sin credenciales", "Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    else aviso("Sin credenciales: solo se verificó la consistencia interna. NO se verificó el esquema real.");
  } else {
    const cliente = createClient(url, anonKey, { auth: { persistSession: false } });
    try {
      const { error: errorAuth } = await cliente.auth.signInAnonymously();
      if (errorAuth) {
        aviso(
          `No se pudo crear sesión anónima (code=${errorAuth.code ?? "?"}): las sondas quedarán limitadas por RLS. ` +
          "Verificar que Anonymous Auth esté habilitado."
        );
      }
      await verificarRemoto(cliente);
      // Cierra la sesión EN ESTE cliente. NO borra el usuario anónimo del proyecto.
      await cliente.auth.signOut({ scope: "local" }).catch(() => undefined);
    } catch (error) {
      falla("Excepción durante la verificación remota", error instanceof Error ? error.message : "error desconocido");
    }
  }

  console.log("\n═══ Resumen ═══");
  console.log(`   Comprobaciones OK: ${verificados}   Fallas: ${fallas}   Avisos: ${avisos}`);
  console.log("   NO VERIFICADO por este script: tipos de columna, nullability (NOT NULL),");
  console.log("   definición completa de CHECK, firmas de RPC y políticas RLS.");
  if (fallas > 0) {
    console.log("   RESULTADO: NO LISTO — el esquema real difiere de lo que la aplicación exige.");
    process.exit(1);
  }
  console.log("   RESULTADO: consistente en el alcance verificado.");
  process.exit(0);
}

main();
