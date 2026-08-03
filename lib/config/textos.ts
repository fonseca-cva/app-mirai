// Todos los textos del sitio — sección 2 de la spec ("los textos NO van hardcodeados en componentes").
// Español de Chile neutro, tuteo, sin jerga forzada. Sin lorem ipsum.
// PENDIENTE PASADA DE COPY: todo el copy de este archivo es provisorio (instrucciones técnicas, no tono de marca).
// El dueño del proyecto redactará el copy final — no reescribir por cuenta propia.

export const nav = {
  logo: "Mirai", // PENDIENTE PASADA DE COPY
  anclas: [
    { label: "Cómo funciona", href: "#como-funciona" }, // PENDIENTE PASADA DE COPY
    { label: "Respaldo", href: "#respaldo" }, // PENDIENTE PASADA DE COPY
    { label: "Metodología", href: "/metodologia" },
    { label: "Artículos", href: "/articulos" },
    { label: "Colegios", href: "#colegios" }, // PENDIENTE PASADA DE COPY
  ],
  cta: "Descúbrelo gratis", // PENDIENTE PASADA DE COPY
};

export const hero = {
  titular: "¿Y tú, qué forma tienes?", // PENDIENTE PASADA DE COPY
  subtitulo:
    "Un juego de 25 minutos que cruza lo que te gusta y lo que se te da con los sueldos y la pega reales de cada carrera. No es horóscopo: son datos.",
  testVocacionalLine: "Sí, es un test vocacional. No, no funciona como los otros: acá no hay preguntas de horóscopo ni una universidad tratando de venderte su carrera.",
  cta: "Descúbrelo gratis", // PENDIENTE PASADA DE COPY
};

// Corrección D16: ancla que amarra nombre, estética y producto.
export const nombreSignificado = {
  texto: "Mirai (未来) significa futuro en japonés.", // PENDIENTE PASADA DE COPY
};

export const comoFunciona = {
  titulo: "Cómo funciona", // PENDIENTE PASADA DE COPY
  tarjetas: [
    {
      titulo: "Juega", // PENDIENTE PASADA DE COPY
      texto: "Mini-juegos que miden cómo piensas de verdad. Nada que memorizar, nada que adivinar.",
    },
    {
      titulo: "Reacciona", // PENDIENTE PASADA DE COPY
      texto:
        "Lugares de trabajo reales, un lunes a las 9 AM. Con su ruido, sus plazos y su café frío. Tu instinto responde antes que tú.",
    },
    {
      titulo: "Descubre", // PENDIENTE PASADA DE COPY
      texto: "Tu informe cruza quién eres con datos del Mineduc: cuánto paga cada carrera y cuánta pega hay. En serio, con números.",
    },
  ],
};

// Corrección D14: la portada habla de la experiencia completa (~25 min), no de este bloque (~6 min).
export const teaserExperiencia = {
  frase: "25 minutos. Sin vueltas: lo que te gusta, lo que se te da y lo que paga.",
  cta: "Probar una muestra",
};

export const teaserInforme = {
  titulo: "Un informe que sí sirve",
  bullets: [
    "Nada de 'eres un espíritu libre'. Tu perfil de intereses y capacidades, cruzado con empleabilidad e ingresos reales de cada carrera (datos de mifuturo.cl, construidos con declaraciones reales al SII — no con encuestas).",
    "Mirai no pertenece a ninguna universidad. No te vamos a recomendar 'casualmente' la carrera que a alguien le conviene venderte. Te mostramos tus opciones — todas.",
  ],
  mencion: "Versión gratuita y versión profunda.", // PENDIENTE PASADA DE COPY
};

export const respaldo = {
  titulo: "¿Por qué confiar en Mirai?", // PENDIENTE PASADA DE COPY
  viñetas: [
    "Estadísticas oficiales por carrera de mifuturo.cl (Mineduc/SIES), construidas con cruces reales del Servicio de Impuestos Internos — no con encuestas.",
    "Modelo de tres pilares: lo que te gusta + para qué eres bueno/a + cómo está el mercado.", // PENDIENTE PASADA DE COPY
    "Construido sobre metodologías validadas internacionalmente en medición de intereses y capacidades.", // PENDIENTE PASADA DE COPY
    "Datos laborales de fuentes oficiales chilenas.", // PENDIENTE PASADA DE COPY
    "Datos personales: pedimos lo mínimo, jamás vendemos información, cumplimiento de la ley chilena de protección de datos.", // PENDIENTE PASADA DE COPY
  ],
  notaCohorte:
    "Los datos de empleabilidad e ingresos corresponden a las cohortes más recientes publicadas por SIES. Como se construyen cruzando información tributaria real, tienen algunos años de rezago: es el precio de que sean datos verdaderos y no estimaciones.",
  cifra:
    "Elegir carrera a ciegas sale caro. Entre un 24% y un 29% de los estudiantes deja su carrera durante el primer año (SIES, según cohorte), y la falta de orientación es una de las causas que los especialistas más repiten.",
  metodologiaLink: "Conoce nuestra metodología completa →",
};

