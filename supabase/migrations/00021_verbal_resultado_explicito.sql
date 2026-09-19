-- RESULTADO EXPLÍCITO DE LA RPC VERBAL — distingue dos casos que hoy son iguales.
--
-- ⚠️  NO APLICADA A PRODUCCIÓN. Se versiona junto al cambio de aplicación para que
--     esquema y código viajen juntos; la aplicación es decisión manual del fundador.
--
-- PROBLEMA: `actualizar_evaluacion_verbal` (migración 00016) devuelve `boolean`, y
-- devuelve `false` en DOS situaciones muy distintas:
--   (a) la fila es del usuario y YA ESTÁ en estado terminal ('evaluado') → la
--       evaluación correcta ya está guardada: es ÉXITO IDEMPOTENTE;
--   (b) la fila no existe, o es de OTRO usuario → no hay nada que actualizar:
--       es un FALLO real.
-- El cliente no puede distinguirlas, así que trata ambas como fallo y la respuesta
-- verbal de (a) queda eternamente en la cola, reintentándose sin fin.
--
-- SOLUCIÓN: la RPC devuelve un texto con el resultado, manteniendo la protección de
-- propiedad (user_id = auth.uid()) intacta. Nunca revela si la fila existe para
-- OTRO usuario: en ese caso responde 'inexistente' igual que si no existiera, así
-- que no filtra información sobre filas ajenas.
--
--   'actualizado'       → se escribió la evaluación. Éxito.
--   'ya_evaluado'       → ya estaba terminal y es del usuario. Éxito idempotente.
--   'inexistente'       → no existe o no es del usuario. Fallo.
--
-- Se conserva la versión `boolean` como envoltorio para no romper llamadas
-- antiguas durante el despliegue (compatibilidad hacia atrás).

CREATE OR REPLACE FUNCTION public.actualizar_evaluacion_verbal_resultado(
  p_id bigint,
  p_evaluacion_json jsonb,
  p_estado text,
  p_revision_requerida boolean,
  p_acuerdo_no_disponible boolean
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_estado_actual text;
  v_actualizado boolean;
BEGIN
  -- Se lee el estado actual CON la condición de propiedad. Si no aparece, la fila
  -- no existe O es de otro usuario: en ambos casos 'inexistente' (no se distingue
  -- hacia afuera, para no filtrar la existencia de filas ajenas).
  SELECT estado INTO v_estado_actual
  FROM public.respuestas_verbal
  WHERE id = p_id
    AND user_id = auth.uid();

  IF NOT FOUND THEN
    RETURN 'inexistente';
  END IF;

  -- Estado terminal propio: la evaluación buena ya está guardada. NO se pisa, y se
  -- informa éxito idempotente para que el cliente saque la fila de su cola.
  IF v_estado_actual = 'evaluado' THEN
    RETURN 'ya_evaluado';
  END IF;

  -- Actualización con la misma guarda de terminalidad que la versión anterior.
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

  IF COALESCE(v_actualizado, false) THEN
    RETURN 'actualizado';
  END IF;

  -- Carrera: otro proceso la dejó terminal entre la lectura y el update.
  RETURN 'ya_evaluado';
END;
$$;

REVOKE ALL ON FUNCTION public.actualizar_evaluacion_verbal_resultado(bigint, jsonb, text, boolean, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.actualizar_evaluacion_verbal_resultado(bigint, jsonb, text, boolean, boolean) TO authenticated;

COMMENT ON FUNCTION public.actualizar_evaluacion_verbal_resultado IS
  'Escribe el resultado de una evaluación verbal y DISTINGUE: actualizado | ya_evaluado (terminal propia, éxito idempotente) | inexistente (no existe o ajena, fallo). No filtra la existencia de filas ajenas.';

-- Compatibilidad: la versión booleana se mantiene delegando en la nueva. Se
-- conserva para llamadas antiguas durante el despliegue.
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
  v_resultado text;
BEGIN
  v_resultado := public.actualizar_evaluacion_verbal_resultado(
    p_id, p_evaluacion_json, p_estado, p_revision_requerida, p_acuerdo_no_disponible
  );
  -- Ambos casos ("actualizado" y "ya_evaluado") son éxito para el llamador booleano.
  RETURN v_resultado IN ('actualizado', 'ya_evaluado');
END;
$$;

REVOKE ALL ON FUNCTION public.actualizar_evaluacion_verbal(bigint, jsonb, text, boolean, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.actualizar_evaluacion_verbal(bigint, jsonb, text, boolean, boolean) TO authenticated;

-- ── VERIFICACIÓN (solo lectura, correr tras aplicar) ──────────────────────────
-- SELECT p.proname, pg_get_function_result(p.oid), pg_get_function_arguments(p.oid)
-- FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
-- WHERE n.nspname = 'public' AND p.proname LIKE 'actualizar_evaluacion_verbal%';

-- ── ROLLBACK ──────────────────────────────────────────────────────────────────
-- Volver a la versión de la migración 00016 (booleana, sin distinguir casos):
--   DROP FUNCTION IF EXISTS public.actualizar_evaluacion_verbal_resultado(bigint, jsonb, text, boolean, boolean);
--   -- y recrear actualizar_evaluacion_verbal con el cuerpo de 00016.
-- El cliente nuevo degrada con seguridad: si la RPC de resultado no existe,
-- `syncRespuestaVerbal` cae a la versión booleana y vuelve al comportamiento previo
-- (trata 'ya_evaluado' como posible fallo), que es lo que ya hacía antes.
