"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { checkout, type CheckoutState } from "@/app/checkout/actions";
import { shop } from "@/config/shop";
import { deliveryCost, deliveryLabels, deliveryMethods, type DeliveryMethod } from "@/lib/delivery";
import { formatPrice } from "@/lib/money";
import { useCart } from "./CartProvider";

export function CheckoutForm() {
  const { cart, ready, total } = useCart();
  const [state, action, pending] = useActionState<CheckoutState, FormData>(checkout, {});
  const [delivery, setDelivery] = useState<DeliveryMethod>((state.values?.delivery as DeliveryMethod) || "pickup");

  if (!ready) return <p className="mt-8 text-muted">Загружаем корзину…</p>;
  if (cart.lines.length === 0) {
    return (
      <p className="mt-8 text-muted">
        Корзина пуста. <Link href="/catalog" className="text-accent underline">Перейти в каталог</Link>
      </p>
    );
  }

  const errors = state.errors ?? {};
  const shipping = deliveryCost(delivery, total, shop.delivery);
  const items = JSON.stringify(cart.lines.map((l) => ({ productId: l.productId, quantity: l.quantity })));

  return (
    <form action={action} noValidate className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        {state.message && (
          <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 px-4 py-3 text-danger">
            {state.message}
          </p>
        )}

        <Field label="Имя" name="name" error={errors.name} defaultValue={state.values?.name} autoComplete="name" />
        <Field
          label="Телефон"
          name="phone"
          type="tel"
          error={errors.phone}
          defaultValue={state.values?.phone}
          autoComplete="tel"
          placeholder="+7 900 123-45-67"
        />
        <Field
          label="Почта (необязательно)"
          name="email"
          type="email"
          error={errors.email}
          defaultValue={state.values?.email}
          autoComplete="email"
        />

        <fieldset>
          <legend className="mb-2 text-sm font-medium">Способ получения</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {deliveryMethods.map((method) => (
              <label
                key={method}
                className={`flex cursor-pointer items-start gap-3 rounded-md border bg-white p-4 ${
                  delivery === method ? "border-accent" : "border-line"
                }`}
              >
                <input
                  type="radio"
                  name="delivery"
                  value={method}
                  checked={delivery === method}
                  onChange={() => setDelivery(method)}
                  className="mt-1"
                />
                <span>
                  <span className="block font-medium">{deliveryLabels[method]}</span>
                  <span className="text-sm text-muted">
                    {method === "pickup"
                      ? "Бесплатно"
                      : `${shop.delivery.courierPriceRub} ₽, бесплатно от ${shop.delivery.freeCourierFromRub.toLocaleString("ru-RU")} ₽`}
                  </span>
                </span>
              </label>
            ))}
          </div>
          {errors.delivery && <p className="mt-1 text-sm text-danger">{errors.delivery}</p>}
        </fieldset>

        {delivery === "courier" && (
          <Field label="Адрес доставки" name="address" error={errors.address} defaultValue={state.values?.address} autoComplete="street-address" />
        )}

        <div>
          <label htmlFor="comment" className="mb-1 block text-sm font-medium">
            Комментарий к заказу
          </label>
          <textarea id="comment" name="comment" rows={3} defaultValue={state.values?.comment} />
        </div>

        {/* Ловушка для спам-ботов: скрыта от людей и от скринридеров */}
        <div className="hidden" aria-hidden="true">
          <label>
            Сайт
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <div>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="consent" aria-invalid={Boolean(errors.consent)} className="mt-0.5" />
            <span>
              Согласен на обработку персональных данных в соответствии с{" "}
              <Link href="/privacy" className="text-accent underline" target="_blank">
                политикой конфиденциальности
              </Link>
            </span>
          </label>
          {errors.consent && <p className="mt-1 text-sm text-danger">{errors.consent}</p>}
        </div>

        <input type="hidden" name="items" value={items} />
        {errors.items && <p className="text-sm text-danger">{errors.items}</p>}
      </div>

      <aside className="h-fit rounded-xl border border-line bg-card p-6">
        <h2 className="font-serif text-2xl">Ваш заказ</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {cart.lines.map((l) => (
            <li key={l.productId} className="flex justify-between gap-4">
              <span>
                {l.name} × {l.quantity}
              </span>
              <span className="shrink-0">{formatPrice(l.price * l.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt>Товары</dt>
            <dd>{formatPrice(total)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Доставка</dt>
            <dd>{shipping === 0 ? "бесплатно" : formatPrice(shipping)}</dd>
          </div>
          <div className="flex justify-between text-lg font-semibold">
            <dt>Итого</dt>
            <dd data-testid="checkout-total">{formatPrice(total + shipping)}</dd>
          </div>
        </dl>
        <button type="submit" disabled={pending} className="btn-primary mt-6 w-full">
          {pending ? "Оформляем…" : "Подтвердить заказ"}
        </button>
        <p className="mt-3 text-xs text-muted">Итоговая сумма проверяется по актуальным ценам и наличию.</p>
      </aside>
    </form>
  );
}

type FieldProps = {
  label: string;
  name: string;
  error?: string;
  defaultValue?: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
};

function Field({ label, name, error, defaultValue, type = "text", autoComplete, placeholder }: FieldProps) {
  const errorId = `${name}-error`;
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
