-- ENTRAR-CUENTA: RATE LIMIT LLAMABLE PRE-SESIÓN — Tanda C (/mi-cuenta)
--
-- El flujo "entrar con correo" (/api/entrar-cuenta) parte SIN sesión: quien
-- visita /mi-cuenta sin haber hecho la experiencia no tiene JWT de sesión
-- (el JWT de la anon key tiene role=anon), y el RPC de rate limit de 00012
-- solo está concedido a authenticated. Sin este grant no habría forma de
-- ratear este flujo sin crear usuarios anónimos fantasma (contra la decisión
-- de Tanda C de no crear sesiones desde /mi-cuenta).
--
-- Seguridad: el RPC es SECURITY DEFINER y solo cuenta/registra en envios_otp
-- (tabla sin grants para anon/authenticated). Conceder EXECUTE a anon no
-- expone datos: solo permite llamar a un contador atómico. El abuso posible
-- es agotar el bucket de 5/h de un correo ajeno (limitación conocida, misma
-- clase de DoS de bajo costo que compartir el bucket entre vincular y entrar).

GRANT EXECUTE ON FUNCTION public.permitir_envio_otp(TEXT) TO anon;
