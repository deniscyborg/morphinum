import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductCard } from "@/components/ProductCard";
import { getCategories, getProducts } from "@/server/queries";

export const metadata: Metadata = {
  title: "Каталог одежды",
  description: "Каталог оригинальной брендовой одежды Morphinum: верхняя одежда, базовые вещи и аксессуары с подтверждением подлинности.",
  alternates: { canonical: "/catalog" },
};

export default function CatalogPage({ searchParams }: PageProps<"/catalog">) {
  return (
    <div className="pt-12">
      <h1 className="font-serif text-5xl">Каталог</h1>
      {/* Категория приходит из адреса страницы — это данные запроса, поэтому список в Suspense */}
      <Suspense fallback={<p className="mt-10 text-muted">Загружаем каталог…</p>}>
        <CatalogContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function CatalogContent({ searchParams }: { searchParams: PageProps<"/catalog">["searchParams"] }) {
  const { category } = await searchParams;
  const active = typeof category === "string" ? category : undefined;
  const [categories, products] = await Promise.all([getCategories(), getProducts(active)]);

  return (
    <>
      <nav aria-label="Категории" className="mt-8">
        <ul className="flex flex-wrap gap-2">
          <li>
            <CategoryLink href="/catalog" active={!active}>
              Все
            </CategoryLink>
          </li>
          {categories.map((c) => (
            <li key={c}>
              <CategoryLink href={`/catalog?category=${encodeURIComponent(c)}`} active={active === c}>
                {c}
              </CategoryLink>
            </li>
          ))}
        </ul>
      </nav>

      {products.length === 0 ? (
        <p className="mt-10 text-muted">
          {categories.length === 0 ? "Каталог наполняется — первые товары скоро появятся." : "В этой категории пока нет товаров."}
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </>
  );
}

function CategoryLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-block rounded-full border px-4 py-1.5 text-sm transition-colors ${
        active ? "border-ink bg-ink text-paper" : "border-line bg-card text-muted hover:border-ink hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}
