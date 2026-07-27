# Auditoría — Ítems de Matrices (12 reales + 2 de práctica)

Generado tras el bloqueante de calidad de ítems cognitivos. Cubre los puntos 3, 4 y 5 del bloqueante.

## Invariantes verificadas automáticamente (no repetidas ítem por ítem)

Estas propiedades se verifican para los 14 ítems (12 reales + 2 práctica) por tests en CI, no a mano:

- **`lib/data/matrices.test.ts` → "cada celda de la grilla es derivable de las reglas declaradas (fila y columna)"**: cada una de las 9 celdas de cada ítem se recalcula desde las `reglas` declaradas y debe coincidir exactamente con lo mostrado. Esto es lo que habría detectado el bug de Evidencia 1 (tablero hardcodeado sin relación con ninguna regla): aquí es estructuralmente imposible, porque la grilla completa (no solo la respuesta) se construye siempre `regla → figuras`.
- **`lib/data/matrices.test.ts` → "ninguna alternativa colisiona visualmente con otra"**: verifica que ninguna pareja de alternativas comparta lados+relleno+pliegues con una rotación congruente módulo la simetría del polígono (p.ej. dos cuadrados a 90° de diferencia son geométricamente el mismo cuadrado). Este test **encontró un bug real** durante la auditoría (ver "Hallazgo" más abajo).
- **Criterio 3 (color nunca porta la regla)**: `FiguraOrigamiSVG.tsx` usa un único color fijo (`var(--color-teal-profundo)`) para el trazo/relleno de todas las figuras, sin excepción. El campo `tono` fue eliminado del modelo (`FiguraOrigami`) y reemplazado por `relleno` (binario: sólido=0 / contorno=1, nunca gradación). Verificado por lectura de código, no hay ninguna ruta que use un valor de color derivado de una regla.
- **Marca de asimetría**: todo polígono se renderiza con un punto de orientación (círculo pequeño en el primer vértice) que rota junto con la figura, para que cualquier `rotacionDeg` distinto sea siempre visible a simple vista, sin importar `lados` (antes, un cuadrado rotado 90° era indistinguible de sí mismo).

## Hallazgo durante la auditoría (corregido)

Al escribir el test de no-colisión visual (criterio 4), se detectó que **el generador de distractores producía colisiones reales**: al perturbar `rotacionDeg` en +90° sobre una figura con `lados=4` (default), el resultado era geométricamente el mismo cuadrado (90° = simetría exacta del cuadrado). Afectaba a `mat-01` y a la práctica `mat-practica-2` (el caso literal de "9 rombos idénticos" de la Evidencia 2 original era exactamente este bug, aplicado a un ítem de práctica).

**Fix aplicado en la raíz** (`lib/logic/matrices.ts`, función `perturbarRotacion`): al generar un distractor de rotación, se prueba una lista de offsets (90°, -90°, 45°, -45°, 135°, -135°, 30°, -30°) y se usa el primero que **no** sea congruente módulo la simetría rotacional del polígono en juego. Cubre las simetrías posibles de polígonos de 3 a 8 lados. Ya no depende únicamente de la marca de asimetría para "salvar" un distractor degenerado — el distractor en sí ahora es geométricamente distinto, no solo distinguible por una marca pequeña.

---

## mat-01 (fácil)

- **Regla**: la rotación aumenta 45° hacia la derecha y 45° hacia abajo (una sola regla: `rotacionDeg = 45° × (fila + columna)`).
- **Verificación por fila**: fila0 = 0°,45°,90°; fila1 = 45°,90°,135°; fila2 = 90°,135°,180° — paso constante de 45° en las 3 filas.
- **Verificación por columna**: col0 = 0°,45°,90°; col1 = 45°,90°,135°; col2 = 90°,135°,180° — mismo paso de 45° en las 3 columnas. Regla diagonal, coherente en ambas direcciones.
- **Respuesta correcta**: cuadrado, rotado 180°, sólido, 1 capa.
- **Distractores**:
  1. Mismo cuadrado a 180° pero con 2 capas — incorrecto: cambia `pliegues` (debería ser 1).
  2. Cuadrado rotado 225° — incorrecto: 45° de rotación de más (visible por la marca de orientación).
  3. Pentágono (5 lados) a 180° — incorrecto: cambia el tipo de figura.
  4. Cuadrado a 180° en contorno — incorrecto: cambia `relleno` (debería ser sólido).
