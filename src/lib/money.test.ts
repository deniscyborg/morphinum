import { describe, expect, it } from "vitest";
import { formatPrice, rub } from "./money";

describe("money", () => {
  it("converts rubles to integer kopecks without float errors", () => {
    expect(rub(0.1) + rub(0.2)).toBe(rub(0.3));
    expect(rub(2490)).toBe(249000);
  });

  it.each([
    [249000, "2 490 ₽"],
    [99000, "990 ₽"],
    [1290000, "12 900 ₽"],
    [0, "0 ₽"],
  ])("formats %i kopecks as %s", (kopecks, expected) => {
    // Intl ставит неразрывные пробелы — сравниваем после нормализации
    expect(formatPrice(kopecks).replace(/\s/g, " ")).toBe(expected);
  });

  it("rejects fractional kopecks", () => {
    expect(() => formatPrice(10.5)).toThrow();
  });
});
