-- PROPIEDAD DE LA SESIÓN PADRE EN LAS POLÍTICAS DE LAS TABLAS HIJAS
--
-- ⚠️  NO APLICADA A PRODUCCIÓN. Se versiona junto al cambio de arnés; la aplicación
--     es decisión manual del fundador.
--
-- ── PROBLEMA QUE CIERRA ───────────────────────────────────────────────────────
-- Las políticas de la migración 00003 comprueban SOLO `auth.uid() = user_id` en las
-- tablas hijas. Eso no impide esto:
--
--   1. A crea la sesión `S` (user_id = A).
--   2. B (otro alumno, su propio auth.uid()) inserta en `respuestas_gustos` una fila
--      con `session_id = S`. Su `user_id` es B, así que `auth.uid() = user_id` pasa.
--   3. La fila queda en la sesión de A, escrita por B. A la vería como propia.
--
-- Es decir: la política protege la COLUMNA user_id, pero no la RELACIÓN con la
-- sesión padre. Esta migración exige ambas cosas.
--
-- ── CAMBIO ────────────────────────────────────────────────────────────────────
-- Para cada tabla hija, INSERT y UPDATE pasan a exigir:
--   * auth.uid() = user_id                                        (lo que ya había)
--   * EXISTS (SELECT 1 FROM sesiones s
--              WHERE s.id = session_id AND s.user_id = auth.uid())  (lo que falta)
--
-- SELECT se deja IGUAL (aislado por user_id): no se amplía ni se reduce.
--
-- ── SEGURIDAD DEL CAMBIO ──────────────────────────────────────────────────────
-- * Es ADITIVA en el sentido de que no borra ni migra datos: solo reemplaza
--   políticas. No hay DROP de tablas ni de columnas.
-- * Los upserts legítimos siguen funcionando: la aplicación crea la sesión padre
--   con el MISMO auth.uid() antes de escribir cualquier hijo (garantizado por
--   `encolarSesionPadre` y `asegurarPadreEnCola`), así que el EXISTS se cumple.
-- * Antes de aplicar, se recomienda comprobar que NO existan filas cuya sesión
--   padre sea de otro usuario (consulta al final). Si las hay, son datos escritos
--   bajo la política anterior y hay que decidir qué hacer con ellos ANTES de
--   activar el CHECK: esta migración no los toca, pero quedarían invisibles para
--   el dueño de la sesión y visibles para quien los escribió.
-- * Para aplicar sin ventana de error se puede usar `NOT VALID`… pero RLS no tiene
--   esa opción (no son constraints), así que el cambio es inmediato. El código ya
--   cumple la nueva condición, así que no hay ruptura esperada.

-- ── Helper: ¿la sesión padre pertenece al usuario actual? ─────────────────────
-- Se usa una función para no repetir la subconsulta en 10 tablas × 2 políticas y
-- para que el `search_path` quede fijado. No es SECURITY DEFINER a propósito: debe
-- evaluarse con los permisos del llamador, y la propia RLS de `sesiones` ya limita
-- la lectura a las sesiones propias (así el EXISTS no puede "ver" sesiones ajenas).
CREATE OR REPLACE FUNCTION public.sesion_es_del_usuario_actual(p_session_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.sesiones s
    WHERE s.id = p_session_id
      AND s.user_id = auth.uid()
  );
$$;

COMMENT ON FUNCTION public.sesion_es_del_usuario_actual IS
  'true si la sesión indicada existe y pertenece al usuario autenticado. Usada por las políticas RLS de las tablas hijas para exigir propiedad de la sesión padre, además de user_id = auth.uid().';

GRANT EXECUTE ON FUNCTION public.sesion_es_del_usuario_actual(uuid) TO authenticated;

-- ══════════════════════════════════════════════════════════════════════════
-- Políticas: para cada tabla hija se reemplazan INSERT y UPDATE.
-- El nombre se conserva (…"insert propia (auth)"…) para no romper referencias.
-- ══════════════════════════════════════════════════════════════════════════

-- ── respuestas_gustos ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Gustos: insert propia (auth)" ON respuestas_gustos;
CREATE POLICY "Gustos: insert propia (auth)"
  ON respuestas_gustos FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.sesion_es_del_usuario_actual(session_id));

DROP POLICY IF EXISTS "Gustos: update propia (auth)" ON respuestas_gustos;
CREATE POLICY "Gustos: update propia (auth)"
  ON respuestas_gustos FOR UPDATE
  USING (auth.uid() = user_id AND public.sesion_es_del_usuario_actual(session_id))
  WITH CHECK (auth.uid() = user_id AND public.sesion_es_del_usuario_actual(session_id));

-- ── respuestas_cognitivo ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Cognitivo: insert propia (auth)" ON respuestas_cognitivo;
CREATE POLICY "Cognitivo: insert propia (auth)"
  ON respuestas_cognitivo FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.sesion_es_del_usuario_actual(session_id));

