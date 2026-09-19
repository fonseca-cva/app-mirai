// VERIFICACIÓN DE BORRADO ESTRICTO — los arneses E2E deben fallar si el delete
// afecta 0 filas.
//
// ── EL BUG QUE ESTOS TESTS IMPIDEN QUE VUELVA ─────────────────────────────────
// PostgREST, cuando RLS deniega un DELETE, no lanza error: afecta **0 filas** y
// devuelve `error = null`. Un `await cliente.from("sesiones").delete().eq("id", id)`
// reporta ÉXITO sin borrar nada.
//
// Consecuencia medida en staging: 17 sesiones con `es_prueba = true` acumuladas
// entre 2026-09-19 14:10:58+00 y 14:21:55+00, creadas por los arneses E2E, cuyos
// `delete()` "tenían éxito" y no eliminaban ninguna fila.
//
// ── QUÉ SE COMPRUEBA AQUÍ ─────────────────────────────────────────────────────
// Estos son tests ESTÁTICOS (leen el código fuente) porque el comportamiento real
// depende de RLS en un backend vivo. Verifican tres cosas:
//   1. Todo `.delete()` de `sesiones` en los arneses pide `.select(...)` y comprueba
//      el número de filas afectadas. Sin `.select()`, PostgREST no devuelve las
//      filas y es IMPOSIBLE distinguir 1 de 0.
//   2. Existe un helper de borrado estricto que exige exactamente 1 fila.
//   3. La migración 00023 define la política DELETE limitada a sesiones propias y
//      `es_prueba = true`.
//   4. LOS DOS CAMINOS DE LIMPIEZA REGISTRAN UN FALLO DE PRUEBA, no una simple
//      advertencia. Un `console.warn` NO falla el test, así que una fuga de datos
//      de prueba quedaba invisible en el resultado de la suite.
//
// La comprobación contra un backend real vive en `e2e/real.spec.ts` (caso a/b), que
// crea y borra sesiones de prueba exigiendo el resultado.

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";

// Rutas relativas a la RAÍZ del repo (vitest corre desde ahí).
const ARNESES = ["e2e/real.spec.ts", "e2e/real-smoke.spec.ts"];
const MIGRACION = "supabase/migrations/00023_delete_sesiones_de_prueba.sql";

