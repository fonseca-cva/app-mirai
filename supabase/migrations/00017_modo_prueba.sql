-- MODO PRUEBA — entrega 1 (aislamiento de datos, no negociable).
-- Aditivo y retrocompatible: no toca filas existentes ni otras tablas.
--
-- Contexto: la UI de depuración (/experiencia?prueba=1) permite rellenar sesiones
-- de prueba al azar para ciclos de verificación de ~1 minuto. Estas sesiones NO son
-- datos reales y NO deben entrar jamás en análisis/reportes ni en métricas.
--
-- El flag es_prueba vive SOLO en `sesiones`: todas las tablas hijas
-- (respuestas_gustos, respuestas_cognitivo, respuestas_verbal, respuestas_actividades,
-- respuestas_asignaturas, aspiraciones, respuestas_divergente, resultados) referencian
-- sesiones(id) ON DELETE CASCADE, así que filtrarlas es simplemente JOIN `sesiones`
-- con `WHERE es_prueba = false`. NO hace falta propagar el flag tabla por tabla.
--
-- CONVENCIÓN PARA CUALQUIER CONSULTA DE ANÁLISIS / REPORTE FUTURA (obligatoria):
--   WHERE s.es_prueba = false   (o su equivalente para joins/exists)
-- Toda consulta de métricas que no filtre es_prueba se considera un bug de aislamiento.

ALTER TABLE sesiones ADD COLUMN IF NOT EXISTS es_prueba BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN sesiones.es_prueba IS
  'true si la sesión fue creada a través del modo prueba de la UI de depuración (datos sintéticos, NO reales). Las consultas de análisis/reportes DEBEN excluir estas sesiones (WHERE sesiones.es_prueba = false).';
