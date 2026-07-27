# Auditoría — Ítems de "Pliegues en el espacio" (10 reales + 2 de práctica)

Generado tras el bloqueante de calidad de ítems cognitivos. Cubre los puntos 3, 4 y 6 del bloqueante,
y el Anexo 2 (narrativa visual y rampa de dificultad).

## Cambios aplicados (Anexo 2 + fork resuelto)

- **Modelo de datos extendido**: `ItemPlegado` ahora soporta `pliegues: Eje[]` (1-2 dobleces secuenciales)
  y `puntos: Punto[]` (1-2 perforaciones), con tipo `Eje` que incluye `"diagonal"`. La respuesta correcta
  se calcula por reflexión compuesta: cada punto se refleja a través de cada pliegue en secuencia,
  generando 2ⁿ × m puntos finales (n = número de pliegues, m = número de perforaciones).
  Ver `lib/logic/rotacion.ts` → `combinacionesReflejo()` y `generarItemPlegado()`.
- **Resolución del fork (a)/(b)**: se optó por (b) — los 10 ítems reales son ahora todos de tipo
  `plegado`, reemplazando los 5 ítems de `rotacion` que antes alternaban. Esto cumple la rampa 4-4-2
  sin ambigüedad y unifica la mecánica del bloque bajo un solo tipo de razonamiento espacial.
  Los ítems de rotación mental se conservan solo como práctica (`rot-practica`).
- **Rampa 4-4-2 cumplida**:
  - 4 fáciles: 1 pliegue + 1 perforación (offsetDecoy 0.35-0.30)
  - 4 medios: 2 con 1 pliegue + 2 perforaciones, 2 con 2 pliegues + 1 perforación (offsetDecoy 0.25-0.20)
  - 2 difíciles: 1 con pliegue diagonal + 1 perforación, 1 con 2 pliegues + 2 perforaciones (offsetDecoy 0.12-0.10)
- **Consigna fija**: "El papel se dobla por la línea, se perfora doblado, y luego se abre. ¿Cómo queda?"
- **Narrativa de 3 paneles**: `PanelDoblez` (papel + línea de doblez + flecha de dirección + puntos marcados),
  `PanelPerforado` (papel doblado con perforaciones + leyenda), `AlternativaPlegado` (papel desplegado con
  puntos resultantes). Implementado en `FiguraPlegadoSVG.tsx`.
- **Demo animada**: `DemoPlegado` en `Demos.tsx` con loop doblar → perforar → desplegar, y fallback
  estático para `prefers-reduced-motion`.

## Bugs encontrados y corregidos tras la implementación inicial del Anexo 2

Detectados en revisión posterior, no en la implementación original — documentados por transparencia:

1. **Render de `PanelPerforado` con 2 pliegues**: `mitadQuePliega` usaba solo `pliegues[0]`/`puntos[0]`
   para decidir qué mitad del papel mostrar "ya doblada". Para los 3 ítems con 2 dobleces (rot-07,
   rot-08, rot-10) esto dibujaba el papel doblado a la mitad (1 doblez) en vez de a un cuarto (2 dobleces
   vertical+horizontal), mostrando visualmente menos capas de las que el ítem exige razonar. Corregido con
   `mitadQuePliegaCompuesta()`: intersecta las mitades de todos los pliegues no-diagonales usando el mismo
   punto de referencia. La diagonal mantiene la simplificación original (no ocurre combinada con otro eje
   en los datos actuales).
2. **Dato físicamente imposible en `rot-10`**: sus dos perforaciones originales, `(0.75,0.35)` y
   `(0.25,0.65)`, caían en cuadrantes opuestos respecto a `["vertical","horizontal"]` — imposible en la
   realidad, ya que ambas perforaciones se hacen sobre el mismo paquete doblado y deben compartir el mismo
   cuadrante superviviente. La aritmética de `combinacionesReflejo` no lo detectaba (funciona igual sin
   importar el cuadrante de entrada), por lo que pasó tests y auditoría sin ser notado. Corregido moviendo
   el segundo punto a `(0.90,0.15)`, mismo cuadrante superior-derecho que el primero.
