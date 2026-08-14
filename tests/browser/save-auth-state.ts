import { chromium } from "@playwright/test";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const baseUrl = process.env.EPOCH_E2E_BASE_URL ?? "http://localhost:3000";
const outputPath = process.env.EPOCH_E2E_AUTH_STATE ?? "test-results/clerk-auth.json";

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${baseUrl}/auth/sign-in`, { waitUntil: "domcontentloaded" });

  const prompt = createInterface({ input, output });
  await prompt.question(
    "Sign in in the browser window. Press ENTER here after Mission Control is visible... ",
  );
  await prompt.close();

  await context.storageState({ path: outputPath });
  await browser.close();
  console.log(`Saved Playwright auth state to ${outputPath}`);
}

void main();