// Iteración 4: franja sobria para apoderados, insertada entre El informe y Para colegios.
export const apoderados = {
  titulo: "¿Y de qué va a vivir? Ahora se responde con números.",
  texto:
    "Para papás y mamás que quieren ayudar sin presionar: el informe de Mirai muestra, con datos oficiales, qué caminos calzan con su hijo o hija y cómo está el mercado en cada uno. Acompañar es más fácil con información real sobre la mesa.",
};

export const paraColegios = {
  titulo: "Tu generación completa, en una hora pedagógica.",
  texto:
    "Cada estudiante vive la experiencia y recibe su informe. Tu equipo de orientación recibe el mapa de la generación: perfiles, tendencias y datos para trabajar, no impresiones.",
  cta: "Conversemos", // PENDIENTE PASADA DE COPY
  mailto: "mailto:colegios@miraiapp.cl",
};

export const contacto = {
  titulo: "Contacto", // PENDIENTE PASADA DE COPY
  campos: {
    nombre: "Nombre", // PENDIENTE PASADA DE COPY
    correo: "Correo", // PENDIENTE PASADA DE COPY
    motivo: "Motivo", // PENDIENTE PASADA DE COPY
    motivoOpciones: [
      { value: "estudiante-apoderado", label: "Estudiante o apoderado" }, // PENDIENTE PASADA DE COPY
      { value: "colegio", label: "Colegio" }, // PENDIENTE PASADA DE COPY
      { value: "otro", label: "Otro" }, // PENDIENTE PASADA DE COPY
    ],
    mensaje: "Mensaje", // PENDIENTE PASADA DE COPY
  },
  submit: "Enviar", // PENDIENTE PASADA DE COPY
  mailtoDestino: "hola@miraiapp.cl",
};

export const footer = {
  copyright: "© Mirai 2026 · Proyecto chileno", // PENDIENTE PASADA DE COPY
  enlaces: [
    { label: "Artículos", href: "/articulos" },
    { label: "Metodología", href: "/metodologia" },
    { label: "Términos", href: "/terminos" }, // PENDIENTE PASADA DE COPY
    { label: "Privacidad", href: "/privacidad" }, // PENDIENTE PASADA DE COPY
  ],
};

export const paginaEnConstruccion = {
  titulo: "En construcción", // PENDIENTE PASADA DE COPY
  texto:
    "Estamos redactando esta página con el mismo cuidado que le ponemos al resto de Mirai. Vuelve pronto.", // PENDIENTE PASADA DE COPY
};

// Corrección D14: este bloque es UNA PARTE de la experiencia completa (~6 min de los ~25 min totales).
export const experienciaIntro = {
  titulo: "Vas a ver 24 lugares de trabajo reales.", // PENDIENTE PASADA DE COPY
  texto:
    "Imagina que es tu lunes a las 9 AM. Responde rápido, con la guata. Sin respuestas correctas. Sin venderte nada.",
  nota: "Este primer bloque toma unos 6 minutos · puedes pausar", // PENDIENTE PASADA DE COPY
};

// Mejora Bloque A — opt-in de audio ambiente (decisión de Camilo: nunca autoplay,
// el sonido inicia solo tras este gesto explícito del usuario).
export const experienciaAudioAmbiente = {
  pregunta: "¿Quieres escuchar los ambientes? Recomendado con audífonos", // PENDIENTE PASADA DE COPY
  conSonido: "Con sonido", // PENDIENTE PASADA DE COPY
  sinSonido: "Sin sonido", // PENDIENTE PASADA DE COPY
  silenciar: "Silenciar", // PENDIENTE PASADA DE COPY
  activarSonido: "Activar sonido", // PENDIENTE PASADA DE COPY
};

export const experienciaTarjeta = {
  botones: [
    { valor: 0, label: "No es para mí" }, // PENDIENTE PASADA DE COPY
    { valor: 1, label: "Podría ser" }, // PENDIENTE PASADA DE COPY
    { valor: 2, label: "Me atrae" }, // PENDIENTE PASADA DE COPY
  ] as const,
  pausa: "Pausar", // PENDIENTE PASADA DE COPY
  reanudar: "Seguir", // PENDIENTE PASADA DE COPY
  // ITERACIÓN 2 (Bloque A): expandible "¿Qué se hace acá?"
  queSeHaceAqui: "¿Qué se hace acá?", // PENDIENTE PASADA DE COPY
  queSeHaceAquiAria: "Ver más detalles de este lugar de trabajo",
  cerrarExpandible: "Cerrar", // PENDIENTE PASADA DE COPY
};

export const resultadoParcial = {
  titulo: "Primer pliegue listo", // PENDIENTE PASADA DE COPY
  subtitulo: "Tus tres dimensiones más marcadas hasta ahora:", // PENDIENTE PASADA DE COPY
  cierre: "Esto es tu primer pliegue, no tu horóscopo. Los mini-juegos y tu informe completo con datos reales: muy pronto.",
  continuarCta: "Ahora, a jugar", // PENDIENTE PASADA DE COPY
  cta: "Avísame cuando esté listo", // PENDIENTE PASADA DE COPY
  mailto: "mailto:hola@miraiapp.cl?subject=Avísenme%20cuando%20esté%20listo",
};

