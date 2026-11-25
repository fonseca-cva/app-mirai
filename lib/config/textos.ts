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
    { label: "Colegios", href: "/colegios" },
    { label: "Mi cuenta", href: "/mi-cuenta" }, // PENDIENTE PASADA DE COPY
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
    "Cada estudiante vive la experiencia y recibe su informe individual. El reporte generacional para tu equipo de orientación todavía no está operativo: es lo que estamos diseñando junto a los colegios fundadores del piloto.",
  cta: "Conversemos", // PENDIENTE PASADA DE COPY
  // Enlace a la página dedicada del programa (detalle completo).
  ctaPagina: "Ver el programa de colegios",
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
  titulo: (cantidad: number) => `Vas a ver ${cantidad} lugares de trabajo reales.`, // PENDIENTE PASADA DE COPY (cantidad viene de contextos.length)
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
  cierre: "Esto es tu primer pliegue, no tu horóscopo. Sigue lo que mide cómo piensas (cuatro mini-juegos y tres textos breves). Al final recibes tu informe con datos reales.",
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

export const bloquePliegues = {
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
  omitir: "Seguir sin responder esta tarea", // PENDIENTE PASADA DE COPY
  // Requisito de Camilo (anonimización): advertencia antes de cada tarea escrita.
  avisoDatosPersonales: "No incluyas tu nombre ni datos personales en tu respuesta.",
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
  // Validez (plan de Camilo): sin evaluación válida se muestra "sin evaluar",
  // NUNCA un número inventado (antes mostraba 0%).
  sinEvaluar: "Sin evaluar", // PENDIENTE PASADA DE COPY
  sinEvaluarNota:
    "No alcanzamos a evaluar esta capacidad hoy. Puedes intentar la experiencia de nuevo más adelante.", // PENDIENTE PASADA DE COPY
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
  // Tanda A — oferta de guardar el informe vinculando el correo (sin contraseñas).
  guardarTitulo: "¿Quieres guardar tu informe?", // PENDIENTE PASADA DE COPY
  guardarTexto:
    "Te mandamos un enlace a tu correo y queda disponible cuando quieras. No pedimos contraseña ni tus datos personales.", // PENDIENTE PASADA DE COPY
  guardarCorreoPlaceholder: "tu@correo.cl", // PENDIENTE PASADA DE COPY
  guardarApodoPlaceholder: "¿Cómo te llamamos? (opcional)", // PENDIENTE PASADA DE COPY
  guardarBoton: "Enviar enlace", // PENDIENTE PASADA DE COPY
  guardarEnviado: "Enlace enviado", // PENDIENTE PASADA DE COPY
  guardarExito: "Revisa tu correo: te llegó un enlace para guardar tu informe.", // PENDIENTE PASADA DE COPY
  guardarYaTenias:
    "Este correo ya está asociado a una cuenta Mirai. Si es tu cuenta, tu informe ya queda vinculado; si no, todavía no podemos unirlo a esa cuenta.", // PENDIENTE PASADA DE COPY
  guardarLimite:
    "Enviaste varios enlaces a este correo. Espera una hora y prueba de nuevo.", // PENDIENTE PASADA DE COPY
  guardarError: "No pudimos enviar el enlace. Intenta de nuevo.", // PENDIENTE PASADA DE COPY
  guardarSesionExpirada: "Tu sesión expiró, recarga la página.", // PENDIENTE PASADA DE COPY
  // Sesión que ya tiene cuenta con correo: no se ofrece vincular otro correo.
  cuentaTitulo: "Tu informe quedó guardado en tu cuenta", // PENDIENTE PASADA DE COPY
  cuentaTexto: (correo: string) =>
    `Estás con la sesión iniciada como ${correo}. Puedes verlo cuando quieras en Mi cuenta.`, // PENDIENTE PASADA DE COPY
  cuentaEnviarBoton: "Enviarme el enlace por correo", // PENDIENTE PASADA DE COPY
  cuentaEnviado: "Te enviamos el enlace de este informe a tu correo.", // PENDIENTE PASADA DE COPY
  cuentaNoEsMia: "¿No es tu cuenta? Cerrar sesión y empezar de nuevo", // PENDIENTE PASADA DE COPY
  // Modo prueba (C(i), Camilo 2026-09-10): nunca se vincula un correo real
  // desde una sesión de prueba, para no seguir contaminando auth.users con
  // cuentas reales de quien está probando.
  guardarModoPrueba:
    "Esta es una sesión de prueba: aquí no se guarda el informe ni se vincula un correo real.", // PENDIENTE PASADA DE COPY
  disclaimer:
    "Este instrumento está en desarrollo. Los resultados son orientativos y no constituyen una recomendación vocacional definitiva.", // PENDIENTE PASADA DE COPY
};

