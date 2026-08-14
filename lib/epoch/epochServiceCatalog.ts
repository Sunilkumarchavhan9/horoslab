import { prisma } from "../storage/prismaClient";

export type EpochServiceId =
  | "institution-service"
  | "mission-service"
  | "authority-service"
  | "execution-service"
  | "verification-service"
  | "evidence-service"
  | "certificate-service"
  | "memory-service"
  | "integration-service"
  | "developer-service";

export type EpochServiceStatus = "present" | "partial" | "planned";

export type EpochServiceCatalogEntry = {
  id: EpochServiceId;
  name: string;
  status: EpochServiceStatus;
  routePrefixes: string[];
  models: string[];
  metrics: Record<string, number>;
  summary: string;
  remainingWork: string[];
};

export type EpochServiceCatalog = {
  version: "epoch_service_catalog.v1";
  workspaceId: string;
  generatedAt: string;
  services: EpochServiceCatalogEntry[];
  remaining: string[];
};

type WorkspaceEpochCounts = {
  institutions: number;
  templates: number;
  institutionVersions: number;
  missions: number;
  missionDraft: number;
  missionRunning: number;
  missionWaitingReview: number;
  missionCompleted: number;
  missionFailed: number;
  authorityPolicies: number;
  authorityBlocked: number;
  authorityNeedsApproval: number;
  authorityCanExecute: number;
  executions: number;
  executionRunning: number;
  executionCompleted: number;
  executionFailed: number;
  evidence: number;
  verifications: number;
  verificationPass: number;
  verificationFail: number;
  verificationReview: number;
  certificates: number;
  memories: number;
  integrations: number;
  mcpConnections: number;
  webhookEndpoints: number;
  webhookDeliveries: number;
  apiKeys: number;
};

async function countWorkspaceEpochData(workspaceId: string): Promise<WorkspaceEpochCounts> {
  const [
    institutions,
    templates,
    institutionVersions,
    missions,
    missionDraft,
    missionRunning,
    missionWaitingReview,
    missionCompleted,
    missionFailed,
    authorityPolicies,
    authorityBlocked,
    authorityNeedsApproval,
    authorityCanExecute,
    executions,
    executionRunning,
    executionCompleted,
    executionFailed,
    evidence,
    verifications,
    verificationPass,
    verificationFail,
    verificationReview,
    certificates,
    memories,
    integrations,
    mcpConnections,
    webhookEndpoints,
    webhookDeliveries,
    apiKeys,
  ] = await Promise.all([
    prisma.epochInstitution.count({ where: { workspaceId } }),
    prisma.epochInstitutionTemplate.count({ where: { workspaceId } }),
    prisma.epochInstitutionVersion.count({ where: { workspaceId } }),
    prisma.epochMission.count({ where: { workspaceId } }),
    prisma.epochMission.count({ where: { workspaceId, state: "draft" } }),
    prisma.epochMission.count({ where: { workspaceId, state: "running" } }),
    prisma.epochMission.count({ where: { workspaceId, state: "waiting_review" } }),
    prisma.epochMission.count({ where: { workspaceId, state: "completed" } }),
    prisma.epochMission.count({ where: { workspaceId, state: "failed" } }),
    prisma.epochAuthorityPolicy.count({ where: { workspaceId } }),
    prisma.epochAuthorityPolicy.count({ where: { workspaceId, blocked: true } }),
    prisma.epochAuthorityPolicy.count({ where: { workspaceId, needsApproval: true } }),
    prisma.epochAuthorityPolicy.count({ where: { workspaceId, canExecute: true } }),
    prisma.epochExecutionRun.count({ where: { workspaceId } }),
    prisma.epochExecutionRun.count({ where: { workspaceId, status: "running" } }),
    prisma.epochExecutionRun.count({ where: { workspaceId, status: "completed" } }),
    prisma.epochExecutionRun.count({ where: { workspaceId, status: "failed" } }),
    prisma.epochEvidence.count({ where: { workspaceId } }),
    prisma.epochVerificationRun.count({ where: { workspaceId } }),
    prisma.epochVerificationRun.count({ where: { workspaceId, finalDecision: "PASS" } }),
    prisma.epochVerificationRun.count({ where: { workspaceId, finalDecision: "FAIL" } }),
    prisma.epochVerificationRun.count({ where: { workspaceId, finalDecision: "REVIEW" } }),
    prisma.epochCertificate.count({ where: { workspaceId } }),
    prisma.epochMemoryRecord.count({ where: { workspaceId } }),
    prisma.epochIntegrationConnection.count({ where: { workspaceId } }),
    prisma.mCPConnection.count({ where: { workspaceId } }),
    prisma.webhookEndpoint.count({ where: { workspaceId } }),
    prisma.webhookDelivery.count({ where: { workspaceId } }),
    prisma.agentAccessKey.count({ where: { workspaceId } }),
  ]);

  return {
    institutions,
    templates,
    institutionVersions,
    missions,
    missionDraft,
    missionRunning,
    missionWaitingReview,
    missionCompleted,
    missionFailed,
    authorityPolicies,
    authorityBlocked,
    authorityNeedsApproval,
    authorityCanExecute,
    executions,
    executionRunning,
    executionCompleted,
    executionFailed,
    evidence,
    verifications,
    verificationPass,
    verificationFail,
    verificationReview,
    certificates,
    memories,
    integrations,
    mcpConnections,
    webhookEndpoints,
    webhookDeliveries,
    apiKeys,
  };
}

