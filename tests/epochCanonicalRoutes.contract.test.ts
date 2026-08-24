import { describe, expect, it } from "vitest";
import { epochCanonicalRouter } from "../server/routes/epoch-canonical.routes";

describe("Epoch canonical API boundary", () => {
  it("exports the authenticated Composer router", () => {
    expect(typeof epochCanonicalRouter).toBe("function");
    const layers = (epochCanonicalRouter as unknown as { stack?: Array<{ route?: { path?: string; methods?: Record<string, boolean> } }> }).stack ?? [];
    expect(layers.filter((layer) => layer.route?.methods?.post).map((layer) => layer.route?.path)).toEqual([
      "/composer/compile",
      "/composer/compile-and-create",
      "/candidates/compose",
      "/candidates/compose-and-persist",
      "/experiments",
      "/benchmarks",
      "/decisions",
      "/models",
      "/workloads",
      "/reality/entities",
      "/environments",
      "/observations",
      "/world-states",
      "/unknowns",
      "/hypotheses",
      "/capabilities",
      "/executions/prepare",
      "/executions/:executionId/transition",
      "/executions/:executionId/run-runtime",
      "/evidence",
      "/verifications",
      "/experiences",
      "/teaching/lessons",
      "/teaching/datasets",
      "/teaching/records",
      "/adapters/huggingface/inspect",
      "/adapters/opentelemetry/ingest",
      "/adapters/runtime-capabilities",
      "/evolution/model-revisions",
      "/evolution/skill-revisions",
      "/evolution/agent-policy-revisions",
      "/evolution/world-models",
      "/events",
      "/events/:eventId/claim",
    ]);
    expect(layers.filter((layer) => layer.route?.methods?.get).map((layer) => layer.route?.path)).toEqual([
      "/models",
      "/workloads",
      "/adapters",
      "/events",
      "/artifacts",
      "/artifacts/:workspaceId/:objectType/:objectId",
    ]);
  });
});
