import type { DatabaseSync } from "node:sqlite";
import { demoProducts } from "./seed";

/** Схема базы. Модуль не зависит от Next.js, поэтому используется и в юнит-тестах с базой в памяти. */
export function migrate(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      slug        TEXT    NOT NULL UNIQUE,
      name        TEXT    NOT NULL,
      category    TEXT    NOT NULL,
      description TEXT    NOT NULL,
      price       INTEGER NOT NULL CHECK (price > 0),        -- в копейках
      stock       INTEGER NOT NULL CHECK (stock >= 0),
      color       TEXT    NOT NULL,                          -- цвет карточки-заглушки до появления фото
      active      INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS orders (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      token       TEXT    NOT NULL UNIQUE,                  -- для ссылки на заказ: id идут подряд и угадываются
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      name        TEXT    NOT NULL,
      phone       TEXT    NOT NULL,
      email       TEXT    NOT NULL,
      delivery    TEXT    NOT NULL,
      address     TEXT    NOT NULL,
      comment     TEXT    NOT NULL,
      subtotal    INTEGER NOT NULL,
      delivery_cost INTEGER NOT NULL,
      total       INTEGER NOT NULL,
      status      TEXT    NOT NULL DEFAULT 'new'
    );

    CREATE TABLE IF NOT EXISTS order_items (
      order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id  INTEGER NOT NULL REFERENCES products(id),
      name        TEXT    NOT NULL,                          -- копия на момент заказа
      price       INTEGER NOT NULL,
      quantity    INTEGER NOT NULL CHECK (quantity > 0),
      PRIMARY KEY (order_id, product_id)
    );
  `);
}

export function seedIfEmpty(db: DatabaseSync): void {
  const { count } = db.prepare("SELECT COUNT(*) AS count FROM products").get() as { count: number };
  if (count > 0) return;

  const insert = db.prepare(
    "INSERT INTO products (slug, name, category, description, price, stock, color) VALUES (?, ?, ?, ?, ?, ?, ?)",
  );
  for (const p of demoProducts) {
    insert.run(p.slug, p.name, p.category, p.description, p.price, p.stock, p.color);
  }
}
