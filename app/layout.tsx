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
      <body className="min-h-full flex flex-col bg-papel text-tinta">{children}</body>
    </html>
  );
}
