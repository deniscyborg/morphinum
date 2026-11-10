import "server-only";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { shop } from "@/config/shop";
import { migrate, seedIfEmpty } from "./schema";

/**
 * Одна база SQLite в файле на весь процесс.
 * Путь задаётся DATABASE_PATH; в Docker он указывает на постоянный том.
 */
const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "morphinum.db");

const globalForDb = globalThis as unknown as { morphinumDb?: DatabaseSync };

export function getDb(): DatabaseSync {
  if (!globalForDb.morphinumDb) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    const db = new DatabaseSync(DB_PATH);
    db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
    migrate(db);
    // В демо-витрине каталог пуст: тестовые товары не подставляются
    if (!shop.demo) seedIfEmpty(db);
    globalForDb.morphinumDb = db;
  }
  return globalForDb.morphinumDb;
}
