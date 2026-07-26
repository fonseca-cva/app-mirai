import { describe, expect, it } from "vitest";
import { avanzarSecuencia, ESTADO_INICIAL_SECUENCIAS, puntajeSecuencias } from "@/lib/logic/secuencias";

describe("avanzarSecuencia", () => {
  it("un acierto sube el largo en 1 y resetea errores", () => {
    const siguiente = avanzarSecuencia(ESTADO_INICIAL_SECUENCIAS, true);
    expect(siguiente).toEqual({
      largoActual: 4,
      erroresEnLargoActual: 0,
      largoMaximoLogrado: 3,
      terminado: false,
    });
  });

  it("el primer error en un largo lo repite, sin terminar", () => {
    const siguiente = avanzarSecuencia(ESTADO_INICIAL_SECUENCIAS, false);
    expect(siguiente).toEqual({
      largoActual: 3,
      erroresEnLargoActual: 1,
      largoMaximoLogrado: 0,
      terminado: false,
    });
  });

  it("el segundo error consecutivo en el mismo largo termina el juego", () => {
    const primerError = avanzarSecuencia(ESTADO_INICIAL_SECUENCIAS, false);
    const segundoError = avanzarSecuencia(primerError, false);
    expect(segundoError.terminado).toBe(true);
  });

  it("un acierto después de un error resetea erroresEnLargoActual y sube de largo", () => {
    const primerError = avanzarSecuencia(ESTADO_INICIAL_SECUENCIAS, false);
    const acierto = avanzarSecuencia(primerError, true);
    expect(acierto).toEqual({
      largoActual: 4,
      erroresEnLargoActual: 0,
      largoMaximoLogrado: 3,
      terminado: false,
    });
  });

  it("acertar en el largo tope (8) termina el juego sin pedir largo 9", () => {
    let estado = ESTADO_INICIAL_SECUENCIAS;
    for (let largo = 3; largo < 8; largo++) {
      estado = avanzarSecuencia(estado, true);
    }
    expect(estado.largoActual).toBe(8);

    const final = avanzarSecuencia(estado, true);
    expect(final.terminado).toBe(true);
    expect(final.largoMaximoLogrado).toBe(8);
  });

  it("un estado terminado no cambia ante nuevos eventos", () => {
    const terminado = { ...ESTADO_INICIAL_SECUENCIAS, terminado: true, largoMaximoLogrado: 5 };
    expect(avanzarSecuencia(terminado, true)).toEqual(terminado);
    expect(avanzarSecuencia(terminado, false)).toEqual(terminado);
  });
});

describe("puntajeSecuencias", () => {
  it("mapea cada largo máximo logrado a su puntaje 0-100", () => {
    expect(puntajeSecuencias(0)).toBe(0);
    expect(puntajeSecuencias(3)).toBe(20);
    expect(puntajeSecuencias(4)).toBe(40);
    expect(puntajeSecuencias(5)).toBe(60);
    expect(puntajeSecuencias(6)).toBe(75);
    expect(puntajeSecuencias(7)).toBe(90);
    expect(puntajeSecuencias(8)).toBe(100);
  });
});
