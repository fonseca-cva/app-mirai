import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Informe } from "@/components/experiencia/Informe";
import type { InformePublicoRow } from "@/lib/supabase/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Un token de informe es un id aleatorio URL-safe de 22 chars (base64url de
// gen_random_bytes(16), migración 00013). Validar antes de tocar la base.
const TOKEN_RE = /^[A-Za-z0-9_-]{20,24}$/;

// Informes personales: jamás en buscadores (regla de Camilo). El robots.txt
// también excluye /informe/; esto es la doble red a nivel de página.
export async function generateMetadata(): Promise<Metadata> {
  return {
    robots: { index: false, follow: false },
  };
}

export default async function InformePermanentePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!TOKEN_RE.test(token)) notFound();
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) notFound();

  // Cliente sin sesión (rol anon): la única vía de lectura es la RPC pública
  // obtener_informe_publico, que devuelve SOLO token/perfil_json/generado_en
  // para la fila con ese token exacto. Un token ajeno → 0 filas → notFound().
  const cliente = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await cliente
    .rpc("obtener_informe_publico", { p_token: token })
    .maybeSingle();

  if (error || !data) notFound();

  // La RPC está tipada como unknown por supabase-js: la forma la define la
  // función SQL (00013), documentada en InformePublicoRow.
  const perfil = (data as InformePublicoRow).perfil_json;

  return (
    <main>
      {/* Modo estático: reconstruye el informe desde la fila guardada. Sin
          correo, sin apodo, sin datos de cuenta: solo el perfil y resultados. */}
      <Informe perfil={perfil} />
    </main>
  );
}
