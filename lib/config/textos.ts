// Todos los textos del sitio — sección 2 de la spec ("los textos NO van hardcodeados en componentes").
// Español de Chile neutro, tuteo, sin jerga forzada. Sin lorem ipsum.

export const nav = {
  logo: "Mirai",
  anclas: [
    { label: "Cómo funciona", href: "#como-funciona" },
    { label: "Respaldo", href: "#respaldo" },
    { label: "Colegios", href: "#colegios" },
  ],
  cta: "Descúbrelo gratis",
};

export const hero = {
  titular: "¿Y tú, qué forma tienes?",
  subtitulo: "Descubre qué estudiar jugando. Basado en evidencia y datos reales de Chile.",
  cta: "Descúbrelo gratis",
};

export const comoFunciona = {
  titulo: "Cómo funciona",
  tarjetas: [
    {
      titulo: "Juega",
      texto: "Mini-juegos que miden tus capacidades reales.",
    },
    {
      titulo: "Reacciona",
      texto: "Contextos de trabajo reales: descubre qué te atrae de verdad.",
    },
    {
      titulo: "Descubre",
      texto: "Tu informe cruza quién eres con datos reales de empleo e ingresos.",
    },
  ],
};

export const teaserExperiencia = {
  frase: "25 minutos. Sin respuestas correctas. Solo tú.",
  cta: "Probar el Bloque de Gustos",
};

export const teaserInforme = {
  titulo: "El informe",
  bullets: [
    "Tu perfil de intereses",
    "Tus fortalezas",
    "Caminos concretos, con datos de empleabilidad e ingresos (fuente: mifuturo.cl)",
  ],
  mencion: "Versión gratuita y versión profunda.",
};

export const respaldo = {
  titulo: "¿Por qué confiar en Mirai?",
  viñetas: [
    "Modelo de tres pilares: lo que te gusta + para qué eres bueno/a + cómo está el mercado.",
    "Construido sobre metodologías validadas internacionalmente en medición de intereses y capacidades.",
    "Datos laborales de fuentes oficiales chilenas.",
    "Datos personales: pedimos lo mínimo, jamás vendemos información, cumplimiento de la ley chilena de protección de datos.",
  ],
  cifra: "1 de cada 4 estudiantes abandona su carrera el primer año (SIES). Mirai existe para cambiar eso.",
};

export const paraColegios = {
  titulo: "Para colegios",
  texto: "Tu generación completa, evaluada en una hora pedagógica. Reporte agregado para tu equipo de orientación.",
  cta: "Conversemos",
  mailto: "mailto:colegios@somosmirai.cl",
};

export const contacto = {
  titulo: "Contacto",
  campos: {
    nombre: "Nombre",
    correo: "Correo",
    motivo: "Motivo",
    motivoOpciones: [
      { value: "estudiante-apoderado", label: "Estudiante o apoderado" },
      { value: "colegio", label: "Colegio" },
      { value: "otro", label: "Otro" },
    ],
    mensaje: "Mensaje",
  },
  submit: "Enviar",
  mailtoDestino: "hola@somosmirai.cl",
};

export const footer = {
  copyright: "© Mirai 2026 · Proyecto chileno",
  enlaces: [
    { label: "Términos", href: "/terminos" },
    { label: "Privacidad", href: "/privacidad" },
  ],
};

export const paginaEnConstruccion = {
  titulo: "En construcción",
  texto:
    "Estamos redactando esta página con el mismo cuidado que le ponemos al resto de Mirai. Vuelve pronto.",
};

export const experienciaIntro = {
  titulo: "Vas a ver 24 lugares de trabajo reales.",
  texto: "Imagina que es tu lunes a las 9 AM. Responde rápido, con la guata: no hay respuestas correctas.",
  nota: "≈ 6 minutos · puedes pausar",
  cta: "Empezar",
};

export const experienciaTarjeta = {
  botones: [
    { valor: 0, label: "No es para mí" },
    { valor: 1, label: "Podría ser" },
    { valor: 2, label: "Me atrae" },
  ] as const,
  pausa: "Pausar",
  reanudar: "Seguir",
};

export const resultadoParcial = {
  titulo: "Este es tu primer pliegue",
  subtitulo: "Tus tres dimensiones más marcadas:",
  cierre: "Esto es solo tu primer pliegue. Los mini-juegos de capacidades y tu informe completo: muy pronto.",
  cta: "Avísame cuando esté listo",
  mailto: "mailto:hola@somosmirai.cl?subject=Avísenme%20cuando%20esté%20listo",
};

// Banco de lecturas amables por dimensión — sección 7.4. Se usa la de la dimensión top 1.
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
