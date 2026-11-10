"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { shop } from "@/config/shop";
import { validateOrder, type FieldErrors } from "@/lib/order-validation";
import { getDb } from "@/server/db";
import { placeOrder } from "@/server/orders";
import { CATALOG_TAG } from "@/server/queries";

export type CheckoutState = {
  errors?: FieldErrors;
  message?: string;
  /** Введённые значения возвращаются в форму, чтобы покупателю не пришлось заполнять всё заново */
  values?: Record<string, string>;
};

const FIELDS = ["name", "phone", "email", "delivery", "address", "comment"] as const;

export async function checkout(_prev: CheckoutState, form: FormData): Promise<CheckoutState> {
  const values = Object.fromEntries(FIELDS.map((f) => [f, String(form.get(f) ?? "")]));

  if (shop.demo) return { message: "Это демо-версия магазина: заказы пока не принимаются.", values };

  // Скрытое поле-ловушка: человек его не видит и не заполняет, а спам-бот заполняет
  if (form.get("website")) return { message: "Не удалось оформить заказ. Попробуйте ещё раз.", values };

  const validation = validateOrder(form);
  if (!validation.ok) return { errors: validation.errors, values };

  const result = placeOrder(getDb(), validation.value, shop.delivery, shop.maxQuantityPerItem);
  if (!result.ok) return { message: result.error, values };

  // Остатки изменились — каталог должен показать их сразу, а не после истечения кеша
  updateTag(CATALOG_TAG);
  redirect(`/order/${result.token}`);
}
