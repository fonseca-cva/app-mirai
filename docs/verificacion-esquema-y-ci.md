# Verificación de esquema y CI — guía para el fundador

## Qué verifica `scripts/verificar-esquema.mjs`

Compara **lo que la aplicación exige** contra el **esquema real de Supabase**, y
**falla con exit code ≠ 0 ante cualquier discrepancia**.

Por qué existe: ya pasó dos veces que producción tenía un esquema más viejo que el
código. La migración `00018` tuvo que reparar 5 columnas de `respuestas_verbal` y la
tabla `respuestas_divergente` que nunca se habían aplicado.

### Alcance REAL (verificado, con evidencia ejecutada)

| | Se verifica |
|---|---|
| ✅ | Existencia de **tablas** y **columnas** que el código usa |
| ✅ | Existencia de cada restricción **UNIQUE** que el código necesita para su `onConflict`, y la **PK** de `sesiones` |
| ✅ | Existencia e invocabilidad de las **funciones RPC** que el código llama |
| ✅ | **CHECK**: que la restricción exista y rechace un valor concreto fuera de su lista |
| ✅ | Consistencia interna: todo `onConflict` del código está declarado; ningún `.upsert()` sin `onConflict`; ningún `.insert()` directo en `respuestas_verbal` |

### Fuera de alcance (el script NO verifica, y no lo afirma)

| | NO se verifica | Por qué |
|---|---|---|
| ❌ | **Tipos** de columna (`uuid`, `jsonb`, `smallint`…) | PostgREST no expone `information_schema` y el proyecto no tiene ningún RPC de introspección |
| ❌ | **Nullability** (`NOT NULL`) | Misma limitación |
| ❌ | **Definición completa de los CHECK** | Se detecta que existe y que rechaza un valor concreto; no se enumeran todos sus valores |
| ❌ | **Firmas** de funciones (tipos de parámetros/retorno) | PostgREST solo expone la invocabilidad |
| ❌ | **Políticas RLS** | Requiere privilegios que la anon key no tiene |

Para verificación de tipos/nullability real haría falta un RPC de introspección
(`SECURITY DEFINER`, solo lectura) que un humano decida agregar. El verificador
detecta su ausencia y lo reporta.

### Seguridad de las sondas (todas de solo lectura)

Las sondas de UNIQUE y CHECK envían un payload **deliberadamente inválido** (valor que
viola el CHECK, o FK inexistente), de modo que Postgres resuelve la restricción y
rechaza la fila. Se comprobó empíricamente contra el proyecto que en **ningún caso**
queda una fila escrita:

| Situación | Error | ¿Escribe? |
|---|---|---|
| Índice único ausente | `42P10` | No (ni llega a escribir) |
| CHECK violado | `23514` | No |
| RLS bloquea | `42501` | No |
| FK inexistente | `23503` | No |

Una versión anterior usaba un payload con valores **válidos**, que podía insertar una
fila real. Eso está corregido.

### Sobre la sesión anónima

El script crea una sesión anónima (las policies RLS exigen `auth.uid()`) y la cierra
con `signOut` al terminar. **Eso cierra la sesión en ese cliente; NO elimina el usuario
anónimo del proyecto** — los usuarios anónimos de Supabase no se borran desde el
cliente. Cada corrida deja un usuario anónimo más, igual que cualquier visita a la web.


## Cómo ejecutarlo

### Local (usa `.env.local`, como el resto de los scripts del repo)

```bash
npm run verificar-esquema
```

El script carga `.env.local` por su cuenta si existe (no pisa variables ya
presentes en el entorno). Equivale a:

```bash
node --env-file=.env.local scripts/verificar-esquema.mjs
```

### Con variables explícitas

```bash
NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  node scripts/verificar-esquema.mjs
```

### Sin credenciales

Sale con **exit 0** y un aviso: solo puede validar la consistencia interna del
manifiesto. Es el modo que corre en cualquier clon sin secretos.

### Modo estricto (CI de producción)

```bash
npm run verificar-esquema:estricto
```

Falla también si **no** hay credenciales. Se usa en el job de CI que sí las tiene,
para que un secret mal configurado no pase como verde.

## CI (`.github/workflows/ci.yml`)

| Job | Cuándo corre | Qué hace |
|---|---|---|
| `calidad` | todo push a `main`/`dev` y todo PR | `typecheck`, `lint`, `test`, `build`. Sin credenciales. |
| `esquema-produccion` | solo push a `main`, y solo si hay secretos | `verificar-esquema:estricto` |

Para habilitar el job de esquema, configurar en
**Settings → Secrets and variables → Actions**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

La **anon key** es pública (es la misma que va en el bundle del navegador). **Nunca
configurar la service-role key**: este verificador no debe poder saltarse RLS.

## Seguridad del script

- Usa **solo la anon key**. Nunca la service-role.
- Crea una **sesión anónima** (las policies RLS exigen `auth.uid() = user_id`; sin
  sesión, todas las sondas quedarían bloqueadas y no se podría distinguir "falta el
  índice" de "RLS no me dejó mirar").
- **Nunca imprime** la URL con credenciales, la key, ni headers. Los errores se
  reportan por código y mensaje del proveedor.
- La sesión anónima se cierra al terminar (`signOut`), así no deja usuarios anónimos
  "fantasma".

## Consultas de auditoría manual (SQL Editor)

Detección de duplicados **antes** de aplicar la migración `00020` — está al final de
`supabase/migrations/00020_unicidad_respuestas.sql`.

Detección de resultados con `generado_en` anterior a `creada_en`:

```sql
SELECT r.session_id, s.creada_en, r.generado_en
FROM resultados r
JOIN sesiones s ON s.id = r.session_id
WHERE r.generado_en < s.creada_en
ORDER BY s.creada_en DESC;
```
