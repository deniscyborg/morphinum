"use client";

import Link from "next/link";
import { shop } from "@/config/shop";
import { formatPrice } from "@/lib/money";
import { useCart } from "./CartProvider";

export function CartView() {
  const { cart, ready, total, update, remove } = useCart();

  if (!ready) return <p className="mt-8 text-muted">Загружаем корзину…</p>;

  if (cart.lines.length === 0) {
    return (
      <div className="mt-8">
        <p className="text-muted">В корзине пока пусто.</p>
        <Link href="/catalog" className="btn-primary mt-6">
          Перейти в каталог
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
      <ul className="divide-y divide-line rounded-xl border border-line bg-card">
        {cart.lines.map((line) => (
          <li key={line.productId} data-testid="cart-line" className="flex flex-wrap items-center gap-4 p-5">
            <div className="min-w-0 flex-1">
              <Link href={`/catalog/${line.slug}`} className="font-serif text-xl hover:text-accent">
                {line.name}
              </Link>
              <p className="text-sm text-muted">{formatPrice(line.price)} за шт.</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted">
              Кол-во
              <input
                type="number"
                min={1}
                max={shop.maxQuantityPerItem}
                value={line.quantity}
                aria-label={`Количество: ${line.name}`}
                onChange={(e) => update(line.productId, Number(e.target.value))}
                className="!w-20 text-center"
              />
            </label>
            <p className="w-28 text-right font-medium">{formatPrice(line.price * line.quantity)}</p>
            <button
              type="button"
              onClick={() => remove(line.productId)}
              className="text-sm text-muted underline-offset-4 hover:text-danger hover:underline"
            >
              Удалить
            </button>
          </li>
        ))}
      </ul>

      <aside className="h-fit rounded-xl border border-line bg-card p-6">
        <div className="flex justify-between text-lg">
          <span>Итого</span>
          <span data-testid="cart-total" className="font-semibold">
            {formatPrice(total)}
          </span>
        </div>
        <p className="mt-2 text-sm text-muted">Стоимость доставки рассчитаем на следующем шаге.</p>
        <Link href="/checkout" className="btn-primary mt-6 w-full">
          Оформить заказ
        </Link>
      </aside>
    </div>
  );
}
