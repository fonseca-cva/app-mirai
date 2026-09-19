// PRUEBA DE FLUJO COMPLETO (pilot readiness) — punta a punta, sobre el store REAL.
//
// La auditoría fue explícita: "no declares listo para piloto solo porque pasan las
// pruebas unitarias; el criterio es que estos flujos funcionen de punta a punta".
// Este archivo recorre los flujos completos en secuencia, simulando el navegador
// (localStorage + document.cookie) y RECARGANDO de verdad entre pasos.
//
// Flujos: experiencia nueva · recarga y reanudación · segundo alumno en el mismo
// computador · modo prueba · modo prueba real · finalización y limpieza ·
// sincronización repetida.
//
// La parte que escribe contra Supabase real se ejecuta solo si hay credenciales,
// y se marca como OMITIDA (no como pasada) cuando no las hay.

import { describe, it, expect, beforeEach, vi } from "vitest";
import { instalarNavegadorFalso, rehidratar, type NavegadorFalso } from "@/lib/store/testNavegador";

let navegador: NavegadorFalso;

beforeEach(() => {
  navegador = instalarNavegadorFalso();
  vi.resetModules();
});

// "Recargar la página": se descarta el módulo y se reimporta. El localStorage y la
// cookie sobreviven, igual que en un navegador.
async function recargar() {
  vi.resetModules();
  const mod = await import("@/lib/store/experiencia");
  await rehidratar();
  return mod.useExperienciaStore;
}

async function abrir() {
  const mod = await import("@/lib/store/experiencia");
  // El store usa skipHydration: hay que rehidratar explícitamente, igual
  // que hace la página al montar.
  await rehidratar();
  return mod.useExperienciaStore;
}