// ── Página /guardar-informe (Tanda A) ──────────────────────────────
// Textos del destino del enlace de confirmación de correo. Esta página nunca
// muestra el correo ni datos identificables: solo el estado de la vinculación.
export const guardarCuenta = {
  cargando: "Revisando tu enlace…", // PENDIENTE PASADA DE COPY
  vinculado: (apodo: string | null) =>
    apodo
      ? `¡Listo, ${apodo}! Tu informe quedó guardado en tu cuenta.` // PENDIENTE PASADA DE COPY
      : "¡Listo! Tu informe quedó guardado en tu cuenta.", // PENDIENTE PASADA DE COPY
  vinculadoDetalle:
    "Tu informe quedó vinculado a este correo y no se pierde si cierras la pestaña.", // PENDIENTE PASADA DE COPY
  // Tanda B — envío del correo con el enlace permanente (/informe/[token]).
  enviandoEnlace: "Preparando el enlace de tu informe…", // PENDIENTE PASADA DE COPY
  enlaceEnviado: "Te enviamos el enlace permanente a tu correo.", // PENDIENTE PASADA DE COPY
  enlaceError: "No pudimos enviar el enlace ahora, pero tu informe quedó guardado en tu cuenta.", // PENDIENTE PASADA DE COPY
  cuentaExistente:
    "Este dispositivo ya estaba asociado a otra cuenta Mirai con ese correo.", // PENDIENTE PASADA DE COPY
  cuentaExistenteDetalle:
    "Por seguridad no unimos informes entre cuentas distintas en esta versión. Tu informe de esta sesión sigue disponible en pantalla.", // PENDIENTE PASADA DE COPY
  invalido: "No pudimos terminar de guardar tu informe en este navegador.", // PENDIENTE PASADA DE COPY
  invalidoDetalle:
    "Abre el enlace en el mismo navegador donde hiciste la experiencia. Si ya confirmaste tu correo, entra a Mi cuenta con ese correo para ver tus informes.", // PENDIENTE PASADA DE COPY
  invalidoEntrar: "Entrar a Mi cuenta", // PENDIENTE PASADA DE COPY
  otroDispositivo: "¡Listo! Tu correo quedó confirmado.", // PENDIENTE PASADA DE COPY
  otroDispositivoDetalle:
    "Abriste el enlace en un dispositivo distinto al del test. Entra a Mi cuenta con ese mismo correo: ahí verás tu informe y te mandaremos su enlace por correo.", // PENDIENTE PASADA DE COPY
  vencido: "Este enlace ya no sirve.", // PENDIENTE PASADA DE COPY
  vencidoDetalle:
    "Puede que haya vencido o que ya lo hayas usado. Si ya confirmaste tu correo, entra a Mi cuenta para ver tus informes.", // PENDIENTE PASADA DE COPY
  irAExperiencia: "Ir a la experiencia", // PENDIENTE PASADA DE COPY
};

