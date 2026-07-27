# Auditoría — Juego de Secuencias: Anexo 3 (estados explícitos)

Cubre el Anexo 3 del bloqueante: separación perceptible entre presentación, turno de
respuesta y rondas consecutivas, más la regla permanente de "sin audio en juegos cognitivos".

## Hallazgo original

No había separación perceptible entre la presentación de la secuencia y el turno del
usuario, ni entre rondas consecutivas. Con símbolos parecidos entre rondas, el usuario no
sabía si había empezado una nueva — error de interfaz que contaminaba el puntaje, no de
memoria real.

## Máquina de fases (pura, testeada sin UI)

Implementada como `reducirFaseSecuencias` en `lib/logic/secuencias.ts`, separada del hook de
React (`useSecuencias.ts`) que solo dispara los temporizadores reales. Igual que
`avanzarSecuencia`, es una función pura testeable con `vitest` sin necesitar DOM/jsdom
(el proyecto no tenía infraestructura de render de hooks, y no se agregó una nueva
dependencia de testing para esto).

Fases: `mostrando → pausa → esperando-respuesta → transición → mostrando (…)` o
`esperando-respuesta → timeout → mostrando (repetido)`, terminando en `terminado` sin
transición cuando la máquina adaptativa (`avanzarSecuencia`) lo indica.

| Fase | Duración | UI |
|---|---|---|
| `mostrando` | 800ms/símbolo + 250ms entre símbolos | Etiqueta "Mira la secuencia", pad atenuado (opacity-30) |
| `pausa` | 900ms fijos | Tablero vacío, sin etiqueta, pad sigue atenuado |
| `esperando-respuesta` | hasta 20s de inactividad | Etiqueta "Tu turno", pad habilitado con fade-in (opacity-100, transition 500ms) |
| `transición` | 1200ms fijos | Pantalla propia con mensaje ("¡Bien! Ahora una más larga…" si acertó, "Vamos de nuevo, mismo largo…" si erró sin terminar el juego), tablero completamente oculto |
| `timeout` | hasta que el usuario actúa | "¿Sigues ahí?" + botón "Repetir esta ronda", tablero oculto |
| `terminado` | — | dispara `onCompletar`, sin pantalla propia |

Constantes centralizadas en `lib/logic/secuencias.ts` (`MS_SIMBOLO`, `MS_ENTRE_SIMBOLOS`,
`MS_PAUSA_FIN_PRESENTACION`, `MS_TRANSICION_RONDA`, `MS_TIMEOUT_RESPUESTA`) y verificadas en
`lib/logic/secuencias.test.ts` contra el contrato de tiempos acordado.

## Reglas de negocio verificadas por test

- El timeout de 20s se reinicia en cada toque válido dentro de la ronda (usuario lento pero
  activo no se corta a mitad de respuesta).
- El timeout se puede repetir **una sola vez** por ronda (`timeoutUsadoEnRonda`): un segundo
  timeout en la misma ronda se resuelve como respuesta incorrecta (mismo camino que un toque
  equivocado), para no dejar la ronda colgada indefinidamente.
- Un acierto en el largo tope (8) termina el juego directo, sin pantalla de transición.
- Un segundo error consecutivo en el mismo largo termina el juego directo, sin transición.
- Eventos que no corresponden a la fase actual (incluida cualquier fase posterior a
  `terminado`) son ignorados — la máquina no cambia de estado.

## Telemetría

Nueva columna aditiva `repetido_timeout boolean default false` en `respuestas_cognitivo`
(migración `00006_secuencias_repetido_timeout.sql`), poblada solo para intentos de
`secuencias` que se registraron tras usar la repetición por timeout. `false` para
`matrices`/`rotacion` (no aplica).

## Regla permanente: sin audio en juegos cognitivos

Verificado por búsqueda exhaustiva en `BloqueMatrices.tsx`, `BloqueRotacion.tsx` y
`BloqueSecuencias.tsx`/`useSecuencias.ts`/`PadSecuencias.tsx`: no existe ningún elemento de
audio en los tres juegos de medición. No se requirió cambio de código — se documenta aquí
como regla permanente y punto de auditoría futura: ningún tono ni sonido debe acompañar los
ítems de los bloques de medición (motivo: el audio no puede garantizarse en contexto escolar,
y un estudiante con sonido tendría un canal adicional de memoria que rompería la
comparabilidad de los puntajes). El audio decorativo en otras partes del sitio queda fuera de
esta regla.

## Verificación manual en navegador

Además de los 13 tests nuevos en `secuencias.test.ts` (máquina de fases + contrato de tiempos),
se verificó visualmente con un dev server real (Playwright headless) el flujo completo:
práctica (mostrando → pausa en blanco confirmada por extracción de texto → esperando), juego
real (etiquetas "Mira la secuencia"/"Tu turno", pad atenuado/habilitado con las clases de
opacidad correctas), pantalla de transición con tablero completamente limpio, y pantalla de
timeout con botón "Repetir esta ronda" funcional tras 20s reales de inactividad. Sin errores
de consola en ningún paso.
