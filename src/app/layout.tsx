import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import type { ReactNode } from "react";
import { CartProvider } from "@/components/CartProvider";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { shop } from "@/config/shop";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter", display: "swap" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(shop.url),
  title: { default: `${shop.name} — ${shop.tagline}`, template: `%s — ${shop.name}` },
  description: `${shop.name}: ${shop.tagline.toLowerCase()}. Доставка по городу и самовывоз.`,
  openGraph: {
    type: "website",
    siteName: shop.name,
    locale: "ru_RU",
    title: `${shop.name} — ${shop.tagline}`,
    description: `${shop.name}: ${shop.tagline.toLowerCase()}. Доставка по городу и самовывоз.`,
    images: [{ url: "/og.jpg", width: 1200, height: 630 }],
  },
  // Демо-витрина без товаров в поиск не попадает; после запуска (без флага демо) индексация включается сама
  robots: shop.demo ? { index: false, follow: true } : undefined,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f4ef" },
    { media: "(prefers-color-scheme: dark)", color: "#15120f" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={`${inter.variable} ${cormorant.variable}`}>
      <body>
        <CartProvider>
          {shop.demo && (
            <div role="note" className="bg-ink px-4 py-2 text-center text-sm text-paper">
              Демо-версия магазина: каталог наполняется, заказы пока не принимаются.
            </div>
          )}
          <SiteHeader />
          <main className="mx-auto max-w-6xl px-4 sm:px-6">{children}</main>
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
