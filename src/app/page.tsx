import type { Metadata } from "next";
import Link from "next/link";
import { HeroSlider } from "@/components/HeroSlider";
import { ProductCard } from "@/components/ProductCard";
import { shop } from "@/config/shop";
import { slides } from "@/config/slides";
import { getProducts } from "@/server/queries";

const PROMISES = [
  { title: "Только оригинал", text: "Работаем напрямую с правообладателями и официальными дистрибьюторами. К каждому товару — подтверждение подлинности." },
  { title: "Быстрая доставка", text: `Курьером по городу или самовывоз. Курьерская доставка бесплатно от ${shop.delivery.freeCourierFromRub.toLocaleString("ru-RU")} ₽.` },
  { title: "Без регистрации", text: "Оформите заказ за минуту — менеджер перезвонит, уточнит детали и время доставки." },
];

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function HomePage() {
  const featured = (await getProducts()).filter((p) => p.stock > 0).slice(0, 3);

  return (
    <>
      {/* Заголовок страницы для поисковиков и экранных дикторов; на экране его роль играют слайды */}
      <h1 className="sr-only">
        {shop.name} — {shop.tagline}
      </h1>
      <HeroSlider slides={slides} />

      <section aria-labelledby="promises" className="mt-12 border-y border-line py-12">
        <h2 id="promises" className="sr-only">
          Почему мы
        </h2>
        <ul className="grid gap-8 md:grid-cols-3">
          {PROMISES.map((item) => (
            <li key={item.title}>
              <h3 className="font-serif text-2xl">{item.title}</h3>
              <p className="mt-2 leading-relaxed text-muted">{item.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="featured" className="pt-16">
        <div className="flex items-end justify-between gap-4">
          <h2 id="featured" className="font-serif text-4xl">
            Популярное
          </h2>
          <Link href="/catalog" className="text-sm text-accent underline-offset-4 hover:underline">
            Весь каталог →
          </Link>
        </div>
        {featured.length === 0 ? (
          <p className="mt-8 text-muted">Каталог наполняется — первые товары скоро появятся.</p>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <section id="contacts" aria-labelledby="contacts-title" className="mt-20 rounded-2xl bg-ink px-8 py-12 text-paper md:px-12">
        <h2 id="contacts-title" className="font-serif text-4xl">
          Контакты
        </h2>
        <p className="mt-3 max-w-xl text-paper/70">Есть вопрос о товаре или заказе — напишите или позвоните, ответим в рабочее время.</p>
        <dl className="mt-8 grid gap-6 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-paper/60">Телефон</dt>
            <dd className="mt-1 text-lg">{shop.contacts.phone ?? "скоро появится"}</dd>
          </div>
          <div>
            <dt className="text-sm text-paper/60">Почта</dt>
            <dd className="mt-1 text-lg">{shop.contacts.email ?? "скоро появится"}</dd>
          </div>
          <div>
            <dt className="text-sm text-paper/60">Город</dt>
            <dd className="mt-1 text-lg">{shop.contacts.city}</dd>
          </div>
        </dl>
      </section>
    </>
  );
}
