import { create, type UseBoundStore, type StoreApi } from "zustand";
import { persist } from "zustand/middleware";
import type { Respuesta as RespuestaGustos } from "@/lib/logic/puntaje";
import type { RespuestaActividad, RespuestaAsignatura, Aspiracion } from "@/lib/logic/puntaje";
import type { OpcionAspiracion } from "@/lib/data/aspiracion";
import { sesionEnCurso, crearSessionIdNuevo, descartarSesionEnCurso, evaluarReanudable, RETENCION_MS } from "@/lib/store/sesion";
import { procesarColaSync, construirSesionRow, type TareaSync } from "@/lib/supabase/sync";
import { storageDeExperiencia, CLAVE_ESTADO, modalidadConfigurada } from "@/lib/store/almacenamiento";
import { bloqueCompleto } from "@/lib/store/checkpoints";
import { contextos } from "@/lib/data/contextos";
import { actividades } from "@/lib/data/actividades";
import { asignaturas } from "@/lib/data/asignaturas";
import { itemsMatrices } from "@/lib/data/matrices";
import { itemsSeries } from "@/lib/data/series";
import { itemsPliegues } from "@/lib/data/pliegues";
import { OBJETOS_DIVERGENTE, MIN_IDEAS_POR_OBJETO } from "@/lib/data/divergente";

// Bloque Integración: los tipos de respuesta del pilar de intereses viven en
// puntaje.ts (calcularPuntajesIntegrados los consume) y en data/aspiracion.ts
// (unión cerrada del CHECK de la migración 00011). Se re-exportan acá para no
// romper los imports de los componentes.
export type { TareaSync } from "@/lib/supabase/sync";
export type { RespuestaActividad, RespuestaAsignatura, Aspiracion } from "@/lib/logic/puntaje";
export type { OpcionAspiracion } from "@/lib/data/aspiracion";

export type PasoExperiencia =
  | "intro"
  | "aspiracion"
  | "gustos"
  | "actividades"
  | "asignaturas"
  | "resultadoParcial"
  | "cognitivo"
  | "verbal"
  | "divergente"
  | "informe";

export interface RespuestaCognitivo {
  juego: "matrices" | "series" | "pliegues" | "secuencias";
  itemId: string;
  correcto: boolean;
  nivel: number;
  duracionMs: number;
  // Anexo 3: solo aplica a "secuencias" — si esta respuesta vino tras usar la única
  // repetición por timeout de inactividad de la ronda (para no penalizar por distracción).
  repetidoPorTimeout: boolean;
}

export interface RespuestaVerbal {
  // Id de la fila respuestas_verbal insertada en 'pendiente' antes de evaluar
  // (reintento asíncrono, punto 10). Si existe, el sync del bloque actualiza la
  // fila vía RPC en vez de insertar una nueva.
  id?: number;
  tarea: "comprension" | "argumentacion" | "expresion";
  texto: string;
  evaluacion: unknown | null;
  // Validez (plan de Camilo): 'no_pertinente' = filtro de pertinencia rechazó la
  // respuesta (se guarda igual para QA); 'no_evaluado' = evaluación no disponible
  // (sin proveedor, fallo o formato inválido). NUNCA se inventa un puntaje.
  estado: "pendiente" | "evaluado" | "error" | "no_pertinente" | "no_evaluado";
  // Telemetría de control de calidad (solo QA: no afecta puntaje ni se muestra).
  pegado?: boolean;
  caracteresPegados?: number;
  revisionRequerida?: boolean;
  // Doble evaluación: true si la evaluación se reportó con un solo evaluador
  // (el segundo no estaba configurado o falló). Se persiste para auditoría.
  acuerdoNoDisponible?: boolean;
  intento?: number;
}

export interface RespuestaDivergente {
  objeto: string;
  respuestasTexto: string[];
  cantidad: number;
}

interface EstadoExperiencia {
  sessionId: string | null;
  paso: PasoExperiencia;
  pausado: boolean;
  // Modo prueba (aislamiento 00017): true solo mientras una sesión válida de /debug
  // esté autenticada en el navegador (cookie httpOnly). NO se persiste en localStorage
  // (se revalida contra /api/debug/verificar-prueba antes de cada escritura), así que
  // nunca queda "pegado" entre recargas ni tras expirar la cookie.
  modoPrueba: boolean;
  // Modo prueba real (fix 2026-09-09, bug de índices desalineados en /api/debug/evaluar):
  // solo tiene efecto si modoPrueba también está activo. Cuando es true, BloqueVerbal usa
  // la ruta real /api/evaluar (persiste) en vez de /api/debug/evaluar, para probar el flujo
  // exacto de producción. El aislamiento sigue viniendo de sesiones.es_prueba (transitivo
  // por FK a las tablas hijas) — ver construirSesionRow en lib/supabase/sync.ts.
  modoPruebaReal: boolean;
  // Fail-stop (exigencia de Camilo): si la cookie de debug deja de validar a mitad de una
  // sesión en modo prueba real, sincronizarBloque corta la escritura como siempre, pero
  // además deja esta marca para que la UI se detenga con un mensaje visible en vez de
  // seguir en silencio hacia una sesión que ya no está garantizado que quede marcada.
  pruebaRealCortada: boolean;
  // Mejora Bloque A: elección de audio ambiente hecha en IntroExperiencia (opt-in,
  // nunca autoplay). El mute momentáneo durante el bloque es estado local del componente.
  audioActivado: boolean;
  respuestasGustos: RespuestaGustos[];
  respuestasCognitivo: RespuestaCognitivo[];
  respuestasVerbal: RespuestaVerbal[];
  respuestasDivergente: RespuestaDivergente[];
  respuestasActividades: RespuestaActividad[];
  respuestasAsignaturas: RespuestaAsignatura[];
  aspiracion: Aspiracion | null;
  colaSync: TareaSync[];

