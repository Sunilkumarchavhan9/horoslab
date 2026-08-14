import { describe, expect, it } from "vitest";
import {
  ActionV1Schema,
  AutomationV1Schema,
  ConnectionV1Schema,
  EnvironmentV1Schema,
  EPOCH_V13_CONTRACT_VERSION,
  MissionControlStateV1Schema,
  ProjectV1Schema,
  RuntimeEventV1Schema,
  UnknownV1Schema,
  WorldStateV1Schema,
  WorkerProtocolV1Schema,
} from "../lib/epoch/v13/contracts";
import {
  toConnectionV1,
  toEnvironmentV1,
  toMissionControlStateV1,
  toOrganizationV1,
  toProjectV1,
  toWorldStateV1,
} from "../lib/epoch/v13/controlPlane";

const metadata = {
  contractVersion: EPOCH_V13_CONTRACT_VERSION,
  id: "unknown-1",
  workspaceId: "workspace-1",
  createdAt: "2026-08-08T00:00:00.000Z",
  updatedAt: "2026-08-08T00:00:00.000Z",
  correlation: { correlationId: "corr-1", traceId: "trace-1" },
};

describe("Epoch final-plan V13 contracts", () => {
  it("freezes the Phase 1 control-plane shape", () => {
    const now = "2026-08-08T00:00:00.000Z";
    const common = {
      contractVersion: EPOCH_V13_CONTRACT_VERSION,
      id: "project-1",
      createdAt: now,
      updatedAt: now,
      correlation: { correlationId: "corr-1", traceId: "trace-1" },
    };

    expect(ProjectV1Schema.parse({
      ...common,
      orgId: "org-1",
      workspaceId: "workspace-1",
      name: "Software project",
      status: "active",
    }).workspaceId).toBe("workspace-1");

    expect(EnvironmentV1Schema.parse({
      ...common,
      id: "environment-1",
      projectId: "project-1",
      kind: "software",
      name: "Local software",
      status: "connected",
    }).kind).toBe("software");

    expect(ConnectionV1Schema.parse({
      ...common,
      id: "connection-1",
      environmentId: "environment-1",
      provider: "github",
      status: "connected",
      scopes: ["repository.read"],
      capabilities: ["repository.read"],
    }).provider).toBe("github");

    expect(MissionControlStateV1Schema.parse({
      ...common,
      id: "control-1",
      projectId: "project-1",
      environmentIds: ["environment-1"],
      activeMissionCount: 0,
      runningExecutionCount: 0,
      pendingApprovalCount: 0,
      workerCount: 1,
      evidenceCount: 0,
      verificationCount: 0,
    }).workerCount).toBe(1);
  });

  it("versions discovery, automation, and worker protocol objects", () => {
    expect(UnknownV1Schema.parse({
      ...metadata,
      title: "Why is the API slow?",
      question: "Find the cause of elevated p95 latency.",
      environment: "software",
      risk: "medium",
      status: "open",
      metadata: {},
    }).contractVersion).toBe(EPOCH_V13_CONTRACT_VERSION);

    expect(AutomationV1Schema.parse({
      ...metadata,
      name: "Sandbox investigation",
      trigger: { type: "unknown.created" },
      level: "A2",
      status: "active",
      policyId: "policy-1",
      actionIds: [],
      verificationRequired: true,
      budgetCents: 0,
    }).level).toBe("A2");

    expect(WorkerProtocolV1Schema.parse({
      protocolVersion: "epoch.worker.v1",
      workerId: "worker-1",
      missionId: "mission-1",
      environment: "simulation",
      capabilities: ["observe", "verify"],
      maxConcurrency: 1,
    }).environment).toBe("simulation");
  });

  it("requires policy linkage for actions and correlation on events", () => {
    expect(() => ActionV1Schema.parse({
      ...metadata,
      environment: "software",
      name: "run_tests",
      status: "proposed",
      parameters: {},
      policyId: "policy-1",
    })).toThrow();

    expect(RuntimeEventV1Schema.parse({
      contractVersion: EPOCH_V13_CONTRACT_VERSION,
      id: "event-1",
      type: "unknown.created",
      occurredAt: "2026-08-08T00:00:00.000Z",
      subjectType: "unknown",
      subjectId: "unknown-1",
      correlation: { correlationId: "corr-1", traceId: "trace-1" },
      payload: {},
    }).subjectType).toBe("unknown");
  });

  it("adapts existing workspace records without creating another store", () => {
    const common = {
      id: "workspace-1",
      createdAt: new Date("2026-08-08T00:00:00.000Z"),
      updatedAt: new Date("2026-08-08T00:00:00.000Z"),
      correlation: { correlationId: "corr-1", traceId: "trace-1" },
    };

    expect(toOrganizationV1({ ...common, orgId: "org-1", name: "Example Org" }).orgId).toBe("org-1");
    expect(toProjectV1({
      ...common,
      orgId: "org-1",
      workspaceId: "workspace-1",
      name: "Example Workspace",
    }).workspaceId).toBe("workspace-1");
    expect(toEnvironmentV1({
      ...common,
      id: "environment-1",
      projectId: "workspace-1",
      kind: "software",
      name: "Software",
      status: "connected",
    }).kind).toBe("software");
    expect(toConnectionV1({
      ...common,
      id: "connection-1",
      environmentId: "environment-1",
      provider: "github",
      status: "connected",
      scopes: ["repository.read"],
      capabilities: ["pull_requests"],
    }).provider).toBe("github");
    expect(toMissionControlStateV1({
      ...common,
      id: "control-1",
      projectId: "workspace-1",
      activeMissionCount: 1,
      runningExecutionCount: 1,
      pendingApprovalCount: 0,
      workerCount: 1,
      evidenceCount: 2,
      verificationCount: 1,
    }).evidenceCount).toBe(2);
  });

  it("versions a persisted software world state with its source evidence", () => {
    const worldState = toWorldStateV1({
      id: "world-state-1",
      workspaceId: "workspace-1",
      environment: "software",
      version: 2,
      snapshot: {
        adapter: "github",
        repository: "owner/repository",
        defaultBranch: "main",
        root: [{ name: "README.md", type: "file" }],
      },
      sourceIds: ["connection-1"],
      freshness: "fresh",
      observedAt: new Date("2026-08-08T00:00:00.000Z"),
      createdAt: new Date("2026-08-08T00:00:00.000Z"),
      updatedAt: new Date("2026-08-08T00:00:00.000Z"),
      correlation: { correlationId: "corr-world-1", traceId: "trace-world-1" },
    });

    expect(WorldStateV1Schema.parse(worldState)).toMatchObject({
      environment: "software",
      version: 2,
      sourceIds: ["connection-1"],
      freshness: "fresh",
    });
  });
});
