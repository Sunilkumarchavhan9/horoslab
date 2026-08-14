import { expect, test } from "@playwright/test";

test.describe("Mission Control authenticated browser flow", () => {
  test.beforeEach(() => {
    test.skip(
      !process.env.EPOCH_E2E_AUTH_STATE,
      "Set EPOCH_E2E_AUTH_STATE to a real Clerk-authenticated Playwright storage state.",
    );
  });

  test("loads the live workspace and operations navigation", async ({ page }) => {
    await page.goto("/mission-control");
    await expect(page).toHaveURL(/\/mission-control/);
    await page.locator("aside").hover();
    await expect(page.getByText("Command Center", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Missions", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Workers", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Executions", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Evidence", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Verification", { exact: true }).first()).toBeVisible();
  });

  test("shows real connector entry points without claiming a connection", async ({ page }) => {
    await page.goto("/mission-control?tab=Data%20Sources");
    await expect(page.getByText("Data Sources", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("GitHub", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Slack", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Connect Jira/i })).toBeVisible();
  });
});
