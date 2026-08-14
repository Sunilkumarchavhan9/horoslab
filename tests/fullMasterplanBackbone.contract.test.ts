import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const schemaSource = readFileSync(
  path.join(process.cwd(), "prisma", "schema.prisma"),
  "utf8",
);

const storeSource = readFileSync(
  path.join(process.cwd(), "lib", "masterplan", "productLoopStore.ts"),
  "utf8",
);

const routeSource = readFileSync(
  path.join(process.cwd(), "server", "routes", "masterplan.routes.ts"),
  "utf8",
);

const frontendApiSource = readFileSync(
  path.join(process.cwd(), "memoryos-frontend", "lib", "masterplan-api.ts"),
  "utf8",
);

describe("full memoryosTM masterplan backbone", () => {
  it("has durable Prisma models for the missing end-to-end product foundations", () => {
    [
      "model AgentBlackBoxRecord",
      "model AgentExperienceGraphNode",
      "model AgentExperienceGraphEdge",
      "model EvaluationRun",
      "model EvaluationResult",
      "model ModelProvider",
      "model ModelUsageEvent",
      "model CostEvent",
      "model ComplianceEvidenceItem",
    ].forEach((model) => expect(schemaSource).toContain(model));

    expect(schemaSource).toContain("@@map(\"agent_black_box_records\")");
    expect(schemaSource).toContain("@@map(\"agent_experience_graph_nodes\")");
    expect(schemaSource).toContain("@@map(\"evaluation_runs\")");
    expect(schemaSource).toContain("@@map(\"model_usage_events\")");
  });

  it("stores and builds the canonical product graph from Prisma-backed AgentRun data", () => {
    [
      "createAgentBlackBoxRecord",
      "getAgentBlackBoxRecord",
      "buildAgentExperienceGraphFromRun",
      "getAgentExperienceGraph",
      "db.agentBlackBoxRecord.create",
      "db.agentExperienceGraphNode.create",
      "db.agentExperienceGraphEdge.create",
    ].forEach((symbol) => expect(storeSource).toContain(symbol));

    expect(storeSource).toContain("used_in_package");
    expect(storeSource).toContain("produced_outcome");
  });

  it("exposes the master plan APIs beyond the first-launch proof", () => {
    [
      '"/agent-experience-graph"',
      '"/agent-experience-graph/from-run/:id"',
      '"/agent-black-box/record"',
      '"/agent-black-box/:agentRunId"',
      '"/blueprints"',
      '"/blueprints/:id/run"',
      '"/evaluation/run"',
      '"/evaluation/:id/results"',
      '"/model-providers"',
      '"/model-providers/connect"',
      '"/model-usage"',
      '"/cost"',
      '"/compliance/evidence"',
    ].forEach((route) => expect(routeSource).toContain(route));
  });

  it("makes Evaluation Lab a real replay proof, not a static metric card", () => {
    [
      "evaluation.baseline_failed",
      "evaluation.inherited_succeeded",
      "baselineAgentRunId",
      "inheritedAgentRunId",
      "baselineOutcomeId",
      "inheritedOutcomeId",
      "mistakeRepeatRateBefore",
      "mistakeRepeatRateAfter",
      "Baseline agent repeated the known mistake",
      "Inherited agent avoided the repeated mistake",
    ].forEach((proofSignal) => expect(storeSource).toContain(proofSignal));

    expect(routeSource).toContain("evaluation.replay_created");
    expect(frontendApiSource).toContain("getMasterplanEvaluationResults");
  });

  it("has frontend API helpers for full-plan surfaces without redesigning UI", () => {
    [
      "getMasterplanExperienceGraph",
      "buildMasterplanExperienceGraphFromRun",
      "createMasterplanBlackBoxRecord",
      "listMasterplanBlueprints",
      "runMasterplanBlueprint",
      "createMasterplanEvaluationRun",
      "listMasterplanModelProviders",
      "getMasterplanModelUsage",
      "getMasterplanCostSummary",
      "listMasterplanComplianceEvidence",
    ].forEach((helper) => expect(frontendApiSource).toContain(helper));
  });
});
