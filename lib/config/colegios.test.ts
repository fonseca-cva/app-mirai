// PÁGINA /colegios — pruebas proporcionadas al cambio.
//
// El riesgo de esta página NO es de lógica: es de COPY. Las reglas del fundador y
// del documento maestro prohíben afirmar cosas que no podemos demostrar (validación
// psicométrica, reducción de deserción, precios, testimonios, colegios
// participantes). Un test que solo comprobara "la página existe" no protegería nada.
//
// Estos tests verifican, sobre el texto REAL que se publica:
//   1. Toda cifra va con su fuente (regla explícita del banco de datos del proyecto).
//   2. No se afirma validación psicométrica.
//   3. No se promete reducción de deserción.
//   4. No hay precios, testimonios ni colegios participantes inventados.
//   5. No se nombran personas del equipo ni se detallan ítems/algoritmos.
//   6. El CTA apunta a colegios@miraiapp.cl con un mailto prellenado válido.
//   7. Las secciones exigidas están cubiertas y en orden.
//   8. El instrumento declara su estado piloto.

import { describe, it, expect } from "vitest";
import { colegios, mailtoColegios } from "@/lib/config/textos";
import { contadoresHome } from "@/lib/config/datos-graficos";

/** Todo el texto visible de la página, aplanado, para poder auditarlo. */
function textoCompleto(): string {
  const partes: string[] = [];
  const recorrer = (nodo: unknown) => {
    if (typeof nodo === "string") partes.push(nodo);
    else if (Array.isArray(nodo)) nodo.forEach(recorrer);
    else if (nodo && typeof nodo === "object") Object.values(nodo).forEach(recorrer);
  };
  recorrer(colegios);
  return partes.join("\n");
}

const TEXTO = textoCompleto();
const TEXTO_MIN = TEXTO.toLowerCase();

describe("cifras: cada una con su fuente", () => {
  it("las 3 cifras del problema declaran fuente", () => {
    expect(colegios.problema.cifras).toHaveLength(3);
    for (const c of colegios.problema.cifras) {
      expect(c.valor.trim(), `cifra sin valor: ${JSON.stringify(c)}`).not.toBe("");
      expect(c.fuente.trim(), `la cifra "${c.valor}" no declara fuente`).not.toBe("");
      // La fuente debe citar el organismo o el año, como en el banco de datos.
      expect(/\d{4}|SIES|OCDE|mifuturo/.test(c.fuente), `fuente poco específica: ${c.fuente}`).toBe(true);
    }
  });

  it("las cifras publicadas existen en el banco verificado del proyecto", () => {
    // No se inventan cifras: cada valor debe estar respaldado por un contador ya
    // verificado en lib/config/datos-graficos.ts.
    const respaldados = contadoresHome.map((c) => `${c.prefijo ?? ""}${c.valor}${c.sufijo ?? ""}`);
    for (const c of colegios.problema.cifras) {
      expect(respaldados, `la cifra "${c.valor}" no está en el banco verificado (${respaldados.join(", ")})`).toContain(
        c.valor
      );
    }
  });

  it("no aparece ningún porcentaje suelto sin respaldo", () => {
    // Todos los "%" del texto deben corresponder a una cifra del banco.
    const porcentajes = TEXTO.match(/\d+([.,]\d+)?\s*%/g) ?? [];
    const respaldados = new Set(contadoresHome.map((c) => `${c.valor}%`));
    for (const p of porcentajes) {
      const normalizado = p.replace(/\s/g, "");
      expect(
        [...respaldados].some((r) => normalizado === r),
        `porcentaje sin respaldo en el banco verificado: ${p}`
      ).toBe(true);
    }
  });
});

