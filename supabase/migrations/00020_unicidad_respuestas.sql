-- UNICIDAD DE RESPUESTAS POR SESIÓN — pilot readiness (integridad de datos)
--
-- ⚠️  NO APLICADA A PRODUCCIÓN. Este archivo se versiona junto al cambio de
--     aplicación (lib/supabase/sync.ts) para que esquema y código viajen juntos,
--     pero la aplicación a producción es una decisión manual del fundador.
--
-- POR QUÉ: los bloques sincronizan "el bloque completo" al cerrarse. Si el POST
-- se corta después de que Postgres ya insertó (timeout de 5 s en el colegio), la
-- tarea queda en la cola y se reintenta con el MISMO payload → filas duplicadas.
-- La aplicación pasa a usar upsert con onConflict sobre estas columnas; la
-- restricción de unicidad es lo que hace que ese upsert sea determinista y lo que
-- impide que un reintento duplique aunque la app tenga un bug.
--
-- ── ORDEN OBLIGATORIO (leer antes de ejecutar) ─────────────────────────────
-- El `CREATE UNIQUE INDEX` FALLA si ya existen duplicados históricos. Antes de
-- ejecutar esto, correr la consulta de detección de duplicados (sección final) y:
--   * 0 filas  → ejecutar esta migración tal cual.
--   * >0 filas → NO ejecutar. Hay que decidir el descarte caso a caso primero
--                (esta migración no borra ni fusiona datos: no elimina datos de
--                producción, por regla).
--
-- ── VERIFICACIÓN CONTRA EL ESQUEMA REAL ────────────────────────────────────
-- Las columnas usadas acá están tomadas de las migraciones 00001, 00002, 00007,
-- 00008, 00010, 00011 y 00018, y son las mismas que exige lib/supabase/types.ts.
-- No se inventa ninguna columna. Si alguna de esas migraciones no se aplicó en
-- producción (precedente real: 00018 reparó 5 columnas de respuestas_verbal y la
-- tabla respuestas_divergente ausentes), correr primero
-- `npm run verificar-esquema` — es el chequeo reproducible de esa situación.

-- ── 1. respuestas_gustos — par (session_id, contexto_id) ───────────────────
-- contexto_id viene de lib/data/contextos.ts (migración 00001).
CREATE UNIQUE INDEX IF NOT EXISTS uq_respuestas_gustos_sesion_contexto
  ON respuestas_gustos (session_id, contexto_id);

-- ── 2. respuestas_cognitivo — terna (session_id, juego, item_id) ───────────
-- juego: 'matrices' | 'series' | 'pliegues' | 'secuencias' (CHECK de 00009).
-- item_id es el id del ítem dentro del juego; un ítem se responde una vez por
-- sesión (la repetición por timeout es la MISMA fila, con repetido_timeout=true).
CREATE UNIQUE INDEX IF NOT EXISTS uq_respuestas_cognitivo_sesion_juego_item
  ON respuestas_cognitivo (session_id, juego, item_id);

-- ── 3. respuestas_verbal — par (session_id, tarea) ────────────────────────
-- Una respuesta por tarea ('comprension' | 'argumentacion' | 'expresion').
-- El reintento tras 'no_pertinente' ACTUALIZA la misma fila vía RPC
-- actualizar_evaluacion_verbal (00016), así que el par sigue siendo único.
CREATE UNIQUE INDEX IF NOT EXISTS uq_respuestas_verbal_sesion_tarea
  ON respuestas_verbal (session_id, tarea);

-- ── 4. respuestas_actividades — par (session_id, actividad_id) ─────────────
-- actividad_id viene de lib/data/actividades.ts (migración 00010).
CREATE UNIQUE INDEX IF NOT EXISTS uq_respuestas_actividades_sesion_actividad
  ON respuestas_actividades (session_id, actividad_id);

-- ── 5. respuestas_asignaturas — par (session_id, asignatura_id) ────────────
-- asignatura_id viene de lib/data/asignaturas.ts (migración 00011).
CREATE UNIQUE INDEX IF NOT EXISTS uq_respuestas_asignaturas_sesion_asignatura
  ON respuestas_asignaturas (session_id, asignatura_id);

