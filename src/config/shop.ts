/**
 * Настройки магазина, которые меняются без правки кода страниц.
 * TODO: заполнить реальными данными перед запуском.
 */
export const shop = {
  name: "Morphinum",
  tagline: "Оригинальная продукция с гарантией подлинности",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  /**
   * Демо-витрина: все страницы магазина на месте, но каталог пуст и заказы не принимаются.
   * Включается при сборке: NEXT_PUBLIC_SHOP_DEMO=1.
   */
  demo: process.env.NEXT_PUBLIC_SHOP_DEMO === "1",

  contacts: {
    phone: null as string | null, // "+7 900 000-00-00"
    email: "info@morphinum.ru" as string | null,
    telegram: null as string | null, // "https://t.me/morphinum"
    city: "Москва",
  },

  delivery: {
    courierPriceRub: 300,
    /** Бесплатная курьерская доставка от этой суммы заказа */
    freeCourierFromRub: 5000,
  },

  /** Максимум одного товара в корзине — защита от опечаток вроде «100» вместо «1» */
  maxQuantityPerItem: 10,
} as const;
