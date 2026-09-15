-- Diagnóstico de esquema — SOLO LECTURA, no modifica nada.
--
-- Causa raíz encontrada (2026-09-08): la consola de producción mostró 400 Bad
-- Request en escrituras a respuestas_cognitivo y respuestas_verbal. 400 = la
-- base rechaza el payload (columna inexistente / tipo inválido), no permisos
-- (eso sería 403) ni duplicados (eso sería 409). El código del cliente
-- (lib/supabase/types.ts) espera columnas que se agregaron en migraciones
-- posteriores a la 00001 (repetido_timeout en 00006; pegado, caracteres_pegados,
-- revision_requerida, intento en 00015; acuerdo_no_disponible en 00016). Si
-- alguna de esas migraciones no se aplicó en producción, cada insert con esa
-- columna falla completo.
--
-- Esta consulta compara, tabla por tabla, TODAS las columnas que el código
-- envía hoy (según lib/supabase/types.ts) contra information_schema.columns.
-- Cualquier fila que aparezca en el resultado es una columna QUE FALTA en
-- producción y que el código necesita.

WITH esperado(tabla, columna) AS (
  VALUES
    ('sesiones', 'id'), ('sesiones', 'creada_en'), ('sesiones', 'edad'),
    ('sesiones', 'curso'), ('sesiones', 'dispositivo'), ('sesiones', 'es_prueba'),
    ('sesiones', 'user_id'),

    ('respuestas_gustos', 'id'), ('respuestas_gustos', 'session_id'),
    ('respuestas_gustos', 'contexto_id'), ('respuestas_gustos', 'valor'),
    ('respuestas_gustos', 'latencia_ms'), ('respuestas_gustos', 'ayuda_abierta'),
    ('respuestas_gustos', 'audio_activado'), ('respuestas_gustos', 'creado_en'),
    ('respuestas_gustos', 'user_id'),

    ('respuestas_cognitivo', 'id'), ('respuestas_cognitivo', 'session_id'),
    ('respuestas_cognitivo', 'juego'), ('respuestas_cognitivo', 'item_id'),
    ('respuestas_cognitivo', 'correcto'), ('respuestas_cognitivo', 'nivel'),
    ('respuestas_cognitivo', 'duracion_ms'), ('respuestas_cognitivo', 'repetido_timeout'),
    ('respuestas_cognitivo', 'creado_en'), ('respuestas_cognitivo', 'user_id'),

    ('respuestas_verbal', 'id'), ('respuestas_verbal', 'session_id'),
    ('respuestas_verbal', 'tarea'), ('respuestas_verbal', 'texto'),
    ('respuestas_verbal', 'evaluacion_json'), ('respuestas_verbal', 'estado'),
    ('respuestas_verbal', 'pegado'), ('respuestas_verbal', 'caracteres_pegados'),
    ('respuestas_verbal', 'revision_requerida'), ('respuestas_verbal', 'acuerdo_no_disponible'),
    ('respuestas_verbal', 'intento'), ('respuestas_verbal', 'creado_en'),
    ('respuestas_verbal', 'evaluado_en'), ('respuestas_verbal', 'user_id'),

    ('respuestas_asignaturas', 'id'), ('respuestas_asignaturas', 'session_id'),
    ('respuestas_asignaturas', 'asignatura_id'), ('respuestas_asignaturas', 'valor'),
    ('respuestas_asignaturas', 'creado_en'), ('respuestas_asignaturas', 'user_id'),

    ('aspiraciones', 'id'), ('aspiraciones', 'session_id'), ('aspiraciones', 'opcion'),
    ('aspiraciones', 'detalle'), ('aspiraciones', 'creado_en'), ('aspiraciones', 'user_id'),

    ('respuestas_actividades', 'id'), ('respuestas_actividades', 'session_id'),
    ('respuestas_actividades', 'actividad_id'), ('respuestas_actividades', 'valor'),
    ('respuestas_actividades', 'creado_en'), ('respuestas_actividades', 'user_id'),

    ('respuestas_divergente', 'id'), ('respuestas_divergente', 'session_id'),
    ('respuestas_divergente', 'objeto'), ('respuestas_divergente', 'respuestas_texto'),
    ('respuestas_divergente', 'cantidad'), ('respuestas_divergente', 'creado_en'),
    ('respuestas_divergente', 'user_id'),

    ('resultados', 'id'), ('resultados', 'session_id'), ('resultados', 'perfil_json'),
    ('resultados', 'generado_en'), ('resultados', 'user_id'),

    ('tutorial_estado', 'id'), ('tutorial_estado', 'session_id'), ('tutorial_estado', 'juego'),
    ('tutorial_estado', 'tutorial_visto'), ('tutorial_estado', 'practica_dominada'),
    ('tutorial_estado', 'demo_loops_vistos'), ('tutorial_estado', 'uso_atras'),
    ('tutorial_estado', 'uso_saltar_tutorial'), ('tutorial_estado', 'creado_en'),
    ('tutorial_estado', 'user_id'),

    ('correos_informe', 'id'), ('correos_informe', 'session_id'), ('correos_informe', 'email'),
    ('correos_informe', 'estado'), ('correos_informe', 'creado_en'),
    ('correos_informe', 'enviado_en'), ('correos_informe', 'user_id')
)
SELECT e.tabla, e.columna AS columna_faltante
FROM esperado e
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public' AND c.table_name = e.tabla AND c.column_name = e.columna
WHERE c.column_name IS NULL
ORDER BY e.tabla, e.columna;

-- Si esta consulta no devuelve filas: el esquema real ya tiene todas las
-- columnas que el código exige, y el 400 tiene otra causa (tipo de dato
-- incompatible, CHECK constraint, o un valor fuera de rango) — en ese caso
-- avisen y seguimos investigando con el payload exacto del request fallido.
