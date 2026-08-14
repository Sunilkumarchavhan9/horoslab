import { describe, expect, it } from "vitest";
import { buildEpochAiExecutionHealth, buildEpochAiRebalancePlan, discoverEpochAiExecutionEndpoints, routeEpochAiExecution } from "../lib/epoch/aiExecutionRuntime";
import { listEpochAiModels } from "../lib/epoch/aiRuntime";

describe("AI Execution Runtime", () => {
  it("routes by capability, privacy, cost, latency, reliability, and queue depth", () => {
    const endpoints = discoverEpochAiExecutionEndpoints(listEpochAiModels(), [
      {
        id: "gpu-4090:llama-vision",
        kind: "local_gpu",
        provider: "ollama",
        model: "llama-vision",
        capabilities: ["vision", "tools", "structured_output"],
        privacy: "private",
        region: "local",
        costPer1kTokens: 0,
        latencyMs: 250,
        reliability: 0.96,
        queueDepth: 0,
        available: true,
      },
      {
        id: "cloud:cheap-text",
        kind: "provider",
        provider: "openrouter",
        model: "cheap-text",
        capabilities: ["structured_output"],
        privacy: "tenant",
        costPer1kTokens: 0,
        latencyMs: 700,
        reliability: 0.99,
        queueDepth: 0,
        available: true,
      },
    ]);
    const route = routeEpochAiExecution({
      endpoints,
      policy: { requiredCapabilities: ["vision"], allowedPrivacy: ["private"], minimumReliability: 0.9, allowFallback: true },
    });
    expect(route.selected.id).toBe("gpu-4090:llama-vision");
    expect(route.fallback).toHaveLength(0);
    expect(route.considered.find((item) => item.endpointId === "cloud:cheap-text")?.reasons).toEqual(expect.arrayContaining(["privacy_not_allowed", "capability_missing"]));
  });

  it("fails closed when policy has no eligible execution environment", () => {
    expect(() => routeEpochAiExecution({ endpoints: discoverEpochAiExecutionEndpoints(listEpochAiModels()), policy: { requiredCapabilities: ["audio"], allowedPrivacy: ["private"] } })).toThrow("epoch_ai_execution_no_eligible_endpoint");
  });

  it("reports degraded and offline environments and creates a safe rebalance plan", () => {
    const endpoints = [
      { id: "healthy", kind: "local_gpu" as const, provider: "ollama" as const, model: "a", capabilities: [], privacy: "private" as const, costPer1kTokens: 0, latencyMs: 100, reliability: 0.95, queueDepth: 0, available: true },
      { id: "busy", kind: "provider" as const, provider: "openrouter" as const, model: "b", capabilities: [], privacy: "tenant" as const, costPer1kTokens: 0.1, latencyMs: 500, reliability: 0.65, queueDepth: 12, available: true },
      { id: "offline", kind: "edge" as const, provider: "private" as const, model: "c", capabilities: [], privacy: "private" as const, costPer1kTokens: 0, latencyMs: 0, reliability: 0, queueDepth: 0, available: false },
    ];
    expect(buildEpochAiExecutionHealth(endpoints).map((item) => item.status)).toEqual(["healthy", "degraded", "offline"]);
    expect(buildEpochAiRebalancePlan(endpoints).find((item) => item.endpointId === "busy")?.action).toBe("scale");
    expect(buildEpochAiRebalancePlan(endpoints).find((item) => item.endpointId === "offline")?.action).toBe("drain");
  });
});
