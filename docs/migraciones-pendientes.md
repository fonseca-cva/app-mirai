# Migraciones aplicadas y secuencia de aplicación

> ✅ **`00016` y `00019`–`00023` fueron aplicadas en producción.** Verificado con
> `npm run verificar-esquema`: 42 comprobaciones OK, 0 fallas.

## Estado verificado (con `npm run verificar-esquema`)

| Migración | Estado en producción | Consecuencia de que faltara |
|---|---|---|
| `00015` validez verbal (columnas) | ✅ aplicada | — |
| `00016` RPC `actualizar_evaluacion_verbal` | ✅ **aplicada** | El guardado del resultado verbal y su reintento asíncrono fallaban |
| `00018` reparación de esquema | ✅ aplicada | — |
| `00019` `envios_informe_permanente` + RPC | ✅ **aplicada** | El envío del informe no dejaba auditoría |
| `00020` índices únicos de respuestas | ✅ **aplicada** | **Bloqueante**: sin ella, el `upsert` daba `42P10` y no se guardaba NINGUNA respuesta |
| `00021` RPC verbal con resultado explícito | ✅ **aplicada** | Una respuesta ya evaluada quedaba eternamente en la cola |
| `00022` RLS de propiedad de la sesión padre | ✅ **aplicada** | Un usuario podía insertar filas propias apuntando a la sesión de otro |
| `00023` política DELETE de sesiones de prueba | ✅ **aplicada** | Los `delete()` de los arneses reportaban éxito afectando 0 filas |

Verificación de los índices únicos de `00020` y de las cuatro RPC: todos presentes.

## Orden de aplicación

El orden importa: `00021` reemplaza funciones que crea `00016`, y `00020` crea los
índices que el código usa en cada `upsert`.

### Paso 0 — Duplicados sobre STAGING (obligatorio antes de 00020)

`00020` crea índices únicos. **Si hay duplicados históricos, el `CREATE UNIQUE
INDEX` falla** (y la migración queda a medias). La consulta está al final de
`supabase/migrations/00020_unicidad_respuestas.sql`:

```sql
WITH dup AS (
  SELECT 'respuestas_gustos' AS tabla, session_id, contexto_id AS clave, COUNT(*) AS n
    FROM respuestas_gustos GROUP BY session_id, contexto_id HAVING COUNT(*) > 1
  UNION ALL
  SELECT 'respuestas_cognitivo', session_id, juego || '/' || item_id, COUNT(*)
    FROM respuestas_cognitivo GROUP BY session_id, juego, item_id HAVING COUNT(*) > 1
  UNION ALL
  SELECT 'respuestas_verbal', session_id, tarea, COUNT(*)
    FROM respuestas_verbal GROUP BY session_id, tarea HAVING COUNT(*) > 1
  UNION ALL
  SELECT 'respuestas_actividades', session_id, actividad_id, COUNT(*)
    FROM respuestas_actividades GROUP BY session_id, actividad_id HAVING COUNT(*) > 1
  UNION ALL
  SELECT 'respuestas_asignaturas', session_id, asignatura_id, COUNT(*)
    FROM respuestas_asignaturas GROUP BY session_id, asignatura_id HAVING COUNT(*) > 1
  UNION ALL
  SELECT 'respuestas_divergente', session_id, objeto, COUNT(*)
    FROM respuestas_divergente GROUP BY session_id, objeto HAVING COUNT(*) > 1
)
SELECT * FROM dup ORDER BY tabla, session_id;
```

- **0 filas** → se puede aplicar `00020` tal cual.
- **>0 filas** → **detenerse**. Hay que decidir caso a caso qué conservar. Esta
  migración **no borra ni fusiona datos** (regla: no eliminar datos de producción).

Nota sobre `respuestas_verbal`: un mismo `(session_id, tarea)` con 2 filas es un
duplicado real, y la causa probable es el reintento tras `no_pertinente` insertando
en vez de actualizar (ya corregido en el código).

### Paso 1 — Staging primero

Aplicar en el proyecto de **TEST**, en este orden, y correr la verificación después
de cada una:

1. `00016_reintento_verbal.sql` — RPC verbal booleana.
2. `00019_envios_informe_permanente.sql` — tabla y RPC de auditoría (**devuelve BIGINT**
   con el id insertado, para poder verificar la persistencia desde un test).