describe("borrado estricto — un delete de 0 filas NO es éxito", () => {
  it("todo .delete() de sesiones en los arneses exige filas afectadas", () => {
    // Sin `.select()`, PostgREST no devuelve `data`: el llamador recibe `data = null`
    // y no puede saber si borró. Este test impide reintroducir ese patrón.
    for (const ruta of ARNESES) {
      const fuente = readFileSync(ruta, "utf8");
      // Todas las llamadas a delete sobre "sesiones".
      const deletes = fuente.match(/from\("sesiones"\)\s*\n?\s*\.delete\(\)[^;]*/g) ?? [];
      expect(deletes.length, `${ruta}: se esperaba al menos un delete de sesiones`).toBeGreaterThan(0);

      for (const llamada of deletes) {
        expect(
          llamada.includes(".select("),
          `${ruta}: un delete de sesiones NO pide .select(...), así que no puede ` +
            `distinguir 1 fila de 0. Fragmento: ${llamada.replace(/\s+/g, " ").slice(0, 120)}`
        ).toBe(true);
      }
    }
  });

  it("real.spec.ts tiene un helper que LANZA si no se borra exactamente 1 fila", () => {
    const fuente = readFileSync("e2e/real.spec.ts", "utf8");

    // El helper debe existir y verificar el número de filas.
    expect(fuente).toContain("borrarSesionDePrueba");
    expect(
      fuente.includes("data.length !== 1"),
      "El helper debe exigir exactamente 1 fila afectada (data.length !== 1 → error)."
    ).toBe(true);
    // Y debe LANZAR, no solo avisar: una fuga silenciosa es el bug original.
    expect(
      /throw new Error\(\s*`delete de .* afectó/.test(fuente),
      "El helper debe lanzar cuando el delete no afecta 1 fila."
    ).toBe(true);
  });

  it("el smoke verifica el id eliminado y FALLA si afecta 0 filas", () => {
    const fuente = readFileSync("e2e/real-smoke.spec.ts", "utf8");

    // Debe pedir las filas afectadas.
    expect(
      fuente.includes('.delete().eq("id", sessionId).select("id")'),
      "El smoke debe pedir .select(\"id\") tras el delete."
    ).toBe(true);
    // Y comprobar el número y el id de las filas afectadas, con aserciones que
    // FALLAN la prueba (no solo avisan).
    expect(
      /expect\.soft\(\s*data\?\.length \?\? 0,[\s\S]*?\)\.toBe\(1\)/.test(fuente),
      "Debe exigir 1 fila afectada con expect.soft(...).toBe(1)."
    ).toBe(true);
    expect(
      /expect\.soft\(\s*data\?\.\[0\]\?\.id,[\s\S]*?\)\.toBe\(sessionId\)/.test(fuente),
      "Debe exigir que el id eliminado sea el esperado, con expect.soft(...).toBe(sessionId)."
    ).toBe(true);
    // Y FALLAR la prueba si no borró (antes solo avisaba con console.warn, que no
    // marca el test en rojo). Se comprueba que el mensaje de FUGA queda DENTRO de un
    // expect.soft, no de un console.warn: se verifica por proximidad textual, que es
    // suficiente para este test estático.
    const indiceFuga = fuente.indexOf("FUGA: el delete de");
    expect(indiceFuga, "debe existir el mensaje de fuga del delete").toBeGreaterThan(-1);
    const ventanaPrevia = fuente.slice(Math.max(0, indiceFuga - 200), indiceFuga);
    expect(
      ventanaPrevia.includes("expect.soft("),
      "El mensaje de FUGA del delete debe estar dentro de un expect.soft, no de un console.warn."
    ).toBe(true);
  });

  it("ningún arnés se traga el fallo del delete en silencio", () => {
    for (const ruta of ARNESES) {
      const fuente = readFileSync(ruta, "utf8");
      // El patrón prohibido: un delete sin comprobación de `data`, en una línea.
      const deletesCiegos = (fuente.match(/await [a-zA-Z]+\.from\("sesiones"\)\.delete\(\)\.eq\([^)]*\);/g) ?? []);
      expect(
        deletesCiegos,
        `${ruta}: hay ${deletesCiegos.length} delete(s) que no comprueban las filas afectadas: ` +
          `${deletesCiegos.join(" | ")}`
      ).toHaveLength(0);
    }
  });
});

describe("los caminos de limpieza FALLAN la prueba, no solo avisan", () => {
  it("real-smoke.spec.ts usa expect.soft en los 4 caminos de limpieza", () => {
    const fuente = readFileSync("e2e/real-smoke.spec.ts", "utf8");
    // Los caminos son: error del delete, 0 filas / id distinto, excepción, y falta
    // de token. Todos deben registrar un fallo.
    const usos = (fuente.match(/expect\.soft\(/g) ?? []).length;
    expect(
      usos,
      `Se esperaban al menos 4 expect.soft en el smoke (uno por camino de limpieza); hay ${usos}.`
    ).toBeGreaterThanOrEqual(4);

    // Y cada uno debe comprobar algo que falle: toBeNull/toHaveLength/toBe/not.toBeNull.
    expect(fuente).toMatch(/expect\.soft\([\s\S]*?\)\.toBeNull\(\)/); // error del delete
    expect(fuente).toMatch(/expect\.soft\([\s\S]*?\)\.toBe\(1\)/); // filas afectadas
    expect(fuente).toMatch(/expect\.soft\([\s\S]*?\)\.toBe\(sessionId\)/); // id correcto
  });

  it("real.spec.ts falla la prueba si queda alguna sesión sin borrar", () => {
    const fuente = readFileSync("e2e/real.spec.ts", "utf8");
    // El fallo acumulado se registra con expect.soft + toHaveLength(0).
    expect(fuente).toMatch(/expect\.soft\([\s\S]*?fallosLimpieza[\s\S]*?\)\.toHaveLength\(0\)/);
    // Y NO puede limitarse a imprimir la advertencia.
    expect(
      /if \(fallosLimpieza\.length > 0\) \{\s*console\.warn/.test(fuente),
      "El cleanup acumulado sigue usando console.warn; debe fallar la prueba."
    ).toBe(false);
  });

  it("ningún arnés resuelve una fuga SOLO con console.warn", () => {
    for (const ruta of ARNESES) {
      const fuente = readFileSync(ruta, "utf8");
      // Se permiten menciones del patrón en COMENTARIOS (explican la corrección),
      // pero no llamadas ejecutables.
      const llamadas = fuente.match(/^\s*console\.(warn|error)\(/gm) ?? [];
      expect(
        llamadas,
        `${ruta}: hay ${llamadas.length} llamada(s) a console ejecutables. Una fuga debe ` +
          `fallar la prueba con expect.soft, no solo registrarse en el log.`
      ).toHaveLength(0);
    }
  });
});

describe("migración 00023 — política DELETE acotada", () => {
  it("existe el archivo", () => {
    expect(existsSync(MIGRACION), `Falta ${MIGRACION}`).toBe(true);
  });

  it("define la política con las DOS condiciones (propia + es_prueba)", () => {
    const sql = readFileSync(MIGRACION, "utf8");
    expect(sql).toContain("FOR DELETE");
    expect(sql).toMatch(/auth\.uid\(\)\s*=\s*user_id/);
    expect(sql).toMatch(/es_prueba\s*=\s*true/);
  });

  it("NO borra ni altera otras políticas (solo agrega la nueva)", () => {
    const sql = readFileSync(MIGRACION, "utf8");
    // Se permite DROP de la propia política (idempotencia), pero no de otras.
    const drops = sql.match(/DROP POLICY[^;]*/g) ?? [];
    for (const d of drops) {
      expect(d).toContain("Sesión: delete propia de prueba (auth)");
    }
    // No debe tocar SELECT/INSERT/UPDATE de ninguna tabla.
    expect(sql).not.toMatch(/CREATE POLICY[^;]*FOR (SELECT|INSERT|UPDATE)/);
    // Y no debe borrar datos.
    expect(sql).not.toMatch(/^\s*DELETE FROM/m);
  });
});
