import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mirai — Descubre qué estudiar",
  description: "Descubre qué estudiar jugando. Basado en evidencia y datos reales de Chile.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Mirai — Descubre qué estudiar",
    description: "Descubre qué estudiar jugando. Basado en evidencia y datos reales de Chile.",
    locale: "es_CL",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CL" className={`${fraunces.variable} ${inter.variable} h-full antialiased`}>
      <body className="relative min-h-full flex flex-col bg-papel text-tinta">
        {/* Textura de papel global (Fase 1 A.5): grano con feTurbulence, un solo nodo reutilizado */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
          <svg className="h-full w-full" style={{ mixBlendMode: "multiply", opacity: 0.04 }}>
            <defs>
              <filter id="paper-grain">
                <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
              </filter>
            </defs>
            <rect width="100%" height="100%" filter="url(#paper-grain)" />
          </svg>
        </div>
        {children}
      </body>
    </html>
  );
}
