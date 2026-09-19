import { describe, it, expect, beforeEach, vi } from "vitest";
import { instalarNavegadorFalso, type NavegadorFalso } from "@/lib/store/testNavegador";

let navegador: NavegadorFalso;

beforeEach(() => {
  navegador = instalarNavegadorFalso();
  vi.resetModules();
});

import { construirSesionRow } from "@/lib/supabase/sync";

async function cargarStore() {
  const mod = await import("@/lib/store/experiencia");
  return mod.useExperienciaStore;
}

// Réplica de la secuencia de app/experiencia/page.tsx:
//   1. el efecto de ?prueba=1 revalida contra /api/debug/verificar-prueba
//   2. el alumno pulsa "Empezar" (crearEnIntro → iniciarNuevaExperiencia)
//   3. el primer bloque sincroniza (construirSesionRow)
async function simularFlujo(store: Awaited<ReturnType<typeof cargarStore>>) {
  // 1. Autorización (revalidación server-side de la cookie de /debug).
  const res = await fetch("/api/debug/verificar-prueba");
  const data = (await res.json()) as { ok?: boolean };
  if (data?.ok === true) {
    store.getState().setModoPrueba(true);
    store.getState().setModoPruebaReal(true);
  } else {
    store.getState().setModoPrueba(false);
    store.getState().setModoPruebaReal(false);
  }

  // 2. Clic "Empezar" en la intro.
  store.getState().iniciarNuevaExperiencia();
  store.getState().marcarExperienciaIncompleta();

  // 3. Primera sincronización: se construye la fila de sesión.
  return construirSesionRow(store.getState().sessionId as string, store.getState().modoPrueba, {});
}

describe("orden real: autorización → intro → Empezar → primera sincronización", () => {
  it("con autorización OK, la fila de sesión sale con es_prueba=true", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }));
    const store = await cargarStore();

    const fila = await simularFlujo(store);

    expect(store.getState().modoPrueba).toBe(true);
    expect(fila.es_prueba).toBe(true);
  });

  it("?prueba=1&real=1 con autorización OK también produce es_prueba=true", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }));
    const store = await cargarStore();

    const fila = await simularFlujo(store);

    expect(store.getState().modoPruebaReal).toBe(true);
    expect(fila.es_prueba).toBe(true);
  });

  it("el clic en Empezar NO degrada la autorización (era el bug)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }));
    const store = await cargarStore();

    store.getState().setModoPrueba(true);
    store.getState().setModoPruebaReal(true);
    // El CTA de la intro:
    store.getState().iniciarNuevaExperiencia();

    // Si esto falla, la sesión se guardaría como real con la barra de prueba
    // apagada: el tester creería que probó cuando en realidad ensució métricas.
    expect(store.getState().modoPrueba).toBe(true);
    expect(store.getState().modoPruebaReal).toBe(true);
    expect(construirSesionRow("11111111-1111-1111-1111-111111111111", store.getState().modoPrueba, {}).es_prueba).toBe(true);
  });

  it("'Empezar de nuevo' dentro de una prueba autorizada no degrada a modo normal", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }));
    const store = await cargarStore();
    await simularFlujo(store);

    // Pantalla de decisión → "Empezar de nuevo" (descarta), luego el CTA crea.
    store.getState().descartarExperiencia();
    store.getState().setModoPrueba(true); // la UI reautoriza tras el descarte
    store.getState().iniciarNuevaExperiencia();

    expect(store.getState().modoPrueba).toBe(true);
  });

  it("con autorización FALLIDA el modo queda apagado (no se escribe como prueba)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({ ok: false }) }));
    const store = await cargarStore();

    const fila = await simularFlujo(store);

    expect(store.getState().modoPrueba).toBe(false);
    // La fila NO debe llevar es_prueba=true si no se autorizó: sin cookie válida
    // no hay forma legítima de escribir marcado como prueba. La UI, además,
    // bloquea el flujo (faseAutorizacionPrueba === "fallida").
    expect(fila.es_prueba).toBeUndefined();
  });

  it("sincronizarBloque revalida la cookie y NO escribe si falla", async () => {
    // Defensa en profundidad: aunque el modo quedara activo, el escritor corta.
    const store = await cargarStore();
    store.getState().iniciarNuevaExperiencia();
    store.getState().setModoPrueba(true);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({ ok: false }) }));

    await store.getState().sincronizarBloque([
      { id: "s1", tipo: "sesion", payload: construirSesionRow("11111111-1111-1111-1111-111111111111", true, {}) },
    ]);

    // Ni sesión ni respuestas se encolaron: el modo se cayó.
    expect(store.getState().colaSync).toEqual([]);
    expect(store.getState().modoPrueba).toBe(false);
  });
});
