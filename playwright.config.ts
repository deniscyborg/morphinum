import { defineConfig, devices } from "@playwright/test";

const PORT = 4174;

export default defineConfig({
  testDir: "./e2e",
  // Тесты меняют остатки в общей базе, поэтому идут последовательно
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    // Продакшен-сервер на собранном приложении и отдельной базе, которую тесты могут портить
    command: `node scripts/e2e-server.mjs ${PORT}`,
    url: `http://localhost:${PORT}/`,
    // Всегда свежий сервер: тесты меняют остатки, чужая база дала бы ложные результаты
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
