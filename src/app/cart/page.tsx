import type { Metadata } from "next";
import { CartView } from "@/components/CartView";

export const metadata: Metadata = { title: "Корзина", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="pt-12">
      <h1 className="font-serif text-5xl">Корзина</h1>
      <CartView />
    </div>
  );
}
