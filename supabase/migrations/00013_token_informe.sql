-- INFORME PERMANENTE — Tanda B (ruta /informe/[token])
--
-- 1) Columna `token` en resultados: identificador aleatorio no adivinable
--    (~128 bits, URL-safe). El DEFAULT genera uno por insert (gen_random_bytes
--    es volatile), así que las filas futuras del app lo obtienen solas.
-- 2) Backfill de filas existentes ANTES de SET NOT NULL.
-- 3) RPC público obtener_informe_publico(p_token): devuelve SOLO las columnas
--    del informe (token, perfil_json, generado_en) para la fila con ese token
--    exacto. Nunca user_id, session_id ni correo.
--
-- Por qué RPC y no una vista/policy con SELECT a anon: una policy USING(true)
-- o una vista con GRANT SELECT expondrían TODAS las filas a cualquiera que haga
-- un SELECT (las policies no pueden mirar el WHERE del cliente; las vistas
-- tampoco saben qué token pidió el llamador). La RPC SECURITY DEFINER expone
-- únicamente la fila cuyo token coincide y solo la proyección fija: un token
-- ajeno devuelve 0 filas, y no hay forma de enumerar informes.

ALTER TABLE public.resultados
  ADD COLUMN IF NOT EXISTS token TEXT
  DEFAULT replace(replace(replace(encode(gen_random_bytes(16), 'base64'), '+', '-'), '/', '_'), '=', '');

-- Backfill: las filas creadas antes de esta migración no tienen token.
UPDATE public.resultados
SET token = replace(replace(replace(encode(gen_random_bytes(16), 'base64'), '+', '-'), '/', '_'), '=', '')
WHERE token IS NULL;

ALTER TABLE public.resultados ALTER COLUMN token SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_resultados_token ON public.resultados (token);

CREATE OR REPLACE FUNCTION public.obtener_informe_publico(p_token TEXT)
RETURNS TABLE (token TEXT, perfil_json JSONB, generado_en TIMESTAMPTZ)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.token, r.perfil_json, r.generado_en
  FROM public.resultados r
  WHERE r.token = p_token
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.obtener_informe_publico(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.obtener_informe_publico(TEXT) TO anon, authenticated;
