-- Mejora Bloque A — audio ambiente opcional en contextos (decisión de Camilo).
-- Aditivo: columna sobre respuestas_gustos (00001). No toca RLS existente: las
-- policies de insert/select por session_id ya cubren esta columna.
ALTER TABLE respuestas_gustos
  ADD COLUMN audio_activado BOOLEAN NOT NULL DEFAULT false;
