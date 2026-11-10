import { describe, expect, it } from "vitest";
import { deliveryCost } from "./delivery";
import { rub } from "./money";
import { normalizePhone, validateOrder } from "./order-validation";

function form(overrides: Record<string, string | null> = {}): FormData {
  const values: Record<string, string | null> = {
    name: "Иван",
    phone: "+7 (900) 123-45-67",
    email: "ivan@example.ru",
    delivery: "pickup",
    address: "",
    comment: "",
    consent: "on",
    items: JSON.stringify([{ productId: 1, quantity: 2 }]),
    ...overrides,
  };
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) if (value !== null) data.set(key, value);
  return data;
}

describe("normalizePhone", () => {
  it.each([
    ["+7 (900) 123-45-67", "+79001234567"],
    ["8 900 123 45 67", "+79001234567"],
    ["9001234567", "+79001234567"],
    ["79001234567", "+79001234567"],
  ])("normalizes %s", (raw, expected) => expect(normalizePhone(raw)).toBe(expected));

  it.each(["", "12345", "+1 202 555 0100", "8 900 123 45 6"])("rejects %j", (raw) => {
    expect(normalizePhone(raw)).toBeNull();
  });
});

describe("validateOrder", () => {
  it("accepts a valid pickup order and normalizes data", () => {
    const result = validateOrder(form({ name: "  Иван  " }));
    expect(result).toEqual({
      ok: true,
      value: expect.objectContaining({ name: "Иван", phone: "+79001234567", delivery: "pickup", address: "" }),
    });
  });

  it("email is optional", () => {
    expect(validateOrder(form({ email: "" })).ok).toBe(true);
  });

  it.each([
    ["name", { name: "И" }],
    ["phone", { phone: "123" }],
    ["email", { email: "not-an-email" }],
    ["delivery", { delivery: "teleport" }],
    ["address", { delivery: "courier", address: "" }],
    ["consent", { consent: null }],
    ["items", { items: "[]" }],
    ["items", { items: '[{"productId":1,"quantity":0}]' }],
    ["items", { items: "garbage" }],
  ])("reports an error for %s", (field, overrides) => {
    const result = validateOrder(form(overrides));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors).toHaveProperty(field);
  });

  it("drops the address for pickup even if one was typed", () => {
    const result = validateOrder(form({ address: "ул. Пушкина, 1" }));
    expect(result.ok && result.value.address).toBe("");
  });
});

describe("deliveryCost", () => {
  const config = { courierPriceRub: 300, freeCourierFromRub: 5000 };

  it("pickup is free", () => expect(deliveryCost("pickup", rub(100), config)).toBe(0));
  it("courier costs the fixed price below the threshold", () =>
    expect(deliveryCost("courier", rub(4999), config)).toBe(rub(300)));
  it("courier is free from the threshold", () => expect(deliveryCost("courier", rub(5000), config)).toBe(0));
});