function buildCatalogEntries(counts: WorkspaceEpochCounts): EpochServiceCatalogEntry[] {
  return [
    {
      id: "institution-service",
      name: "Institution Service",
      status: "present",
      routePrefixes: ["/api/epoch/workspaces/:workspaceId/institutions", "/api/epoch/workspaces/:workspaceId/mission-control"],
      models: ["EpochInstitution", "EpochInstitutionTemplate", "EpochInstitutionVersion"],
      metrics: {
        institutions: counts.institutions,
        templates: counts.templates,
        institutionVersions: counts.institutionVersions,
      },
      summary: "Owns institution, template, and version records.",
      remainingWork: [
        "Split institution storage into a dedicated service module boundary.",
        "Add template versioning hooks for template evolution.",
      ],
    },
    {
      id: "mission-service",
      name: "Mission Service",
      status: "present",
      routePrefixes: ["/api/epoch/workspaces/:workspaceId/missions", "/api/epoch/workspaces/:workspaceId/mission-control"],
      models: ["EpochMission"],
      metrics: {
        missions: counts.missions,
        draft: counts.missionDraft,
        running: counts.missionRunning,
        waitingReview: counts.missionWaitingReview,
        completed: counts.missionCompleted,
        failed: counts.missionFailed,
      },
      summary: "Tracks mission state, plan, timeline, and lifecycle.",
      remainingWork: [
        "Move mission lifecycle transitions into a dedicated state machine boundary.",
        "Add first-class mission timeline event exports.",
      ],
    },
    {
      id: "authority-service",
      name: "Authority Service",
      status: "present",
      routePrefixes: ["/api/epoch/workspaces/:workspaceId/authority", "/api/epoch/workspaces/:workspaceId/policies"],
      models: ["EpochAuthorityPolicy"],
      metrics: {
        policies: counts.authorityPolicies,
        blocked: counts.authorityBlocked,
        needsApproval: counts.authorityNeedsApproval,
        canExecute: counts.authorityCanExecute,
      },
      summary: "Evaluates permissions, budgets, approvals, and checks.",
      remainingWork: [
        "Promote policy evaluation into a standalone policy engine service.",
        "Add policy explainability output for blocked and review-required missions.",
      ],
    },
    {
      id: "execution-service",
      name: "Execution Service",
      status: "present",
      routePrefixes: ["/api/epoch/workspaces/:workspaceId/execution", "/api/epoch/workspaces/:workspaceId/missions/:missionId/run"],
      models: ["EpochExecutionRun"],
      metrics: {
        executions: counts.executions,
        running: counts.executionRunning,
        completed: counts.executionCompleted,
        failed: counts.executionFailed,
      },
      summary: "Runs planner, executor, reviewer, and human-review tracking.",
      remainingWork: [
        "Extract planner/executor/reviewer into worker modules.",
        "Add retry queues and durable step-level execution checkpoints.",
      ],
    },
    {
      id: "verification-service",
      name: "Verification Service",
      status: "present",
      routePrefixes: ["/api/epoch/workspaces/:workspaceId/verification", "/api/epoch/workspaces/:workspaceId/missions/:missionId/verify"],
      models: ["EpochVerificationRun"],
      metrics: {
        verifications: counts.verifications,
        pass: counts.verificationPass,
        fail: counts.verificationFail,
        review: counts.verificationReview,
      },
      summary: "Checks evidence, policy, and final decision output.",
      remainingWork: [
        "Add pluggable verification checkers for domain-specific policies.",
        "Store richer verification explanations and diffable decision traces.",
      ],
    },
    {
      id: "evidence-service",
      name: "Evidence Service",
      status: "present",
      routePrefixes: ["/api/epoch/workspaces/:workspaceId/evidence", "/api/epoch/workspaces/:workspaceId/artifacts"],
      models: ["EpochEvidence"],
      metrics: {
        evidence: counts.evidence,
      },
      summary: "Stores URLs, files, screenshots, documents, and response proofs.",
      remainingWork: [
        "Add normalized proof adapters for screenshots and GitHub artifacts.",
        "Add object-storage lifecycle management and retention policies.",
      ],
    },
    {
      id: "certificate-service",
      name: "Certificate Service",
      status: "present",
      routePrefixes: ["/api/epoch/workspaces/:workspaceId/certificates"],
      models: ["EpochCertificate"],
      metrics: {
        certificates: counts.certificates,
      },
      summary: "Issues mission certificates and audit trails.",
      remainingWork: [
        "Add certificate export formats and signing hooks.",
        "Expose certificate provenance summaries for external consumers.",
      ],
    },
    {
      id: "memory-service",
      name: "Memory Service",
      status: "present",
      routePrefixes: ["/api/epoch/workspaces/:workspaceId/memory"],
      models: ["EpochMemoryRecord"],
      metrics: {
        memories: counts.memories,
      },
      summary: "Stores mission history, lessons, mistakes, and improvements.",
      remainingWork: [
        "Add memory promotion rules into future institution versions.",
        "Expose lesson and mistake search indexes for discovery.",
      ],
    },
    {
      id: "integration-service",
      name: "Integration Service",
      status: "present",
      routePrefixes: ["/api/epoch/workspaces/:workspaceId/integrations", "/api/connector", "/api/mcp"],
      models: ["EpochIntegrationConnection", "MCPConnection", "WebhookEndpoint", "WebhookDelivery"],
      metrics: {
        integrations: counts.integrations,
        mcpConnections: counts.mcpConnections,
        webhookEndpoints: counts.webhookEndpoints,
        webhookDeliveries: counts.webhookDeliveries,
      },
      summary: "Tracks external connectors and delivery surfaces.",
      remainingWork: [
        "Add first-party connectors for GitHub, Slack, Linear, CRM, browser, OpenAI, and Anthropic.",
        "Add sync status rollups for each integration provider.",
      ],
    },
    {
      id: "developer-service",
      name: "Developer Service",
      status: "present",
      routePrefixes: ["/api/epoch/workspaces/:workspaceId/developer", "/api/agent-access", "/api/mcp", "/api/v1/mcp"],
      models: ["AgentAccessKey", "MCPConnection", "WebhookEndpoint", "WebhookDelivery"],
      metrics: {
        apiKeys: counts.apiKeys,
        mcpConnections: counts.mcpConnections,
        webhookEndpoints: counts.webhookEndpoints,
      },
      summary: "Handles API keys, MCP server access, SDK surface, and webhooks.",
      remainingWork: [
        "Add developer-facing SDK and MCP contract docs to the service API.",
        "Split package publishing metadata from runtime developer controls.",
      ],
    },
  ];
}

export async function buildEpochServiceCatalog(workspaceId: string): Promise<EpochServiceCatalog> {
  const counts = await countWorkspaceEpochData(workspaceId);
  return {
    version: "epoch_service_catalog.v1",
    workspaceId,
    generatedAt: new Date().toISOString(),
    services: buildCatalogEntries(counts),
    remaining: [
      "Extract the shared Epoch store into dedicated service modules.",
      "Split execution and verification into separate workers and queues.",
      "Add richer adapter coverage for GitHub, Slack, Linear, CRM, browser, OpenAI, and Anthropic.",
      "Add service-level ownership, permissions, and budget enforcement boundaries.",
      "Add end-to-end contract tests for each service boundary.",
    ],
  };
}

export function getEpochServiceCatalogEntry(catalog: EpochServiceCatalog, serviceId: EpochServiceId): EpochServiceCatalogEntry | null {
  return catalog.services.find((service) => service.id === serviceId) ?? null;
}
