import { describe, it, expect, beforeEach } from "vitest";
import { instalarNavegadorFalso, type NavegadorFalso } from "@/lib/store/testNavegador";
import {
  guardarVinculacionPendiente,
  leerVinculacionPendiente,
  limpiarVinculacionPendiente,
  marcarEnvioAlEntrar,
  hayEnvioAlEntrar,
  limpiarEnvioAlEntrar,
} from "@/lib/logic/vinculacionPendiente";

let nav: NavegadorFalso;
beforeEach(() => {
  nav = instalarNavegadorFalso();
});

describe("vinculación pendiente (sobrevive a la pestaña nueva del correo)", () => {
  it("se guarda en localStorage, no en sessionStorage", () => {
    guardarVinculacionPendiente({ uid: "u1", sesionId: "s1", apodo: "Cami" });
    expect(nav.localStorage.has("mirai_vinculacion_pendiente")).toBe(true);
    expect(nav.sessionStorage.size).toBe(0);
    expect(leerVinculacionPendiente()).toMatchObject({ uid: "u1", sesionId: "s1", apodo: "Cami" });
  });

  it("vence a las 48 horas", () => {
    guardarVinculacionPendiente({ uid: "u1" });
    expect(leerVinculacionPendiente(Date.now() + 47 * 3600_000)).not.toBeNull();
    expect(leerVinculacionPendiente(Date.now() + 49 * 3600_000)).toBeNull();
  });

  it("lee las claves antiguas de sessionStorage (pestañas abiertas antes del cambio)", () => {
    nav.sessionStorage.set("mirai_uid_anonimo", "viejo");
    nav.sessionStorage.set("mirai_sesion_id", "s-viejo");
    expect(leerVinculacionPendiente()).toMatchObject({ uid: "viejo", sesionId: "s-viejo" });
  });

  it("limpiar borra ambos almacenes", () => {
    guardarVinculacionPendiente({ uid: "u1" });
    nav.sessionStorage.set("mirai_uid_anonimo", "viejo");
    limpiarVinculacionPendiente();
    expect(leerVinculacionPendiente()).toBeNull();
  });

  it("un dato corrupto se ignora sin romper", () => {
    nav.localStorage.set("mirai_vinculacion_pendiente", "{no es json");
    expect(leerVinculacionPendiente()).toBeNull();
  });
});

describe("envío pendiente al entrar a Mi cuenta (enlace abierto en otro dispositivo)", () => {
  it("sin marca no hay envío pendiente", () => {
    expect(hayEnvioAlEntrar()).toBe(false);
  });

  it("la marca dura 48 horas y se puede limpiar", () => {
    const ahora = Date.now();
    marcarEnvioAlEntrar(ahora);
    expect(hayEnvioAlEntrar(ahora + 47 * 3600_000)).toBe(true);
    expect(hayEnvioAlEntrar(ahora + 49 * 3600_000)).toBe(false);
    limpiarEnvioAlEntrar();
    expect(hayEnvioAlEntrar(ahora)).toBe(false);
  });
});
