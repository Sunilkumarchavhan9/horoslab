import { describe, expect, it } from "vitest";
import { EPOCH_API_VERSION, EPOCH_CONTRACT_VERSION, getEpochApiVersionInfo } from "../lib/epoch/apiVersion";

describe("Epoch API version contract", () => {
  it("publishes one current API and contract version", () => {
    const info = getEpochApiVersionInfo();
    expect(info).toEqual({
      apiVersion: EPOCH_API_VERSION,
      contractVersion: EPOCH_CONTRACT_VERSION,
      status: "current",
      compatibility: { supported: ["v1"], deprecated: [] },
    });
  });
});
