import { expect, test } from "@playwright/test";
import { slides } from "../src/config/slides";

test.describe("баннер на главной", () => {
  test.beforeEach(async ({ page }) => {
    // Без анимации: автопрокрутка выключена, тест не зависит от таймера
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
  });

  test("показан ровно один слайд, остальные скрыты от дикторов", async ({ page }) => {
    const carousel = page.getByRole("region", { name: "Главные предложения" });
    await expect(carousel.getByRole("heading", { level: 2 })).toHaveText(slides[0].title);
    await expect(carousel.getByRole("group")).toHaveCount(1);
  });

  test("точки переключают слайды и отмечают текущий", async ({ page }) => {
    const carousel = page.getByRole("region", { name: "Главные предложения" });
    const last = slides.length - 1;
    const dot = carousel.getByRole("button", { name: `Слайд ${last + 1}: ${slides[last].eyebrow}` });

    await dot.click();

    await expect(carousel.getByRole("heading", { level: 2 })).toHaveText(slides[last].title);
    await expect(dot).toHaveAttribute("aria-current", "true");
    await expect(carousel.getByRole("link", { name: slides[last].cta.label })).toBeVisible();
  });

  test("стрелки и клавиатура листают по кругу", async ({ page, isMobile }) => {
    test.skip(isMobile, "на телефоне стрелок нет — листают свайпом и точками");
    const carousel = page.getByRole("region", { name: "Главные предложения" });
    const heading = carousel.getByRole("heading", { level: 2 });

    await carousel.getByRole("button", { name: "Предыдущий слайд" }).click();
    await expect(heading).toHaveText(slides[slides.length - 1].title);

    await page.keyboard.press("ArrowRight");
    await expect(heading).toHaveText(slides[0].title);
  });

  test("кнопка слайда ведёт на нужную страницу", async ({ page }) => {
    const carousel = page.getByRole("region", { name: "Главные предложения" });
    await carousel.getByRole("link", { name: slides[0].cta.label }).click();
    await expect(page).toHaveURL(new RegExp(`${slides[0].cta.href}$`));
  });
});