// ── Página /mi-cuenta (Tanda C) ───────────────────────────────────
// Tres estados: sin sesión (entrar con enlace), anónima (vincular o perder los
// informes locales) y vinculada (correo, apodo, informes, desvincular).
export const miCuenta = {
  cargando: "Cargando…", // PENDIENTE PASADA DE COPY
  sinSesion: {
    titulo: "Entra con tu correo", // PENDIENTE PASADA DE COPY
    detalle:
      "Si guardaste tu informe, entra con el correo que usaste. Si todavía no lo has hecho, haz la experiencia y guárdalo al final.", // PENDIENTE PASADA DE COPY
    entrarLabel: "Tu correo", // PENDIENTE PASADA DE COPY
    enviarBoton: "Enviar enlace de entrada", // PENDIENTE PASADA DE COPY
    enviado: "Revisa tu correo: te enviamos el enlace para entrar.", // PENDIENTE PASADA DE COPY
    limite: "Enviaste varios enlaces a este correo. Espera una hora y prueba de nuevo.", // PENDIENTE PASADA DE COPY
    error: "No pudimos enviar el enlace. Intenta de nuevo.", // PENDIENTE PASADA DE COPY
    ctaExperiencia: "Hacer la experiencia", // PENDIENTE PASADA DE COPY
    ctaExperienciaHref: "/experiencia", // PENDIENTE PASADA DE COPY
  },
  anonima: {
    titulo: "Modo sin cuenta", // PENDIENTE PASADA DE COPY
    detalle:
      "Tus informes de este navegador están acá, pero se pierden si se borran los datos del navegador.", // PENDIENTE PASADA DE COPY
    vincularLabel: "Vincúlalo a un correo para no perderlo:", // PENDIENTE PASADA DE COPY
    vincularBoton: "Enviar enlace", // PENDIENTE PASADA DE COPY
    vincularExito: "Revisa tu correo: te llegó un enlace para guardar tu informe.", // PENDIENTE PASADA DE COPY
    vincularYaTenias:
      "Este correo ya está asociado a una cuenta Mirai. Si es tu cuenta, tu informe ya queda vinculado.", // PENDIENTE PASADA DE COPY
    vincularLimite: "Enviaste varios enlaces a este correo. Espera una hora y prueba de nuevo.", // PENDIENTE PASADA DE COPY
    vincularError: "No pudimos enviar el enlace. Intenta de nuevo.", // PENDIENTE PASADA DE COPY
  },
  vinculada: {
    correoLabel: "Correo", // PENDIENTE PASADA DE COPY
    apodoLabel: "Apodo", // PENDIENTE PASADA DE COPY
    apodoPlaceholder: "¿Cómo te llamamos? (opcional)", // PENDIENTE PASADA DE COPY
    apodoGuardar: "Guardar", // PENDIENTE PASADA DE COPY
    apodoGuardado: "Apodo guardado.", // PENDIENTE PASADA DE COPY
    apodoError: "No pudimos guardar el apodo. Intenta de nuevo.", // PENDIENTE PASADA DE COPY
    listaTitulo: "Tus informes", // PENDIENTE PASADA DE COPY
    sinInformes: "Todavía no tienes informes guardados.", // PENDIENTE PASADA DE COPY
    abrirInforme: "Ver informe", // PENDIENTE PASADA DE COPY
    envioEnviando: "Enviando el enlace de tu informe a tu correo…", // PENDIENTE PASADA DE COPY
    envioEnviado: "Te enviamos el enlace de tu informe a tu correo.", // PENDIENTE PASADA DE COPY
    envioError: "No pudimos enviar el correo ahora, pero tu informe está aquí abajo.", // PENDIENTE PASADA DE COPY
    desvincularDetalle:
      "Cerrarás la sesión en este navegador. Tus informes no se borran: puedes volver a entrar con tu correo.", // PENDIENTE PASADA DE COPY
    desvincularBoton: "Desvincular esta sesión", // PENDIENTE PASADA DE COPY
    desvincularConfirmar: "¿Seguro? Tus informes quedan guardados en tu cuenta.", // PENDIENTE PASADA DE COPY
    desvincularCancelar: "Cancelar", // PENDIENTE PASADA DE COPY
  },
  // Entradas a /mi-cuenta desde /guardar-informe y desde el bloque guardar del informe.
  verMisInformes: "Ver mis informes", // PENDIENTE PASADA DE COPY
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
  { label: "Qué sale de nuestros servidores (y qué no)", href: "#anonimizacion" },
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
      "Ninguna forma de preguntar es suficiente por sí sola. Una respuesta puede estar teñida por lo que uno cree que debería contestar, por el día que tuvo o por la palabra exacta que usamos. Al medir cada área de interés con varios tipos de pregunta, el perfil se vuelve más estable.\n\nY cuando las señales no coinciden, también lo decimos. Si tus reacciones a los ambientes de trabajo apuntan a un lugar y tus actividades preferidas a otro, tu informe te lo muestra en vez de esconderlo detrás de un promedio. Esa discrepancia no es un error del test: suele ser la parte más interesante de la conversación.",
  },
  capacidades: {
    titulo: "Cómo medimos para qué tienes facilidad",
    cuerpo:
      "Usamos mini-juegos, pero no cualquier juego. Cada uno está construido sobre un tipo de tarea con décadas de evidencia en psicología cognitiva. Medimos cinco capacidades: razonamiento con patrones, razonamiento numérico, razonamiento espacial, memoria de trabajo, y comprensión y expresión verbal. Están entre las capacidades con mayor respaldo científico como predictores del desempeño académico posterior, y cada una se mide con su propio tipo de ejercicio: no repetimos la misma prueba con distinta cara.\n\nEl formato de juego cumple una función concreta: reduce la ansiedad de examen, que distorsiona los resultados. La tarea de fondo es la que hace la medición.\n\nDos decisiones importantes: el tiempo no te presiona — medimos precisión y nivel alcanzado, no velocidad — y antes de cada juego hay una práctica que no puntúa, para que nadie sea evaluado mientras todavía está entendiendo las instrucciones.\n\nUna última decisión, sobre cómo te mostramos el resultado: no te vamos a dar un porcentaje. Decir '73% en razonamiento espacial' suena preciso y no significa nada mientras no exista una referencia chilena con la cual compararte — y esa referencia es justamente lo que estamos construyendo con los pilotos. Por eso tu informe te muestra bandas: en qué capacidades destacas y en cuáles tienes espacio para desarrollarte. Cuando tengamos normas locales, podremos decirte con precisión cómo te comparas con estudiantes de tu edad, y lo diremos aquí.",
  },
  comprensionExpresion: {
    titulo: "Cómo evaluamos comprensión y expresión",
    cuerpo:
      "Las capacidades verbales no se pueden medir bien con alternativas. Por eso te pedimos escribir con tus palabras, y esa respuesta la evalúa inteligencia artificial aplicando rúbricas diseñadas por profesionales.\n\nEl orden importa: la IA aplica criterios definidos por personas, no improvisa juicios. Evaluamos tres cosas distintas: cómo comprendes un texto, cómo estructuras un argumento y cómo te expresas cuando escribes libremente. Nunca tu opinión, y nunca tu ortografía.\n\nAntes de puntuar, verificamos algo básico que muchos sistemas no verifican: que tu respuesta hable efectivamente del texto que leíste. Un párrafo bien escrito sobre otra cosa no recibe puntaje — te avisamos y puedes intentarlo de nuevo.\n\nCada respuesta la evalúan dos sistemas de inteligencia artificial de forma independiente, y medimos cuánto coinciden entre sí. Cuando difieren, usamos la evaluación más conservadora y marcamos el caso para revisión humana. Ese porcentaje de acuerdo entre evaluadores es una de las métricas que estamos midiendo durante la validación, y la publicaremos cuando tengamos suficientes casos.\n\nDurante esta etapa, además, una parte de las evaluaciones se revisa manualmente para verificar que la corrección automática coincide con la de un evaluador humano.",
  },
  anonimizacion: {
    titulo: "Qué sale de nuestros servidores (y qué no)",
    cuerpo:
      "Para evaluar lo que escribes usamos servicios de inteligencia artificial de terceros. Eso significa que un texto sale de nuestros servidores, y creemos que tienes derecho a saber exactamente qué sale y qué no.\n\nLo único que enviamos es: el texto del ejercicio y tu respuesta, más las instrucciones de evaluación. Nada más. No viaja tu correo, ni tu nombre o apodo, ni tu edad, ni tu curso, ni ningún identificador que permita saber que esa respuesta es tuya. Para el servicio que evalúa, tu texto es un texto sin dueño.\n\nAntes de enviarlo, además, revisamos automáticamente tu respuesta y reemplazamos datos personales que puedas haber escrito sin darte cuenta — un RUT, un teléfono, un correo. El texto original queda solo en nuestra base de datos; el que viaja va limpio. Y te lo pedimos también en pantalla antes de escribir: no incluyas datos personales en tus respuestas.\n\nEl cruce entre tu respuesta y el resto de tu perfil ocurre únicamente en nuestros servidores. El servicio externo devuelve una evaluación sobre un texto anónimo; somos nosotros los que sabemos a quién corresponde.\n\nSi eres apoderado, orientador o directivo y quieres el detalle técnico de qué proveedores usamos y bajo qué condiciones, escríbenos y te lo contamos.",
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
      "No usamos el ejercicio de rotación mental de figuras, aunque es común en pruebas de habilidad espacial. Es la prueba cognitiva con la mayor diferencia por género documentada en la literatura psicológica, y depende de la presión de tiempo para discriminar. Medimos la misma capacidad con ejercicios de plegado de papel, que son igual de válidos y muestran diferencias por género mucho menores. Un instrumento que se aplica a cursos completos de hombres y mujeres no puede permitirse ese sesgo.",
      "No mostramos los ejercicios fuera de la experiencia. Un instrumento que se conoce de antemano deja de medir.",
      "No te decimos 'no sirves para esto'. El resultado abre opciones para explorar; no las cierra.",
      "No pedimos más datos personales de los necesarios para entregarte tu informe.",
    ],
  },
  estadoDesarrollo: {
    titulo: "Dónde estamos hoy",
    cuerpo:
      "Mirai está en desarrollo activo y lo decimos con todas sus letras. La arquitectura del instrumento se construyó sobre marcos con respaldo científico internacional, y estamos en el proceso de validarla con estudiantes chilenos: pilotos en colegios, comparación con instrumentos ya establecidos y construcción de normas locales.\n\nY una cifra que preferimos poner sobre la mesa: una revisión que reunió casi cien años de investigación encontró que los inventarios de intereses aciertan la carrera que la persona finalmente elige alrededor de la mitad de las veces (Hanna y Rounds, Psychological Bulletin). La mitad. Eso significa dos cosas: que estos instrumentos sirven de verdad — mucho más que el azar entre cientos de carreras posibles — y que ninguno, incluido el nuestro, es una bola de cristal. Por eso Mirai entrega caminos para explorar y datos para decidir, no un veredicto.\n\nPublicaremos los avances de ese proceso en esta misma página. Mientras tanto, cada informe declara sus alcances.",
  },
  cierre: {
    probar: "Probar la experiencia",
    probarHref: "/experiencia",
    contacto:
      "¿Eres orientador, docente o directivo y quieres conversar sobre la metodología? Escríbenos a colegios@miraiapp.cl",
    contactoMailto: "mailto:colegios@miraiapp.cl",
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────
// PÁGINA /colegios — Programa de Colegios Fundadores
//
// REGLAS DE COPY (documento maestro + instrucciones del fundador):
//   * Cada cifra va SIEMPRE con su fuente y año. Las que aparecen aquí salen de
//     lib/config/datos-graficos.ts (banco verificado del proyecto) — no se inventa
//     ninguna.
//   * NO se afirma que el instrumento esté validado psicométricamente: se declara
//     que entra a su fase piloto.
//   * NO se promete reducción de deserción ni ningún % de impacto propio.
//   * NO se nombran personas del equipo ni se detallan ítems o algoritmos
//     (prohibidos de la sección 6.5 del documento maestro).
//   * NO hay testimonios, colegios participantes, precios ni resultados de
//     validación, porque todavía no existen.
//   * Español de Chile, tuteo, tono cercano sin ser infantil.
// ─────────────────────────────────────────────────────────────────────────
export const colegios = {
  metadata: {
    titulo: "Programa de Colegios Fundadores — Mirai",
    descripcion:
      "Un diagnóstico vocacional para tu generación completa, en una hora pedagógica. Cada estudiante recibe su informe individual. Buscamos colegios fundadores para el piloto que ayudará a diseñar el futuro reporte generacional.",
  },

  hero: {
    etiqueta: "Programa de Colegios Fundadores",
    titulo: "Tu generación completa, orientada en una hora pedagógica.",
    bajada:
      "Mirai es un diagnóstico vocacional que cada estudiante vive dentro de una hora pedagógica. Al terminar, recibe un informe individual. El piloto con colegios fundadores es lo que nos permitirá diseñar el futuro reporte generacional, que todavía no está operativo.",
    cta: "Conversemos sobre tu colegio",
    ctaSecundario: "Ver cómo funciona",
    // Nota de honestidad exigida: el instrumento NO está validado todavía.
    notaPiloto:
      "Estamos en fase piloto. No vamos a decirte que somos un instrumento validado, porque todavía no lo somos: eso se gana con datos, y los estamos empezando a recoger.",
  },

  // Sección 2 — El problema. SOLO cifras ya verificadas en el proyecto.
  problema: {
    titulo: "El problema que conocemos de memoria",
    bajada:
      "No hace falta convencer a nadie de que orientar a un curso completo es difícil. Lo que sí conviene es mirar el costo de hacerlo a ciegas.",
    cifras: [
      {
        valor: "25%",
        texto: "de los estudiantes deja su carrera durante el primer año.",
        fuente: "SIES, cohorte 2021",
      },
      {
        valor: "+112%",
        texto:
          "ganan quienes completan educación superior frente a quienes solo terminan la enseñanza media. La decisión vale, y por eso importa cómo se toma.",
        fuente: "OCDE, Education at a Glance 2024/2025",
      },
      {
        valor: "264",
        texto:
          "carreras con datos oficiales de empleabilidad e ingresos publicados para cruzar con cada perfil. Cuando una carrera no tiene datos oficiales, el informe lo declara en vez de estimarlos.",
        fuente: "mifuturo.cl / SIES",
      },
    ],
    cierre:
      "Un orientador con 40 estudiantes y una hora a la semana no puede conocer la combinación de intereses, capacidades y mercado de cada uno. No es un problema de dedicación: es un problema de escala.",
  },

  // Sección 3 — Qué vive cada estudiante.
  estudiante: {
    titulo: "Qué vive cada estudiante",
    bajada: "La experiencia completa, sin registro previo y sin costo para el estudiante.",
    pasos: [
      {
        titulo: "Responde sobre situaciones reales de trabajo",
        texto:
          "Un bloque de estímulos audiovisuales: lugares de trabajo chilenos, con su sonido y su contexto. No son preguntas de \"¿te gusta la matemática?\".",
      },
      {
        titulo: "Juega cuatro juegos de capacidades",
        texto:
          "Cuatro juegos breves de razonamiento —patrones, series, plegado de papel y secuencias—, no un examen. Miden cómo piensa, no cuánto sabe.",
      },
      {
        titulo: "Responde tres tareas escritas",
        texto:
          "Tres tareas breves de comprensión, argumentación y expresión. Miden cómo entiende y cómo argumenta, no su ortografía ni su opinión.",
      },
      {
        titulo: "Recibe su informe individual",
        texto:
          "Un perfil con sus intereses priorizados, lo que muestra cada capacidad y una lista de caminos concretos para explorar, cruzada con datos oficiales de empleabilidad e ingresos cuando están disponibles.",
      },
    ],
    nota:
      "El informe no es un veredicto: entrega caminos por explorar y los datos para decidirlos. Ningún estudiante recibe un \"no sirves para esto\".",
  },

  // Sección 4 — Qué recibe el colegio.
  colegio: {
    titulo: "Qué recibe tu colegio",
    bajada: "Tres entregables, en el mismo orden en que los vas a usar.",
    entregables: [
      {
        titulo: "Aplicación acompañada",
        texto:
          "Definimos juntos la hora pedagógica, te entregamos las instrucciones para los estudiantes y resolvemos dudas antes de empezar. No te dejamos sola con un link.",
      },
      {
        titulo: "Resultados individuales",
        texto:
          "Cada estudiante recibe su informe. Tú recibes orientaciones para leerlos en conjunto y detectar a quién conviene acompañar más de cerca.",
      },
      {
        titulo: "Diseño del futuro reporte generacional",
        texto:
          "Todavía no está operativo. El piloto con colegios fundadores es lo que nos permitirá diseñarlo: qué mirar de un curso completo, cómo presentarlo y para qué lo usaría tu equipo de orientación. Lo construimos con ustedes, no antes de ustedes.",
      },
    ],
    // Honestidad sobre el estado del reporte agregado.
    notaAgregado:
      "Declaramos el estado real: el informe individual del estudiante está operativo; el reporte generacional para el colegio todavía no existe. Los colegios fundadores del piloto son quienes lo van a diseñar con nosotros.",
  },

  // Sección 5 — Qué significa ser Colegio Fundador.
  fundador: {
    titulo: "Qué significa ser Colegio Fundador",
    bajada:
      "No es un descuento ni un contrato. Es entrar temprano y ayudar a definir qué construimos.",
    compromisos: [
      {
        titulo: "Participar en el piloto",
        texto:
          "Aplicar la experiencia con una o más generaciones durante el período de piloto, con el acompañamiento descrito arriba.",
      },
      {
        titulo: "Aportar retroalimentación",
        texto:
          "Contarnos qué funcionó en tu contexto y qué no: la hora pedagógica, las instrucciones, la lectura de los informes, lo que le faltó a tu equipo.",
      },
      {
        titulo: "Ayudar a validar la herramienta",
        texto:
          "Permitirnos recoger datos del piloto para el proceso de validación en curso. Ese es el aporte más valioso: sin colegios, no hay normas chilenas.",
      },
    ],
    cierre:
      "A cambio, tu colegio entra antes que nadie, participa en las decisiones de producto y queda en el grupo que definió el instrumento.",
  },

  // Sección 6 — Salvaguardas.
  salvaguardas: {
    titulo: "Lo que no vas a tener que preguntarnos",
    bajada: "Seis decisiones que tomamos antes de que las pidas, porque nos parecen lo mínimo.",
    items: [
      {
        titulo: "Independencia de las universidades",
        texto:
          "Mirai no pertenece a ninguna universidad ni recibe pago por orientar hacia una institución. Es un requisito del producto, no una promesa de marketing.",
      },
      {
        titulo: "Datos de prueba, identificados",
        texto:
          "Las sesiones del modo prueba quedan marcadas con una bandera propia en la base de datos, de modo que pueden excluirse de cualquier análisis. La exclusión es una decisión explícita de cada consulta, no un automatismo: la marca es lo que la hace posible.",
      },
      {
        titulo: "Aislamiento por RLS",
        texto:
          "La base de datos aplica aislamiento a nivel de fila: cada sesión solo puede leer y escribir sus propios datos. Un estudiante no puede ver el informe de otro, y nosotros no exponemos datos entre sesiones.",
      },
      {
        titulo: "Lenguaje no determinista",
        texto:
          "No decimos \"deberías estudiar esto\". Decimos qué muestra el perfil y qué caminos valen la pena explorar. Una herramienta de orientación que cierra puertas no está orientando.",
      },
      {
        titulo: "Metodología transparente",
        texto:
          "El detalle de cómo medimos — qué constructos, con qué tipo de tareas y con qué fuentes — está publicado y a un clic de distancia.",
        enlace: "/metodologia",
        enlaceTexto: "Ver la metodología",
      },
      {
        titulo: "Estado declarado del instrumento",
        texto:
          "Estamos en fase piloto, no validados. Preferimos decirlo en la primera conversación antes de que lo preguntes en la tercera.",
      },
    ],
  },

  // Sección 7 — Una aplicación piloto en una hora pedagógica.
  horaPedagogica: {
    titulo: "Cómo se ve una aplicación piloto en una hora pedagógica",
    bajada:
      "El guion tal como lo pensamos. Se ajusta a tu calendario y a cómo se conectan tus estudiantes.",
    // El itinerario DEBE cerrar dentro de una hora pedagógica (45 min de clase).
    // Los tres bloques suman exactamente 45 minutos: 5 + 35 + 5.
    pasos: [
      {
        momento: "Antes",
        titulo: "Preparación",
        texto:
          "Definimos fecha y curso con tu equipo. Te entregamos las instrucciones para estudiantes y el texto para avisar a las familias.",
      },
      {
        momento: "0–5 min",
        titulo: "Contexto y consentimiento",
        texto:
          "Leemos en conjunto para qué es, cuánto dura y qué se hace con los datos. Quien no quiera participar, no participa.",
      },
      {
        momento: "5–40 min",
        titulo: "La experiencia",
        texto:
          "Cada estudiante avanza a su ritmo desde su dispositivo. El instrumento es el mismo para todos, así que la comparación tiene sentido.",
      },
      {
        momento: "40–45 min",
        titulo: "Cierre y explicación del informe",
        texto:
          "Quien terminó explora su informe; el grupo cierra con una lectura breve de cómo se lee un perfil y qué hacer con él. No alcanza para comentar caso por caso: eso queda para la hora de orientación.",
      },
      {
        momento: "Después",
        titulo: "Devolución al colegio",
        texto:
          "Nos cuentas cómo funcionó en tu contexto y acordamos el siguiente curso o generación. Ese intercambio es parte del programa.",
      },
    ],
    nota:
      "El itinerario cierra dentro de los 45 minutos de la clase. En el piloto hay un estudiante que avanza lento, una conexión que se cae y un timbre que suena antes: lo conversamos con tu equipo y lo dejamos listo.",
  },

  // Sección 8 — Preguntas frecuentes.
  faq: [
    {
      pregunta: "¿A qué cursos se puede aplicar?",
      respuesta:
        "A estudiantes de enseñanza media, y con más sentido en 3° y 4° medio, que es cuando la decisión está encima. La experiencia está escrita para 16 a 18 años.",
    },
    {
      pregunta: "¿Cuánto dura y qué necesita un estudiante para hacerla?",
      respuesta:
        "La experiencia completa cabe dentro de una hora pedagógica: aproximadamente 30 a 35 minutos de trabajo del estudiante, más el contexto inicial y el cierre. Necesita un dispositivo con navegador, y audífonos si quiere escuchar los ambientes. Funciona en computador, tablet y celular, aunque recomendamos pantallas grandes para los juegos de capacidades.",
    },
    {
      pregunta: "¿Pide datos personales a los estudiantes?",
      respuesta:
        "No pide nombre, RUT ni correo para funcionar. La sesión se identifica con un código anónimo. Si el estudiante quiere guardar su informe para después, puede dejar un correo de forma voluntaria y siempre puede no hacerlo.",
    },
    {
      pregunta: "¿Los resultados se pueden usar para selección o admisión?",
      respuesta:
        "No. Mirai es una herramienta de orientación, no un instrumento de selección. Sus resultados describen preferencias y desempeño en tareas, no aptitudes certificadas, y no están diseñados para decidir quién entra a un programa.",
    },
    {
      pregunta: "¿El instrumento está validado psicométricamente?",
      respuesta:
        "Todavía no, y preferimos que lo sepas antes de cualquier conversación comercial. La arquitectura se construyó sobre marcos con respaldo científico internacional, y estamos entrando a la fase piloto para validarla con estudiantes chilenos y construir normas locales. Antes de venderlo como validado, preferimos que un colegio lo conozca por dentro.",
    },
    {
      pregunta: "¿Qué obtiene el colegio a cambio de participar?",
      respuesta:
        "Acceso temprano al programa, acompañamiento en la aplicación e influencia directa sobre qué construimos después. Buscamos colegios que quieran moldear la herramienta, no solo aplicarla.",
    },
    {
      pregunta: "¿Qué pasa con los datos de los estudiantes?",
      respuesta:
        "Cada sesión solo puede leer y escribir sus propios datos por aislamiento a nivel de fila, y los informes se entregan de forma individual. No vendemos información ni la compartimos con universidades. El detalle está en la política de privacidad.",
      enlace: "/privacidad",
      enlaceTexto: "Ver política de privacidad",
    },
    {
      pregunta: "¿Con quién hablo para coordinar una aplicación?",
      respuesta:
        "Escríbenos a colegios@miraiapp.cl con el nombre del colegio, los cursos que te interesan y el rango de fechas. Respondemos con una propuesta concreta para tu calendario.",
    },
  ],

  // Sección 9 — CTA principal.
  cta: {
    titulo: "Conversemos sobre tu colegio",
    bajada:
      "Cuéntanos qué curso tienes en mente, cuántos estudiantes son y en qué fechas podrías aplicar. Te respondemos con una propuesta para tu calendario.",
    boton: "Escribir a colegios@miraiapp.cl",
    email: "colegios@miraiapp.cl",
    // Asunto y cuerpo prellenados: el mailto transporta el contexto mínimo.
    asunto: "Colegio Fundador — consulta",
    cuerpo:
      "Hola, equipo de Mirai:\n\nLes escribo desde el colegio [nombre del colegio].\n\nCurso(s) de interés: [3° / 4° medio]\nCantidad aproximada de estudiantes: [N]\nFechas posibles para aplicar: [rango]\n\nMe gustaría saber más del Programa de Colegios Fundadores.\n\nSaludos,",
    alternativa:
      "Si prefieres, escríbenos directamente y te contamos el estado real del proyecto antes de agendar nada.",
  },
} as const;

/** mailto con asunto y cuerpo prellenados para el CTA de /colegios. */
export function mailtoColegios(): string {
  const asunto = encodeURIComponent(colegios.cta.asunto);
  const cuerpo = encodeURIComponent(colegios.cta.cuerpo);
  return `mailto:${colegios.cta.email}?subject=${asunto}&body=${cuerpo}`;
}
