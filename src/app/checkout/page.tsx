import type { Metadata } from "next";
import { CheckoutForm } from "@/components/CheckoutForm";

export const metadata: Metadata = { title: "Оформление заказа", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <div className="pt-12">
      <h1 className="font-serif text-5xl">Оформление заказа</h1>
      <p className="mt-3 max-w-xl text-muted">
        Оплата при получении. После оформления менеджер позвонит, чтобы подтвердить заказ и время доставки.
      </p>
      <CheckoutForm />
    </div>
  );
}
