import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddToCart } from "@/components/AddToCart";
import { ProductImage } from "@/components/ProductImage";
import { formatPrice } from "@/lib/money";
import { getProduct, getProducts, getStock } from "@/server/queries";

// Страницы известных товаров собираются заранее; новые товары рендерятся при первом запросе
export async function generateStaticParams() {
  const slugs = (await getProducts()).map((p) => ({ slug: p.slug }));
  // Cache Components требует хотя бы один адрес при сборке; при пустом каталоге (демо) — служебный, он отдаёт «не найдено»
  return slugs.length > 0 ? slugs : [{ slug: "_empty" }];
}

export async function generateMetadata({ params }: PageProps<"/catalog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  return product
    ? { title: product.name, description: product.description, alternates: { canonical: `/catalog/${slug}` } }
    : {};
}

export default async function ProductPage({ params }: PageProps<"/catalog/[slug]">) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();

  return (
    <div className="pt-10">
      <Link href="/catalog" className="text-sm text-muted hover:text-ink">
        ← Каталог
      </Link>
      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <ProductImage name={product.name} color={product.color} className="w-full" />
        <div>
          <p className="text-sm tracking-wide text-muted uppercase">{product.category}</p>
          <h1 className="mt-2 font-serif text-5xl leading-tight">{product.name}</h1>
          <p className="mt-6 text-3xl font-medium">{formatPrice(product.price)}</p>
          {/* Наличие читается из базы на каждый запрос, описание товара — из кеша */}
          <Suspense fallback={<p className="mt-2 h-5 text-sm text-muted">Проверяем наличие…</p>}>
            <Availability product={product} />
          </Suspense>
          <p className="mt-10 leading-relaxed text-ink/80">{product.description}</p>
          <ul className="mt-8 space-y-2 border-t border-line pt-6 text-sm text-muted">
            <li>✓ Подтверждение подлинности в каждом заказе</li>
            <li>✓ Самовывоз или курьер по городу</li>
            <li>✓ Оплата при получении</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

async function Availability({ product }: { product: { id: number; slug: string; name: string; price: number } }) {
  const stock = await getStock(product.id);
  return (
    <>
      <p className="mt-2 text-sm text-muted">{stock > 0 ? `В наличии: ${stock} шт.` : "Нет в наличии"}</p>
      <div className="mt-8">
        <AddToCart product={{ ...product, stock }} />
      </div>
    </>
  );
}
