// Запуск собранного приложения для e2e-тестов: каждый прогон — с новой базой из демо-каталога.
// Next.js запускается в этом же процессе, а не дочерним: на Windows дочерний процесс переживает
// остановку обёртки, и следующий прогон подхватывал бы старый сервер с изменённой базой.
import fs from "node:fs";
import path from "node:path";

const port = process.argv[2] ?? "4174";
// Не в test-results: эту папку Playwright сам очищает в начале прогона
const dbPath = path.resolve(".e2e-data", "e2e.db");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
for (const suffix of ["", "-wal", "-shm"]) fs.rmSync(dbPath + suffix, { force: true });

process.env.DATABASE_PATH = dbPath;
process.argv = [process.argv[0], "next", "start", "-p", port];
await import("next/dist/bin/next");
