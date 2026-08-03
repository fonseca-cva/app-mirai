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
import { guardarCuenta } from "@/lib/config/textos";
import { sanitizarApodo } from "@/lib/logic/cuenta";

const UID_ANONIMO_KEY = "mirai_uid_anonimo";
const APODO_PENDIENTE_KEY = "mirai_apodo_pendiente";
const SESION_ID_KEY = "mirai_sesion_id";

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

      const uidAnonimo = sessionStorage.getItem(UID_ANONIMO_KEY);
      const apodoPendiente = sessionStorage.getItem(APODO_PENDIENTE_KEY);

      if (uidAnonimo && sesion.user.id === uidAnonimo) {
        // Misma cuenta (el uid no cambió): conversión exitosa, los datos quedan.
        const apodoLimpio = apodoPendiente ? sanitizarApodo(apodoPendiente) : null;
        if (apodoLimpio) {
          await supabase.auth.updateUser({ data: { apodo: apodoLimpio } });
        }
        sessionStorage.removeItem(UID_ANONIMO_KEY);
        sessionStorage.removeItem(APODO_PENDIENTE_KEY);

        // Tanda B: envío del correo con el enlace permanente (/informe/[token]).
        // Solo si conocemos la sesión que generó este informe (mismo navegador).
        // Si falla, la cuenta quedó vinculada igual: el informe no se pierde.
        const sesionId = sessionStorage.getItem(SESION_ID_KEY);
        sessionStorage.removeItem(SESION_ID_KEY);
        if (activo) setEstado({ fase: "vinculado", apodo: apodoLimpio, enlace: sesionId ? "enviando" : null });

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
        return;
      }

      // Sesión activa pero de otra cuenta: no fusionamos uids en esta versión.
      if (activo) setEstado({ fase: "cuentaExistente" });
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