3. **Test de invariante nuevo**: `lib/data/rotacion.test.ts` → "todos los puntos de un ítem caen del mismo
   lado de cada pliegue no-diagonal" — verifica para los 10 ítems reales que ningún punto quede en un
   cuadrante físicamente incompatible con los demás. Este test habría atrapado el bug de `rot-10`
   automáticamente.

## Invariantes verificadas automáticamente (tests en CI)

Todas en `lib/data/rotacion.test.ts` y `lib/logic/rotacion.test.ts`:

- **10 ítems, todos tipo plegado, rampa 4 fácil / 4 media / 2 difícil** — verificado por test.
- **Cada ítem tiene 4 alternativas únicas**, verificadas por contenido de puntos (no solo por id).
- **Alternativas correcta = reflexión compuesta**: cada punto original se refleja secuencialmente a través
  de todos los pliegues declarados; el resultado se verifica punto a punto contra lo que muestra el ítem
  (test `"la alternativa correcta refleja todos los puntos"`).
- **Ningún distractor coincide con la respuesta correcta** — verificado por test de igualdad de puntos.
- **Alternativas distinguibles**: ninguna alternativa tiene el mismo conjunto de puntos que otra
  (test de no-colisión).
- **Estructura por dificultad**: fácil siempre 1 pliegue + 1 punto; medio variado (1+2 o 2+1);
  difícil diagonal o 2+2.
- **Ítems de práctica**: `rot-practica` verifica que la correcta nunca está espejada y los distractores
  siempre lo están (por cálculo geométrico de área firmada). `ple-practica` verifica que la correcta
  contiene el reflejo esperado.

## Ítem por ítem

### Fáciles (4)

| ID | Pliegues | Puntos | OffsetDecoy | Respuesta correcta | Distractores |
|---|---|---|---|---|---|
| rot-01 | `["vertical"]` | `(0.80, 0.30)` | 0.35 | 2 puntos: `(0.80,0.30)` + `(0.20,0.30)` | (1) reflejo en horizontal; (2) desplazado vertical; (3) sin reflejar |
| rot-02 | `["horizontal"]` | `(0.25, 0.85)` | 0.35 | 2 puntos: `(0.25,0.85)` + `(0.25,0.15)` | (1) reflejo en vertical; (2) desplazado horizontal; (3) sin reflejar |
| rot-03 | `["vertical"]` | `(0.65, 0.15)` | 0.30 | 2 puntos: `(0.65,0.15)` + `(0.35,0.15)` | (1) reflejo en horizontal; (2) desplazado vertical; (3) sin reflejar |
| rot-04 | `["horizontal"]` | `(0.20, 0.70)` | 0.30 | 2 puntos: `(0.20,0.70)` + `(0.20,0.30)` | (1) reflejo en vertical; (2) desplazado horizontal; (3) sin reflejar |

Regla única en todos: **el punto se refleja al otro lado del pliegue** (un solo pliegue, un solo punto).

### Medios (4)

| ID | Pliegues | Puntos | OffsetDecoy | Respuesta correcta | Nota |
|---|---|---|---|---|---|
| rot-05 | `["vertical"]` | `(0.75,0.30)` + `(0.75,0.70)` | 0.25 | 4 puntos: ambos se reflejan en X | 1 pliegue, 2 perforaciones (dos puntos independientes) |
| rot-06 | `["horizontal"]` | `(0.20,0.60)` + `(0.80,0.60)` | 0.25 | 4 puntos: ambos se reflejan en Y | 1 pliegue, 2 perforaciones |
| rot-07 | `["vertical","horizontal"]` | `(0.70,0.70)` | 0.20 | 4 puntos: reflejo compuesto (V→H) | 2 pliegues, 1 perforación (el punto se refleja dos veces, generando 4 copias) |
| rot-08 | `["vertical","horizontal"]` | `(0.30,0.30)` | 0.20 | 4 puntos: reflejo compuesto (V→H) | 2 pliegues, 1 perforación |

