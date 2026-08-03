-- BLOQUE A2 — ACTIVIDADES Y PASATIEMPOS (Tanda F, Pilar de Intereses)
-- 24 ítems rápidos (3 por dimensión), escala de 3 puntos: 0 = no me gusta,
-- 1 = indiferente, 2 = me gusta. Una tarjeta por pantalla, ~2 min el bloque.
--
-- DECISIÓN DE EQUIPO: tabla dedicada (no compartida con A1 respuestas_gustos)
-- para mantener el análisis del piloto simple. Si en A3 (asignaturas) preferimos
-- una sola tabla de intereses con columna tipo, se hace con ALTER aditivo.
--
-- Mismo patrón RLS que 00003/00008: user_id DEFAULT auth.uid() + policies por
-- auth.uid() (Anonymous Auth). Los inserts no envían user_id.

CREATE TABLE IF NOT EXISTS respuestas_actividades (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sesiones(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  actividad_id TEXT NOT NULL,
  valor SMALLINT NOT NULL CHECK (valor IN (0, 1, 2)),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE respuestas_actividades IS 'Bloque A2 del pilar de intereses: actividades y pasatiempos (3 pts, 3 ítems por dimensión). Alimenta el puntaje integrado de intereses junto a respuestas_gustos (A1) y asignaturas (A3, bloque posterior).';

CREATE INDEX idx_ra_session ON respuestas_actividades(session_id);
ALTER TABLE respuestas_actividades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Actividades: select propia (auth)"
  ON respuestas_actividades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Actividades: insert propia (auth)"
  ON respuestas_actividades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Actividades: update propia (auth)"
  ON respuestas_actividades FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
