import { defineConfig, devices } from "@playwright/test";

const authState = process.env.EPOCH_E2E_AUTH_STATE;

export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "**/*.e2e.ts",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  reporter: "list",
  use: {
    baseURL: process.env.EPOCH_E2E_BASE_URL ?? "http://localhost:3000",
    storageState: authState || undefined,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
  },
});
