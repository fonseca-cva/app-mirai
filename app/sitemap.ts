import type { MetadataRoute } from "next";
import { getSlugs } from "@/lib/articulos";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.miraiapp.cl";

  // Rutas estáticas
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    { url: `${baseUrl}/metodologia`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/articulos`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/experiencia`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/privacidad`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terminos`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  // Rutas de artículos
  const slugs = getSlugs();
  const articleRoutes: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${baseUrl}/articulos/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...articleRoutes];
}
