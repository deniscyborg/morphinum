"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { shop } from "@/config/shop";
import {
  addToCart,
  emptyCart,
  itemsCount,
  parseCart,
  removeFromCart,
  setQuantity,
  subtotal,
  type Cart,
  type CartLine,
} from "@/lib/cart";

const STORAGE_KEY = "morphinum-cart";
const MAX = shop.maxQuantityPerItem;

type CartContextValue = {
  cart: Cart;
  ready: boolean;
  count: number;
  total: number;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  update: (productId: number, quantity: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

/** Корзина живёт в браузере (localStorage): для оформления заказа регистрация не нужна */
export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>(emptyCart);
  const [ready, setReady] = useState(false);

  // Читаем сохранённую корзину только на клиенте, чтобы не было расхождений с серверной разметкой
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- однократная загрузка из внешнего хранилища
      setCart(parseCart(window.localStorage.getItem(STORAGE_KEY), MAX));
    } catch {
      // localStorage недоступен (приватный режим) — работаем с пустой корзиной
    }
    setReady(true);
  }, []);

  const persist = useCallback((updater: (prev: Cart) => Cart) => {
    setCart((prev) => {
      const next = updater(prev);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // не удалось сохранить — корзина останется до перезагрузки страницы
      }
      return next;
    });
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      ready,
      count: itemsCount(cart),
      total: subtotal(cart),
      add: (line, quantity = 1) => persist((c) => addToCart(c, line, quantity, MAX)),
      update: (productId, quantity) => persist((c) => setQuantity(c, productId, quantity, MAX)),
      remove: (productId) => persist((c) => removeFromCart(c, productId)),
      clear: () => persist(() => emptyCart),
    }),
    [cart, ready, persist],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