DROP POLICY IF EXISTS "Cognitivo: update propia (auth)" ON respuestas_cognitivo;
CREATE POLICY "Cognitivo: update propia (auth)"
  ON respuestas_cognitivo FOR UPDATE
  USING (auth.uid() = user_id AND public.sesion_es_del_usuario_actual(session_id))
  WITH CHECK (auth.uid() = user_id AND public.sesion_es_del_usuario_actual(session_id));

-- ── respuestas_verbal ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Verbal: insert propia (auth)" ON respuestas_verbal;
CREATE POLICY "Verbal: insert propia (auth)"
  ON respuestas_verbal FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.sesion_es_del_usuario_actual(session_id));

DROP POLICY IF EXISTS "Verbal: update propia (auth)" ON respuestas_verbal;
CREATE POLICY "Verbal: update propia (auth)"
  ON respuestas_verbal FOR UPDATE
  USING (auth.uid() = user_id AND public.sesion_es_del_usuario_actual(session_id))
  WITH CHECK (auth.uid() = user_id AND public.sesion_es_del_usuario_actual(session_id));

-- ── respuestas_divergente ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Divergente: insert propia (auth)" ON respuestas_divergente;
CREATE POLICY "Divergente: insert propia (auth)"
  ON respuestas_divergente FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.sesion_es_del_usuario_actual(session_id));

DROP POLICY IF EXISTS "Divergente: update propia (auth)" ON respuestas_divergente;
CREATE POLICY "Divergente: update propia (auth)"
  ON respuestas_divergente FOR UPDATE
  USING (auth.uid() = user_id AND public.sesion_es_del_usuario_actual(session_id))
  WITH CHECK (auth.uid() = user_id AND public.sesion_es_del_usuario_actual(session_id));

-- ── respuestas_actividades ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Actividades: insert propia (auth)" ON respuestas_actividades;
CREATE POLICY "Actividades: insert propia (auth)"
  ON respuestas_actividades FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.sesion_es_del_usuario_actual(session_id));

DROP POLICY IF EXISTS "Actividades: update propia (auth)" ON respuestas_actividades;
CREATE POLICY "Actividades: update propia (auth)"
  ON respuestas_actividades FOR UPDATE
  USING (auth.uid() = user_id AND public.sesion_es_del_usuario_actual(session_id))
  WITH CHECK (auth.uid() = user_id AND public.sesion_es_del_usuario_actual(session_id));

-- ── respuestas_asignaturas ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Asignaturas: insert propia (auth)" ON respuestas_asignaturas;
CREATE POLICY "Asignaturas: insert propia (auth)"
  ON respuestas_asignaturas FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.sesion_es_del_usuario_actual(session_id));

DROP POLICY IF EXISTS "Asignaturas: update propia (auth)" ON respuestas_asignaturas;
CREATE POLICY "Asignaturas: update propia (auth)"
  ON respuestas_asignaturas FOR UPDATE
  USING (auth.uid() = user_id AND public.sesion_es_del_usuario_actual(session_id))
  WITH CHECK (auth.uid() = user_id AND public.sesion_es_del_usuario_actual(session_id));

-- ── aspiraciones ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Aspiraciones: insert propia (auth)" ON aspiraciones;
CREATE POLICY "Aspiraciones: insert propia (auth)"
  ON aspiraciones FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.sesion_es_del_usuario_actual(session_id));

DROP POLICY IF EXISTS "Aspiraciones: update propia (auth)" ON aspiraciones;
CREATE POLICY "Aspiraciones: update propia (auth)"
  ON aspiraciones FOR UPDATE
  USING (auth.uid() = user_id AND public.sesion_es_del_usuario_actual(session_id))
  WITH CHECK (auth.uid() = user_id AND public.sesion_es_del_usuario_actual(session_id));

-- ── tutorial_estado ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Tutorial: insert propia (auth)" ON tutorial_estado;
CREATE POLICY "Tutorial: insert propia (auth)"
  ON tutorial_estado FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.sesion_es_del_usuario_actual(session_id));

DROP POLICY IF EXISTS "Tutorial: update propia (auth)" ON tutorial_estado;
CREATE POLICY "Tutorial: update propia (auth)"
  ON tutorial_estado FOR UPDATE
  USING (auth.uid() = user_id AND public.sesion_es_del_usuario_actual(session_id))
  WITH CHECK (auth.uid() = user_id AND public.sesion_es_del_usuario_actual(session_id));

-- ── resultados ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Resultados: insert propia (auth)" ON resultados;
CREATE POLICY "Resultados: insert propia (auth)"
  ON resultados FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.sesion_es_del_usuario_actual(session_id));

DROP POLICY IF EXISTS "Resultados: update propia (auth)" ON resultados;
CREATE POLICY "Resultados: update propia (auth)"
  ON resultados FOR UPDATE
  USING (auth.uid() = user_id AND public.sesion_es_del_usuario_actual(session_id))
  WITH CHECK (auth.uid() = user_id AND public.sesion_es_del_usuario_actual(session_id));