  // ¿Hay una experiencia EMPEZADA y NO TERMINADA en este navegador? Es la única
  // condición que habilita la oferta de reanudar. Se pone en true al CREAR una
  // sesión nueva (no antes: antes no hay nada que reanudar) y en false al
  // completar el flujo o al descartarlo. UN ÚNICO punto lo escribe: las
  // mutaciones del store (marcarExperienciaIncompleta / descartarExperiencia /
  // iniciarNuevaExperiencia), nunca la UI.
  experienciaIncompleta: boolean;
  // Cuándo se creó la sesión en curso (epoch ms). Solo informativo/para mostrar
  // "empezada hace X"; no participa en ninguna decisión de seguridad.
  iniciadaEn: number | null;
  // Cuándo EXPIRA el estado persistido (epoch ms). Techo: RETENCION_MS, igual a la
  // vida de la cookie. Pasado ese momento el estado se purga y no se ofrece
  // reanudar. El localStorage guarda respuestas del instrumento —incluidas las
  // verbales de texto abierto—: no se retiene más sin revisión legal.
  expiraEn: number | null;
  // MARCADOR EXPLÍCITO de bloque cognitivo completado. Lo escribe el propio bloque
  // cuando cierra los 4 juegos. Sustituye a la heurística anterior
  // (`juegosConRespuestas.size >= 4`), que NO era evidencia de bloque completo:
  // itemsPliegues tiene solo 2 ítems, así que un juego con una respuesta ya
  // contaba, y 4 respuestas sueltas de 4 juegos también pasaban como "completo".
  // Con el marcador, la reconstrucción se apoya en el contrato real del bloque.
  cognitivoCompleto: boolean;
  // METADATO NO AUTORITATIVO: indica que la sesión en curso se creó en modo
  // prueba. NO autoriza nada por sí mismo — solo OBLIGA a revalidar contra la
  // cookie de /debug antes de reconstruir o escribir. Motivo: la autorización no
  // se persiste (a propósito), así que tras recargar no se sabe si la sesión era
  // de prueba; sin esta marca, una sesión de prueba recargada se reconstruiría
  // como sesión REAL (es_prueba=false) y contaminaría las métricas.
  sesionEraPrueba: boolean;

  // CREA una experiencia nueva: sessionId nuevo + estado de respuestas limpio.
  // Es el ÚNICO punto de creación de sesión por experiencia. Devuelve el id.
  // NO sincroniza acá: la sesión padre se encola explícitamente al arrancar
  // (ver `encolarSesionPadre`), antes de cualquier dato hijo.
  iniciarNuevaExperiencia: () => string;
  // RETOMA la experiencia local persistida. SOLO si el sessionId persistido es
  // EXACTAMENTE el de la cookie y no expiró. Si no coinciden, PURGA el estado
  // inválido y devuelve false: jamás cambia el id conservando respuestas ajenas.
  retomarExperiencia: () => boolean;
  // ¿Se puede ofrecer "Continuar"? Aplica las mismas reglas que retomar.
  hayExperienciaReanudable: () => boolean;
  // Motivo por el que NO se puede reanudar (para diagnóstico/UI); null si sí se puede.
  motivoNoReanudable: () => string | null;
  // Marca el bloque cognitivo como COMPLETADO (marcador explícito del contrato del
  // bloque, no una heurística sobre el número de respuestas).
  marcarCognitivoCompleto: () => void;
  // Marca la experiencia como EMPEZADA (incompleta) y fija su expiración local.
  marcarExperienciaIncompleta: () => void;
  // Purga el estado persistido si es inválido (sin cookie, cookie distinta, expirado).
  // Devuelve true si purgó. Se llama al montar la página, antes de decidir nada.
  purgarEstadoInvalido: () => boolean;
  // Encola la fila de `sesiones` ANTES que cualquier dato hijo (la FK lo exige y
  // la RLS lo necesita). Idempotente: upsert por id.
  encolarSesionPadre: () => Promise<boolean>;
  // DESCARTA todo (cerrar / empezar de cero / fin del flujo): limpia la cookie y
  // el estado persistido para que el alumno siguiente del mismo PC no herede nada.
  descartarExperiencia: () => void;
  // Flujo de modoprueba: activa/desactiva el flag en el store. Al activarlo NUNCA se
  // hace escritura alguna aquí — solo lo establece (verificarPrueba se encarga de
  // confirmar la cookie server-side antes de habilitar la UI; sincronizarBloque vuelve
  // a revalidar antes de cada escritura real).
  setModoPrueba: (activo: boolean) => void;
  // Solo debe llamarse tras revalidar la cookie (ver page.tsx) — nunca activa modoPrueba
  // por sí solo, y sincronizarBloque la apaga junto con modoPrueba si la cookie se pierde.
  setModoPruebaReal: (activo: boolean) => void;
  irAPaso: (paso: PasoExperiencia) => void;
  pausar: () => void;
  reanudar: () => void;
  activarAudio: (conAudio: boolean) => void;
  agregarRespuestaGustos: (respuesta: RespuestaGustos) => void;
  agregarRespuestaCognitivo: (respuesta: RespuestaCognitivo) => void;
  agregarRespuestaVerbal: (respuesta: RespuestaVerbal) => void;
  agregarRespuestaDivergente: (respuesta: RespuestaDivergente) => void;
  agregarRespuestaActividad: (respuesta: RespuestaActividad) => void;
  agregarRespuestaAsignatura: (respuesta: RespuestaAsignatura) => void;
  setAspiracion: (aspiracion: Aspiracion) => void;
  // Encola las tareas nuevas y reintenta la cola pendiente contra Supabase.
  //
  // GARANTÍA DE ORDEN (pilot readiness): ninguna tabla hija se escribe antes de
  // que la fila de `sesiones` esté confirmada o al menos ENCOLADA. Si llegan
  // tareas hijas y la sesión padre no está en la cola, se antepone sola.
  //
  // SOBRE LA PERSISTENCIA DE LA COLA: `colaSync` NO se persiste (una cola
  // serializada podría reenviar payloads de una sesión ya descartada). Lo que
  // sobrevive a una recarga no es la cola, sino el ESTADO del store (respuestas +
  // aspiracion): `reconstruirTareasPendientes()` las vuelve a derivar del estado
  // rehidratado. Así, una aspiración o un bloque completado NO se pierden al
  // recargar, y el comentario anterior —que afirmaba que la cola se reintentaba
  // al recargar— queda corregido.
  sincronizarBloque: (tareas: TareaSync[]) => Promise<void>;
  // Deriva del estado REHIDRATADO las tareas que deben persistirse y las encola
  // (sesión padre primero). Es lo que hace sobrevivir a una recarga un bloque ya
  // completado o la aspiración, sin persistir la cola.
  reconstruirTareasPendientes: () => Promise<void>;
  // Construye la tarea de la sesión padre (con es_prueba correcto).
  tareaSesionPadre: () => TareaSync;
  // Antepone la sesión padre a tareas hijas que lleguen sin ella.
  asegurarPadreEnCola: (tareas: TareaSync[]) => TareaSync[];
  // Modo prueba (Entrega 2): rellena con datos al azar el bloque no-verbal
  // recibido y avanza al siguiente paso, replicando EXACTAMENTE el sync que
  // hace cada bloque real al completarse (mismo payload, mismo sincronizarBloque).
  // No hace nada si paso no es un bloque no-verbal soportado (verbal/informe/etc.
  // se manejan aparte). Solo tiene efecto si modoPrueba está activo.
  rellenarBloqueAlAzar: (paso: PasoExperiencia) => Promise<void>;
}

