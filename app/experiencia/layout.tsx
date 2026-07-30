import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Test vocacional interactivo — Mirai",
  description:
    "Vive la experiencia Mirai: 25 minutos de juegos cognitivos, ejercicios verbales y contextos laborales para descubrir tu perfil vocacional con datos reales de Chile.",
  openGraph: {
    title: "Test vocacional interactivo — Mirai",
    description:
      "Vive la experiencia Mirai: 25 minutos de ejercicios diseñados para descubrir tu perfil vocacional con datos reales de Chile.",
    locale: "es_CL",
    type: "website",
  },
};

export default function ExperienciaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
