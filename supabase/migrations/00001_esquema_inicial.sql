-- ESQUEMA INICIAL MIRAI — Fase 2
-- Sección 2 de la spec: persistencia mínima con Supabase.
-- Sin login; cada sesión se identifica por session_id (UUID generado en el cliente).
-- RLS: cada sesión solo lee/escribe sus propias filas por session_id.
-- // PENDIENTE REVISIÓN DE SEGURIDAD antes de producción.

-- ── Tabla: sesiones ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sesiones (
  id UUID PRIMARY KEY,
  creada_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  edad TEXT CHECK (edad IN ('<15','15-17','18-24','25-34','35-44','45+','prefiero-no-decir') OR edad IS NULL),
  curso TEXT CHECK (curso IN ('7mo','8vo','I','II','III','IV','superior','prefiero-no-decir') OR curso IS NULL),
  dispositivo TEXT
);

ALTER TABLE sesiones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sesión: insert propia"
  ON sesiones FOR INSERT
  WITH CHECK (id = current_setting('app.session_id')::UUID);

CREATE POLICY "Sesión: read propia"
  ON sesiones FOR SELECT
  USING (id = current_setting('app.session_id')::UUID);

-- ── Tabla: respuestas_gustos ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS respuestas_gustos (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sesiones(id) ON DELETE CASCADE,
  contexto_id TEXT NOT NULL,
  valor SMALLINT NOT NULL CHECK (valor IN (0, 1, 2)),
  latencia_ms INTEGER,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rg_session ON respuestas_gustos(session_id);
ALTER TABLE respuestas_gustos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gustos: insert propia"
  ON respuestas_gustos FOR INSERT
  WITH CHECK (session_id = current_setting('app.session_id')::UUID);

CREATE POLICY "Gustos: read propia"
  ON respuestas_gustos FOR SELECT
  USING (session_id = current_setting('app.session_id')::UUID);

-- ── Tabla: respuestas_cognitivo ───────────────────────────────────
CREATE TABLE IF NOT EXISTS respuestas_cognitivo (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sesiones(id) ON DELETE CASCADE,
  juego TEXT NOT NULL CHECK (juego IN ('matrices','rotacion','secuencias')),
  item_id TEXT NOT NULL,
  correcto BOOLEAN NOT NULL,
  nivel SMALLINT NOT NULL DEFAULT 1,
  duracion_ms INTEGER NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rc_session ON respuestas_cognitivo(session_id);
ALTER TABLE respuestas_cognitivo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cognitivo: insert propia"
  ON respuestas_cognitivo FOR INSERT
  WITH CHECK (session_id = current_setting('app.session_id')::UUID);

CREATE POLICY "Cognitivo: read propia"
  ON respuestas_cognitivo FOR SELECT
  USING (session_id = current_setting('app.session_id')::UUID);

-- ── Tabla: respuestas_verbal ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS respuestas_verbal (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sesiones(id) ON DELETE CASCADE,
  tarea TEXT NOT NULL CHECK (tarea IN ('comprension','argumentacion')),
  texto TEXT NOT NULL,
  evaluacion_json JSONB,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','evaluado','error')),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  evaluado_en TIMESTAMPTZ
);

CREATE INDEX idx_rv_session ON respuestas_verbal(session_id);
ALTER TABLE respuestas_verbal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Verbal: insert propia"
  ON respuestas_verbal FOR INSERT
  WITH CHECK (session_id = current_setting('app.session_id')::UUID);

CREATE POLICY "Verbal: update propia"
  ON respuestas_verbal FOR UPDATE
  USING (session_id = current_setting('app.session_id')::UUID);

CREATE POLICY "Verbal: read propia"
  ON respuestas_verbal FOR SELECT
  USING (session_id = current_setting('app.session_id')::UUID);

-- ── Tabla: resultados ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resultados (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sesiones(id) ON DELETE CASCADE,
  perfil_json JSONB NOT NULL,
  generado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id)
);

ALTER TABLE resultados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Resultados: insert propia"
  ON resultados FOR INSERT
  WITH CHECK (session_id = current_setting('app.session_id')::UUID);

CREATE POLICY "Resultados: read propia"
  ON resultados FOR SELECT
  USING (session_id = current_setting('app.session_id')::UUID);

-- ── Tabla: correos_informe ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS correos_informe (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sesiones(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE correos_informe ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Correos: insert propia"
  ON correos_informe FOR INSERT
  WITH CHECK (session_id = current_setting('app.session_id')::UUID);

CREATE POLICY "Correos: read propia"
  ON correos_informe FOR SELECT
  USING (session_id = current_setting('app.session_id')::UUID);
