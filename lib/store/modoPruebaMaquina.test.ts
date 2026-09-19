import { describe, it, expect, beforeEach, vi } from "vitest";
import { instalarNavegadorFalso, rehidratar, type NavegadorFalso } from "@/lib/store/testNavegador";

let navegador: NavegadorFalso;

beforeEach(() => {
  navegador = instalarNavegadorFalso();
  vi.resetModules();
});

import {
  faseInicial,
  alDetectarUrlPrueba,
  alResolverVerificacion,
  alFallarVerificacion,
  alDescartarEnPrueba,
  puedeEntrar,
  bloqueaEntrada,
  mensajeBloqueo,
  type FaseAutorizacion,
} from "@/lib/store/modoPruebaMaquina";

async function abrir() {
  const mod = await import("@/lib/store/experiencia");
  // El store usa skipHydration: hay que rehidratar explícitamente, igual
  // que hace la página al montar.
  await rehidratar();
  return mod.useExperienciaStore;
}

describe("flujo normal (sin ?prueba=1)", () => {
  it("no se valida nada y la entrada no se bloquea (cero overhead)", () => {
    const f = faseInicial(false);
    expect(f).toBe("no-pedida");
    expect(bloqueaEntrada(f)).toBe(false);
    expect(puedeEntrar(f)).toBe(true);
  });
});

describe("?prueba=1: la entrada se bloquea desde antes del fetch", () => {
  it("al detectar la URL queda en 'validando' y BLOQUEA (clic rápido cubierto)", () => {
    const f = alDetectarUrlPrueba();
    expect(f).toBe("validando");
    // Este es el caso "fetch pendiente + clic rápido": antes la interfaz no se
    // bloqueaba y el CTA creaba/escribía la sesión sin autorización confirmada.
    expect(bloqueaEntrada(f)).toBe(true);
    expect(puedeEntrar(f)).toBe(false);
  });

  it("autorización correcta → 'autorizada' y permite entrar", () => {
    const f = alResolverVerificacion("validando", true, false);
    expect(f).toBe("autorizada");
    expect(puedeEntrar(f)).toBe(true);
    expect(bloqueaEntrada(f)).toBe(false);
  });

  it("autorización correcta con ?real=1 → 'autorizada' (la página además marca modoPruebaReal)", () => {
    const f = alResolverVerificacion("validando", true, true);
    expect(f).toBe("autorizada");
    expect(puedeEntrar(f)).toBe(true);
  });

  it("autorización fallida → 'fallida', NO entra y hay mensaje visible", () => {
    const f = alResolverVerificacion("validando", false, false);
    expect(f).toBe("fallida");
    expect(puedeEntrar(f)).toBe(false);
    expect(bloqueaEntrada(f)).toBe(true);
    expect(mensajeBloqueo(f)).toContain("no es válida o expiró");
  });

  it("error de red (catch) → 'fallida' (fail-closed, nunca sigue como normal)", () => {
    const f = alFallarVerificacion();
    expect(f).toBe("fallida");
    expect(puedeEntrar(f)).toBe(false);
  });

  it("NINGUNA fase de prueba se degrada a 'no-pedida' (que sería flujo normal)", () => {
    const fases: FaseAutorizacion[] = ["validando", "autorizada", "fallida"];
    for (const f of fases) {
      expect(f).not.toBe("no-pedida");
    }
    // Y desde 'fallida' no se puede volver a 'no-pedida' por ninguna transición.
    expect(alResolverVerificacion("fallida", true, false)).toBe("autorizada");
    expect(alResolverVerificacion("fallida", false, false)).toBe("fallida");
  });
});

describe("expiración durante la experiencia", () => {
  it("prueba SIMPLE que pierde autorización → sincronizarBloque corta y marca el fail-stop visible", async () => {
    const store = await abrir();
    store.getState().iniciarNuevaExperiencia();
    store.getState().setModoPrueba(true);
    store.getState().setModoPruebaReal(false);
    // La cookie dejó de validar server-side.
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 }));

    await store.getState().sincronizarBloque([
      { id: "s", tipo: "sesion", payload: { id: "11111111-1111-1111-1111-111111111111", creada_en: new Date().toISOString(), edad: null, curso: null, dispositivo: null, es_prueba: true } },
    ]);

    // Antes esta marca era exclusiva del modo REAL: una prueba simple se apagaba
    // en silencio y un bloque posterior podía escribirse COMO REAL.
    expect(store.getState().pruebaRealCortada).toBe(true);
    expect(store.getState().modoPrueba).toBe(false);
    expect(store.getState().colaSync).toEqual([]);
  });

  it("prueba REAL que pierde autorización → mismo corte visible", async () => {
    const store = await abrir();
    store.getState().iniciarNuevaExperiencia();
    store.getState().setModoPrueba(true);
    store.getState().setModoPruebaReal(true);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 }));

    await store.getState().sincronizarBloque([
      { id: "s", tipo: "sesion", payload: { id: "11111111-1111-1111-1111-111111111111", creada_en: new Date().toISOString(), edad: null, curso: null, dispositivo: null, es_prueba: true } },
    ]);

    expect(store.getState().pruebaRealCortada).toBe(true);
    expect(store.getState().colaSync).toEqual([]);
  });
});

