-- POLÍTICA DE ELIMINACIÓN DE SESIONES DE PRUEBA
--
-- ⚠️  NO APLICADA. Se versiona para revisión; la aplicación es decisión del fundador.
--
-- ── PROBLEMA QUE CIERRA ───────────────────────────────────────────────────────
-- No existía NINGUNA política `FOR DELETE` en el proyecto (verificado: `grep FOR
-- DELETE` sobre las 22 migraciones no devuelve nada). Con RLS habilitada y sin
-- política de DELETE, PostgREST **deniega la operación afectando 0 filas** y
-- devuelve `error = null`. Es decir: el cliente no puede distinguir "borré" de "no
-- me dejaron borrar".
--
-- Consecuencia medida en staging: 17 sesiones con `es_prueba = true` quedaron
-- acumuladas entre 2026-09-19 14:10:58+00 y 14:21:55+00, creadas por los arneses
-- E2E, cuyos `delete()` reportaban éxito sin eliminar ninguna fila.
--
-- ── ALCANCE DELIBERADAMENTE ESTRECHO ──────────────────────────────────────────
-- La política permite borrar SOLO:
--   * sesiones propias           → `auth.uid() = user_id`
--   * que sean de prueba         → `es_prueba = true`
--
-- Es decir: **ningún usuario puede borrar una sesión real desde el cliente**, ni
-- siquiera la suya. Eso protege los datos del piloto: un fallo del cliente (o un
-- `delete()` mal escrito) no puede destruir respuestas de estudiantes reales.
-- Las sesiones reales solo pueden eliminarse con service_role (operación
-- administrativa), no desde la aplicación.
--
-- Las tablas hijas NO necesitan política de DELETE: todas referencian
-- `sesiones(id) ON DELETE CASCADE`, y el CASCADE se ejecuta con los privilegios del
-- dueño de la tabla, no con los del llamador (no vuelve a pasar por RLS). Es decir:
-- borrar la sesión padre arrastra sus respuestas sin necesidad de políticas
-- adicionales en las hijas.
--
-- ── NO TOCA OTRAS POLÍTICAS ───────────────────────────────────────────────────
-- Solo AGREGA una política nueva. No hace DROP ni CREATE de ninguna otra, y no
-- modifica SELECT/INSERT/UPDATE de ninguna tabla.

-- ── sesiones: DELETE propia y SOLO si es de prueba ────────────────────────────
DROP POLICY IF EXISTS "Sesión: delete propia de prueba (auth)" ON sesiones;
CREATE POLICY "Sesión: delete propia de prueba (auth)"
  ON sesiones FOR DELETE
  USING (auth.uid() = user_id AND es_prueba = true);

COMMENT ON POLICY "Sesión: delete propia de prueba (auth)" ON sesiones IS
  'Permite borrar SOLO sesiones propias marcadas es_prueba = true. Las sesiones reales NO se pueden borrar desde el cliente (ni por su dueño): protege los datos del piloto. Las hijas se borran por ON DELETE CASCADE.';

-- ══════════════════════════════════════════════════════════════════════════
-- POR QUÉ NO HACE FALTA NADA MÁS
-- ══════════════════════════════════════════════════════════════════════════
--
-- `correos_informe`, `respuestas_*`, `aspiraciones`, `tutorial_estado` y
-- `resultados` referencian `sesiones(id) ON DELETE CASCADE` (migración 00001 y
-- siguientes). Al borrar la sesión padre, PostgreSQL elimina las filas hijas como
-- parte de la misma operación, y ese borrado en cascada NO se somete a las
-- políticas RLS de las tablas hijas. Por eso no se añaden políticas de DELETE en
-- ellas: sería ruido y ampliaría superficie sin necesidad.

-- ══════════════════════════════════════════════════════════════════════════
-- CONSULTAS DE VERIFICACIÓN (SOLO LECTURA)
-- ══════════════════════════════════════════════════════════════════════════
--
-- 1) Confirmar que la política quedó creada:
--
-- SELECT tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'sesiones' AND cmd = 'DELETE';
--
-- Debe devolver UNA fila con `qual` conteniendo:
--   (auth.uid() = user_id) AND (es_prueba = true)
--
-- 2) Inventario de las sesiones de prueba acumuladas (para limpiar A MANO, con
--    service_role, NO con este SQL):
--
-- SELECT id, creada_en, user_id, left(coalesce(dispositivo, ''), 60) AS dispositivo
-- FROM sesiones
-- WHERE es_prueba = true
-- ORDER BY creada_en DESC;
--
-- ⚠️  NO borrar todavía: primero confirmar cuáles pertenecen a corridas de prueba y
--     que no haya datos que quieras conservar para análisis del piloto.
--
-- 3) Borrado masivo de sesiones de prueba (cuando se autorice), con conteo previo:
--
-- BEGIN;
--   SELECT count(*) AS a_borrar FROM sesiones WHERE es_prueba = true;
--   DELETE FROM sesiones WHERE es_prueba = true;
--   -- Revisar el número antes de COMMIT (debe coincidir con `a_borrar`).
-- ROLLBACK;   -- cambiar a COMMIT solo tras verificar
--
-- ── ROLLBACK DE ESTA MIGRACIÓN ────────────────────────────────────────────────
-- DROP POLICY IF EXISTS "Sesión: delete propia de prueba (auth)" ON sesiones;
-- Efecto: vuelve al estado anterior. Los `delete()` de los arneses volverán a
-- reportar éxito sin borrar (el bug que esta migración corrige), pero el arnés ya
-- detecta y avisa de esa situación (ver el chequeo de filas afectadas).
