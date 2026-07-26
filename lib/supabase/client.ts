import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// La anon key es segura en el cliente: el acceso real lo controla RLS en Supabase,
// scopeado por session_id. Sin las env vars (aún no hay proyecto creado), el cliente
// queda null y los llamadores deben degradar sin romper el flujo (guardar en cola local).
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;