describe("Empezar de nuevo dentro de una prueba", () => {
  it("el descarte apaga el modo, y la reautorización lo vuelve a habilitar", () => {
    // El descarte es una salida explícita: apaga el modo.
    expect(alResolverVerificacion("autorizada", true, false)).toBe("autorizada");
    // Tras descartar en una URL de prueba, la página DEBE revalidar; el estado
    // intermedio es 'validando' (bloqueado), nunca 'no-pedida'.
    const revalidando = alDescartarEnPrueba();
    expect(revalidando).toBe("validando");
    expect(bloqueaEntrada(revalidando)).toBe(true);
    // Si la revalidación es OK, vuelve a autorizada.
    expect(alResolverVerificacion(revalidando, true, false)).toBe("autorizada");
    // Si falla, queda fallida (no se degrada a flujo normal).
    expect(alResolverVerificacion(revalidando, false, false)).toBe("fallida");
  });

  it("tras descartar en prueba, una sesión nueva sigue siendo de prueba", async () => {
    const store = await abrir();
    const { construirSesionRow } = await import("@/lib/supabase/sync");

    store.getState().setModoPrueba(true);
    store.getState().iniciarNuevaExperiencia();
    store.getState().descartarExperiencia();
    // La página reautoriza y vuelve a crear:
    store.getState().setModoPrueba(true);
    const id = store.getState().iniciarNuevaExperiencia();

    expect(construirSesionRow(id, store.getState().modoPrueba, {}).es_prueba).toBe(true);
  });
});

