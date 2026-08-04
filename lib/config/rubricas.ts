// Rúbricas de evaluación del Bloque Verbal — sección 4 de la spec.
// La IA evalúa estructura y comprensión, JAMÁS la opinión del estudiante.
//
// VALIDEZ (plan de Camilo, entrega 1, punto 3): rúbricas ancladas con
// descriptores explícitos por nivel (1 a 5) + ejemplo corto de qué cuenta como
// cada nivel. Regla dura: texto bien escrito pero genérico NO pasa de 2; los
// niveles 4 y 5 exigen evidencia concreta del estímulo en el texto del
// estudiante. El filtro de pertinencia (punto 2) vive en promptPertinencia y
// se ejecuta ANTES de estas rúbricas en app/api/evaluar/route.ts.

import { z } from "zod";

// ── Esquema de evaluación validado con Zod ─────────────────────────
export const EvaluacionSchema = z.object({
  nivel: z.enum(["literal", "inferencial", "critico"]),
  puntaje: z.number().int().min(1).max(5),
  fortaleza: z.string().min(1).max(300),
  area_mejora: z.string().min(1).max(300),
});

export interface Evaluacion {
  nivel: "literal" | "inferencial" | "critico";
  puntaje: number;
  fortaleza: string;
  area_mejora: string;
}

// ── Filtro de pertinencia (punto 2 del plan) ───────────────────────
// Verificación binaria previa a la rúbrica: ¿la respuesta se refiere
// efectivamente al texto/dilema/consigna presentado? Si NO es pertinente no se
// puntúa: se guarda la respuesta con estado 'no_pertinente' y se ofrece un
// único reintento al estudiante (ver BloqueVerbal.tsx).
export const PertinenciaSchema = z.object({
  pertinente: z.boolean(),
  razon: z.string().min(1).max(300),
});

export function promptPertinencia(estimulo: string, respuesta: string): string {
  return `Eres un control de calidad de un test vocacional. Tu ÚNICA tarea es decidir si la respuesta de un/a estudiante se refiere efectivamente al texto o dilema presentado, o si es un texto arbitrario sin relación con la consigna (por ejemplo, pegado desde otro lugar).

Responde ESTRICTAMENTE en JSON con el esquema: {"pertinente": true|false, "razon": "..."}
- "pertinente": true SOLO si la respuesta alude a contenido específico del estímulo o responde directamente a la pregunta planteada.
- "pertinente": false si la respuesta es un texto genérico intercambiable (podría usarse ante cualquier consigna), trata de otro tema, o es una copia literal del propio estímulo.
- "razon": una frase corta que justifique la decisión.
- No agregues texto fuera del JSON.

ESTÍMULO PRESENTADO:
${estimulo}

RESPUESTA DEL ESTUDIANTE:
${respuesta}`;
}

// ── Rúbrica anclada común a las 3 tareas (punto 3 del plan) ────────
const REGLA_ANCLAJE = `RÚBRICA ANCLADA (niveles 1 al 5). Usa TODO el rango: la mayoría de las respuestas NO merece 4 o 5.
- Nivel 1: no responde a la consigna, repite el estímulo o es incomprensible. Ejemplo: "no sé, el texto habla de cosas".
- Nivel 2: texto bien escrito pero GENÉRICO: podría aplicarse a cualquier tema, sin referirse al estímulo. Ejemplo: "la comunicación es importante y hay que expresarse bien" (sin nombrar nada del texto, dilema ni consigna).
- Nivel 3: respuesta pertinente con alguna idea propia, pero desarrollo parcial o sin evidencia concreta del estímulo. Ejemplo: "la minería tiene impactos, pero también sirve para la economía" (idea propia sin citar contenido específico).
- Nivel 4: respuesta pertinente CON evidencia concreta del estímulo (refiere a contenido específico: datos, ejemplos, argumentos del texto o dilema) y desarrollo organizado. Ejemplo: "el texto dice que la minería ya usa agua de mar desalinizada, y eso muestra que la sostenibilidad es posible si hay inversión".
- Nivel 5: cumple el nivel 4 con varias evidencias concretas, estructura completa y conexiones propias (relaciona, matiza, contrapone). Ejemplo: "el texto muestra el conflicto entre identidad y progreso: mientras La Moneda se conserva por su valor histórico, otros inmuebles se demuelen por costo; esa tensión es la pregunta real".

REGLA DURA: un texto bien escrito pero genérico NO puede superar el nivel 2. Los niveles 4 y 5 EXIGEN evidencia concreta del estímulo en el texto del estudiante (referencia a contenido específico, no generalidades).`;

