# Audio ambiente — Bloque A (licencias)

Mejora post-piloto (decisión de Camilo): cada contexto puede tener un loop de audio
ambiente opcional. Registro de fuente y licencia por archivo, requerido antes de subir
cualquier `.mp3` a `public/audio/`.

## Requisitos por archivo

- Duración: loop, sin límite estricto (Camilo prefiere mantener los ~20s originales en vez
  de recortar).
- Peso: ~150-160KB comprimido (mono, 64kbps).
- Contenido: ambiente crudo y realista del lugar de trabajo (obra, oficina, laboratorio,
  sala de clases, campo, cafetería, etc.). Nunca música ni sonido "publicitario". Sin voces
  con datos de medición, nombres de carreras ni pistas.
- Licencia: libre y verificada (Freesound CC0 o equivalente). Documentar acá antes de
  agregar la entrada correspondiente en `lib/data/audioContextos.ts`.

## Registro

Los 24 archivos de este lote vienen de `Sonidos Test/` (entregados por Camilo el
2026-07-27, generados con Eleven Labs, licencia libre — confirmado por Camilo). Se
mantiene la duración original (~19.88s, redondeada a 20 en `audioContextos.ts`) y se
re-codificaron a mono/64kbps con fade in/out de 0.3s para evitar clics en el loop
(originales: estéreo, 192kbps, ~478KB).

| escenaId | archivo | fuente | licencia | autor/link |
|---|---|---|---|---|
| obra-construccion | obra-construccion.mp3 | Eleven Labs | Libre | |
| packing-agricola | packing-agricola.mp3 | Eleven Labs | Libre | |
| taller-mecanico | taller-mecanico.mp3 | Eleven Labs | Libre | |
| laboratorio-clinico | laboratorio-clinico.mp3 | Eleven Labs | Libre | |
| residencia-adultos-mayores | residencia-adultos-mayores.mp3 | Eleven Labs | Libre | |
| guardaparque-sendero | guardaparque-sendero.mp3 | Eleven Labs | Libre | |
| estudio-branding | estudio-branding.mp3 | Eleven Labs | Libre | |
| rodaje-audiovisual | rodaje-audiovisual.mp3 | Eleven Labs | Libre | |
| estudio-arquitectura | estudio-arquitectura.mp3 | Eleven Labs | Libre | |
| sala-clases | sala-clases.mp3 | Eleven Labs | Libre | |
| oficina-municipal | oficina-municipal.mp3 | Eleven Labs | Libre | |
| oficina-rrhh | oficina-rrhh.mp3 | Eleven Labs | Libre | |
| consultorio-medico | consultorio-medico.mp3 | Eleven Labs | Libre | |
| control-calidad-alimentos | control-calidad-alimentos.mp3 | Eleven Labs | Libre | |
| clinica-kinesiologia | clinica-kinesiologia.mp3 | Eleven Labs | Libre | |
| analista-datos-retail | analista-datos-retail.mp3 | Eleven Labs | Libre | |
| startup-oficina | startup-oficina.mp3 | Eleven Labs | Libre | |
| administracion-pyme | administracion-pyme.mp3 | Eleven Labs | Libre | |
| oficina-auditoria | oficina-auditoria.mp3 | Eleven Labs | Libre | |
| electricista-industrial | electricista-industrial.mp3 | Eleven Labs | Libre | |
| bodega-logistica | bodega-logistica.mp3 | Eleven Labs | Libre | |
| ingeniero-forestal | ingeniero-forestal.mp3 | Eleven Labs | Libre | |
| investigacion-postgrado | investigacion-postgrado.mp3 | Eleven Labs | Libre | |
| local-gastronomico | local-gastronomico.mp3 | Eleven Labs | Libre | |

Archivos sin usar de `Sonidos Test/`: `23Temperate_southern_r...` (río) y
`24Small_fishing_harbor...` (puerto pesquero) — no calzan con ningún contexto.

Al cargar un archivo: agregar la fila acá, guardar el `.mp3` en `public/audio/`, y agregar
la entrada `{ archivo, duracionS }` en `AUDIO_CONTEXTOS` (`lib/data/audioContextos.ts`).