// Placeholder temporal para bloques aún no construidos (Fases 2-4). Se elimina cuando
// Bloque B, Bloque C e Informe tengan su propia pantalla real.
export const bloqueEnConstruccion = {
  titulo: "Este bloque está en construcción", // PENDIENTE PASADA DE COPY
  texto: "Estamos armando esta parte de la experiencia. Vuelve pronto.", // PENDIENTE PASADA DE COPY
};

// Bloque B — mini-juegos cognitivos (sección 3 de la spec Fase 2).
export const bloqueMatrices = {
  titulo: "Figuras y patrones", // PENDIENTE PASADA DE COPY
  fraseFuerza: "Este juego mira cómo encuentras patrones.", // ITERACIÓN 2: frase de fortaleza
  instrucciones: "Mira el tablero. Cada fila sigue una regla. Toca la figura que completa el patrón.", // ITERACIÓN 2: reescrito
  practicaTitulo: "Un ejemplo primero", // PENDIENTE PASADA DE COPY
  practicaEtiqueta: "Práctica (no puntúa)", // PENDIENTE PASADA DE COPY
  comenzarCta: "Empezar los desafíos de verdad", // ITERACIÓN 3
  celdaVaciaAria: "Espacio vacío a completar", // PENDIENTE PASADA DE COPY
  // ITERACIÓN 2 — tutorial
  tutorial: {
    demoEtiqueta: "Así se juega",
    demoTitulo: "Mira cómo cambian las figuras en cada fila",
    demoSaltar: "Ya lo conozco",
    // ITERACIÓN 3
    propositoCta: "Ver cómo funciona",
    demoContinuarCta: "Ya entendí, quiero practicar",
    practicaAcierto: "Eso es. Así funciona.",
    practicaErrorPista: (texto: string) => `Fíjate en la regla: ${texto}`,
    practicaFalloMensaje: "No importa, es práctica. Mira por qué.",
    practicaFeedback: "Cada fila sigue el mismo patrón de transformación. La figura que falta debe seguir la regla.",
    transicion: "Listo. Ahora van los de verdad: 12 desafíos, sin apuro.",
    ayudaResumen: [
      "Mira el tablero de 3x3.",
      "Cada fila sigue una regla (rotación, forma, relleno o pliegues).",
      "Toca la alternativa que completa la celda vacía.",
    ],
  },
};

export const bloqueSeries = {
  titulo: "Números y letras en orden", // PENDIENTE PASADA DE COPY
  fraseFuerza: "Este juego mira cómo encuentras patrones en secuencias.", // PENDIENTE PASADA DE COPY
  instrucciones: "Mira la serie. Sigue la regla y toca lo que sigue.", // PENDIENTE PASADA DE COPY
  practicaTitulo: "Un ejemplo primero", // PENDIENTE PASADA DE COPY
  practicaEtiqueta: "Práctica (no puntúa)", // PENDIENTE PASADA DE COPY
  comenzarCta: "Empezar los desafíos de verdad", // PENDIENTE PASADA DE COPY
  huecoVacioAria: "Espacio vacío a completar", // PENDIENTE PASADA DE COPY
  tutorial: {
    demoEtiqueta: "Así se juega",
    demoTitulo: "Mira cómo sigue la serie",
    demoSaltar: "Ya lo conozco",
    propositoCta: "Ver cómo funciona",
    demoContinuarCta: "Ya entendí, quiero practicar",
    practicaAcierto: "Eso es. Así funciona.",
    practicaErrorPista: (texto: string) => `Fíjate en la regla: ${texto}`,
    practicaFalloMensaje: "No importa, es práctica. Mira por qué.",
    practicaFeedback: "La serie sigue una regla fija de un elemento al siguiente. El elemento que falta debe seguir esa misma regla.",
    transicion: "Listo. Ahora van los de verdad: 8 desafíos, sin apuro.",
    ayudaResumen: [
      "Mira la serie de números o letras.",
      "Encuentra la regla que va de un elemento al siguiente.",
      "Toca la alternativa que sigue esa regla.",
    ],
  },
};

export const bloqueRotacion = {
  titulo: "Pliegues en el espacio", // PENDIENTE PASADA DE COPY
  fraseFuerza: "Este juego mira cómo visualizas lo que pasa cuando se dobla un papel.",
  instrucciones: "Mira cómo se dobla y se perfora el papel. Luego toca la alternativa que muestra cómo queda al desplegarlo.",
  practicaEtiqueta: "Práctica (no puntúa)", // PENDIENTE PASADA DE COPY
  comenzarCta: "Empezar los desafíos de verdad", // ITERACIÓN 3
  // ITERACIÓN 2 — tutorial
  tutorial: {
    demoEtiqueta: "Así se juega",
    demoTitulo: "Mira cómo se dobla, se perfora y se despliega el papel",
    demoSaltar: "Ya lo conozco",
    // ITERACIÓN 3
    propositoCta: "Ver cómo funciona",
    demoContinuarCta: "Ya entendí, quiero practicar",
    practicaAcierto: "Eso es. Así funciona.",
    practicaFalloMensaje: "No importa, es práctica. Mira por qué.",
    practicaFeedback: "La perforación se refleja al otro lado del pliegue. Compara cada alternativa con la secuencia de doblado.",
    // Consigna fija para ítems de tipo "plegado" — Anexo 2 al bloqueante: sin esta narrativa
    // explícita, el ítem mide familiaridad previa con el ejercicio, no razonamiento espacial.
    consignaPlegado: "El papel se dobla por la línea, se perfora doblado, y luego se abre. ¿Cómo queda?",
    plegadoPanelDoblez: "1. Se dobla por la línea",
    plegadoPanelPerforado: "2. Se perfora doblado — atraviesa todas las capas",
    plegadoPanelPregunta: "3. ¿Cómo queda al desplegarlo?",
    transicion: "Listo. Ahora van los de verdad: 7 desafíos, sin apuro.",
    ayudaResumen: [
      "Mira cómo se dobla y se perfora el papel.",
      "Imagina cómo queda al desplegarlo.",
      "Toca la alternativa que coincide con el papel ya desplegado.",
    ],
  },
};

