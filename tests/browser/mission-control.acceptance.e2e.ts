import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

type Json = Record<string, unknown>;

test.describe("Mission Control UI acceptance", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(() => {
    test.skip(
      !process.env.EPOCH_E2E_AUTH_STATE,
      "Set EPOCH_E2E_AUTH_STATE to a real Clerk-authenticated Playwright storage state.",
    );
  });

  async function openSidebarSection(page: Page, title: string) {
    const dataPath = title === "Institutions" ? "/institutions" : title === "Workers" ? "/workers" : "/missions";
    const dataRequest = page.waitForResponse((response) =>
      response.url().includes("/api/v1/epoch/workspaces/") &&
      response.url().includes(dataPath) &&
      response.ok(),
    );
    await page.goto(`/mission-control?tab=${encodeURIComponent(title)}`);
    await dataRequest;
    const actionName = title === "Institutions"
      ? "New Institution"
      : title === "Workers"
        ? "Register Worker"
        : "New Mission";
    await expect(page.getByRole("button", { name: actionName }).last()).toBeVisible();
  }

  async function discoverWorkspace(page: Page): Promise<string> {
    const snapshot = page.waitForResponse((response) =>
      response.url().includes("/api/v1/epoch/workspaces/") &&
      response.url().includes("/mission-control/snapshot") &&
      response.ok(),
    );
    await page.goto("/mission-control");
    const response = await snapshot;
    const match = response.url().match(/\/workspaces\/([^/]+)\/mission-control/);
    expect(match?.[1], "Mission Control should request a live workspace snapshot").toBeTruthy();
    return match![1];
  }

  async function get(api: APIRequestContext, workspaceId: string, path: string): Promise<Json> {
    const response = await api.get(`/api/v1/epoch/workspaces/${encodeURIComponent(workspaceId)}${path}`);
    const envelope = (await response.json()) as Json;
    const payload = (envelope.data && typeof envelope.data === "object" ? envelope.data : envelope) as Json;
    expect(response.ok(), `${response.status()} ${path}: ${JSON.stringify(payload)}`).toBeTruthy();
    return payload;
  }

  test("drives the governed local mission lifecycle through Mission Control UI", async ({ page }) => {
    const workspaceId = await discoverWorkspace(page);
    const api = page.context().request;
    const suffix = `${Date.now()}`;
    const institutionName = `UI Acceptance Institution ${suffix}`;
    const workerName = `UI Acceptance Worker ${suffix}`;
    const missionTitle = `UI Acceptance Mission ${suffix}`;

    await openSidebarSection(page, "Institutions");
    await page.getByRole("button", { name: "New Institution" }).click();
    const institutionDialog = page.getByRole("dialog");
    await institutionDialog.locator("input").fill(institutionName);
    await institutionDialog.locator("select").selectOption({ label: "Software Development" });
    await institutionDialog.getByRole("button", { name: "Create institution" }).click();
    await expect(page.getByText(institutionName, { exact: true })).toBeVisible();

    await openSidebarSection(page, "Workers");
    await page.getByRole("button", { name: "Register Worker" }).last().click();
    const workerDialog = page.getByRole("dialog");
    await workerDialog.locator("input").first().fill(workerName);
    const workerSelects = workerDialog.locator("select");
    await workerSelects.nth(0).selectOption("ai_agent");
    await workerSelects.nth(1).selectOption("OpenRouter");
    const capabilitiesButton = workerDialog.locator("button").filter({ hasText: /Select capabilities|migration|verification|code|tests/ }).first();
    await capabilitiesButton.click();
    for (const capability of ["migration", "code", "tests", "verification"]) {
      const capabilityLabel = workerDialog.locator("label").filter({ hasText: new RegExp(`^${capability}$`) });
      const checkbox = capabilityLabel.locator("input[type=checkbox]");
      const shouldBeSelected = ["code", "tests", "verification"].includes(capability);
      if (await checkbox.isChecked() !== shouldBeSelected) await capabilityLabel.click();
    }
    await capabilitiesButton.click({ force: true });
    await workerDialog.getByRole("button", { name: "Register worker" }).click();
    await expect(page.getByText(workerName, { exact: true })).toBeVisible();

    await expect(page.getByText(workerName, { exact: true })).toBeVisible();

    await openSidebarSection(page, "Missions");
    await page.getByRole("button", { name: "New Mission" }).last().click();
    const form = page.locator("form").filter({ has: page.getByText("Execution specification", { exact: true }) });
    await form.locator("select").selectOption({ label: institutionName });
    const inputs = form.locator("input");
    await inputs.nth(0).fill(missionTitle);
    await inputs.nth(1).fill("Produce a verified local mission result.");
    await form.getByRole("button", { name: "Create mission" }).click();
    await expect(page.getByText(missionTitle, { exact: true })).toBeVisible();

    const missionRow = page.locator("tr").filter({ hasText: missionTitle }).first();
    await expect(missionRow).toBeVisible();
    const missionId = (await missionRow.innerText()).match(/\b(cms[a-z0-9]+)\b/i)?.[1];
    expect(missionId, "The UI row should render the backend mission ID").toEqual(expect.any(String));
    if (!missionId) throw new Error("Mission Control did not render a mission ID.");
    await missionRow.click();
    await expect(page.getByText(missionTitle, { exact: true }).last()).toBeVisible();
    const approveButton = page.getByRole("button", { name: "Approve", exact: true });
    await expect(approveButton).toBeEnabled();
    await approveButton.click();
    const runButton = page.getByRole("button", { name: "Run", exact: true });
    if (await runButton.isEnabled()) await runButton.click();
    await expect(page.getByText(/Evidence/i).last()).toBeVisible();
    await expect.poll(async () => {
      const detail = await get(api, workspaceId, `/missions/${encodeURIComponent(missionId)}`);
      return ((detail.mission as Json).evidence ?? []) instanceof Array ? ((detail.mission as Json).evidence as Json[]).length : 0;
    }, { timeout: 30_000, message: "Approved execution should persist live evidence" }).toBeGreaterThan(0);

    await page.getByRole("button", { name: "Verify", exact: true }).click();
    await expect.poll(async () => {
      const detail = await get(api, workspaceId, `/missions/${encodeURIComponent(missionId)}`);
      return String(((detail.mission as Json).verificationRun as Json | undefined)?.finalDecision ?? "").toUpperCase();
    }, { timeout: 30_000 }).toBe("PASS");

    const issueCertificateButton = page.getByRole("button", { name: "Issue Certificate", exact: true });
    if (await issueCertificateButton.isEnabled()) {
      await issueCertificateButton.click();
    }
    await expect.poll(async () => {
      const detail = await get(api, workspaceId, `/missions/${encodeURIComponent(missionId)}`);
      return Boolean((detail.mission as Json).certificate);
    }, { timeout: 30_000 }).toBe(true);

    await page.reload();
    const refreshedMissionRow = page.locator("tr").filter({ hasText: missionTitle }).first();
    await expect(refreshedMissionRow).toBeVisible();
    await refreshedMissionRow.click();
    await expect(page.getByText(missionTitle, { exact: true }).last()).toBeVisible();
    const settleButton = page.getByRole("button", { name: "Settle & Learn", exact: true });
    await expect(settleButton).toBeEnabled();
    const settlementResponse = page.waitForResponse((response) => response.url().includes("/settlement") && response.request().method() === "POST");
    await settleButton.click();
    const settlementPost = await settlementResponse;
    expect(settlementPost.ok(), `Settlement POST failed: ${await settlementPost.text()}`).toBeTruthy();
    await expect.poll(async () => {
      const settlement = await get(api, workspaceId, `/missions/${encodeURIComponent(missionId)}/settlement`);
      return Boolean(settlement.settlement);
    }, { timeout: 30_000 }).toBe(true);

    await page.reload();
    await expect(page.getByText(missionTitle, { exact: true })).toBeVisible();
    await expect(page.getByText(/PASS|Handoff created/i).first()).toBeVisible();
  });

  test("drives cancellation from the mission inspector UI", async ({ page }) => {
    await discoverWorkspace(page);
    await openSidebarSection(page, "Missions");
    await page.getByRole("button", { name: "New Mission" }).last().click();
    const suffix = `${Date.now()}`;
    const missionTitle = `UI Cancellation Mission ${suffix}`;
    const form = page.locator("form").filter({ has: page.getByText("Execution specification", { exact: true }) });
    await form.locator("select").selectOption({ index: 1 });
    const inputs = form.locator("input");
    await inputs.nth(0).fill(missionTitle);
    await inputs.nth(1).fill("Exercise cancellation from the live inspector.");
    await form.getByRole("button", { name: "Create mission" }).click();
    await page.locator("tr").filter({ hasText: missionTitle }).click();
    await page.getByRole("button", { name: "Cancel", exact: true }).last().click();
    await expect(page.getByText("cancelled", { exact: true }).last()).toBeVisible();
  });
});
