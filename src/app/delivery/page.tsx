import type { Metadata } from "next";
import { shop } from "@/config/shop";

export const metadata: Metadata = {
  title: "Доставка и оплата",
  description: "Доставка одежды курьером по городу и самовывоз, оплата при получении. Бесплатная курьерская доставка от суммы заказа.",
  alternates: { canonical: "/delivery" },
};

export default function DeliveryPage() {
  const { courierPriceRub, freeCourierFromRub } = shop.delivery;
  return (
    <div className="max-w-3xl pt-12">
      <h1 className="font-serif text-5xl">Доставка и оплата</h1>

      <section className="mt-10">
        <h2 className="font-serif text-3xl">Доставка</h2>
        <ul className="mt-4 space-y-4 leading-relaxed">
          <li>
            <strong>Самовывоз</strong> — бесплатно. Адрес и время сообщим при подтверждении заказа.
          </li>
          <li>
            <strong>Курьер по городу ({shop.contacts.city})</strong> — {courierPriceRub} ₽, бесплатно при заказе от{" "}
            {freeCourierFromRub.toLocaleString("ru-RU")} ₽. Обычно в течение 1–2 дней после подтверждения.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-3xl">Оплата</h2>
        <p className="mt-4 leading-relaxed">
          Оплата при получении наличными или картой. Онлайн-оплата появится позже.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-3xl">Подлинность</h2>
        <p className="mt-4 leading-relaxed">
          Мы продаём только оригинальную продукцию от правообладателей и официальных дистрибьюторов. Подтверждающие документы
          можно запросить при получении.
        </p>
      </section>
    </div>
  );
}
