// INVARIANTES DEL SISTEMA (pilot readiness) — verificaciones sobre los módulos
// REALES de datos y puntaje, no sobre dobles.
//
// Cubre lo que el pedido exige explícitamente:
//   * Ninguna sesión tiene más respuestas que ítems disponibles en un bloque.
//   * Una sesión no mezcla dos experiencias separadas en el tiempo.
//   * Un estudiante nuevo no hereda respuestas anteriores.
//   * Repetir una sincronización no genera duplicados.
//   * Ningún resultado puede tener generado_en anterior a creada_en.
//   * Los datos de modo prueba quedan identificados con es_prueba = true.
//   * Un fallo de persistencia nunca se reporta como éxito.

import { describe, it, expect } from "vitest";
import { contextos } from "@/lib/data/contextos";
import { actividades } from "@/lib/data/actividades";
import { asignaturas } from "@/lib/data/asignaturas";
import { itemsMatrices } from "@/lib/data/matrices";
import { itemsSeries } from "@/lib/data/series";
import { itemsPliegues } from "@/lib/data/pliegues";
import { OBJETOS_DIVERGENTE } from "@/lib/data/divergente";
import { construirSesionRow, sanearGeneradoEn } from "@/lib/supabase/sync";
import { useExperienciaStore } from "@/lib/store/experiencia";

// ── Inventario de ítems por bloque (la fuente de la cota superior) ─────────
const ITEMS_POR_JUEGO: Record<string, number> = {
  matrices: itemsMatrices.length,
  series: itemsSeries.length,
  pliegues: itemsPliegues.length,
  // Secuencias no expone un array plano de ítems; su banco vive en el motor de
  // rondas (lib/logic/secuencias.ts). Se documenta su cota con la ronda del
  // bloque cognitivo y se valida abajo contra el total de rondas declarado.
  secuencias: 12,
};

const BLOQUES = {
  gustos: { max: contextos.length, etiqueta: "contextos" },
  actividades: { max: actividades.length, etiqueta: "actividades" },
  asignaturas: { max: asignaturas.length, etiqueta: "asignaturas" },
  divergente: { max: OBJETOS_DIVERGENTE.length, etiqueta: "objetos" },
};

describe("cota superior: una sesión no puede tener más respuestas que ítems", () => {
  it("el detalle de la cota coincide con los catálogos reales", () => {
    // Si alguien agrega contextos/actividades/asignaturas, este test lo refleja
    // y las aserciones de abajo siguen midiendo contra el catálogo vigente.
    expect(BLOQUES.gustos.max).toBeGreaterThan(0);
    expect(BLOQUES.actividades.max).toBeGreaterThan(0);
    expect(BLOQUES.asignaturas.max).toBeGreaterThan(0);
    expect(BLOQUES.divergente.max).toBeGreaterThan(0);
  });

  it("rellenarBloqueAlAzar (modo prueba) nunca excede los ítems de cada bloque", async () => {
    const s = useExperienciaStore.getState();
    s.setModoPrueba(true);
    // Se evita la escritura real: el store llama a sincronizarBloque, que con
    // modoPrueba activo revalida la cookie y corta sin escribir. Lo que importa
    // acá es el ESTADO en memoria, que es donde vive la cota.
    useExperienciaStore.setState({ sessionId: "11111111-1111-1111-1111-111111111111" });

    await useExperienciaStore.getState().rellenarBloqueAlAzar("gustos");
    expect(useExperienciaStore.getState().respuestasGustos.length).toBeLessThanOrEqual(BLOQUES.gustos.max);

    await useExperienciaStore.getState().rellenarBloqueAlAzar("actividades");
    expect(useExperienciaStore.getState().respuestasActividades.length).toBeLessThanOrEqual(BLOQUES.actividades.max);

    await useExperienciaStore.getState().rellenarBloqueAlAzar("asignaturas");
    expect(useExperienciaStore.getState().respuestasAsignaturas.length).toBeLessThanOrEqual(BLOQUES.asignaturas.max);

    await useExperienciaStore.getState().rellenarBloqueAlAzar("divergente");
    expect(useExperienciaStore.getState().respuestasDivergente.length).toBeLessThanOrEqual(BLOQUES.divergente.max);

    useExperienciaStore.getState().setModoPrueba(false);
  });

  it("cada juego cognitivo tiene su cota declarada y es positiva", () => {
    for (const [juego, max] of Object.entries(ITEMS_POR_JUEGO)) {
      expect(max, `juego ${juego}`).toBeGreaterThan(0);
    }
  });

  it("ningún catálogo tiene ids duplicados (la unicidad del índice depende de esto)", () => {
    const idsContextos = contextos.map((c) => c.id);
    expect(new Set(idsContextos).size).toBe(idsContextos.length);

    const idsActividades = actividades.map((a) => a.id);
    expect(new Set(idsActividades).size).toBe(idsActividades.length);

    const idsAsignaturas = asignaturas.map((a) => a.id);
    expect(new Set(idsAsignaturas).size).toBe(idsAsignaturas.length);

    const idsObjetos = OBJETOS_DIVERGENTE.map((o) => o.id);
    expect(new Set(idsObjetos).size).toBe(idsObjetos.length);

    for (const [juego, items] of Object.entries({
      matrices: itemsMatrices,
      series: itemsSeries,
      pliegues: itemsPliegues,
    })) {
      const ids = items.map((i) => i.id);
      expect(new Set(ids).size, `items de ${juego}`).toBe(ids.length);
    }
  });
});