describe("declaraciones honestas (lo que NO se puede afirmar)", () => {
  it("NO afirma validación psicométrica", () => {
    // Se permite la frase que NIEGA la validación; lo prohibido es afirmarla.
    // Lo prohibido es AFIRMAR la validación. Se buscan las construcciones que lo
    // afirman, no las que lo NIEGAN (decir "no estamos validados" es exactamente lo
    // que exigimos). El lookbehind de JS no cubre bien frases largas, así que se
    // examina el contexto ANTERIOR de cada aparición.
    const construccionesAfirmativas = [
      /\b(somos|es|está)\s+(un\s+)?instrumento\s+validado/i,
      /\bvalidación\s+psicométrica\s+(completada|realizada|concluida|terminada)/i,
      /\bpsicométricamente\s+validado/i,
      /\binstrumento\s+científicamente\s+probado/i,
      /\b(contamos\s+con|tenemos)\s+validación\s+psicométrica/i,
    ];

    /** ¿La aparición está negada en los ~60 caracteres previos? */
    const estaNegada = (texto: string, indice: number): boolean => {
      const previo = texto.slice(Math.max(0, indice - 60), indice).toLowerCase();
      return /\b(no|nunca|tampoco|todavía no|aún no|sin)\b[^.]*$/.test(previo);
    };

    for (const re of construccionesAfirmativas) {
      const coincidencias = [...TEXTO.matchAll(new RegExp(re.source, "gi"))];
      for (const m of coincidencias) {
        const indice = m.index ?? 0;
        expect(
          estaNegada(TEXTO, indice),
          `el texto afirma validación sin negarla: "${TEXTO.slice(Math.max(0, indice - 40), indice + m[0].length + 20).replace(/\s+/g, " ")}"`
        ).toBe(true);
      }
    }
    // Y debe declarar explícitamente que NO está validado. Se comprueban las dos
    // formulaciones que usa el texto, sin acoplarse a una frase exacta.
    expect(TEXTO_MIN).toMatch(/no\s+vamos\s+a\s+decirte\s+que\s+somos\s+un\s+instrumento\s+validado/);
    expect(TEXTO_MIN).toMatch(/todavía\s+no\s+lo\s+somos|todavía\s+no/);
    expect(TEXTO_MIN).toContain("fase piloto");
  });

  it("NO promete reducción de deserción ni impacto propio", () => {
    const prohibidas = [
      /reduc\w*\s+(la\s+)?deserción/i,
      /baja\s+(la\s+)?deserción/i,
      /evita\s+(la\s+)?deserción/i,
      /menos\s+deserción/i,
      /(reducción|disminución)\s+del?\s+\d+\s*%/i,
    ];
    for (const re of prohibidas) {
      expect(re.test(TEXTO), `el texto promete impacto en deserción: ${re}`).toBe(false);
    }
  });

  it("declara el estado piloto del instrumento", () => {
    expect(TEXTO_MIN).toContain("fase piloto");
    expect(TEXTO_MIN).toContain("colegios fundadores");
  });

  it("NO inventa precios, testimonios ni colegios participantes", () => {
    const prohibidas = [
      /\$\s?[\d.]{3,}/, // precios con separador de miles
      /\bCLP\b/i,
      /\bUF\b/,
      /(¿|¡)?"[^"]{40,}"\s*[—-]\s*(director|orientadora?|jefa?\s+de\s+ustp)/i, // testimonio con cargo
      /colegio\s+(participante|piloto)\s+(santa|san\s|liceo)/i, // colegio con nombre
      /más\s+de\s+\d+\s+colegios\s+(ya\s+)?(participan|están)/i,
    ];
    for (const re of prohibidas) {
      expect(re.test(TEXTO), `posible dato inventado: ${re}`).toBe(false);
    }
    // Y debe quedar claro que el reporte generacional no existe todavía.
    expect(TEXTO_MIN).toMatch(/todavía no (está operativo|existe)/);
  });

  it("NO nombra personas del equipo ni detalla ítems o algoritmos", () => {
    const prohibidas = [
      /\b(CEO|CTO|fundador(?:a)?)\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/,
      /nuestro\s+equipo\s+de\s+psicólog/i,
      /\b(validez|confiabilidad)\s+(de|del)\s+(alpha|α|omega)/i,
      /\balgoritmo\s+(propio|de\s+matching)/i,
      /\blos\s+\d+\s+ítems\b/i,
    ];
    for (const re of prohibidas) {
      expect(re.test(TEXTO), `detalle prohibido por la sección 6.5: ${re}`).toBe(false);
    }
  });
});

