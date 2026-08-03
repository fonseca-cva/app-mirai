# Auditoría — Ítems de Series (8 reales + 2 de práctica)

Mismo formato que `items_matrices_auditoria.md`. A diferencia de Matrices, estos ítems
NO se generan con un motor de reglas: se escriben a mano en `lib/data/series.ts`, porque
las reglas numéricas y alfanuméricas son más simples de enunciar directamente que de
generar. `lib/data/series.test.ts` verifica que la alternativa marcada como correcta
reproduzca efectivamente la regla enunciada acá, y que no haya distractores duplicados.

## Invariantes verificadas automáticamente (no repetidas ítem por ítem)

- **Criterio 3 (color nunca porta la regla)**: `ItemSerie.tsx` y `PracticaSeries.tsx` no usan
  ningún color derivado del valor o de la regla — todas las fichas comparten el mismo fondo
  (`bg-blanco-papel/70` / `bg-gris-papel/60`); el color solo cambia por estado de interacción
  (hover, acierto/error en práctica), nunca para señalar cuál es la respuesta o qué regla aplica.
- **Criterio 4 (distractores distinguibles)**: cada ítem usa 5 strings cortos y numéricamente
  distintos entre sí (verificado por `lib/data/series.test.ts`, invariante de "sin duplicados").
  Al ser texto/números en vez de figuras geométricas, la distinción visual es inherente al
  valor mismo (no hay ambigüedad de forma).
- **Mundo visual distinto de los otros 3 juegos cognitivos**: Series usa fichas de papel con
  tipografía grande (`font-display`) sobre números o combinaciones letra+número — cero SVG,
  cero geometría. Se distingue de Matrices (figuras geométricas con lados/rotación/relleno/
  pliegues), de Rotación/Pliegues (papel plegado en 3D) y de Secuencias (símbolos tipo
  origami en una grilla de memoria).

---

## ser-01 (fácil)

- **Regla**: suma 2 en cada paso (`siguiente = anterior + 2`).
- **Verificación**: 3→5 (+2), 5→7 (+2), 7→9 (+2), 9→11 (+2), 11→13 (+2). Paso constante.
- **Respuesta correcta**: 13.
- **Distractores**:
  1. 12 — un paso de menos (11+1 en vez de +2).
  2. 14 — un paso de más (11+3 en vez de +2).
  3. 15 — dos pasos de más (equivalente a +4).
  4. 10 — retrocede en vez de avanzar (11-1).
- **Criterios 3/4**: sin color como señal; los 5 valores son números distintos, fácilmente distinguibles.

## ser-02 (fácil)

- **Regla**: resta 3 en cada paso (`siguiente = anterior - 3`).
- **Verificación**: 30→27 (-3), 27→24 (-3), 24→21 (-3), 21→18 (-3), 18→15 (-3).
- **Respuesta correcta**: 15.
- **Distractores**:
  1. 14 — un paso de más (18-4 en vez de -3).
  2. 16 — un paso de menos (18-2 en vez de -3).
  3. 17 — la mitad del paso (18-1).
  4. 12 — el doble del paso (18-6).
- **Criterios 3/4**: cumple.

## ser-03 (fácil)

- **Regla**: multiplica por 2 en cada paso (`siguiente = anterior × 2`).
- **Verificación**: 2→4 (×2), 4→8 (×2), 8→16 (×2), 16→32 (×2).
- **Respuesta correcta**: 64 (32×2).
- **Distractores**:
  1. 48 — suma 16 en vez de multiplicar por 2 (confunde ×2 con +16, el paso anterior).
  2. 60 — número redondo cercano, no resulta de ninguna operación simple sobre 32.
  3. 66 — 64+2, error por descuido de "seguir sumando 2" (contamina con la regla de ser-01).
  4. 34 — 32+2, mismo error de contaminación pero sin duplicar.
- **Criterios 3/4**: cumple.

## ser-04 (media, alternancia de dos reglas)

- **Regla**: alterna +1 y +3 empezando por +1 (`1,+1→2,+3→5,+1→6,+3→9,+1→10`).
- **Verificación**: 1→2 (+1), 2→5 (+3), 5→6 (+1), 6→9 (+3), 9→10 (+1). Patrón +1/+3 constante.
- **Respuesta correcta**: 10.
- **Distractores**:
  1. 8 — 9-1, retrocede en vez de avanzar.
  2. 11 — 9+2, mezcla los dos pasos (+1 y +3 promediados).
  3. 12 — 9+3, aplica el paso equivocado del ciclo (tocaba +1, no +3).
  4. 13 — 9+4, ni +1 ni +3.
- **Criterios 3/4**: cumple.

## ser-05 (media, dos subseries intercaladas)

- **Regla**: dos subseries entrelazadas por posición. Posiciones impares (1ª,3ª,5ª,7ª...)
  forman la subserie A: 1,3,5,7 (+2). Posiciones pares (2ª,4ª,6ª...) forman la subserie B:
  10,20,30 (+10). El elemento que falta es el 7º de la serie combinada → posición impar →
  continúa A: el término después de 5 es 7.