-- ── 6. respuestas_divergente — par (session_id, objeto) ────────────────────
-- objeto viene de lib/data/divergente.ts OBJETOS_DIVERGENTE (migración 00008,
-- recreada en 00018). Un objeto por sesión.
CREATE UNIQUE INDEX IF NOT EXISTS uq_respuestas_divergente_sesion_objeto
  ON respuestas_divergente (session_id, objeto);

-- ── Ya únicas en el esquema (no se duplican acá, se documentan) ────────────
--   aspiraciones      UNIQUE (session_id)         — 00011
--   resultados        UNIQUE (session_id)         — 00001
--   tutorial_estado   UNIQUE (session_id, juego)  — 00002
-- Estas tres ya usan upsert con el onConflict correspondiente en sync.ts.

-- ── COMMENT para dejar la intención en el esquema ──────────────────────────
COMMENT ON INDEX uq_respuestas_gustos_sesion_contexto IS
  'Idempotencia: un contexto se responde una sola vez por sesión. Habilita upsert en el reintento de sync.';
COMMENT ON INDEX uq_respuestas_cognitivo_sesion_juego_item IS
  'Idempotencia: un ítem se responde una sola vez por sesión y juego. Habilita upsert en el reintento de sync.';
COMMENT ON INDEX uq_respuestas_verbal_sesion_tarea IS
  'Idempotencia: una respuesta verbal por tarea y sesión. El reintento por no_pertinente actualiza la misma fila (RPC 00016).';
COMMENT ON INDEX uq_respuestas_actividades_sesion_actividad IS
  'Idempotencia: una actividad se responde una sola vez por sesión. Habilita upsert en el reintento de sync.';
COMMENT ON INDEX uq_respuestas_asignaturas_sesion_asignatura IS
  'Idempotencia: una asignatura se responde una sola vez por sesión. Habilita upsert en el reintento de sync.';
COMMENT ON INDEX uq_respuestas_divergente_sesion_objeto IS
  'Idempotencia: un objeto del bloque divergente se responde una sola vez por sesión. Habilita upsert en el reintento de sync.';

-- ══════════════════════════════════════════════════════════════════════════
-- CONSULTA DE DETECCIÓN DE DUPLICADOS — SOLO LECTURA, correr ANTES de aplicar
-- ══════════════════════════════════════════════════════════════════════════
-- Si esta consulta devuelve cualquier fila, NO ejecutar la migración: hay datos
-- que el índice rechazaría y hay que decidir qué hacer con ellos (a mano).
--
-- WITH dup AS (
--   SELECT 'respuestas_gustos' AS tabla, session_id, contexto_id AS clave, COUNT(*) AS n
--     FROM respuestas_gustos GROUP BY session_id, contexto_id HAVING COUNT(*) > 1
--   UNION ALL
--   SELECT 'respuestas_cognitivo', session_id, juego || '/' || item_id, COUNT(*)
--     FROM respuestas_cognitivo GROUP BY session_id, juego, item_id HAVING COUNT(*) > 1
--   UNION ALL
--   SELECT 'respuestas_verbal', session_id, tarea, COUNT(*)
--     FROM respuestas_verbal GROUP BY session_id, tarea HAVING COUNT(*) > 1
--   UNION ALL
--   SELECT 'respuestas_actividades', session_id, actividad_id, COUNT(*)
--     FROM respuestas_actividades GROUP BY session_id, actividad_id HAVING COUNT(*) > 1
--   UNION ALL
--   SELECT 'respuestas_asignaturas', session_id, asignatura_id, COUNT(*)
--     FROM respuestas_asignaturas GROUP BY session_id, asignatura_id HAVING COUNT(*) > 1
--   UNION ALL
--   SELECT 'respuestas_divergente', session_id, objeto, COUNT(*)
--     FROM respuestas_divergente GROUP BY session_id, objeto HAVING COUNT(*) > 1
-- )
-- SELECT * FROM dup ORDER BY tabla, session_id;
--
-- Nota sobre respuestas_verbal: si un mismo (session_id, tarea) tiene 2 filas por
-- el reintento tras no_pertinente, ES un duplicado y el índice lo rechazará. La
-- causa probable es que el reintento se insertó en vez de actualizar la fila; el
-- cambio de aplicación de este mismo baseline deja ese camino idempotente.