- **Criterios 3/4**: sin color como señal; las 4 alternativas difieren en una sola propiedad de forma cada una (capas, ángulo, lados, relleno) — distinguibles a simple vista.

## mat-02 (fácil)

- **Regla**: el número de capas (pliegues) aumenta en 1 hacia la derecha, igual en las 3 filas (`pliegues = 1 + columna`).
- **Verificación por fila**: las 3 filas son idénticas: 1, 2, 3 capas.
- **Verificación por columna**: cada columna es constante entre filas (col0 siempre 1, col1 siempre 2, col2 siempre 3) — trivialmente coherente.
- **Respuesta correcta**: cuadrado, sin rotar, sólido, 3 capas.
- **Distractores**:
  1. 2 capas en vez de 3 — un pliegue de menos.
  2. Pentágono (5 lados) con 3 capas — cambia el tipo de figura.
  3. Cuadrado rotado 45° con 3 capas — rotado cuando no debería.
  4. Cuadrado en contorno con 3 capas — cambia `relleno`.
- **`pliegues` es la regla controlada de este ítem** — marcado explícitamente para veto/confirmación de Camilo. Salto entre pasos: 1 capa completa por columna (1→2→3), perceptible por el anidamiento visual de los polígonos concéntricos.
- **Criterios 3/4**: cumple — sin color, alternativas distinguibles.

## mat-03 (fácil)

- **Regla**: el relleno alterna sólido/contorno como un tablero de ajedrez (`relleno = (fila + columna) mod 2`).
- **Verificación por fila**: fila0 = sólido,contorno,sólido; fila1 = contorno,sólido,contorno; fila2 = sólido,contorno,sólido — alternancia constante.
- **Verificación por columna**: col0 = sólido,contorno,sólido; col1 = contorno,sólido,contorno; col2 = sólido,contorno,sólido — mismo patrón, coherente en ambas direcciones.
- **Respuesta correcta**: cuadrado, sin rotar, sólido, 1 capa.
- **Distractores**:
  1. Cuadrado en contorno — invierte el relleno (el error más "obvio" del patrón).
  2. Pentágono sólido — cambia el tipo de figura.
  3. Cuadrado rotado 45° sólido — rotado cuando no debería.
  4. Cuadrado sólido con 2 capas — cambia `pliegues`.
- **Criterios 3/4**: `relleno` es estrictamente binario (sólido vs. contorno), nunca gradación de tono — cumple el punto 3 al pie de la letra. Alternativas distinguibles.

## mat-04 (fácil)

- **Regla**: el número de lados aumenta en 1 hacia la derecha y hacia abajo (`lados = 3 + fila + columna`).
- **Verificación por fila**: fila0 = 3,4,5; fila1 = 4,5,6; fila2 = 5,6,7 — paso constante de 1.
- **Verificación por columna**: col0 = 3,4,5; col1 = 4,5,6; col2 = 5,6,7 — mismo paso, coherente en ambas direcciones (regla diagonal, igual estructura que mat-01 pero en `lados`).
- **Respuesta correcta**: heptágono (7 lados), sin rotar, sólido, 1 capa.
- **Distractores**:
  1. Heptágono rotado 90° — rotado cuando no debería (marca de orientación visible).
  2. Heptágono en contorno — cambia `relleno`.
  3. Heptágono con 2 capas — cambia `pliegues`.
  4. Octágono (8 lados) — un lado de más.
- **Criterios 3/4**: cumple. Sin `pliegues` como regla controlada (solo aparece como distractor).

## mat-05 (media, 2 reglas)

