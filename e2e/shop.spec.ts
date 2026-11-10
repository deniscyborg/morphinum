import { expect, test, type Page } from "@playwright/test";

/** Цена из текста «2 490 ₽» -> 2490 */
function rubles(text: string | null): number {
  return Number((text ?? "").replace(/[^\d]/g, ""));
}

/**
 * С cacheComponents Next.js скрывает предыдущую страницу через React <Activity>, а не удаляет её из DOM,
 * поэтому считаем только видимые карточки.
 */
function visibleCards(page: Page) {
  return page.locator("[data-testid=product-card]:visible");
}

/**
 * Для страниц с потоковой отдачей Next.js отправляет статус 200 до того, как выяснится, что данных нет.
 * Поисковикам страницу закрывает <meta name="robots" content="noindex">, это и проверяем.
 */
async function expectNotFound(page: Page) {
  await expect(page.getByRole("heading", { name: "Страница не найдена" })).toBeVisible();
  await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
}

async function addProductToCart(page: Page, slug: string) {
  await page.goto(`/catalog/${slug}`);
  await page.getByRole("button", { name: "В корзину" }).click();
  await expect(page.getByRole("status")).toContainText("Добавлено");
}

test.describe("каталог", () => {
  test("главная показывает товары и ведёт в каталог", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(visibleCards(page)).not.toHaveCount(0);

    await page.getByRole("link", { name: "Перейти в каталог" }).click();
    await expect(page).toHaveURL("/catalog");
    await expect(visibleCards(page)).toHaveCount(6);
  });

  test("фильтр по категории показывает только её товары", async ({ page }) => {
    await page.goto("/catalog");
    await page.getByRole("navigation", { name: "Категории" }).getByRole("link", { name: "Подарочные наборы" }).click();

    await expect(page).toHaveURL(/category=/);
    const cards = visibleCards(page);
    await expect(cards).toHaveCount(2);
    for (const card of await cards.all()) await expect(card).toContainText("Подарочные наборы");
  });

  test("товар без остатка нельзя положить в корзину", async ({ page }) => {
    await page.goto("/catalog/demo-limited");
    await expect(page.getByText("Нет в наличии").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "В корзину" })).toHaveCount(0);
  });

  test("несуществующий товар — страница 404 и запрет индексации", async ({ page }) => {
    await page.goto("/catalog/no-such-product");
    await expectNotFound(page);
  });
});

test.describe("корзина", () => {
  test("пересчитывает сумму при изменении количества и удалении", async ({ page }) => {
    await addProductToCart(page, "demo-mini");
    await addProductToCart(page, "demo-classic");
    await expect(page.getByTestId("cart-count")).toHaveText("2");

    await page.goto("/cart");
    await expect(page.getByTestId("cart-line")).toHaveCount(2);
    const before = rubles(await page.getByTestId("cart-total").textContent());

    await page.getByLabel("Количество: Демо-товар «Мини»").fill("3");
    await expect.poll(async () => rubles(await page.getByTestId("cart-total").textContent())).toBe(before + 2 * 990);

    await page.getByTestId("cart-line").filter({ hasText: "Классика" }).getByRole("button", { name: "Удалить" }).click();
    await expect(page.getByTestId("cart-line")).toHaveCount(1);
    await expect(page.getByTestId("cart-total")).toContainText("2 970");
  });

  test("корзина сохраняется после перезагрузки страницы", async ({ page }) => {
    await addProductToCart(page, "demo-mini");
    await page.reload();
    await expect(page.getByTestId("cart-count")).toHaveText("1");
  });

  test("оформление с пустой корзиной предлагает перейти в каталог", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page.getByText("Корзина пуста")).toBeVisible();
  });
});

test.describe("оформление заказа", () => {
  test("ошибки валидации показываются у полей, введённое сохраняется", async ({ page }) => {
    await addProductToCart(page, "demo-mini");
    await page.goto("/checkout");

    await page.getByLabel("Имя", { exact: true }).fill("Иван");
    await page.getByLabel("Телефон", { exact: true }).fill("123");
    await page.getByRole("button", { name: "Подтвердить заказ" }).click();

    await expect(page.getByText("Укажите телефон в формате")).toBeVisible();
    await expect(page.getByText("Нужно согласие на обработку")).toBeVisible();
    await expect(page.getByLabel("Имя", { exact: true })).toHaveValue("Иван");
  });

  test("курьерская доставка добавляет стоимость и требует адрес", async ({ page }) => {
    await addProductToCart(page, "demo-mini");
    await page.goto("/checkout");
    const pickupTotal = rubles(await page.getByTestId("checkout-total").textContent());

    await page.getByLabel(/Курьер по городу/).check();
    await expect.poll(async () => rubles(await page.getByTestId("checkout-total").textContent())).toBe(pickupTotal + 300);
    await expect(page.getByLabel("Адрес доставки")).toBeVisible();
  });

  test("полный заказ: номер заказа, пустая корзина, уменьшился остаток", async ({ page }) => {
    await page.goto("/catalog/demo-duo-set");
    const stockBefore = rubles(await page.getByText(/В наличии:/).textContent());

    await addProductToCart(page, "demo-duo-set");
    await page.goto("/checkout");
    await page.getByLabel("Имя", { exact: true }).fill("Иван Петров");
    await page.getByLabel("Телефон", { exact: true }).fill("+7 900 123-45-67");
    await page.getByLabel(/Согласен на обработку/).check();
    await page.getByRole("button", { name: "Подтвердить заказ" }).click();

    await expect(page).toHaveURL(/\/order\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { name: "Спасибо, Иван Петров!" })).toBeVisible();
    await expect(page.getByTestId("order-number")).toHaveText(/^M-\d{6}$/);
    await expect(page.getByTestId("cart-count")).toHaveCount(0);

    await page.goto("/catalog/demo-duo-set");
    await expect(page.getByText(/В наличии:/)).toHaveText(`В наличии: ${stockBefore - 1} шт.`);
  });

  test("чужой заказ не открывается по номеру", async ({ page }) => {
    await page.goto("/order/1");
    await expectNotFound(page);
  });
});
