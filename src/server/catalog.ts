import type { DatabaseSync } from "node:sqlite";
import type { Kopecks } from "@/lib/money";

/** Чтение каталога. Чистые функции над базой: тестируются с SQLite в памяти, без Next.js. */

export type Product = {
  id: number;
  slug: string;
  name: string;
  category: string;
  description: string;
  price: Kopecks;
  stock: number;
  color: string;
};

const COLUMNS = "id, slug, name, category, description, price, stock, color";

/**
 * node:sqlite отдаёт строки как объекты без прототипа (Object.create(null)).
 * Кеш Next.js и передача данных в клиентские компоненты принимают только обычные объекты.
 */
function plain<T>(row: unknown): T {
  return { ...(row as object) } as T;
}

export function listProducts(db: DatabaseSync, category?: string): Product[] {
  const sql = category
    ? `SELECT ${COLUMNS} FROM products WHERE active = 1 AND category = ? ORDER BY stock = 0, id`
    : `SELECT ${COLUMNS} FROM products WHERE active = 1 ORDER BY stock = 0, id`;
  const rows = category ? db.prepare(sql).all(category) : db.prepare(sql).all();
  return rows.map((r) => plain<Product>(r));
}

export function findProduct(db: DatabaseSync, slug: string): Product | null {
  const row = db.prepare(`SELECT ${COLUMNS} FROM products WHERE active = 1 AND slug = ?`).get(slug);
  return row ? plain<Product>(row) : null;
}

export function listCategories(db: DatabaseSync): string[] {
  const rows = db.prepare("SELECT DISTINCT category FROM products WHERE active = 1 ORDER BY category").all();
  return (rows as { category: string }[]).map((r) => r.category);
}
