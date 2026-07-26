// CONTENIDO PROVISORIO — pendiente de firma metodológica
// 24 contextos laborales, 8 dimensiones x 3. Sección 7.3 de la spec.
// ITERACIÓN 2 (Bloque A): cada contexto separa "escena" (sensorial, qué se ve/oye/siente)
// de "tarea" (qué hace la gente ahí un lunes 9 AM) + 3 bullets para el expandible
// "¿Qué se hace aquí?" (tareas típicas, con quién se trabaja, qué se produce).
// TODO FASE VIDEO: escenaId apunta a un diorama SVG; se reemplazará por clip de 8-15s
// filmado en locación real cuando exista presupuesto de producción.

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
  /** Línea sensorial (cursiva): qué se ve/oye/siente en el lugar. */
  escena: string;
  /** Línea de tarea: qué está haciendo la gente ahí un lunes 9 AM. */
  tarea: string;
  /** 3 bullets del expandible "¿Qué se hace aquí?": tareas típicas, con quién, qué se produce. */
  bullets: [string, string, string];
  icono: DimensionCodigo;
  /** Id de diorama SVG (components/origami/EscenaContexto.tsx). Si no existe, se usa IconoContexto. */
  escenaId?: string;
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
    escena: "Ruido de máquinas todo el día, polvo, radio a todo volumen. El hormigón no espera.",
    tarea: "Llegas a las 7 AM y decides el plan del día, aunque el clima lo cambie a mitad de jornada.",
    bullets: [
      "Coordina cuadrillas, revisa avance y ajusta el plan cuando algo no calza.",
      "Trabaja con maestros, jornaleros y el ingeniero a cargo del proyecto.",
      "Levanta edificios y casas, un piso a la vez, contra el plazo.",
    ],
    icono: "tec",
    escenaId: "obra-construccion",
  },
  {
    id: "tec-02",
    dimension: "tec",
    nombre: "Mecánico automotriz",
    escena: "Manos llenas de grasa, olor a aceite quemado, el radio de la fondita al fondo.",
    tarea: "Un auto llega con una falla que nadie más resolvió. El dueño espera una respuesta clara, no una excusa.",
    bullets: [
      "Diagnostica fallas, desarma motores y prueba hasta encontrar el problema real.",
      "Trata directo con el cliente, que muchas veces no confía en lo que le dices.",
      "Devuelve autos funcionando cuando el diagnóstico de otro taller falló.",
    ],
    icono: "tec",
  },
  {
    id: "tec-03",
    dimension: "tec",
    nombre: "Electricista industrial",
    escena: "Tableros eléctricos, cables por todos lados, el zumbido constante de la planta.",
    tarea: "Revisas circuitos en una planta que no puede detenerse. Un error de cálculo corta el turno completo.",
    bullets: [
      "Instala y repara sistemas eléctricos de media y baja tensión en plantas.",
      "Coordina con jefes de turno para intervenir sin frenar la producción.",
      "Mantiene la planta funcionando: cada corte no planificado cuesta caro.",
    ],
    icono: "tec",
  },

  // cie — Científico-Analítico
  {
    id: "cie-01",
    dimension: "cie",
    nombre: "Analista de laboratorio clínico",
    escena: "Silencio, guantes, decenas de tubos etiquetados esperando turno antes del mediodía.",
    tarea: "Procesas muestra tras muestra. La precisión importa más que la velocidad, aunque el sistema pida ambas.",
    bullets: [
      "Procesa exámenes de sangre, orina y otras muestras con protocolos estrictos.",
      "Trabaja con médicos y enfermeras que dependen del resultado para decidir un tratamiento.",
      "Entrega el dato que confirma o descarta un diagnóstico.",
    ],
    icono: "cie",
  },
  {
    id: "cie-02",
    dimension: "cie",
    nombre: "Investigador/a de postgrado",
    escena: "Un laboratorio o una oficina con más papers abiertos que espacio en la mesa.",
    tarea: "Repites el mismo experimento por tercera vez porque los datos no cuadran. Nadie te aplaude por eso.",
    bullets: [
      "Diseña experimentos, mide resultados y descarta hipótesis que no se sostienen.",
      "Trabaja con un equipo pequeño y un tutor que revisa cada avance.",
      "Produce conocimiento nuevo, aunque tome años ver un resultado publicable.",
    ],
    icono: "cie",
  },
  {
    id: "cie-03",
    dimension: "cie",
    nombre: "Control de calidad en planta de alimentos",
    escena: "Cofia, mascarilla, el frío de la cámara de refrigeración y una planilla que no puede fallar.",
    tarea: "Revisas si un lote cumple la norma o se bota. La decisión es tuya y hay plata real de por medio.",
    bullets: [
      "Verifica que cada lote cumpla normas sanitarias antes de salir a la venta.",
      "Reporta directo a jefatura de planta y a veces a fiscalización externa.",
      "Evita que un producto en mal estado llegue a un supermercado.",
    ],
    icono: "cie",
  },

  // cre — Creativo
  {
    id: "cre-01",
    dimension: "cre",
    nombre: "Diseñador/a en estudio de branding",
    escena: "Pantallas con versiones descartadas, post-its por todos lados, un brief que cambió otra vez.",
    tarea: "El cliente pide 'algo más wow' sin decir qué significa. Tienes hasta el viernes para traducir esa frase.",
    bullets: [
      "Crea marcas, logos y piezas visuales para clientes con plazos ajustados.",
      "Presenta propuestas directo al cliente y defiende decisiones de diseño.",
      "Produce la imagen con la que una marca se presenta al mundo.",
    ],
    icono: "cre",
  },
  {
    id: "cre-02",
    dimension: "cre",
    nombre: "Asistente de rodaje audiovisual",
    escena: "Cables, luces, gente corriendo de un lado a otro y un director que grita '¡silencio!'.",
    tarea: "La luz se va en 40 minutos y falta una escena. Todos miran hacia ti para resolver.",
    bullets: [
      "Apoya montaje de set, cámara y luces bajo presión de tiempo real.",
      "Coordina con el equipo técnico y con actores que también esperan indicaciones.",
      "Ayuda a producir la escena que el espectador verá terminada, sin ver el caos detrás.",
    ],
    icono: "cre",
  },
  {
    id: "cre-03",
    dimension: "cre",
    nombre: "Arquitecto/a en estudio pequeño",
    escena: "Planos sobre la mesa, una calculadora, y la luz de la tarde entrando por la ventana del estudio.",
    tarea: "Dibujas la misma planta por quinta vez porque el terreno tiene una pendiente que nadie midió bien.",
    bullets: [
      "Diseña espacios habitables ajustando plano, presupuesto y terreno real.",
      "Coordina con el cliente, el calculista y, más adelante, la constructora.",
      "Convierte una idea en un plano que se puede construir de verdad.",
    ],
    icono: "cre",
  },

  // soc — Social-Humano
  {
    id: "soc-01",
    dimension: "soc",
    nombre: "Profesor/a de enseñanza media",
    escena: "Una sala con treinta y cinco adolescentes, el timbre que no da tregua, tiza o plumón en la mano.",
    tarea: "Cuarenta minutos, treinta y cinco estudiantes, uno que no quiere estar ahí. Tienes que llegar a todos.",
    bullets: [
      "Prepara y da clases, corrige pruebas y adapta el ritmo según el curso.",
      "Trabaja con otros profesores, apoderados y, sobre todo, con los estudiantes.",
      "Forma a la próxima generación, un curso ruidoso a la vez.",
    ],
    icono: "soc",
  },
  {
    id: "soc-02",
    dimension: "soc",
    nombre: "Asistente social en municipalidad",
    escena: "Una oficina municipal, una fila de gente esperando, historias que no caben en un formulario.",
    tarea: "La persona frente a ti trae un problema que no se resuelve con un trámite. Escuchar bien es la mitad del trabajo.",
    bullets: [
      "Evalúa casos, deriva a redes de apoyo y hace seguimiento a familias vulnerables.",
      "Trabaja con vecinos, otras instituciones y equipos de salud o educación.",
      "Conecta a personas con la ayuda concreta que necesitan, no solo con papeleo.",
    ],
    icono: "soc",
  },
  {
    id: "soc-03",
    dimension: "soc",
    nombre: "Recursos Humanos en empresa mediana",
    escena: "Una oficina con la puerta cerrada, dos personas esperando turno para hablar contigo.",
    tarea: "Median dos conflictos de equipo en la misma semana. No hay manual que cubra todos los casos.",
    bullets: [
      "Media conflictos, gestiona contratación y acompaña el clima laboral.",
      "Trabaja con jefaturas de todas las áreas y con cada trabajador por separado.",
      "Sostiene que la empresa funcione como equipo, no solo como organigrama.",
    ],
    icono: "soc",
  },

  // sal — Salud y Cuidado
  {
    id: "sal-01",
    dimension: "sal",
    nombre: "Médico/a en consultorio de atención primaria",
    escena: "Una sala de espera llena, la ficha en pantalla, ocho minutos que se sienten como cuatro.",
    tarea: "Tienes ocho minutos por paciente y el décimo de la mañana llegó con algo que no estaba en la ficha.",
    bullets: [
      "Diagnostica, deriva y trata en consultas breves, con alta demanda diaria.",
      "Trabaja con enfermería, técnicos paramédicos y especialistas de derivación.",
      "Sostiene la salud de base de un barrio entero, consulta por consulta.",
    ],
    icono: "sal",
  },
  {
    id: "sal-02",
    dimension: "sal",
    nombre: "Kinesiólogo/a en clínica",
    escena: "Una camilla, música baja, el mismo ejercicio repetido con paciencia distinta cada vez.",
    tarea: "La misma sesión, distinto cuerpo, distinto dolor. Repetir el ejercicio con paciencia, otra vez.",
    bullets: [
      "Diseña y guía rutinas de rehabilitación según cada lesión y paciente.",
      "Trabaja con médicos tratantes y directamente con el paciente, sesión a sesión.",
      "Devuelve movilidad a alguien que antes no podía moverse igual.",
    ],
    icono: "sal",
  },
  {
    id: "sal-03",
    dimension: "sal",
    nombre: "Cuidador/a en residencia de adultos mayores",
    escena: "Pasillos silenciosos, olor a remedio, el turno de la tarde que siempre pesa más.",
    tarea: "Rutinas, remedios, y a veces solo hacer compañía. El turno de la tarde es el más pesado.",
    bullets: [
      "Asiste en higiene, alimentación y administración de medicamentos.",
      "Trabaja en equipo con enfermería y coordina con las familias de los residentes.",
      "Sostiene la calidad de vida diaria de personas que ya no pueden hacerlo solas.",
    ],
    icono: "sal",
  },

  // ges — Gestión y Emprendimiento
  {
    id: "ges-01",
    dimension: "ges",
    nombre: "Fundador/a de startup en etapa temprana",
    escena: "Un notebook, muchas pestañas abiertas, café frío y una planilla de caja que revisas todos los días.",
    tarea: "La plata alcanza para dos meses más si no cambia nada. Y algo siempre cambia.",
    bullets: [
      "Define producto, vende, contrata y apaga incendios, todo en la misma semana.",
      "Trabaja con un equipo chico, inversionistas y los primeros clientes reales.",
      "Construye algo desde cero sin garantía de que vaya a funcionar.",
    ],
    icono: "ges",
  },
  {
    id: "ges-02",
    dimension: "ges",
    nombre: "Auditor/a en oficina de auditoría",
    escena: "Planillas de Excel, carpetas de respaldo, una oficina silenciosa a las 8 PM.",
    tarea: "Revisas los números de una empresa que no sabía que los tenía mal. Nadie te invita a la fiesta, pero todos confían en tu informe.",
    bullets: [
      "Revisa estados financieros y detecta errores o irregularidades contables.",
      "Trabaja con contadores y gerencias que no siempre quieren escuchar lo que encuentras.",
      "Entrega el informe que otros usan para decidir si confiar en una empresa.",
    ],
    icono: "ges",
  },
  {
    id: "ges-03",
    dimension: "ges",
    nombre: "Dueño/a de local gastronómico",
    escena: "Ollas al fuego, el teléfono sonando, un delivery que llega justo antes de abrir.",
    tarea: "El proveedor llegó tarde y el local abre en una hora. Improvisas el menú del día con lo que hay.",
    bullets: [
      "Gestiona compras, personal, caja y el menú del día, todo al mismo tiempo.",
      "Trabaja con proveedores, su equipo de cocina y clientes que no siempre avisan.",
      "Pone comida en la mesa de otros, con márgenes que dejan poco espacio al error.",
    ],
    icono: "ges",
  },

  // dat — Datos y Organización
  {
    id: "dat-01",
    dimension: "dat",
    nombre: "Analista de datos en retail",
    escena: "Varias pantallas, un dashboard que no termina de cargar, y una reunión en media hora.",
    tarea: "Un Excel con treinta mil filas y una pregunta simple: ¿por qué bajaron las ventas en la región sur?",
    bullets: [
      "Limpia datos, arma reportes y busca el porqué detrás de cada número raro.",
      "Trabaja con gerencia comercial, que quiere la respuesta antes que el detalle.",
      "Convierte números sueltos en una decisión que alguien más va a tomar.",
    ],
    icono: "dat",
  },
  {
    id: "dat-02",
    dimension: "dat",
    nombre: "Encargado/a de bodega y logística",
    escena: "Estanterías altas, el pitido del lector de código de barras, el camión esperando afuera.",
    tarea: "El camión sale a las 6 AM con o sin el pedido completo. El orden de hoy define el error de mañana.",
    bullets: [
      "Organiza inventario, prepara despachos y controla lo que entra y sale.",
      "Coordina con transportistas, proveedores y el equipo de ventas.",
      "Sostiene que el producto llegue donde tiene que llegar, a tiempo.",
    ],
    icono: "dat",
  },
  {
    id: "dat-03",
    dimension: "dat",
    nombre: "Administración de una pyme",
    escena: "Una carpeta con facturas atrasadas, el teléfono sonando, la agenda del día ya desordenada a las 10 AM.",
    tarea: "Facturas, agenda, pagos: nada es urgente por separado, todo es urgente junto.",
    bullets: [
      "Lleva contabilidad básica, pagos, agenda y trámites del día a día.",
      "Trabaja directo con el dueño del negocio y con proveedores o clientes.",
      "Mantiene funcionando el papeleo que sostiene a una empresa chica.",
    ],
    icono: "dat",
  },

  // nat — Naturaleza y Terreno
  {
    id: "nat-01",
    dimension: "nat",
    nombre: "Trabajador/a de packing agrícola",
    escena: "Calor, el ritmo de la línea que no baja, cajas de fruta pasando una tras otra.",
    tarea: "La fruta no espera: si no se envasa hoy, se pierde. El ritmo no baja hasta marzo.",
    bullets: [
      "Selecciona, clasifica y envasa fruta según calibre y calidad para exportación.",
      "Trabaja en línea con un equipo grande, bajo supervisión de turno.",
      "Produce la fruta que después se ve en la góndola de otro país.",
    ],
    icono: "nat",
    escenaId: "packing-agricola",
  },
  {
    id: "nat-02",
    dimension: "nat",
    nombre: "Guardaparque en zona silvestre",
    escena: "Barro después de la lluvia, silencio del bosque, el teléfono sin señal.",
    tarea: "Caminas seis kilómetros para revisar un sendero después de la lluvia. Y está bien así.",
    bullets: [
      "Recorre senderos, vigila fauna y controla el acceso de visitantes al parque.",
      "Trabaja solo la mayor parte del día, con reporte a la administración del área protegida.",
      "Cuida un ecosistema que no se recupera fácil si se daña.",
    ],
    icono: "nat",
  },
  {
    id: "nat-03",
    dimension: "nat",
    nombre: "Ingeniero/a forestal en terreno",
    escena: "Sol del mediodía, una huincha de medir, árboles marcados con cinta de colores.",
    tarea: "Mides árboles bajo el sol de las once. Los datos de hoy definen un plan de manejo a diez años.",
    bullets: [
      "Mide, inventaria y planifica el manejo sostenible de bosques y plantaciones.",
      "Trabaja con cuadrillas de terreno y con la empresa forestal que financia el plan.",
      "Define cómo se explota un bosque sin agotarlo.",
    ],
    icono: "nat",
  },
];