export const bloqueSecuencias = {
  titulo: "Secuencias", // PENDIENTE PASADA DE COPY
  fraseFuerza: "Este juego mira cuánto retienes en la memoria de corto plazo.", // ITERACIÓN 2: frase de fortaleza
  instrucciones: "Mira la secuencia de figuras. Cuando termine, repítela tocándolas en el mismo orden.", // ITERACIÓN 2: reescrito
  practicaEtiqueta: "Práctica (no puntúa)", // PENDIENTE PASADA DE COPY
  comenzarCta: "Empezar los desafíos de verdad", // ITERACIÓN 3
  continuarCta: "Ahora en serio", // PENDIENTE PASADA DE COPY
  // Anexo 3 — estados explícitos del juego real
  etiquetaPresentacion: "Mira la secuencia",
  etiquetaRespuesta: "Tu turno",
  transicionAcierto: "¡Bien! Ahora una más larga…",
  transicionReintento: "Vamos de nuevo, mismo largo…",
  timeoutMensaje: "¿Sigues ahí?",
  timeoutRepetirCta: "Repetir esta ronda",
  // ITERACIÓN 2 — tutorial
  tutorial: {
    demoEtiqueta: "Así se juega",
    demoTitulo: "Mira la secuencia, luego repítela",
    demoSaltar: "Ya lo conozco",
    // ITERACIÓN 3
    propositoCta: "Ver cómo funciona",
    demoContinuarCta: "Ya entendí, quiero practicar",
    practicaAcierto: "Eso es. Así funciona.",
    practicaErrorPista: "La secuencia era: ",
    practicaFalloMensaje: "No importa, es práctica. Mira por qué.",
    practicaFeedback: "Los símbolos aparecen uno tras otro en un orden fijo. Tienes que recordar el orden exacto.",
    transicion: "Listo. Ahora van los de verdad: secuencias cada vez más largas, sin apuro.",
    ayudaResumen: [
      "Aparecen figuras una por una.",
      "Espera a que terminen de mostrar todas.",
      "Tócalas en el MISMO orden en que aparecieron.",
    ],
  },
};

export const juegosCognitivos = {
  pausa: "Pausar", // PENDIENTE PASADA DE COPY
  reanudar: "Seguir", // PENDIENTE PASADA DE COPY
  ayuda: "Ayuda", // ITERACIÓN 2: botón help
  ayudaAria: "Reabrir instrucciones",
  cerrarAyuda: "Cerrar",
  // ITERACIÓN 3 — ritmo del usuario en el tutorial
  practicaAviso: "Esto es práctica: no cuenta para tu resultado.",
  saltarTutorial: "Saltar tutorial",
  atras: "Atrás",
  seguir: "Seguir",
};

// ── Bloque C — Verbal con IA (sección 4 de la spec) ──────────────────
export const bloqueVerbal = {
  // ITERACIÓN 2: mini-ejemplo de informalidad + desactivar ansiedad ortográfica
  miniEjemplo: "Puedes escribir como hablas. Ejemplo: 'yo cacho que el texto dice que…'",
  disclaimer: "No evaluamos tu opinión ni tu ortografía: nos interesa cómo entiendes y cómo argumentas.",
  comprension: {
    titulo: "Comprensión lectora", // PENDIENTE PASADA DE COPY
    instrucciones: "Lee el texto y explícalo con tus palabras, como se lo contarías a un amigo.", // PENDIENTE PASADA DE COPY
    etiqueta: "Tu explicación", // PENDIENTE PASADA DE COPY
    placeholder: "Escribe tu explicación acá...", // PENDIENTE PASADA DE COPY
    minimoCaracteres: 120,
    contadorCaracteres: "caracteres", // PENDIENTE PASADA DE COPY
    siguienteCta: "Siguiente", // PENDIENTE PASADA DE COPY
  },
  argumentacion: {
    titulo: "Argumentación", // PENDIENTE PASADA DE COPY
    instrucciones: "Lee el dilema y da tu postura. Defiéndela en 3 o 4 frases.", // PENDIENTE PASADA DE COPY
    etiqueta: "Tu postura", // PENDIENTE PASADA DE COPY
    placeholder: "Escribe tu argumento acá...", // PENDIENTE PASADA DE COPY
    minimoCaracteres: 120,
    siguienteCta: "Siguiente", // PENDIENTE PASADA DE COPY
  },
  expresion: {
    titulo: "Expresión escrita", // PENDIENTE PASADA DE COPY
    instrucciones: "Lee la consigna y escribe con libertad. Desarrolla tu idea: no hay respuesta correcta ni incorrecta.", // PENDIENTE PASADA DE COPY
    etiqueta: "Tu texto", // PENDIENTE PASADA DE COPY
    placeholder: "Escribe tu texto acá...", // PENDIENTE PASADA DE COPY
    minimoCaracteres: 120,
    siguienteCta: "Terminar", // PENDIENTE PASADA DE COPY
  },
  evaluando: "Evaluando tu respuesta...", // PENDIENTE PASADA DE COPY
  error: "No pudimos evaluar esta respuesta. Puedes seguir igual.", // PENDIENTE PASADA DE COPY
  reintentar: "Reintentar", // PENDIENTE PASADA DE COPY
};

