import { describe, expect, it } from "vitest";
import {
  MARCADORES,
  construirPayloadSeguro,
  construirPromptSeguro,
  sanitizarTextoEstudiante,
} from "@/lib/anonimizacion";

describe("sanitizarTextoEstudiante", () => {
  it("reemplaza RUT con puntos y guion", () => {
    const { texto, marcadores } = sanitizarTextoEstudiante(
      "Mi RUT es 12.345.678-9 y estudio tercero medio."
    );
    expect(texto).toContain(MARCADORES.rut);
    expect(texto).not.toContain("12.345.678-9");
    expect(marcadores.rut).toBe(1);
  });

  it("reemplaza RUT sin puntos con guion y dígito verificador", () => {
    const { texto, marcadores } = sanitizarTextoEstudiante("12345678-9");
    expect(texto).toContain(MARCADORES.rut);
    expect(texto).not.toContain("12345678-9");
    expect(marcadores.rut).toBe(1);
  });

  it("reemplaza teléfonos móviles chilenos (con y sin +56)", () => {
    const { texto, marcadores } = sanitizarTextoEstudiante(
      "Llámame al +56 9 1234 5678 o al 987654321."
    );
    expect(texto).not.toContain("+56 9 1234 5678");
    expect(texto).not.toContain("987654321");
    expect(marcadores.telefono).toBe(2);
  });

  it("reemplaza direcciones de correo", () => {
    const { texto, marcadores } = sanitizarTextoEstudiante(
      "Escribe a juan.perez@ejemplo.cl por favor."
    );
    expect(texto).not.toContain("juan.perez@ejemplo.cl");
    expect(marcadores.correo).toBe(1);
  });

  it("reemplaza URLs", () => {
    const { texto, marcadores } = sanitizarTextoEstudiante(
      "Vi el video en https://www.youtube.com/watch?v=abc y también en www.ejemplo.cl"
    );
    expect(texto).not.toContain("https://www.youtube.com");
    expect(texto).not.toContain("www.ejemplo.cl");
    expect(marcadores.url).toBe(2);
  });

  it("no altera texto normal", () => {
    const { texto, marcadores } = sanitizarTextoEstudiante(
      "Me gusta leer sobre astronomía y los planetas del sistema solar."
    );
    expect(texto).toBe("Me gusta leer sobre astronomía y los planetas del sistema solar.");
    expect(marcadores).toEqual({ rut: 0, telefono: 0, correo: 0, url: 0 });
  });
});

describe("construirPayloadSeguro (allowlist)", () => {
  it("el payload contiene SOLO los campos del allowlist", () => {
    const { payload } = construirPayloadSeguro({
      estimulo: "Estímulo A",
      rubrica: "Rúbrica 1-5",
      texto: "Mi respuesta sobre el estímulo.",
    });
    // El allowlist auditado usa el nombre largo; la clave real del payload es
    // la misma pieza de datos. La garantía dura: ningún OTRO campo existe.
    expect(Object.keys(payload).sort()).toEqual(["estimulo", "rubrica", "texto"]);
    expect(payload.texto).toBe("Mi respuesta sobre el estímulo.");
  });

  it("session_id y user_id son imposibles de enviar por construcción", () => {
    const sessionId = "2f3e4d5c-6b7a-4e8f-9a1b-0c2d3e4f5a6b";
    const userId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    const { payload } = construirPayloadSeguro({
      estimulo: "Estímulo X",
      rubrica: "Rúbrica",
      texto: "Respuesta de prueba.",
    });
    // La función no acepta sessionId/userId: no pueden existir en el payload.
    expect(JSON.stringify(payload)).not.toContain(sessionId);
    expect(JSON.stringify(payload)).not.toContain(userId);
    expect(JSON.stringify(payload)).not.toContain("session_id");
    expect(JSON.stringify(payload)).not.toContain("user_id");
  });

  it("patrones evidentes (correo, RUT) se limpian del prompt final", () => {
    const correo = "nico@correo.cl";
    const textoConPii = `Me llamo NicoJugador, mi correo es ${correo} y mi RUT es 12.345.678-9.`;
    const { prompt, marcadores } = construirPromptSeguro({
      estimulo: "Estímulo X",
      rubrica: "Rúbrica",
      texto: textoConPii,
    });
    expect(prompt).not.toContain(correo);
    expect(prompt).not.toContain("12.345.678-9");
    expect(prompt).toContain(MARCADORES.correo);
    expect(prompt).toContain(MARCADORES.rut);
    expect(marcadores).toEqual({ rut: 1, telefono: 0, correo: 1, url: 0 });
  });
});
