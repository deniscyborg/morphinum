import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { connection } from "next/server";
import { findProduct, listCategories, listProducts } from "./catalog";
import { getDb } from "./db";

/** Тег каталога: сбрасывается после каждого заказа, потому что меняются остатки */
export const CATALOG_TAG = "catalog";

export async function getProducts(category?: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  return listProducts(getDb(), category);
}

export async function getProduct(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  return findProduct(getDb(), slug);
}

export async function getCategories() {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  return listCategories(getDb());
}

/**
 * Остаток — без кеша: после каждого заказа он меняется, и покупатель должен видеть актуальное наличие.
 * Описание товара при этом остаётся в кеше (getProduct).
 */
export async function getStock(productId: number): Promise<number> {
  // node:sqlite синхронный: без connection() запрос выполнился бы при пререндеринге,
  // и остаток «застыл» бы в статической странице
  await connection();
  const row = getDb().prepare("SELECT stock FROM products WHERE id = ? AND active = 1").get(productId) as
    | { stock: number }
    | undefined;
  return row?.stock ?? 0;
}
