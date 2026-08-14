import { describe, expect, it } from "vitest";
import {
  compileOperationalMap,
  operationalMapToGraphStore,
  resolveMapCompilerMode,
} from "../lib/companyBrain/operationalMapCompiler";
import type { Memory } from "../lib/memory/types";

function memory(partial: Partial<Memory> & Pick<Memory, "id" | "contractCategory" | "summary">): Memory {
  const now = "2026-05-29T12:00:00.000Z";
  return {
    userId: "u_test",
    type: "episodic",
    content: partial.content ?? partial.summary,
    importanceScore: 0.8,
    confidence: 0.9,
    source: "chat",
    status: "active",
    createdAt: now,
    updatedAt: now,
    evidenceCount: 1,
    contractVersion: "memoryos.contract.v1",
    ...partial,
  };
}

describe("operationalMapCompiler", () => {
  it("builds contract-category nodes with source memory ids", () => {
    const memories = [
      memory({
        id: "m_decision",
        contractCategory: "decision",
        summary: "Ship billing refactor behind feature flag",
        content: "Approved rollout plan for billing service.",
      }),
      memory({
        id: "m_runbook",
        contractCategory: "runbook",
        summary: "Rollback billing deploy",
        content: "Steps to revert billing deployment.",
      }),
      memory({
        id: "m_incident",
        contractCategory: "incident",
        summary: "Checkout outage",
        content: "Payment API degraded for EU tenants.",
      }),
      memory({
        id: "m_blocker",
        contractCategory: "blocker",
        summary: "Schema migration blocked",
        content: "Waiting on DBA approval.",
      }),
    ];

    const map = compileOperationalMap({ memories });
    const types = map.nodes.map((node) => node.type);

    expect(types).toContain("Decision");
    expect(types).toContain("Runbook");
    expect(types).toContain("Incident");
    expect(types).toContain("Blocker");
    expect(map.nodes.find((node) => node.type === "Decision")?.sourceMemoryIds).toEqual(["m_decision"]);
    expect(map.edges.some((edge) => edge.relation === "documents")).toBe(true);
    expect(map.edges.some((edge) => edge.relation === "blocks")).toBe(true);
  });

  it("detects GitHub PR and Issue nodes from ingest content", () => {
    const memories = [
      memory({
        id: "m_pr",
        contractCategory: "decision",
        summary: "Merge auth middleware",
        content:
          "GitHub PR Add auth middleware: uses JWT validation.\nMerged at: 2026-05-28T10:00:00Z\nacme/platform #42",
      }),
      memory({
        id: "m_issue",
        contractCategory: "bug",
        summary: "Fix flaky webhook",
        content: "GitHub Issue Webhook retries fail under load.\nClosed at: 2026-05-27T08:00:00Z\nacme/platform #17",
      }),
    ];

    const map = compileOperationalMap({ memories });
    expect(map.nodes.some((node) => node.type === "PR")).toBe(true);
    expect(map.nodes.some((node) => node.type === "Issue")).toBe(true);
    expect(map.nodes.some((node) => node.type === "Repository")).toBe(true);
  });

  it("maps operational map into graph store node types", () => {
    const memories = [
      memory({
        id: "m_policy",
        contractCategory: "policy",
        summary: "Refund cap policy",
        content: "Refunds above $500 require manager approval.",
      }),
      memory({
        id: "m_risk",
        contractCategory: "risky_file",
        summary: "Risky migration script",
        content: "db/migrations/2026_reset.sql touches production ledger.",
      }),
    ];

    const graph = operationalMapToGraphStore(compileOperationalMap({ memories }), memories);
    expect(graph.nodes.some((node) => node.type === "policy")).toBe(true);
    expect(graph.nodes.some((node) => node.type === "risk")).toBe(true);
    expect(graph.nodes.every((node) => node.evidenceMemoryIds.length > 0)).toBe(true);
  });

  it("defaults to contract compiler in development", () => {
    const previousCompiler = process.env.COMPANY_BRAIN_MAP_COMPILER;
    const previousNodeEnv = process.env.NODE_ENV;
    delete process.env.COMPANY_BRAIN_MAP_COMPILER;
    process.env.NODE_ENV = "development";
    expect(resolveMapCompilerMode()).toBe("contract");
    process.env.COMPANY_BRAIN_MAP_COMPILER = "legacy";
    expect(resolveMapCompilerMode()).toBe("legacy");
    if (previousCompiler === undefined) {
      delete process.env.COMPANY_BRAIN_MAP_COMPILER;
    } else {
      process.env.COMPANY_BRAIN_MAP_COMPILER = previousCompiler;
    }
    process.env.NODE_ENV = previousNodeEnv;
  });
});
