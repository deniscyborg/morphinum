import { DatabaseSync } from "node:sqlite";
import { beforeEach, describe, expect, it } from "vitest";
import type { OrderInput } from "@/lib/order-validation";
import { findProduct, listCategories, listProducts } from "./catalog";
import { formatOrderNumber, getOrderSummary, placeOrder } from "./orders";
import { migrate, seedIfEmpty } from "./schema";

const DELIVERY = { courierPriceRub: 300, freeCourierFromRub: 5000 };
const MAX = 10;

let db: DatabaseSync;

function idOf(slug: string): number {
  return findProduct(db, slug)!.id;
}

function order(items: OrderInput["items"], overrides: Partial<OrderInput> = {}): OrderInput {
  return { name: "Иван", phone: "+79001234567", email: "", delivery: "pickup", address: "", comment: "", items, ...overrides };
}

beforeEach(() => {
  db = new DatabaseSync(":memory:");
  migrate(db);
  seedIfEmpty(db);
});

describe("catalog", () => {
  it("seeds demo products only once", () => {
    seedIfEmpty(db);
    expect(listProducts(db)).toHaveLength(6);
  });

  it("lists out-of-stock products last", () => {
    const products = listProducts(db);
    expect(products.at(-1)!.stock).toBe(0);
  });

  it("filters by category", () => {
    const sets = listProducts(db, "Подарочные наборы");
    expect(sets.length).toBeGreaterThan(0);
    expect(sets.every((p) => p.category === "Подарочные наборы")).toBe(true);
    expect(listCategories(db)).toContain("Подарочные наборы");
  });

  it("returns null for an unknown slug", () => {
    expect(findProduct(db, "no-such-product")).toBeNull();
  });
});

describe("placeOrder", () => {
  it("creates an order with prices from the database and reserves stock", () => {
    const classic = findProduct(db, "demo-classic")!;
    const result = placeOrder(db, order([{ productId: classic.id, quantity: 2 }]), DELIVERY, MAX);

    expect(result).toEqual({ ok: true, orderId: expect.any(Number), token: expect.any(String), total: classic.price * 2 });
    expect(findProduct(db, "demo-classic")!.stock).toBe(classic.stock - 2);

    const summary = getOrderSummary(db, (result as { token: string }).token)!;
    expect(summary.items).toEqual([{ name: classic.name, price: classic.price, quantity: 2 }]);
  });

  it("merges duplicate lines of the same product", () => {
    const id = idOf("demo-mini");
    const result = placeOrder(db, order([{ productId: id, quantity: 1 }, { productId: id, quantity: 2 }]), DELIVERY, MAX);
    expect(result.ok).toBe(true);
    const summary = getOrderSummary(db, (result as { token: string }).token)!;
    expect(summary.items[0].quantity).toBe(3);
  });

  it("adds courier delivery below the free threshold", () => {
    const mini = findProduct(db, "demo-mini")!;
    const result = placeOrder(db, order([{ productId: mini.id, quantity: 1 }], { delivery: "courier", address: "ул. Ленина, 1" }), DELIVERY, MAX);
    expect(result).toMatchObject({ ok: true, total: mini.price + 30000 });
  });

  it("refuses more than in stock and changes nothing", () => {
    const giftSet = findProduct(db, "demo-gift-set")!;
    const result = placeOrder(db, order([{ productId: giftSet.id, quantity: giftSet.stock + 1 }]), DELIVERY, MAX);

    expect(result).toEqual({ ok: false, error: expect.stringContaining(`только ${giftSet.stock} шт.`) });
    expect(findProduct(db, "demo-gift-set")!.stock).toBe(giftSet.stock);
    expect(db.prepare("SELECT COUNT(*) AS n FROM orders").get()).toEqual({ n: 0 });
  });

  it("refuses an out-of-stock product", () => {
    const result = placeOrder(db, order([{ productId: idOf("demo-limited"), quantity: 1 }]), DELIVERY, MAX);
    expect(result).toEqual({ ok: false, error: expect.stringContaining("закончился") });
  });

  it("rolls back the whole order if one line fails", () => {
    const classicStock = findProduct(db, "demo-classic")!.stock;
    const result = placeOrder(
      db,
      order([{ productId: idOf("demo-classic"), quantity: 1 }, { productId: idOf("demo-limited"), quantity: 1 }]),
      DELIVERY,
      MAX,
    );
    expect(result.ok).toBe(false);
    expect(findProduct(db, "demo-classic")!.stock).toBe(classicStock);
  });

  it("refuses unknown products", () => {
    expect(placeOrder(db, order([{ productId: 9999, quantity: 1 }]), DELIVERY, MAX).ok).toBe(false);
  });

  it("refuses quantities above the per-item maximum", () => {
    const result = placeOrder(db, order([{ productId: idOf("demo-mini"), quantity: MAX + 1 }]), DELIVERY, MAX);
    expect(result).toEqual({ ok: false, error: expect.stringContaining(`Не больше ${MAX}`) });
  });
});

describe("getOrderSummary", () => {
  it("is found only by its random token, not by a guessable id", () => {
    const result = placeOrder(db, order([{ productId: idOf("demo-mini"), quantity: 1 }]), DELIVERY, MAX);
    const { orderId, token } = result as { orderId: number; token: string };
    expect(token).toMatch(/^[0-9a-f-]{36}$/);
    expect(getOrderSummary(db, token)?.id).toBe(orderId);
    expect(getOrderSummary(db, String(orderId))).toBeNull();
  });
});

describe("formatOrderNumber", () => {
  it("pads the id", () => expect(formatOrderNumber(42)).toBe("M-000042"));
});
