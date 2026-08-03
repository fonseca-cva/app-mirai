import { describe, it, expect } from "vitest";
import { construirCorreoInformePermanente } from "@/lib/email/plantillaInforme";

const ENLACE = "https://www.miraiapp.cl/informe/abc123DEF456ghi789JKL";

describe("construirCorreoInformePermanente", () => {
  it("arma un correo corto que lleva al enlace del informe permanente", () => {
    const correo = construirCorreoInformePermanente(ENLACE);

    expect(correo.subject).toBe("Tu informe de Mirai está acá");
    expect(correo.html).toContain(ENLACE);
    expect(correo.text).toContain(ENLACE);
  });

  it("no usa trackers de apertura: sin imágenes, sin pixel, sin analytics", () => {
    const correo = construirCorreoInformePermanente(ENLACE);

    expect(correo.html).not.toMatch(/<img/i);
    expect(correo.html).not.toMatch(/pixel|beacon|analytics|track/i);
    // Sin emojis ni contenido pesado: HTML simple y texto plano de respaldo.
    expect(correo.html).toMatch(/^<div/);
    expect(correo.text.length).toBeGreaterThan(0);
  });

  it("mantiene el texto de respaldo legible por sí solo (sin depender del HTML)", () => {
    const correo = construirCorreoInformePermanente(ENLACE);

    expect(correo.text).toContain("Tu informe de Mirai está acá");
    expect(correo.text).toContain("Compártelo solo con quien tú quieras");
  });
});
