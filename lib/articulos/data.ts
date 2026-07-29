import { parseArticulos } from './parser';
import { Articulo } from './schema';

let cachedArticulos: Articulo[] | null = null;
let cachedSlugs: string[] | null = null;

function loadArticulos() {
  if (cachedArticulos !== null) {
    return { articulos: cachedArticulos, slugs: cachedSlugs! };
  }

  const result = parseArticulos();

  // Mostrar warnings de medios pendientes
  if (result.mediasPendientes.length > 0) {
    console.warn('\n⚠️  Medios pendientes detectados:');
    for (const { slug, medio } of result.mediasPendientes) {
      console.warn(`   - Artículo "${slug}": ${medio}`);
    }
  }

  // Si hay errores, fallar el build
  if (!result.success && result.errores.length > 0) {
    console.error('\n❌ Errores de validación en artículos:');
    for (const error of result.errores) {
      console.error(error);
    }
    throw new Error('Artículos inválidos. Revisar errores arriba.');
  }

  // Ordenar por fecha (más reciente primero)
  const articulos = result.articulos.sort((a, b) => {
    return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
  });

  const slugs = articulos.map((a) => a.slug);

  cachedArticulos = articulos;
  cachedSlugs = slugs;

  return { articulos, slugs };
}

export function getArticulos(): Articulo[] {
  return loadArticulos().articulos;
}

export function getSlugs(): string[] {
  return loadArticulos().slugs;
}

export function getArticuloBySlug(slug: string): Articulo | undefined {
  return getArticulos().find((a) => a.slug === slug);
}

export function getArticulosByPublico(
  publico: 'estudiante' | 'apoderado' | 'orientador'
): Articulo[] {
  return getArticulos().filter((a) => a.publico === publico);
}

export function getArticulosByMolde(molde: string): Articulo[] {
  return getArticulos().filter((a) => a.molde === molde);
}

export function getUniqueMoldes(): string[] {
  const moldes = new Set(getArticulos().map((a) => a.molde));
  return Array.from(moldes).sort();
}
