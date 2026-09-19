# Pruebas E2E (Playwright) — guía para el fundador

> **Ningún test de esta suite apunta a producción.** Los que podrían hacerlo
> (`@real`) están protegidos por una guarda fail-closed que **aborta la corrida**
> si detecta credenciales de producción.

## Dos proyectos, tres tipos de prueba

| Proyecto | Archivos | Tipo | Backend | Secretos |
|---|---|---|---|---|
| `chromium-mock` | `flujos.spec.ts`, `bloques.spec.ts` | **E2E de navegador**, backend interceptado | En memoria | No |
| `chromium-real` | `real.spec.ts` | **Integración de esquema** (SDK directo, sin navegador) | Supabase de TEST | Sí |
| `chromium-real` | `real-smoke.spec.ts` | **E2E de navegador real** (page → UI → Supabase) | Supabase de TEST | Sí |

**La distinción importa:** `real.spec.ts` llama a `@supabase/supabase-js` sin `page`
ni navegador: comprueba que las tablas, constraints y RPC existen y se comportan como
el código espera. Es integración, no E2E. El único E2E real es `real-smoke.spec.ts`,
que abre la aplicación y verifica desde otro cliente que la fila se persistió.

Los tests de `chromium-mock` interceptan **todas** las peticiones a Supabase
(`/rest/v1`, `/auth/v1`) y a `/api/*` con un PostgREST mínimo en memoria. Por eso
pueden correr sin credenciales y **no pueden escribir en ningún backend**.

## Comandos

```bash
npm run test:e2e          # todos los proyectos
npm run test:e2e:mock     # solo los interceptados (el que corre en CI)
npm run test:e2e:real     # solo contra el backend de TEST
npm run test:e2e:ui       # modo interfaz, para depurar
```

El servidor de Next se levanta en el **puerto 3100** (`npm run start:e2e`), nunca en
el 3000 del desarrollo, y **nunca** contra un dominio desplegado.

## Ejecutar las pruebas `@real`

Estas pruebas comprueban lo que ningún mock puede demostrar: que las escrituras
idempotentes, las RPC y el aislamiento RLS funcionan contra PostgreSQL real.

### 1. Crea un proyecto Supabase de TEST

Distinto del de producción. En el plan gratuito puedes tener un proyecto aparte
para esto, o usar una rama de base de datos.

### 2. Aplica las migraciones EN ORDEN sobre el proyecto de test

Ver `docs/migraciones-pendientes.md`. Como mínimo hacen falta `00015`, `00016`,
`00018`, `00019`, `00020` y `00021` para que los cinco casos pasen.

### 3. Exporta las variables (con consentimiento explícito)

```bash
export E2E_ALLOW_REAL_BACKEND=1                 # obligatorio: sin esto no corre
export E2E_SUPABASE_URL=https://<proyecto-de-test>.supabase.co
export E2E_SUPABASE_ANON_KEY=<anon key del proyecto de TEST>
export E2E_DEBUG_KEY=<clave del modo prueba, DISTINTA de la de producción>
```

Usa la **anon key** del proyecto de test. **Nunca la service-role.**

#### Por qué `E2E_DEBUG_KEY` y cómo se conecta con `DEBUG_KEY`

Son dos nombres para la misma clave, en dos lados distintos:

| Variable | Dónde vive | Para qué |
|---|---|---|
| `E2E_DEBUG_KEY` | En tu shell (el runner) | El navegador la envía por la URL: `?prueba=1&clave=…` |
| `DEBUG_KEY` | En el servidor de pruebas | El servidor la valida contra la cookie de `/debug` |

`playwright.config.ts` **inyecta `DEBUG_KEY = E2E_DEBUG_KEY`** en el `webServer`, para
que ambos lados coincidan sin que tengas que exportar las dos.

La inyección es **siempre explícita, aunque esté vacía**, para que `next start` **no
lea el `DEBUG_KEY` de producción de `.env.local`**. Si se omitiera, el servidor de
pruebas heredaría la clave real y el modo prueba quedaría abierto con la credencial
de producción.

**La guarda rechaza** que `E2E_DEBUG_KEY` sea igual al `DEBUG_KEY` de producción: si
la clave de test se filtra, no debe abrir el `/debug` real.

**La URL se construye con `encodeURIComponent`**, así que una clave con caracteres
especiales (`+`, `/`, `=`, espacios) viaja correctamente.

#### El smoke exige que la autorización sea ACEPTADA

Antes de pulsar cualquier CTA, el smoke comprueba que la app **no** muestra el
fail-stop "Modo prueba detenido". Si `DEBUG_KEY` no está bien configurada en el
servidor, el test **falla ahí**, en vez de continuar y fingir que probó algo.

### 4. Ejecuta

```bash
npm run test:e2e:real
```

### Qué comprueban los 6 casos (5 de integración + 1 E2E)

**Integración de esquema** (`real.spec.ts`, sin navegador):

| | Caso | Por qué importa |
|---|---|---|
| a | Creación de la sesión padre con `es_prueba=true` | La FK y la RLS lo exigen antes de cualquier dato hijo |
| b | Escritura repetida idempotente de un bloque | Requiere el índice único de `00020`: es lo que impide duplicar al reintentar |
| c | RPC verbal: `actualizado` → `ya_evaluado` → `inexistente` | Requiere `00021`; verifica que la 2ª llamada NO pisa la evaluación y que otro usuario no puede tocarla |
| d | RPC de auditoría del informe | Requiere `00019` **en su versión revisada**: exige que devuelva un `BIGINT` con el id (con `VOID` el test falla, porque no demuestra persistencia) |
| e | RLS de propiedad de la sesión padre | Requiere `00022`: B no puede insertar en NINGUNA tabla hija de A (parametrizado sobre 9 tablas), ni actualizar sus filas, y A sí puede |

