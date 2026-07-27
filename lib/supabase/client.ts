import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// La anon key es segura en el cliente: el acceso real lo controla RLS en Supabase,
// scopeada por auth.uid() (Anonymous Auth). Sin las env vars (aún no hay proyecto
// creado), el cliente queda null y los llamadores deben degradar sin romper el flujo
// (guardar en cola local).
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;

let sesionAnonimaLista: Promise<boolean> | null = null;

// Las policies RLS exigen auth.uid() = user_id, así que toda operación contra
// tablas con RLS necesita una sesión anónima activa primero. Se cachea la promesa
// para llamar signInAnonymously() una sola vez por carga de página.
export function asegurarSesionAnonima(): Promise<boolean> {
  if (!supabase) return Promise.resolve(false);
  if (!sesionAnonimaLista) {
    const cliente = supabase;
    sesionAnonimaLista = cliente.auth.getSession().then(async ({ data }) => {
      if (data.session) return true;
      const { error } = await cliente.auth.signInAnonymously();
      return !error;
    });
  }
  return sesionAnonimaLista;
}

// Access token de la sesión anónima, para autenticar llamadas a route handlers
// del servidor (ej. POST /api/enviar-informe) que necesitan operar como este
// usuario y quedar sujetas a las mismas policies RLS (auth.uid() = user_id).
export async function obtenerAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  const cliente = supabase;
  const lista = await asegurarSesionAnonima();
  if (!lista) return null;
  const { data } = await cliente.auth.getSession();
  return data.session?.access_token ?? null;
}
