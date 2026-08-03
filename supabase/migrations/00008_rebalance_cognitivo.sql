-- REBALANCE DE LA BATERÍA COGNITIVA — TANDA A: datos y esquema
-- Plan de Camilo (5 constructos + 1 exploratorio). Aditivo y retrocompatible.
--
-- DECISIÓN DE EQUIPO (Claude + DeepSeek): 'rotacion' se mantiene como alias
-- legacy VÁLIDO en los CHECK hasta Tanda C. Motivo: entre Tanda A y Tanda C el
-- código aún escribe 'rotacion' (BloqueCognitivo.tsx / BloqueRotacion.tsx);
-- sacarlo ahora rompería sesiones nuevas. Las filas históricas SÍ se migran a
-- 'pliegues' para que el código nuevo lea un solo nombre. En Tanda C, cuando el
-- código deje de escribirlo, se quita del CHECK.

-- ── 1. respuestas_cognitivo: ampliar CHECK de juego + migrar rotacion → pliegues ──
ALTER TABLE respuestas_cognitivo DROP CONSTRAINT respuestas_cognitivo_juego_check;
ALTER TABLE respuestas_cognitivo ADD CONSTRAINT respuestas_cognitivo_juego_check
  CHECK (juego IN ('matrices','series','pliegues','secuencias','rotacion'));
  -- 'rotacion' es legacy: se elimina del CHECK en Tanda C.

UPDATE respuestas_cognitivo SET juego = 'pliegues' WHERE juego = 'rotacion';

-- ── 2. tutorial_estado: ampliar CHECK de juego + migrar rotacion → pliegues ──
ALTER TABLE tutorial_estado DROP CONSTRAINT tutorial_estado_juego_check;
ALTER TABLE tutorial_estado ADD CONSTRAINT tutorial_estado_juego_check
  CHECK (juego IN ('matrices','series','pliegues','secuencias','rotacion'));
  -- 'rotacion' es legacy: se elimina del CHECK en Tanda C.

UPDATE tutorial_estado SET juego = 'pliegues' WHERE juego = 'rotacion';

-- ── 3. respuestas_verbal: nueva tarea 'expresion' (bloque verbal ampliado) ──
ALTER TABLE respuestas_verbal DROP CONSTRAINT respuestas_verbal_tarea_check;
ALTER TABLE respuestas_verbal ADD CONSTRAINT respuestas_verbal_tarea_check
  CHECK (tarea IN ('comprension','argumentacion','expresion'));

-- ── 4. Bloque exploratorio: pensamiento divergente (usos alternativos) ──
-- EXPLORATORIO — NO REPORTAR: se mide y se guarda, NO alimenta el informe ni el
-- matching en v1. Se cruza con los demás resultados en el piloto; solo si
-- demuestra correlación se promueve a indicador oficial en v2.
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

COMMENT ON TABLE respuestas_divergente IS 'EXPLORATORIO — NO REPORTAR (pensamiento divergente, usos alternativos). No alimenta informe ni matching en v1.';

CREATE INDEX idx_rd_session ON respuestas_divergente(session_id);
ALTER TABLE respuestas_divergente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Divergente: select propia (auth)"
  ON respuestas_divergente FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Divergente: insert propia (auth)"
  ON respuestas_divergente FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Divergente: update propia (auth)"
  ON respuestas_divergente FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