- **Reglas**: (1) la rotación aumenta 45° hacia la derecha, con distinto punto de partida por fila (0°, 90°, 180°); (2) el número de capas aumenta 1 hacia la derecha pero se satura en 3, con distinto punto de partida por fila (1, 1, 2).
- **Verificación por fila**: rotación — fila0=0,45,90 / fila1=90,135,180 / fila2=180,225,270 (paso 45 en las 3). Pliegues — fila0=1,2,3 / fila1=1,2,3 / fila2=2,3,3(saturado) — cada fila sube de a 1 hasta el tope de 3.
- **Verificación por columna**: rotación coherente por columna (paso 90 entre filas en cada columna, ya que el punto de partida por fila también sube de a 90). Pliegues no es arithméticamente uniforme por columna (por la saturación en fila2), pero cada fila es individualmente verificable, que es el criterio exigido.
- **Respuesta correcta**: cuadrado, rotado 270°, sólido, 3 capas.
- **Distractores**:
  1. Pentágono a 270° con 3 capas — cambia el tipo de figura.
  2. Cuadrado a 270° en contorno con 3 capas — cambia `relleno`.
  3. Cuadrado a 315° con 3 capas — 45° de rotación de más.
  4. Cuadrado a 270° con 2 capas — una capa de menos.
- **`pliegues` es una de las 2 reglas controladas** — marcado para veto/confirmación de Camilo.
- **Criterios 3/4**: cumple.

## mat-06 (media, 2 reglas)

- **Reglas**: (1) la rotación aumenta 45° hacia la derecha, con distinto punto de partida por fila (45°, 0°, 315°); (2) el relleno alterna sólido/contorno hacia la derecha, con distinto punto de partida por fila (checkerboard con fase 0,1,0 por fila).
- **Verificación por fila**: rotación — fila0=45,90,135 / fila1=0,45,90 / fila2=315,0,45 (paso 45 constante). Relleno — fila0=sólido,contorno,sólido / fila1=contorno,sólido,contorno / fila2=sólido,contorno,sólido (alterna constante).
- **Verificación por columna**: rotación con paso constante de -45° entre filas en cada columna (45→0→315, etc.); relleno checkerboard también coherente por columna.
- **Respuesta correcta**: cuadrado, rotado 45°, sólido, 1 capa.
- **Distractores**:
  1. Cuadrado a 45° sólido con 2 capas — cambia `pliegues`.
  2. Cuadrado a 90° sólido — 45° de rotación de más.
  3. Cuadrado a 45° en contorno — cambia `relleno`.
  4. Pentágono a 45° sólido — cambia el tipo de figura.
- **Criterios 3/4**: cumple. Sin `pliegues` como regla controlada.

## mat-07 (media, 2 reglas)

- **Reglas**: (1) el número de capas sube y baja en "pico" por fila (1,2,1 en la primera columna), aumentando 1 hacia la derecha con tope en 3; (2) el relleno alterna sólido/contorno hacia la derecha, con distinto punto de partida por fila.
- **Verificación por fila**: pliegues — fila0=1,2,3 / fila1=2,3,3(saturado) / fila2=1,2,3. Relleno — fila0=contorno,sólido,contorno / fila1=sólido,contorno,sólido / fila2=contorno,sólido,contorno.
- **Verificación por columna**: cada columna es individualmente verificable por su propia progresión de pliegues y relleno; el patrón "pico" en pliegues (1,2,1) es intencional y documentado, no arbitrario.
- **Respuesta correcta**: cuadrado, sin rotar, contorno, 3 capas.
- **Distractores**:
  1. Cuadrado en contorno con 2 capas — una capa de menos.
  2. Cuadrado sólido con 3 capas — invierte el relleno.
  3. Pentágono en contorno con 3 capas — cambia el tipo de figura.
  4. Cuadrado rotado 45° en contorno con 3 capas — rotado cuando no debería.
- **`pliegues` y `relleno` son las 2 reglas controladas** — `pliegues` marcado para veto/confirmación de Camilo.
- **Criterios 3/4**: cumple.

## mat-08 (media, 2 reglas)

- **Reglas**: (1) el número de lados aumenta 1 hacia la derecha, con distinto punto de partida por fila (3,3,4); (2) la rotación aumenta 90° hacia la derecha, con distinto punto de partida por fila (0°,45°,90°).
- **Verificación por fila**: lados — fila0=3,4,5 / fila1=3,4,5 / fila2=4,5,6. Rotación — fila0=0,90,180 / fila1=45,135,225 / fila2=90,180,270.
- **Verificación por columna**: lados coherente por columna (col0=3,3,4; col1=4,4,5; col2=5,5,6 — paso +1 entre fila1→fila2, +0 entre fila0→fila1, reflejando el baseFila declarado). Rotación con paso +45 constante entre filas en cada columna.
- **Respuesta correcta**: hexágono (6 lados), rotado 270°, sólido, 1 capa.
- **Distractores**:
  1. Heptágono (7 lados) rotado 270° — un lado de más.
  2. Hexágono sin rotar (0°) — pierde la rotación de 270° (270° de diferencia, orientación muy distinta).
  3. Hexágono a 270° en contorno — cambia `relleno`.
  4. Hexágono a 270° con 2 capas — cambia `pliegues`.
