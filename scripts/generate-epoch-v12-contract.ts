import { mkdir, writeFile } from "node:fs/promises";
import { EPOCH_V12_CONTRACT_NAMES, EPOCH_V12_CONTRACT_VERSION } from "../lib/epoch/v12/contracts";

const output = {
  openapi: "3.1.0",
  info: {
    title: "Epoch Runtime V12 Contracts",
    version: EPOCH_V12_CONTRACT_VERSION,
    description: "Generated contract index for the Epoch V12 adapter boundary.",
  },
  paths: {
    "/api/epoch/workspaces/{workspaceId}/missions": {
      get: { operationId: "listMissions", tags: ["missions"], parameters: [{ "$ref": "#/components/parameters/WorkspaceId" }], responses: { "200": { description: "Workspace missions" } } },
      post: { operationId: "createMission", tags: ["missions"], parameters: [{ "$ref": "#/components/parameters/WorkspaceId" }], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/MissionCreate" } } } }, responses: { "201": { description: "Mission created" } } },
    },
    "/api/epoch/workspaces/{workspaceId}/missions/{missionId}/run": {
      post: { operationId: "runMission", tags: ["missions"], parameters: [{ "$ref": "#/components/parameters/WorkspaceId" }, { "$ref": "#/components/parameters/MissionId" }], responses: { "200": { description: "Mission execution started" } } },
    },
    "/api/epoch/workspaces/{workspaceId}/missions/{missionId}/verify": {
      post: { operationId: "verifyMission", tags: ["verification"], parameters: [{ "$ref": "#/components/parameters/WorkspaceId" }, { "$ref": "#/components/parameters/MissionId" }], responses: { "200": { description: "Verification result" } } },
    },
    "/api/epoch/workspaces/{workspaceId}/missions/{missionId}/evidence-bundle": {
      get: { operationId: "getEvidenceBundle", tags: ["evidence"], parameters: [{ "$ref": "#/components/parameters/WorkspaceId" }, { "$ref": "#/components/parameters/MissionId" }], responses: { "200": { description: "Deterministic evidence bundle" } } },
    },
    "/api/epoch/workspaces/{workspaceId}/workers": {
      get: { operationId: "listWorkers", tags: ["workers"], parameters: [{ "$ref": "#/components/parameters/WorkspaceId" }], responses: { "200": { description: "Workspace workers" } } },
      post: { operationId: "registerWorker", tags: ["workers"], parameters: [{ "$ref": "#/components/parameters/WorkspaceId" }], responses: { "201": { description: "Worker registered" } } },
    },
    "/api/epoch/workspaces/{workspaceId}/queue/lease": {
      post: { operationId: "leaseWorkerJobs", tags: ["workers"], parameters: [{ "$ref": "#/components/parameters/WorkspaceId" }], responses: { "200": { description: "Fenced worker lease" } } },
    },
    "/api/epoch/workspaces/{workspaceId}/events": {
      get: {
        operationId: "listRuntimeEvents",
        tags: ["events"],
        parameters: [
          { "$ref": "#/components/parameters/WorkspaceId" },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 500 } },
          { name: "subjectId", in: "query", schema: { type: "string" } },
          { name: "kind", in: "query", schema: { type: "string" } },
          { name: "correlationId", in: "query", schema: { type: "string" } },
          { name: "causationId", in: "query", schema: { type: "string" } },
          { name: "traceId", in: "query", schema: { type: "string" } },
        ],
        responses: { "200": { description: "Traceable runtime events" } },
      },
    },
    "/api/epoch/workspaces/{workspaceId}/unknowns": {
      post: { operationId: "createUnknown", tags: ["discovery"], parameters: [{ "$ref": "#/components/parameters/WorkspaceId" }], responses: { "201": { description: "Unknown created" } } },
    },
    "/api/epoch/workspaces/{workspaceId}/discovery-programs": {
      post: { operationId: "createDiscoveryProgram", tags: ["discovery"], parameters: [{ "$ref": "#/components/parameters/WorkspaceId" }], responses: { "201": { description: "Discovery program created" } } },
    },
    "/api/epoch/workspaces/{workspaceId}/hypotheses": {
      post: { operationId: "createHypothesis", tags: ["discovery"], parameters: [{ "$ref": "#/components/parameters/WorkspaceId" }], responses: { "201": { description: "Hypothesis created" } } },
    },
    "/api/epoch/workspaces/{workspaceId}/experiments": {
      post: { operationId: "createExperiment", tags: ["discovery"], parameters: [{ "$ref": "#/components/parameters/WorkspaceId" }], responses: { "201": { description: "Experiment created" } } },
    },
    "/api/epoch/workspaces/{workspaceId}/observations": {
      post: { operationId: "recordObservation", tags: ["discovery"], parameters: [{ "$ref": "#/components/parameters/WorkspaceId" }], responses: { "201": { description: "Observation recorded" } } },
    },
    "/api/epoch/workspaces/{workspaceId}/projects/{projectId}/simulations": {
      get: { operationId: "listSimulations", tags: ["simulation"], parameters: [{ "$ref": "#/components/parameters/WorkspaceId" }, { "$ref": "#/components/parameters/ProjectId" }], responses: { "200": { description: "Project simulations" } } },
      post: { operationId: "createSimulation", tags: ["simulation"], parameters: [{ "$ref": "#/components/parameters/WorkspaceId" }, { "$ref": "#/components/parameters/ProjectId" }], responses: { "201": { description: "Simulation created" } } },
    },
    "/api/epoch/workspaces/{workspaceId}/simulations/{simulationId}/runs": {
      post: { operationId: "runSimulation", tags: ["simulation"], parameters: [{ "$ref": "#/components/parameters/WorkspaceId" }, { "$ref": "#/components/parameters/SimulationId" }], responses: { "201": { description: "Simulation run created" } } },
    },
    "/api/epoch/workspaces/{workspaceId}/automations": {
      get: { operationId: "listAutomations", tags: ["automation"], parameters: [{ "$ref": "#/components/parameters/WorkspaceId" }], responses: { "200": { description: "Workspace automations" } } },
      post: { operationId: "createAutomation", tags: ["automation"], parameters: [{ "$ref": "#/components/parameters/WorkspaceId" }], responses: { "201": { description: "Automation created" } } },
    },
    "/api/epoch/workspaces/{workspaceId}/capabilities": {
      get: { operationId: "discoverCapabilities", tags: ["capabilities"], parameters: [{ "$ref": "#/components/parameters/WorkspaceId" }], responses: { "200": { description: "Capability fabric state" } } },
    },
    "/api/epoch/workspaces/{workspaceId}/architecture-runs/{missionId}": {
      get: { operationId: "getArchitectureRun", tags: ["architecture"], parameters: [{ "$ref": "#/components/parameters/WorkspaceId" }, { "$ref": "#/components/parameters/MissionId" }], responses: { "200": { description: "Persisted V13 architecture trace" } } },
    },
    "/api/epoch/workspaces/{workspaceId}/architecture-runs/{missionId}/refresh": {
      post: { operationId: "refreshArchitectureRun", tags: ["architecture"], parameters: [{ "$ref": "#/components/parameters/WorkspaceId" }, { "$ref": "#/components/parameters/MissionId" }], responses: { "200": { description: "Rebuilt and persisted V13 architecture trace" } } },
    },
    "/api/epoch/workspaces/{workspaceId}/missions/{missionId}/outcome": {
      get: { operationId: "getMissionOutcome", tags: ["outcomes"], parameters: [{ "$ref": "#/components/parameters/WorkspaceId" }, { "$ref": "#/components/parameters/MissionId" }], responses: { "200": { description: "Canonical mission outcome" } } },
      put: { operationId: "recordMissionOutcome", tags: ["outcomes"], parameters: [{ "$ref": "#/components/parameters/WorkspaceId" }, { "$ref": "#/components/parameters/MissionId" }], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/OutcomeCreate" } } } }, responses: { "200": { description: "Outcome recorded" } } },
    },
    "/api/epoch/workspaces/{workspaceId}/outcomes/{outcomeId}/experience": {
      get: { operationId: "getOutcomeExperience", tags: ["experience"], parameters: [{ "$ref": "#/components/parameters/WorkspaceId" }, { name: "outcomeId", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Canonical outcome experience" } } },
      post: { operationId: "recordOutcomeExperience", tags: ["experience"], parameters: [{ "$ref": "#/components/parameters/WorkspaceId" }, { name: "outcomeId", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { "$ref": "#/components/schemas/ExperienceCreate" } } } }, responses: { "201": { description: "Experience recorded" } } },
    },
  },
  components: {
    parameters: {
      WorkspaceId: { name: "workspaceId", in: "path", required: true, schema: { type: "string" } },
      MissionId: { name: "missionId", in: "path", required: true, schema: { type: "string" } },
      ProjectId: { name: "projectId", in: "path", required: true, schema: { type: "string" } },
      SimulationId: { name: "simulationId", in: "path", required: true, schema: { type: "string" } },
    },
    schemas: Object.fromEntries([
      ...EPOCH_V12_CONTRACT_NAMES.map((name) => [name, {
        type: "object",
        description: `${name} ${EPOCH_V12_CONTRACT_VERSION} contract. Runtime validation is defined in lib/epoch/v12/contracts.ts.`,
        required: ["contractVersion", "correlation"],
        properties: {
          contractVersion: { const: EPOCH_V12_CONTRACT_VERSION },
          correlation: {
            type: "object",
            required: ["correlationId", "traceId"],
            properties: {
              correlationId: { type: "string" },
              traceId: { type: "string" },
              causationId: { type: "string" },
            },
          },
        },
      }]),
      ["MissionCreate", { type: "object", required: ["institutionId", "title", "objective"], properties: { institutionId: { type: "string" }, title: { type: "string" }, objective: { type: "string" }, acceptanceCriteria: { type: "array", items: { type: "string" } }, plan: { type: "array", items: { type: "string" } } } }],
      ["OutcomeCreate", { type: "object", required: ["status", "summary"], properties: { status: { type: "string", enum: ["pending", "achieved", "not_achieved", "unknown"] }, summary: { type: "string" }, verificationId: { type: "string" }, evidenceIds: { type: "array", items: { type: "string" } }, customerResult: { type: "object" } } }],
      ["ExperienceCreate", { type: "object", required: ["summary", "lessons", "confidence"], properties: { summary: { type: "string" }, lessons: { type: "array", items: { type: "string" } }, confidence: { type: "number", minimum: 0, maximum: 1 }, reusable: { type: "boolean" }, context: { type: "object" } } }],
    ]),
  },
  xEpochStateTransitions: {
    draft: ["running", "waiting_review", "failed"],
    running: ["waiting_review", "failed"],
    waiting_review: ["completed", "failed"],
    completed: [],
    failed: [],
  },
  xCanonicalStores: [
    "prisma.EpochMission",
    "prisma.EpochExecutionRun",
    "prisma.EpochEvidence",
    "prisma.EpochVerificationRun",
    "prisma.EpochOutcome",
    "prisma.EpochExperience",
    "memory.realtimeEventStore",
  ],
  xEpochV13Resources: {
    eventTrace: "/api/epoch/workspaces/{workspaceId}/events",
    discovery: ["unknowns", "discovery-programs", "hypotheses", "experiments", "observations"],
    environments: ["software", "cloud", "simulation", "edge", "sandbox"],
    execution: ["capabilities", "simulations", "automations", "missions", "workers", "evidence", "verifications"],
    outcomes: ["outcomes", "experiences"],
  },
};

async function main() {
  await mkdir("docs/generated", { recursive: true });
  await writeFile("docs/generated/epoch-v12-contract.json", `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log("Generated docs/generated/epoch-v12-contract.json");
}

void main();
