import { describe, expect, it } from "vitest";
import { createEpochLocalKmsProvider } from "../lib/epoch/enterpriseOperations";

describe("Phase J KMS provider boundary", () => {
  it("round-trips encrypted data without exposing plaintext", async () => {
    const kms = createEpochLocalKmsProvider("development-secret");
    const encrypted = await kms.encrypt("tenant backup payload");
    expect(encrypted).not.toContain("tenant backup payload");
    expect(await kms.decrypt(encrypted)).toBe("tenant backup payload");
  });

  it("rejects tampered ciphertext", async () => {
    const kms = createEpochLocalKmsProvider("development-secret");
    const encrypted = await kms.encrypt("payload");
    await expect(kms.decrypt(`${encrypted}x`)).rejects.toThrow();
  });
});