- **Criterios 3/4**: cumple. Sin `pliegues` como regla controlada.

## mat-09 (media, 2 reglas)

- **Reglas**: (1) el número de lados sube 1 hacia la derecha, con distinto punto de partida por fila (4,5,3 — cada fila explora el patrón desde un punto distinto, sin relación aritmética entre filas); (2) el número de capas sube 1 hacia la derecha, igual en las 3 filas.
- **Verificación por fila**: lados — fila0=4,5,6 / fila1=5,6,7 / fila2=3,4,5 (paso +1 en las 3). Pliegues — las 3 filas idénticas: 1,2,3.
- **Verificación por columna**: pliegues constante por columna (col0 siempre 1, col1 siempre 2, col2 siempre 3). Lados no sigue un patrón aritmético entre filas (por diseño, cada fila es un punto de partida independiente), pero cada fila es individualmente verificable.
- **Respuesta correcta**: pentágono (5 lados), sin rotar, sólido, 3 capas.
- **Distractores**:
  1. Pentágono con 2 capas — una capa de menos.
  2. Pentágono rotado 90° — rotado cuando no debería.
  3. Pentágono en contorno — cambia `relleno`.
  4. Hexágono (6 lados) con 3 capas — cambia el tipo de figura.
- **`pliegues` es una de las 2 reglas controladas** — marcado para veto/confirmación de Camilo.
- **Criterios 3/4**: cumple.

## mat-10 (difícil, 3 reglas)

- **Reglas**: (1) rotación +45° hacia la derecha, partida por fila 0°/90°/180°; (2) pliegues +1 hacia la derecha con tope 3, partida por fila 1/1/2; (3) relleno alterna checkerboard, partida por fila 0/1/0.
- **Verificación por fila**: rotación — fila0=0,45,90 / fila1=90,135,180 / fila2=180,225,270. Pliegues — fila0=1,2,3 / fila1=1,2,3 / fila2=2,3,3(saturado). Relleno — fila0=sólido,contorno,sólido / fila1=contorno,sólido,contorno / fila2=sólido,contorno,sólido.
- **Verificación por columna**: rotación coherente por columna (paso +90 entre filas); relleno checkerboard coherente por columna; pliegues verificable fila a fila (ver mat-05 para la nota sobre saturación).
- **Respuesta correcta**: cuadrado, rotado 270°, sólido (relleno=0), 3 capas.
- **Distractores**:
  1. Pentágono a 270° sólido con 3 capas — cambia el tipo de figura.
  2. Cuadrado a 315° sólido con 3 capas — 45° de rotación de más.
  3. Cuadrado a 270° sólido con 2 capas — una capa de menos.
  4. Cuadrado a 270° en contorno con 3 capas — invierte el relleno.
- **`pliegues` es una de las 3 reglas controladas** — marcado para veto/confirmación de Camilo.
- **Criterios 3/4**: cumple.

## mat-11 (difícil, 3 reglas)

- **Reglas**: (1) rotación +45° hacia la derecha, partida por fila 45°/135°/225°; (2) lados +1 hacia la derecha, partida por fila 3/4/3; (3) relleno alterna checkerboard, partida por fila 1/0/1.
- **Verificación por fila**: rotación — fila0=45,90,135 / fila1=135,180,225 / fila2=225,270,315. Lados — fila0=3,4,5 / fila1=4,5,6 / fila2=3,4,5. Relleno — fila0=contorno,sólido,contorno / fila1=sólido,contorno,sólido / fila2=contorno,sólido,contorno.
- **Verificación por columna**: rotación coherente por columna (paso +90 entre filas); relleno checkerboard coherente; lados no sigue una progresión aritmética entre filas (3→4→3, patrón "pico" intencional), verificable fila a fila.
- **Respuesta correcta**: pentágono (5 lados), rotado 315°, contorno, 1 capa.
- **Distractores**:
  1. Pentágono rotado 45° en contorno — 270° de rotación de diferencia, orientación muy distinta (visible por la marca).
  2. Hexágono (6 lados) a 315° en contorno — cambia el tipo de figura.
  3. Pentágono a 315° sólido — invierte el relleno.
  4. Pentágono a 315° en contorno con 2 capas — cambia `pliegues`.
