import { describe, it, expect } from "vitest";
import { APODO_MAX_CODEPOINTS, correoSchema, sanitizarApodo, vincularCuentaSchema } from "@/lib/logic/cuenta";

describe("correoSchema", () => {
  it("acepta un correo válido y lo normaliza (trim + minúsculas)", () => {
    const resultado = correoSchema.safeParse("  Usuario@Ejemplo.CL ");
    expect(resultado.success).toBe(true);
    if (resultado.success) expect(resultado.data).toBe("usuario@ejemplo.cl");
  });

  it("rechaza correos inválidos", () => {
    expect(correoSchema.safeParse("no-es-correo").success).toBe(false);
    expect(correoSchema.safeParse("a@b").success).toBe(false);
    expect(correoSchema.safeParse("").success).toBe(false);
    expect(correoSchema.safeParse("   ").success).toBe(false);
  });
});

describe("vincularCuentaSchema", () => {
  it("acepta { correo }", () => {
    expect(vincularCuentaSchema.safeParse({ correo: "hola@ejemplo.cl" }).success).toBe(true);
  });

  it("rechaza body sin correo o con correo inválido", () => {
    expect(vincularCuentaSchema.safeParse({}).success).toBe(false);
    expect(vincularCuentaSchema.safeParse({ correo: "nope" }).success).toBe(false);
    expect(vincularCuentaSchema.safeParse({ correo: 42 }).success).toBe(false);
  });
});

describe("sanitizarApodo", () => {
  it("recorta espacios de los extremos y colapsa espacios internos", () => {
    expect(sanitizarApodo("  Ana   María  ")).toBe("Ana María");
  });

  it("elimina caracteres de control", () => {
    expect(sanitizarApodo("Ana\u0000María\u0007")).toBe("Ana María");
    expect(sanitizarApodo("Línea\nNueva")).toBe("Línea Nueva");
  });

  it("respeta code points: emojis cuentan como un carácter", () => {
    const apodoLargo = "🦢".repeat(25);
    expect(Array.from(sanitizarApodo(apodoLargo))).toHaveLength(APODO_MAX_CODEPOINTS);
  });

  it("trunca a 20 code points sin cortar un emoji por la mitad", () => {
    // 20 caracteres antes del emoji: el tope corta justo antes → el emoji NO entra
    expect(sanitizarApodo(`${"a".repeat(20)}🦢xyz`)).toBe("a".repeat(20));
    // 19 caracteres antes: el emoji entra completo, nunca partido
    expect(sanitizarApodo(`${"a".repeat(19)}🦢xyz`)).toBe(`${"a".repeat(19)}🦢`);
  });

  it("devuelve string vacío si solo había espacios o nada", () => {
    expect(sanitizarApodo("   ")).toBe("");
    expect(sanitizarApodo("")).toBe("");
  });
});
