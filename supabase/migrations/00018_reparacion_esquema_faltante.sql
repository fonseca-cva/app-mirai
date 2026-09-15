-- REPARACIÓN DE ESQUEMA — ACOTADA AL DIAGNÓSTICO 00019 (2026-09-08)
--
-- Diagnóstico (resultado de Camilo, corriendo 00019_diagnostico_esquema.sql):
--   * respuestas_divergente   → tabla COMPLETA ausente (su CREATE, migración
--     00008 sección 4, nunca se aplicó en producción).
--   * respuestas_verbal       → faltan 5 columnas: pegado, caracteres_pegados,
--     revision_requerida, intento (migración 00015) y acuerdo_no_disponible
--     (migración 00016).
--   * respuestas_cognitivo    → NO falta nada (repetido_timeout existe). Su
--     error 400 tiene otra causa (ver diagnóstico del CHECK de juego abajo).
--
-- Este script aplica EXACTAMENTE eso y nada más, como pidió Camilo. No recrea
-- tablas que ya existan, no toca constraints ya correctas, no incluye el resto
-- de columnas que SÍ están presentes en producción.
--
-- TODO idempotente (IF NOT EXISTS / CREATE TABLE IF NOT EXISTS): seguro de
-- re-ejecutar cuantas veces sea necesario.

-- ── 1. respuestas_divergente: tabla completa (migración 00008, sección 4) ──
-- Mismo patrón de RLS que 00003_anonymous_auth: user_id + auth.uid().
CREATE TABLE IF NOT EXISTS respuestas_divergente (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sesiones(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  objeto TEXT NOT NULL,
  respuestas_texto TEXT[] NOT NULL,
  cantidad SMALLINT NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rd_session ON respuestas_divergente(session_id);

ALTER TABLE respuestas_divergente ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Divergente: select propia (auth)" ON respuestas_divergente;
CREATE POLICY "Divergente: select propia (auth)"
  ON respuestas_divergente FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Divergente: insert propia (auth)" ON respuestas_divergente;
CREATE POLICY "Divergente: insert propia (auth)"
  ON respuestas_divergente FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Divergente: update propia (auth)" ON respuestas_divergente;
CREATE POLICY "Divergente: update propia (auth)"
  ON respuestas_divergente FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE respuestas_divergente IS 'EXPLORATORIO — NO REPORTAR (pensamiento divergente, usos alternativos). No alimenta informe ni matching en v1.';

-- ── 2. respuestas_verbal: las 5 columnas faltantes ──
-- pegado / caracteres_pegados / revision_requerida / intento  → migración 00015
-- acuerdo_no_disponible                                        → migración 00016

ALTER TABLE respuestas_verbal ADD COLUMN IF NOT EXISTS pegado BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE respuestas_verbal ADD COLUMN IF NOT EXISTS caracteres_pegados INTEGER NOT NULL DEFAULT 0;
ALTER TABLE respuestas_verbal ADD COLUMN IF NOT EXISTS revision_requerida BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE respuestas_verbal ADD COLUMN IF NOT EXISTS intento SMALLINT NOT NULL DEFAULT 1
  CHECK (intento IN (1, 2));
ALTER TABLE respuestas_verbal ADD COLUMN IF NOT EXISTS acuerdo_no_disponible BOOLEAN NOT NULL DEFAULT false;

-- ── 3. Diagnóstico del 400 de respuestas_cognitivo (SOLO LECTURA) ──
-- repetido_timeout EXISTE (00006 aplicada), así que el 400 no es columna
-- faltante. Sospecha de Camilo: el CHECK del juego en producción quedó
-- desactualizado. Si 00006 corrió pero 00008/00009 NO, el CHECK real sigue
-- siendo el original (00001): ('matrices','rotacion','secuencias') — sin
-- 'series' ni 'pliegues', que es lo que el código envía HOY → el INSERT con
-- juego='pliegues' o 'series' choca contra el CHECK y da 400.
-- Correr esta consulta SOLO si el 00019 vuelto a correr (tras este script)
-- devuelve 0 filas pero el 400 del cognitivo persiste:
--
--   SELECT conname, pg_get_constraintdef(oid)
--   FROM pg_constraint
--   WHERE conrelid = 'respuestas_cognitivo'::regclass
--     AND contype = 'c';
--
-- (Qn) Si muestra CHECK (juego IN ('matrices','rotacion','secuencias')),
-- confirmado: aplicar la ampliación del CHECK a
-- ('matrices','series','pliegues','secuencias') — se entrega por separado
-- para mantener este script acotado solo a lo ya diagnosticado.

-- Después de correr esto, volver a correr 00019_diagnostico_esquema.sql:
-- debería devolver 0 filas.
