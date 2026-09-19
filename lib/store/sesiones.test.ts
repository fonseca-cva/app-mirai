// INVARIANTES DE SESIÓN (pilot readiness — PC compartido de sala).
//
// Verifica la regla de negocio central de este bloque:
//   * Una experiencia nueva SIEMPRE recibe un sessionId nuevo.
//   * No se reutiliza indefinidamente una sesión guardada en el navegador.
//   * Empezar otra experiencia NO conserva respuestas del alumno anterior.
//   * Recargar una experiencia en curso SÍ conserva sessionId y respuestas.
//
// El entorno de test no tiene `document`, así que se stubea el almacenamiento
// de cookies en memoria para simular el navegador de forma fiel (incluido el
// hecho de que el localStorage/estado del store sobrevive entre alumnos).

import { describe, it, expect, beforeEach, vi } from "vitest";

// ── Doble de `document.cookie` en memoria ──────────────────────────
let cookies = new Map<string, string>();

function instalarDocument() {
  cookies = new Map();
  vi.stubGlobal("document", {
    get cookie() {
      return Array.from(cookies.entries())
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join("; ");
    },
    set cookie(raw: string) {
      const [par, ...attrs] = raw.split(";");
      const [nombre, valor = ""] = par.split("=");
      const nombreLimpio = nombre.trim();
      const valorLimpio = decodeURIComponent(valor.trim());
      const expira = attrs.some((a) => a.trim().startsWith("max-age=0"));
      if (expira || valorLimpio === "") cookies.delete(nombreLimpio);
      else cookies.set(nombreLimpio, valorLimpio);
    },
  });
}

beforeEach(() => {
  instalarDocument();
  vi.resetModules();
});

async function cargarModulos() {
  const sesion = await import("@/lib/store/sesion");
  const { useExperienciaStore } = await import("@/lib/store/experiencia");
  return { sesion, useExperienciaStore };
}

describe("sesion.ts — operaciones de cookie sin lógica de negocio", () => {
  it("sesionEnCurso NO crea nada cuando no hay cookie", async () => {
    const { sesion } = await cargarModulos();
    expect(sesion.sesionEnCurso()).toBeNull();
    expect(cookies.size).toBe(0);
  });

  it("crearSessionIdNuevo SIEMPRE devuelve un id distinto del anterior", async () => {
    const { sesion } = await cargarModulos();
    const a = sesion.crearSessionIdNuevo();
    const b = sesion.crearSessionIdNuevo();
    expect(a).not.toBe(b);
    expect(sesion.sesionEnCurso()).toBe(b);
  });

  it("descartarSesionEnCurso borra la cookie", async () => {
    const { sesion } = await cargarModulos();
    sesion.crearSessionIdNuevo();
    expect(sesion.sesionEnCurso()).not.toBeNull();
    sesion.descartarSesionEnCurso();
    expect(sesion.sesionEnCurso()).toBeNull();
  });
});

