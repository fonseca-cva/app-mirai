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
  subtitulo: "Descubre qué estudiar jugando. Basado en evidencia y datos reales de Chile.", // PENDIENTE PASADA DE COPY
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
      texto: "Mini-juegos que miden tus capacidades reales.", // PENDIENTE PASADA DE COPY
    },
    {
      titulo: "Reacciona", // PENDIENTE PASADA DE COPY
      texto: "Contextos de trabajo reales: descubre qué te atrae de verdad.", // PENDIENTE PASADA DE COPY
    },
    {
      titulo: "Descubre", // PENDIENTE PASADA DE COPY
      texto: "Tu informe cruza quién eres con datos reales de empleo e ingresos.", // PENDIENTE PASADA DE COPY
    },
  ],
};

// Corrección D14: la portada habla de la experiencia completa (~25 min), no de este bloque (~6 min).
export const teaserExperiencia = {
  frase: "La experiencia completa toma unos 25 minutos. Sin respuestas correctas. Solo tú.", // PENDIENTE PASADA DE COPY
  cta: "Probar el Bloque de Gustos", // PENDIENTE PASADA DE COPY
};

export const teaserInforme = {
  titulo: "El informe", // PENDIENTE PASADA DE COPY
  bullets: [
    "Tu perfil de intereses", // PENDIENTE PASADA DE COPY
    "Tus fortalezas", // PENDIENTE PASADA DE COPY
    "Caminos concretos, con datos de empleabilidad e ingresos (fuente: mifuturo.cl)", // PENDIENTE PASADA DE COPY
  ],
  mencion: "Versión gratuita y versión profunda.", // PENDIENTE PASADA DE COPY
};

export const respaldo = {
  titulo: "¿Por qué confiar en Mirai?", // PENDIENTE PASADA DE COPY
  viñetas: [
    "Modelo de tres pilares: lo que te gusta + para qué eres bueno/a + cómo está el mercado.", // PENDIENTE PASADA DE COPY
    "Construido sobre metodologías validadas internacionalmente en medición de intereses y capacidades.", // PENDIENTE PASADA DE COPY
    "Datos laborales de fuentes oficiales chilenas.", // PENDIENTE PASADA DE COPY
    "Datos personales: pedimos lo mínimo, jamás vendemos información, cumplimiento de la ley chilena de protección de datos.", // PENDIENTE PASADA DE COPY
  ],
  cifra: "1 de cada 4 estudiantes abandona su carrera el primer año (SIES). Mirai existe para cambiar eso.", // PENDIENTE PASADA DE COPY
};

export const paraColegios = {
  titulo: "Para colegios", // PENDIENTE PASADA DE COPY
  texto: "Tu generación completa, evaluada en una hora pedagógica. Reporte agregado para tu equipo de orientación.", // PENDIENTE PASADA DE COPY
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
  texto: "Imagina que es tu lunes a las 9 AM. Responde rápido, con la guata: no hay respuestas correctas.", // PENDIENTE PASADA DE COPY
  nota: "Este primer bloque toma unos 6 minutos · puedes pausar", // PENDIENTE PASADA DE COPY
  cta: "Empezar", // PENDIENTE PASADA DE COPY
};

export const experienciaTarjeta = {
  botones: [
    { valor: 0, label: "No es para mí" }, // PENDIENTE PASADA DE COPY
    { valor: 1, label: "Podría ser" }, // PENDIENTE PASADA DE COPY
    { valor: 2, label: "Me atrae" }, // PENDIENTE PASADA DE COPY
  ] as const,
  pausa: "Pausar", // PENDIENTE PASADA DE COPY
  reanudar: "Seguir", // PENDIENTE PASADA DE COPY
};

export const resultadoParcial = {
  titulo: "Este es tu primer pliegue", // PENDIENTE PASADA DE COPY
  subtitulo: "Tus tres dimensiones más marcadas:", // PENDIENTE PASADA DE COPY
  cierre: "Esto es solo tu primer pliegue. Los mini-juegos de capacidades y tu informe completo: muy pronto.", // PENDIENTE PASADA DE COPY
  cta: "Avísame cuando esté listo", // PENDIENTE PASADA DE COPY
  mailto: "mailto:hola@somosmirai.cl?subject=Avísenme%20cuando%20esté%20listo",
};

// Banco de lecturas amables por dimensión — sección 7.4. Se usa la de la dimensión top 1.
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