- **Verificación**: posiciones 1,3,5 de la serie visible son 1,3,5 (subserie A, +2 cada una);
  posiciones 2,4,6 son 10,20,30 (subserie B, +10 cada una). El 7º elemento retoma A: 7.
- **Respuesta correcta**: 7.
- **Distractores**:
  1. 6 — continúa la subserie A con paso equivocado (+1 en vez de +2).
  2. 9 — continúa A con paso +4, tampoco corresponde.
  3. 25 — mezcla ambas subseries (promedio entre 20 y 30).
  4. 40 — continúa la subserie B (30+10) en vez de retomar A: el error de "seguir la serie
     que se vio último" en vez de identificar que toca el turno de la otra subserie.
- **Criterios 3/4**: cumple; el distractor 40 es el más "creíble" porque replica el error
  conceptual más probable (perder de vista cuál subserie corresponde), no ruido arbitrario.

## ser-06 (media, alternancia ×2/-1)

- **Regla**: alterna ×2 y -1 sobre el valor anterior, empezando por ×2
  (`4,×2→8,-1→7,×2→14,-1→13,×2→26,-1→25`).
- **Verificación**: 4→8 (×2), 8→7 (-1), 7→14 (×2), 14→13 (-1), 13→26 (×2), 26→25 (-1).
- **Respuesta correcta**: 25.
- **Distractores**:
  1. 12 — no resulta de ninguna operación simple sobre 26 dentro del patrón.
  2. 24 — 26-2, resta el doble de lo que corresponde.
  3. 27 — 26+1, suma en vez de restar (invierte el signo del paso correcto).
  4. 52 — 26×2, aplica la operación equivocada del ciclo (tocaba -1, no ×2).
- **Criterios 3/4**: cumple.

## ser-07 (difícil, alfanumérica)

- **Regla**: tipo Letter-Number Series (ICAR, dominio público). La letra avanza una posición
  en el alfabeto y el número sube +2 (siempre impar), en paralelo: A1, B3, C5, D7 → E9.
- **Verificación**: letras A→B→C→D→E (consecutivas); números 1→3→5→7→9 (+2 cada una,
  todos impares).
- **Respuesta correcta**: E9.
- **Distractores**:
  1. D9 — letra correcta del paso anterior (no avanza) pero número correcto: error de "solo
     avanzar el número, olvidar la letra".
  2. E7 — letra correcta pero número del paso anterior: error de "solo avanzar la letra,
     olvidar el número".
  3. E11 — letra correcta pero número con un paso de más (+4 en vez de +2).
  4. F9 — letra con un paso de más (avanza dos posiciones) pero número correcto.
- **Criterios 3/4**: cumple; cada distractor aísla el error de olvidar o sobre-aplicar
  exactamente una de las dos reglas paralelas (letra o número), nunca ambigüedad tipográfica
  (letras y dígitos son visualmente inconfundibles entre sí).

## ser-08 (difícil, regla no obvia)

- **Regla**: cada término es la suma de los dos anteriores (secuencia de Fibonacci):
  2, 3, 5(=2+3), 8(=3+5), 13(=5+8) → siguiente = 8+13 = 21.
- **Verificación**: 2+3=5 ✓, 3+5=8 ✓, 5+8=13 ✓, 8+13=21 ✓.
- **Respuesta correcta**: 21.
- **Distractores**:
  1. 11 — 13-2, error de restar el primer término en vez de sumar los dos últimos.
  2. 18 — 13+5, suma el antepenúltimo en vez del penúltimo (desplaza un término).
  3. 20 — 13+8 redondeado hacia abajo, casi correcto pero con error de cálculo de +1.
  4. 24 — 13+8+3, suma tres términos en vez de dos.
- **Criterios 3/4**: cumple; ningún distractor es un valor arbitrario, cada uno corresponde
  a un error de aplicación plausible de la regla real.

## ser-practica (práctica 1 — regla más obvia posible)

- **Regla**: suma 1 en cada paso (`1,2,3,4,→5`).
- **Respuesta correcta**: 5.
- **Distractores**: 3 (valor ya visto, retrocede), 6 (+2 en vez de +1), 7 (+3), 8 (+4).
- **Criterios 3/4**: cumple; regla elegida deliberadamente como la más simple posible para
  la primera práctica del tutorial.

## ser-practica-2 (práctica 2 — alternancia obvia de dos valores)

- **Regla**: alterna 5 y 10 (`5,10,5,10,5,→10`).
- **Respuesta correcta**: 10.
- **Distractores**: 5 (repite el último valor en vez de alternar), 7 y 15 (valores intermedios
  arbitrarios que no pertenecen al patrón), 20 (el doble de 10, tentador pero fuera de patrón).
- **Criterios 3/4**: cumple; alternancia de solo dos valores, la estructura más obvia posible
  después de la progresión simple de la práctica 1.
