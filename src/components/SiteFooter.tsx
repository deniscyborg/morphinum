import { cacheLife } from "next/cache";
import Link from "next/link";
import { shop } from "@/config/shop";

// Текущее время при пререндеринге нужно кешировать явно — иначе Next.js не знает, как часто его обновлять
export async function SiteFooter() {
  "use cache";
  cacheLife("days");
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:justify-between sm:px-6">
        <p>
          © {year} {shop.name}. {shop.tagline}.
        </p>
        <ul className="flex flex-wrap gap-5">
          <li>
            <Link href="/delivery" className="hover:text-ink">Доставка и оплата</Link>
          </li>
          <li>
            <Link href="/privacy" className="hover:text-ink">Политика конфиденциальности</Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
