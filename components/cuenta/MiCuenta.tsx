"use client";

// /mi-cuenta (Tanda C): panel personal sin contraseñas.
//
// Tres estados según la sesión actual (supabase.auth):
//   A — Sin sesión: formulario "entrar con un enlace a tu correo" (POST
//       /api/entrar-cuenta, solo cuentas existentes) + CTA a la experiencia.
//       Esta página NUNCA crea una sesión anónima por sí sola (decisión de
//       tanda: no generar usuarios fantasma).
//   B — Anónima (sesión sin email): aviso de que los informes de este
//       navegador se pierden si se borran los datos + mini-formulario de
//       vinculación que reusa /api/vincular-cuenta y las keys de sessionStorage
//       de Tanda A (el clic del correo aterriza en /guardar-informe) + lista
//       de informes propios.
//   C — Vinculada (sesión con email): correo, apodo editable, lista de
//       informes y "Desvincular esta sesión" (signOut + limpieza local;
//       reversible: se vuelve a entrar con el correo).
//
// Listado: SELECT directo con proyección mínima (token, generado_en,
// perfil_json) — RLS por auth.uid() garantiza que cada sesión solo ve sus
// filas. Nunca se pide ni se muestra session_id.

import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { miCuenta } from "@/lib/config/textos";
import { supabase, obtenerAccessToken } from "@/lib/supabase/client";
import { correoSchema, sanitizarApodo } from "@/lib/logic/cuenta";
import { carreraPorId } from "@/lib/data/carreras";
import { formatearFecha, tituloInforme } from "@/lib/logic/informe";
import type { PerfilResultado } from "@/lib/supabase/types";

const UID_ANONIMO_KEY = "mirai_uid_anonimo";
const APODO_PENDIENTE_KEY = "mirai_apodo_pendiente";
const SESION_ID_KEY = "mirai_sesion_id";

interface InformeLista {
  token: string;
  generado_en: string;
  perfil_json: PerfilResultado;
}

type EstadoFormulario = "idle" | "enviando" | "enviado" | "yaTenias" | "limite" | "error";

/** Nombres de hasta 2 carreras del perfil guardado (ids → nombres curados). */
function nombresCarreras(perfil: PerfilResultado): string[] {
  return perfil.carrerasRecomendadas
    .slice(0, 2)
    .map((id) => carreraPorId(id)?.nombre)
    .filter((n): n is string => !!n);
}

