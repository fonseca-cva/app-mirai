#!/usr/bin/env node
// Ingesta de datos SIES/mifuturo.cl contra el catálogo de 60 carreras curadas.
//
// Fuente: mifuturo.cl API admin-ajax.php, action=detalleEstadisticas
//   (Buscador de Estadísticas por Carrera, extraído por script Python auditable del
//   compañero de proyecto — "Whale" — sin interpolación).
//   Archivos de referencia en docs/ (v2, 250 registros): todas_las_estadisticas.json
//   (fuente de esta ingesta), todas_las_estadisticas.csv (misma data en CSV),
//   compilado_estadisticas_carreras.md (documento humano, NO se consume desde código).
//
// Historia de calidad de datos: la v1 (190 filas) traía la columna `nombre_carrera`
// desalineada (bug de IDs paralelos en el compilador SIES/mifuturo). Whale regeneró a
// v2 (250 registros): `nombre_carrera` fue ELIMINADA y ahora incluye carreras que
// faltaban (Medicina, Odontología, Psicología, pedagogías, etc.).
// La clave de matching es `carrera_estandar` (164 valores únicos en 250 filas) +
// `tipo_institucion` (CFT / IP / Universidad) para desambiguar, ya que un mismo
// `carrera_estandar` aparece con datos distintos en más de un tipo de institución.
// La ambigüedad de tipo se resuelve por la "vía" derivada del prefijo del id (ver viaDe).
//
// Este script SOLO LEE. No modifica lib/data/carreras.ts. Escribe:
//   scripts/carreras_con_sies.csv        — CSV plantilla + columnas SIES llenas
// y emite en stdout un reporte de cobertura: qué se llenó, qué quedó null y por qué,
// y la lista de ambigüedades para que Camilo las resuelva a mano.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const SIES_JSON_PATH = path.join(ROOT, "docs", "todas_las_estadisticas.json");
const CARRERAS_TS_PATH = path.join(ROOT, "lib", "data", "carreras.ts");
const OUT_CSV_PATH = path.join(__dirname, "carreras_con_sies.csv");

// ---------------------------------------------------------------------------
// 1. Leer las 60 carreras nuestras (id, nombre, nombresAlternativos)
// ---------------------------------------------------------------------------

function extraerCarrerasTs(src) {
  const bloques = [];
  // Captura id, nombre, nombresAlternativos y la vía explícita (campo `via`, agregado
  // al modelo Carrera). El matching ya NO deriva la vía del prefijo del id.
  const re = /id:\s*"([^"]+)",\s*nombre:\s*"((?:[^"\\]|\\.)*)",\s*nombresAlternativos:\s*\[([^\]]*)\],\s*via:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(src))) {
    const id = m[1];
    const nombre = JSON.parse(`"${m[2]}"`);
    const altsRaw = m[3].trim();
    const nombresAlternativos = altsRaw.length === 0
      ? []
      : [...altsRaw.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((x) => JSON.parse(`"${x[1]}"`));
    const via = m[4];
    bloques.push({ id, nombre, nombresAlternativos, via });
  }
  return bloques;
}

const carrerasSrc = fs.readFileSync(CARRERAS_TS_PATH, "utf8");
const nuestrasCarreras = extraerCarrerasTs(carrerasSrc);

