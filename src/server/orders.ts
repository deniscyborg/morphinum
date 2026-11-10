import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { deliveryCost } from "@/lib/delivery";
import type { Kopecks } from "@/lib/money";
import type { OrderInput } from "@/lib/order-validation";

type DeliveryConfig = { courierPriceRub: number; freeCourierFromRub: number };

export type PlaceOrderResult =
  | { ok: true; orderId: number; token: string; total: Kopecks }
  | { ok: false; error: string };

export type OrderSummary = {
  id: number;
  name: string;
  delivery: string;
  subtotal: Kopecks;
  deliveryCost: Kopecks;
  total: Kopecks;
  items: { name: string; price: Kopecks; quantity: number }[];
};

/**
 * Оформление заказа одной транзакцией.
 * Цены и остатки берутся из базы, а не из корзины: клиенту нельзя доверять ни цену, ни количество.
 */
export function placeOrder(db: DatabaseSync, input: OrderInput, delivery: DeliveryConfig, maxPerItem: number): PlaceOrderResult {
  const merged = new Map<number, number>();
  for (const item of input.items) merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity);

  db.exec("BEGIN IMMEDIATE");
  try {
    const findProduct = db.prepare("SELECT id, name, price, stock FROM products WHERE id = ? AND active = 1");
    const lines: { id: number; name: string; price: number; quantity: number }[] = [];

    for (const [productId, quantity] of merged) {
      const product = findProduct.get(productId) as { id: number; name: string; price: number; stock: number } | undefined;
      if (!product) return rollback(db, "Один из товаров больше не продаётся. Обновите корзину.");
      if (quantity > maxPerItem) return rollback(db, `Не больше ${maxPerItem} шт. одного товара в заказе.`);
      if (quantity > product.stock) {
        return rollback(db, product.stock === 0
          ? `«${product.name}» закончился.`
          : `«${product.name}»: в наличии только ${product.stock} шт.`);
      }
      lines.push({ ...product, quantity });
    }

    const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
    const shipping = deliveryCost(input.delivery, subtotal, delivery);
    const total = subtotal + shipping;
    const token = randomUUID();

    const { lastInsertRowid } = db
      .prepare(
        `INSERT INTO orders (token, name, phone, email, delivery, address, comment, subtotal, delivery_cost, total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(token, input.name, input.phone, input.email, input.delivery, input.address, input.comment, subtotal, shipping, total);
    const orderId = Number(lastInsertRowid);

    const insertItem = db.prepare("INSERT INTO order_items (order_id, product_id, name, price, quantity) VALUES (?, ?, ?, ?, ?)");
    const reserve = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?");
    for (const line of lines) {
      insertItem.run(orderId, line.id, line.name, line.price, line.quantity);
      reserve.run(line.quantity, line.id);
    }

    db.exec("COMMIT");
    return { ok: true, orderId, token, total };
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function rollback(db: DatabaseSync, error: string): PlaceOrderResult {
  db.exec("ROLLBACK");
  return { ok: false, error };
}

export function getOrderSummary(db: DatabaseSync, token: string): OrderSummary | null {
  const order = db
    .prepare("SELECT id, name, delivery, subtotal, delivery_cost AS deliveryCost, total FROM orders WHERE token = ?")
    .get(token) as Omit<OrderSummary, "items"> | undefined;
  if (!order) return null;
  const items = db
    .prepare("SELECT name, price, quantity FROM order_items WHERE order_id = ? ORDER BY rowid")
    .all(order.id) as OrderSummary["items"];
  return { ...order, items: items.map((i) => ({ ...i })) };
}

/** "M-000042" — номер заказа для покупателя */
export function formatOrderNumber(id: number): string {
  return `M-${String(id).padStart(6, "0")}`;
}
