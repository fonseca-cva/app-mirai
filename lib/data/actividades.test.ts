import { describe, expect, it } from "vitest";
import { actividades, actividadesPorDimension } from "@/lib/data/actividades";
import { dimensiones } from "@/lib/data/contextos";

describe("actividades (Bloque A2): invariantes estructurales", () => {
  it("tiene exactamente 24 ítems", () => {
    expect(actividades).toHaveLength(24);
  });

  it("tiene exactamente 3 ítems por cada una de las 8 dimensiones", () => {
    const porDimension = actividadesPorDimension();
    expect(Object.keys(porDimension)).toHaveLength(8);
    for (const codigo of Object.keys(dimensiones)) {
      expect(porDimension[codigo as keyof typeof dimensiones], codigo).toBe(3);
    }
  });

  it("tiene ids únicos con prefijo act- y texto no vacío", () => {
    const ids = new Set(actividades.map((a) => a.id));
    expect(ids.size).toBe(actividades.length);
    for (const a of actividades) {
      expect(a.id).toMatch(/^act-[a-z]{3}-\d{2}$/);
      expect(a.texto.trim().length).toBeGreaterThan(10);
    }
  });

  it("no repite el mismo texto entre ítems", () => {
    const textos = new Set(actividades.map((a) => a.texto));
    expect(textos.size).toBe(actividades.length);
  });
});