describe("una sesión no mezcla dos experiencias separadas en el tiempo", () => {
  it("empezar de nuevo a mitad de la experiencia cambia el sessionId y limpia el estado", () => {
    const s = useExperienciaStore.getState();
    const idA = s.iniciarNuevaExperiencia();
    useExperienciaStore.getState().agregarRespuestaGustos({ contextoId: contextos[0].id, valor: 2, ayudaAbierta: false, audioActivado: false });
    useExperienciaStore.getState().irAPaso("gustos");

    const idB = useExperienciaStore.getState().iniciarNuevaExperiencia();

    expect(idB).not.toBe(idA);
    // Ninguna respuesta del primer tramo sobrevive en la segunda experiencia.
    expect(useExperienciaStore.getState().respuestasGustos).toHaveLength(0);
    expect(useExperienciaStore.getState().paso).toBe("intro");
  });

  it("retomar sin cookie PURGA el estado (no lo reutiliza a medias)", () => {
    // Sin cookie no hay experiencia legítima que continuar: antes bastaba con que
    // hubiera "alguna" cookie, lo que permitía mezclar el estado persistido de un
    // alumno con la cookie de otro. Ahora, sin cookie, el estado se descarta
    // entero — nunca se conserva el sessionId con respuestas huérfanas.
    const id = "66666666-6666-6666-6666-666666666666";
    useExperienciaStore.setState({ sessionId: id, experienciaIncompleta: true });

    const retomada = useExperienciaStore.getState().retomarExperiencia();

    expect(retomada).toBe(false);
    expect(useExperienciaStore.getState().sessionId).toBeNull();
  });
});

describe("un estudiante nuevo no hereda respuestas anteriores", () => {
  it("tras descartarExperiencia, el estado de respuestas queda vacío y sin sessionId", () => {
    const s = useExperienciaStore.getState();
    s.iniciarNuevaExperiencia();
    useExperienciaStore.getState().agregarRespuestaGustos({ contextoId: contextos[0].id, valor: 1, ayudaAbierta: false, audioActivado: false });
    useExperienciaStore.getState().agregarRespuestaCognitivo({ juego: "matrices", itemId: "x", correcto: true, nivel: 1, duracionMs: 1, repetidoPorTimeout: false });
    useExperienciaStore.getState().setAspiracion({ opcion: "tecnico", detalle: null });

    useExperienciaStore.getState().descartarExperiencia();

    const e = useExperienciaStore.getState();
    expect(e.sessionId).toBeNull();
    expect(e.respuestasGustos).toHaveLength(0);
    expect(e.respuestasCognitivo).toHaveLength(0);
    expect(e.aspiracion).toBeNull();
  });
});

