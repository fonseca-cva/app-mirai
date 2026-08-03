// Datos verificados para los gráficos/contadores del sitio.
// Regla: cada cifra debe mostrarse siempre junto a su fuente y año — nunca sola.

export interface Contador {
  valor: number;
  prefijo?: string;
  sufijo?: string;
  texto: string;
  fuente: string;
}

export const contadoresHome: Contador[] = [
  {
    valor: 25,
    sufijo: "%",
    texto: "de los estudiantes deja su carrera en el primer año",
    fuente: "SIES, cohorte 2021",
  },
  {
    valor: 112,
    prefijo: "+",
    sufijo: "%",
    texto: "ganan quienes estudian educación superior vs. solo media",
    fuente: "OCDE, Education at a Glance 2024/2025",
  },
  {
    valor: 264,
    texto: "carreras con datos oficiales de empleabilidad e ingresos",
    fuente: "mifuturo.cl / SIES",
  },
];

export interface CarreraEmpleabilidad {
  carrera: string;
  porcentaje: number;
}

export const empleabilidadCarreras: CarreraEmpleabilidad[] = [
  { carrera: "Química y Farmacia", porcentaje: 98.3 },
  { carrera: "Geología", porcentaje: 80.1 },
  { carrera: "Periodismo", porcentaje: 79.4 },
  { carrera: "Traducción", porcentaje: 46.4 },
  { carrera: "Actuación y Teatro", porcentaje: 31.4 },
];

export const empleabilidadFuente = "mifuturo.cl / SIES, admisión 2025";