// ── Prompt para comprensión lectora ───────────────────────────────
export function promptComprension(texto: string): string {
  return `Evalúa la siguiente respuesta de un/a estudiante a un texto de comprensión lectora.

INSTRUCCIONES:
- Evalúa SOLO la estructura y profundidad de la comprensión, NUNCA la opinión personal del estudiante.
- La respuesta debe referirse al texto presentado; si no lo hace, es NO pertinente.
- Clasifica el nivel como: "literal" (repite información textual), "inferencial" (conecta ideas), o "critico" (evalúa, cuestiona, relaciona con contexto).
- Asigna un puntaje del 1 al 5 usando la rúbrica anclada.
- Identifica una fortaleza concreta y un área de mejora específica.
- Responde ESTRICTAMENTE en JSON con el esquema: {"nivel":"literal|inferencial|critico","puntaje":1-5,"fortaleza":"...","area_mejora":"..."}
- No agregues texto fuera del JSON.

${REGLA_ANCLAJE}

TEXTO LEÍDO POR EL ESTUDIANTE:
${texto}

RESPUESTA DEL ESTUDIANTE:
`;
}

// ── Prompt para argumentación ─────────────────────────────────────
export function promptArgumentacion(dilema: string): string {
  return `Evalúa la siguiente argumentación de un/a estudiante ante un dilema.

INSTRUCCIONES:
- Evalúa SOLO la estructura del argumento (afirmación → razón → evidencia), NUNCA la opinión del estudiante.
- No penalices ni premies la postura tomada; evalúa cómo la defiende.
- La argumentación debe referirse al dilema presentado; si no lo hace, es NO pertinente.
- Clasifica el nivel como: "literal" (solo afirma sin desarrollar), "inferencial" (da razones), o "critico" (estructura completa con evidencia y contrapunto).
- Asigna un puntaje del 1 al 5 usando la rúbrica anclada.
- Identifica una fortaleza concreta y un área de mejora específica.
- Responde ESTRICTAMENTE en JSON con el esquema: {"nivel":"literal|inferencial|critico","puntaje":1-5,"fortaleza":"...","area_mejora":"..."}
- No agregues texto fuera del JSON.

${REGLA_ANCLAJE}

DILEMA PRESENTADO:
${dilema}

ARGUMENTACIÓN DEL ESTUDIANTE:
`;
}

// ── Prompt para expresión escrita ─────────────────────────────────
export function promptExpresion(consigna: string): string {
  return `Evalúa la siguiente expresión escrita libre de un/a estudiante ante una consigna.

INSTRUCCIONES:
- Evalúa SOLO la estructura, riqueza y fluidez de la expresión, NUNCA la opinión del estudiante.
- No juzgues ortografía ni caligrafía.
- El texto debe responder a la consigna presentada; si no lo hace, es NO pertinente.
- Clasifica el nivel como: "literal" (enumera ideas sin desarrollo), "inferencial" (desarrolla ideas con detalles o ejemplos), o "critico" (estructura completa, voz propia, conexiones y matices).
- Asigna un puntaje del 1 al 5 usando la rúbrica anclada.
- Identifica una fortaleza concreta y un área de mejora específica.
- Responde ESTRICTAMENTE en JSON con el esquema: {"nivel":"literal|inferencial|critico","puntaje":1-5,"fortaleza":"...","area_mejora":"..."}
- No agregues texto fuera del JSON.

${REGLA_ANCLAJE}

CONSIGNA PRESENTADA:
${consigna}

RESPUESTA DEL ESTUDIANTE:
`;
}

