import Link from "next/link";
import { shop } from "@/config/shop";
import { CartLink } from "./CartLink";

const NAV = [
  { href: "/catalog", label: "Каталог" },
  { href: "/delivery", label: "Доставка и оплата" },
  { href: "/#contacts", label: "Контакты" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="font-serif text-2xl font-semibold tracking-wide">
          {shop.name}
        </Link>
        <nav aria-label="Основное меню" className="hidden flex-1 sm:block">
          <ul className="flex gap-6 text-sm">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-muted hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto">
          <CartLink />
        </div>
      </div>
      <nav aria-label="Меню для телефона" className="border-t border-line sm:hidden">
        <ul className="flex justify-around py-2 text-sm">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="text-muted hover:text-ink">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