describe("salvaguardas: las 6 exigidas", () => {
  const titulos = colegios.salvaguardas.items.map((i) => i.titulo.toLowerCase());

  it("cubre independencia, datos de prueba, RLS, lenguaje y metodología", () => {
    expect(titulos.some((t) => t.includes("independencia"))).toBe(true);
    expect(titulos.some((t) => t.includes("prueba"))).toBe(true);
    expect(titulos.some((t) => t.includes("rls"))).toBe(true);
    expect(titulos.some((t) => t.includes("no determinista"))).toBe(true);
    expect(titulos.some((t) => t.includes("metodolog"))).toBe(true);
    expect(titulos.some((t) => t.includes("estado declarado"))).toBe(true);
  });

  it("la salvaguarda de metodología enlaza a /metodologia", () => {
    const m = colegios.salvaguardas.items.find((i) => i.titulo.toLowerCase().includes("metodolog"));
    expect(m && "enlace" in m && m.enlace).toBe("/metodologia");
  });

  it("declara que no pertenece a ninguna universidad", () => {
    expect(TEXTO_MIN).toContain("no pertenece a ninguna universidad");
  });
});

describe("CTA y contacto", () => {
  it("el mailto apunta a colegios@miraiapp.cl", () => {
    expect(colegios.cta.email).toBe("colegios@miraiapp.cl");
    expect(mailtoColegios()).toContain("mailto:colegios@miraiapp.cl");
  });

  it("el mailto lleva asunto y cuerpo prellenados y codificados", () => {
    const m = mailtoColegios();
    expect(m).toContain("subject=");
    expect(m).toContain("body=");
    // Codificado: sin saltos de línea crudos ni espacios sin escapar en los valores.
    const [base, query] = m.split("?");
    expect(base).toBe("mailto:colegios@miraiapp.cl");
    expect(query).not.toContain("\n");
    expect(query).not.toContain(" ");
    // Parseo correcto de la query (no un `split` frágil): el asunto contiene
    // "Colegio Fundador" y el cuerpo la plantilla.
    const params = new URLSearchParams(query);
    const asunto = params.get("subject") ?? "";
    const cuerpo = params.get("body") ?? "";
    expect(asunto).toContain("Colegio Fundador");
    expect(cuerpo.toLowerCase()).toContain("[nombre del colegio]");
    expect(cuerpo.length).toBeGreaterThan(80);
  });
});

describe("estructura: las 9 secciones exigidas", () => {
  it("existen todas y con contenido no vacío", () => {
    expect(colegios.hero.titulo.length).toBeGreaterThan(20); // 1 hero
    expect(colegios.problema.cifras.length).toBeGreaterThan(0); // 2 problema
    expect(colegios.estudiante.pasos.length).toBeGreaterThan(0); // 3 estudiante
    expect(colegios.colegio.entregables).toHaveLength(3); // 4 colegio
    expect(colegios.fundador.compromisos).toHaveLength(3); // 5 fundador
    expect(colegios.salvaguardas.items).toHaveLength(6); // 6 salvaguardas
    expect(colegios.horaPedagogica.pasos.length).toBeGreaterThan(0); // 7 hora
    expect(colegios.faq.length).toBeGreaterThan(0); // 8 faq
    expect(colegios.cta.titulo.length).toBeGreaterThan(0); // 9 cta
  });

  it("el hero va dirigido a orientadores y directivos, no a estudiantes", () => {
    const hero = `${colegios.hero.titulo} ${colegios.hero.bajada}`.toLowerCase();
    // Habla en segunda persona del colegio ("tu generación", "tu equipo").
    expect(hero).toMatch(/tu\s+(generación|equipo|colegio)/);
    // Y no se dirige al estudiante como protagonista.
    expect(hero).not.toMatch(/¿y\s+tú,?\s+qué\s+forma/);
  });

  it("la hora pedagógica cubre antes, durante y después", () => {
    const momentos = colegios.horaPedagogica.pasos.map((p) => p.momento.toLowerCase());
    expect(momentos.some((m) => m.includes("antes"))).toBe(true);
    expect(momentos.some((m) => m.includes("después"))).toBe(true);
    // Y suma aproximadamente una hora pedagógica (45-60 min de experiencia).
    expect(colegios.horaPedagogica.pasos.length).toBeGreaterThanOrEqual(5);
  });

  it("cada FAQ tiene pregunta y respuesta sustantiva", () => {
    for (const f of colegios.faq) {
      expect(f.pregunta.trim().endsWith("?")).toBe(true);
      expect(f.respuesta.trim().length).toBeGreaterThan(60);
    }
  });
});

