import { ContadoresDestacados } from "@/components/landing/ContadoresDestacados";
import { GraficoEmpleabilidad } from "@/components/landing/GraficoEmpleabilidad";

// Sección nueva: cifras destacadas del banco de datos verificado.
// Se inserta entre Respaldo y Apoderados sin alterar ninguna de las dos.
export function DatosDestacados() {
  return (
    <section className="bg-papel px-4 py-20 sm:px-8">
      <ContadoresDestacados />
      <GraficoEmpleabilidad />
    </section>
  );
}
