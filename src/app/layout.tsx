import type { Metadata } from "next";
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
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={`${inter.variable} ${cormorant.variable}`}>
      <body>
        <CartProvider>
          <SiteHeader />
          <main className="mx-auto max-w-6xl px-4 sm:px-6">{children}</main>
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