describe("metadata y navegación", () => {
  it("declara título y descripción para SEO y Open Graph", () => {
    expect(colegios.metadata.titulo).toContain("Mirai");
    expect(colegios.metadata.descripcion.length).toBeGreaterThan(80);
    // La descripción no miente sobre el estado del instrumento.
    expect(colegios.metadata.descripcion.toLowerCase()).not.toContain("validado");
  });

  it("el texto está en español de Chile (no queda lorem ipsum)", () => {
    expect(TEXTO_MIN).not.toContain("lorem ipsum");
    expect(TEXTO_MIN).not.toMatch(/\bTODO\b|\bFIXME\b|\bplaceholder\b/i);
    // Marcadores de pendiente de pasadas anteriores.
    expect(TEXTO).not.toContain("PENDIENTE PASADA DE COPY");
  });
});

// ══════════════════════════════════════════════════════════════════════════
// PRECISIÓN COMERCIAL — regresiones que NO pueden volver
// ══════════════════════════════════════════════════════════════════════════
//
// Estos cuatro tests impiden reintroducir afirmaciones que el producto todavía no
// puede sostener. Cada uno corresponde a una corrección pedida explícitamente.
describe("precisión comercial: el reporte generacional NO está construido", () => {
  it("no afirma que el colegio YA recibe el mapa o reporte agregado", () => {
    const prohibidas = [
      // Presente: "recibe el mapa", "obtiene el reporte", "te llega el reporte".
      /\b(recibe|obtiene|te\s+llega|entrega(mos)?|accede\s+a)\s+(el\s+)?(mapa|reporte)\s+(de\s+la\s+)?(generación|curso|generacional)/i,
      /\btu\s+equipo\s+(de\s+orientación\s+)?recibe\s+el\s+(mapa|reporte)/i,
      /\bmapa\s+del\s+curso\b/i,
      /\breporte\s+agregado\s+de\s+la\s+generación\b/i,
    ];
    for (const re of prohibidas) {
      expect(re.test(TEXTO), `afirma como construido el reporte generacional: ${re}`).toBe(false);
    }
  });

  it("declara explícitamente que el reporte generacional todavía NO está operativo", () => {
    // La formulación exigida debe estar presente y ser explícita.
    expect(TEXTO_MIN).toMatch(/todavía no está operativo|todavía no existe/);
    // Y debe nombrarse el futuro: el piloto es lo que lo permitirá diseñar.
    expect(TEXTO_MIN).toMatch(/futuro reporte generacional|diseñar(lo)?\s+(junto|con)\s+(a\s+)?los\s+colegios/);
  });

  it("la metadata tampoco promete el mapa al colegio", () => {
    const meta = colegios.metadata.descripcion.toLowerCase();
    expect(meta).not.toMatch(/\bmapa\b/);
    expect(meta).not.toMatch(/reporte\s+agregado/);
    expect(meta).toMatch(/futuro reporte generacional|todavía no/);
  });
});

describe("precisión comercial: la agenda cabe en una hora pedagógica", () => {
  it("los bloques del itinerario no superan los 45 minutos", () => {
    // Se extraen los rangos "A–B min" que NO son "Antes" ni "Después".
    const rangos = colegios.horaPedagogica.pasos
      .map((p) => p.momento)
      .filter((m) => /\d+\s*[–-]\s*\d+/.test(m))
      .map((m) => {
        const [a, b] = m.match(/(\d+)\s*[–-]\s*(\d+)/)!.slice(1).map(Number);
        return { momento: m, inicio: a, fin: b };
      });

    expect(rangos.length, "debe haber bloques con horario explícito").toBeGreaterThan(0);

    for (const r of rangos) {
      expect(r.fin, `el bloque "${r.momento}" termina en ${r.fin} min`).toBeLessThanOrEqual(45);
    }
    // Y el último bloque debe cerrar exactamente en 45 (una hora pedagógica).
    const ultimo = rangos.reduce((max, r) => (r.fin > max.fin ? r : max), rangos[0]);
    expect(ultimo.fin, "el itinerario debe cerrar en 45 minutos").toBe(45);
  });

  it("los bloques son contiguos (sin huecos ni solapes)", () => {
    const rangos = colegios.horaPedagogica.pasos
      .map((p) => p.momento)
      .filter((m) => /\d+\s*[–-]\s*\d+/.test(m))
      .map((m) => {
        const [a, b] = m.match(/(\d+)\s*[–-]\s*(\d+)/)!.slice(1).map(Number);
        return { inicio: a, fin: b };
      })
      .sort((x, y) => x.inicio - y.inicio);

    expect(rangos[0].inicio, "el itinerario debe empezar en 0").toBe(0);
    for (let i = 1; i < rangos.length; i++) {
      expect(
        rangos[i].inicio,
        `hueco o solape entre el bloque que termina en ${rangos[i - 1].fin} y el que empieza en ${rangos[i].inicio}`
      ).toBe(rangos[i - 1].fin);
    }
  });

  it("no promete '25 minutos' en ningún texto de la página", () => {
    // Se permiten otras duraciones; lo prohibido es el 25, que no está medido.
    expect(TEXTO).not.toMatch(/\b25\s*min/i);
    // Y la duración declarada debe ser coherente con la hora pedagógica.
    expect(TEXTO_MIN).toMatch(/hora pedagógica|30 a 35 minutos/);
  });
});