if (nuestrasCarreras.length !== 60) {
  console.error(`ERROR: se esperaban 60 carreras extraídas de carreras.ts, se obtuvieron ${nuestrasCarreras.length}. Abortando.`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 2. Leer las 190 filas SIES
// ---------------------------------------------------------------------------

const siesRows = JSON.parse(fs.readFileSync(SIES_JSON_PATH, "utf8"));

function normaliza(s) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita tildes
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Índice: carrera_estandar normalizado -> [filas]
const indicePorEstandar = new Map();
for (const row of siesRows) {
  const key = normaliza(row.carrera_estandar || "");
  if (!key) continue;
  if (!indicePorEstandar.has(key)) indicePorEstandar.set(key, []);
  indicePorEstandar.get(key).push(row);
}

// ---------------------------------------------------------------------------
// 3. Matching: cada carrera nuestra contra carrera_estandar (nombre + alternativos)
// ---------------------------------------------------------------------------

function candidatosDeNombre(carrera) {
  return [carrera.nombre, ...carrera.nombresAlternativos];
}

function buscarMatches(carrera) {
  // Preferir el nombre PRINCIPAL: si el nombre curado calza exacto con un
  // carrera_estandar, se usa ese y se ignoran los alternativos (evita que un alias
  // afín arrastre una carrera_estandar distinta — casos `diseno` y `construccion_civil`
  // resueltos por Camilo). Solo si el principal no calza se prueban los alternativos.
  const principal = normaliza(carrera.nombre);
  if (indicePorEstandar.has(principal)) {
    return { filasEncontradas: [...indicePorEstandar.get(principal)], nombreUsado: [principal] };
  }
  const alternativos = carrera.nombresAlternativos.map(normaliza);
  const filasEncontradas = [];
  const nombreUsado = [];
  for (const nombre of alternativos) {
    if (indicePorEstandar.has(nombre)) {
      filasEncontradas.push(...indicePorEstandar.get(nombre));
      nombreUsado.push(nombre);
    }
  }
  return { filasEncontradas, nombreUsado };
}

function ultimoNoNulo(row, prefijo, anios) {
  for (const anio of anios) {
    const val = row[`${prefijo}${anio}`];
    if (val !== null && val !== undefined && val !== "") {
      return { valor: Number(val), anio };
    }
  }
  return null;
}

const ANIOS = [2019, 2018, 2017, 2016, 2015];

// La vía ahora es un campo EXPLÍCITO en carreras.ts (carrera.via). Esta función deriva
// la vía desde el prefijo del id SOLO para validar: si la convención del id contradice
// la vía declarada, se emite una advertencia (ej. `gastronomia` es técnica aunque su id
// no lleve prefijo `tecnico_`). El matching usa siempre carrera.via, no esta derivación.
function viaDerivadaDelId(id) {
  return /^tecnico_/.test(id) ? "tecnica_ip_cft" : "universitaria";
}

// Regla de Camilo para vía técnica cuando existen CFT e IP para la misma carrera:
// preferir CFT para técnicos puros e IP para carreras de gestión (administración,
// contabilidad y afines).
function esGestionTecnica(id) {
  return /(administracion|contabilidad|gestion)/.test(id);
}

const CFT = "Centro de Formación Técnica";
const IP = "Instituto Profesional";
const UNIV = "Universidad";

const resultados = [];
const ambiguedades = [];
const resueltosPorVia = [];
const sinMatch = [];

// Validación: la vía explícita debe estar bien formada y se avisa si el id (convención
// `tecnico_*`) contradice la vía declarada. No aborta: la vía explícita manda.
const viasValidas = new Set(["universitaria", "tecnica_ip_cft"]);
const viaWarnings = [];
for (const carrera of nuestrasCarreras) {
  if (!viasValidas.has(carrera.via)) {
    console.error(`ERROR: vía inválida "${carrera.via}" en ${carrera.id}. Abortando.`);
    process.exit(1);
  }
  const derivada = viaDerivadaDelId(carrera.id);
  if (derivada !== carrera.via) {
    viaWarnings.push({ id: carrera.id, declarada: carrera.via, derivadaDelId: derivada });
  }
}

for (const carrera of nuestrasCarreras) {
  const { filasEncontradas, nombreUsado } = buscarMatches(carrera);

  if (filasEncontradas.length === 0) {
    sinMatch.push({ id: carrera.id, nombre: carrera.nombre });
    resultados.push({ carrera, filas: [], estado: "sin_match" });
    continue;
  }

  // Deduplicar por tipo_institucion (mismo tipo, misma carrera_estandar => misma fila esperada)
  const porTipo = new Map();
  for (const fila of filasEncontradas) {
    if (!porTipo.has(fila.tipo_institucion)) porTipo.set(fila.tipo_institucion, []);
    porTipo.get(fila.tipo_institucion).push(fila);
  }

  if (porTipo.size > 1) {
    // La misma carrera_estandar matcheó en más de un tipo_institucion.
    // Se resuelve por la vía EXPLÍCITA declarada en carreras.ts (regla de Camilo).
    const via = carrera.via;
    let tipoElegido = null;
    if (via === "universitaria") {
      if (porTipo.has(UNIV)) tipoElegido = UNIV;
    } else {
      // Vía técnica: solo se consideran IP/CFT (se descarta Universidad si aparece).
      const tieneCFT = porTipo.has(CFT);
      const tieneIP = porTipo.has(IP);
      if (esGestionTecnica(carrera.id)) {
        tipoElegido = tieneIP ? IP : tieneCFT ? CFT : null;
      } else {
        tipoElegido = tieneCFT ? CFT : tieneIP ? IP : null;
      }
    }

    if (tipoElegido && porTipo.get(tipoElegido).length === 1) {
      const filaElegida = porTipo.get(tipoElegido)[0];
      resueltosPorVia.push({
        id: carrera.id,
        nombre: carrera.nombre,
        via,
        tipoElegido,
        descartados: [...porTipo.keys()].filter((t) => t !== tipoElegido),
      });
      resultados.push({
        carrera,
        filas: [filaElegida],
        estado: "ok",
        tipoInstitucion: tipoElegido,
        nombreUsado,
        resueltoPorVia: true,
      });
      continue;
    }

    // La vía no alcanzó a resolver (falta el tipo esperado o hay duplicado) — a Camilo.
    ambiguedades.push({
      id: carrera.id,
      nombre: carrera.nombre,
      nombresUsados: nombreUsado,
      viaDerivada: via,
      motivo: tipoElegido
        ? `tipo elegido "${tipoElegido}" tiene ${porTipo.get(tipoElegido).length} filas`
        : `la vía "${via}" no encontró tipo_institucion compatible entre [${[...porTipo.keys()].join(", ")}]`,
      tipos: [...porTipo.entries()].map(([tipo, filas]) => ({
        tipo_institucion: tipo,
        carrera_estandar: filas[0].carrera_estandar,
        emplea_1: ultimoNoNulo(filas[0], "emplea_1_", ANIOS),
        ingresos_4: ultimoNoNulo(filas[0], "ingresos_4_", ANIOS),
      })),
    });
    resultados.push({ carrera, filas: filasEncontradas, estado: "ambiguo" });
    continue;
  }

  const [tipoUnico, filasDeEseTipo] = [...porTipo.entries()][0];

  if (filasDeEseTipo.length > 1) {
    // Mismo tipo_institucion pero más de una fila (no debería pasar dado que
    // carrera_estandar es la clave dentro de un mismo tipo) — se reporta igual.
    ambiguedades.push({
      id: carrera.id,
      nombre: carrera.nombre,
      nombresUsados: nombreUsado,
      tipos: [{ tipo_institucion: tipoUnico, nota: `${filasDeEseTipo.length} filas duplicadas para el mismo tipo_institucion` }],
    });
    resultados.push({ carrera, filas: filasDeEseTipo, estado: "ambiguo" });
    continue;
  }

  resultados.push({ carrera, filas: filasDeEseTipo, estado: "ok", tipoInstitucion: tipoUnico, nombreUsado });
}

// ---------------------------------------------------------------------------
// 4. Extracción de campos para los matches limpios
// ---------------------------------------------------------------------------

function extraerDatos(fila) {
  const emplea1 = ultimoNoNulo(fila, "emplea_1_", ANIOS);
  const ingresos4 = ultimoNoNulo(fila, "ingresos_4_", ANIOS);
  const retencion1 = fila.tasa_de_retencion_1er_ano_cohorte_2009;
  const retencion2 = fila.tasa_de_retencion_2do_ano_cohorte_2009;
  const duracionEsperada = fila.duracion_esperada_del_plan_de_estudios_semestres;
  const duracionReal = fila.duracion_real_de_la_carrera_semestres;

  return {
    empleabilidad1erAnio: emplea1
      ? { porcentaje: Math.round(emplea1.valor * 1000) / 10, fuente: "mifuturo.cl (SIES)", anio: emplea1.anio }
      : { porcentaje: null, fuente: null, anio: null },
    ingreso4toAnio: ingresos4
      ? { valor: Math.round(ingresos4.valor), fuente: "mifuturo.cl (SIES)", anio: ingresos4.anio }
      : { valor: null, fuente: null, anio: null },
    retencion1erAnio: retencion1 != null
      ? { porcentaje: Math.round(Number(retencion1) * 1000) / 10, fuente: "mifuturo.cl (SIES)", anio: 2009 }
      : { porcentaje: null, fuente: null, anio: null },
    retencion2doAnio: retencion2 != null
      ? { porcentaje: Math.round(Number(retencion2) * 1000) / 10, fuente: "mifuturo.cl (SIES)", anio: 2009 }
      : { porcentaje: null, fuente: null, anio: null },
    duracionEsperadaSemestres: duracionEsperada != null ? Number(duracionEsperada) : null,
    duracionRealSemestres: duracionReal != null ? Number(duracionReal) : null,
    // Duración: dato estructural del plan de estudios, sin cohorte/año identificable
    // en el archivo fuente (a diferencia de empleabilidad/ingresos/retención). Se
    // extrae igual pero etiquetada como estructural — Camilo debe confirmar si esto
    // cumple su regla de "sin cohorte visible, no se publica".
    duracionFuenteEtiqueta: "structural — plan de estudios (mifuturo.cl / SIES, sin cohorte)",
  };
}

// ---------------------------------------------------------------------------
// 5. Escribir CSV de salida
// ---------------------------------------------------------------------------

const HEADER = [
  "id",
  "nombre",
  "estado_matching",
  "tipo_institucion_matcheado",
  "carrera_estandar_matcheado",
  "empleabilidad_1er_anio_pct",
  "empleabilidad_1er_anio_cohorte",
  "ingreso_4to_anio_clp",
  "ingreso_4to_anio_cohorte",
  "retencion_1er_anio_pct",
  "retencion_1er_anio_cohorte",
  "retencion_2do_anio_pct",
  "retencion_2do_anio_cohorte",
  "duracion_esperada_semestres",
  "duracion_real_semestres",
  "duracion_fuente_etiqueta",
  "resuelto_por_via",
];

function csvEscape(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const filasCsv = [HEADER.join(",")];

for (const r of resultados) {
  if (r.estado === "ok") {
    const d = extraerDatos(r.filas[0]);
    filasCsv.push([
      r.carrera.id,
      r.carrera.nombre,
      "ok",
      r.tipoInstitucion,
      r.filas[0].carrera_estandar,
      d.empleabilidad1erAnio.porcentaje,
      d.empleabilidad1erAnio.anio,
      d.ingreso4toAnio.valor,
      d.ingreso4toAnio.anio,
      d.retencion1erAnio.porcentaje,
      d.retencion1erAnio.anio,
      d.retencion2doAnio.porcentaje,
      d.retencion2doAnio.anio,
      d.duracionEsperadaSemestres,
      d.duracionRealSemestres,
      d.duracionFuenteEtiqueta,
      r.resueltoPorVia ? "si" : "no",
    ].map(csvEscape).join(","));
  } else {
    filasCsv.push([
      r.carrera.id,
      r.carrera.nombre,
      r.estado,
      "", "", "", "", "", "", "", "", "", "", "", "", "", "",
    ].map(csvEscape).join(","));
  }
}

fs.writeFileSync(OUT_CSV_PATH, filasCsv.join("\n") + "\n", "utf8");

// ---------------------------------------------------------------------------
// 6. Reporte de cobertura
// ---------------------------------------------------------------------------

// Candidatos por similitud para los "sin match" — solo informativo, NO se aplica
// automáticamente al matching (evita resolver ambigüedades de nombre por cuenta propia).
const todosCarreraEstandar = [...indicePorEstandar.keys()];

function jaccardTokens(a, b) {
  const setA = new Set(a.split(" ").filter((t) => t.length > 2));
  const setB = new Set(b.split(" ").filter((t) => t.length > 2));
  const inter = [...setA].filter((t) => setB.has(t)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : inter / union;
}

function candidatosPorSimilitud(carrera, topN = 2, umbral = 0.3) {
  const nombresProbar = candidatosDeNombre(carrera).map(normaliza);
  const puntuados = todosCarreraEstandar
    .map((estandar) => {
      const mejorScore = Math.max(...nombresProbar.map((n) => jaccardTokens(n, estandar)));
      return { estandar, score: mejorScore };
    })
    .filter((x) => x.score >= umbral)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
  return puntuados;
}

const ok = resultados.filter((r) => r.estado === "ok");
const conEmpleabilidad = ok.filter((r) => extraerDatos(r.filas[0]).empleabilidad1erAnio.porcentaje !== null);
const conIngreso = ok.filter((r) => extraerDatos(r.filas[0]).ingreso4toAnio.valor !== null);
const conRetencion1 = ok.filter((r) => extraerDatos(r.filas[0]).retencion1erAnio.porcentaje !== null);
const conDuracion = ok.filter((r) => extraerDatos(r.filas[0]).duracionRealSemestres !== null);

console.log("=".repeat(78));
console.log("REPORTE DE COBERTURA — ingesta_sies.mjs");
console.log("Fuente: docs/todas_las_estadisticas.json (mifuturo.cl API, action=detalleEstadisticas)");
console.log("=".repeat(78));
console.log();
const okDirectos = ok.filter((r) => !r.resueltoPorVia);
console.log(`Total carreras nuestras: ${nuestrasCarreras.length}`);
console.log(`  Match limpio directo (1 tipo_institucion):  ${okDirectos.length}`);
console.log(`  Resueltos por vía (>1 tipo, desambiguado):  ${resueltosPorVia.length}`);
console.log(`  Ambiguos no resueltos por vía:              ${ambiguedades.length}`);
console.log(`  Sin match:                                  ${sinMatch.length}`);
console.log(`  ── Total con datos SIES cargados (ok):       ${ok.length}`);
console.log();
console.log(`De los ${ok.length} con match limpio:`);
console.log(`  con empleabilidad 1er año: ${conEmpleabilidad.length}`);
console.log(`  con ingreso 4to año:       ${conIngreso.length}`);
console.log(`  con retención 1er año:     ${conRetencion1.length}`);
console.log(`  con duración real:         ${conDuracion.length}`);
console.log();

if (sinMatch.length > 0) {
  console.log("-".repeat(78));
  console.log(`SIN MATCH (${sinMatch.length}) — no aparecen en carrera_estandar del archivo SIES:`);
  console.log("(los originales de carrera_estandar que sí existen se muestran solo como candidatos por");
  console.log(" similitud de texto — NO se aplican automáticamente, requieren alta manual)");
  for (const s of sinMatch) {
    const nuestra = nuestrasCarreras.find((c) => c.id === s.id);
    const candidatos = candidatosPorSimilitud(nuestra);
    if (candidatos.length > 0) {
      console.log(`  - ${s.id}  (${s.nombre})`);
      for (const c of candidatos) console.log(`      · candidato (score ${c.score.toFixed(2)}): "${c.estandar}"`);
    } else {
      console.log(`  - ${s.id}  (${s.nombre})  — sin candidato por similitud; probablemente AUSENTE del archivo fuente`);
    }
  }
  console.log();
}

if (resueltosPorVia.length > 0) {
  console.log("-".repeat(78));
  console.log(`RESUELTOS POR VÍA (${resueltosPorVia.length}) — desambiguados con la vía explícita de carreras.ts`);
  console.log("(via = universitaria => Universidad; via = tecnica_ip_cft => CFT para técnicos puros,");
  console.log(" IP para gestión. `via` es ahora un campo declarado en el modelo Carrera.)");
  for (const r of resueltosPorVia) {
    console.log(`  - ${r.id}  (${r.nombre})  → ${r.tipoElegido}  [via=${r.via}; descartados: ${r.descartados.join(", ")}]`);
  }
  console.log();
}

if (ambiguedades.length > 0) {
  console.log("-".repeat(78));
  console.log(`AMBIGÜEDADES NO RESUELTAS (${ambiguedades.length}) — requieren resolución manual de Camilo:`);
  for (const a of ambiguedades) {
    console.log(`  - ${a.id}  (${a.nombre})  [nombres usados: ${a.nombresUsados?.join(" | ") || "n/a"}]`);
    if (a.motivo) console.log(`      motivo: ${a.motivo}`);
    for (const t of a.tipos) {
      if (t.nota) {
        console.log(`      · ${t.tipo_institucion}: ${t.nota}`);
      } else {
        console.log(`      · ${t.tipo_institucion} — carrera_estandar="${t.carrera_estandar}" — emplea_1: ${t.emplea_1 ? `${(t.emplea_1.valor*100).toFixed(1)}% (${t.emplea_1.anio})` : "null"} — ingresos_4: ${t.ingresos_4 ? `$${Math.round(t.ingresos_4.valor)} (${t.ingresos_4.anio})` : "null"}`);
      }
    }
  }
  console.log();
}

if (viaWarnings.length > 0) {
  console.log("-".repeat(78));
  console.log(`ADVERTENCIAS DE VÍA (${viaWarnings.length}) — el id contradice la convención tecnico_*, pero la vía explícita manda:`);
  for (const w of viaWarnings) {
    console.log(`  - ${w.id}: via declarada="${w.declarada}" (el prefijo del id sugeriría "${w.derivadaDelId}")`);
  }
  console.log();
}

console.log("-".repeat(78));
console.log(`Salida escrita en: ${path.relative(ROOT, OUT_CSV_PATH)}`);
console.log("No se modificó lib/data/carreras.ts. Nada a producción — pendiente revisión de Camilo.");
console.log("=".repeat(78));