function valorAlAzar(): 0 | 1 | 2 {
  return Math.floor(Math.random() * 3) as 0 | 1 | 2;
}

// Reemplazo idempotente por clave: si ya existe una respuesta con la misma clave,
// se sustituye EN SU POSICIÓN (conservando el orden de presentación); si no,
// se agrega al final. Es la base de "responder dos veces no duplica".
function reemplazarPorClave<T>(previas: T[], nueva: T, clave: (item: T) => string): T[] {
  const k = clave(nueva);
  const indice = previas.findIndex((item) => clave(item) === k);
  if (indice === -1) return [...previas, nueva];
  const copia = [...previas];
  copia[indice] = nueva;
  return copia;
}

// Revalidación server-side del modo prueba (aislamiento 00017). Llama a la ruta
// protegida /api/debug/verificar-prueba que confirma la cookie httpOnly de /debug
// (hash de DEBUG_KEY). Devuelve true SOLO si la sesión de debug sigue siendo válida.
// Se invoca antes de cada escritura cuando modoPrueba está activo; si la cookie
// expiró o no existe, devuelve false y el store desactiva el modo sin escribir nada.
// Robustez: ante cualquier error de red falla "cerrado" (false) — el modo prueba
// jamás se auto-habilita ni escribe por no poder confirmar la cookie.
export async function verificarPruebaValida(): Promise<boolean> {
  if (typeof fetch === "undefined") return false;
  try {
    const res = await fetch("/api/debug/verificar-prueba", { method: "GET", cache: "no-store" });
    if (!res.ok) return false;
    const data = (await res.json()) as { ok?: boolean };
    return data?.ok === true;
  } catch {
    return false;
  }
}

// El tipo incluye la API de `persist` (`rehydrate`), necesaria porque la hidratación
// se hace MANUALMENTE (ver `skipHydration` más abajo) para poder migrar entre
// almacenes ANTES de hidratar.
export type StoreExperiencia = UseBoundStore<StoreApi<EstadoExperiencia>> & {
  persist: { rehydrate: () => Promise<void> | void; hasHydrated: () => boolean };
};

