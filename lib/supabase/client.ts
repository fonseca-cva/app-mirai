import { createClient, isAuthApiError, isAuthSessionMissingError, type SupabaseClient } from "@supabase/supabase-js";

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
    const intento = cliente.auth
      .getSession()
      .then(async ({ data }) => {
        if (data.session) return true;
        const { error } = await cliente.auth.signInAnonymously();
        return !error;
      })
      .catch(() => false);
    sesionAnonimaLista = intento;
    // Un fallo NO se cachea: si Supabase estaba caído (o sin red), el siguiente
    // intento ("inténtalo de nuevo") debe volver a llamar a Supabase en vez de
    // reutilizar para siempre la promesa fallida de esta carga de página.
    void intento.then((ok) => {
      if (!ok && sesionAnonimaLista === intento) sesionAnonimaLista = null;
    });
  }
  return sesionAnonimaLista;
}

// "Empezar de nuevo" en un computador compartido: si en este navegador quedó una
// cuenta CON correo (otro alumno entró a Mi cuenta, o una prueba anterior), el test
// nuevo no puede heredarla — guardaría el informe en una cuenta ajena o, peor,
// pediría cambiarle el correo. Se cierra esa sesión (solo en este navegador) y el
// próximo asegurarSesionAnonima() crea una anónima limpia. Devuelve true si cerró.
export async function cerrarSesionConCorreo(): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  const usuario = data.session?.user;
  if (!usuario || usuario.is_anonymous || !usuario.email) return false;
  await supabase.auth.signOut({ scope: "local" });
  sesionAnonimaLista = null;
  return true;
}

// Access token de la sesión anónima, para autenticar llamadas a route handlers
// del servidor (ej. POST /api/vincular-cuenta) que necesitan operar como este
// usuario y quedar sujetas a las mismas policies RLS (auth.uid() = user_id).
//
// IMPORTANTE (fix "sesión zombi"): getSession() puede devolver un access_token
// que parece válido localmente (firma + expiración) pero cuya sesión ya fue
// invalidada server-side (refresh_token rotado/revocado, p. ej. tras una pestaña
// abierta mucho tiempo). Ese token pasa el borde pero GoTrue lo rechaza en
// updateUser() con "Auth session missing!". Por eso aquí NO confiamos en el
// token de getSession(): lo validamos contra el servidor con getUser(); si el
// servidor lo rechaza, descartamos la sesión vieja y creamos una anónima nueva.
/** true solo si GoTrue rechazó la sesión (no ante fallas de red ni 5xx). */
export function sesionMuerta(error: unknown): boolean {
  if (!error) return true; // getUser sin error pero sin usuario: sesión inexistente
  if (isAuthSessionMissingError(error)) return true;
  if (isAuthApiError(error)) {
    return error.status === 401 || error.status === 403 || error.code === "session_not_found" || error.code === "user_not_found" || error.code === "bad_jwt";
  }
  return false;
}

export async function obtenerAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  const cliente = supabase;
  const lista = await asegurarSesionAnonima();
  if (!lista) return null;

  const { data } = await cliente.auth.getSession();
  const sesion = data.session;
  if (!sesion) return null;

  // Validación contra el servidor: getUser() sí golpea GoTrue, a diferencia de
  // getSession() que lee el storage local. Si la sesión ya no está viva
  // server-side, la descartamos y re-creamos una anónima.
  const { data: verificado, error: errorVerificacion } = await cliente.auth.getUser();
  if (!errorVerificacion && verificado.user) {
    return sesion.access_token;
  }

  // Solo se descarta la sesión si el SERVIDOR confirma que está muerta (401/403 o
  // sesión inexistente). Un error de red o un 5xx NO es una sesión zombi: recrearla
  // ahí cambiaba el uid y dejaba el informe huérfano (el correo quedaba en una
  // cuenta vacía). En ese caso se devuelve null y el llamador muestra "reintenta".
  if (!sesionMuerta(errorVerificacion)) return null;

  // Sesión zombi: limpiar el storage local y crear una sesión anónima nueva.
  // El uid puede cambiar; los llamadores deben operar con el uid de la sesión
  // resultante, no con uno capturado antes.
  await cliente.auth.signOut({ scope: "local" }).catch(() => undefined);
  const { data: nuevas, error: errorNuevo } = await cliente.auth.signInAnonymously();
  if (errorNuevo || !nuevas.session) return null;
  return nuevas.session.access_token;
}
