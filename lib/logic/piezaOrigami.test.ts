import { describe, expect, it } from "vitest";
import { esEspejada, transformarPieza } from "@/lib/logic/piezaOrigami";

describe("esEspejada", () => {
  it("cualquier rotación pura (sin espejar) nunca se detecta como espejada", () => {
    for (const angulo of [0, 17, 45, 90, 135, 200, 315]) {
      expect(esEspejada(transformarPieza(angulo, false))).toBe(false);
    }
  });

  it("cualquier versión espejada se detecta como espejada, sin importar el ángulo", () => {
    for (const angulo of [0, 17, 45, 90, 135, 200, 315]) {
      expect(esEspejada(transformarPieza(angulo, true))).toBe(true);
    }
  });
});
