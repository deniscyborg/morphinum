"use client";

import Link from "next/link";
import { useState } from "react";
import { shop } from "@/config/shop";
import { useCart } from "./CartProvider";

type Props = {
  product: { id: number; slug: string; name: string; price: number; stock: number };
};

export function AddToCart({ product }: Props) {
  const { add, cart } = useCart();
  const [added, setAdded] = useState(false);
  const inCart = cart.lines.find((l) => l.productId === product.id)?.quantity ?? 0;
  const limit = Math.min(product.stock, shop.maxQuantityPerItem);

  if (product.stock === 0) {
    return <p className="rounded-md bg-line/60 px-4 py-3 text-muted">Нет в наличии</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        className="btn-primary"
        disabled={inCart >= limit}
        onClick={() => {
          add({ productId: product.id, slug: product.slug, name: product.name, price: product.price });
          setAdded(true);
        }}
      >
        В корзину
      </button>
      {added && (
        <p role="status" className="text-sm text-success">
          Добавлено.{" "}
          <Link href="/cart" className="underline">
            Перейти в корзину
          </Link>
        </p>
      )}
      {inCart >= limit && <p className="text-sm text-muted">В корзине максимум доступного количества</p>}
    </div>
  );
}
