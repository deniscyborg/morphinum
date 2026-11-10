/**
 * Деньги храним в копейках (целые числа), чтобы не ловить ошибки округления float:
 * 0.1 + 0.2 !== 0.3, а 10 + 20 === 30.
 */
export type Kopecks = number;

export function rub(amount: number): Kopecks {
  return Math.round(amount * 100);
}

const formatter = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

/** 129900 -> "1 299 ₽" (неразрывные пробелы, как принято в русской типографике) */
export function formatPrice(kopecks: Kopecks): string {
  if (!Number.isInteger(kopecks)) throw new Error(`Price must be an integer number of kopecks, got ${kopecks}`);
  return formatter.format(kopecks / 100);
}
