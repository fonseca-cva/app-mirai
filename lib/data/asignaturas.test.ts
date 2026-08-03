import { describe, expect, it } from "vitest";
import { asignaturas } from "@/lib/data/asignaturas";
import { dimensiones } from "@/lib/data/contextos";

describe("asignaturas (Bloque A3): invariantes estructurales", () => {
  it("tiene exactamente 10 asignaturas", () => {
    expect(asignaturas).toHaveLength(10);
  });

  it("cada asignatura mapea a 1-2 dimensiones con pesos que suman 1.0", () => {
    for (const asg of asignaturas) {
      const codigos = Object.keys(asg.pesos);
      expect(codigos.length, asg.nombre).toBeGreaterThanOrEqual(1);
      expect(codigos.length, asg.nombre).toBeLessThanOrEqual(2);
      const suma = codigos.reduce((acc, c) => acc + (asg.pesos[c as keyof typeof dimensiones] ?? 0), 0);
      expect(suma, asg.nombre).toBeCloseTo(1.0, 5);
      // Los códigos deben ser dimensiones válidas.
      for (const c of codigos) {
        expect(dimensiones[c as keyof typeof dimensiones]).toBeDefined();
      }
    }
  });

  it("cubre 7 de las 8 dimensiones (ges queda sin asignatura natural)", () => {
    // PENDIENTE DECISIÓN DE CAMILO: ninguna asignatura del currículum mapea
    // naturalmente a Gestión y Emprendimiento. Opciones: (a) dejar ges sin aporte
    // de asignaturas y renormalizar el promedio ponderado en la integración, o
    // (b) agregar un ítem 11 ("Economía y Sociedad", electivo III-IV medio).
    const cubiertas = new Set<string>();
    for (const asg of asignaturas) {
      for (const c of Object.keys(asg.pesos)) cubiertas.add(c);
    }
    expect(cubiertas).toEqual(new Set(["cie", "cre", "dat", "nat", "sal", "soc", "tec"]));
  });

  it("tiene ids únicos y nombres no vacíos", () => {
    const ids = new Set(asignaturas.map((a) => a.id));
    expect(ids.size).toBe(asignaturas.length);
    for (const a of asignaturas) {
      expect(a.nombre.trim().length).toBeGreaterThan(2);
    }
  });
});
