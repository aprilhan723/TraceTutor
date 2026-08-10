import { defineConfig, devices } from "@playwright/test";

const productionE2E = process.env.E2E_PRODUCTION === "1";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    command: productionE2E
      ? "node node_modules/next/dist/bin/next start -p 3000"
      : "node node_modules/next/dist/bin/next dev --webpack -p 3000",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI && !productionE2E,
    timeout: 120_000,
  },
});
