import type { Metadata } from "next";

export const metadata: Metadata = { title: "Политика конфиденциальности", robots: { index: false } };

/**
 * TODO: заменить юридически корректным текстом до запуска.
 * Магазин собирает имя, телефон, почту и адрес — по 152-ФЗ нужна политика обработки персональных данных
 * и, как правило, уведомление Роскомнадзора об обработке ПДн.
 */
export default function PrivacyPage() {
  return (
    <div className="max-w-3xl pt-12">
      <h1 className="font-serif text-5xl">Политика конфиденциальности</h1>
      <p className="mt-6 text-muted">Документ готовится и будет опубликован до начала продаж.</p>
    </div>
  );
}
