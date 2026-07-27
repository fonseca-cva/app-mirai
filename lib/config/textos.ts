// Todos los textos del sitio — sección 2 de la spec ("los textos NO van hardcodeados en componentes").
// Español de Chile neutro, tuteo, sin jerga forzada. Sin lorem ipsum.
// PENDIENTE PASADA DE COPY: todo el copy de este archivo es provisorio (instrucciones técnicas, no tono de marca).
// El dueño del proyecto redactará el copy final — no reescribir por cuenta propia.

export const nav = {
  logo: "Mirai", // PENDIENTE PASADA DE COPY
  anclas: [
    { label: "Cómo funciona", href: "#como-funciona" }, // PENDIENTE PASADA DE COPY
    { label: "Respaldo", href: "#respaldo" }, // PENDIENTE PASADA DE COPY
    { label: "Colegios", href: "#colegios" }, // PENDIENTE PASADA DE COPY
  ],
  cta: "Descúbrelo gratis", // PENDIENTE PASADA DE COPY
};

export const hero = {
  titular: "¿Y tú, qué forma tienes?", // PENDIENTE PASADA DE COPY
  subtitulo:
    "Un juego de 25 minutos que cruza lo que te gusta y lo que se te da con los sueldos y la pega reales de cada carrera. No es horóscopo: son datos.",
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
  frase: "25 minutos. Sin paja: lo que te gusta, lo que se te da y lo que paga.",
  cta: "Probar el Bloque de Gustos", // PENDIENTE PASADA DE COPY
};

export const teaserInforme = {
  titulo: "Un informe que sí sirve",
  bullets: [
    "Nada de 'eres un espíritu libre'. Tu perfil de intereses y capacidades, cruzado con empleabilidad e ingresos reales de cada carrera e institución (datos de mifuturo.cl, construidos con declaraciones reales al SII — no con encuestas).",
    "Mirai no pertenece a ninguna universidad. No te vamos a recomendar 'casualmente' la carrera que a alguien le conviene venderte. Te mostramos tus opciones — todas.",
  ],
  mencion: "Versión gratuita y versión profunda.", // PENDIENTE PASADA DE COPY
};

export const respaldo = {
  titulo: "¿Por qué confiar en Mirai?", // PENDIENTE PASADA DE COPY
  viñetas: [
    "Los datos de sueldos y empleabilidad vienen de mifuturo.cl (Mineduc/SIES): 1.740 combinaciones de carrera e institución, construidas con datos reales del SII.",
    "Modelo de tres pilares: lo que te gusta + para qué eres bueno/a + cómo está el mercado.", // PENDIENTE PASADA DE COPY
    "Construido sobre metodologías validadas internacionalmente en medición de intereses y capacidades.", // PENDIENTE PASADA DE COPY
    "Datos laborales de fuentes oficiales chilenas.", // PENDIENTE PASADA DE COPY
    "Datos personales: pedimos lo mínimo, jamás vendemos información, cumplimiento de la ley chilena de protección de datos.", // PENDIENTE PASADA DE COPY
  ],
  cifra:
    "Elegir carrera a ciegas sale caro. Entre un 24% y un 29% de los estudiantes deja su carrera durante el primer año (SIES, según cohorte), y la falta de orientación es una de las causas que los especialistas más repiten.",
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
  mailto: "mailto:colegios@somosmirai.cl",
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
  mailtoDestino: "hola@somosmirai.cl",
};

export const footer = {
  copyright: "© Mirai 2026 · Proyecto chileno", // PENDIENTE PASADA DE COPY
  enlaces: [
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
  mailto: "mailto:hola@somosmirai.cl?subject=Avísenme%20cuando%20esté%20listo",
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

export const bloqueRotacion = {
  titulo: "Pliegues en el espacio", // PENDIENTE PASADA DE COPY
  fraseFuerza: "Este juego mira cómo giras figuras en tu cabeza.", // ITERACIÓN 2: frase de fortaleza
  instrucciones: "Mira la pieza de referencia. Luego toca la alternativa que muestra cómo queda al girarla o desplegarla.", // ITERACIÓN 2: reescrito
  practicaEtiqueta: "Práctica (no puntúa)", // PENDIENTE PASADA DE COPY
  comenzarCta: "Empezar los desafíos de verdad", // ITERACIÓN 3
  // ITERACIÓN 2 — tutorial
  tutorial: {
    demoEtiqueta: "Así se juega",
    demoTitulo: "Mira cómo la pieza gira sin cambiar de forma",
    demoSaltar: "Ya lo conozco",
    // ITERACIÓN 3
    propositoCta: "Ver cómo funciona",
    demoContinuarCta: "Ya entendí, quiero practicar",
    practicaAcierto: "Eso es. Así funciona.",
    practicaErrorPista: (angulo: number) => `La pieza gira ${angulo}° manteniendo su forma.`,
    practicaFalloMensaje: "No importa, es práctica. Mira por qué.",
    practicaFeedback: "La pieza rota pero no se deforma. Compara la orientación de cada alternativa con la referencia.",
    // Consigna fija para ítems de tipo "plegado" — Anexo 2 al bloqueante: sin esta narrativa
    // explícita, el ítem mide familiaridad previa con el ejercicio, no razonamiento espacial.
    consignaPlegado: "El papel se dobla por la línea, se perfora doblado, y luego se abre. ¿Cómo queda?",
    plegadoPanelDoblez: "1. Se dobla por la línea",
    plegadoPanelPerforado: "2. Se perfora doblado — atraviesa todas las capas",
    plegadoPanelPregunta: "3. ¿Cómo queda al desplegarlo?",
    transicion: "Listo. Ahora van los de verdad: 10 desafíos, sin apuro.",
    ayudaResumen: [
      "Mira la pieza de referencia (arriba).",
      "Imáginala girando en tu cabeza.",
      "Toca la alternativa que coincide con la pieza ya girada o desplegada.",
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
    siguienteCta: "Terminar", // PENDIENTE PASADA DE COPY
  },
  evaluando: "Evaluando tu respuesta...", // PENDIENTE PASADA DE COPY
  error: "No pudimos evaluar esta respuesta. Puedes seguir igual.", // PENDIENTE PASADA DE COPY
  reintentar: "Reintentar", // PENDIENTE PASADA DE COPY
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
  saltarAnimacion: "Saltar animación", // PENDIENTE PASADA DE COPY
  seccionIntereses: "Tu perfil de intereses", // PENDIENTE PASADA DE COPY
  etiquetaIntereses: "Top dimensiones", // PENDIENTE PASADA DE COPY
  seccionCapacidades: "Tus capacidades", // PENDIENTE PASADA DE COPY
  etiquetaCapacidades: (label: string) => `${label}:`, // PENDIENTE PASADA DE COPY
  leyendaCapacidades: {
    patrones: "Patrones",
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
  cierre:
    "Este es tu primer mapa, no tu destino. La versión profunda — carreras concretas, datos de empleo e ingresos reales, y contenido para explorar cada camino — viene pronto.", // PENDIENTE PASADA DE COPY
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
