import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { compileGitHubPullRequest, InMemoryCompilationStore, verifyGitHubSignature } from "../lib/realityCompiler/githubIntake";

const payload = {
  action: "opened",
  repository: { full_name: "acme/billing" },
  pull_request: {
    number: 42,
    title: "Update billing webhook",
    base: { sha: "base-sha" },
    head: { sha: "head-sha" },
  },
};

describe("Reality Compiler GitHub intake", () => {
  it("verifies GitHub HMAC signatures and rejects tampering", () => {
    const raw = JSON.stringify(payload);
    const signature = `sha256=${createHmac("sha256", "secret").update(raw).digest("hex")}`;
    expect(verifyGitHubSignature(raw, signature, "secret")).toBe(true);
    expect(verifyGitHubSignature(`${raw} `, signature, "secret")).toBe(false);
    expect(verifyGitHubSignature(raw, signature, "wrong-secret")).toBe(false);
  });

  it("creates a deterministic compilation and suppresses duplicate deliveries", async () => {
    const store = new InMemoryCompilationStore();
    const first = await compileGitHubPullRequest({
      eventId: "delivery-1",
      action: "opened",
      payload,
      files: [{ path: "prisma/migrations/001_drop.sql", patch: "ALTER TABLE users DROP COLUMN legacy_id;" }],
      store,
    });
    const second = await compileGitHubPullRequest({
      eventId: "delivery-1",
      action: "opened",
      payload,
      files: [{ path: "prisma/migrations/001_drop.sql", patch: "ALTER TABLE users DROP COLUMN legacy_id;" }],
      store,
    });
    expect(first.duplicate).toBe(false);
    expect(first.record.decision.decision).toBe("BLOCK");
    expect(second.duplicate).toBe(true);
    expect(second.record.id).toBe(first.record.id);
  });
});
