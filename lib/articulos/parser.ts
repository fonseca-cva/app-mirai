import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import { ArticuloFrontmatterSchema, Articulo, ArticuloFrontmatter } from './schema';

const md = new MarkdownIt();
const ARTICULOS_DIR = path.join(process.cwd(), 'articulos');

interface ParseResult {
  success: boolean;
  articulos: Articulo[];
  errores: string[];
  mediasPendientes: Array<{ slug: string; medio: string }>;
}

export function parseArticulos(): ParseResult {
  const result: ParseResult = {
    success: true,
    articulos: [],
    errores: [],
    mediasPendientes: [],
  };

  if (!fs.existsSync(ARTICULOS_DIR)) {
    result.errores.push(`Directorio ${ARTICULOS_DIR} no existe`);
    result.success = false;
    return result;
  }

  const files = fs.readdirSync(ARTICULOS_DIR).filter((f) => f.endsWith('.md'));
  const slugsSeen = new Set<string>();
  const articulos: Articulo[] = [];

  for (const file of files) {
    const filePath = path.join(ARTICULOS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    try {
      const { data, content: markdown } = matter(content);

      // Validar frontmatter con Zod
      const parseResult = ArticuloFrontmatterSchema.safeParse(data);

      if (!parseResult.success) {
        const errors = parseResult.error.issues
          .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
          .join('\n');
        result.errores.push(`❌ Artículo ${file}:\n${errors}`);
        result.success = false;
        continue;
      }

      const frontmatter = parseResult.data;

      // Verificar slugs duplicados
      if (slugsSeen.has(frontmatter.slug)) {
        result.errores.push(`❌ Slug duplicado: "${frontmatter.slug}" (archivos: ${file})`);
        result.success = false;
        continue;
      }

      slugsSeen.add(frontmatter.slug);

      // Renderizar markdown a HTML
      const contenidoHtml = md.render(markdown);

      // Recolectar medios pendientes
      for (const medio of frontmatter.medios) {
        if (medio.estado === 'pendiente' || medio.estado === 'no_producido') {
          result.mediasPendientes.push({
            slug: frontmatter.slug,
            medio: medio.descripcion,
          });
        }
      }

      articulos.push({
        ...frontmatter,
        contenido: markdown,
        contenidoHtml,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      result.errores.push(`❌ Artículo ${file}: ${errorMsg}`);
      result.success = false;
    }
  }

  result.articulos = articulos;
  return result;
}
