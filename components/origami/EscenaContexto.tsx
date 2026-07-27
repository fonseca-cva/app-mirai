import { useId } from "react";
import { ajustarLuminosidad, colores } from "@/lib/config/tokens";
import { ACENTOS } from "@/components/origami/IconoContexto";
import type { DimensionCodigo } from "@/lib/data/contextos";

// ITERACIÓN 2 (A.1): diorama SVG por contexto. Piezas paramétricas reutilizadas
// entre escenas para no disparar el peso del set completo (presupuesto: <350KB).
// Mismo lenguaje visual del sitio: 3 tonos según LUZ superior-izquierda
// (izquierda = clara, derecha = sombra), acento por dimensión, pliegues sutiles.

interface EscenaContextoProps {
  escenaId: string;
  dimension: DimensionCodigo;
  className?: string;
}

const TONO_BASE = colores.tinta;
const TONO_CLARO = ajustarLuminosidad(TONO_BASE, 8);
const TONO_OSCURO = ajustarLuminosidad(TONO_BASE, -12);
// Capa lejana: perspectiva atmosférica (mezcla hacia papel, sección B.6 de tokens).
const TONO_LEJANO = ajustarLuminosidad(TONO_BASE, 22);

function crease(id: string, x1: number, y1: number, x2: number, y2: number, opacity = 0.2) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={`url(#${id})`} strokeWidth={1} opacity={opacity} />;
}

// Figura humana de papel: silueta neutra (sin género, sin rasgos), siempre EN ACCIÓN.
// La pose (brazo/postura) comunica el oficio, no el vestuario.
function FiguraPapel({
  x,
  y,
  pose,
  acento,
  escala = 1,
}: {
  x: number;
  y: number;
  pose: "martillo" | "puntero" | "empuje" | "sentado";
  acento: string;
  escala?: number;
}) {
  const cuerpo = (
    <>
      {/* cabeza */}
      <polygon points="0,-38 6,-32 0,-26 -6,-32" fill={TONO_CLARO} />
      {/* torso */}
      <polygon points="-7,-26 7,-26 9,0 -9,0" fill={TONO_BASE} />
      <polygon points="0,-26 7,-26 9,0 0,0" fill={TONO_OSCURO} />
      {/* piernas */}
      <polygon points="-9,0 0,0 -3,26 -10,26" fill={TONO_OSCURO} />
      <polygon points="0,0 9,0 6,26 -1,26" fill={TONO_CLARO} />
    </>
  );

  const brazos = {
    martillo: (
      <>
        <polygon points="-7,-22 -18,-34 -13,-38 -3,-24" fill={TONO_CLARO} />
        <polygon points="-20,-40 -10,-34 -14,-28 -24,-34" fill={acento} />
        <polygon points="7,-22 14,-6 8,-4 2,-20" fill={TONO_OSCURO} />
      </>
    ),
    puntero: (
      <>
        <polygon points="7,-22 22,-30 25,-25 10,-18" fill={TONO_OSCURO} />
        <polygon points="-7,-22 -14,-6 -8,-4 -2,-20" fill={TONO_CLARO} />
      </>
    ),
    empuje: (
      <>
        <polygon points="7,-20 22,-14 20,-6 6,-12" fill={TONO_OSCURO} />
        <polygon points="-7,-20 -22,-14 -20,-6 -6,-12" fill={TONO_CLARO} />
      </>
    ),
    sentado: (
      <>
        <polygon points="-7,-22 -16,-12 -10,-8 -2,-18" fill={TONO_CLARO} />
        <polygon points="7,-22 16,-12 10,-8 2,-18" fill={TONO_OSCURO} />
      </>
    ),
  }[pose];

  return (
    <g transform={`translate(${x} ${y}) scale(${escala})`}>
      {cuerpo}
      {brazos}
    </g>
  );
}

function Mesa({ x, y, ancho = 44 }: { x: number; y: number; ancho?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <polygon points={`0,0 ${ancho},0 ${ancho - 6},10 6,10`} fill={TONO_CLARO} />
      <polygon points={`6,10 ${ancho - 6},10 ${ancho - 6},34 6,34`} fill={TONO_OSCURO} opacity={0.7} />
    </g>
  );
}

function Pantalla({ x, y, acento }: { x: number; y: number; acento: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <polygon points="0,0 26,0 26,18 0,18" fill={TONO_BASE} />
      <polygon points="3,3 23,3 23,15 3,15" fill={acento} opacity={0.35} />
      <polygon points="10,18 16,18 18,24 8,24" fill={TONO_OSCURO} />
    </g>
  );
}

function Planta({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <polygon points="-6,0 6,0 4,10 -4,10" fill={TONO_OSCURO} />
      <polygon points="0,-16 -8,-2 0,-4" fill={colores.salvia} />
      <polygon points="0,-14 8,-2 0,-2" fill={ajustarLuminosidad(colores.salvia, 10)} />
    </g>
  );
}

