import type { MetadataRoute } from "next";
import { shop } from "@/config/shop";

export default function robots(): MetadataRoute.Robots {
  return {
    // Корзина, оформление и страницы заказов — личные, в поиске им не место
    rules: { userAgent: "*", allow: "/", disallow: ["/cart", "/checkout", "/order/"] },
    sitemap: `${shop.url}/sitemap.xml`,
  };
}
