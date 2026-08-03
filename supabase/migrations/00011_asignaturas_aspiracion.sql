-- BLOQUE A3 + A4 — ASIGNATURAS ESCOLARES + ASPIRACIÓN (Tanda F, Pilar de Intereses)
--
-- A3: 10 asignaturas del currículum chileno de enseñanza media, escala de 3 puntos
-- (0 = no me gusta, 1 = me da lo mismo, 2 = me gusta). Una tarjeta por pantalla,
-- ~45s el bloque. Se guardan juntas al cerrarse el bloque.
--
-- A4: aspiración post 4° medio, una pregunta al inicio del flujo (antes del bloque
-- de gustos). Una fila por sesión; se usa upsert por session_id.
--
-- Mismo patrón RLS que 00003/00008/00010: user_id DEFAULT auth.uid() + policies
-- por auth.uid() (Anonymous Auth). Los inserts no envían user_id.

CREATE TABLE IF NOT EXISTS respuestas_asignaturas (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sesiones(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  asignatura_id TEXT NOT NULL,
  valor SMALLINT NOT NULL CHECK (valor IN (0, 1, 2)),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE respuestas_asignaturas IS 'Bloque A3 del pilar de intereses: asignaturas escolares (3 pts, 10 ítems). Alimenta el puntaje integrado de intereses junto a respuestas_gustos (A1) y respuestas_actividades (A2).';

CREATE INDEX idx_ras_session ON respuestas_asignaturas(session_id);
ALTER TABLE respuestas_asignaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Asignaturas: select propia (auth)"
  ON respuestas_asignaturas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Asignaturas: insert propia (auth)"
  ON respuestas_asignaturas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Asignaturas: update propia (auth)"
  ON respuestas_asignaturas FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── A4 — Aspiración ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS aspiraciones (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sesiones(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  opcion TEXT NOT NULL CHECK (opcion IN ('universidad', 'tecnico', 'trabajar', 'no_se')),
  detalle TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id)
);

COMMENT ON TABLE aspiraciones IS 'Bloque A4 del pilar de intereses: aspiración post 4° medio (una fila por sesión). Se captura al inicio del flujo para análisis del piloto y personalización futura.';

CREATE INDEX idx_asp_session ON aspiraciones(session_id);
ALTER TABLE aspiraciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aspiraciones: select propia (auth)"
  ON aspiraciones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Aspiraciones: insert propia (auth)"
  ON aspiraciones FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Aspiraciones: update propia (auth)"
  ON aspiraciones FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