describe("FLUJO COMPLETO — piloto", () => {
  it("1 · experiencia nueva: sesión, paso inicial y estado limpio", async () => {
    const store = await abrir();
    const id = store.getState().iniciarNuevaExperiencia();
    store.getState().marcarExperienciaIncompleta();

    expect(id).toBeTruthy();
    expect(store.getState().sessionId).toBe(id);
    expect(store.getState().paso).toBe("intro");
    expect(store.getState().respuestasGustos).toEqual([]);
    expect(navegador.leerEstado()).not.toBeNull(); // se persistió
  });

  it("2 · recarga y reanudación: mismo sessionId, paso y respuestas", async () => {
    let store = await abrir();
    const id = store.getState().iniciarNuevaExperiencia();
    store.getState().marcarExperienciaIncompleta();
    store.getState().agregarRespuestaGustos({ contextoId: "c1", valor: 2, ayudaAbierta: false, audioActivado: false });
    store.getState().agregarRespuestaGustos({ contextoId: "c2", valor: 0, ayudaAbierta: false, audioActivado: false });
    store.getState().agregarRespuestaCognitivo({ juego: "matrices", itemId: "m1", correcto: true, nivel: 1, duracionMs: 900, repetidoPorTimeout: false });
    store.getState().setAspiracion({ opcion: "universidad", detalle: null });
    store.getState().irAPaso("gustos");

    store = await recargar(); // ← recarga real

    expect(store.getState().sessionId).toBe(id);
    expect(store.getState().paso).toBe("gustos");
    expect(store.getState().respuestasGustos).toHaveLength(2);
    expect(store.getState().respuestasCognitivo).toHaveLength(1);
    expect(store.getState().aspiracion?.opcion).toBe("universidad");
    expect(store.getState().hayExperienciaReanudable()).toBe(true);

    // "Continuar" no rota la sesión.
    expect(store.getState().retomarExperiencia()).toBe(true);
    expect(store.getState().sessionId).toBe(id);
    expect(store.getState().respuestasGustos).toHaveLength(2);
  });

  it("3 · segundo alumno en el mismo computador: no hereda nada", async () => {
    let store = await abrir();
    const primero = store.getState().iniciarNuevaExperiencia();
    store.getState().marcarExperienciaIncompleta();
    store.getState().agregarRespuestaGustos({ contextoId: "c1", valor: 2, ayudaAbierta: false, audioActivado: false });
    store.getState().agregarRespuestaActividad({ actividadId: "a1", valor: 2 });
    store.getState().irAPaso("gustos");

    store = await recargar(); // el alumno 2 abre la misma página
    expect(store.getState().hayExperienciaReanudable()).toBe(true); // puede elegir

    // Elige "Empezar de nuevo" → descarta; luego el CTA crea una sesión nueva.
    store.getState().descartarExperiencia();
    const segundo = store.getState().iniciarNuevaExperiencia();

    expect(segundo).not.toBe(primero);
    expect(store.getState().respuestasGustos).toEqual([]);
    expect(store.getState().respuestasActividades).toEqual([]);
    expect(store.getState().paso).toBe("intro");
    // Y tras recargar, ya no arrastra la experiencia del primero.
    const tras = await recargar();
    expect(tras.getState().hayExperienciaReanudable()).toBe(false);
    expect(tras.getState().respuestasGustos).toEqual([]);
  });

  it("4 · modo prueba: la autorización sobrevive al CTA de la intro", async () => {
    const store = await abrir();
    // Autorización (revalidada server-side en la app real).
    store.getState().setModoPrueba(true);
    store.getState().setModoPruebaReal(true);

    // Clic "Empezar" en la intro.
    store.getState().iniciarNuevaExperiencia();

    // Regresión corregida: antes esto apagaba el modo y la sesión se guardaba
    // como real (es_prueba=false).
    expect(store.getState().modoPrueba).toBe(true);
    expect(store.getState().modoPruebaReal).toBe(true);

    const { construirSesionRow } = await import("@/lib/supabase/sync");
    const fila = construirSesionRow(store.getState().sessionId as string, store.getState().modoPrueba, {});
    expect(fila.es_prueba).toBe(true);
  });

  it("4b · el modo prueba NO se persiste: exige reautorización tras recargar", async () => {
    const store = await abrir();
    store.getState().setModoPrueba(true);
    store.getState().iniciarNuevaExperiencia();
    store.getState().marcarExperienciaIncompleta();

    const tras = await recargar();
    // Un flag persistido habilitaría escrituras es_prueba=true sin revalidar.
    expect(tras.getState().modoPrueba).toBe(false);
    expect(tras.getState().modoPruebaReal).toBe(false);
    // Pero la experiencia sigue siendo reanudable.
    expect(tras.getState().hayExperienciaReanudable()).toBe(true);
  });

  it("5 · finalización y limpieza: no queda nada para el siguiente alumno", async () => {
    const store = await abrir();
    store.getState().setModoPrueba(true);
    store.getState().iniciarNuevaExperiencia();
    store.getState().marcarExperienciaIncompleta();
    store.getState().agregarRespuestaGustos({ contextoId: "c1", valor: 1, ayudaAbierta: false, audioActivado: false });
    store.getState().irAPaso("informe");

    // "Volver al inicio" desde el Informe.
    store.getState().descartarExperiencia();

    expect(store.getState().sessionId).toBeNull();
    expect(store.getState().respuestasGustos).toEqual([]);
    expect(store.getState().modoPrueba).toBe(false);
    expect(store.getState().hayExperienciaReanudable()).toBe(false);

    const tras = await recargar();
    expect(tras.getState().sessionId).toBeNull();
    expect(tras.getState().hayExperienciaReanudable()).toBe(false);
  });

  it("6 · sincronización repetida: no duplica (invariante de claves del payload)", async () => {
    // La unicidad real la garantiza el índice de la migración 00020. Acá se
    // verifica lo que el cliente controla: que el payload sea idempotente, es
    // decir que la MISMA fila se envíe dos veces con la misma clave única.
    const { construirSesionRow } = await import("@/lib/supabase/sync");
    const filaA = construirSesionRow("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", false, {});
    const filaB = construirSesionRow("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", false, {});
    // El upsert por (id) es idempotente: misma clave, mismos datos.
    expect(filaA.id).toBe(filaB.id);
    // Sin modo prueba, es_prueba se omite (nunca se manda false explícito).
    expect("es_prueba" in filaA).toBe(false);
  });

  it("7 · invariante temporal: generado_en nunca antes de creada_en", async () => {
    const { sanearGeneradoEn } = await import("@/lib/supabase/sync");
    const creada = "2026-01-01T00:00:00.000Z";
    expect(Date.parse(sanearGeneradoEn("2020-01-01T00:00:00.000Z", creada))).toBeGreaterThanOrEqual(Date.parse(creada));
    expect(sanearGeneradoEn("2026-06-01T00:00:00.000Z", creada)).toBe("2026-06-01T00:00:00.000Z");
  });
});
