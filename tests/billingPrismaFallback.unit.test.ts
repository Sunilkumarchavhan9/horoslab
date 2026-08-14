import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getBillingStateForUser,
  listBillingEventsForUser,
  tryConsumeUsage,
} from "../lib/billing/store";

describe("Billing Prisma primary store", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("stores and consumes usage through Prisma", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/memoryos");

    const userId = `user_billing_prisma_${Date.now()}`;
    const billing = await getBillingStateForUser(userId);
    const events = await listBillingEventsForUser(userId);
    const usage = await tryConsumeUsage({
      userId,
      tokenCost: 10,
      searchCost: 1,
    });

    expect(billing.plan).toBe("Free");
    expect(billing.usage.tokenLimit).toBeGreaterThanOrEqual(0);
    expect(events).toEqual([]);
    expect(usage.allowed).toBe(true);
    expect(usage.plan).toBe("Free");
  });

  it("does not silently create local billing state when Prisma is not configured", async () => {
    vi.stubEnv("DATABASE_URL", "file:./dev.db");

    await expect(getBillingStateForUser("user_billing_no_local_fallback")).rejects.toThrow(
      "Billing store requires a Prisma/Postgres DATABASE_URL",
    );
  });
});
