import { isDeliveryMethod, type DeliveryMethod } from "./delivery";

export type OrderInput = {
  name: string;
  phone: string;
  email: string;
  delivery: DeliveryMethod;
  address: string;
  comment: string;
  items: { productId: number; quantity: number }[];
};

export type FieldErrors = Partial<Record<"name" | "phone" | "email" | "delivery" | "address" | "consent" | "items", string>>;

export type ValidationResult = { ok: true; value: OrderInput } | { ok: false; errors: FieldErrors };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** "+7 (900) 123-45-67", "8 900 1234567", "9001234567" -> "+79001234567"; иначе null */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("9")) return `+7${digits}`;
  if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) return `+7${digits.slice(1)}`;
  return null;
}

function text(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseItems(raw: string): OrderInput["items"] | null {
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data) || data.length === 0) return null;
    const items = data.map((i) => ({ productId: Number(i?.productId), quantity: Number(i?.quantity) }));
    return items.every((i) => Number.isInteger(i.productId) && i.productId > 0 && Number.isInteger(i.quantity) && i.quantity > 0)
      ? items
      : null;
  } catch {
    return null;
  }
}

/** Проверка формы оформления заказа. Сообщения — для покупателя, на русском. */
export function validateOrder(form: FormData): ValidationResult {
  const errors: FieldErrors = {};

  const name = text(form, "name");
  if (name.length < 2) errors.name = "Укажите имя";
  else if (name.length > 100) errors.name = "Слишком длинное имя";

  const phone = normalizePhone(text(form, "phone"));
  if (!phone) errors.phone = "Укажите телефон в формате +7 900 123-45-67";

  const email = text(form, "email");
  if (email && !EMAIL.test(email)) errors.email = "Проверьте адрес почты";

  const delivery = text(form, "delivery");
  if (!isDeliveryMethod(delivery)) errors.delivery = "Выберите способ получения";

  const address = text(form, "address");
  if (delivery === "courier" && address.length < 5) errors.address = "Укажите адрес доставки";

  if (form.get("consent") !== "on") errors.consent = "Нужно согласие на обработку персональных данных";

  const items = parseItems(text(form, "items"));
  if (!items) errors.items = "Корзина пуста";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      name,
      phone: phone!,
      email,
      delivery: delivery as DeliveryMethod,
      address: delivery === "courier" ? address : "",
      comment: text(form, "comment").slice(0, 1000),
      items: items!,
    },
  };
}