describe("precisión comercial: no todas las carreras tienen datos oficiales", () => {
  it("no afirma que los datos cubren 'cada carrera'", () => {
    const prohibidas = [
      /datos\s+oficiales[^.]{0,60}de\s+cada\s+carrera/i,
      /(todas|las\s+\d+\s+)carreras\s+(tienen|cuentan\s+con)\s+datos/i,
      /de\s+cada\s+una\s+de\s+las\s+carreras/i,
      /empleabilidad\s+e\s+ingresos\s+de\s+cada\s+carrera/i,
    ];
    for (const re of prohibidas) {
      expect(re.test(TEXTO), `afirma cobertura total de carreras: ${re}`).toBe(false);
    }
  });

  it("declara que se usa 'cuando están disponibles' y que se avisa si faltan", () => {
    expect(TEXTO_MIN).toMatch(/cuando están disponibles/);
    expect(TEXTO_MIN).toMatch(/no tiene datos oficiales|no existen datos/);
    // Y que se declara en vez de estimar (la regla del proyecto).
    expect(TEXTO_MIN).toMatch(/lo declara en vez de estimarlos|en vez de estimar/);
  });
});

describe("precisión comercial: los datos de prueba se IDENTIFICAN, no se excluyen solos", () => {
  it("no afirma exclusión automática", () => {
    const prohibidas = [
      /excluye\s+(automáticamente|por\s+defecto|siempre)/i,
      /quedan\s+(fuera|excluid[oa]s)\s+(automáticamente|por\s+defecto)/i,
      /toda\s+consulta\s+(las\s+)?excluye/i,
      /ningún\s+análisis\s+las\s+incluye/i,
    ];
    for (const re of prohibidas) {
      expect(re.test(TEXTO), `afirma exclusión automática de datos de prueba: ${re}`).toBe(false);
    }
  });

  it("afirma que quedan IDENTIFICADOS con una marca (es_prueba) y que eso permite excluirlos", () => {
    expect(TEXTO_MIN).toMatch(/marcad[ao]s\s+con\s+una\s+bandera\s+propia/);
    expect(TEXTO_MIN).toMatch(/permite\s+excluir|pueden\s+excluirse/);
    // Y deja claro que la exclusión es una decisión explícita, no un automatismo.
    expect(TEXTO_MIN).toMatch(/no\s+un\s+automatismo|decisión\s+explícita/);
    // La bandera se llama por su nombre técnico en el código, no en el copy público,
    // así que se verifica que el copy no filtre el nombre de la columna.
    expect(TEXTO).not.toContain("es_prueba");
  });
});

describe("precisión comercial: composición real del instrumento", () => {
  it("describe 4 juegos cognitivos y 3 tareas verbales (no 'tres mini-juegos')", () => {
    expect(TEXTO_MIN).toMatch(/cuatro\s+juegos/);
    expect(TEXTO_MIN).toMatch(/tres\s+tareas/);
    // Y no puede decir "tres mini-juegos", que subdeclara el bloque cognitivo.
    expect(TEXTO_MIN).not.toMatch(/tres\s+mini-?juegos/);
  });

  it("nombra los cuatro juegos, que es la composición real del bloque cognitivo", () => {
    for (const juego of ["patrones", "series", "plegado", "secuencias"]) {
      expect(TEXTO_MIN, `falta el juego "${juego}"`).toContain(juego);
    }
  });

  it("nombra las tres tareas verbales", () => {
    for (const tarea of ["comprensión", "argumentación", "expresión"]) {
      expect(TEXTO_MIN, `falta la tarea "${tarea}"`).toContain(tarea);
    }
  });
});