// ── Bloque exploratorio — Pensamiento divergente (Tanda D) ────────
// EXPLORATORIO: no alimenta informe ni matching en v1 (ver COMMENT de respuestas_divergente).
export const bloqueDivergente = {
  titulo: "Pensamiento divergente", // PENDIENTE PASADA DE COPY
  bajada: "Para cada objeto, escribe la mayor cantidad de usos distintos que se te ocurran. Uno por línea.", // PENDIENTE PASADA DE COPY
  avisoExploratorio: "Esto no cuenta para tu informe: nos ayuda a mejorar el instrumento.", // PENDIENTE PASADA DE COPY
  objetoEtiqueta: "Objeto", // PENDIENTE PASADA DE COPY
  de: "de", // PENDIENTE PASADA DE COPY
  minimo: "Mínimo", // PENDIENTE PASADA DE COPY
  contadorIdeas: "ideas", // PENDIENTE PASADA DE COPY
  placeholder: "Escribe un uso por línea...", // PENDIENTE PASADA DE COPY
  siguienteCta: "Siguiente objeto", // PENDIENTE PASADA DE COPY
  terminarCta: "Terminar", // PENDIENTE PASADA DE COPY
  hecho: "¡Listo! Actividad completada.", // PENDIENTE PASADA DE COPY
};

// ── Bloque A2 — Actividades y pasatiempos (Tanda F, pilar de intereses) ──
// Tarjetas rápidas: 24 ítems, una por pantalla, ~2 min el bloque.
// Escala de 3 puntos idéntica al resto del instrumento (0/1/2).
export const bloqueActividades = {
  titulo: "Actividades y pasatiempos", // PENDIENTE PASADA DE COPY
  bajada: "Responde rápido: ¿qué tanto te gusta hacer esto?", // PENDIENTE PASADA DE COPY
  contadorDe: "de", // PENDIENTE PASADA DE COPY
  botones: [
    { valor: 0, label: "No me gusta" }, // PENDIENTE PASADA DE COPY
    { valor: 1, label: "Indiferente" }, // PENDIENTE PASADA DE COPY
    { valor: 2, label: "Me gusta" }, // PENDIENTE PASADA DE COPY
  ] as const,
  pausa: "Pausar", // PENDIENTE PASADA DE COPY
  hecho: "¡Listo! Actividad completada.", // PENDIENTE PASADA DE COPY
};

// ── Bloque A3 — Asignaturas escolares (Tanda F, pilar de intereses) ──
// Misma tarjeta rápida que A2: 10 asignaturas, una por pantalla, ~45s.
// Los botones (No me gusta / Indiferente / Me gusta) se comparten con A2.
export const bloqueAsignaturas = {
  titulo: "Asignaturas del colegio", // PENDIENTE PASADA DE COPY
  bajada: "Responde rápido: ¿qué tanto te gusta esta asignatura?", // PENDIENTE PASADA DE COPY
  contadorDe: "de", // PENDIENTE PASADA DE COPY
  pausa: "Pausar", // PENDIENTE PASADA DE COPY
  hecho: "¡Listo! Última parte de intereses.", // PENDIENTE PASADA DE COPY
};

// ── Bloque A4 — Aspiración post 4° medio (Tanda F, pilar de intereses) ──
// Una pregunta al inicio del flujo, antes del bloque de gustos. Detalle opcional.
export const bloqueAspiracion = {
  titulo: "Antes de partir, una pregunta", // PENDIENTE PASADA DE COPY
  pregunta: "¿Qué te gustaría hacer después de 4° medio?", // PENDIENTE PASADA DE COPY
  opciones: [
    { valor: "universidad", label: "Estudiar en la universidad" }, // PENDIENTE PASADA DE COPY
    { valor: "tecnico", label: "Estudiar una carrera técnica o profesional" }, // PENDIENTE PASADA DE COPY
    { valor: "trabajar", label: "Trabajar" }, // PENDIENTE PASADA DE COPY
    { valor: "no_se", label: "Aún no lo sé" }, // PENDIENTE PASADA DE COPY
  ] as const,
  detalleLabel: "¿Sabes qué carrera o área te gustaría? (opcional)", // PENDIENTE PASADA DE COPY
  detallePlaceholder: "Por ejemplo: medicina, electricidad, diseño…", // PENDIENTE PASADA DE COPY
  continuar: "Continuar", // PENDIENTE PASADA DE COPY
};