function CajaFruta({ x, y, acento }: { x: number; y: number; acento: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <polygon points="0,10 28,10 24,28 4,28" fill={TONO_CLARO} />
      <polygon points="4,28 24,28 22,34 6,34" fill={TONO_OSCURO} opacity={0.6} />
      <circle cx="10" cy="12" r="3.4" fill={acento} />
      <circle cx="17" cy="10" r="3.4" fill={ajustarLuminosidad(acento, 12)} />
      <circle cx="23" cy="13" r="3.4" fill={acento} />
    </g>
  );
}

// ─── Helpers compartidos entre 2+ escenas nuevas (Iteración 2, set B) ───
function Arbol({ x, y, escala = 1 }: { x: number; y: number; escala?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${escala})`}>
      <polygon points="-3,0 3,0 4,26 -4,26" fill={TONO_OSCURO} />
      <polygon points="0,-34 -16,-4 16,-4" fill={TONO_BASE} />
      <polygon points="0,-34 0,-4 16,-4" fill={TONO_OSCURO} opacity={0.45} />
      <polygon points="0,-22 -11,2 11,2" fill={TONO_CLARO} opacity={0.5} />
    </g>
  );
}

// Rack de tubos de ensayo (labs: cie-01/cie-02/cie-03).
function TuboEnsayo({ x, y, acento }: { x: number; y: number; acento: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <polygon points="0,0 5,0 5,20 2.5,24 0,20" fill={TONO_CLARO} />
      <polygon points="0,10 5,10 5,20 2.5,24 0,20" fill={acento} opacity={0.85} />
      <polygon points="8,4 13,4 13,22 10.5,26 8,22" fill={TONO_BASE} />
      <polygon points="8,13 13,13 13,22 10.5,26 8,22" fill={ajustarLuminosidad(acento, 10)} opacity={0.85} />
      <polygon points="16,-2 21,-2 21,24 18.5,28 16,24" fill={TONO_CLARO} />
      <polygon points="16,15 21,15 21,24 18.5,28 16,24" fill={acento} opacity={0.85} />
    </g>
  );
}

// Vehículo simple: auto (tec-02) o camión (dat-02).
function Vehiculo({
  x,
  y,
  acento,
  tipo = "auto",
}: {
  x: number;
  y: number;
  acento: string;
  tipo?: "auto" | "camion";
}) {
  if (tipo === "camion") {
    return (
      <g transform={`translate(${x} ${y})`}>
        <polygon points="0,14 60,14 60,-6 40,-6 34,-18 0,-18" fill={TONO_BASE} />
        <polygon points="40,-6 58,-6 60,8 40,8" fill={TONO_CLARO} opacity={0.5} />
        <polygon points="4,-2 12,-2 12,4 4,4" fill={acento} opacity={0.7} />
        <circle cx="14" cy="16" r="6" fill={TONO_OSCURO} />
        <circle cx="48" cy="16" r="6" fill={TONO_OSCURO} />
      </g>
    );
  }
  return (
    <g transform={`translate(${x} ${y})`}>
      <polygon points="0,16 4,0 34,-10 46,0 50,16" fill={TONO_BASE} />
      <polygon points="10,0 20,-8 32,-8 40,0" fill={TONO_CLARO} opacity={0.6} />
      <polygon points="0,16 50,16 48,20 2,20" fill={acento} opacity={0.5} />
      <circle cx="12" cy="18" r="5.5" fill={TONO_OSCURO} />
      <circle cx="38" cy="18" r="5.5" fill={TONO_OSCURO} />
    </g>
  );
}

// Camilla (sal-01/sal-02/sal-03).
function Camilla({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <polygon points="0,0 50,0 50,10 0,10" fill={TONO_CLARO} />
      <polygon points="0,10 50,10 46,16 4,16" fill={TONO_OSCURO} opacity={0.6} />
      <polygon points="0,-6 14,-6 14,2 0,2" fill={colores.blancoPapel} opacity={0.9} />
      <line x1="4" y1="0" x2="4" y2="16" stroke={TONO_OSCURO} strokeWidth={1.2} opacity={0.35} />
      <line x1="46" y1="0" x2="46" y2="16" stroke={TONO_OSCURO} strokeWidth={1.2} opacity={0.35} />
    </g>
  );
}

// Carpeta / pila de papeles (ges-02, dat-01, dat-03).
function Carpeta({ x, y, acento }: { x: number; y: number; acento: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <polygon points="0,10 24,10 24,26 0,26" fill={TONO_CLARO} />
      <polygon points="0,4 20,4 24,10 0,10" fill={TONO_BASE} />
      <polygon points="4,0 20,0 20,4 4,4" fill={acento} opacity={0.7} />
      <line x1="3" y1="16" x2="20" y2="16" stroke={TONO_OSCURO} strokeWidth={1} opacity={0.3} />
      <line x1="3" y1="21" x2="20" y2="21" stroke={TONO_OSCURO} strokeWidth={1} opacity={0.3} />
    </g>
  );
}

// ─── Escena 1: Obra en construcción (tec-01, capataz de obra) ───────────
function EscenaObraConstruccion({ id, acento }: { id: string; acento: string }) {
  return (
    <>
      {/* cielo/piso */}
      <rect x="0" y="0" width="200" height="120" fill="none" />
      <line x1="0" y1="104" x2="200" y2="104" stroke={TONO_OSCURO} strokeWidth={1} opacity={0.15} />

      {/* grúa de papel, capa lejana */}
      <g opacity={0.9}>
        <polygon points="150,104 156,104 154,30 150,30" fill={TONO_LEJANO} />
        <polygon points="150,32 190,20 190,26 152,38" fill={TONO_LEJANO} />
        <line x1="188" y1="22" x2="188" y2="48" stroke={TONO_LEJANO} strokeWidth={1.5} />
      </g>

      {/* estructura a medio levantar */}
      <g>
        <polygon points="30,104 40,104 40,40 30,40" fill={TONO_CLARO} />
        <polygon points="70,104 80,104 80,34 70,34" fill={TONO_BASE} />
        <polygon points="40,50 70,50 70,56 40,56" fill={TONO_OSCURO} />
        <polygon points="40,74 70,74 70,80 40,80" fill={TONO_OSCURO} />
        {crease(id, 40, 40, 40, 104, 0.15)}
        {crease(id, 70, 34, 70, 104, 0.15)}
      </g>

      {/* casco (acento) sobre la figura */}
      <FiguraPapel x={100} y={100} pose="martillo" acento={acento} escala={0.9} />
      <FiguraPapel x={122} y={102} pose="puntero" acento={acento} escala={0.8} />

      {/* plano sobre mesa baja, primer plano */}
      <Mesa x={10} y={90} ancho={30} />
      <polygon points="12,88 36,88 36,92 12,92" fill={colores.blancoPapel} opacity={0.9} />
      <line x1="16" y1="90" x2="32" y2="90" stroke={acento} strokeWidth={1} opacity={0.6} />
    </>
  );
}

// ─── Escena 2: Packing agrícola (nat-01) ────────────────────────────────
function EscenaPackingAgricola({ id, acento }: { id: string; acento: string }) {
  return (
    <>
      <line x1="0" y1="104" x2="200" y2="104" stroke={TONO_OSCURO} strokeWidth={1} opacity={0.15} />

      {/* cajas apiladas al fondo */}
      <g opacity={0.85}>
        <CajaFruta x={150} y={56} acento={ajustarLuminosidad(acento, 6)} />
        <CajaFruta x={172} y={62} acento={ajustarLuminosidad(acento, 6)} />
      </g>

      {/* mesón / línea de packing, primer plano */}
      <polygon points="10,80 190,80 182,96 18,96" fill={TONO_CLARO} />
      <polygon points="18,96 182,96 178,104 22,104" fill={TONO_OSCURO} opacity={0.6} />
      {crease(id, 10, 80, 190, 80, 0.15)}

      <CajaFruta x={30} y={54} acento={acento} />
      <CajaFruta x={70} y={50} acento={acento} />

      <FiguraPapel x={110} y={96} pose="empuje" acento={acento} escala={0.9} />
      <FiguraPapel x={140} y={98} pose="martillo" acento={acento} escala={0.85} />
    </>
  );
}

// ─── Escena 3: Taller mecánico (tec-02, mecánico automotriz) ────────────
function EscenaTallerMecanico({ id, acento }: { id: string; acento: string }) {
  return (
    <>
      <line x1="0" y1="104" x2="200" y2="104" stroke={TONO_OSCURO} strokeWidth={1} opacity={0.15} />

      {/* neumáticos apilados al fondo */}
      <g opacity={0.85}>
        <circle cx="172" cy="92" r="11" fill={TONO_LEJANO} />
        <circle cx="172" cy="74" r="11" fill={TONO_LEJANO} />
      </g>

      <Vehiculo x={80} y={78} acento={acento} />
      {crease(id, 80, 78, 130, 94, 0.15)}

      <FiguraPapel x={58} y={100} pose="puntero" acento={acento} escala={0.9} />

      <Mesa x={10} y={88} ancho={34} />
      <polygon points="16,86 38,86 38,88 16,88" fill={acento} opacity={0.6} />
    </>
  );
}

// ─── Escena 4: Electricista industrial (tec-03) ─────────────────────────
function EscenaElectricistaIndustrial({ id, acento }: { id: string; acento: string }) {
  return (
    <>
      <line x1="0" y1="104" x2="200" y2="104" stroke={TONO_OSCURO} strokeWidth={1} opacity={0.15} />

      {/* tablero eléctrico */}
      <g>
        <polygon points="120,26 172,26 172,100 120,100" fill={TONO_BASE} />
        <polygon points="120,26 172,26 172,32 120,32" fill={TONO_CLARO} />
        <polygon points="128,40 164,40 164,50 128,50" fill={TONO_OSCURO} opacity={0.5} />
        <polygon points="128,56 164,56 164,66 128,66" fill={TONO_OSCURO} opacity={0.5} />
        <polygon points="128,72 164,72 164,82 128,82" fill={TONO_OSCURO} opacity={0.5} />
        <circle cx="158" cy="45" r="2.2" fill={acento} />
        {crease(id, 120, 26, 120, 100, 0.15)}
      </g>

      <line x1="30" y1="104" x2="70" y2="64" stroke={TONO_OSCURO} strokeWidth={1.4} opacity={0.4} />
      <line x1="70" y1="64" x2="120" y2="70" stroke={TONO_OSCURO} strokeWidth={1.4} opacity={0.4} />

      <FiguraPapel x={72} y={100} pose="puntero" acento={acento} escala={0.95} />
      <FiguraPapel x={44} y={102} pose="sentado" acento={acento} escala={0.8} />
    </>
  );
}

// ─── Escena 5: Laboratorio clínico (cie-01) ─────────────────────────────
function EscenaLaboratorioClinico({ id, acento }: { id: string; acento: string }) {
  return (
    <>
      <line x1="0" y1="104" x2="200" y2="104" stroke={TONO_OSCURO} strokeWidth={1} opacity={0.15} />

      <g opacity={0.85}>
        <TuboEnsayo x={150} y={54} acento={acento} />
        <TuboEnsayo x={172} y={58} acento={ajustarLuminosidad(acento, 8)} />
      </g>

      <Mesa x={20} y={88} ancho={140} />
      {crease(id, 20, 88, 160, 88, 0.15)}

      <TuboEnsayo x={70} y={64} acento={acento} />
      <TuboEnsayo x={92} y={62} acento={ajustarLuminosidad(acento, -6)} />

      <FiguraPapel x={130} y={98} pose="sentado" acento={acento} escala={0.9} />
      <FiguraPapel x={40} y={100} pose="puntero" acento={acento} escala={0.85} />
    </>
  );
}

// ─── Escena 6: Investigación de postgrado (cie-02) ──────────────────────
function EscenaInvestigacionPostgrado({ id, acento }: { id: string; acento: string }) {
  return (
    <>
      <line x1="0" y1="104" x2="200" y2="104" stroke={TONO_OSCURO} strokeWidth={1} opacity={0.15} />

      <Pantalla x={150} y={54} acento={acento} />
      <Carpeta x={30} y={70} acento={acento} />
      <Carpeta x={54} y={76} acento={ajustarLuminosidad(acento, 8)} />

      <Mesa x={90} y={88} ancho={70} />
      {crease(id, 90, 88, 160, 88, 0.15)}
      <TuboEnsayo x={100} y={62} acento={acento} />

      <FiguraPapel x={130} y={98} pose="sentado" acento={acento} escala={0.9} />
    </>
  );
}

// ─── Escena 7: Control de calidad, planta de alimentos (cie-03) ────────
function EscenaControlCalidadAlimentos({ id, acento }: { id: string; acento: string }) {
  return (
    <>
      <line x1="0" y1="104" x2="200" y2="104" stroke={TONO_OSCURO} strokeWidth={1} opacity={0.15} />

      <g opacity={0.85}>
        <CajaFruta x={150} y={56} acento={ajustarLuminosidad(acento, 6)} />
        <CajaFruta x={172} y={62} acento={ajustarLuminosidad(acento, 6)} />
      </g>

      <Mesa x={20} y={86} ancho={110} />
      {crease(id, 20, 86, 130, 86, 0.15)}
      <TuboEnsayo x={40} y={62} acento={acento} />

      <FiguraPapel x={90} y={98} pose="puntero" acento={acento} escala={0.9} />
      <FiguraPapel x={112} y={100} pose="sentado" acento={acento} escala={0.8} />
    </>
  );
}

// ─── Escena 8: Estudio de branding (cre-01) ──────────────────────────────
function EscenaEstudioBranding({ id, acento }: { id: string; acento: string }) {
  return (
    <>
      <line x1="0" y1="104" x2="200" y2="104" stroke={TONO_OSCURO} strokeWidth={1} opacity={0.15} />

      <Pantalla x={140} y={46} acento={acento} />
      <Pantalla x={168} y={52} acento={ajustarLuminosidad(acento, 10)} />

      {/* post-its */}
      <polygon points="30,50 42,50 42,60 30,60" fill={acento} opacity={0.6} />
      <polygon points="46,54 58,54 58,64 46,64" fill={ajustarLuminosidad(acento, 12)} opacity={0.6} />

      <Mesa x={20} y={88} ancho={90} />
      {crease(id, 20, 88, 110, 88, 0.15)}

      <FiguraPapel x={60} y={100} pose="sentado" acento={acento} escala={0.9} />
    </>
  );
}

// ─── Escena 9: Rodaje audiovisual (cre-02) ───────────────────────────────
function EscenaRodajeAudiovisual({ id, acento }: { id: string; acento: string }) {
  return (
    <>
      <line x1="0" y1="104" x2="200" y2="104" stroke={TONO_OSCURO} strokeWidth={1} opacity={0.15} />

      {/* foco de set, capa lejana */}
      <g opacity={0.9}>
        <polygon points="160,104 164,104 164,50 160,50" fill={TONO_LEJANO} />
        <polygon points="150,50 174,50 168,32 156,32" fill={acento} opacity={0.7} />
      </g>

      <line x1="40" y1="104" x2="70" y2="60" stroke={TONO_OSCURO} strokeWidth={1.2} opacity={0.35} />
      <line x1="70" y1="60" x2="110" y2="70" stroke={TONO_OSCURO} strokeWidth={1.2} opacity={0.35} />

      {/* cámara simple */}
      <polygon points="90,70 112,70 112,84 90,84" fill={TONO_BASE} />
      <polygon points="112,74 122,68 122,86 112,80" fill={TONO_OSCURO} />
      {crease(id, 90, 70, 112, 84, 0.15)}

      <FiguraPapel x={80} y={100} pose="empuje" acento={acento} escala={0.9} />
      <FiguraPapel x={50} y={102} pose="puntero" acento={acento} escala={0.85} />
    </>
  );
}

// ─── Escena 10: Estudio de arquitectura (cre-03) ─────────────────────────
function EscenaEstudioArquitectura({ id, acento }: { id: string; acento: string }) {
  return (
    <>
      <line x1="0" y1="104" x2="200" y2="104" stroke={TONO_OSCURO} strokeWidth={1} opacity={0.15} />

      {/* ventana con luz de la tarde */}
      <polygon points="140,20 190,20 190,70 140,70" fill={TONO_LEJANO} opacity={0.5} />
      <line x1="165" y1="20" x2="165" y2="70" stroke={TONO_OSCURO} strokeWidth={1} opacity={0.2} />

      <Mesa x={20} y={86} ancho={100} />
      <polygon points="26,84 108,84 108,90 26,90" fill={colores.blancoPapel} opacity={0.9} />
      <line x1="32" y1="87" x2="100" y2="87" stroke={acento} strokeWidth={1} opacity={0.6} />
      {crease(id, 20, 86, 120, 86, 0.15)}

      <Planta x={130} y={100} />
      <FiguraPapel x={70} y={98} pose="puntero" acento={acento} escala={0.9} />
    </>
  );
}

// ─── Escena 11: Sala de clases (soc-01) ──────────────────────────────────
function EscenaSalaClases({ id, acento }: { id: string; acento: string }) {
  return (
    <>
      <line x1="0" y1="104" x2="200" y2="104" stroke={TONO_OSCURO} strokeWidth={1} opacity={0.15} />

      {/* pizarra */}
      <polygon points="20,30 110,30 110,66 20,66" fill={TONO_OSCURO} opacity={0.75} />
      <line x1="30" y1="42" x2="90" y2="42" stroke={acento} strokeWidth={1.4} opacity={0.7} />
      <line x1="30" y1="52" x2="70" y2="52" stroke={acento} strokeWidth={1.4} opacity={0.5} />
      {crease(id, 20, 30, 110, 66, 0.15)}

      {/* pupitres */}
      <Mesa x={130} y={90} ancho={26} />
      <Mesa x={160} y={94} ancho={26} />

      <FiguraPapel x={60} y={98} pose="puntero" acento={acento} escala={0.95} />
      <FiguraPapel x={145} y={100} pose="sentado" acento={acento} escala={0.75} />
    </>
  );
}

// ─── Escena 12: Oficina municipal (soc-02) ───────────────────────────────
function EscenaOficinaMunicipal({ id, acento }: { id: string; acento: string }) {
  return (
    <>
      <line x1="0" y1="104" x2="200" y2="104" stroke={TONO_OSCURO} strokeWidth={1} opacity={0.15} />

      {/* fila esperando, capa lejana */}
      <g opacity={0.6}>
        <FiguraPapel x={160} y={100} pose="sentado" acento={acento} escala={0.7} />
        <FiguraPapel x={178} y={100} pose="sentado" acento={acento} escala={0.7} />
      </g>

      <Mesa x={40} y={86} ancho={70} />
      {crease(id, 40, 86, 110, 86, 0.15)}
      <Carpeta x={54} y={64} acento={acento} />

      <FiguraPapel x={70} y={98} pose="sentado" acento={acento} escala={0.9} />
      <FiguraPapel x={100} y={98} pose="empuje" acento={acento} escala={0.85} />
    </>
  );
}

// ─── Escena 13: Oficina de RRHH (soc-03) ─────────────────────────────────
function EscenaOficinaRRHH({ id, acento }: { id: string; acento: string }) {
  return (
    <>
      <line x1="0" y1="104" x2="200" y2="104" stroke={TONO_OSCURO} strokeWidth={1} opacity={0.15} />

      {/* puerta cerrada, capa lejana */}
      <polygon points="160,20 190,20 190,104 160,104" fill={TONO_LEJANO} opacity={0.5} />
      <circle cx="184" cy="62" r="1.6" fill={TONO_OSCURO} opacity={0.4} />

      <Mesa x={50} y={86} ancho={70} />
      {crease(id, 50, 86, 120, 86, 0.15)}
      <Pantalla x={110} y={58} acento={acento} />

      <FiguraPapel x={70} y={98} pose="sentado" acento={acento} escala={0.9} />
      <FiguraPapel x={95} y={98} pose="sentado" acento={acento} escala={0.9} />
    </>
  );
}

// ─── Escena 14: Consultorio médico (sal-01) ──────────────────────────────
function EscenaConsultorioMedico({ id, acento }: { id: string; acento: string }) {
  return (
    <>
      <line x1="0" y1="104" x2="200" y2="104" stroke={TONO_OSCURO} strokeWidth={1} opacity={0.15} />

      <g opacity={0.6}>
        <FiguraPapel x={172} y={100} pose="sentado" acento={acento} escala={0.7} />
      </g>

      <Camilla x={110} y={82} />
      {crease(id, 110, 82, 160, 98, 0.15)}
      <Pantalla x={30} y={54} acento={acento} />

      <FiguraPapel x={90} y={96} pose="puntero" acento={acento} escala={0.9} />
      <FiguraPapel x={130} y={98} pose="sentado" acento={acento} escala={0.85} />
    </>
  );
}

// ─── Escena 15: Clínica de kinesiología (sal-02) ─────────────────────────
function EscenaClinicaKinesiologia({ id, acento }: { id: string; acento: string }) {
  return (
    <>
      <line x1="0" y1="104" x2="200" y2="104" stroke={TONO_OSCURO} strokeWidth={1} opacity={0.15} />

      <Camilla x={100} y={82} />
      {crease(id, 100, 82, 150, 98, 0.15)}

      <FiguraPapel x={80} y={98} pose="empuje" acento={acento} escala={0.9} />
      <FiguraPapel x={130} y={98} pose="sentado" acento={acento} escala={0.85} />

      <Planta x={30} y={100} />
    </>
  );
}

// ─── Escena 16: Residencia de adultos mayores (sal-03) ───────────────────
function EscenaResidenciaAdultosMayores({ id, acento }: { id: string; acento: string }) {
  return (
    <>
      <line x1="0" y1="104" x2="200" y2="104" stroke={TONO_OSCURO} strokeWidth={1} opacity={0.15} />

      <Camilla x={110} y={82} />
      {crease(id, 110, 82, 160, 98, 0.15)}
      <Planta x={170} y={100} />

      <FiguraPapel x={90} y={98} pose="sentado" acento={acento} escala={0.85} />
      <FiguraPapel x={130} y={98} pose="sentado" acento={acento} escala={0.9} />
    </>
  );
}

// ─── Escena 17: Startup en etapa temprana (ges-01) ───────────────────────
function EscenaStartupOficina({ id, acento }: { id: string; acento: string }) {
  return (
    <>
      <line x1="0" y1="104" x2="200" y2="104" stroke={TONO_OSCURO} strokeWidth={1} opacity={0.15} />

      <Mesa x={40} y={86} ancho={90} />
      {crease(id, 40, 86, 130, 86, 0.15)}
      <Pantalla x={60} y={58} acento={acento} />
      <circle cx="120" cy="82" r="4" fill={TONO_OSCURO} opacity={0.5} />

      <FiguraPapel x={80} y={98} pose="sentado" acento={acento} escala={0.9} />
      <Carpeta x={140} y={78} acento={acento} />
    </>
  );
}

// ─── Escena 18: Oficina de auditoría (ges-02) ────────────────────────────
function EscenaOficinaAuditoria({ id, acento }: { id: string; acento: string }) {
  return (
    <>
      <line x1="0" y1="104" x2="200" y2="104" stroke={TONO_OSCURO} strokeWidth={1} opacity={0.15} />

      <g opacity={0.85}>
        <Carpeta x={150} y={60} acento={acento} />
        <Carpeta x={172} y={66} acento={ajustarLuminosidad(acento, 8)} />
      </g>

      <Mesa x={20} y={86} ancho={90} />
      {crease(id, 20, 86, 110, 86, 0.15)}
      <Pantalla x={40} y={58} acento={acento} />
      <Carpeta x={80} y={68} acento={acento} />

      <FiguraPapel x={60} y={98} pose="sentado" acento={acento} escala={0.9} />
    </>
  );
}

// ─── Escena 19: Local gastronómico (ges-03) ──────────────────────────────
function EscenaLocalGastronomico({ id, acento }: { id: string; acento: string }) {
  return (
    <>
      <line x1="0" y1="104" x2="200" y2="104" stroke={TONO_OSCURO} strokeWidth={1} opacity={0.15} />

      {/* cocina y olla al fuego */}
      <polygon points="120,86 170,86 170,104 120,104" fill={TONO_CLARO} />
      <polygon points="120,86 170,86 170,90 120,90" fill={TONO_OSCURO} opacity={0.5} />
      {crease(id, 120, 86, 170, 104, 0.15)}
      <polygon points="130,74 152,74 150,86 132,86" fill={TONO_BASE} />
      <polygon points="133,74 149,74 141,68" fill={acento} opacity={0.6} />

      <CajaFruta x={20} y={70} acento={acento} />

      <FiguraPapel x={100} y={98} pose="empuje" acento={acento} escala={0.9} />
      <FiguraPapel x={50} y={100} pose="martillo" acento={acento} escala={0.85} />
    </>
  );
}

// ─── Escena 20: Analista de datos en retail (dat-01) ─────────────────────
function EscenaAnalistaDatosRetail({ id, acento }: { id: string; acento: string }) {
  return (
    <>
      <line x1="0" y1="104" x2="200" y2="104" stroke={TONO_OSCURO} strokeWidth={1} opacity={0.15} />

      <Pantalla x={130} y={44} acento={acento} />
      <Pantalla x={158} y={52} acento={ajustarLuminosidad(acento, 10)} />

      {/* barras de dashboard */}
      <polygon points="40,86 46,86 46,66 40,66" fill={acento} opacity={0.7} />
      <polygon points="50,86 56,86 56,54 50,54" fill={ajustarLuminosidad(acento, 10)} opacity={0.7} />
      <polygon points="60,86 66,86 66,72 60,72" fill={acento} opacity={0.7} />

      <Mesa x={20} y={86} ancho={100} />
      {crease(id, 20, 86, 120, 86, 0.15)}
      <Carpeta x={90} y={68} acento={acento} />

      <FiguraPapel x={60} y={98} pose="sentado" acento={acento} escala={0.9} />
    </>
  );
}

// ─── Escena 21: Bodega y logística (dat-02) ──────────────────────────────
function EscenaBodegaLogistica({ id, acento }: { id: string; acento: string }) {
  return (
    <>
      <line x1="0" y1="104" x2="200" y2="104" stroke={TONO_OSCURO} strokeWidth={1} opacity={0.15} />

      {/* estantería al fondo */}
      <g opacity={0.85}>
        <polygon points="120,30 190,30 190,90 178,90 178,40 132,40 132,90 120,90" fill={TONO_LEJANO} />
        <CajaFruta x={128} y={44} acento={ajustarLuminosidad(acento, 6)} />
        <CajaFruta x={156} y={44} acento={ajustarLuminosidad(acento, 6)} />
      </g>

      <Vehiculo x={20} y={80} acento={acento} tipo="camion" />
      {crease(id, 20, 80, 80, 94, 0.15)}

      <FiguraPapel x={100} y={98} pose="empuje" acento={acento} escala={0.9} />
    </>
  );
}

// ─── Escena 22: Administración de una pyme (dat-03) ──────────────────────
function EscenaAdministracionPyme({ id, acento }: { id: string; acento: string }) {
  return (
    <>
      <line x1="0" y1="104" x2="200" y2="104" stroke={TONO_OSCURO} strokeWidth={1} opacity={0.15} />

      <Mesa x={40} y={86} ancho={90} />
      {crease(id, 40, 86, 130, 86, 0.15)}
      <Pantalla x={100} y={58} acento={acento} />
      <Carpeta x={54} y={68} acento={acento} />
      <Carpeta x={70} y={74} acento={ajustarLuminosidad(acento, 8)} />

      <FiguraPapel x={80} y={98} pose="sentado" acento={acento} escala={0.9} />
    </>
  );
}

// ─── Escena 23: Guardaparque en zona silvestre (nat-02) ──────────────────
function EscenaGuardaparque({ id, acento }: { id: string; acento: string }) {
  return (
    <>
      <line x1="0" y1="104" x2="200" y2="104" stroke={TONO_OSCURO} strokeWidth={1} opacity={0.15} />

      {/* montañas lejanas */}
      <g opacity={0.6}>
        <polygon points="120,104 150,60 180,104" fill={TONO_LEJANO} />
        <polygon points="150,104 175,70 200,104" fill={TONO_LEJANO} />
      </g>

      <Arbol x={40} y={78} />
      <Arbol x={170} y={80} escala={0.85} />

      <FiguraPapel x={90} y={98} pose="empuje" acento={acento} escala={0.9} />
    </>
  );
}

// ─── Escena 24: Ingeniero/a forestal en terreno (nat-03) ─────────────────
function EscenaIngenieroForestal({ id, acento }: { id: string; acento: string }) {
  return (
    <>
      <line x1="0" y1="104" x2="200" y2="104" stroke={TONO_OSCURO} strokeWidth={1} opacity={0.15} />

      <Arbol x={140} y={78} />
      <Arbol x={170} y={76} escala={0.9} />
      <polygon points="136,58 142,58 142,64 136,64" fill={acento} opacity={0.8} />
      <polygon points="166,54 172,54 172,60 166,60" fill={acento} opacity={0.8} />

      <line x1="60" y1="100" x2="100" y2="100" stroke={TONO_OSCURO} strokeWidth={1.2} opacity={0.4} />

      <FiguraPapel x={70} y={98} pose="puntero" acento={acento} escala={0.9} />
    </>
  );
}

const ESCENAS: Record<string, (props: { id: string; acento: string }) => React.ReactNode> = {
  "obra-construccion": (p) => <EscenaObraConstruccion {...p} />,
  "packing-agricola": (p) => <EscenaPackingAgricola {...p} />,
  "taller-mecanico": (p) => <EscenaTallerMecanico {...p} />,
  "electricista-industrial": (p) => <EscenaElectricistaIndustrial {...p} />,
  "laboratorio-clinico": (p) => <EscenaLaboratorioClinico {...p} />,
  "investigacion-postgrado": (p) => <EscenaInvestigacionPostgrado {...p} />,
  "control-calidad-alimentos": (p) => <EscenaControlCalidadAlimentos {...p} />,
  "estudio-branding": (p) => <EscenaEstudioBranding {...p} />,
  "rodaje-audiovisual": (p) => <EscenaRodajeAudiovisual {...p} />,
  "estudio-arquitectura": (p) => <EscenaEstudioArquitectura {...p} />,
  "sala-clases": (p) => <EscenaSalaClases {...p} />,
  "oficina-municipal": (p) => <EscenaOficinaMunicipal {...p} />,
  "oficina-rrhh": (p) => <EscenaOficinaRRHH {...p} />,
  "consultorio-medico": (p) => <EscenaConsultorioMedico {...p} />,
  "clinica-kinesiologia": (p) => <EscenaClinicaKinesiologia {...p} />,
  "residencia-adultos-mayores": (p) => <EscenaResidenciaAdultosMayores {...p} />,
  "startup-oficina": (p) => <EscenaStartupOficina {...p} />,
  "oficina-auditoria": (p) => <EscenaOficinaAuditoria {...p} />,
  "local-gastronomico": (p) => <EscenaLocalGastronomico {...p} />,
  "analista-datos-retail": (p) => <EscenaAnalistaDatosRetail {...p} />,
  "bodega-logistica": (p) => <EscenaBodegaLogistica {...p} />,
  "administracion-pyme": (p) => <EscenaAdministracionPyme {...p} />,
  "guardaparque-sendero": (p) => <EscenaGuardaparque {...p} />,
  "ingeniero-forestal": (p) => <EscenaIngenieroForestal {...p} />,
};

/** true si existe una escena ilustrada construida para este id (si no, el llamador debe caer al ícono). */
export function tieneEscena(escenaId: string | undefined): escenaId is string {
  return !!escenaId && escenaId in ESCENAS;
}

export function EscenaContexto({ escenaId, dimension, className = "" }: EscenaContextoProps) {
  const creaseId = useId();
  const render = ESCENAS[escenaId];
  if (!render) return null;

  const acento = ACENTOS[dimension];

  return (
    <svg viewBox="0 0 200 120" className={className} role="img" aria-hidden="true">
      <defs>
        <linearGradient id={creaseId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={colores.blancoPapel} />
          <stop offset="100%" stopColor={colores.tinta} />
        </linearGradient>
      </defs>
      {render({ id: creaseId, acento })}
    </svg>
  );
}
