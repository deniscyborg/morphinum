"use client";

import { useEffect } from "react";
import { useCart } from "./CartProvider";

/** Очищает корзину, когда покупатель попал на страницу оформленного заказа */
export function ClearCart() {
  const { clear, ready } = useCart();
  useEffect(() => {
    if (ready) clear();
  }, [ready, clear]);
  return null;
}