- **Criterios 3/4**: cumple. Sin `pliegues` como regla controlada (solo aparece como distractor).

## mat-12 (difícil, 3 reglas)

- **Reglas**: (1) lados +1 hacia la derecha, partida por fila 3/4/5; (2) pliegues en "pico" (1,2,1) +1 hacia la derecha con tope 3; (3) rotación +45° hacia la derecha, partida por fila 0°/45°/90°.
- **Verificación por fila**: lados — fila0=3,4,5 / fila1=4,5,6 / fila2=5,6,7. Pliegues — fila0=1,2,3 / fila1=2,3,3(saturado) / fila2=1,2,3. Rotación — fila0=0,45,90 / fila1=45,90,135 / fila2=90,135,180.
- **Verificación por columna**: lados y rotación coherentes por columna (paso +1 y +45 respectivamente entre filas); pliegues verificable fila a fila (patrón "pico" intencional).
- **Respuesta correcta**: heptágono (7 lados), rotado 180°, sólido, 3 capas.
- **Distractores**:
  1. Octágono (8 lados) a 180° con 3 capas — un lado de más.
  2. Heptágono a 180° con 2 capas — una capa de menos.
  3. Heptágono a 270° con 3 capas — 90° de rotación de más.
  4. Heptágono a 180° en contorno con 3 capas — invierte el relleno.
- **`pliegues` es una de las 3 reglas controladas** — marcado para veto/confirmación de Camilo.
- **Criterios 3/4**: cumple.

---

## Ítems de práctica (no se generan — escritos a mano)

Ambos se calcularon una única vez con el generador ya corregido y se transcribieron como objetos literales en `lib/data/matrices.ts`, para quedar inmunes a cualquier bug futuro del generador (punto 2 del bloqueante).

### mat-practica (regla más obvia: tipo de figura)

- **Regla**: el número de lados sube de 3 a 5 hacia la derecha, igual en las 3 filas (triángulo → cuadrado → pentágono).
- **Nota de criterio**: la spec menciona "cantidad" como la regla más obvia para la práctica 1, pensada para el ejemplo fijo del tutorial (que sí cuenta copias de una figura). El juego real (basado en `FiguraOrigami`) no tiene un atributo de "cantidad de figuras por celda" — cada celda es una sola figura paramétrica. Se usó `lados` (tipo de figura) como el atributo más simple y obvio disponible en este modelo, análogo en inmediatez a "cantidad". **Señalado aquí para que Camilo confirme o pida un ajuste.**
- **Respuesta correcta**: pentágono, sin rotar, sólido, 1 capa.
- **Distractores**: hexágono (un lado de más) / pentágono rotado 90° / pentágono en contorno / pentágono con 2 capas.

### mat-practica-2 (segunda regla más obvia: relleno binario)

- **Regla**: el relleno alterna sólido-contorno-sólido hacia la derecha, igual en las 3 filas.
- **Respuesta correcta**: cuadrado, sin rotar, sólido, 1 capa.
- **Distractores**: cuadrado en contorno (invierte la regla) / pentágono sólido / cuadrado rotado 45° / cuadrado con 2 capas.
- Nota: el distractor de rotación en este ítem es uno de los que el fix de `perturbarRotacion` corrigió (antes usaba 90°, que colisionaba con la simetría del cuadrado; ahora usa 45°).

---

## Resumen de verificación cruzada (criterios 3 y 4)

| Criterio | Estado |
|---|---|
| 3 — color nunca porta la regla | Cumple: color fijo y uniforme (`FiguraOrigamiSVG.tsx`), `tono` eliminado del modelo, `relleno` es binario (sólido/contorno). |
| 4 — alternativas distinguibles a simple vista | Cumple: cada distractor difiere en una sola propiedad de forma respecto a la correcta; verificado además por test automático de no-colisión visual (que encontró y permitió corregir un bug real). |
