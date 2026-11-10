import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="text-sm tracking-[0.2em] text-accent uppercase">404</p>
      <h1 className="mt-3 font-serif text-5xl">Страница не найдена</h1>
      <p className="mt-4 text-muted">Возможно, товар сняли с продажи или ссылка устарела.</p>
      <Link href="/catalog" className="btn-primary mt-8">
        Перейти в каталог
      </Link>
    </div>
  );
}
