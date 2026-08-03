-- Tanda C: el código ya no escribe 'rotacion' (renombrado a 'pliegues' en
-- BloqueCognitivo.tsx / BloqueRotacion.tsx / Informe.tsx y en los tipos de
-- lib/store/experiencia.ts y lib/supabase/types.ts). Se elimina el alias legacy
-- del CHECK, dejando SOLO los 4 juegos oficiales. 'divergente' vive en su propia
-- tabla (respuestas_divergente), no en respuestas_cognitivo.
--
-- Defensivo: migra cualquier fila 'rotacion' residual (sesiones escritas entre la
-- 00008 y este deploy, cuando el código aún escribía el nombre viejo) ANTES de
-- apretar el CHECK.

-- ── 1. respuestas_cognitivo ──
UPDATE respuestas_cognitivo SET juego = 'pliegues' WHERE juego = 'rotacion';
ALTER TABLE respuestas_cognitivo DROP CONSTRAINT respuestas_cognitivo_juego_check;
ALTER TABLE respuestas_cognitivo ADD CONSTRAINT respuestas_cognitivo_juego_check
  CHECK (juego IN ('matrices','series','pliegues','secuencias'));

-- ── 2. tutorial_estado ──
UPDATE tutorial_estado SET juego = 'pliegues' WHERE juego = 'rotacion';
ALTER TABLE tutorial_estado DROP CONSTRAINT tutorial_estado_juego_check;
ALTER TABLE tutorial_estado ADD CONSTRAINT tutorial_estado_juego_check
  CHECK (juego IN ('matrices','series','pliegues','secuencias'));