Distractores en todos: (1) último pliegue con eje incorrecto; (2) desplazamiento de un punto; (3) sin reflejar.

### Difíciles (2)

| ID | Pliegues | Puntos | OffsetDecoy | Respuesta correcta | Nota |
|---|---|---|---|---|---|
| rot-09 | `["diagonal"]` | `(0.70,0.30)` | 0.12 | 2 puntos: `(0.70,0.30)` + `(0.30,0.70)` | Pliegue diagonal (reflejo sobre la recta y=x). El offsetDecoy bajo hace que el distractor desplazado sea muy cercano al correcto. |
| rot-10 | `["vertical","horizontal"]` | `(0.75,0.35)` + `(0.90,0.15)` | 0.10 | 8 puntos: ambos puntos se reflejan 2 veces (V→H) | 2 pliegues + 2 perforaciones = 2 × 2² = 8 puntos. El offsetDecoy extremadamente bajo (0.10) hace el distractor desplazado casi indistinguible. Ambos puntos comparten el cuadrante superior-derecho (ver nota de bug corregido abajo). |

### Prácticas (2)

| ID | Tipo | Descripción |
|---|---|---|
| rot-practica | Rotación mental | Referencia 0°, correcta 90°, distractores espejados a 210°, 290°, 10° |
| ple-practica | Plegado | 1 pliegue vertical, punto (0.80,0.30), offsetDecoy 0.35. Objeto literal, no generado. |

## Criterio 3 — Color nunca porta la regla

Cumple: el color es uniforme y decorativo en todos los SVG de plegado (`var(--color-coral)` para líneas de
doblez y marcas de perforación, `var(--color-teal-profundo)` para puntos y flechas). No hay variación de
tono ni gradación que pueda servir como señal de regla.

## Criterio 4 — Alternativas distinguibles a simple vista

Cumple: los 3 distractores son categorías de error cualitativamente distintas:
1. **Eje incorrecto**: el último pliegue usa un eje diferente → los puntos reflejados caen en posiciones
   claramente distintas (p.ej. reflejo vertical vs horizontal).
2. **Desplazado**: un punto reflejado está corrido respecto a su posición real → perceptible incluso en
   pantalla de celular cuando el offset es grande (fácil/medio); en los ítems difíciles (offset bajo)
   la diferencia sigue siendo ≥2px en la representación SVG de 80×80.
3. **Sin reflejar**: los puntos quedan en su posición original, sin ningún reflejo → la alternativa muestra
   la mitad de puntos que la correcta (cuando hay 1 pliegue), o en posiciones distintas (cuando hay 2).

Ninguna alternativa requiere mirarse dos veces para distinguirse de otra: o tiene menos puntos, o los
puntos están en posiciones claramente diferentes.

## Criterio 6 — Distractores espejados (rotación mental)

Aplica solo a `rot-practica`, verificado por test que recalcula el área firmada de cada alternativa
(no confía solo en el flag `espejada`). Las prácticas de plegado no usan espejado.

## Rampa de dificultad (Anexo 2)

| Nivel | Cantidad | Composición | Qué lo hace más difícil |
|---|---|---|---|
| Fácil | 4 | 1 pliegue, 1 perforación | OffsetDecoy alto (0.35-0.30) |
| Medio | 4 | 1 pliegue+2 perforaciones (2 ítems) o 2 pliegues+1 perforación (2 ítems) | Más información que procesar (más puntos o más pliegues) |
| Difícil | 2 | Diagonal (1 ítem) o 2 pliegues+2 perforaciones (1 ítem) | Eje diagonal es menos intuitivo que V/H; 8 puntos finales requieren más atención |

**Cumplida.** Los 10 ítems reales son de plegado y cubren los 4/4/2 exigidos.
