export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Mirai",
    url: "https://www.miraiapp.cl",
    description: "Test vocacional con datos reales de Chile. Descubre qué estudiar jugando.",
    logo: "https://www.miraiapp.cl/logo.png",
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      email: "hola@miraiapp.cl",
    },
  };
}

export function articleSchema(articulo: {
  titulo: string;
  resumen: string;
  fecha: string;
  imagen_preview?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: articulo.titulo,
    description: articulo.resumen,
    image: articulo.imagen_preview || "https://www.miraiapp.cl/og-image.png",
    datePublished: articulo.fecha,
    author: {
      "@type": "Organization",
      name: "Mirai",
    },
    publisher: {
      "@type": "Organization",
      name: "Mirai",
      logo: {
        "@type": "ImageObject",
        url: "https://www.miraiapp.cl/logo.png",
      },
    },
  };
}
