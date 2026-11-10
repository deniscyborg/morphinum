import Link from "next/link";
import { formatPrice } from "@/lib/money";
import type { Product } from "@/server/catalog";
import { ProductImage } from "./ProductImage";

export function ProductCard({ product }: { product: Product }) {
  const soldOut = product.stock === 0;
  return (
    <Link
      href={`/catalog/${product.slug}`}
      data-testid="product-card"
      className="group flex flex-col rounded-xl border border-line bg-card p-3 transition-shadow hover:shadow-lg"
    >
      <ProductImage name={product.name} color={product.color} className={soldOut ? "opacity-60" : ""} />
      <div className="flex flex-1 flex-col px-1 pt-4 pb-1">
        <p className="text-xs tracking-wide text-muted uppercase">{product.category}</p>
        <h3 className="mt-1 font-serif text-xl leading-snug group-hover:text-accent">{product.name}</h3>
        <p className="mt-auto pt-3 font-medium">
          {formatPrice(product.price)}
          {soldOut && <span className="ml-2 text-sm font-normal text-muted">нет в наличии</span>}
        </p>
      </div>
    </Link>
  );
}
