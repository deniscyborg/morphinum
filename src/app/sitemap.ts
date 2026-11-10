import type { MetadataRoute } from "next";
import { shop } from "@/config/shop";
import { getProducts } from "@/server/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();
  return [
    { url: `${shop.url}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${shop.url}/catalog`, changeFrequency: "daily", priority: 0.9 },
    { url: `${shop.url}/delivery`, changeFrequency: "yearly", priority: 0.5 },
    ...products.map((p) => ({ url: `${shop.url}/catalog/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
