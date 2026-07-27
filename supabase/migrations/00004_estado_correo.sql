-- ESTADO DE ENVÍO DE CORREO — Fase 3, Paso 3
-- Aditivo: agrega el estado del envío transaccional (Resend) a correos_informe.
-- No toca RLS (las policies de la 00003 ya cubren select/insert/update por auth.uid()).

ALTER TABLE correos_informe
  ADD COLUMN estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'enviado', 'error')),
  ADD COLUMN enviado_en TIMESTAMPTZ;
