import type { Kopecks } from "./money";

/** Позиция корзины на клиенте. Цена здесь — только для показа: сервер пересчитывает заказ по базе. */
export type CartLine = {
  productId: number;
  slug: string;
  name: string;
  price: Kopecks;
  quantity: number;
};

export type Cart = { lines: CartLine[] };

export const emptyCart: Cart = { lines: [] };

function clamp(quantity: number, max: number): number {
  return Math.max(0, Math.min(Math.floor(quantity), max));
}

export function addToCart(cart: Cart, line: Omit<CartLine, "quantity">, quantity: number, max: number): Cart {
  if (quantity <= 0) return cart;
  const existing = cart.lines.find((l) => l.productId === line.productId);
  if (existing) {
    return setQuantity(cart, line.productId, existing.quantity + quantity, max);
  }
  return { lines: [...cart.lines, { ...line, quantity: clamp(quantity, max) }] };
}

/** Количество 0 удаляет позицию; больше максимума — обрезается до максимума */
export function setQuantity(cart: Cart, productId: number, quantity: number, max: number): Cart {
  const next = clamp(quantity, max);
  return {
    lines: next === 0
      ? cart.lines.filter((l) => l.productId !== productId)
      : cart.lines.map((l) => (l.productId === productId ? { ...l, quantity: next } : l)),
  };
}

export function removeFromCart(cart: Cart, productId: number): Cart {
  return { lines: cart.lines.filter((l) => l.productId !== productId) };
}

export function itemsCount(cart: Cart): number {
  return cart.lines.reduce((sum, l) => sum + l.quantity, 0);
}

export function subtotal(cart: Cart): Kopecks {
  return cart.lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
}

/** Разбор сохранённой корзины: всё некорректное отбрасывается, а не роняет страницу */
export function parseCart(raw: string | null, max: number): Cart {
  if (!raw) return emptyCart;
  try {
    const data = JSON.parse(raw) as { lines?: unknown };
    if (!Array.isArray(data.lines)) return emptyCart;
    const lines = data.lines.filter(
      (l): l is CartLine =>
        typeof l === "object" && l !== null &&
        Number.isInteger((l as CartLine).productId) &&
        typeof (l as CartLine).slug === "string" &&
        typeof (l as CartLine).name === "string" &&
        Number.isInteger((l as CartLine).price) &&
        Number.isInteger((l as CartLine).quantity) &&
        (l as CartLine).quantity > 0,
    );
    return { lines: lines.map((l) => ({ ...l, quantity: clamp(l.quantity, max) })) };
  } catch {
    return emptyCart;
  }
}
