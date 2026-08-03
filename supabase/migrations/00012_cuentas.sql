-- CUENTAS: RATE LIMIT DE ENLACES POR CORREO — Tanda A (informe permanente)
-- Regla de Camilo: máx 5 enlaces por correo por hora.
--
-- La tabla no tiene grants para anon/authenticated: nadie la lee ni escribe por SQL
-- directo. El único acceso es el RPC SECURITY DEFINER, que cuenta y registra
-- atómicamente (sin race condition entre dos llamadas simultáneas).
-- El route /api/vincular-cuenta lo llama con el cliente "as-user" (JWT de la
-- sesión anónima). Ese JWT tiene role=authenticated (is_anonymous=true en los
-- claims) — el rol Postgres "anon" es solo para llamadas sin JWT. Por eso el
-- GRANT EXECUTE va a authenticated (no a anon).

CREATE TABLE IF NOT EXISTS public.envios_otp (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  enviado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_envios_otp_email_enviado
  ON public.envios_otp (lower(email), enviado_en);

ALTER TABLE public.envios_otp ENABLE ROW LEVEL SECURITY;

-- Sin policies a propósito: sin grants directos nadie accede por SQL.

CREATE OR REPLACE FUNCTION public.permitir_envio_otp(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT := lower(btrim(p_email));
  v_cuenta INTEGER;
BEGIN
  SELECT count(*) INTO v_cuenta
  FROM public.envios_otp
  WHERE lower(email) = v_email
    AND enviado_en > now() - interval '1 hour';

  IF v_cuenta >= 5 THEN
    RETURN false;
  END IF;

  INSERT INTO public.envios_otp (email) VALUES (v_email);
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.permitir_envio_otp(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.permitir_envio_otp(TEXT) TO authenticated;
