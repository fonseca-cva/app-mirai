-- ITERACIÓN 2 — Claridad del estímulo + Práctica guiada con verificación
-- Solo columnas/tabla aditivas. No toca esquema de puntaje ni RLS existente.

-- Bloque A: ¿se abrió el expandible "¿Qué se hace aquí?" en la tarjeta de contexto?
ALTER TABLE respuestas_gustos
  ADD COLUMN ayuda_abierta BOOLEAN NOT NULL DEFAULT false;

-- Bloque B: ¿se reabrió la ayuda (icono ?) durante este ítem del juego?
ALTER TABLE respuestas_cognitivo
  ADD COLUMN ayuda_en_items BOOLEAN NOT NULL DEFAULT false;

-- Bloque B: estado del tutorial por juego (1 fila por sesión x juego).
-- Tabla propia en vez de columnas en `sesiones` porque hay 3 juegos independientes.
CREATE TABLE IF NOT EXISTS tutorial_estado (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sesiones(id) ON DELETE CASCADE,
  juego TEXT NOT NULL CHECK (juego IN ('matrices','rotacion','secuencias')),
  tutorial_visto BOOLEAN NOT NULL DEFAULT false,
  practica_dominada BOOLEAN,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, juego)
);

CREATE INDEX idx_te_session ON tutorial_estado(session_id);
ALTER TABLE tutorial_estado ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutorial: insert propia"
  ON tutorial_estado FOR INSERT
  WITH CHECK (session_id = current_setting('app.session_id')::UUID);

CREATE POLICY "Tutorial: update propia"
  ON tutorial_estado FOR UPDATE
  USING (session_id = current_setting('app.session_id')::UUID);

CREATE POLICY "Tutorial: read propia"
  ON tutorial_estado FOR SELECT
  USING (session_id = current_setting('app.session_id')::UUID);