**E2E de navegador** (`real-smoke.spec.ts`, con `page`):

| | Caso | Por qué importa |
|---|---|---|
| f | UI → Supabase: sesión y aspiración persistidas | Es el único camino completo navegador → aplicación → base. Verifica `es_prueba=true` **en la fila**, la existencia real de la aspiración y que la autorización de prueba fue aceptada |

La comprobación de `es_prueba` **en la fila** va integrada en (f), no como caso aparte:
separarla solo servía para mirar el estado local y dejaba una sesión sin limpiar.

### Sin caminos de falso verde

El smoke **no tiene ninguna rama que apruebe sin consultar Supabase**:

- si no se obtiene el access token del alumno → **falla** (antes se anotaba y seguía);
- la sesión y la aspiración se verifican **obligatoriamente** contra Supabase;
- `es_prueba = true` se comprueba **en la fila**, no solo en el store;
- toda sesión creada se limpia en `finally`.

## La guarda contra producción (fail-closed)

`e2e/guardaProduccion.ts` corre como `globalSetup` **antes** de cualquier test y
aborta si algo no cuadra:

1. Falta `E2E_ALLOW_REAL_BACKEND=1` → aborta.
2. Faltan `E2E_SUPABASE_URL` o `E2E_SUPABASE_ANON_KEY` → aborta.
3. `E2E_SUPABASE_URL` **coincide** con `NEXT_PUBLIC_SUPABASE_URL` de producción
   (de `.env.local`, `.env.production.local` o del entorno) → aborta.
4. La anon key de test es **la misma** que la de producción → aborta.
5. El host está en una lista de prohibidos → aborta.

**Nunca imprime el valor de las claves**, solo compara.

### Cómo saber que la guarda funciona

```bash
# Debe ABORTAR con "Falta E2E_ALLOW_REAL_BACKEND=1"
E2E_SUPABASE_URL=https://test.supabase.co E2E_SUPABASE_ANON_KEY=x \
  npx playwright test --project=chromium-real
```

```bash
# Debe ABORTAR con "coincide con la URL de PRODUCCIÓN"
E2E_ALLOW_REAL_BACKEND=1 \
E2E_SUPABASE_URL="$(grep -m1 NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d= -f2-)" \
E2E_SUPABASE_ANON_KEY="$(grep -m1 NEXT_PUBLIC_SUPABASE_ANON_KEY .env.local | cut -d= -f2-)" \
  npx playwright test --project=chromium-real
```

La segunda es la prueba que importa: **sin la guarda, esos tests habrían escrito en
producción.**

## Si no hay entorno de test

La corrida **ABORTA con exit ≠ 0** y no ejecuta ningún test. No hay omisión
silenciosa ni suite vacía "exitosa":

```
$ npm run test:e2e:real
✗ chromium-real ABORTADO — guarda de protección de producción
  • Falta E2E_ALLOW_REAL_BACKEND=1 (consentimiento explícito para usar un backend real).
```

Es deliberado: un `@real` que no se ejecuta **no cuenta como verificado**, y un
resumen que dijera "0 tests" daría una falsa impresión de éxito.

## Aislamiento del build de pruebas

`playwright.config.ts` inyecta SIEMPRE `NEXT_PUBLIC_SUPABASE_URL` y
`NEXT_PUBLIC_SUPABASE_ANON_KEY` en el proceso del servidor de pruebas, **sin
depender de `.env.local`** (que apunta a producción). Sin eso, `next build` leería
ese archivo y el servidor de test heredaría las credenciales de **producción**.

Cuando no hay entorno de test se usa un origen **ficticio**
(`https://e2e-backend.invalid`, TLD reservado por RFC 2606 que nunca resuelve) en
vez de dejarlas vacías. No es un detalle cosmético: con la variable vacía,
`supabase` queda en `null`, el cliente no intenta sincronizar, `syncSesion` devuelve
`false` y el CTA de la intro **bloquea la experiencia** con "No pudimos preparar tu
experiencia". Con un origen ficticio, el cliente funciona y las peticiones las
intercepta el mock en memoria.


## Qué NO se limpia tras una corrida real

| Tabla | ¿Se borra? | Por qué |
|---|---|---|
| `sesiones` y `respuestas_*` | ✅ Sí, en `finally` | `ON DELETE CASCADE` desde la sesión |
| `envios_informe_permanente` | ❌ No | El RPC no concede `DELETE` al cliente (a propósito) |
| `envios_otp` | ❌ No | Igual: solo lo escribe el contador de rate limit |
| Usuarios anónimos | ❌ No | Supabase no los borra desde el cliente |

Por eso **estos tests deben correr contra un proyecto de staging que se pueda
resetear**, nunca contra producción. La guarda lo impone. Los registros de auditoría
que quedan llevan correos `@example.invalid`, así que son identificables.

## Migración 00019 y la verificación de la auditoría

La migración `00019` (en su versión revisada) hace que `registrar_envio_informe`
**devuelva el id** insertado en vez de `VOID`. Con `VOID` solo se podía comprobar que
la llamada no diera error, lo que **no demuestra** que la fila exista. La aplicación
ignora el valor de retorno, así que el cambio es compatible.
