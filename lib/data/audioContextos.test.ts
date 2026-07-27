import { describe, expect, it } from "vitest";
import { obtenerAudioContexto } from "@/lib/data/audioContextos";

describe("obtenerAudioContexto", () => {
  it("degrada a undefined si el escenaId no tiene audio cargado", () => {
    expect(obtenerAudioContexto("escena-inexistente")).toBeUndefined();
  });

  it("devuelve el audio cuando el escenaId sí tiene entrada", () => {
    expect(obtenerAudioContexto("obra-construccion")).toEqual({
      archivo: "/audio/obra-construccion.mp3",
      duracionS: 20,
    });
    expect(obtenerAudioContexto("local-gastronomico")).toEqual({
      archivo: "/audio/local-gastronomico.mp3",
      duracionS: 20,
    });
    expect(obtenerAudioContexto("investigacion-postgrado")).toEqual({
      archivo: "/audio/investigacion-postgrado.mp3",
      duracionS: 20,
    });
  });

  it("degrada a undefined si no hay escenaId", () => {
    expect(obtenerAudioContexto(undefined)).toBeUndefined();
  });
});
