import { describe, expect, it } from "vitest";
import { dimensiones } from "@/lib/data/contextos";
import { pesosAspiracion, type OpcionAspiracion } from "@/lib/data/aspiracion";

describe("pesosAspiracion", () => {
  const opciones: OpcionAspiracion[] = ["universidad", "tecnico", "trabajar", "no_se"];

  it("define pesos para todas las opciones del CHECK de la migración 00011", () => {
    for (const opcion of opciones) {
      expect(pesosAspiracion[opcion]).toBeDefined();
    }
  });

  it("cada opción con dirección usa dimensiones válidas y pesos que suman 1.0", () => {
    for (const opcion of ["universidad", "tecnico", "trabajar"] as const) {
      const pesos = pesosAspiracion[opcion];
      let suma = 0;
      for (const [dim, peso] of Object.entries(pesos)) {
        expect(dim in dimensiones).toBe(true);
        expect(peso).toBeGreaterThan(0);
        suma += peso ?? 0;
      }
      expect(suma).toBeCloseTo(1.0, 5);
    }
  });

  it("no_se es neutral: sin dimensiones", () => {
    expect(Object.keys(pesosAspiracion.no_se)).toHaveLength(0);
  });
});