// ── Banco de textos para comprensión ──────────────────────────────
// Textos neutros, tema chileno, ~120-150 palabras. Rotan por session_id.
// // CONTENIDO PROVISORIO — pendiente de firma metodológica.
export const TEXTOS_COMPRENSION = [
  `En Chile, la producción de cobre representa aproximadamente el 10% del PIB nacional. La minería se concentra principalmente en el norte del país, en regiones como Antofagasta y Tarapacá. Grandes empresas estatales y privadas operan yacimientos que extraen el mineral desde hace más de un siglo. Sin embargo, la actividad minera también genera impactos ambientales significativos: consumo intensivo de agua, modificación del paisaje y emisiones de material particulado. En los últimos años, se han implementado tecnologías para reducir el consumo de agua fresca, como el uso de agua de mar desalinizada. Además, algunas faenas han comenzado a utilizar energías renovables para sus operaciones. La minería del cobre sigue siendo un pilar de la economía chilena, pero enfrenta el desafío de equilibrar productividad con sostenibilidad ambiental.`,
  `El centro histórico de Santiago concentra una gran cantidad de edificios patrimoniales, muchos de ellos construidos entre fines del siglo XIX y principios del XX. El Palacio de La Moneda, la Catedral Metropolitana y el Mercado Central son algunos ejemplos de esta arquitectura que combina estilos neoclásico, barroco y republicano. En las últimas décadas, el crecimiento urbano ha puesto presión sobre estos inmuebles: el costo de mantenerlos es alto y, en algunos casos, han sido demolidos o modificados sin criterios de conservación. Distintas organizaciones ciudadanas han impulsado iniciativas para proteger este patrimonio, buscando que el desarrollo inmobiliario no borre la memoria arquitectónica de la ciudad. La discusión sobre qué conservar y qué renovar sigue abierta, y refleja tensiones entre identidad cultural y progreso económico.`,
  `La población mapuche es el pueblo originario más numeroso de Chile, con cerca de 1,7 millones de personas según el censo de 2017. Habitan principalmente en la región de La Araucanía, aunque existe una diáspora importante en la Región Metropolitana. El mapudungun, su lengua tradicional, ha experimentado un retroceso en las últimas generaciones: cada vez menos jóvenes lo hablan con fluidez. En respuesta, se han creado programas de revitalización lingüística en escuelas y comunidades, así como espacios de difusión cultural. La relación del Estado chileno con el pueblo mapuche ha sido compleja y marcada por conflictos históricos por tierras y reconocimiento político. En años recientes, se han dado pasos hacia el reconocimiento constitucional de los pueblos indígenas, aunque el debate sigue abierto y sin consenso definitivo.`,
];

// ── Banco de dilemas para argumentación ───────────────────────────
// // CONTENIDO PROVISORIO — pendiente de firma metodológica.
export const DILEMAS_ARGUMENTACION = [
  "¿Debería la educación universitaria ser gratuita para todos los estudiantes, independientemente de sus ingresos?",
  "¿Las redes sociales hacen más bien que daño a la salud mental de los adolescentes?",
  "¿Es mejor especializarse en un área desde temprano o tener una formación más general durante los primeros años de estudio?",
  "¿Debería Chile priorizar la inversión en transporte público por sobre la construcción de nuevas autopistas?",
];

// ── Banco de consignas para expresión escrita ─────────────────────
// Consignas abiertas, tema neutro, sin respuesta correcta. Rotan por session_id.
// // CONTENIDO PROVISORIO — pendiente de firma metodológica.
export const CONSIGNAS_EXPRESION = [
  "Imagina que mañana te despiertas y todos los colores del mundo se intercambiaron de lugar. ¿Qué crees que pasaría en tu día a día? Cuéntalo con detalles.",
  "Escribe una historia corta que empiece con esta frase: «Nadie esperaba que el ascensor del colegio llegara al piso 7…»",
  "¿Cuál es el invento que más ha cambiado la forma de vivir de las personas y por qué? Explica tu elección.",
];

// ── Límites de rate limiting ──────────────────────────────────────
// 9 llamadas por sesión: (pertinencia + rúbrica + doble evaluación) × 2
// intentos como máximo (reintento permitido solo tras 'no_pertinente').
export const RATE_LIMIT_POR_SESSION = 9;
