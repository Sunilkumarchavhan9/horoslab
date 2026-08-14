import {
  ConnectionV1Schema,
  EnvironmentV1Schema,
  MissionControlStateV1Schema,
  OrganizationV1Schema,
  ProjectV1Schema,
  WorldStateV1Schema,
  type ConnectionV1,
  type EnvironmentV1,
  type MissionControlStateV1,
  type OrganizationV1,
  type ProjectV1,
  type WorldStateV1,
} from "./contracts";

type TimestampInput = Date | string;

type CorrelationInput = {
  correlationId: string;
  traceId: string;
  causationId?: string;
};

type ControlIdentityInput = {
  id: string;
  createdAt: TimestampInput;
  updatedAt: TimestampInput;
  correlation: CorrelationInput;
};

type WorkspaceProjectInput = ControlIdentityInput & {
  orgId: string;
  workspaceId: string;
  name: string;
  status?: "active" | "archived";
};

export type ProjectRecordInput = Omit<WorkspaceProjectInput, "correlation" | "status"> & { status: string };

type WorkspaceOrganizationInput = ControlIdentityInput & {
  orgId: string;
  name: string;
  status?: "active" | "suspended" | "archived";
};

type EnvironmentInput = ControlIdentityInput & {
  projectId: string;
  kind: EnvironmentV1["kind"];
  name: string;
  status: EnvironmentV1["status"];
  region?: string;
};

type IntegrationInput = ControlIdentityInput & {
  environmentId: string;
  provider: string;
  status: ConnectionV1["status"];
  scopes?: string[];
  capabilities?: string[];
};

type MissionControlInput = ControlIdentityInput & {
  projectId?: string;
  environmentIds?: string[];
  activeMissionCount: number;
  runningExecutionCount: number;
  pendingApprovalCount: number;
  workerCount: number;
  evidenceCount: number;
  verificationCount: number;
};

function iso(value: TimestampInput): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function identity(input: ControlIdentityInput) {
  return {
    contractVersion: "epoch.runtime.v13" as const,
    id: input.id,
    createdAt: iso(input.createdAt),
    updatedAt: iso(input.updatedAt),
    correlation: input.correlation,
  };
}

export function toOrganizationV1(input: WorkspaceOrganizationInput): OrganizationV1 {
  return OrganizationV1Schema.parse({
    ...identity(input),
    orgId: input.orgId,
    name: input.name,
    status: input.status ?? "active",
  });
}

export function toProjectV1(input: WorkspaceProjectInput): ProjectV1 {
  return ProjectV1Schema.parse({
    ...identity(input),
    orgId: input.orgId,
    workspaceId: input.workspaceId,
    name: input.name,
    status: input.status ?? "active",
  });
}

export function toEnvironmentV1(input: EnvironmentInput): EnvironmentV1 {
  return EnvironmentV1Schema.parse({
    ...identity(input),
    projectId: input.projectId,
    kind: input.kind,
    name: input.name,
    status: input.status,
    ...(input.region ? { region: input.region } : {}),
  });
}

export function toConnectionV1(input: IntegrationInput): ConnectionV1 {
  return ConnectionV1Schema.parse({
    ...identity(input),
    environmentId: input.environmentId,
    provider: input.provider,
    status: input.status,
    scopes: input.scopes ?? [],
    capabilities: input.capabilities ?? [],
  });
}

export function toMissionControlStateV1(input: MissionControlInput): MissionControlStateV1 {
  return MissionControlStateV1Schema.parse({
    ...identity(input),
    ...(input.projectId ? { projectId: input.projectId } : {}),
    environmentIds: input.environmentIds ?? [],
    activeMissionCount: input.activeMissionCount,
    runningExecutionCount: input.runningExecutionCount,
    pendingApprovalCount: input.pendingApprovalCount,
    workerCount: input.workerCount,
    evidenceCount: input.evidenceCount,
    verificationCount: input.verificationCount,
  });
}

export function toWorldStateV1(input: {
  id: string;
  workspaceId: string;
  environment: WorldStateV1["environment"];
  version: number;
  snapshot: Record<string, unknown>;
  sourceIds: string[];
  freshness: WorldStateV1["freshness"];
  observedAt?: TimestampInput;
  createdAt: TimestampInput;
  updatedAt: TimestampInput;
  correlation: CorrelationInput;
}): WorldStateV1 {
  return WorldStateV1Schema.parse({
    ...identity({ ...input, createdAt: input.createdAt, updatedAt: input.updatedAt, correlation: input.correlation }),
    workspaceId: input.workspaceId,
    environment: input.environment,
    version: input.version,
    snapshot: input.snapshot,
    sourceIds: input.sourceIds,
    freshness: input.freshness,
  });
}
