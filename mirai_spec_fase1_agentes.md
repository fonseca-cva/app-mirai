# ESPECIFICACIÓN TÉCNICA — MIRAI FASE 1
## Portal: Portada + Bloque de Gustos (experiencia demo)
**Versión 1.0 — Este documento es la única fuente de verdad. Ante ambigüedad: elegir la opción más simple y dejar comentario `// DECISIÓN:` en el código. NO agregar features fuera de alcance.**

---

## 1. CONTEXTO (leer, no construir nada de esta sección)

Mirai es una plataforma chilena de orientación vocacional para estudiantes de 16-18 años. Mide intereses (reacción a contextos laborales), capacidades (mini-juegos) y cruza con datos de mercado. Esta Fase 1 construye SOLO: (a) la portada del portal, (b) el Bloque de Gustos como experiencia jugable de punta a punta con resultado parcial en pantalla. Los demás bloques, el registro, el informe completo y el pago vienen en fases posteriores.

Identidad: mundo de papel / origami en capas. Metáfora de marca: algo plano toma forma pliegue a pliegue. Tono: cercano, juvenil, nunca infantil; español de Chile neutro (tuteo, sin jerga forzada).

---

## 2. STACK (obligatorio, no sustituir)

- **Next.js 14+ (App Router) + React + TypeScript**
- **Tailwind CSS** para estilos; tokens de diseño en `tailwind.config` (sección 4)
- **Framer Motion** para animaciones de pliegue y parallax
- Deploy: **Vercel** (el repo debe buildear con `next build` sin warnings críticos)
- Repositorio: GitHub, rama `main` protegida, trabajo en `dev`
- **Prohibido en Fase 1:** backend, base de datos, autenticación, cookies de tracking, Google Analytics, AdSense o cualquier publicidad, librerías de UI pesadas (MUI, AntD), WordPress/CMS, jQuery
- Estado del avance del Bloque de Gustos: en memoria (estado React). Si el usuario recarga, se reinicia (aceptable en Fase 1).
- Preparar carpeta `/lib/config/` con tokens y textos centralizados (los textos NO van hardcodeados en componentes)

---

## 3. ESTRUCTURA DEL REPO

```
/app
  /page.tsx                 → Portada (landing)
  /experiencia/page.tsx     → Bloque de Gustos
/components
  /landing/  (Hero, ComoFunciona, TeaserExperiencia, TeaserInforme, Respaldo, ParaColegios, Contacto, Footer)
  /experiencia/ (IntroExperiencia, TarjetaContexto, BarraProgreso, ResultadoParcial)
  /origami/  (PaperLayer, FoldTransition, GruaOrigami, FondoCapas)
/lib
  /config/tokens.ts         → paleta, tipografía, espaciados
  /config/textos.ts         → todos los textos del sitio
  /data/contextos.ts        → los 24 contextos laborales (sección 6)
  /logic/puntaje.ts         → cálculo de dimensiones
/public/img                 → ilustraciones (sección 5)
```

---

## 4. TOKENS DE DISEÑO (paleta cálida; implementar como variables intercambiables)

```ts
colores: {
  papel:     '#F7F2E9',  // fondo base, papel crudo
  papelSombra:'#E8E0D0', // capas traseras
  tinta:     '#2B2B33',  // texto principal
  coral:     '#E86A4F',  // acento primario (CTA, energía)
  salvia:    '#7FA08C',  // acento secundario (calma, respaldo)
  dorado:    '#D9A441',  // detalles, momentos de logro
  blancoPapel:'#FFFDF8', // tarjetas en primer plano
}
tipografia: {
  display: 'Fraunces (Google Fonts), serif',   // títulos — carácter, calidez
  cuerpo:  'Inter (Google Fonts), sans-serif', // texto — legibilidad
}
```
- Sombras suaves y difusas entre capas de papel (simular profundidad de diorama), nunca sombras duras.
- Bordes de "papel": esquinas levemente irregulares en elementos decorativos (clip-path o SVG), NO en botones ni formularios (esos, limpios y accesibles).
- Radio estándar: 14px. Espaciado generoso.

---

## 5. ILUSTRACIONES ORIGAMI (generarlas como SVG en código, no buscar imágenes)

