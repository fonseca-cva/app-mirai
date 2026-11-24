"use client";

// /guardar-informe — destino del enlace de confirmación de correo (Tanda A).
//
// Con la conversión vía updateUser({ email }), el enlace NO trae tokens en la URL:
// GoTrue confirma el cambio de correo server-side y redirige aquí. Si el clic
// ocurrió en el mismo navegador que hizo la experiencia, la sesión anónima sigue
// activa con el MISMO auth.uid() → vinculado. Si no hay sesión (otro navegador /
// enlace expirado) → inválido. Si hay sesión pero de OTRA cuenta → aviso honesto
// (no fusionamos uids en esta versión).
//
// Minimización: esta página no muestra correo ni apodo salvo el que el propio
// usuario escribió; nada identificable vive en la URL.

import { useEffect, useState } from "react";
import { obtenerAccessToken, supabase } from "@/lib/supabase/client";
import { guardarCuenta, miCuenta } from "@/lib/config/textos";
import { sanitizarApodo } from "@/lib/logic/cuenta";
import { leerVinculacionPendiente, limpiarVinculacionPendiente } from "@/lib/logic/vinculacionPendiente";

type Estado =
  | { fase: "cargando" }
  | { fase: "vinculado"; apodo: string | null; enlace: "enviando" | "enviado" | "error" | null }
  | { fase: "cuentaExistente" }
  | { fase: "invalido" };

export default function GuardarInformePage() {
  const [estado, setEstado] = useState<Estado>({ fase: "cargando" });

  useEffect(() => {
    let activo = true;

    (async () => {
      if (!supabase) {
        if (activo) setEstado({ fase: "invalido" });
        return;
      }

      const { data } = await supabase.auth.getSession();
      const sesion = data.session;

      if (!sesion) {
        // Sin sesión: enlace abierto en otro navegador, sesión expirada o ya cerrada.
        if (activo) setEstado({ fase: "invalido" });
        return;
      }

      // La vinculación pendiente vive en localStorage: el enlace del correo abre una
      // pestaña NUEVA, y antes (sessionStorage) aquí nunca se encontraba el dato.
      const pendiente = leerVinculacionPendiente();
      const uidActual = sesion.user.id;

      // La sesión sigue anónima: el correo NO se confirmó en este navegador (otro
      // navegador/dispositivo, enlace vencido o aún no abierto). Nunca decir "guardado".
      if (sesion.user.is_anonymous) {
        if (activo) setEstado({ fase: "invalido" });
        return;
      }

      // Sesión activa de OTRA cuenta (el uid cambió): no fusionamos uids en esta versión.
      if (pendiente && pendiente.uid !== uidActual) {
        if (activo) setEstado({ fase: "cuentaExistente" });
        return;
      }

      // Misma cuenta (o cuenta ya confirmada sin dato local): la cuenta está vinculada.
      const apodoLimpio = pendiente?.apodo ? sanitizarApodo(pendiente.apodo) : null;
      if (apodoLimpio) {
        await supabase.auth.updateUser({ data: { apodo: apodoLimpio } });
      }

      // Sesión del informe a enviar: la guardada, o como respaldo el informe más
      // reciente de esta cuenta (RLS: solo filas del uid actual).
      // Sin vinculación pendiente (p. ej. recargar esta página después del éxito) no se
      // reenvía nada: así una recarga no dispara correos repetidos.
      let sesionId = pendiente?.sesionId ?? null;
      if (!sesionId && pendiente) {
        const { data: ultimo } = await supabase
          .from("resultados")
          .select("session_id")
          .order("generado_en", { ascending: false })
          .limit(1)
          .maybeSingle();
        sesionId = (ultimo as { session_id?: string } | null)?.session_id ?? null;
      }
      limpiarVinculacionPendiente();
      if (activo) setEstado({ fase: "vinculado", apodo: apodoLimpio, enlace: sesionId ? "enviando" : null });

      // Tanda B: envío del correo con el enlace permanente (/informe/[token]).
      // Si falla, la cuenta quedó vinculada igual: el informe no se pierde.
      if (sesionId) {
        try {
          const token = await obtenerAccessToken();
          if (!token) throw new Error("sin sesión");
          const respuesta = await fetch("/api/enviar-informe-permanente", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ sessionId: sesionId }),
          });
          if (activo) {
            setEstado({ fase: "vinculado", apodo: apodoLimpio, enlace: respuesta.ok ? "enviado" : "error" });
          }
        } catch {
          if (activo) setEstado({ fase: "vinculado", apodo: apodoLimpio, enlace: "error" });
        }
      }
    })();

    return () => {
      activo = false;
    };
  }, []);

  if (estado.fase === "cargando") {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 text-center">
        <p className="font-display text-xl text-tinta/70">{guardarCuenta.cargando}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      {estado.fase === "vinculado" && (
        <>
          <h1 className="font-display text-2xl font-semibold">{guardarCuenta.vinculado(estado.apodo)}</h1>
          <p className="text-base text-tinta/60">{guardarCuenta.vinculadoDetalle}</p>
          {estado.enlace === "enviando" && <p className="text-sm text-tinta/60">{guardarCuenta.enviandoEnlace}</p>}
          {estado.enlace === "enviado" && <p className="text-sm text-salvia">{guardarCuenta.enlaceEnviado}</p>}
          {estado.enlace === "error" && <p className="text-sm text-tinta/70">{guardarCuenta.enlaceError}</p>}
          <a
            href="/mi-cuenta"
            className="mt-1 text-sm font-medium text-coral underline transition hover:opacity-80"
          >
            {miCuenta.verMisInformes}
          </a>
        </>
      )}
      {estado.fase === "cuentaExistente" && (
        <>
          <h1 className="font-display text-2xl font-semibold">{guardarCuenta.cuentaExistente}</h1>
          <p className="text-base text-tinta/60">{guardarCuenta.cuentaExistenteDetalle}</p>
        </>
      )}
      {estado.fase === "invalido" && (
        <>
          <h1 className="font-display text-2xl font-semibold">{guardarCuenta.invalido}</h1>
          <p className="text-base text-tinta/60">{guardarCuenta.invalidoDetalle}</p>
          <a
            href="/mi-cuenta"
            className="mt-1 text-sm font-medium text-coral underline transition hover:opacity-80"
          >
            {guardarCuenta.invalidoEntrar}
          </a>
        </>
      )}
      <a
        href="/experiencia"
        className="mt-4 rounded-[14px] bg-tinta px-6 py-3 text-base font-medium text-blanco-papel transition hover:opacity-90"
      >
        {guardarCuenta.irAExperiencia}
      </a>
    </main>
  );
}
