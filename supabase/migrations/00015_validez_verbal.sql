-- VALIDEZ DEL BLOQUE VERBAL — entrega 1 (plan de Camilo, puntos 1-7).
-- Aditivo y retrocompatible: amplía el CHECK de estado y agrega columnas de
-- control de calidad. No toca filas existentes.
--
-- DECISIÓN DE EQUIPO (Claude + DeepSeek):
--  * 'no_pertinente' guarda la respuesta cuando el filtro de pertinencia (o la
--    detección de copia literal) la rechaza. Se guarda SIEMPRE (QA + trazabilidad).
--  * 'no_evaluado' reemplaza cualquier "puntaje por defecto": si la evaluación
--    falló o no hay proveedor configurado, la dimensión se reporta sin valor.
--  * pegado/caracteres_pegados: telemetría de control de calidad (regla vigente:
--    no afecta puntaje, no se muestra al usuario).
--  * revision_requerida: doble evaluación con diferencia > 1 punto.
--  * intento: 1 = primer envío, 2 = reintento tras no pertinente (máx. 1).

ALTER TABLE respuestas_verbal DROP CONSTRAINT respuestas_verbal_estado_check;
ALTER TABLE respuestas_verbal ADD CONSTRAINT respuestas_verbal_estado_check
  CHECK (estado IN ('pendiente','evaluado','error','no_pertinente','no_evaluado'));

ALTER TABLE respuestas_verbal ADD COLUMN IF NOT EXISTS pegado BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE respuestas_verbal ADD COLUMN IF NOT EXISTS caracteres_pegados INTEGER NOT NULL DEFAULT 0;
ALTER TABLE respuestas_verbal ADD COLUMN IF NOT EXISTS revision_requerida BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE respuestas_verbal ADD COLUMN IF NOT EXISTS intento SMALLINT NOT NULL DEFAULT 1
  CHECK (intento IN (1, 2));

COMMENT ON COLUMN respuestas_verbal.estado IS
  'pendiente | evaluado | error | no_pertinente (rechazada por filtro de pertinencia/copia literal) | no_evaluado (sin proveedor o fallo; NUNCA se inventa puntaje)';
COMMENT ON COLUMN respuestas_verbal.pegado IS
  'Control de calidad únicamente: true si hubo evento paste en el textarea. No afecta puntaje ni se muestra al usuario.';
COMMENT ON COLUMN respuestas_verbal.revision_requerida IS
  'Doble evaluación: true si los dos evaluadores difieren en más de 1 punto (se reporta el menor).';
COMMENT ON COLUMN respuestas_verbal.intento IS
  '1 = primer envío; 2 = único reintento permitido tras respuesta no pertinente.';