-- ── correos_informe ───────────────────────────────────────────────────────
-- También tiene session_id y user_id, y se escribe con el mismo patrón.
DROP POLICY IF EXISTS "Correos: insert propia (auth)" ON correos_informe;
CREATE POLICY "Correos: insert propia (auth)"
  ON correos_informe FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.sesion_es_del_usuario_actual(session_id));

DROP POLICY IF EXISTS "Correos: update propia (auth)" ON correos_informe;
CREATE POLICY "Correos: update propia (auth)"
  ON correos_informe FOR UPDATE
  USING (auth.uid() = user_id AND public.sesion_es_del_usuario_actual(session_id))
  WITH CHECK (auth.uid() = user_id AND public.sesion_es_del_usuario_actual(session_id));

-- ══════════════════════════════════════════════════════════════════════════
-- SELECT: SIN CAMBIOS. Las políticas de lectura siguen aisladas por user_id (00003).
-- No se amplían: `sesion_es_del_usuario_actual` solo se usa en INSERT/UPDATE.
-- ══════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════════════════════════════════════
-- CONSULTAS DE VERIFICACIÓN (SOLO LECTURA)
-- ══════════════════════════════════════════════════════════════════════════
--
-- 1) Filas EXISTENTES cuya sesión padre es de OTRO usuario (escritas bajo la
--    política anterior). Correr ANTES de aplicar: si devuelve filas, hay que
--    decidir qué hacer con ellas (esta migración no las toca).
--
-- WITH sospechosas AS (
--   SELECT 'respuestas_gustos' AS tabla, COUNT(*) AS n
--     FROM respuestas_gustos r JOIN sesiones s ON s.id = r.session_id
--    WHERE r.user_id <> s.user_id
--   UNION ALL SELECT 'respuestas_cognitivo', COUNT(*)
--     FROM respuestas_cognitivo r JOIN sesiones s ON s.id = r.session_id WHERE r.user_id <> s.user_id
--   UNION ALL SELECT 'respuestas_verbal', COUNT(*)
--     FROM respuestas_verbal r JOIN sesiones s ON s.id = r.session_id WHERE r.user_id <> s.user_id
--   UNION ALL SELECT 'respuestas_divergente', COUNT(*)
--     FROM respuestas_divergente r JOIN sesiones s ON s.id = r.session_id WHERE r.user_id <> s.user_id
--   UNION ALL SELECT 'respuestas_actividades', COUNT(*)
--     FROM respuestas_actividades r JOIN sesiones s ON s.id = r.session_id WHERE r.user_id <> s.user_id
--   UNION ALL SELECT 'respuestas_asignaturas', COUNT(*)
--     FROM respuestas_asignaturas r JOIN sesiones s ON s.id = r.session_id WHERE r.user_id <> s.user_id
--   UNION ALL SELECT 'aspiraciones', COUNT(*)
--     FROM aspiraciones r JOIN sesiones s ON s.id = r.session_id WHERE r.user_id <> s.user_id
--   UNION ALL SELECT 'tutorial_estado', COUNT(*)
--     FROM tutorial_estado r JOIN sesiones s ON s.id = r.session_id WHERE r.user_id <> s.user_id
--   UNION ALL SELECT 'resultados', COUNT(*)
--     FROM resultados r JOIN sesiones s ON s.id = r.session_id WHERE r.user_id <> s.user_id
--   UNION ALL SELECT 'correos_informe', COUNT(*)
--     FROM correos_informe r JOIN sesiones s ON s.id = r.session_id WHERE r.user_id <> s.user_id
-- )
-- SELECT * FROM sospechosas WHERE n > 0 ORDER BY tabla;
--
-- (Se espera 0 filas: la aplicación siempre crea la sesión padre con el mismo
--  auth.uid(). Si aparecen, son sesiones del modo prueba o de pruebas anteriores.)
--
-- 2) Políticas resultantes (usar tras aplicar; ver también docs/e2e.md):
--
-- SELECT tablename, policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('respuestas_gustos','respuestas_cognitivo','respuestas_verbal',
--                     'respuestas_divergente','respuestas_actividades','respuestas_asignaturas',
--                     'aspiraciones','tutorial_estado','resultados','correos_informe')
-- ORDER BY tablename, cmd;

-- ── ROLLBACK ──────────────────────────────────────────────────────────────────
-- Volver a las políticas de la migración 00003 (solo user_id): recrear cada
-- política con el `WITH CHECK`/`USING` original de 00003 y luego
--   DROP FUNCTION IF EXISTS public.sesion_es_del_usuario_actual(uuid);
-- El rollback REABRE el agujero de propiedad, así que solo debería hacerse si el
-- cambio rompiera escrituras legítimas (no se espera: el código ya cumple).