describe("experiencia — experiencia nueva vs. retomar", () => {
  it("iniciarNuevaExperiencia rota el sessionId (no reutiliza el del navegador)", async () => {
    const { sesion, useExperienciaStore } = await cargarModulos();
    const primero = useExperienciaStore.getState().iniciarNuevaExperiencia();
    expect(sesion.sesionEnCurso()).toBe(primero);

    const segundo = useExperienciaStore.getState().iniciarNuevaExperiencia();
    expect(segundo).not.toBe(primero);
    expect(useExperienciaStore.getState().sessionId).toBe(segundo);
    expect(sesion.sesionEnCurso()).toBe(segundo);
  });

  it("empezar otra experiencia NO conserva las respuestas del alumno anterior", async () => {
    const { useExperienciaStore } = await cargarModulos();
    useExperienciaStore.getState().iniciarNuevaExperiencia();

    // Alumno 1 responde.
    useExperienciaStore.getState().agregarRespuestaGustos({ contextoId: "c1", valor: 2, ayudaAbierta: false, audioActivado: false });
    useExperienciaStore.getState().agregarRespuestaCognitivo({ juego: "matrices", itemId: "m1", correcto: true, nivel: 1, duracionMs: 100, repetidoPorTimeout: false });
    useExperienciaStore.getState().agregarRespuestaActividad({ actividadId: "a1", valor: 1 });
    useExperienciaStore.getState().agregarRespuestaAsignatura({ asignaturaId: "as1", valor: 2 });
    useExperienciaStore.getState().setAspiracion({ opcion: "universidad", detalle: null });
    useExperienciaStore.getState().irAPaso("gustos");

    expect(useExperienciaStore.getState().respuestasGustos).toHaveLength(1);

    // Alumno 2 empieza de nuevo en el mismo computador.
    useExperienciaStore.getState().iniciarNuevaExperiencia();

    const estado = useExperienciaStore.getState();
    expect(estado.respuestasGustos).toEqual([]);
    expect(estado.respuestasCognitivo).toEqual([]);
    expect(estado.respuestasActividades).toEqual([]);
    expect(estado.respuestasAsignaturas).toEqual([]);
    expect(estado.respuestasVerbal).toEqual([]);
    expect(estado.respuestasDivergente).toEqual([]);
    expect(estado.aspiracion).toBeNull();
    expect(estado.paso).toBe("intro");
    expect(estado.colaSync).toEqual([]);
  });

  it("iniciarNuevaExperiencia CONSERVA la autorización de modo prueba (no la degrada)", async () => {
    // REGRESIÓN: antes esta función reseteaba modoPrueba=false. Con ?prueba=1, el
    // tester pulsaba "Empezar" y la sesión se guardaba como REAL (es_prueba=false)
    // mientras la barra de modo prueba desaparecía sin aviso. La autorización la
    // administra la UI (revalidada server-side), no una rotación interna del store.
    const { useExperienciaStore } = await cargarModulos();
    useExperienciaStore.getState().iniciarNuevaExperiencia();
    useExperienciaStore.getState().setModoPrueba(true);
    useExperienciaStore.getState().setModoPruebaReal(true);

    useExperienciaStore.getState().iniciarNuevaExperiencia();

    expect(useExperienciaStore.getState().modoPrueba).toBe(true);
    expect(useExperienciaStore.getState().modoPruebaReal).toBe(true);
  });

  it("descartarExperiencia (salida explícita) SÍ apaga el modo prueba", async () => {
    const { useExperienciaStore } = await cargarModulos();
    useExperienciaStore.getState().iniciarNuevaExperiencia();
    useExperienciaStore.getState().setModoPrueba(true);

    useExperienciaStore.getState().descartarExperiencia();

    expect(useExperienciaStore.getState().modoPrueba).toBe(false);
    expect(useExperienciaStore.getState().modoPruebaReal).toBe(false);
  });

  it("iniciarNuevaExperiencia limpia el fail-stop pruebaRealCortada de la experiencia anterior", async () => {
    const { useExperienciaStore } = await cargarModulos();
    useExperienciaStore.setState({ pruebaRealCortada: true });

    useExperienciaStore.getState().iniciarNuevaExperiencia();

    expect(useExperienciaStore.getState().pruebaRealCortada).toBe(false);
  });

  it("retomarExperiencia CONSERVA sessionId cuando estado y cookie COINCIDEN", async () => {
    const { useExperienciaStore } = await cargarModulos();
    const original = useExperienciaStore.getState().iniciarNuevaExperiencia();
    useExperienciaStore.getState().marcarExperienciaIncompleta();
    useExperienciaStore.getState().agregarRespuestaGustos({ contextoId: "c1", valor: 2, ayudaAbierta: false, audioActivado: false });

    // La cookie es la misma que el estado: reanudar es legítimo (el estado ya está
    // rehidratado con esas respuestas; retomar no debe rotar nada).
    const retomada = useExperienciaStore.getState().retomarExperiencia();

    expect(retomada).toBe(true);
    expect(useExperienciaStore.getState().sessionId).toBe(original);
    expect(useExperienciaStore.getState().respuestasGustos).toHaveLength(1);
  });

  it("retomarExperiencia NO crea una sesión fantasma si no hay cookie", async () => {
    const { useExperienciaStore } = await cargarModulos();
    const retomada = useExperienciaStore.getState().retomarExperiencia();
    expect(retomada).toBe(false);
    expect(useExperienciaStore.getState().sessionId).toBeNull();
    expect(cookies.size).toBe(0);
  });

  it("descartarExperiencia borra cookie y estado (fin del flujo / cambio de alumno)", async () => {
    const { sesion, useExperienciaStore } = await cargarModulos();
    useExperienciaStore.getState().iniciarNuevaExperiencia();
    useExperienciaStore.getState().agregarRespuestaGustos({ contextoId: "c1", valor: 1, ayudaAbierta: false, audioActivado: false });

    useExperienciaStore.getState().descartarExperiencia();

    expect(sesion.sesionEnCurso()).toBeNull();
    expect(useExperienciaStore.getState().sessionId).toBeNull();
    expect(useExperienciaStore.getState().respuestasGustos).toEqual([]);
  });

  it("secuencia completa de dos alumnos en el mismo PC: sesiones disjuntas", async () => {
    const { useExperienciaStore } = await cargarModulos();

    // Alumno 1
    const s1 = useExperienciaStore.getState().iniciarNuevaExperiencia();
    useExperienciaStore.getState().agregarRespuestaGustos({ contextoId: "c1", valor: 2, ayudaAbierta: false, audioActivado: false });

    // Alumno 2 llega, ve la decisión, elige "Empezar de nuevo".
    const s2 = useExperienciaStore.getState().iniciarNuevaExperiencia();
    useExperienciaStore.getState().agregarRespuestaGustos({ contextoId: "c2", valor: 0, ayudaAbierta: false, audioActivado: false });

    expect(s2).not.toBe(s1);
    // El alumno 2 solo ve su propia respuesta, no la del alumno 1.
    const gustos = useExperienciaStore.getState().respuestasGustos;
    expect(gustos).toHaveLength(1);
    expect(gustos[0].contextoId).toBe("c2");
    expect(useExperienciaStore.getState().sessionId).toBe(s2);
  });
});
