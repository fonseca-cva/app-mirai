import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Informes personales y panel de usuario: nunca en buscadores (Tanda B/C).
      disallow: ["/informe/", "/mi-cuenta"],
    },
    sitemap: "https://www.miraiapp.cl/sitemap.xml",
  };
}
