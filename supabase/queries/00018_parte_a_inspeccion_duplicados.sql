-- Parte A de la futura migración de integridad de sesiones (dedup + UNIQUE +
-- trigger, prioridades (c)/(d) pendientes) — SOLO INSPECCIÓN, NO borra ni
-- modifica nada. Correr manualmente en el SQL Editor y revisar los
-- conteos/ejemplos ANTES de aprobar la Parte B.
--
-- Nota de numeración (2026-09-15): el nombre de este archivo (00018) es
-- anterior a que el número de migración 00018 se usara para
-- 00018_reparacion_esquema_faltante.sql (esquema, no dedup). Cuando se
-- escriba la migración real de dedup, el siguiente número libre es 00020.
--
-- Contexto: sesiones apiladas bajo un mismo session_id (session_id persistido
-- indefinidamente vía localStorage, sin re-minteo por experiencia) produjeron
-- múltiples respuestas para la misma clave lógica (session_id + item). Estas
-- consultas cuentan cuántas filas sobrarían si nos quedamos con la más
-- reciente (mayor creado_en, empate roto por mayor id) por clave, y muestran
-- ejemplos concretos de las sesiones más afectadas.

-- ── 1) Resumen: filas totales vs. filas que sobrevivirían al dedup, por tabla ──
SELECT 'respuestas_gustos' AS tabla,
       COUNT(*) AS filas_totales,
       COUNT(DISTINCT (session_id, contexto_id)) AS claves_unicas,
       COUNT(*) - COUNT(DISTINCT (session_id, contexto_id)) AS filas_a_eliminar
FROM respuestas_gustos
UNION ALL
SELECT 'respuestas_cognitivo',
       COUNT(*),
       COUNT(DISTINCT (session_id, juego, item_id)),
       COUNT(*) - COUNT(DISTINCT (session_id, juego, item_id))
FROM respuestas_cognitivo
UNION ALL
SELECT 'respuestas_verbal',
       COUNT(*),
       COUNT(DISTINCT (session_id, tarea)),
       COUNT(*) - COUNT(DISTINCT (session_id, tarea))
FROM respuestas_verbal
UNION ALL
SELECT 'respuestas_actividades',
       COUNT(*),
       COUNT(DISTINCT (session_id, actividad_id)),
       COUNT(*) - COUNT(DISTINCT (session_id, actividad_id))
FROM respuestas_actividades
UNION ALL
SELECT 'respuestas_asignaturas',
       COUNT(*),
       COUNT(DISTINCT (session_id, asignatura_id)),
       COUNT(*) - COUNT(DISTINCT (session_id, asignatura_id))
FROM respuestas_asignaturas
UNION ALL
SELECT 'respuestas_divergente',
       COUNT(*),
       COUNT(DISTINCT (session_id, objeto)),
       COUNT(*) - COUNT(DISTINCT (session_id, objeto))
FROM respuestas_divergente
ORDER BY filas_a_eliminar DESC;

-- ── 2) Las 15 sesiones con más filas "de sobra" en respuestas_gustos, con el
--       rango de fechas que abarcan (para ver cuántos días/experiencias se
--       apilaron bajo cada session_id) ──
SELECT session_id,
       COUNT(*) AS filas,
       COUNT(DISTINCT contexto_id) AS contextos_unicos,
       MIN(creado_en) AS primera_respuesta,
       MAX(creado_en) AS ultima_respuesta,
       MAX(creado_en) - MIN(creado_en) AS rango
FROM respuestas_gustos
GROUP BY session_id
HAVING COUNT(*) > COUNT(DISTINCT contexto_id)
ORDER BY (COUNT(*) - COUNT(DISTINCT contexto_id)) DESC
LIMIT 15;

-- ── 3) Ejemplo concreto: todas las filas de UNA clave duplicada (la peor
--       sesión de (2)), para ver exactamente qué se conservaría y qué se
--       borraría. Reemplazar '<session_id>' por el valor real de la fila 1
--       del resultado anterior antes de correr. ──
-- SELECT id, session_id, contexto_id, creado_en
-- FROM respuestas_gustos
-- WHERE session_id = '<session_id>'
-- ORDER BY contexto_id, creado_en DESC;

-- ── 4) Mismo chequeo de "sobrante" para las tablas de cognitivo y verbal,
--       mostrando las sesiones más afectadas ──
SELECT session_id,
       COUNT(*) AS filas,
       COUNT(DISTINCT (juego, item_id)) AS items_unicos,
       MIN(creado_en) AS primera_respuesta,
       MAX(creado_en) AS ultima_respuesta
FROM respuestas_cognitivo
GROUP BY session_id
HAVING COUNT(*) > COUNT(DISTINCT (juego, item_id))
ORDER BY (COUNT(*) - COUNT(DISTINCT (juego, item_id))) DESC
LIMIT 15;

SELECT session_id,
       COUNT(*) AS filas,
       COUNT(DISTINCT tarea) AS tareas_unicas,
       MIN(creado_en) AS primera_respuesta,
       MAX(creado_en) AS ultima_respuesta
FROM respuestas_verbal
GROUP BY session_id
HAVING COUNT(*) > COUNT(DISTINCT tarea)
ORDER BY (COUNT(*) - COUNT(DISTINCT tarea)) DESC
LIMIT 15;

-- ── 5) Sesiones donde el informe (resultados.generado_en) es anterior a la
--       propia sesión (sesiones.creada_en) — el síntoma exacto que reportaste ──
SELECT s.id AS session_id,
       s.creada_en AS sesion_creada_en,
       r.generado_en AS informe_generado_en,
       s.creada_en - r.generado_en AS diferencia
FROM sesiones s
JOIN resultados r ON r.session_id = s.id
WHERE r.generado_en < s.creada_en
ORDER BY diferencia DESC;

-- ── 6) Filas en respuestas_verbal por tarea y estado, para confirmar (o
--       descartar) que 'expresion' simplemente no existe aún vs. existe pero
--       nunca en 'evaluado' ──
SELECT tarea, estado, COUNT(*), MAX(creado_en) AS mas_reciente
FROM respuestas_verbal
GROUP BY tarea, estado
ORDER BY tarea, estado;

-- ── 7) Dirime la hipótesis de rechazo por RLS: para cada sesión, compara el
--       user_id dueño de la fila en `sesiones` contra el user_id de sus filas
--       en `respuestas_verbal`. Si coinciden siempre, RLS no está bloqueando
--       la escritura por dueño incorrecto (la causa está en otra parte). Si
--       aparece alguna fila con user_id distinto o nulo, ahí está la fuga ──
SELECT s.id AS session_id,
       s.user_id AS sesion_user_id,
       rv.user_id AS respuesta_user_id,
       rv.tarea,
       rv.estado,
       (s.user_id = rv.user_id) AS mismo_dueno
FROM sesiones s
JOIN respuestas_verbal rv ON rv.session_id = s.id
WHERE s.user_id IS DISTINCT FROM rv.user_id
ORDER BY s.creada_en DESC
LIMIT 30;
