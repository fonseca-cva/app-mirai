// CONTENIDO PROVISORIO — pendiente de revisión metodológica
// 24 contextos laborales, 8 dimensiones x 3. Sección 7.3 de la spec.

export type DimensionCodigo =
  | "tec"
  | "cie"
  | "cre"
  | "soc"
  | "sal"
  | "ges"
  | "dat"
  | "nat";

export interface Contexto {
  id: string;
  dimension: DimensionCodigo;
  nombre: string;
  descripcion: string;
  icono: DimensionCodigo;
}

export const dimensiones: Record<DimensionCodigo, string> = {
  tec: "Técnico-Manual",
  cie: "Científico-Analítico",
  cre: "Creativo",
  soc: "Social-Humano",
  sal: "Salud y Cuidado",
  ges: "Gestión y Emprendimiento",
  dat: "Datos y Organización",
  nat: "Naturaleza y Terreno",
};

export const contextos: Contexto[] = [
  // tec — Técnico-Manual
  {
    id: "tec-01",
    dimension: "tec",
    nombre: "Capataz de obra",
    descripcion:
      "Llegas a la obra a las 7 AM: el hormigón se seca rápido y no hay margen de error. Hay ruido de máquinas todo el día y el clima puede obligarte a cambiar el plan sobre la marcha.",
    icono: "tec",
  },
  {
    id: "tec-02",
    dimension: "tec",
    nombre: "Mecánico automotriz",
    descripcion:
      "Un auto llega con una falla que nadie más pudo resolver. Media hora después tienes las manos llenas de grasa y el dueño espera una respuesta clara, no una excusa.",
    icono: "tec",
  },
  {
    id: "tec-03",
    dimension: "tec",
    nombre: "Electricista industrial",
    descripcion:
      "Revisas tableros eléctricos en una planta que no puede detenerse. Un error de cálculo puede cortar la producción de todo el turno.",
    icono: "tec",
  },

  // cie — Científico-Analítico
  {
    id: "cie-01",
    dimension: "cie",
    nombre: "Analista de laboratorio clínico",
    descripcion:
      "Procesas decenas de muestras antes del mediodía. La precisión importa más que la velocidad, aunque el sistema te pida ambas.",
    icono: "cie",
  },
  {
    id: "cie-02",
    dimension: "cie",
    nombre: "Investigador/a de postgrado",
    descripcion:
      "Repites el mismo experimento por tercera vez porque los datos no cuadran. Nadie te aplaude por eso, pero es el trabajo.",
    icono: "cie",
  },
  {
    id: "cie-03",
    dimension: "cie",
    nombre: "Control de calidad en planta de alimentos",
    descripcion:
      "Revisas si un lote cumple la norma o se bota. La decisión es tuya y hay plata real de por medio.",
    icono: "cie",
  },

  // cre — Creativo
  {
    id: "cre-01",
    dimension: "cre",
    nombre: "Diseñador/a en estudio de branding",
    descripcion:
      "El cliente pide 'algo más wow' sin decir qué significa eso. Tienes hasta el viernes para traducir esa frase en algo real.",
    icono: "cre",
  },
  {
    id: "cre-02",
    dimension: "cre",
    nombre: "Asistente de rodaje audiovisual",
    descripcion:
      "La luz se va a ir en 40 minutos y todavía falta una escena. Todos miran hacia ti para resolver.",
    icono: "cre",
  },
  {
    id: "cre-03",
    dimension: "cre",
    nombre: "Arquitecto/a en estudio pequeño",
    descripcion:
      "Dibujas la misma planta por quinta vez porque el terreno tiene una pendiente que nadie midió bien.",
    icono: "cre",
  },

  // soc — Social-Humano
  {
    id: "soc-01",
    dimension: "soc",
    nombre: "Profesor/a de enseñanza media",
    descripcion:
      "Cuarenta minutos, treinta y cinco estudiantes, uno de ellos no quiere estar ahí. Tienes que llegar a todos, aunque sea a algunos un poco.",
    icono: "soc",
  },
  {
    id: "soc-02",
    dimension: "soc",
    nombre: "Asistente social en municipalidad",
    descripcion:
      "La persona frente a ti trae un problema que no se resuelve con un formulario. Escuchar bien es la mitad del trabajo.",
    icono: "soc",
  },
  {
    id: "soc-03",
    dimension: "soc",
    nombre: "Recursos Humanos en empresa mediana",
    descripcion:
      "Median dos conflictos de equipo en la misma semana. No hay manual que cubra todos los casos.",
    icono: "soc",
  },

  // sal — Salud y Cuidado
  {
    id: "sal-01",
    dimension: "sal",
    nombre: "Médico/a en consultorio de atención primaria",
    descripcion:
      "Tienes ocho minutos por paciente y el décimo de la mañana llegó con algo que no estaba en la ficha.",
    icono: "sal",
  },
  {
    id: "sal-02",
    dimension: "sal",
    nombre: "Kinesiólogo/a en clínica",
    descripcion:
      "La misma sesión, distinto cuerpo, distinto dolor. Repetir el ejercicio con paciencia, otra vez.",
    icono: "sal",
  },
  {
    id: "sal-03",
    dimension: "sal",
    nombre: "Cuidador/a en residencia de adultos mayores",
    descripcion:
      "El turno de la tarde es el más pesado: rutinas, remedios, y a veces solo hacer compañía.",
    icono: "sal",
  },

  // ges — Gestión y Emprendimiento
  {
    id: "ges-01",
    dimension: "ges",
    nombre: "Fundador/a de startup en etapa temprana",
    descripcion:
      "La plata alcanza para dos meses más si no cambia nada. Y algo siempre cambia.",
    icono: "ges",
  },
  {
    id: "ges-02",
    dimension: "ges",
    nombre: "Auditor/a en oficina de auditoría",
    descripcion:
      "Revisas los números de una empresa que no sabía que los tenía mal. Nadie te invita a la fiesta, pero todos confían en tu informe.",
    icono: "ges",
  },
  {
    id: "ges-03",
    dimension: "ges",
    nombre: "Dueño/a de local gastronómico",
    descripcion:
      "El proveedor llegó tarde y el local abre en una hora. Improvisas el menú del día con lo que hay.",
    icono: "ges",
  },

  // dat — Datos y Organización
  {
    id: "dat-01",
    dimension: "dat",
    nombre: "Analista de datos en retail",
    descripcion:
      "Un Excel con treinta mil filas y una pregunta simple: ¿por qué bajaron las ventas en la región sur?",
    icono: "dat",
  },
  {
    id: "dat-02",
    dimension: "dat",
    nombre: "Encargado/a de bodega y logística",
    descripcion:
      "El camión sale a las 6 AM con o sin el pedido completo. El orden de hoy define el error de mañana.",
    icono: "dat",
  },
  {
    id: "dat-03",
    dimension: "dat",
    nombre: "Administración de una pyme",
    descripcion:
      "Facturas, agenda, pagos: nada es urgente por separado, todo es urgente junto.",
    icono: "dat",
  },

  // nat — Naturaleza y Terreno
  {
    id: "nat-01",
    dimension: "nat",
    nombre: "Trabajador/a de packing agrícola",
    descripcion:
      "La fruta no espera: si no se envasa hoy, se pierde. El calor y el ritmo no bajan hasta marzo.",
    icono: "nat",
  },
  {
    id: "nat-02",
    dimension: "nat",
    nombre: "Guardaparque en zona silvestre",
    descripcion:
      "Caminas seis kilómetros para revisar un sendero después de la lluvia. El teléfono no tiene señal, y está bien así.",
    icono: "nat",
  },
  {
    id: "nat-03",
    dimension: "nat",
    nombre: "Ingeniero/a forestal en terreno",
    descripcion:
      "Mides árboles bajo el sol de las once. Los datos de hoy definen un plan de manejo a diez años.",
    icono: "nat",
  },
];
