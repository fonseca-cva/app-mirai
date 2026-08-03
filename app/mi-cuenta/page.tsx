import type { Metadata } from "next";
import { MiCuenta } from "@/components/cuenta/MiCuenta";

// Panel personal: jamás en buscadores (regla de Camilo). El robots.txt ya
// excluye /mi-cuenta; esto es la doble red a nivel de página (igual que
// /informe/[token], Tanda B).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function MiCuentaPage() {
  return <MiCuenta />;
}
