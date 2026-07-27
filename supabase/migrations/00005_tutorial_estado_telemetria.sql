-- ITERACIÓN 3 — Telemetría de tutoriales a ritmo del usuario
-- Aditivo: columnas de control de calidad sobre tutorial_estado (00002).
-- No toca RLS existente: las policies de insert/update por session_id ya cubren estas columnas.

ALTER TABLE tutorial_estado
  ADD COLUMN demo_loops_vistos INT NOT NULL DEFAULT 0,
  ADD COLUMN uso_atras INT NOT NULL DEFAULT 0,
  ADD COLUMN uso_saltar_tutorial BOOLEAN NOT NULL DEFAULT false;
