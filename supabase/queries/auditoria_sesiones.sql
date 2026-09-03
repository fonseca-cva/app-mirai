-- Consulta de auditoría (NO es una migración — no toca el esquema, correr manualmente
-- en el SQL Editor cuando se quiera revisar el aislamiento del modo prueba).
--
-- Requiere haber aplicado supabase/migrations/00017_modo_prueba.sql (columna
-- sesiones.es_prueba) antes de correr esto.
--
-- Cuenta cuántas sesiones hay marcadas como prueba y cuántas son reales, con su
-- fecha más reciente de cada tipo.
SELECT
  COUNT(*) FILTER (WHERE es_prueba)              AS sesiones_prueba,
  COUNT(*) FILTER (WHERE NOT es_prueba)          AS sesiones_reales,
  COUNT(*)                                       AS total,
  MAX(creada_en) FILTER (WHERE es_prueba)        AS ultima_prueba,
  MAX(creada_en) FILTER (WHERE NOT es_prueba)    AS ultima_real
FROM sesiones;
