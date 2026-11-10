import { describe, expect, it } from "vitest";
import { addToCart, emptyCart, itemsCount, parseCart, removeFromCart, setQuantity, subtotal } from "./cart";

const MAX = 10;
const classic = { productId: 1, slug: "classic", name: "Классика", price: 249000 };
const mini = { productId: 2, slug: "mini", name: "Мини", price: 99000 };

describe("cart", () => {
  it("adds a new line and merges repeated additions", () => {
    let cart = addToCart(emptyCart, classic, 1, MAX);
    cart = addToCart(cart, classic, 2, MAX);
    expect(cart.lines).toHaveLength(1);
    expect(cart.lines[0].quantity).toBe(3);
  });

  it("never exceeds the per-item maximum", () => {
    const cart = addToCart(emptyCart, classic, 25, MAX);
    expect(cart.lines[0].quantity).toBe(MAX);
  });

  it("ignores zero or negative additions", () => {
    expect(addToCart(emptyCart, classic, 0, MAX)).toEqual(emptyCart);
    expect(addToCart(emptyCart, classic, -3, MAX)).toEqual(emptyCart);
  });

  it("removes a line when quantity is set to zero", () => {
    const cart = setQuantity(addToCart(emptyCart, classic, 2, MAX), classic.productId, 0, MAX);
    expect(cart.lines).toEqual([]);
  });

  it("calculates count and subtotal", () => {
    let cart = addToCart(emptyCart, classic, 2, MAX);
    cart = addToCart(cart, mini, 3, MAX);
    expect(itemsCount(cart)).toBe(5);
    expect(subtotal(cart)).toBe(2 * 249000 + 3 * 99000);
  });

  it("removes a specific product", () => {
    let cart = addToCart(emptyCart, classic, 1, MAX);
    cart = addToCart(cart, mini, 1, MAX);
    expect(removeFromCart(cart, classic.productId).lines.map((l) => l.productId)).toEqual([mini.productId]);
  });

  describe("parseCart", () => {
    it("restores a valid saved cart", () => {
      const saved = JSON.stringify(addToCart(emptyCart, classic, 2, MAX));
      expect(parseCart(saved, MAX).lines[0]).toMatchObject({ productId: 1, quantity: 2 });
    });

    it.each([null, "", "not json", "{}", '{"lines": "x"}'])("returns an empty cart for %j", (raw) => {
      expect(parseCart(raw, MAX)).toEqual(emptyCart);
    });

    it("drops malformed lines and clamps quantities", () => {
      const raw = JSON.stringify({
        lines: [
          { ...classic, quantity: 50 },
          { ...mini, quantity: -1 },
          { productId: "x", name: 1 },
        ],
      });
      expect(parseCart(raw, MAX).lines).toEqual([{ ...classic, quantity: MAX }]);
    });
  });
});
