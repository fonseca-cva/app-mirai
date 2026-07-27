-- ANONYMOUS AUTH + RLS POR auth.uid() — Fase 3
-- Decisión de Camilo: la seguridad la da auth.uid(), no current_setting('app.session_id').
-- session_id sigue existiendo como identificador de negocio (cookie de 7 días), pero
-- deja de ser la base de las políticas RLS.
--
-- No existe ningún RPC set_session_context en este repo (nunca se llegó a implementar,
-- solo estaba mencionado en comentarios) — no hay nada que eliminar en ese sentido.

-- ── sesiones ───────────────────────────────────────────────────────
ALTER TABLE sesiones ADD COLUMN user_id UUID NOT NULL DEFAULT auth.uid();

DROP POLICY IF EXISTS "Sesión: insert propia" ON sesiones;
DROP POLICY IF EXISTS "Sesión: read propia" ON sesiones;

CREATE POLICY "Sesión: select propia (auth)"
  ON sesiones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Sesión: insert propia (auth)"
  ON sesiones FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Sesión: update propia (auth)"
  ON sesiones FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── respuestas_gustos ──────────────────────────────────────────────
ALTER TABLE respuestas_gustos ADD COLUMN user_id UUID NOT NULL DEFAULT auth.uid();

DROP POLICY IF EXISTS "Gustos: insert propia" ON respuestas_gustos;
DROP POLICY IF EXISTS "Gustos: read propia" ON respuestas_gustos;

CREATE POLICY "Gustos: select propia (auth)"
  ON respuestas_gustos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Gustos: insert propia (auth)"
  ON respuestas_gustos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Gustos: update propia (auth)"
  ON respuestas_gustos FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── respuestas_cognitivo ───────────────────────────────────────────
ALTER TABLE respuestas_cognitivo ADD COLUMN user_id UUID NOT NULL DEFAULT auth.uid();

DROP POLICY IF EXISTS "Cognitivo: insert propia" ON respuestas_cognitivo;
DROP POLICY IF EXISTS "Cognitivo: read propia" ON respuestas_cognitivo;

CREATE POLICY "Cognitivo: select propia (auth)"
  ON respuestas_cognitivo FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Cognitivo: insert propia (auth)"
  ON respuestas_cognitivo FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Cognitivo: update propia (auth)"
  ON respuestas_cognitivo FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── respuestas_verbal ──────────────────────────────────────────────
ALTER TABLE respuestas_verbal ADD COLUMN user_id UUID NOT NULL DEFAULT auth.uid();

DROP POLICY IF EXISTS "Verbal: insert propia" ON respuestas_verbal;
DROP POLICY IF EXISTS "Verbal: update propia" ON respuestas_verbal;
DROP POLICY IF EXISTS "Verbal: read propia" ON respuestas_verbal;

CREATE POLICY "Verbal: select propia (auth)"
  ON respuestas_verbal FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Verbal: insert propia (auth)"
  ON respuestas_verbal FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Verbal: update propia (auth)"
  ON respuestas_verbal FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── resultados ─────────────────────────────────────────────────────
ALTER TABLE resultados ADD COLUMN user_id UUID NOT NULL DEFAULT auth.uid();

DROP POLICY IF EXISTS "Resultados: insert propia" ON resultados;
DROP POLICY IF EXISTS "Resultados: read propia" ON resultados;

CREATE POLICY "Resultados: select propia (auth)"
  ON resultados FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Resultados: insert propia (auth)"
  ON resultados FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Resultados: update propia (auth)"
  ON resultados FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── correos_informe ────────────────────────────────────────────────
ALTER TABLE correos_informe ADD COLUMN user_id UUID NOT NULL DEFAULT auth.uid();

DROP POLICY IF EXISTS "Correos: insert propia" ON correos_informe;
DROP POLICY IF EXISTS "Correos: read propia" ON correos_informe;

CREATE POLICY "Correos: select propia (auth)"
  ON correos_informe FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Correos: insert propia (auth)"
  ON correos_informe FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Correos: update propia (auth)"
  ON correos_informe FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── tutorial_estado ────────────────────────────────────────────────
-- No estaba en la lista explícita de Camilo (es de la migración 00002, posterior al
-- esquema que él revisó), pero es una tabla de datos por sesión igual que las demás:
-- se incluye por consistencia, mismo patrón auth.uid() = user_id.
ALTER TABLE tutorial_estado ADD COLUMN user_id UUID NOT NULL DEFAULT auth.uid();

DROP POLICY IF EXISTS "Tutorial: insert propia" ON tutorial_estado;
DROP POLICY IF EXISTS "Tutorial: update propia" ON tutorial_estado;
DROP POLICY IF EXISTS "Tutorial: read propia" ON tutorial_estado;

CREATE POLICY "Tutorial: select propia (auth)"
  ON tutorial_estado FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Tutorial: insert propia (auth)"
  ON tutorial_estado FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Tutorial: update propia (auth)"
  ON tutorial_estado FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