- Todas las figuras decorativas son SVG planos estilo papel doblado: polígonos con 2-3 tonos del mismo color simulando caras plegadas.
- Piezas requeridas: grulla (logo-símbolo, aparece plegándose), montañas en capas (fondo hero, 3-4 capas parallax), avión de papel (CTA/transiciones), 12 iconos de contextos laborales (uno por contexto, estilo geométrico plegado, monocromo + acento).
- Parallax del hero: capas se desplazan a distinta velocidad con el scroll (Framer Motion `useScroll`). Sutil: máximo 40px de desplazamiento diferencial.
- **Respetar `prefers-reduced-motion`: si está activo, todas las animaciones se reducen a fades simples.**

---

## 6. PÁGINA 1 — PORTADA (`/`)

Secciones en orden (una pantalla de alto aprox. cada una, scroll continuo):

**6.1 Hero.** Fondo: montañas de papel en capas con parallax + grulla que termina de plegarse al cargar (animación única de entrada, 1.5s máx). Titular: "¿Y tú, qué forma tienes?" Subtítulo: "Descubre qué estudiar jugando. Basado en evidencia y datos reales de Chile." CTA único (coral): "Descúbrelo gratis" → `/experiencia`. Nav mínima fija: logo Mirai (texto + grulla pequeña), anclas a Cómo funciona / Respaldo / Colegios, CTA repetido.

**6.2 Cómo funciona.** Tres tarjetas-pliegue que se despliegan al entrar en viewport: "Juega" (mini-juegos que miden tus capacidades reales), "Reacciona" (contextos de trabajo reales: descubre qué te atrae de verdad), "Descubre" (tu informe cruza quién eres con datos reales de empleo e ingresos). Icono origami por tarjeta.

**6.3 Teaser de la experiencia.** Mockup estilizado (no screenshots reales) de una tarjeta de contexto + una frase: "25 minutos. Sin respuestas correctas. Solo tú." Botón secundario → `/experiencia`.

**6.4 El informe.** Ilustración de informe desplegándose como mapa de papel. Bullets de qué recibe: perfil de intereses, fortalezas, caminos concretos con datos de empleabilidad e ingresos (fuente: mifuturo.cl). Mención sobria: "Versión gratuita y versión profunda." SIN precios en Fase 1.

**6.5 Respaldo ("¿Por qué confiar en Mirai?").** Fondo salvia claro, tono sobrio. 4 viñetas: (1) Modelo de tres pilares: lo que te gusta + para qué eres bueno/a + cómo está el mercado. (2) Construido sobre metodologías validadas internacionalmente en medición de intereses y capacidades. (3) Datos laborales de fuentes oficiales chilenas. (4) Datos personales: pedimos lo mínimo, jamás vendemos información, cumplimiento de la ley chilena de protección de datos. Cifra destacada: "1 de cada 4 estudiantes abandona su carrera el primer año (SIES). Mirai existe para cambiar eso." **PROHIBIDO: prometer % de impacto propio, nombrar personas del equipo, detallar ítems o algoritmos.**

**6.6 Para colegios.** Franja compacta: "Tu generación completa, evaluada en una hora pedagógica. Reporte agregado para tu equipo de orientación." CTA outline: "Conversemos" → mailto:colegios@somosmirai.cl (placeholder).

**6.7 Contacto + Footer.** Formulario simple (nombre, correo, motivo: estudiante-apoderado/colegio/otro, mensaje) — en Fase 1 el submit abre mailto: con el contenido precargado (sin backend). Footer: © Mirai 2026 · Proyecto chileno · enlaces Términos y Privacidad (páginas placeholder con texto "En construcción" digno, no lorem ipsum).

---

## 7. PÁGINA 2 — BLOQUE DE GUSTOS (`/experiencia`)

**7.1 Intro (una pantalla).** "Vas a ver 24 lugares de trabajo reales. Imagina que es tu lunes a las 9 AM. Responde rápido, con la guata: no hay respuestas correctas." Botón: "Empezar". Nota: "≈ 6 minutos · puedes pausar".