// ── Transiciones entre bloques (sección 1) ─────────────────────────
export const transiciones = {
  pliegues: [
    "Primer pliegue listo. Ahora, a jugar.", // PENDIENTE PASADA DE COPY
    "Bien jugado. Segundo pliegue: verbal.", // PENDIENTE PASADA DE COPY
    "Último pliegue. Armando tu informe...", // PENDIENTE PASADA DE COPY
  ],
  grullaProgreso: ["25%", "50%", "75%", "100%"], // PENDIENTE PASADA DE COPY
};

// ── Informe (sección 5 de la spec) ─────────────────────────────────
export const informe = {
  titulo: "Tu mapa inicial", // PENDIENTE PASADA DE COPY
  subtitulo: "Esto es lo que vimos hoy. No es un veredicto, es un punto de partida.", // PENDIENTE PASADA DE COPY
  saltarAnimacion: "Continuar", // PENDIENTE PASADA DE COPY
  seccionIntereses: "Tu perfil de intereses", // PENDIENTE PASADA DE COPY
  etiquetaIntereses: "Top dimensiones", // PENDIENTE PASADA DE COPY
  seccionCapacidades: "Tus capacidades", // PENDIENTE PASADA DE COPY
  etiquetaCapacidades: (label: string) => `${label}:`, // PENDIENTE PASADA DE COPY
  leyendaCapacidades: {
    patrones: "Patrones",
    numerico: "Razonamiento numérico",
    espacial: "Espacial",
    memoria: "Memoria",
    comunicacion: "Comunicación",
  },
  rangoCapacidad: {
    muyAlto: "Muy desarrollada", // PENDIENTE PASADA DE COPY
    alto: "Bien desarrollada", // PENDIENTE PASADA DE COPY
    medio: "En desarrollo", // PENDIENTE PASADA DE COPY
    bajo: "Área a desarrollar", // PENDIENTE PASADA DE COPY
  },
  seccionCaminos: "Caminos para explorar", // PENDIENTE PASADA DE COPY
  // Bloque Integración: de dónde sale el perfil de intereses (pesos 45/40/15).
  seccionConvergencia: "De dónde sale este perfil", // PENDIENTE PASADA DE COPY
  textoConvergencia: "Combinamos cuatro fuentes, con más peso en lo que observas y haces:", // PENDIENTE PASADA DE COPY
  fuenteGustos: "Escenas de trabajo a las que reaccionaste (45%)", // PENDIENTE PASADA DE COPY
  fuenteActividades: "Actividades que te gusta hacer (20%)", // PENDIENTE PASADA DE COPY
  fuenteAsignaturas: "Asignaturas que te gustan (20%)", // PENDIENTE PASADA DE COPY
  fuenteAspiracion: "Lo que te gustaría hacer después de 4° medio (15%)", // PENDIENTE PASADA DE COPY
  elegisteAspiracion: "Elegiste:", // PENDIENTE PASADA DE COPY
  discrepanciaTitulo: "Cuando las señales no coinciden", // PENDIENTE PASADA DE COPY
  discrepanciaTexto: (a: string, b: string) =>
    `Tus reacciones a los ambientes de trabajo apuntan más hacia ${a}, y tus actividades preferidas apuntan más hacia ${b}. No es un error del test: suele ser la parte más interesante para explorar.`, // PENDIENTE PASADA DE COPY
  cierre:
    "Este es tu primer mapa, no tu destino. Las carreras de hoy son un punto de partida para explorar; la versión profunda agrega datos de empleo e ingresos reales y contenido para recorrer cada camino.", // PENDIENTE PASADA DE COPY
  correoOpcional: "¿Quieres recibir tu informe por correo?", // PENDIENTE PASADA DE COPY
  correoPlaceholder: "tu@correo.cl", // PENDIENTE PASADA DE COPY
  correoEnviar: "Enviar", // PENDIENTE PASADA DE COPY
  correoGracias: "Recibirás tu informe en unos minutos.", // PENDIENTE PASADA DE COPY
  correoError: "No pudimos enviar el correo. Intenta de nuevo.", // PENDIENTE PASADA DE COPY
  disclaimer:
    "Este instrumento está en desarrollo. Los resultados son orientativos y no constituyen una recomendación vocacional definitiva.", // PENDIENTE PASADA DE COPY
};

// Banco de lecturas amables por dimensión — sección 5.2. Se usa para las top 3 dimensiones.
// PENDIENTE PASADA DE COPY (todas las entradas de este registro)
export const lecturasPorDimension: Record<string, string> = {
  tec: "Te mueve resolver con las manos y ver resultados concretos. El trabajo técnico te queda cómodo.",
  cie: "Te atrae entender el porqué de las cosas antes de actuar. La precisión no te pesa, te acomoda.",
  cre: "Te mueve imaginar algo que no existe y hacerlo real. Lo estético y lo nuevo te llaman la atención.",
  soc: "Te energiza estar con otras personas y ayudarlas a avanzar. Escuchar no te cuesta, te sale natural.",
  sal: "Te mueve cuidar del bienestar de otras personas, aunque implique paciencia y rutina.",
  ges: "Te atrae tomar decisiones y hacer que las cosas avancen, incluso con incertidumbre.",
  dat: "Te acomoda ordenar el caos: números, procesos, información. Ahí encuentras claridad.",
  nat: "Te mueve trabajar en terreno, con el cuerpo y al aire libre, lejos de una oficina cerrada.",
};