export const useExperienciaStore = create<EstadoExperiencia>()(
  persist(
    (set, get) => ({
      sessionId: null,
      cognitivoCompleto: false,
      paso: "intro",
      pausado: false,
      modoPrueba: false,
      modoPruebaReal: false,
      pruebaRealCortada: false,
      audioActivado: false,
      respuestasGustos: [],
      respuestasCognitivo: [],
      respuestasVerbal: [],
      respuestasDivergente: [],
      respuestasActividades: [],
      respuestasAsignaturas: [],
      aspiracion: null,
      colaSync: [],
      experienciaIncompleta: false,
      iniciadaEn: null,
      expiraEn: null,
      sesionEraPrueba: false,

      // EXPERIENCIA NUEVA (pilot readiness): sessionId nuevo SIEMPRE y estado de
      // respuestas limpio. ÚNICO punto de creación de sesión por experiencia.
      //
      // REGRESIÓN CORREGIDA (modo prueba se degradaba a real): esta función NO
      // toca modoPrueba/modoPruebaReal. Antes los reseteaba a false, así que con
      // ?prueba=1 el tester pulsaba "Empezar" y la sesión se guardaba como REAL
      // (es_prueba=false) mientras la barra seguía diciendo "MODO PRUEBA" — peor:
      // tampoco aparecía, porque modoPrueba ya era false. La autorización de modo
      // prueba la administra la UI, que la revalida server-side; el store no
      // puede degradarla por su cuenta. Si SÍ se apaga pruebaRealCortada, porque
      // es un fail-stop de la experiencia anterior y no debe arrastrarse.
      iniciarNuevaExperiencia: () => {
        const sessionId = crearSessionIdNuevo();
        set({
          sessionId,
          iniciadaEn: Date.now(),
          expiraEn: null,
          // Nace como NO reanudable: todavía no empezó (está en la intro). Se
          // marca reanudable en marcarExperienciaIncompleta(), cuando el alumno
          // realmente entra a la experiencia.
          experienciaIncompleta: false,
          paso: "intro",
          pausado: false,
          audioActivado: false,
          pruebaRealCortada: false,
          cognitivoCompleto: false,
          respuestasGustos: [],
          respuestasCognitivo: [],
          respuestasVerbal: [],
          respuestasDivergente: [],
          respuestasActividades: [],
          respuestasAsignaturas: [],
          aspiracion: null,
          colaSync: [],
        });
        return sessionId;
      },

      // RETOMAR: restaura la experiencia persistida. SOLO si el sessionId
      // persistido coincide EXACTAMENTE con el de la cookie y no expiró.
      //
      // BUG CERRADO (mezcla cookie/estado): antes bastaba con que existiera
      // CUALQUIER cookie. Con cookie B y estado persistido de A, esto hacía
      // `sessionId = B` conservando las respuestas de A — una sesión con datos de
      // dos alumnos. Ahora, si no coinciden, se PURGA el estado entero: no se
      // cambia el id dejando respuestas ajenas.
      retomarExperiencia: () => {
        const estado = get();
        const evaluacion = evaluarReanudable({
          sessionId: estado.sessionId,
          experienciaIncompleta: estado.experienciaIncompleta,
          expiraEn: estado.expiraEn,
          sesionEraPrueba: estado.sesionEraPrueba,
        });
        if (!evaluacion.reanudable) {
          // Estado inválido (cookie ausente/distinta, expirado o ya terminado):
          // se descarta por completo en vez de reutilizarlo a medias.
          if (evaluacion.motivo === "cookie_distinta" || evaluacion.motivo === "expirado" || evaluacion.motivo === "sin_cookie") {
            get().descartarExperiencia();
          }
          return false;
        }
        // Ya está rehidratado con el sessionId correcto: no se toca el id ni las
        // respuestas. Solo se refresca la marca de actividad.
        set({ iniciadaEn: estado.iniciadaEn ?? Date.now() });
        return true;
      },

      hayExperienciaReanudable: () => {
        const estado = get();
        return evaluarReanudable({
          sessionId: estado.sessionId,
          experienciaIncompleta: estado.experienciaIncompleta,
          expiraEn: estado.expiraEn,
        }).reanudable;
      },

      motivoNoReanudable: () => {
        const estado = get();
        const r = evaluarReanudable({
          sessionId: estado.sessionId,
          experienciaIncompleta: estado.experienciaIncompleta,
          expiraEn: estado.expiraEn,
        });
        return r.reanudable ? null : r.motivo;
      },

      // Purga defensiva al montar: si el estado persistido no es reanudable por
      // una razón de integridad (no por "todavía no empezó"), se elimina para que
      // no quede basura de otro alumno en el navegador.
      purgarEstadoInvalido: () => {
        const estado = get();
        const r = evaluarReanudable({
          sessionId: estado.sessionId,
          experienciaIncompleta: estado.experienciaIncompleta,
          expiraEn: estado.expiraEn,
        });
        if (r.reanudable) return false;
        if (r.motivo === "cookie_distinta" || r.motivo === "expirado" || r.motivo === "sin_cookie") {
          get().descartarExperiencia();
          return true;
        }
        return false;
      },

      // Lo llama BloqueCognitivo al cerrar los 4 juegos, DESPUÉS de sincronizar.
      marcarCognitivoCompleto: () => set({ cognitivoCompleto: true }),

      marcarExperienciaIncompleta: () =>
        // La expiración local se fija acá (y no al crear) porque es el momento en
        // que empieza a haber datos del alumno que retener. Techo: RETENCION_MS.
        // `sesionEraPrueba` es solo un METADATO para saber que hay que revalidar:
        // nunca autoriza por sí mismo.
        set({
          experienciaIncompleta: true,
          expiraEn: Date.now() + RETENCION_MS,
          sesionEraPrueba: get().modoPrueba,
        }),

      // Descarta TODO: cookie + estado persistido. Deja el navegador como recién
      // instalado para que el alumno siguiente empiece de cero. Sí apaga el modo
      // prueba: es una salida explícita del flujo completo, no una rotación
      // interna, y la siguiente experiencia debe reautorizarse desde ?prueba=1.
      descartarExperiencia: () => {
        descartarSesionEnCurso();
        set({
          sessionId: null,
          experienciaIncompleta: false,
          iniciadaEn: null,
          expiraEn: null,
          sesionEraPrueba: false,
          paso: "intro",
          pausado: false,
          audioActivado: false,
          modoPrueba: false,
          modoPruebaReal: false,
          pruebaRealCortada: false,
          cognitivoCompleto: false,
          respuestasGustos: [],
          respuestasCognitivo: [],
          respuestasVerbal: [],
          respuestasDivergente: [],
          respuestasActividades: [],
          respuestasAsignaturas: [],
          aspiracion: null,
          colaSync: [],
        });
      },
      setModoPrueba: (activo) => set({ modoPrueba: activo }),
      setModoPruebaReal: (activo) => set({ modoPruebaReal: activo }),
      irAPaso: (paso) => set({ paso, pausado: false }),
      pausar: () => set({ pausado: true }),
      reanudar: () => set({ pausado: false }),
      activarAudio: (conAudio) => set({ audioActivado: conAudio }),

      // ── Mutaciones de respuestas: IDEMPOTENTES POR CLAVE ────────────────
      // Repetir la misma respuesta la REEMPLAZA, nunca la anexa. Antes todas
      // hacían `[...previas, nueva]`, así que volver a responder un ítem (tras
      // recargar y retroceder, o al re-renderizar un efecto) duplicaba la fila en
      // memoria y, con ella, el payload del bloque completo. La clave es la misma
      // que exige el índice único de la migración 00020:
      //   gustos→contextoId · actividades→actividadId · asignaturas→asignaturaId
      //   cognitivo→juego+itemId · verbal→tarea · divergente→objeto
      agregarRespuestaGustos: (respuesta) =>
        set((estado) => ({
          respuestasGustos: reemplazarPorClave(estado.respuestasGustos, respuesta, (r) => r.contextoId),
        })),
      agregarRespuestaCognitivo: (respuesta) =>
        set((estado) => ({
          respuestasCognitivo: reemplazarPorClave(estado.respuestasCognitivo, respuesta, (r) => `${r.juego}|${r.itemId}`),
        })),
      // Verbal: una respuesta por tarea. Se CONSERVA el `id` de la fila previa si la
      // nueva no trae uno (si no, el sync perdería la referencia a la fila
      // 'pendiente' y volvería al camino de upsert por clave).
      agregarRespuestaVerbal: (respuesta) =>
        set((estado) => {
          const clave = (r: RespuestaVerbal) => r.tarea;
          const previa = estado.respuestasVerbal.find((r) => clave(r) === clave(respuesta));
          const fusionada: RespuestaVerbal =
            previa && respuesta.id == null ? { ...respuesta, id: previa.id } : respuesta;
          return { respuestasVerbal: reemplazarPorClave(estado.respuestasVerbal, fusionada, clave) };
        }),
      agregarRespuestaDivergente: (respuesta) =>
        set((estado) => ({
          respuestasDivergente: reemplazarPorClave(estado.respuestasDivergente, respuesta, (r) => r.objeto),
        })),
      agregarRespuestaActividad: (respuesta) =>
        set((estado) => ({
          respuestasActividades: reemplazarPorClave(estado.respuestasActividades, respuesta, (r) => r.actividadId),
        })),
      agregarRespuestaAsignatura: (respuesta) =>
        set((estado) => ({
          respuestasAsignaturas: reemplazarPorClave(estado.respuestasAsignaturas, respuesta, (r) => r.asignaturaId),
        })),
      setAspiracion: (aspiracion) => set({ aspiracion }),

      // Modo prueba (aislamiento 00017, exigencia no negociable de Camilo): TODA
      // escritura a la base ("sesion", "gustos", "cognitivo", "verbal", …) pasa por
      // sincronizarBloque — es el único call-site de procesarColaSync (verificado por
      // grep). Si el modo prueba está activo, se revalida la cookie server-side ANTES
      // de escribir nada. Si la revalidación falla (cookie expirada, otra pestaña,
      // navegación externa, session perdida), el modo se desactiva y NO se escribe
      // nada: ni la sesión ni ningún dato hijo. Preferimos que el modo se caiga solo
      // antes que generar una sesión (o hijos) sin la marca es_prueba.
      //
      // El modo NO se autopermite: solo activa escritura si supera la revalidación; en
      // flujo normal (modoPrueba=false) no hay llamada extra de red — cero overhead.
      sincronizarBloque: async (tareas) => {
        if (get().modoPrueba && !(await verificarPruebaValida())) {
          // Aislamiento roto (cookie no revalidada): desactivar modo y NO encolar ni
          // escribir. Nada de este bloque se persiste bajo una sesión sin marcar.
          // Fail-stop VISIBLE para AMBOS modos de prueba (simple y real): si antes se
          // detenía solo el real, un bloque posterior podía escribirse como sesión
          // real. Ahora cualquier pérdida de autorización corta la experiencia.
          set({
            modoPrueba: false,
            modoPruebaReal: false,
            pruebaRealCortada: true,
          });
          return;
        }

        // ORDEN PADRE→HIJO: ninguna tabla hija puede escribirse antes de que la
        // fila de `sesiones` esté encolada o confirmada (la FK lo exige). Si
        // llegan tareas hijas y la sesión padre no está en la cola, se antepone.
        const conPadre = get().asegurarPadreEnCola(tareas);

        set((estado) => ({ colaSync: [...estado.colaSync, ...conPadre] }));
        const fallaron = await procesarColaSync(get().colaSync);
        set({ colaSync: fallaron });
      },

      // Antepone la tarea de sesión si llegan tareas hijas sin ella.
      asegurarPadreEnCola: (tareas) => {
        const estado = get();
        if (!estado.sessionId) return tareas;
        const yaTienePadre = tareas.some((t) => t.tipo === "sesion");
        const padreEnCola = estado.colaSync.some((t) => t.tipo === "sesion");
        if (yaTienePadre || padreEnCola) return tareas;
        // Si no hay ninguna tarea hija, tampoco hace falta forzar el padre.
        if (tareas.length === 0) return tareas;
        return [estado.tareaSesionPadre(), ...tareas];
      },

      // Devuelve true SOLO si la fila de sesión quedó confirmada en la base o
      // PENDIENTE DE FORMA DURABLE (encolada para el próximo intento de esta misma
      // sesión de navegación). Antes devolvía true con solo terminar la función,
      // lo que reportaba éxito aunque la escritura hubiera fallado.
      encolarSesionPadre: async () => {
        const estado = get();
        if (!estado.sessionId) return false;
        await get().sincronizarBloque([estado.tareaSesionPadre()]);
        // Éxito real: la sesión no quedó pendiente en la cola.
        const siguePendiente = get().colaSync.some((t) => t.tipo === "sesion");
        return !siguePendiente;
      },

      // Reconstruye desde el ESTADO REHIDRATADO las tareas a persistir. Es lo que
      // hace que una aspiración o un bloque completado sobrevivan a una recarga
      // aunque la cola no se persista. Solo se reconstruye lo que tiene datos.
      reconstruirTareasPendientes: async () => {
        const e = get();
        if (!e.sessionId) return;
        const tareas: TareaSync[] = [e.tareaSesionPadre()];

        if (e.aspiracion) {
          tareas.push({
            id: `aspiracion-${e.sessionId}`,
            tipo: "aspiracion",
            payload: { session_id: e.sessionId, opcion: e.aspiracion.opcion, detalle: e.aspiracion.detalle },
          });
        }
        // GUSTOS: solo cuando el bloque está COMPLETO. La política declarada es
        // "guardar al completar el bloque", así que reconstruir un bloque parcial
        // violaría ese contrato: enviaría un estado a medias que el propio bloque
        // reenviará entero al cerrarse (y mientras tanto la fila quedaría
        // incompleta en la base, como si el alumno hubiera terminado).
        // Un bloque parcial permanece LOCAL y se sincroniza al completarse.
        if (bloqueCompleto(contextos, e.respuestasGustos.map((r) => r.contextoId))) {
          tareas.push({
            id: `gustos-${e.sessionId}`,
            tipo: "gustos",
            payload: e.respuestasGustos.map((r) => ({
              session_id: e.sessionId,
              contexto_id: r.contextoId,
              valor: r.valor,
              latencia_ms: null,
              ayuda_abierta: r.ayudaAbierta ?? false,
              audio_activado: r.audioActivado ?? false,
            })),
          });
        }
        // Los bloques que se sincronizan AL CERRARSE solo se reconstruyen si
        // están completos: reconstruir un bloque a medias escribiría un estado
        // parcial que el propio bloque volverá a enviar completo al terminar.
        if (bloqueCompleto(actividades, e.respuestasActividades.map((r) => r.actividadId))) {
          tareas.push({
            id: `actividades-${e.sessionId}`,
            tipo: "actividades",
            payload: e.respuestasActividades.map((r) => ({ session_id: e.sessionId, actividad_id: r.actividadId, valor: r.valor })),
          });
        }
        if (bloqueCompleto(asignaturas, e.respuestasAsignaturas.map((r) => r.asignaturaId))) {
          tareas.push({
            id: `asignaturas-${e.sessionId}`,
            tipo: "asignaturas",
            payload: e.respuestasAsignaturas.map((r) => ({ session_id: e.sessionId, asignatura_id: r.asignaturaId, valor: r.valor })),
          });
        }
        if (bloqueCompleto(OBJETOS_DIVERGENTE, e.respuestasDivergente.map((r) => r.objeto))) {
          tareas.push({
            id: `divergente-${e.sessionId}`,
            tipo: "divergente",
            payload: e.respuestasDivergente.map((r) => ({
              session_id: e.sessionId,
              objeto: r.objeto,
              respuestas_texto: r.respuestasTexto,
              cantidad: r.cantidad,
            })),
          });
        }

        // ── COGNITIVO ────────────────────────────────────────────────────
        // Se reconstruye SOLO si el bloque se cerró de verdad, según el marcador
        // explícito `cognitivoCompleto` que escribe BloqueCognitivo al terminar los
        // 4 juegos. Se descartó la heurística anterior (contar respuestas/juegos)
        // porque no era evidencia del contrato real del bloque: itemsPliegues tiene
        // 2 ítems, así que un juego apenas empezado ya contaba, y 4 respuestas
        // sueltas de 4 juegos también pasaban como "completo" y se persistían como
        // si el bloque estuviera terminado.
        // Un bloque a medias NO se reconstruye: lo reenviará el propio bloque al
        // cerrarse, evitando escribir un estado parcial que luego habría que
        // corregir. Idempotente por (session_id, juego, item_id) — migración 00020.
        if (e.cognitivoCompleto && e.respuestasCognitivo.length > 0) {
          tareas.push({
            id: `cognitivo-${e.sessionId}`,
            tipo: "cognitivo",
            payload: e.respuestasCognitivo.map((r) => ({
              session_id: e.sessionId,
              juego: r.juego,
              item_id: r.itemId,
              correcto: r.correcto,
              nivel: r.nivel,
              duracion_ms: r.duracionMs,
              repetido_timeout: r.repetidoPorTimeout,
            })),
          });
        }

        // ── VERBAL ───────────────────────────────────────────────────────
        // Una respuesta verbal evaluada NO puede perderse: es el dato más caro del
        // instrumento (costó una llamada al modelo). Se reconstruye CADA respuesta
        // presente, una tarea por tarea.
        //   * Si trae `id`, el sync va por la RPC actualizar_evaluacion_verbal, que
        //     NO pisa una fila 'evaluado' (terminal) → reconstruir es seguro.
        //   * Si no trae `id`, el sync hace upsert por (session_id, tarea), que
        //     tampoco pisa un terminal (ver syncRespuestaVerbal) → sin duplicados.
        // NO se reconstruyen los BORRADORES (texto a medio escribir): no se
        // persisten y no forman parte del instrumento entregado.
        for (const r of e.respuestasVerbal) {
          tareas.push({
            id: `verbal-${e.sessionId}-${r.tarea}`,
            tipo: "verbal",
            payload: {
              ...(r.id ? { id: r.id } : {}),
              session_id: e.sessionId,
              tarea: r.tarea,
              texto: r.texto,
              evaluacion_json: r.evaluacion,
              estado: r.estado,
              pegado: r.pegado ?? false,
              caracteres_pegados: r.caracteresPegados ?? 0,
              revision_requerida: r.revisionRequerida ?? false,
              acuerdo_no_disponible: r.acuerdoNoDisponible ?? false,
              intento: r.intento ?? 1,
            },
          });
        }

        // ── TUTORIALES ───────────────────────────────────────────────────
        // NO se reconstruyen, y es deliberado: el estado del tutorial
        // (`tutorial_estado`) es telemetría de calidad, no una respuesta del
        // instrumento. El componente de cada juego vuelve a emitirla cuando el
        // alumno juega el tutorial otra vez, y su sync es upsert por
        // (session_id, juego), así que repetirlo es inofensivo. Persistirla en el
        // store solo para reconstruirla añadiría estado que no se usa en ningún
        // cálculo del informe.

        // ── RESULTADO ────────────────────────────────────────────────────
        // NO se reconstruye desde acá, y es deliberado: el perfil se calcula en
        // `Informe.tsx` a partir de las respuestas y se emite al montar ese paso.
        // Si el paso es "informe", el componente lo vuelve a generar solo (su
        // efecto tiene guarda de una vez por sesión). Reconstruirlo aquí exigiría
        // duplicar el cálculo de puntaje en el store — una segunda fuente de
        // verdad para el número más importante del producto.
        // El guard de merge de `syncResultados` evita que un perfil incompleto
        // pise uno que el servidor ya completó.

        await get().sincronizarBloque(tareas);
      },

      // Construye la tarea de la sesión padre. Único lugar donde se decide
      // es_prueba (vía construirSesionRow: true solo en modo prueba, omitido si no).
      tareaSesionPadre: () => {
        const e = get();
        return {
          id: `sesion-${e.sessionId}`,
          tipo: "sesion" as const,
          payload: construirSesionRow(e.sessionId as string, e.modoPrueba, {
            dispositivo: typeof navigator !== "undefined" ? navigator.userAgent : null,
          }),
        };
      },

      rellenarBloqueAlAzar: async (paso) => {
        if (!get().modoPrueba) return;
        const sessionId = get().sessionId;

        if (paso === "aspiracion") {
          const opciones: OpcionAspiracion[] = ["universidad", "tecnico", "trabajar", "no_se"];
          const opcion = opciones[Math.floor(Math.random() * opciones.length)];
          set({ aspiracion: { opcion, detalle: null } });
          if (sessionId) {
            await get().sincronizarBloque([
              {
                id: `aspiracion-${sessionId}`,
                tipo: "aspiracion",
                payload: { session_id: sessionId, opcion, detalle: null },
              },
            ]);
          }
          set({ paso: "gustos" });
          return;
        }

        if (paso === "gustos") {
          // La sincronización (sesión + gustos) la dispara el efecto de
          // page.tsx apenas respuestasGustos alcanza contextos.length: solo
          // hace falta completar las respuestas que falten y avanzar el paso.
          const faltantes = contextos.slice(get().respuestasGustos.length).map(
            (c): RespuestaGustos => ({ contextoId: c.id, valor: valorAlAzar(), ayudaAbierta: false, audioActivado: false })
          );
          set((estado) => ({ respuestasGustos: [...estado.respuestasGustos, ...faltantes] }));
          set({ paso: "actividades" });
          return;
        }

        if (paso === "actividades") {
          const respuestas: RespuestaActividad[] = actividades.map((a) => ({ actividadId: a.id, valor: valorAlAzar() }));
          set({ respuestasActividades: respuestas });
          if (sessionId) {
            await get().sincronizarBloque([
              {
                id: `actividades-${sessionId}`,
                tipo: "actividades",
                payload: respuestas.map((r) => ({ session_id: sessionId, actividad_id: r.actividadId, valor: r.valor })),
              },
            ]);
          }
          set({ paso: "asignaturas" });
          return;
        }

        if (paso === "asignaturas") {
          const respuestas: RespuestaAsignatura[] = asignaturas.map((a) => ({ asignaturaId: a.id, valor: valorAlAzar() }));
          set({ respuestasAsignaturas: respuestas });
          if (sessionId) {
            await get().sincronizarBloque([
              {
                id: `asignaturas-${sessionId}`,
                tipo: "asignaturas",
                payload: respuestas.map((r) => ({ session_id: sessionId, asignatura_id: r.asignaturaId, valor: r.valor })),
              },
            ]);
          }
          set({ paso: "resultadoParcial" });
          return;
        }

        if (paso === "cognitivo") {
          const respuestas: RespuestaCognitivo[] = [
            ...itemsMatrices.map((i): RespuestaCognitivo => ({ juego: "matrices", itemId: i.id, correcto: Math.random() > 0.3, nivel: 1, duracionMs: 4000, repetidoPorTimeout: false })),
            ...itemsSeries.map((i): RespuestaCognitivo => ({ juego: "series", itemId: i.id, correcto: Math.random() > 0.3, nivel: 1, duracionMs: 4000, repetidoPorTimeout: false })),
            ...itemsPliegues.map((i): RespuestaCognitivo => ({ juego: "pliegues", itemId: i.id, correcto: Math.random() > 0.3, nivel: 1, duracionMs: 4000, repetidoPorTimeout: false })),
            { juego: "secuencias", itemId: "seq-prueba", correcto: true, nivel: 5, duracionMs: 4000, repetidoPorTimeout: false },
          ];
          set({ respuestasCognitivo: respuestas });
          if (sessionId) {
            await get().sincronizarBloque([
              {
                id: `cognitivo-${sessionId}`,
                tipo: "cognitivo",
                payload: respuestas.map((r) => ({
                  session_id: sessionId,
                  juego: r.juego,
                  item_id: r.itemId,
                  correcto: r.correcto,
                  nivel: r.nivel,
                  duracion_ms: r.duracionMs,
                  repetido_timeout: r.repetidoPorTimeout,
                })),
              },
            ]);
          }
          set({ paso: "verbal" });
          return;
        }

        if (paso === "divergente") {
          const respuestas: RespuestaDivergente[] = OBJETOS_DIVERGENTE.map((o) => {
            const ideas = Array.from({ length: MIN_IDEAS_POR_OBJETO }, (_, i) => `idea de prueba ${i + 1}`);
            return { objeto: o.id, respuestasTexto: ideas, cantidad: ideas.length };
          });
          set({ respuestasDivergente: respuestas });
          if (sessionId) {
            await get().sincronizarBloque([
              {
                id: `divergente-${sessionId}`,
                tipo: "divergente",
                payload: respuestas.map((r) => ({
                  session_id: sessionId,
                  objeto: r.objeto,
                  respuestas_texto: r.respuestasTexto,
                  cantidad: r.cantidad,
                })),
              },
            ]);
          }
          set({ paso: "informe" });
          return;
        }
      },
    }),
    {
      // REANUDACIÓN REAL (pilot readiness). Se persiste el estado mínimo para
      // continuar exactamente donde el alumno quedó: sessionId, paso, respuestas
      // de todos los bloques, aspiración y la marca de "experiencia incompleta".
      //
      // CÓMO SE EVITA QUE UN ALUMNO HEREDE LA SESIÓN DE OTRO (PC compartido):
      // no basta con "no persistir". La decisión es EXPLÍCITA: al abrir
      // /experiencia con estado incompleto, la página pregunta "Continuar mi
      // experiencia / Empezar de nuevo" (app/experiencia/page.tsx). Empezar de
      // nuevo llama iniciarNuevaExperiencia(), que rota el sessionId y descarta
      // todo; completar (Informe → Volver) o abandonar llama
      // descartarExperiencia(), que borra cookie y persistencia. Es decir: el
      // alumno siguiente ve la pregunta y, si elige continuar, está eligiendo
      // conscientemente retomar la sesión anterior — exactamente lo que la
      // pantalla advierte.
      //
      // QUÉ NO SE PERSISTE (a propósito):
      //   * modoPrueba / modoPruebaReal: la autorización de prueba se revalida
      //     server-side contra la cookie de /debug. Persistirla permitiría que un
      //     flag viejo habilitara escrituras es_prueba=true sin revalidar. Por eso
      //     el store arranca con false y la UI la vuelve a pedir.
      //   * pruebaRealCortada: fail-stop de una experiencia anterior; no debe
      //     arrastrarse a la siguiente.
      //   * colaSync: es una cola en memoria de reintento; restaurarla tras
      //     recargar podría reenviar payloads de una sesión ya descartada.
      //   * audioActivado: preferencia efímera de la sesión de navegación.
      // Nada de esto contiene secretos ni credenciales.
      // ALMACENAMIENTO EXPLÍCITO: sessionStorage en el piloto escolar (se borra al
      // cerrar la pestaña: no deja respuestas del alumno en un PC compartido) y
      // localStorage solo si se configura (modalidad b2c, con política aprobada).
      // Ver lib/store/almacenamiento.ts.
      name: CLAVE_ESTADO,
      storage: storageDeExperiencia(),
      // HIDRATACIÓN MANUAL (`skipHydration`). Sin esto, zustand hidrata en el mismo
      // instante en que se crea el store — es decir, ANTES de que la página pueda
      // migrar el estado entre almacenes al cambiar de modalidad. La secuencia
      // correcta es: migrar → rehidratar → purgar incoherencias. Con la hidratación
      // automática, `migrarEntreAlmacenes` copiaba el JSON al almacén nuevo pero el
      // store en memoria YA se había hidratado del almacén vacío, así que el alumno
      // perdía la reanudación hasta recargar otra vez.
      // Ver `inicializarPersistencia()` en lib/store/almacenamiento.ts.
      skipHydration: true,
      version: 3,
      partialize: (estado) => ({
        // Lo mínimo para reanudar exactamente donde quedó el alumno.
        sessionId: estado.sessionId,
        paso: estado.paso,
        experienciaIncompleta: estado.experienciaIncompleta,
        iniciadaEn: estado.iniciadaEn,
        expiraEn: estado.expiraEn,
        // Metadato NO autoritativo: obliga a revalidar el modo prueba tras
        // recargar, pero no autoriza nada (el flag de modo NO se persiste).
        sesionEraPrueba: estado.sesionEraPrueba,
        // Marcador explícito del bloque cognitivo: sin persistirlo, tras recargar
        // se perdía y la reconstrucción no reenviaba un bloque ya completado.
        cognitivoCompleto: estado.cognitivoCompleto,
        respuestasGustos: estado.respuestasGustos,
        respuestasCognitivo: estado.respuestasCognitivo,
        respuestasVerbal: estado.respuestasVerbal,
        respuestasDivergente: estado.respuestasDivergente,
        respuestasActividades: estado.respuestasActividades,
        respuestasAsignaturas: estado.respuestasAsignaturas,
        aspiracion: estado.aspiracion,
      }),
      // Migración de formatos anteriores: v0/v1 guardaban TODO (incluido el modo
      // prueba) y v2 no guardaba nada. En ambos casos el estado viejo no sirve
      // para reanudar con la semántica nueva, así que se descarta: mejor pedirle
      // al alumno que empiece de nuevo que rehidratar un estado ambiguo.
      migrate: () => ({
        sessionId: null,
        paso: "intro" as PasoExperiencia,
        experienciaIncompleta: false,
        iniciadaEn: null,
        expiraEn: null,
        sesionEraPrueba: false,
        cognitivoCompleto: false,
      }) as unknown as EstadoExperiencia,
    }
  )
);