**7.2 Mecánica de tarjetas.** Una tarjeta por pantalla, centrada, estilo papel en primer plano sobre fondo de capas. Contenido: icono origami del contexto + nombre + descripción de 1-2 líneas (cruda y realista, no idealizada). Tres botones de reacción: "No es para mí" / "Podría ser" / "Me atrae" (valores 0/1/2). Transición entre tarjetas: pliegue de papel (FoldTransition), 400ms. Barra de progreso superior como tira de papel que se va plegando (24 segmentos). Botón pausa (guarda solo en memoria).

**7.3 Datos: 24 contextos en `/lib/data/contextos.ts`.** Ocho dimensiones, 3 contextos cada una. Estructura: `{ id, dimension, nombre, descripcion, icono }`. Dimensiones (código y etiqueta): `tec` Técnico-Manual · `cie` Científico-Analítico · `cre` Creativo · `soc` Social-Humano · `sal` Salud y Cuidado · `ges` Gestión y Emprendimiento · `dat` Datos y Organización · `nat` Naturaleza y Terreno. Redactar los 24 con lugares chilenos verosímiles (obra, laboratorio, sala de clases, consultorio, campo, oficina de auditoría, estudio creativo, startup, packing agrícola, etc.), descripciones honestas tipo "lunes 9 AM" (incluir lo incómodo: plazos, ruido, presión). Marcar el archivo con comentario: `// CONTENIDO PROVISORIO — pendiente de revisión metodológica`.

**7.4 Resultado parcial (al terminar las 24).** Animación: las respuestas "se pliegan" en una figura (grulla tomando forma). Mostrar: top 3 dimensiones con barras estilo tira de papel + 2 líneas de lectura amable por dimensión top 1 (banco de textos en `textos.ts`). Cierre honesto: "Esto es solo tu primer pliegue. Los mini-juegos de capacidades y tu informe completo: muy pronto." CTA: "Avísame cuando esté listo" → mailto placeholder. **PROHIBIDO: recomendar carreras específicas en Fase 1** (el resultado parcial habla de ÁREAS, no de carreras — sin capacidades ni datos de mercado sería una recomendación coja).

**7.5 Cálculo (`/lib/logic/puntaje.ts`).** Puntaje por dimensión = suma respuestas / máximo posible (0-100). Empates: orden estable por puntaje bruto, luego alfabético. Función pura con tests unitarios básicos (3 casos: todo 0, todo 2, mixto).

---

## 8. REQUISITOS TRANSVERSALES

- **Mobile-first real:** diseñar en 375px primero; el sitio se usará mayormente en celulares de gama media. Probar también 1440px.
- Accesibilidad: contraste AA, foco visible, navegable por teclado, `alt` en todo SVG significativo, `prefers-reduced-motion` respetado.
- Performance: Lighthouse mobile ≥ 85 en Performance y ≥ 95 en Accessibility. Fuentes con `display: swap`. Sin imágenes rasterizadas pesadas (todo SVG).
- SEO básico: metadatos, OG tags (título: "Mirai — Descubre qué estudiar"), favicon grulla.
- Idioma: TODO en español de Chile. Sin lorem ipsum en ningún lugar.
- Cero datos personales recolectados en Fase 1 (el formulario de contacto usa mailto, no almacena).

---

## 9. DEFINICIÓN DE HECHO (verificar antes de entregar)

1. `next build` sin errores; deploy en Vercel funcionando.
2. Portada completa con las 7 secciones, parallax y animación de grulla.
3. Bloque de Gustos jugable de punta a punta: intro → 24 tarjetas → resultado parcial.
4. Transiciones de pliegue funcionando y desactivables por reduced-motion.
5. Los 24 contextos redactados (chilenos, honestos) y el banco de textos completo en `textos.ts`.
6. Tests de `puntaje.ts` pasando.
7. Lighthouse mobile: Performance ≥ 85, Accessibility ≥ 95.
8. Revisión final contra la lista de PROHIBIDOS (secciones 2, 6.5, 7.4).

## 10. FUERA DE ALCANCE (no construir aunque parezca buena idea)

Registro/login · guardado persistente · mini-juegos cognitivos · bloque verbal/IA · informe completo · pagos · panel de colegios · blog/artículos · analytics · modo oscuro · i18n · PWA/offline.
