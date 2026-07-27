import { describe, expect, it } from "vitest";
import {
  avanzarSecuencia,
  ESTADO_FASE_INICIAL,
  ESTADO_INICIAL_SECUENCIAS,
  MS_ENTRE_SIMBOLOS,
  MS_PAUSA_FIN_PRESENTACION,
  MS_SIMBOLO,
  MS_TIMEOUT_RESPUESTA,
  MS_TRANSICION_RONDA,
  puntajeSecuencias,
  reducirFaseSecuencias,
  type EstadoFaseSecuencias,
} from "@/lib/logic/secuencias";

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

// Anexo 3 — estados explícitos del juego: tiempos de fase y máquina de transiciones.
describe("tiempos de fase (Anexo 3)", () => {
  it("respeta el contrato de duraciones validado con la auditoría", () => {
    expect(MS_SIMBOLO).toBe(800);
    expect(MS_ENTRE_SIMBOLOS).toBe(250);
    expect(MS_PAUSA_FIN_PRESENTACION).toBe(900);
    expect(MS_TRANSICION_RONDA).toBe(1200);
    expect(MS_TIMEOUT_RESPUESTA).toBe(20_000);
  });
});

describe("reducirFaseSecuencias", () => {
  const esperandoRespuesta: EstadoFaseSecuencias = {
    ...ESTADO_FASE_INICIAL,
    fase: "esperando-respuesta",
  };

  it("mostrando -> pausa -> esperando-respuesta, en orden", () => {
    const trasPresentacion = reducirFaseSecuencias(ESTADO_FASE_INICIAL, { tipo: "FIN_PRESENTACION" });
    expect(trasPresentacion.fase).toBe("pausa");

    const trasPausa = reducirFaseSecuencias(trasPresentacion, { tipo: "FIN_PAUSA" });
    expect(trasPausa.fase).toBe("esperando-respuesta");
  });

  it("un acierto (no en el tope) pasa a transición anunciando 'acierto' y sube el largo", () => {
    const siguiente = reducirFaseSecuencias(esperandoRespuesta, { tipo: "RESPUESTA_CORRECTA" });
    expect(siguiente.fase).toBe("transicion");
    expect(siguiente.tipoTransicion).toBe("acierto");
    expect(siguiente.estado.largoActual).toBe(4);
  });

  it("un acierto en el largo tope termina el juego directo, sin transición", () => {
    let estado = ESTADO_INICIAL_SECUENCIAS;
    for (let largo = 3; largo < 8; largo++) estado = avanzarSecuencia(estado, true);
    const enTope: EstadoFaseSecuencias = { ...esperandoRespuesta, estado };

    const siguiente = reducirFaseSecuencias(enTope, { tipo: "RESPUESTA_CORRECTA" });
    expect(siguiente.fase).toBe("terminado");
    expect(siguiente.tipoTransicion).toBeNull();
  });

  it("el primer error pasa a transición anunciando 'reintento', mismo largo", () => {
    const siguiente = reducirFaseSecuencias(esperandoRespuesta, { tipo: "RESPUESTA_INCORRECTA" });
    expect(siguiente.fase).toBe("transicion");
    expect(siguiente.tipoTransicion).toBe("reintento");
    expect(siguiente.estado.largoActual).toBe(3);
  });

  it("el segundo error consecutivo termina el juego, sin transición", () => {
    const trasPrimerError = reducirFaseSecuencias(esperandoRespuesta, { tipo: "RESPUESTA_INCORRECTA" });
    const trasSegundoError = reducirFaseSecuencias(
      { ...esperandoRespuesta, estado: trasPrimerError.estado },
      { tipo: "RESPUESTA_INCORRECTA" }
    );
    expect(trasSegundoError.fase).toBe("terminado");
  });

  it("FIN_TRANSICION vuelve a mostrando, resetea timeoutUsadoEnRonda y sube generacionMostrando", () => {
    const enTransicion: EstadoFaseSecuencias = {
      ...esperandoRespuesta,
      fase: "transicion",
      tipoTransicion: "acierto",
      timeoutUsadoEnRonda: true,
      generacionMostrando: 2,
    };
    const siguiente = reducirFaseSecuencias(enTransicion, { tipo: "FIN_TRANSICION" });
    expect(siguiente.fase).toBe("mostrando");
    expect(siguiente.timeoutUsadoEnRonda).toBe(false);
    expect(siguiente.tipoTransicion).toBeNull();
    expect(siguiente.generacionMostrando).toBe(3);
  });

  it("un primer timeout muestra la pantalla de '¿sigues ahí?' sin gastar la repetición aún", () => {
    const siguiente = reducirFaseSecuencias(esperandoRespuesta, { tipo: "TIMEOUT" });
    expect(siguiente.fase).toBe("timeout");
    expect(siguiente.timeoutUsadoEnRonda).toBe(false);
  });

  it("REPETIR_RONDA vuelve a mostrando marcando la repetición usada", () => {
    const enTimeout = reducirFaseSecuencias(esperandoRespuesta, { tipo: "TIMEOUT" });
    const siguiente = reducirFaseSecuencias(enTimeout, { tipo: "REPETIR_RONDA" });
    expect(siguiente.fase).toBe("mostrando");
    expect(siguiente.timeoutUsadoEnRonda).toBe(true);
    expect(siguiente.generacionMostrando).toBe(enTimeout.generacionMostrando + 1);
  });

  it("un segundo timeout en la misma ronda (repetición ya usada) se trata como error, no vuelve a preguntar", () => {
    const yaRepetida: EstadoFaseSecuencias = { ...esperandoRespuesta, timeoutUsadoEnRonda: true };
    const siguiente = reducirFaseSecuencias(yaRepetida, { tipo: "TIMEOUT" });
    expect(siguiente.fase).toBe("transicion");
    expect(siguiente.tipoTransicion).toBe("reintento");
  });

  it("un segundo timeout puede terminar el juego si ya había un error previo en el largo", () => {
    const conErrorPrevio: EstadoFaseSecuencias = {
      ...esperandoRespuesta,
      timeoutUsadoEnRonda: true,
      estado: { ...ESTADO_INICIAL_SECUENCIAS, erroresEnLargoActual: 1 },
    };
    const siguiente = reducirFaseSecuencias(conErrorPrevio, { tipo: "TIMEOUT" });
    expect(siguiente.fase).toBe("terminado");
  });

  it("ignora eventos que no corresponden a la fase actual", () => {
    expect(reducirFaseSecuencias(ESTADO_FASE_INICIAL, { tipo: "FIN_PAUSA" })).toEqual(ESTADO_FASE_INICIAL);
    expect(reducirFaseSecuencias(ESTADO_FASE_INICIAL, { tipo: "RESPUESTA_CORRECTA" })).toEqual(ESTADO_FASE_INICIAL);
    expect(reducirFaseSecuencias(ESTADO_FASE_INICIAL, { tipo: "TIMEOUT" })).toEqual(ESTADO_FASE_INICIAL);
  });

  it("un estado terminado ignora cualquier evento posterior", () => {
    const terminado: EstadoFaseSecuencias = { ...esperandoRespuesta, fase: "terminado" };
    expect(reducirFaseSecuencias(terminado, { tipo: "RESPUESTA_CORRECTA" })).toEqual(terminado);
    expect(reducirFaseSecuencias(terminado, { tipo: "TIMEOUT" })).toEqual(terminado);
    expect(reducirFaseSecuencias(terminado, { tipo: "REPETIR_RONDA" })).toEqual(terminado);
  });
});
