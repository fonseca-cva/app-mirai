-- Anexo 3 — Telemetría de repetición por timeout en el juego de Secuencias.
-- Aditivo: columna sobre respuestas_cognitivo (00001). No toca RLS existente: las
-- policies de insert/select por session_id ya cubren esta columna.
ALTER TABLE respuestas_cognitivo
  ADD COLUMN repetido_timeout BOOLEAN NOT NULL DEFAULT false;
