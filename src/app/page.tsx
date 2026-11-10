import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { shop } from "@/config/shop";
import { getProducts } from "@/server/queries";

const PROMISES = [
  { title: "Только оригинал", text: "Работаем напрямую с правообладателями и официальными дистрибьюторами. К каждому товару — подтверждение подлинности." },
  { title: "Быстрая доставка", text: `Курьером по городу или самовывоз. Курьерская доставка бесплатно от ${shop.delivery.freeCourierFromRub.toLocaleString("ru-RU")} ₽.` },
  { title: "Без регистрации", text: "Оформите заказ за минуту — менеджер перезвонит, уточнит детали и время доставки." },
];

const HERO_COLORS = ["#2f3e46", "#7f5539"];

export default async function HomePage() {
  const featured = (await getProducts()).filter((p) => p.stock > 0).slice(0, 3);

  return (
    <>
      <section className="grid gap-10 py-16 md:grid-cols-[1.2fr_1fr] md:items-center md:py-24">
        <div>
          <p className="text-sm tracking-[0.2em] text-accent uppercase">{shop.name}</p>
          <h1 className="mt-4 font-serif text-5xl leading-[1.05] font-semibold sm:text-6xl">{shop.tagline}</h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
            Небольшой магазин, где каждая позиция проверена лично. Никаких подделок и серого импорта — только то, за что мы
            готовы ручаться.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/catalog" className="btn-primary">
              Перейти в каталог
            </Link>
            <Link href="/delivery" className="btn-outline">
              Доставка и оплата
            </Link>
          </div>
        </div>
        <div className="hidden grid-cols-2 gap-4 md:grid" aria-hidden="true">
          {/* Пока каталог пуст — декоративные плашки в цветах витрины */}
          {(featured.length > 0 ? featured.slice(0, 2).map((p) => p.color) : HERO_COLORS).map((color, i) => (
            <div
              key={i}
              className={`aspect-[3/4] rounded-2xl ${i === 1 ? "mt-10" : ""}`}
              style={{ background: `linear-gradient(160deg, ${color}, color-mix(in srgb, ${color} 55%, black))` }}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="promises" className="border-y border-line py-12">
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
