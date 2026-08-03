import { describe, expect, it } from "vitest";
import {
  OBJETOS_DIVERGENTE,
  MIN_IDEAS_POR_OBJETO,
  limpiarIdeas,
  contarIdeas,
} from "@/lib/data/divergente";

describe("OBJETOS_DIVERGENTE: invariantes", () => {
  it("son exactamente 3 objetos", () => {
    expect(OBJETOS_DIVERGENTE).toHaveLength(3);
  });

  it("ids únicos y con prefijo div-", () => {
    const ids = new Set(OBJETOS_DIVERGENTE.map((o) => o.id));
    expect(ids.size).toBe(OBJETOS_DIVERGENTE.length);
    OBJETOS_DIVERGENTE.forEach((o) => expect(o.id).toMatch(/^div-/));
  });

  it("cada objeto tiene nombre y consigna no vacíos", () => {
    OBJETOS_DIVERGENTE.forEach((o) => {
      expect(o.nombre.trim().length).toBeGreaterThan(0);
      expect(o.consigna.trim().length).toBeGreaterThan(0);
    });
  });

  it("el mínimo de ideas es 3 (alcanzable pero exige generar alternativas)", () => {
    expect(MIN_IDEAS_POR_OBJETO).toBe(3);
  });
});

describe("limpiarIdeas / contarIdeas", () => {
  it("cuenta una idea por línea no vacía y recorta espacios", () => {
    expect(limpiarIdeas("sujetar papeles\nabrir candados\nlimpiar teclado")).toEqual([
      "sujetar papeles",
      "abrir candados",
      "limpiar teclado",
    ]);
    expect(contarIdeas("sujetar papeles\nabrir candados\nlimpiar teclado")).toBe(3);
  });

  it("ignora líneas vacías y de solo espacios", () => {
    const texto = "  idea uno  \n\n   \nidea dos\n";
    expect(limpiarIdeas(texto)).toEqual(["idea uno", "idea dos"]);
    expect(contarIdeas(texto)).toBe(2);
  });

  it("texto vacío o solo saltos → 0 ideas", () => {
    expect(limpiarIdeas("")).toEqual([]);
    expect(limpiarIdeas("   \n  \n")).toEqual([]);
    expect(contarIdeas("")).toBe(0);
  });

  it("soporta saltos de línea Windows (\\r\\n)", () => {
    expect(limpiarIdeas("a\r\nb\r\nc")).toEqual(["a", "b", "c"]);
  });
});