3. `00020_unicidad_respuestas.sql` — **solo si el Paso 0 dio 0 filas**.
4. `00021_verbal_resultado_explicito.sql` — RPC con resultado explícito (depende de
   que `00016` esté aplicada, porque la reemplaza).
5. `00022_rls_propiedad_sesion.sql` — las políticas de las tablas hijas pasan a exigir
   también que la sesión padre sea del usuario. **Correr antes la consulta de filas
   sospechosas** que está al final de ese archivo (si devuelve filas, decidir qué
   hacer con ellas: la migración no las toca).

**Orden completo: `00016 → 00019 → 00020 → 00021 → 00022`**

### Paso 2 — Verificación en staging

```bash
npm run verificar-esquema
npm run verificar-rls
E2E_ALLOW_REAL_BACKEND=1 \
E2E_SUPABASE_URL=https://<test>.supabase.co \
E2E_SUPABASE_ANON_KEY=<anon de test> \
  npm run test:e2e:real
```

Los 5 casos `@real` deben pasar. Si el caso (b) falla con `42P10`, `00020` no quedó
aplicada.

### Paso 3 — Producción

Solo después de que staging esté verde. Mismo orden. En producción, además:

1. Correr el Paso 0 **en producción** (los duplicados pueden diferir de staging).
2. Aplicar `00016`, `00019`, `00020`, `00021`.
3. `npm run verificar-esquema` (debe salir en verde).
4. Un recorrido manual de la experiencia completa con una sesión de prueba real
   (`?prueba=1&real=1`), verificando que las respuestas llegan a la base.

## Rollback previsto

| Migración | Reversión | Efecto |
|---|---|---|
| `00016` | `DROP FUNCTION actualizar_evaluacion_verbal(...)` | El reintento verbal deja de guardar (vuelve al estado anterior) |
| `00019` | `DROP FUNCTION registrar_envio_informe(...)`; `DROP TABLE envios_informe_permanente` | Se pierde la auditoría (los envíos siguen funcionando) |
| `00020` | `DROP INDEX uq_respuestas_<tabla>_...` (uno por tabla) | Vuelve a permitir duplicados; el código deja de poder escribir (42P10) |
| `00021` | `DROP FUNCTION actualizar_evaluacion_verbal_resultado(...)` | El código **degrada solo** a la RPC booleana de `00016`; vuelve la limitación de la cola |
| `00022` | Recrear las políticas de `00003` (solo `user_id`) + `DROP FUNCTION sesion_es_del_usuario_actual(uuid)` | **REABRE el agujero de aislamiento.** Solo si el cambio rompiera escrituras legítimas (no se espera: el código ya crea la sesión padre con el mismo `auth.uid()`) |

**Ninguna migración borra datos**, así que el rollback de esquema es seguro. El
rollback de `00020` deja el sistema sin escrituras: si hay que revertirla, hay que
revertir también el código que usa `upsert`.

## Datos de prueba

Los E2E `@real` escriben **solo** con `es_prueba=true` y limpian sus filas al
terminar (`delete` de la sesión, que arrastra las hijas por `ON DELETE CASCADE`).
Aun así, **usar siempre un proyecto de test**, nunca producción: la guarda lo
impone.


## Consulta para inspeccionar las políticas resultantes

Tras aplicar `00022` (y también como diagnóstico antes), correr en el SQL Editor:

```sql
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'respuestas_gustos','respuestas_cognitivo','respuestas_verbal','respuestas_divergente',
    'respuestas_actividades','respuestas_asignaturas','aspiraciones','tutorial_estado',
    'resultados','correos_informe'
  )
ORDER BY tablename, cmd;
```

Lo que hay que ver en el resultado, para cada tabla hija:

- `cmd = INSERT` → `with_check` contiene **ambas** condiciones:
  `auth.uid() = user_id` **y** `sesion_es_del_usuario_actual(session_id)`.
- `cmd = UPDATE` → lo mismo en `qual` **y** en `with_check`.
- `cmd = SELECT` → sigue conteniendo **solo** `auth.uid() = user_id` (no se amplió).

Si alguna tabla conserva únicamente `auth.uid() = user_id` en INSERT/UPDATE, `00022`
no se aplicó por completo y el agujero sigue abierto.
