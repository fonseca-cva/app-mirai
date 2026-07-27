// Bloque A — audio ambiente opcional por contexto (mejora post-piloto, decisión de Camilo:
// el Bloque A mide reacción de interés a ambientes, así que el sonido es parte legítima del
// estímulo, nunca ventaja de respuesta). Loops de ~20s, crudo y realista, coherente con la
// escena — nunca música ni sonido "publicitario". Licencia libre verificada por archivo, ver
// audio_licencias.md. Fase video: estos loops se reemplazan por el audio directo del clip.
//
// Degradación: si un escenaId no tiene entrada acá, no suena nada — la tarjeta funciona igual
// (regla de accesibilidad inversa: el audio nunca es la única fuente de nada).
export interface AudioContexto {
  archivo: string; // ruta pública bajo /public/audio/
  duracionS: number;
}

const AUDIO_CONTEXTOS: Record<string, AudioContexto> = {
  "obra-construccion": { archivo: "/audio/obra-construccion.mp3", duracionS: 20 },
  "packing-agricola": { archivo: "/audio/packing-agricola.mp3", duracionS: 20 },
  "taller-mecanico": { archivo: "/audio/taller-mecanico.mp3", duracionS: 20 },
  "laboratorio-clinico": { archivo: "/audio/laboratorio-clinico.mp3", duracionS: 20 },
  "residencia-adultos-mayores": { archivo: "/audio/residencia-adultos-mayores.mp3", duracionS: 20 },
  "guardaparque-sendero": { archivo: "/audio/guardaparque-sendero.mp3", duracionS: 20 },
  "estudio-branding": { archivo: "/audio/estudio-branding.mp3", duracionS: 20 },
  "rodaje-audiovisual": { archivo: "/audio/rodaje-audiovisual.mp3", duracionS: 20 },
  "estudio-arquitectura": { archivo: "/audio/estudio-arquitectura.mp3", duracionS: 20 },
  "sala-clases": { archivo: "/audio/sala-clases.mp3", duracionS: 20 },
  "oficina-municipal": { archivo: "/audio/oficina-municipal.mp3", duracionS: 20 },
  "oficina-rrhh": { archivo: "/audio/oficina-rrhh.mp3", duracionS: 20 },
  "consultorio-medico": { archivo: "/audio/consultorio-medico.mp3", duracionS: 20 },
  "control-calidad-alimentos": { archivo: "/audio/control-calidad-alimentos.mp3", duracionS: 20 },
  "clinica-kinesiologia": { archivo: "/audio/clinica-kinesiologia.mp3", duracionS: 20 },
  "analista-datos-retail": { archivo: "/audio/analista-datos-retail.mp3", duracionS: 20 },
  "startup-oficina": { archivo: "/audio/startup-oficina.mp3", duracionS: 20 },
  "administracion-pyme": { archivo: "/audio/administracion-pyme.mp3", duracionS: 20 },
  "oficina-auditoria": { archivo: "/audio/oficina-auditoria.mp3", duracionS: 20 },
  "electricista-industrial": { archivo: "/audio/electricista-industrial.mp3", duracionS: 20 },
  "bodega-logistica": { archivo: "/audio/bodega-logistica.mp3", duracionS: 20 },
  "ingeniero-forestal": { archivo: "/audio/ingeniero-forestal.mp3", duracionS: 20 },
  "investigacion-postgrado": { archivo: "/audio/investigacion-postgrado.mp3", duracionS: 20 },
  "local-gastronomico": { archivo: "/audio/local-gastronomico.mp3", duracionS: 20 },
};

export function obtenerAudioContexto(escenaId: string | undefined): AudioContexto | undefined {
  if (!escenaId) return undefined;
  return AUDIO_CONTEXTOS[escenaId];
}
