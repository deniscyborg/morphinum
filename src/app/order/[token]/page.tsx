import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ClearCart } from "@/components/ClearCart";
import { deliveryLabels, isDeliveryMethod } from "@/lib/delivery";
import { formatPrice } from "@/lib/money";
import { getDb } from "@/server/db";
import { formatOrderNumber, getOrderSummary } from "@/server/orders";

export const metadata: Metadata = { title: "Заказ оформлен", robots: { index: false } };

export default function OrderPage({ params }: PageProps<"/order/[token]">) {
  return (
    <div className="mx-auto max-w-2xl pt-16">
      {/* Заказ читается из базы на каждый запрос, без кеша */}
      <Suspense fallback={<p className="text-muted">Загружаем заказ…</p>}>
        <OrderDetails params={params} />
      </Suspense>
    </div>
  );
}

async function OrderDetails({ params }: { params: PageProps<"/order/[token]">["params"] }) {
  const { token } = await params;
  const order = getOrderSummary(getDb(), token);
  if (!order) notFound();

  return (
    <>
      <ClearCart />
      <p className="text-sm tracking-[0.2em] text-success uppercase">Заказ оформлен</p>
      <h1 className="mt-3 font-serif text-5xl">Спасибо, {order.name}!</h1>
      <p className="mt-4 text-lg text-muted">
        Номер заказа <strong data-testid="order-number" className="text-ink">{formatOrderNumber(order.id)}</strong>. Менеджер
        позвонит в ближайшее рабочее время, чтобы подтвердить заказ.
      </p>

      <div className="mt-10 rounded-xl border border-line bg-card p-6">
        <ul className="space-y-2">
          {order.items.map((item) => (
            <li key={item.name} className="flex justify-between gap-4">
              <span>
                {item.name} × {item.quantity}
              </span>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-line pt-4">
          <div className="flex justify-between text-muted">
            <dt>{isDeliveryMethod(order.delivery) ? deliveryLabels[order.delivery] : "Доставка"}</dt>
            <dd>{order.deliveryCost === 0 ? "бесплатно" : formatPrice(order.deliveryCost)}</dd>
          </div>
          <div className="flex justify-between text-lg font-semibold">
            <dt>Итого к оплате</dt>
            <dd>{formatPrice(order.total)}</dd>
          </div>
        </dl>
      </div>

      <Link href="/catalog" className="btn-outline mt-8">
        Вернуться в каталог
      </Link>
    </>
  );
}