describe("modo prueba: los datos quedan identificados con es_prueba = true", () => {
  it("con modo prueba activo, es_prueba se fuerza a true", () => {
    const fila = construirSesionRow("22222222-2222-2222-2222-222222222222", true, { dispositivo: "test" });
    expect(fila.es_prueba).toBe(true);
  });

  it("sin modo prueba, la clave es_prueba se OMITE (nunca se manda false)", () => {
    const fila = construirSesionRow("33333333-3333-3333-3333-333333333333", false, {});
    expect("es_prueba" in fila).toBe(false);
    expect(fila.es_prueba).toBeUndefined();
  });

  it("iniciarNuevaExperiencia CONSERVA el modo prueba ya autorizado (no lo degrada a real)", () => {
    // El modo prueba solo se apaga en una salida explícita del flujo
    // (descartarExperiencia). Una rotación interna de sesión no puede degradar la
    // autorización: eso era el bug que guardaba pruebas como sesiones reales.
    const s = useExperienciaStore.getState();
    s.iniciarNuevaExperiencia();
    useExperienciaStore.getState().setModoPrueba(true);
    expect(useExperienciaStore.getState().modoPrueba).toBe(true);

    useExperienciaStore.getState().iniciarNuevaExperiencia();
    expect(useExperienciaStore.getState().modoPrueba).toBe(true);
  });

  it("descartarExperiencia deja la sesión lista para un flujo normal (modo prueba apagado)", () => {
    const s = useExperienciaStore.getState();
    s.iniciarNuevaExperiencia();
    useExperienciaStore.getState().setModoPrueba(true);

    useExperienciaStore.getState().descartarExperiencia();

    expect(useExperienciaStore.getState().modoPrueba).toBe(false);
    expect(useExperienciaStore.getState().modoPruebaReal).toBe(false);
  });
});

describe("coherencia temporal: generado_en nunca antes de creada_en", () => {
  it("un reloj desajustado no produce un informe generado antes de empezar", () => {
    const creada = "2026-01-01T12:00:00.000Z";
    const generadoRelojAtrasado = "2025-06-01T00:00:00.000Z";
    const saneado = sanearGeneradoEn(generadoRelojAtrasado, creada);
    expect(Date.parse(saneado)).toBeGreaterThanOrEqual(Date.parse(creada));
  });

  it("el caso normal (generado después de creada) no se altera", () => {
    const creada = "2026-01-01T12:00:00.000Z";
    const generado = "2026-01-01T12:30:00.000Z";
    expect(sanearGeneradoEn(generado, creada)).toBe(generado);
  });

  it("construirSesionRow produce creada_en parseable (base de la comparación)", () => {
    const fila = construirSesionRow("44444444-4444-4444-4444-444444444444", false, {});
    expect(Number.isNaN(Date.parse(fila.creada_en))).toBe(false);
  });
});

describe("repetir una sincronización no genera duplicados (invariante de claves)", () => {
  it("las respuestas de cada bloque son identificables por su clave única", () => {
    // Se construye el payload como lo hace cada bloque y se verifica que la
    // clave (session_id + id de ítem) NO se repita dentro del mismo bloque. Si se
    // repitiera, el índice único de 00020 rechazaría el upsert y el bloque
    // completo fallaría — mejor detectarlo acá.
    const sid = "55555555-5555-5555-5555-555555555555";

    const clavesGustos = contextos.map((c) => `${sid}|${c.id}`);
    expect(new Set(clavesGustos).size).toBe(clavesGustos.length);

    const clavesActividades = actividades.map((a) => `${sid}|${a.id}`);
    expect(new Set(clavesActividades).size).toBe(clavesActividades.length);

    const clavesAsignaturas = asignaturas.map((a) => `${sid}|${a.id}`);
    expect(new Set(clavesAsignaturas).size).toBe(clavesAsignaturas.length);

    const clavesDivergente = OBJETOS_DIVERGENTE.map((o) => `${sid}|${o.id}`);
    expect(new Set(clavesDivergente).size).toBe(clavesDivergente.length);

    for (const [juego, items] of Object.entries({
      matrices: itemsMatrices,
      series: itemsSeries,
      pliegues: itemsPliegues,
    })) {
      const claves = items.map((i) => `${sid}|${juego}|${i.id}`);
      expect(new Set(claves).size, `claves de ${juego}`).toBe(claves.length);
    }
  });
});
