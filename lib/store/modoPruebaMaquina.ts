// MÁQUINA DE ESTADOS DEL MODO PRUEBA (pilot readiness).
//
// Se extrajo de app/experiencia/page.tsx para poder COMPROBARLA. Los tests que
// llaman directamente al store no cubren los órdenes de eventos de la página
// (fetch pendiente + clic rápido, expiración, recarga, empezar de nuevo), que es
// exactamente donde estaban las carreras.
//
// Estados:
//   * 'no-pedida'  → flujo normal. No se valida nada (cero overhead) y la entrada
//                    no se bloquea.
//   * 'validando'  → se pidió ?prueba=1 y la verificación está en curso. BLOQUEA
//                    la entrada: sin esto, un clic rápido en "Empezar" creaba y
//                    escribía la sesión antes de saber si la prueba estaba
//                    autorizada.
//   * 'autorizada' → cookie de /debug válida. Se puede escribir con es_prueba.
//   * 'fallida'    → no se pudo autorizar. Detiene la experiencia con un mensaje
//                    visible. NUNCA se degrada a 'no-pedida' (flujo normal): eso
//                    guardaría una prueba como sesión real.
//
// Invariante central: una vez que una URL pidió prueba, la fase NUNCA vuelve a
// 'no-pedida'. Solo se sale de la prueba descartando explícitamente (y aun así se
// revalida antes de crear otra sesión).

export type FaseAutorizacion = "no-pedida" | "validando" | "autorizada" | "fallida";

export function faseInicial(urlPidePrueba: boolean): FaseAutorizacion {
  return urlPidePrueba ? "validando" : "no-pedida";
}

/** La URL trae ?prueba=1: se pasa a 'validando' ANTES de cualquier fetch. */
export function alDetectarUrlPrueba(): FaseAutorizacion {
  return "validando";
}

/**
 * Resultado de la verificación server-side (o del reintento tras descartar).
 * `ok=false` siempre lleva a 'fallida' (fail-closed).
 */
export function alResolverVerificacion(
  _faseActual: FaseAutorizacion,
  ok: boolean,
  _pideReal: boolean
): FaseAutorizacion {
  return ok ? "autorizada" : "fallida";
}

/** Error de red/timeout: fail-closed, igual que una respuesta negativa. */
export function alFallarVerificacion(): FaseAutorizacion {
  return "fallida";
}

/**
 * "Empezar de nuevo" dentro de una URL de prueba: se vuelve a 'validando' (y por
 * tanto se bloquea la entrada) hasta revalidar. Nunca a 'no-pedida'.
 */
export function alDescartarEnPrueba(): FaseAutorizacion {
  return "validando";
}

/** ¿Se puede entrar a la experiencia en esta fase? */
export function puedeEntrar(fase: FaseAutorizacion): boolean {
  return fase === "no-pedida" || fase === "autorizada";
}

/** ¿Hay que bloquear la pantalla (spinner de verificación o fail-stop)? */
export function bloqueaEntrada(fase: FaseAutorizacion): boolean {
  return fase === "validando" || fase === "fallida";
}

/** Mensaje visible cuando la verificación falló; null si no hay nada que explicar. */
export function mensajeBloqueo(fase: FaseAutorizacion): string | null {
  if (fase !== "fallida") return null;
  return (
    "No se pudo activar el modo prueba: la cookie de acceso de /debug no es válida o expiró. " +
    "Vuelve a entrar con ?prueba=1&clave=TU_CLAVE para reautorizar."
  );
}