export function MiCuenta() {
  const [sesion, setSesion] = useState<Session | null | "cargando">("cargando");
  const [informes, setInformes] = useState<InformeLista[]>([]);

  // Estado A — entrar con correo.
  const [entrarEstado, setEntrarEstado] = useState<EstadoFormulario>("idle");
  const [entrarCorreo, setEntrarCorreo] = useState("");

  // Estado B — vincular la sesión anónima.
  const [vincularEstado, setVincularEstado] = useState<EstadoFormulario>("idle");
  const [vincularCorreo, setVincularCorreo] = useState("");
  const [vincularApodo, setVincularApodo] = useState("");

  // Estado C — apodo editable + desvinculación.
  const [apodo, setApodo] = useState("");
  const [apodoEstado, setApodoEstado] = useState<"idle" | "guardando" | "guardado" | "error">("idle");
  const [confirmandoDesvincular, setConfirmandoDesvincular] = useState(false);

  const cargarInformes = useCallback(async () => {
    if (!supabase) return;
    // RLS por auth.uid(): solo filas de esta sesión. Proyección mínima,
    // nunca session_id (D1 de tanda).
    const { data } = await supabase
      .from("resultados")
      .select("token, generado_en, perfil_json")
      .order("generado_en", { ascending: false });
    if (data) setInformes(data as InformeLista[]);
  }, []);

  useEffect(() => {
    let activo = true;

    const aplicarSesion = async (nueva: Session | null) => {
      if (!activo) return;
      setSesion(nueva);
      if (nueva) {
        await cargarInformes();
      } else {
        setInformes([]);
      }
    };

    (async () => {
      if (!supabase) {
        setSesion(null);
        return;
      }
      const { data } = await supabase.auth.getSession();
      await aplicarSesion(data.session);
      const { data: sub } = supabase.auth.onAuthStateChange((_evento, nueva) => {
        void aplicarSesion(nueva);
      });
      return () => {
        sub.subscription.unsubscribe();
      };
    })();

    return () => {
      activo = false;
    };
  }, [cargarInformes]);

  // Re-inicializa el input de apodo SOLO cuando cambia el uid de la sesión
  // (entrada a la página, conversión o cambio de cuenta). Un updateUser no
  // cambia el uid, así que no pisa lo que el usuario está escribiendo.
  const uid = sesion && sesion !== "cargando" ? sesion.user.id : null;
  const uidAnterior = useRef<string | null>(null);
  useEffect(() => {
    if (uid && uidAnterior.current !== uid) {
      uidAnterior.current = uid;
      const meta = sesion !== "cargando" && sesion ? sesion.user.user_metadata : null;
      setApodo(typeof meta?.apodo === "string" ? meta.apodo : "");
      setApodoEstado("idle");
    }
  }, [uid, sesion]);

  // ── Estado A: entrar con un enlace (solo cuentas existentes) ──────────
  const enviarEntrar = async () => {
    const parsed = correoSchema.safeParse(entrarCorreo);
    if (!parsed.success) {
      setEntrarEstado("error");
      return;
    }
    setEntrarEstado("enviando");
    try {
      const respuesta = await fetch("/api/entrar-cuenta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: parsed.data }),
      });
      if (respuesta.status === 429) {
        setEntrarEstado("limite");
        return;
      }
      if (!respuesta.ok) throw new Error("envío falló");
      setEntrarEstado("enviado");
    } catch {
      setEntrarEstado("error");
    }
  };

  // ── Estado B: vincular la sesión anónima (mismo flujo que Tanda A) ────
  const enviarVincular = async () => {
    const parsed = correoSchema.safeParse(vincularCorreo);
    if (!parsed.success) {
      setVincularEstado("error");
      return;
    }
    setVincularEstado("enviando");
    try {
      if (!supabase) throw new Error("sin supabase");
      const { data } = await supabase.auth.getSession();
      const uidAnonimo = data.session?.user.id;
      if (!uidAnonimo) throw new Error("sin sesión");

      // Keys de Tanda A: /guardar-informe usa el uid para confirmar que la
      // conversión preservó la cuenta y aplica el apodo pendiente.
      sessionStorage.setItem(UID_ANONIMO_KEY, uidAnonimo);
      const apodoLimpio = sanitizarApodo(vincularApodo);
      if (apodoLimpio) sessionStorage.setItem(APODO_PENDIENTE_KEY, apodoLimpio);
      // No guardamos mirai_sesion_id: el listado no expone session_id (D1), y
      // tras vincular el informe sigue accesible desde esta misma página.

      const token = await obtenerAccessToken();
      if (!token) throw new Error("sin sesión");

      const respuesta = await fetch("/api/vincular-cuenta", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ correo: parsed.data }),
      });
      if (respuesta.status === 429) {
        setVincularEstado("limite");
        return;
      }
      if (!respuesta.ok) throw new Error("envío falló");
      const cuerpo = (await respuesta.json()) as { yaTeniasCuenta?: boolean };
      setVincularEstado(cuerpo.yaTeniasCuenta ? "yaTenias" : "enviado");
    } catch {
      setVincularEstado("error");
    }
  };

  // ── Estado C: apodo + desvinculación ──────────────────────────────────
  const guardarApodo = async () => {
    if (!supabase || !sesion || sesion === "cargando") return;
    const apodoLimpio = sanitizarApodo(apodo);
    const actual =
      typeof sesion.user.user_metadata?.apodo === "string" ? sesion.user.user_metadata.apodo : "";
    if (apodoLimpio === actual) {
      setApodoEstado("guardado");
      return;
    }
    setApodoEstado("guardando");
    const { error } = await supabase.auth.updateUser({ data: { apodo: apodoLimpio } });
    setApodoEstado(error ? "error" : "guardado");
  };

  const desvincular = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    // El cierre de sesión NO borra datos: solo limpia lo local de este navegador.
    sessionStorage.removeItem(UID_ANONIMO_KEY);
    sessionStorage.removeItem(APODO_PENDIENTE_KEY);
    sessionStorage.removeItem(SESION_ID_KEY);
    setConfirmandoDesvincular(false);
  };

  // ── Render ────────────────────────────────────────────────────────────
  if (sesion === "cargando") {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 text-center">
        <p className="font-display text-xl text-tinta/70">{miCuenta.cargando}</p>
      </main>
    );
  }

  const claseInput =
    "w-full rounded-[14px] border border-tinta/10 bg-blanco-papel px-4 py-2 text-sm text-tinta outline-none transition focus:border-coral/50";
  const claseBoton =
    "rounded-[14px] bg-tinta px-5 py-2 text-sm font-medium text-blanco-papel transition enabled:hover:opacity-90 disabled:opacity-40";

  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 py-12">
      {/* ── Estado A: sin sesión ── */}
      {sesion === null && (
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-2xl font-semibold">{miCuenta.sinSesion.titulo}</h1>
            <p className="mt-2 text-base text-tinta/60">{miCuenta.sinSesion.detalle}</p>
          </div>

          <section className="rounded-[14px] bg-papel-sombra/30 p-5">
            <label htmlFor="entrar-correo" className="block text-sm font-medium text-tinta">
              {miCuenta.sinSesion.entrarLabel}
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                id="entrar-correo"
                type="email"
                value={entrarCorreo}
                onChange={(e) => setEntrarCorreo(e.target.value)}
                placeholder="tu@correo.cl"
                className={claseInput}
                aria-label={miCuenta.sinSesion.entrarLabel}
              />
              <button
                onClick={enviarEntrar}
                disabled={entrarEstado === "enviando" || entrarEstado === "enviado" || !entrarCorreo.trim()}
                className={claseBoton}
              >
                {miCuenta.sinSesion.enviarBoton}
              </button>
            </div>
            {entrarEstado === "enviado" && (
              <p className="mt-3 text-sm text-salvia">{miCuenta.sinSesion.enviado}</p>
            )}
            {entrarEstado === "limite" && (
              <p className="mt-3 text-sm text-red-500">{miCuenta.sinSesion.limite}</p>
            )}
            {entrarEstado === "error" && (
              <p className="mt-3 text-sm text-red-500">{miCuenta.sinSesion.error}</p>
            )}
          </section>

          <div className="text-center">
            <a
              href={miCuenta.sinSesion.ctaExperienciaHref}
              className="rounded-[14px] bg-coral px-6 py-3 text-base font-medium text-blanco-papel transition hover:opacity-90"
            >
              {miCuenta.sinSesion.ctaExperiencia}
            </a>
          </div>
        </div>
      )}

      {/* ── Estados B (anónima) y C (vinculada): sesión activa ── */}
      {sesion !== null && (
        <div className="space-y-6">
          <div>
            <h1 className="font-display text-2xl font-semibold">
              {sesion.user.email ? miCuenta.vinculada.correoLabel : miCuenta.anonima.titulo}
            </h1>
            {sesion.user.email ? (
              <p className="mt-2 text-base text-tinta/60">{sesion.user.email}</p>
            ) : (
              <p className="mt-2 text-base text-tinta/60">{miCuenta.anonima.detalle}</p>
            )}
          </div>

          {/* ── Estado B: vincular la sesión anónima ── */}
          {!sesion.user.email && (
            <section className="rounded-[14px] bg-papel-sombra/30 p-5">
              <label htmlFor="vincular-correo" className="block text-sm font-medium text-tinta">
                {miCuenta.anonima.vincularLabel}
              </label>
              <input
                id="vincular-correo"
                type="email"
                value={vincularCorreo}
                onChange={(e) => setVincularCorreo(e.target.value)}
                placeholder="tu@correo.cl"
                className={`${claseInput} mt-2`}
                aria-label={miCuenta.anonima.vincularLabel}
              />
              <input
                type="text"
                value={vincularApodo}
                onChange={(e) => setVincularApodo(e.target.value)}
                maxLength={20}
                placeholder={miCuenta.vinculada.apodoPlaceholder}
                className={`${claseInput} mt-2`}
                aria-label={miCuenta.vinculada.apodoPlaceholder}
              />
              <button
                onClick={enviarVincular}
                disabled={vincularEstado === "enviando" || vincularEstado === "enviado" || !vincularCorreo.trim()}
                className={`${claseBoton} mt-3`}
              >
                {miCuenta.anonima.vincularBoton}
              </button>
              {vincularEstado === "enviado" && (
                <p className="mt-3 text-sm text-salvia">{miCuenta.anonima.vincularExito}</p>
              )}
              {vincularEstado === "yaTenias" && (
                <p className="mt-3 text-sm text-tinta/70">{miCuenta.anonima.vincularYaTenias}</p>
              )}
              {vincularEstado === "limite" && (
                <p className="mt-3 text-sm text-red-500">{miCuenta.anonima.vincularLimite}</p>
              )}
              {vincularEstado === "error" && (
                <p className="mt-3 text-sm text-red-500">{miCuenta.anonima.vincularError}</p>
              )}
            </section>
          )}

          {/* ── Estado C: apodo editable ── */}
          {sesion.user.email && (
            <section className="rounded-[14px] bg-papel-sombra/30 p-5">
              <label htmlFor="apodo" className="block text-sm font-medium text-tinta">
                {miCuenta.vinculada.apodoLabel}
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  id="apodo"
                  type="text"
                  value={apodo}
                  onChange={(e) => {
                    setApodo(e.target.value);
                    setApodoEstado("idle");
                  }}
                  maxLength={20}
                  placeholder={miCuenta.vinculada.apodoPlaceholder}
                  className={claseInput}
                  aria-label={miCuenta.vinculada.apodoPlaceholder}
                />
                <button
                  onClick={guardarApodo}
                  disabled={apodoEstado === "guardando"}
                  className={claseBoton}
                >
                  {miCuenta.vinculada.apodoGuardar}
                </button>
              </div>
              {apodoEstado === "guardado" && (
                <p className="mt-2 text-sm text-salvia">{miCuenta.vinculada.apodoGuardado}</p>
              )}
              {apodoEstado === "error" && (
                <p className="mt-2 text-sm text-red-500">{miCuenta.vinculada.apodoError}</p>
              )}
            </section>
          )}

          {/* ── Lista de informes (RLS: solo los propios) ── */}
          <section>
            <h2 className="font-display text-lg font-semibold">{miCuenta.vinculada.listaTitulo}</h2>
            {informes.length === 0 ? (
              <p className="mt-2 text-sm text-tinta/60">{miCuenta.vinculada.sinInformes}</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {informes.map((informe) => {
                  const carreras = nombresCarreras(informe.perfil_json);
                  return (
                    <li
                      key={informe.token}
                      className="rounded-[14px] border border-tinta/10 bg-blanco-papel p-4 transition hover:border-tinta/20"
                    >
                      <p className="font-display text-base font-medium text-tinta">
                        {tituloInforme(informe.perfil_json)}
                      </p>
                      <p className="mt-1 text-sm text-tinta/60">{formatearFecha(informe.generado_en)}</p>
                      {carreras.length > 0 && (
                        <p className="mt-1 text-sm text-tinta/50">{carreras.join(" · ")}</p>
                      )}
                      <a
                        href={`/informe/${informe.token}`}
                        className="mt-2 inline-block text-sm font-medium text-coral underline transition hover:opacity-80"
                      >
                        {miCuenta.vinculada.abrirInforme}
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* ── Desvincular (solo en estado C; reversible, sin borrar datos) ── */}
          {sesion.user.email && (
            <section className="rounded-[14px] border border-tinta/10 p-5">
              <p className="text-sm text-tinta/60">{miCuenta.vinculada.desvincularDetalle}</p>
              {confirmandoDesvincular ? (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <p className="text-sm font-medium text-tinta">{miCuenta.vinculada.desvincularConfirmar}</p>
                  <button
                    onClick={desvincular}
                    className="rounded-[14px] bg-coral px-4 py-2 text-sm font-medium text-blanco-papel transition hover:opacity-90"
                  >
                    {miCuenta.vinculada.desvincularBoton}
                  </button>
                  <button
                    onClick={() => setConfirmandoDesvincular(false)}
                    className="rounded-[14px] border border-tinta/10 px-4 py-2 text-sm text-tinta/70 transition hover:border-tinta/20"
                  >
                    {miCuenta.vinculada.desvincularCancelar}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmandoDesvincular(true)}
                  className="mt-3 rounded-[14px] border border-tinta/10 px-4 py-2 text-sm text-tinta/70 transition hover:border-coral/50 hover:text-tinta"
                >
                  {miCuenta.vinculada.desvincularBoton}
                </button>
              )}
            </section>
          )}
        </div>
      )}
    </main>
  );
}
