-- REINTENTO ASÍNCRONO + ACUERDO NO DISPONIBLE — entrega 2 (plan de Camilo, puntos 8 y 10).
-- Aditivo y retrocompatible. No toca filas existentes.
--
-- * acuerdo_no_disponible: true cuando la evaluación se reportó con UN solo
--   evaluador (el segundo no está configurado o falló). Se expone en la API y
--   se persiste para auditoría/QA. La evaluación NO se descarta: un evaluador
--   funcionando es infinitamente mejor que ninguna evaluación.
-- * RPC actualizar_evaluacion_verbal: única vía de escritura del resultado de
--   una evaluación, usada por el cliente (al cerrar el bloque) Y por el
--   reintento asíncrono del servidor (after() en /api/evaluar). SECURITY
--   DEFINER con verificación de propiedad (user_id = auth.uid()) y guarda de
--   terminalidad: solo actualiza filas en ('pendiente','error','no_evaluado',
--   'no_pertinente'). Una fila 'evaluado' es terminal y NUNCA se pisa — así el
--   reintento no pisa una evaluación viva y el cliente no pisa un reintento
--   exitoso.

ALTER TABLE respuestas_verbal ADD COLUMN IF NOT EXISTS acuerdo_no_disponible BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN respuestas_verbal.acuerdo_no_disponible IS
  'Doble evaluación: true si el segundo evaluador no estaba configurado o falló (se reportó el puntaje del primero).';

CREATE OR REPLACE FUNCTION public.actualizar_evaluacion_verbal(
  p_id bigint,
  p_evaluacion_json jsonb,
  p_estado text,
  p_revision_requerida boolean,
  p_acuerdo_no_disponible boolean
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actualizado boolean;
BEGIN
  UPDATE public.respuestas_verbal
  SET evaluacion_json = p_evaluacion_json,
      estado = p_estado,
      revision_requerida = p_revision_requerida,
      acuerdo_no_disponible = p_acuerdo_no_disponible,
      evaluado_en = now()
  WHERE id = p_id
    AND user_id = auth.uid()
    AND estado IN ('pendiente', 'error', 'no_evaluado', 'no_pertinente')
  RETURNING true INTO v_actualizado;

  RETURN COALESCE(v_actualizado, false);
END;
$$;

REVOKE ALL ON FUNCTION public.actualizar_evaluacion_verbal(bigint, jsonb, text, boolean, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.actualizar_evaluacion_verbal(bigint, jsonb, text, boolean, boolean) TO authenticated;

COMMENT ON FUNCTION public.actualizar_evaluacion_verbal IS
  'Escribe el resultado de una evaluación verbal verificando propiedad (user_id = auth.uid()) y sin pisar filas ya evaluadas (estado terminal).';
