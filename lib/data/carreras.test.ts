// Validación de integridad de la base de carreras curadas — los pesos alimentan
// matching v2 (lib/logic/matching.ts), así que estas invariantes son contrato.

import { describe, it, expect } from "vitest";
import { carreras } from "@/lib/data/carreras";

describe("carreras curadas", () => {
  it("ids únicos y nombre presente", () => {
    const ids = new Set(carreras.map((c) => c.id));
    expect(ids.size).toBe(carreras.length);
    for (const c of carreras) {
      expect(c.nombre.trim().length).toBeGreaterThan(0);
    }
  });

  it("pesos de área suman 1.0 y no repiten la dimensión principal en secundarias", () => {
    for (const c of carreras) {
      const secundarias = c.area.secundarias ?? [];
      const sumaSecundarias = secundarias.reduce((acc, s) => acc + s.peso, 0);
      // El peso de la principal es implícito (1 - Σsecundarias): no puede quedar negativo.
      expect(sumaSecundarias).toBeLessThanOrEqual(1);
      expect(secundarias.some((s) => s.codigo === c.area.principal)).toBe(false);
      for (const s of secundarias) {
        expect(s.peso).toBeGreaterThan(0);
        expect(s.peso).toBeLessThanOrEqual(1);
      }
    }
  });

  it("perfil cognitivo completo: 5 claves, pesos en 0-1 y suma 1.0", () => {
    for (const c of carreras) {
      const { patrones, numerico, espacial, memoria, comunicacion } = c.perfilCognitivo;
      const pesos = [patrones, numerico, espacial, memoria, comunicacion];
      expect(pesos.every((p) => p !== null && p >= 0 && p <= 1)).toBe(true);
      const suma = (patrones ?? 0) + (numerico ?? 0) + (espacial ?? 0) + (memoria ?? 0) + (comunicacion ?? 0);
      expect(suma).toBeCloseTo(1, 9);
    }
  });

  it("toda carrera tiene nota honesta (se muestra en el informe)", () => {
    for (const c of carreras) {
      expect(c.notaHonesta?.trim().length).toBeGreaterThan(0);
    }
  });

  it("vía formativa válida", () => {
    for (const c of carreras) {
      expect(["universitaria", "tecnica_ip_cft"]).toContain(c.via);
    }
  });
});
