-- ENVÍOS DE INFORME PERMANENTE — auditoría persistente de /api/enviar-informe-permanente.
-- Contexto (Camilo, 2026-09-10): un intento de envío se investigó por logs de
-- Vercel y resultó irrecuperable — el plan Hobby retiene solo los últimos
-- registros (minutos, no días), no los 30/90 días que se asume por defecto.
-- Un log que se borra solo no sirve como registro de auditoría de correos a
-- estudiantes. Esta tabla persiste cada intento para siempre, consultable con
-- un SELECT directo en el SQL editor de Supabase.
--
-- Mismo patrón que envios_otp (00012): sin grants directos a la tabla, solo un
-- RPC SECURITY DEFINER inserta. El route ya opera "as-user" (JWT del usuario
-- autenticado): auth.uid() identifica quién intentó el envío sin que el
-- cliente pueda falsificarlo.

CREATE TABLE IF NOT EXISTS public.envios_informe_permanente (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  correo TEXT NOT NULL,
  ok BOOLEAN NOT NULL,
  status_http INTEGER,
  resend_id TEXT,
  error TEXT,
  enviado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_envios_informe_permanente_user
  ON public.envios_informe_permanente (user_id, enviado_en);

ALTER TABLE public.envios_informe_permanente ENABLE ROW LEVEL SECURITY;

-- Sin policies a propósito: sin grants directos nadie accede por SQL.

-- Devuelve el ID insertado (BIGINT) en vez de VOID.
-- Por qué: con VOID, un test de integración solo puede comprobar que la llamada no
-- devolvió error, lo que NO demuestra que la fila se haya persistido. Devolviendo el
-- id, un cliente puede verificar la existencia del registro. La aplicación IGNORA el
-- valor de retorno (no lo usa), así que el cambio es compatible.
CREATE OR REPLACE FUNCTION public.registrar_envio_informe(
  p_correo TEXT,
  p_ok BOOLEAN,
  p_status_http INTEGER,
  p_resend_id TEXT,
  p_error TEXT
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id BIGINT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sin sesión autenticada';
  END IF;

  INSERT INTO public.envios_informe_permanente (user_id, correo, ok, status_http, resend_id, error)
  VALUES (auth.uid(), p_correo, p_ok, p_status_http, p_resend_id, p_error)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_envio_informe(TEXT, BOOLEAN, INTEGER, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registrar_envio_informe(TEXT, BOOLEAN, INTEGER, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION public.registrar_envio_informe IS
  'Registra un intento de envío de informe permanente y devuelve el id de la fila (para poder verificarla desde un test). La aplicación ignora el retorno.';