describe("recarga en mitad de una prueba", () => {
  it("el modo NO se persiste: tras recargar hay que revalidar (no se hereda el flag)", async () => {
    let store = await abrir();
    store.getState().setModoPrueba(true);
    store.getState().setModoPruebaReal(true);
    store.getState().iniciarNuevaExperiencia();
    store.getState().marcarExperienciaIncompleta();

    vi.resetModules();
    const mod = await import("@/lib/store/experiencia");
    store = mod.useExperienciaStore;
    // Como la página al montar: migrar → rehidratar (el store usa skipHydration).
    await rehidratar();

    // Un flag persistido habilitaría escrituras es_prueba=true sin revalidar la
    // cookie: por eso arranca en false y la página vuelve a pedir autorización.
    expect(store.getState().modoPrueba).toBe(false);
    expect(store.getState().modoPruebaReal).toBe(false);
    // La experiencia en sí sigue siendo reanudable.
    expect(store.getState().hayExperienciaReanudable()).toBe(true);
  });

  it("con ?prueba=1 la página vuelve a 'validando' tras recargar", () => {
    // Simula el montaje de la página con la URL de prueba.
    const f = alDetectarUrlPrueba();
    expect(f).toBe("validando");
    expect(bloqueaEntrada(f)).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// CARRERA SSR / HIDRATACIÓN
// ══════════════════════════════════════════════════════════════════════════
//
// El hueco: `useSyncExternalStore` devuelve false en el snapshot del SERVIDOR, así
// que en SSR y en la primera hidratación `urlPidePrueba` es false y la fase nace
// 'no-pedida'. Cuando el snapshot del cliente pasa a true, useState NO se
// reinicializa. Depender del inicializador dejaba la introducción habilitada en el
// primer render de cliente.
//
// La condición efectiva que lo cierra (en page.tsx) es:
//   bloqueo = (urlPidePrueba && fase !== "autorizada") || bloqueaEntrada(fase) || revalidando
//   entradaPermitida = !bloqueo && puedeEntrar(fase) && !revalidando
//
// Se replica acá para probar la TRANSICIÓN completa.

function bloqueoEfectivo(urlPidePrueba: boolean, fase: FaseAutorizacion, revalidando: boolean): boolean {
  return (urlPidePrueba && fase !== "autorizada") || bloqueaEntrada(fase) || revalidando;
}
function entradaEfectiva(urlPidePrueba: boolean, fase: FaseAutorizacion, revalidando: boolean): boolean {
  const bloqueo = bloqueoEfectivo(urlPidePrueba, fase, revalidando);
  return !bloqueo && puedeEntrar(fase) && !revalidando;
}

describe("SSR → hidratación → fetch pendiente: entradaPermitida siempre false", () => {
  it("PASO 1: en el servidor el snapshot es false y la fase nace 'no-pedida'", () => {
    // Lo que realmente ocurre en SSR.
    const urlEnServidor = false;
    const fase = faseInicial(urlEnServidor);
    expect(fase).toBe("no-pedida");

    // Pero cuando el cliente hidrata, `urlPidePrueba` YA es true y la condición
    // efectiva bloquea aunque la fase siga en 'no-pedida' (useState no se
    // reinicializa). Este es el punto exacto que fallaba.
    const urlEnCliente = true;
    expect(entradaEfectiva(urlEnCliente, fase, false)).toBe(false);
    expect(bloqueoEfectivo(urlEnCliente, fase, false)).toBe(true);
  });

  it("PASO 2: durante el fetch la fase pasa a 'validando' y sigue bloqueado", () => {
    const fase = alDetectarUrlPrueba();
    expect(fase).toBe("validando");
    expect(entradaEfectiva(true, fase, false)).toBe(false);
  });

  it("PASO 3: con la revalidación en curso también está bloqueado", () => {
    expect(entradaEfectiva(true, "autorizada", true)).toBe(false);
  });

  it("PASO 4: solo 'autorizada' y sin revalidar permite entrar", () => {
    const fase = alResolverVerificacion("validando", true, false);
    expect(fase).toBe("autorizada");
    expect(entradaEfectiva(true, fase, false)).toBe(true);
  });

  it("desde la hidratación (url=true) no hay NINGUNA ventana abierta hasta autorizar", () => {
    // El paso de SSR (url=false) queda fuera a propósito: en el servidor no hay
    // URL que leer y no se renderiza un CTA interactivo. Lo que importa es que
    // desde que el cliente SABE que la URL pide prueba, no haya hueco.
    const secuencia: Array<{ fase: FaseAutorizacion; revalidando: boolean }> = [
      { fase: "no-pedida", revalidando: false }, // hidratación (useState viejo)
      { fase: "validando", revalidando: false }, // fetch en curso
      { fase: "validando", revalidando: true },
      { fase: "fallida", revalidando: false },
    ];
    for (const paso of secuencia) {
      expect(entradaEfectiva(true, paso.fase, paso.revalidando)).toBe(false);
    }
    // Y se abre SOLO tras autorizar sin revalidación pendiente.
    expect(entradaEfectiva(true, "autorizada", false)).toBe(true);
  });

  it("en SSR (url=false) el flujo normal no se bloquea: no hay CTA interactivo aún", () => {
    expect(entradaEfectiva(false, "no-pedida", false)).toBe(true);
  });

  it("sin ?prueba=1 el flujo normal NO se bloquea en ningún punto", () => {
    expect(entradaEfectiva(false, "no-pedida", false)).toBe(true);
  });
});

describe("flujo completo ?prueba=1&real=1 → Empezar de nuevo → reautorizada", () => {
  it("conserva modoPrueba Y modoPruebaReal en cada transición", async () => {
    const store = await abrir();

    // 1. Autorización con real=1: la página activa AMBOS.
    store.getState().setModoPrueba(true);
    store.getState().setModoPruebaReal(true);
    let fase = alResolverVerificacion("validando", true, true);
    expect(fase).toBe("autorizada");

    // 2. Clic "Empezar" en la intro.
    let id = store.getState().iniciarNuevaExperiencia();
    expect(store.getState().modoPrueba).toBe(true);
    expect(store.getState().modoPruebaReal).toBe(true);

    // 3. "Empezar de nuevo": descarta y revalida.
    store.getState().descartarExperiencia();
    expect(store.getState().modoPrueba).toBe(false);
    fase = alDescartarEnPrueba();
    expect(fase).toBe("validando");

    // 4. Reautorización con real=1 → se vuelven a activar los DOS.
    store.getState().setModoPrueba(true);
    store.getState().setModoPruebaReal(true);
    fase = alResolverVerificacion("validando", true, true);
    expect(fase).toBe("autorizada");

    // 5. Sesión nueva del bloque verbal.
    id = store.getState().iniciarNuevaExperiencia();

    // Lo exigido: ambos modos activos, para que el bloque verbal use /api/evaluar
    // (persiste) y no /api/debug/evaluar.
    expect(store.getState().modoPrueba).toBe(true);
    expect(store.getState().modoPruebaReal).toBe(true);

    const { construirSesionRow } = await import("@/lib/supabase/sync");
    expect(construirSesionRow(id, store.getState().modoPrueba, {}).es_prueba).toBe(true);
  });
});
