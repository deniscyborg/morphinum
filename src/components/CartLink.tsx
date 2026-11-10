"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export function CartLink() {
  const { count, ready } = useCart();
  return (
    <Link href="/cart" className="relative inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-card">
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 7h12l-1 13H7L6 7Z" strokeLinejoin="round" />
        <path d="M9 7a3 3 0 0 1 6 0" />
      </svg>
      Корзина
      {ready && count > 0 && (
        <span data-testid="cart-count" className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
