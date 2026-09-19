# Retención local de datos y reanudación — decisiones de pilot readiness

## Qué guarda el navegador y por qué

La experiencia guarda estado local en **`localStorage`** (clave `mirai-experiencia`)
y una cookie técnica (`mirai_session_id`). **No es tracking**: ambos son de primera
parte y sirven solo para que el alumno pueda continuar donde quedó.

### Contenido del localStorage

| Dato | Se guarda | Sensibilidad |
|---|---|---|
| `sessionId` | ✅ | Identificador aleatorio (UUID v4), no identificable por sí solo |
| `paso` | ✅ | En qué pantalla quedó |
| `respuestasGustos` | ✅ | Preferencias (escala 0-2) |
| `respuestasCognitivo` | ✅ | Aciertos/tiempos por ítem |
| **`respuestasVerbal`** | ✅ | ⚠️ **TEXTO ABIERTO escrito por el alumno** |
| `respuestasDivergente` | ✅ | ⚠️ Texto abierto (ideas) |
| `respuestasActividades` / `respuestasAsignaturas` | ✅ | Preferencias |
| `aspiracion` | ✅ | ⚠️ Puede incluir una carrera o área en texto libre |
| `experienciaIncompleta` | ✅ | Control de reanudación |
| `expiraEn` | ✅ | Cuándo caduca el estado local |
| `modoPrueba` / `modoPruebaReal` | ❌ | **A propósito**: la autorización de prueba se revalida server-side en cada carga |
| `colaSync` | ❌ | **A propósito**: una cola serializada podría reenviar payloads de una sesión ya descartada |
| `pruebaRealCortada` | ❌ | Fail-stop de una experiencia anterior |
| `audioActivado` | ❌ | Preferencia efímera de la pestaña |

**Conclusión importante:** el `localStorage` contiene **respuestas del instrumento**,
incluidas las de texto abierto. No es un dato inocuo y debe tratarse como tal.

## Reglas de retención implementadas

1. **Expiración técnica.** `expiraEn` se fija al marcar la experiencia como
   empezada, con un techo de **`RETENCION_MS` = 7 días**, exactamente la vida de la
   cookie. **No se retiene más tiempo** y no se debe ampliar sin revisión legal.
2. **Purga automática.** El estado local se elimina si:
   - no hay cookie (`sin_cookie`),
   - la cookie **no coincide** con el `sessionId` persistido (`cookie_distinta`),
   - expiró (`expirado`).
   Se ejecuta al montar la página (`purgarEstadoInvalido`) y también desde
   `retomarExperiencia()`.
3. **Limpieza al cerrar.** `descartarExperiencia()` borra cookie y estado local
   completos (al completar la experiencia con "Volver al inicio", o al elegir
   "Empezar de nuevo").
4. **Coherencia obligatoria.** `retomarExperiencia()` **jamás** cambia el
   `sessionId` conservando respuestas: si el estado persistido no corresponde a la
   cookie, se descarta entero. Esto es lo que impide que dos alumnos del mismo
   computador terminen en una sesión mezclada.

## ¿`sessionStorage` para el piloto escolar?

`sessionStorage` sobrevive a las recargas de la pestaña pero **no al cierre de
ella**. Es una opción más conservadora y **planteada, no decidida**:

| | `localStorage` (actual) | `sessionStorage` |
|---|---|---|
| Recarga de pestaña | ✅ reanuda | ✅ reanuda |
| Cerrar y volver más tarde | ✅ reanuda (hasta 7 días) | ❌ se pierde |
| Cambio de alumno en el PC | Requiere que elija "Empezar de nuevo" | No queda nada que heredar |
| Datos de menores en el disco | Persisten hasta 7 días/TTL | Se borran al cerrar |

**Recomendación para el piloto escolar:** `sessionStorage` es más seguro por
defecto en computadores compartidos (no deja respuestas en el disco tras cerrar).
La contrapartida es perder la reanudación entre sesiones de navegación, que hoy es
una promesa de producto. **Es una decisión que requiere revisión legal y del
fundador**, porque cambia la experiencia prometida; no se tomó unilateralmente.