// ---------------------------------------------------------------------------
// Metodología — página de lectura /metodologia
// Copy v1 aprobado. No reescribir.
// ---------------------------------------------------------------------------

export const metodologiaIndice = [
  { label: "Tres pilares, no uno", href: "#tres-pilares" },
  { label: "Cómo medimos lo que te interesa", href: "#intereses" },
  { label: "Por qué preguntamos lo mismo de varias formas", href: "#por-que-preguntamos" },
  { label: "Cómo medimos para qué tienes facilidad", href: "#capacidades" },
  { label: "Cómo evaluamos comprensión y expresión", href: "#comprension-expresion" },
  { label: "De dónde salen los datos de sueldos y empleabilidad", href: "#datos-mercado" },
  { label: "Lo que no hacemos", href: "#lo-que-no-hacemos" },
  { label: "Dónde estamos hoy", href: "#estado-desarrollo" },
] as const;

export const metodologia = {
  encabezado: {
    titulo: "Cómo funciona Mirai por dentro",
    bajada:
      "Sin secretos de fondo: este es el método. Sin spoilers tampoco: los ejercicios concretos no se muestran, para que la experiencia mida lo que tiene que medir.",
  },
  tresPilares: {
    titulo: "Tres pilares, no uno",
    cuerpo:
      "Una buena decisión vocacional cruza tres cosas: lo que te interesa, aquello para lo que tienes facilidad, y cómo es el mundo laboral real. Mirai mide las dos primeras en una experiencia de alrededor de media hora, y cruza los resultados con la tercera usando datos oficiales.\n\nNingún pilar por sí solo basta: interés sin capacidad frustra, capacidad sin interés aburre, y ambos sin información del mercado es decidir a ciegas. La mayoría de los instrumentos disponibles se queda en el primero.",
  },
  intereses: {
    titulo: "Cómo medimos lo que te interesa",
    cuerpo:
      "Los inventarios de intereses serios no preguntan de una sola forma. La práctica establecida en evaluación vocacional es combinar tres tipos de pregunta: qué actividades te gustan, qué asignaturas te gustan y qué ocupaciones te atraen. El patrón de todas esas respuestas es lo que forma el perfil. Mirai usa esos tres tipos, más uno propio.\n\nContextos de trabajo reales. En vez de preguntarte '¿te interesa la investigación científica?' — una pregunta que casi todos responden pensando en quién quieren ser y no en quién son — te mostramos lugares de trabajo reales, con su ambiente y su sonido, y registramos tu reacción. Este enfoque proviene de una línea de instrumentos basados en imágenes, con décadas de desarrollo en psicometría, actualizada hoy con material audiovisual. Hay un segundo efecto buscado: mostrar el trabajo como es de verdad, con lo entretenido y lo incómodo, ayuda a calibrar expectativas. Buena parte de los cambios de carrera no ocurren porque la persona se equivocó de interés, sino porque no sabía cómo era el día a día de esa profesión.\n\nActividades y pasatiempos. Te preguntamos por cosas concretas que haces o harías por gusto, no por obligación. Esto no es un invento nuestro: el Self-Directed Search de John Holland — el instrumento de orientación vocacional más usado del mundo — dedica una sección completa a actividades y pasatiempos de tiempo libre, con once preguntas por cada tipo de interés, respondidas simplemente como 'me gusta' o 'no me gusta'. Sus secciones reportan consistencia interna entre .72 y .92 y confiabilidad en el tiempo entre .76 y .89 en muestras de adolescentes y adultos jóvenes.\n\nAsignaturas escolares. Llevas años descubriendo qué ramos te resultan y cuáles se te hacen cuesta arriba. Esa información es demasiado valiosa para ignorarla, y es el tercer tipo de pregunta que usan los inventarios establecidos.\n\nLo que ya estabas pensando. Al comenzar te preguntamos si tienes algo en mente. No es una formalidad: la evidencia muestra que las aspiraciones que una persona declara espontáneamente predicen su ocupación futura tan bien como — o mejor que — los inventarios estandarizados. Nos sirve para comparar al final lo que creías con lo que encontramos, no para confirmarte lo que ya pensabas.",
  },
  porQuePreguntamos: {
    titulo: "Por qué preguntamos lo mismo de varias formas",
    cuerpo:
      "Ninguna forma de preguntar es suficiente por sí sola. Una respuesta puede estar teñida por lo que uno cree que debería contestar, por el día que tuvo o por la palabra exacta que usamos. Al medir cada área de interés con varios tipos de pregunta, el perfil se vuelve más estable.\n\nPor eso tu informe no entrega un solo número: muestra de dónde sale el perfil, con el peso de cada fuente — tus reacciones a las escenas de trabajo, tus actividades, tus asignaturas y lo que ya tenías en mente. Preferimos que veas cómo se arma la conclusión antes que ocultarla detrás de un promedio.",
  },
  capacidades: {
    titulo: "Cómo medimos para qué tienes facilidad",
    cuerpo:
      "Usamos mini-juegos, pero no cualquier juego. Cada uno está construido sobre un tipo de tarea con décadas de evidencia en psicología cognitiva. Medimos cinco capacidades: razonamiento con patrones, razonamiento numérico, razonamiento espacial, memoria de trabajo, y comprensión y expresión verbal. Están entre las capacidades con mayor respaldo científico como predictores del desempeño académico posterior, y cada una se mide con su propio tipo de ejercicio: no repetimos la misma prueba con distinta cara.\n\nEl formato de juego cumple una función concreta: reduce la ansiedad de examen, que distorsiona los resultados. La tarea de fondo es la que hace la medición.\n\nDos decisiones importantes: el tiempo no te presiona — medimos precisión y nivel alcanzado, no velocidad — y antes de cada juego hay una práctica que no puntúa, para que nadie sea evaluado mientras todavía está entendiendo las instrucciones.",
  },
  comprensionExpresion: {
    titulo: "Cómo evaluamos comprensión y expresión",
    cuerpo:
      "Las capacidades verbales no se pueden medir bien con alternativas. Por eso te pedimos escribir con tus palabras, y esa respuesta la evalúa inteligencia artificial aplicando rúbricas diseñadas por profesionales.\n\nEl orden importa: la IA aplica criterios definidos por personas, no improvisa juicios. Evaluamos tres cosas distintas: cómo comprendes un texto, cómo estructuras un argumento y cómo te expresas cuando escribes libremente. Nunca tu opinión, y nunca tu ortografía.\n\nDurante la etapa de validación, una parte de estas evaluaciones se revisa manualmente para verificar que la corrección automática coincide con la de un evaluador humano.",
  },
  datosMercado: {
    titulo: "De dónde salen los datos de sueldos y empleabilidad",
    cuerpo:
      "Los datos laborales de tu informe vienen del Buscador de Estadísticas por Carrera de mifuturo.cl, el portal oficial del Ministerio de Educación. Esas cifras no salen de encuestas ni de promedios de la industria: se construyen cruzando información real del Servicio de Impuestos Internos, es decir, las declaraciones efectivas de personas tituladas.\n\nEso tiene una consecuencia que preferimos explicar antes de que la note: los datos tienen algunos años de rezago. Para saber cuánto gana alguien al cuarto año de titulado, hay que esperar a que efectivamente pasen esos años y se declaren esos ingresos. Es el precio de que sean datos verdaderos y no proyecciones. Cada cifra de tu informe indica a qué cohorte corresponde.\n\nLas tendencias a futuro son otra cosa y las tratamos distinto: cuando decimos que un área está en expansión o en transformación, citamos el informe y el año del que sale esa proyección, y la presentamos como tendencia, no como certeza.\n\nY cuando una carrera no tiene datos oficiales publicados —porque no existe como categoría en las estadísticas del Ministerio— lo decimos explícitamente en vez de estimarlos.",
  },
  loQueNoHacemos: {
    titulo: "Lo que no hacemos",
    items: [
      "No pertenecemos a ninguna universidad ni recibimos comisión por recomendar carreras.",
      "No usamos tus datos para publicidad ni los vendemos a nadie.",
      "No inferimos emociones ni rasgos de personalidad a partir de tu forma de escribir, de tu voz o de tus tiempos de respuesta. Esas señales técnicas se usan solo para verificar la calidad de los datos, y está declarado en el consentimiento.",
      "Sí tenemos una parte experimental, y preferimos decirlo: hay un bloque corto al final que estamos estudiando y que no afecta tu resultado ni aparece en tu informe. Te lo advertimos en pantalla antes de que lo hagas. Si algún día esa parte demuestra medir algo útil, lo diremos aquí antes de usarla.",
      "No mostramos los ejercicios fuera de la experiencia. Un instrumento que se conoce de antemano deja de medir.",
      "No te decimos 'no sirves para esto'. El resultado abre opciones para explorar; no las cierra.",
      "No pedimos más datos personales de los necesarios para entregarte tu informe.",
    ],
  },
  estadoDesarrollo: {
    titulo: "Dónde estamos hoy",
    cuerpo:
      "Mirai está en desarrollo activo y lo decimos con todas sus letras. La arquitectura del instrumento se construyó sobre marcos con respaldo científico internacional, y estamos en el proceso de validarla con estudiantes chilenos: pilotos en colegios, comparación con instrumentos ya establecidos y construcción de normas locales.\n\nY una cifra que preferimos poner sobre la mesa: una revisión que reunió casi cien años de investigación encontró que los inventarios de intereses aciertan la carrera que la persona finalmente elige alrededor de la mitad de las veces (Hanna y Rounds, Psychological Bulletin). La mitad. Eso significa dos cosas: que estos instrumentos sirven de verdad — mucho más que el azar entre cientos de carreras posibles — y que ninguno, incluido el nuestro, es una bola de cristal. Por eso Mirai entrega caminos para explorar y datos para decidir, no un veredicto.\n\nPublicaremos los avances de ese proceso en esta misma página. Mientras tanto, cada informe declara sus alcances: es orientación fundamentada para explorar, no un veredicto.",
  },
  cierre: {
    probar: "Probar la experiencia",
    probarHref: "/experiencia",
    contacto:
      "¿Eres orientador, docente o directivo y quieres conversar sobre la metodología? Escríbenos a colegios@miraiapp.cl",
    contactoMailto: "mailto:colegios@miraiapp.cl",
  },
} as const;
