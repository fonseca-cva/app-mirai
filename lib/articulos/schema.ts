import { z } from 'zod';

const MedioSchema = z.object({
  tipo: z.string(),
  descripcion: z.string(),
  estado: z.enum(['pendiente', 'listo', 'no_producido']),
});

export const ArticuloFrontmatterSchema = z.object({
  slug: z.string().min(1, 'slug es requerido'),
  titulo: z.string().min(1, 'titulo es requerido'),
  molde: z.string().min(1, 'molde es requerido'),
  intencion_busqueda: z.string().min(1, 'intencion_busqueda es requerido'),
  publico: z.enum(['estudiante', 'apoderado', 'orientador']),
  durabilidad: z.string().min(1, 'durabilidad es requerido'),
  resumen: z.string().min(1, 'resumen es requerido'),
  medios: z.array(MedioSchema).default([]),
  datos_usados: z.array(z.string()).default([]),
  articulos_relacionados: z.array(z.string()).default([]),
  cta: z.string().min(1, 'cta es requerido'),
  fecha: z.string().date(),
});

export type ArticuloFrontmatter = z.infer<typeof ArticuloFrontmatterSchema>;

export interface Articulo extends ArticuloFrontmatter {
  contenido: string;
  contenidoHtml: string;
}