## Qué se reanuda EXACTAMENTE y qué no

| Elemento | ¿Se reanuda? |
|---|---|
| Sesión (mismo `sessionId`) | ✅ Sí |
| Paso del flujo | ✅ Sí |
| Respuestas de todos los bloques | ✅ Sí |
| Aspiración | ✅ Sí |
| Índice/ítem actual de cada bloque | ✅ Sí — **derivado** de las respuestas (abre en el primer ítem pendiente) |
| Juego cognitivo en curso | ✅ Sí — derivado (primer juego incompleto) |
| Tarea verbal en curso | ✅ Sí — derivada (primera tarea sin respuesta) |
| Número de intento verbal (1 o 2) | ✅ Sí — derivado |
| **Borrador de texto verbal a medio escribir** | ❌ **No** — se pierde; el alumno reescribe esa tarea |
| **Borrador de ideas divergente a medio escribir** | ❌ **No** — se pierde; el alumno reescribe ese objeto |
| Progreso parcial DENTRO de un juego cognitivo | ❌ **No** — el juego incompleto se reinicia entero |

Sobre los dos últimos: no se afirma "exactamente donde quedó". El borrador vive en
`useState` y no se persiste a propósito (es texto a medio redactar, de alto valor
para nadie y riesgo de retención); y un juego cognitivo a medias no se puede
continuar sin repetir estímulos ya vistos, así que **se reinicia descartando
explícitamente sus respuestas parciales** para no mezclar intentos
(`respuestasSinJuego` en `lib/store/checkpoints.ts`).

En el caso del juego reiniciado, las respuestas ya sincronizadas a Supabase **no se
borran**: se reemplazan por clave cuando el alumno vuelve a responder (upsert
idempotente). Es decir, la repetición no ensucia los datos: sobrescribe.


## Pantalla de elección al abrir con una experiencia en curso

Al abrir `/experiencia` con una experiencia empezada, **siempre** se ofrece la
elección explícita ("Continuar donde la dejé" / "Empezar de nuevo"). Es la
salvaguarda del computador compartido: si no apareciera, el segundo alumno
heredaría la sesión del primero en silencio.

Esto tuvo dos bugs en el camino, ambos corregidos y hoy cubiertos por E2E:

1. **La pantalla no aparecía nunca al reanudar.** La condición exigía
   `paso === "intro"` (añadido para evitar el bug 2), así que al volver con estado
   en curso la app retomaba automáticamente sin preguntar.
2. **Bucle al pulsar "Empezar".** `crearEnIntro()` marcaba la experiencia como
   incompleta y, en el re-render intermedio, la pantalla de decisión reaparecía:
   el alumno quedaba atrapado.

La solución separa ambas cosas: la pantalla depende de **si hubo una elección**
(`decisionTomada`), no de en qué paso está el store; y `crearEnIntro()` marca la
decisión **antes** de crear la sesión, cerrando la ventana del re-render.

## Hidratación (React error #418)

El estado persistido (paso, respuestas) vive solo en el cliente. Si el primer
render de cliente lo usa directamente, difiere del HTML del servidor y React lanza
el error de hidratación #418 en **cada** reanudación.

Se corrigió con dos medidas:

- `useHidratado()` (basado en `useSyncExternalStore`): devuelve `false` en el
  servidor y `true` en el cliente, sin desajuste. Mientras no haya hidratado, la
  página muestra un placeholder idéntico en ambos lados.
- Los índices de bloque se calculan **después** de hidratar
  (`indiceManual ?? (hidratado ? pendiente : 0)`), nunca en el inicializador de
  `useState` (que leería el store del cliente durante el render del servidor).

## Render de un bloque completo

`siguienteIndicePendiente` devuelve `catálogo.length` cuando todas las respuestas
están presentes. Indexar con ese valor daba `undefined` y el componente crasheaba
al acceder a `.id`. Ahora los bloques usan `estadoBloque()`, que devuelve
`item: null` en ese caso, y **renderizan la pantalla de bloque terminado** en vez
de una tarjeta vacía. La decisión `hecho` se **deriva** en el render (no se
sincroniza con un efecto), lo que además evita el render en cascada.
