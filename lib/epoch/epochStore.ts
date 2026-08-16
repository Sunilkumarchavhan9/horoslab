import { randomUUID } from "crypto";
import { prisma } from "../storage/prismaClient";
import { saveEpochArtifact } from "./epochArtifacts";
import { emitEpochRuntimeEvent } from "./epochEvents";
import { assertMissionTransition } from "./missionStateMachine";
import { buildMissionLoopMetadata, recordMissionCheckpoint, requestMissionCancellation, type MissionLoopMetadata } from "./missionLoop";
import { buildEvidenceIntegrityProof, verifyEvidenceIntegrity } from "./evidenceIntegrity";
import { buildEpochAssuranceReport } from "./assuranceReport";
import { compileEpochMissionSpecification, type EpochMissionSpecification } from "./outcomeCompiler";
import { generateEpochCandidates } from "./candidateEngine";
import { buildEpochExperimentPlans } from "./experimentEngine";
import { compileEpochOutcomeContract, normalizeEpochInputEnvelope } from "./inputIntelligence";
import { ingestEpochInput, validateEpochIntent } from "./inputIngestion";
import { buildEpochCapabilityCompatibilityGraph } from "./capabilityGraph";
import { loadEpochRuntimeProbeMap } from "./capabilityFabricProbe";
import { enqueueEpochRealityMaintenance, enqueueEpochRealityProjection } from "./realityJobs";

export type EpochMissionState = "draft" | "running" | "waiting_review" | "completed" | "failed" | "cancelled";
export type EpochVerificationDecision = "PASS" | "FAIL" | "REVIEW";
export type EpochAssuranceResult = "PASS" | "FAIL" | "UNKNOWN";

export type EpochEvidenceInput = {
  kind: string;
  url?: string;
  filePath?: string;
  contentType?: string;
  summary?: string;
  payload?: Record<string, unknown>;
  proof?: Record<string, unknown>;
};

export type EpochAuthorityPolicyInput = {
  name?: string;
  canExecute?: boolean;
  needsApproval?: boolean;
  blocked?: boolean;
  permissions?: string[];
  budgets?: Record<string, unknown>;
  approvals?: string[];
  checks?: string[];
  proof?: Record<string, unknown>;
};

export type CreateEpochTemplateInput = {
  workspaceId: string;
  userId: string;
  orgId?: string;
  name: string;
  category?: string;
  description?: string;
  version?: string;
  definition?: Record<string, unknown>;
  proof?: Record<string, unknown>;
};

export type CreateEpochInstitutionInput = {
  workspaceId: string;
  userId: string;
  orgId?: string;
  name: string;
  category?: string;
  version?: string;
  summary?: string;
  templateId?: string;
  metadata?: Record<string, unknown>;
  proof?: Record<string, unknown>;
};

export type UpdateEpochInstitutionInput = Partial<{
  name: string;
  category: string;
  version: string;
  status: string;
  summary: string;
  metadata: Record<string, unknown>;
  proof: Record<string, unknown>;
}>;

export type CreateEpochMissionInput = {
  workspaceId: string;
  institutionId: string;
  userId: string;
  orgId?: string;
  title: string;
  objective: string;
  repository?: string;
  baseBranch?: string;
  workingBranch?: string;
  budgetCents?: number;
  deadlineAt?: Date | null;
  plan?: string[];
  acceptanceCriteria?: string[];
  model?: Record<string, unknown>;
  outcome?: Record<string, unknown>;
  constraints?: Record<string, unknown>;
  baseline?: Record<string, unknown>;
  workload?: Record<string, unknown>;
  runtimeOptions?: Array<Record<string, unknown>>;
  hardwareOptions?: Array<Record<string, unknown>>;
  allowedRuntimes?: string[];
  allowedHardware?: string[];
  authority?: EpochAuthorityPolicyInput;
  proof?: Record<string, unknown>;
  inputEnvelope?: Record<string, unknown>;
};

export type UpdateEpochMissionInput = Partial<{
  state: EpochMissionState;
  objective: string;
  currentStep: string;
  plan: string[];
  result: Record<string, unknown>;
  timeline: Record<string, unknown>[];
  proof: Record<string, unknown>;
  startedAt: Date | null;
  completedAt: Date | null;
  budgetCents: number;
  acceptanceCriteria: string[];
  allowRetry?: boolean;
  allowRestore?: boolean;
}>;

export type RunEpochMissionInput = {
  evidence?: EpochEvidenceInput[];
  checklist?: string[];
  humanApproval?: "approved" | "rejected" | "review";
  confidence?: number;
  output?: Record<string, unknown>;
  approvals?: string[];
  notes?: string;
};

type EpochDbClient = any;

function json(value: unknown): any {
  return JSON.parse(JSON.stringify(value));
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function timelineEvent(stage: string, status: string, note: string, details?: Record<string, unknown>) {
  return {
    id: `evt_${randomUUID().slice(0, 12)}`,
    stage,
    status,
    note,
    timestamp: new Date().toISOString(),
    ...(details ?? {}),
  };
}

function missionPlanFromObjective(objective: string): string[] {
  return [
    `Clarify mission objective: ${objective}`,
    "Gather evidence",
    "Validate authority",
    "Review result with human approval",
    "Record institutional memory",
  ];
}

function normalizeMissionState(value: string): EpochMissionState {
  if (value === "running" || value === "waiting_review" || value === "completed" || value === "failed" || value === "cancelled") return value;
  return "draft";
}

function coerceDecision(value: string | undefined, fallback: EpochVerificationDecision): EpochVerificationDecision {
  if (value === "PASS" || value === "FAIL" || value === "REVIEW") return value;
  return fallback;
}

function isPrismaUniqueConstraintError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeCode =
    "code" in error && typeof (error as { code?: unknown }).code === "string"
      ? (error as { code: string }).code
      : "";
  const maybeMessage =
    "message" in error && typeof (error as { message?: unknown }).message === "string"
      ? (error as { message: string }).message
      : "";
  return maybeCode === "P2002" || maybeMessage.includes("Unique constraint failed");
}

function normalizeEpochSearch(value: string | undefined | null): string {
  return (value ?? "").trim().toLowerCase();
}

function matchesEpochSearch(haystack: Array<string | null | undefined>, search: string): boolean {
  if (!search) return true;
  return haystack.some((value) => typeof value === "string" && value.toLowerCase().includes(search));
}

export async function listEpochTemplates(scope: { workspaceId: string; search?: string }) {
  const search = normalizeEpochSearch(scope.search);
  const templates = await prisma.epochInstitutionTemplate.findMany({
    where: { workspaceId: scope.workspaceId },
    orderBy: { updatedAt: "desc" },
  });
  if (!search) return templates;

  return templates.filter((template) =>
    matchesEpochSearch(
      [
        template.name,
        template.category,
        template.description,
        template.version,
        JSON.stringify(template.definition ?? {}),
      ],
      search,
    ),
  );
}

export async function getEpochTemplate(workspaceId: string, templateId: string) {
  return prisma.epochInstitutionTemplate.findFirst({
    where: { id: templateId, workspaceId },
    include: {
      institutions: {
        orderBy: { updatedAt: "desc" },
        take: 10,
        include: {
          missions: { orderBy: { updatedAt: "desc" }, take: 5 },
        },
      },
      versions: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
}

export async function createEpochTemplate(input: CreateEpochTemplateInput) {
  const template = await prisma.epochInstitutionTemplate.create({
    data: {
      workspaceId: input.workspaceId,
      userId: input.userId,
      orgId: input.orgId,
      name: input.name,
      category: input.category ?? "general",
      description: input.description ?? "",
      version: input.version ?? "1.0.0",
      definition: json(input.definition ?? {}),
      proof: json(input.proof ?? {}),
    } as any,
  });
  emitEpochRuntimeEvent({
    userId: input.userId,
    orgId: input.orgId,
    workspaceId: input.workspaceId,
    kind: "epoch.institution.created",
    label: `Template ${input.name} created`,
    subjectId: template.id,
    payload: { templateId: template.id, templateName: template.name },
  });
  return template;
}

export async function listEpochInstitutions(scope: { workspaceId: string; search?: string }) {
  const search = normalizeEpochSearch(scope.search);
  const institutions = await prisma.epochInstitution.findMany({
    where: { workspaceId: scope.workspaceId },
    orderBy: { updatedAt: "desc" },
    include: {
      template: true,
      missions: { orderBy: { updatedAt: "desc" }, take: 10 },
    },
  });
  if (!search) return institutions;

  return institutions.filter((institution) =>
    matchesEpochSearch(
      [
        institution.name,
        institution.category,
        institution.summary,
        institution.status,
        institution.currentState,
        institution.version,
        institution.template?.name,
        institution.template?.category,
      ],
      search,
    ),
  );
}

export async function listEpochInstitutionVersions(scope: { workspaceId: string; institutionId: string }) {
  return prisma.epochInstitutionVersion.findMany({
    where: { workspaceId: scope.workspaceId, institutionId: scope.institutionId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
}

export async function getEpochInstitution(workspaceId: string, institutionId: string) {
  return prisma.epochInstitution.findFirst({
    where: { id: institutionId, workspaceId },
    include: {
      template: true,
      versions: { orderBy: { createdAt: "desc" }, take: 10 },
      missions: {
        orderBy: { createdAt: "desc" },
        include: {
          authorityPolicies: { orderBy: { updatedAt: "desc" }, take: 1 },
          executionRun: true,
          verificationRun: true,
          certificate: true,
          memoryRecord: true,
          evidence: { orderBy: { createdAt: "desc" } },
        },
      },
      authorityPolicies: { orderBy: { updatedAt: "desc" } },
      memoryRecords: { orderBy: { updatedAt: "desc" }, take: 10 },
      integrations: { orderBy: { updatedAt: "desc" }, take: 10 },
    },
  });
}

export async function createEpochInstitution(input: CreateEpochInstitutionInput) {
  const institution = await prisma.epochInstitution.create({
    data: {
      workspaceId: input.workspaceId,
      userId: input.userId,
      orgId: input.orgId,
      templateId: input.templateId,
      name: input.name,
      category: input.category ?? "general",
      version: input.version ?? "1.0.0",
      summary: input.summary ?? "",
      currentState: "draft",
      metadata: json(input.metadata ?? {}),
      proof: json(input.proof ?? {}),
    } as any,
  });

  await prisma.epochInstitutionVersion.create({
    data: {
      workspaceId: input.workspaceId,
      institutionId: institution.id,
      templateId: input.templateId,
      version: institution.version,
      snapshot: json({ institution: cloneJson(institution), source: "create" }),
      createdBy: input.userId,
      proof: json(input.proof ?? {}),
    } as any,
  });

  emitEpochRuntimeEvent({
    userId: input.userId,
    orgId: input.orgId,
    workspaceId: input.workspaceId,
    kind: "epoch.institution.created",
    label: `Institution ${institution.name} created`,
    subjectId: institution.id,
    payload: { institutionId: institution.id, templateId: institution.templateId },
  });

  return institution;
}

export async function updateEpochInstitution(
  workspaceId: string,
  institutionId: string,
  input: UpdateEpochInstitutionInput,
) {
  const current = await prisma.epochInstitution.findFirst({ where: { id: institutionId, workspaceId } });
  if (!current) return null;

  const institution = await prisma.epochInstitution.update({
    where: { id: current.id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.version !== undefined ? { version: input.version } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.summary !== undefined ? { summary: input.summary } : {}),
      ...(input.metadata !== undefined ? { metadata: json(input.metadata) } : {}),
      ...(input.proof !== undefined ? { proof: json(input.proof) } : {}),
    } as any,
  });

  await prisma.epochInstitutionVersion.create({
    data: {
      workspaceId,
      institutionId: institution.id,
      templateId: institution.templateId,
      version: institution.version,
      snapshot: json({ institution: cloneJson(institution), source: "update" }),
      proof: json(input.proof ?? {}),
    } as any,
  });

  emitEpochRuntimeEvent({
    userId: current.userId,
    orgId: current.orgId ?? undefined,
    workspaceId,
    kind: "epoch.institution.updated",
    label: `Institution ${institution.name} updated`,
    subjectId: institution.id,
    payload: { institutionId: institution.id, version: institution.version },
  });

  return institution;
}

export async function deleteEpochInstitution(workspaceId: string, institutionId: string) {
  const current = await prisma.epochInstitution.findFirst({ where: { id: institutionId, workspaceId } });
  if (!current) return null;

  const institution = await prisma.epochInstitution.delete({
    where: { id: current.id },
  });

  emitEpochRuntimeEvent({
    userId: current.userId,
    orgId: current.orgId ?? undefined,
    workspaceId,
    kind: "epoch.institution.deleted",
    label: `Institution ${current.name} deleted`,
    subjectId: current.id,
    payload: { institutionId: current.id },
  });

  return institution;
}

export async function archiveEpochInstitution(workspaceId: string, institutionId: string) {
  const current = await prisma.epochInstitution.findFirst({ where: { id: institutionId, workspaceId } });
  if (!current) return null;

  const institution = await prisma.epochInstitution.update({
    where: { id: current.id },
    data: {
      status: "archived",
      archivedAt: new Date(),
      currentState: "failed",
    } as any,
  });
  emitEpochRuntimeEvent({
    userId: current.userId,
    orgId: current.orgId ?? undefined,
    workspaceId,
    kind: "epoch.institution.archived",
    label: `Institution ${current.name} archived`,
    subjectId: current.id,
    payload: { institutionId: current.id },
  });
  return institution;
}

export async function cloneEpochInstitution(
  workspaceId: string,
  institutionId: string,
  input: { userId: string; orgId?: string; name?: string; version?: string },
) {
  const source = await prisma.epochInstitution.findFirst({
    where: { id: institutionId, workspaceId },
    include: { versions: { orderBy: { createdAt: "desc" }, take: 1 }, authorityPolicies: true },
  });
  if (!source) return null;

  const clone = await prisma.epochInstitution.create({
    data: {
      workspaceId,
      userId: input.userId,
      orgId: input.orgId,
      templateId: source.templateId,
      name: input.name ?? `${source.name} Clone`,
      category: source.category,
      version: input.version ?? source.version,
      summary: source.summary,
      metadata: json(source.metadata),
      proof: json({ clonedFrom: source.id, sourceProof: source.proof }),
    } as any,
  });

  await prisma.epochInstitutionVersion.create({
    data: {
      workspaceId,
      institutionId: clone.id,
      templateId: source.templateId,
      version: clone.version,
      snapshot: json({ institution: cloneJson(source), source: "clone" }),
      createdBy: input.userId,
      proof: json({ clonedFrom: source.id }),
    } as any,
  });

  emitEpochRuntimeEvent({
    userId: input.userId,
    orgId: input.orgId,
    workspaceId,
    kind: "epoch.institution.cloned",
    label: `Institution ${source.name} cloned`,
    subjectId: clone.id,
    payload: { sourceInstitutionId: source.id, cloneInstitutionId: clone.id },
  });

  return clone;
}

export async function listEpochMissions(scope: { workspaceId: string; institutionId?: string }) {
  return prisma.epochMission.findMany({
    where: {
      workspaceId: scope.workspaceId,
      ...(scope.institutionId ? { institutionId: scope.institutionId } : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      institution: true,
      authorityPolicies: { orderBy: { updatedAt: "desc" } },
      executionRun: true,
      verificationRun: true,
      certificate: true,
      memoryRecord: true,
      inputEnvelopes: { orderBy: { capturedAt: "asc" } },
      evidence: { orderBy: { createdAt: "desc" } },
    },
  });
}

type EpochSmokeCursor = {
  updatedAt: string;
  id: string;
};

function encodeEpochSmokeCursor(cursor: EpochSmokeCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

function decodeEpochSmokeCursor(cursor: string | undefined): EpochSmokeCursor | null {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as { updatedAt?: unknown }).updatedAt === "string" &&
      typeof (parsed as { id?: unknown }).id === "string"
    ) {
      return {
        updatedAt: (parsed as { updatedAt: string }).updatedAt,
        id: (parsed as { id: string }).id,
      };
    }
  } catch {
    return null;
  }
  return null;
}

function isSmokeMission(mission: {
  title: string;
  institution?: { name?: string; proof?: unknown } | null;
  proof: unknown;
}): boolean {
  const proof = mission.proof as Record<string, unknown> | null | undefined;
  const institutionProof = mission.institution?.proof as Record<string, unknown> | null | undefined;
  const smokeMarker = (value: string | undefined) => typeof value === "string" && value.toLowerCase().includes("smoke");
  return Boolean(
    proof?.smoke === true ||
      institutionProof?.smoke === true ||
      smokeMarker(mission.title) ||
      smokeMarker(mission.institution?.name),
  );
}

export async function listEpochSmokeRuns(input: {
  workspaceId: string;
  missionTitle?: string;
  limit?: number;
  cursor?: string;
}): Promise<{
  smokeRuns: Awaited<ReturnType<typeof listEpochMissions>>;
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}> {
  const limit = Math.max(1, Math.min(100, Math.floor(input.limit ?? 25)));
  const missions = await prisma.epochMission.findMany({
    where: {
      workspaceId: input.workspaceId,
      ...(input.missionTitle ? { title: input.missionTitle } : {}),
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    include: {
      institution: true,
      authorityPolicies: { orderBy: { updatedAt: "desc" } },
      executionRun: true,
      verificationRun: true,
      certificate: true,
      memoryRecord: true,
      inputEnvelopes: { orderBy: { capturedAt: "asc" } },
      evidence: { orderBy: { createdAt: "desc" } },
    },
  });

  const smokeRuns = missions.filter(isSmokeMission);
  const cursor = decodeEpochSmokeCursor(input.cursor);
  let startIndex = 0;
  if (cursor) {
    const cursorIndex = smokeRuns.findIndex(
      (mission) => mission.updatedAt.toISOString() === cursor.updatedAt && mission.id === cursor.id,
    );
    if (cursorIndex >= 0) {
      startIndex = cursorIndex + 1;
    }
  }

  const page = smokeRuns.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < smokeRuns.length;
  const nextCursor = hasMore && page.length > 0 ? encodeEpochSmokeCursor({
    updatedAt: page[page.length - 1].updatedAt.toISOString(),
    id: page[page.length - 1].id,
  }) : null;

  return {
    smokeRuns: page,
    nextCursor,
    hasMore,
    total: smokeRuns.length,
  };
}

export async function getEpochMission(workspaceId: string, missionId: string) {
  return prisma.epochMission.findFirst({
    where: { id: missionId, workspaceId },
    include: {
      institution: true,
      authorityPolicies: { orderBy: { updatedAt: "desc" } },
      executionRun: { include: { evidence: { orderBy: { createdAt: "desc" } }, verification: true } },
      verificationRun: { include: { certificate: true } },
      certificate: true,
      memoryRecord: true,
      inputEnvelopes: { orderBy: { capturedAt: "asc" } },
      evidence: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function createEpochAuthorityPolicy(input: {
  workspaceId: string;
  institutionId: string;
  missionId?: string;
  userId: string;
  orgId?: string;
  name?: string;
  canExecute?: boolean;
  needsApproval?: boolean;
  blocked?: boolean;
  permissions?: string[];
  budgets?: Record<string, unknown>;
  approvals?: string[];
  checks?: string[];
  proof?: Record<string, unknown>;
}) {
  return prisma.epochAuthorityPolicy.create({
    data: {
      workspaceId: input.workspaceId,
      institutionId: input.institutionId,
      missionId: input.missionId,
      userId: input.userId,
      orgId: input.orgId,
      name: input.name ?? "Mission Authority Policy",
      canExecute: input.canExecute ?? false,
      needsApproval: input.needsApproval ?? true,
      blocked: input.blocked ?? false,
      permissions: json(input.permissions ?? []),
      budgets: json(input.budgets ?? {}),
      approvals: json(input.approvals ?? []),
      checks: json(input.checks ?? []),
      proof: json(input.proof ?? {}),
      status: "active",
    } as any,
  });
}

export async function listEpochAuthorityPolicies(input: {
  workspaceId: string;
  missionId?: string;
  institutionId?: string;
}) {
  return prisma.epochAuthorityPolicy.findMany({
    where: {
      workspaceId: input.workspaceId,
      ...(input.missionId ? { missionId: input.missionId } : {}),
      ...(input.institutionId ? { institutionId: input.institutionId } : {}),
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
  });
}

export async function getEpochAuthorityPolicy(workspaceId: string, policyId: string) {
  return prisma.epochAuthorityPolicy.findFirst({
    where: { id: policyId, workspaceId },
    include: {
      institution: true,
      mission: {
        include: {
          executionRun: true,
          verificationRun: true,
          certificate: true,
          memoryRecord: true,
        },
      },
    },
  });
}

export async function listEpochExecutionRuns(input: {
  workspaceId: string;
  missionId?: string;
}) {
  return prisma.epochExecutionRun.findMany({
    where: {
      workspaceId: input.workspaceId,
      ...(input.missionId ? { missionId: input.missionId } : {}),
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
  });
}

export async function getEpochExecutionRun(workspaceId: string, executionRunId: string) {
  return prisma.epochExecutionRun.findFirst({
    where: { workspaceId, id: executionRunId },
    include: {
      mission: {
        include: {
          authorityPolicies: { orderBy: { updatedAt: "desc" } },
          evidence: { orderBy: { createdAt: "desc" } },
          verificationRun: true,
          certificate: true,
          memoryRecord: true,
        },
      },
      evidence: { orderBy: { createdAt: "desc" } },
      verification: { include: { certificate: true } },
    },
  });
}

export async function listEpochVerificationRuns(input: {
  workspaceId: string;
  missionId?: string;
}) {
  return prisma.epochVerificationRun.findMany({
    where: {
      workspaceId: input.workspaceId,
      ...(input.missionId ? { missionId: input.missionId } : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: { certificate: true, executionRun: true },
  });
}

export async function getEpochVerificationRun(workspaceId: string, verificationRunId: string) {
  return prisma.epochVerificationRun.findFirst({
    where: { workspaceId, id: verificationRunId },
    include: { certificate: true, executionRun: true, mission: true },
  });
}

export async function getEpochCertificate(workspaceId: string, certificateId: string) {
  return prisma.epochCertificate.findFirst({
    where: { workspaceId, id: certificateId },
    include: { verification: true, mission: true },
  });
}

export async function listEpochMemoryRecords(input: {
  workspaceId: string;
  institutionId?: string;
  missionId?: string;
}) {
  return prisma.epochMemoryRecord.findMany({
    where: {
      workspaceId: input.workspaceId,
      ...(input.institutionId ? { institutionId: input.institutionId } : {}),
      ...(input.missionId ? { missionId: input.missionId } : {}),
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    include: { mission: true, certificate: true, institution: true },
  });
}

export async function getEpochMemoryRecord(workspaceId: string, memoryRecordId: string) {
  return prisma.epochMemoryRecord.findFirst({
    where: { workspaceId, id: memoryRecordId },
    include: { mission: true, certificate: true, institution: true },
  });
}

type EpochMemoryLessonSourceRecord = {
  id: string;
  summary: string | null;
  missionId: string | null;
  institutionId: string;
  updatedAt: string;
};

export type EpochMemoryLesson = {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  status: string;
  count: number;
  confidence: number;
  proof: Record<string, unknown>;
  sourceRecords: EpochMemoryLessonSourceRecord[];
  createdAt: Date;
  updatedAt: Date;
  derived: boolean;
};

function normalizeLessonKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function lessonTextList(input: { lessons?: unknown; suggestedImprovements?: unknown }) {
  const lessonValues = Array.isArray(input.lessons) ? input.lessons : [];
  const improvementValues = Array.isArray(input.suggestedImprovements) ? input.suggestedImprovements : [];
  return [...lessonValues, ...improvementValues].filter((value): value is string => typeof value === "string" && value.trim().length > 0);
}

export async function listEpochMemoryLessons(input: {
  workspaceId: string;
  institutionId?: string;
  missionId?: string;
}): Promise<EpochMemoryLesson[]> {
  const [memoryRecords, storedLessons] = await Promise.all([
    prisma.epochMemoryRecord.findMany({
      where: {
        workspaceId: input.workspaceId,
        ...(input.institutionId ? { institutionId: input.institutionId } : {}),
        ...(input.missionId ? { missionId: input.missionId } : {}),
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      include: { mission: true, institution: true },
    }),
    prisma.lesson.findMany({
      where: { workspaceId: input.workspaceId },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    }),
  ]);

  const lessons = new Map<
    string,
    EpochMemoryLesson
  >();

  for (const record of memoryRecords) {
    for (const text of lessonTextList(record)) {
      const key = normalizeLessonKey(text);
      const existing = lessons.get(key);
      const sourceRecord: EpochMemoryLessonSourceRecord = {
        id: record.id,
        summary: record.mission?.objective ?? record.mission?.title ?? record.institution?.name ?? null,
        missionId: record.missionId ?? null,
        institutionId: record.institutionId,
        updatedAt: record.updatedAt.toISOString(),
      };

      if (existing) {
        existing.count += 1;
        existing.sourceRecords.push(sourceRecord);
        existing.updatedAt = record.updatedAt > existing.updatedAt ? record.updatedAt : existing.updatedAt;
        continue;
      }

      lessons.set(key, {
        id: `derived:${key}`,
        workspaceId: input.workspaceId,
        title: text,
        content: text,
        status: "pending",
        count: 1,
        confidence: 80,
        proof: {
          derived: true,
          source: "epoch_memory_records",
          lessonKey: key,
        },
        sourceRecords: [sourceRecord],
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        derived: true,
      });
    }
  }

  for (const lesson of storedLessons) {
    const key = normalizeLessonKey(lesson.title || lesson.content || lesson.id);
    const existing = lessons.get(key);
    const proof = lesson.proof && typeof lesson.proof === "object" ? (lesson.proof as Record<string, unknown>) : {};
    const confidence = typeof proof.confidence === "number" ? proof.confidence : Math.min(99, 70 + Math.max(0, lesson.count - 1) * 5);

    if (existing) {
      lessons.set(key, {
        ...existing,
        id: lesson.id,
        workspaceId: lesson.workspaceId,
        title: lesson.title,
        content: lesson.content,
        status: lesson.status,
        count: lesson.count,
        confidence,
        proof,
        createdAt: lesson.createdAt,
        updatedAt: lesson.updatedAt,
        derived: false,
      });
      continue;
    }

    lessons.set(key, {
      id: lesson.id,
      workspaceId: lesson.workspaceId,
      title: lesson.title,
      content: lesson.content,
      status: lesson.status,
      count: lesson.count,
      confidence,
      proof,
      sourceRecords: [],
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
      derived: false,
    });
  }

  return [...lessons.values()].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export async function getEpochMemoryLesson(workspaceId: string, lessonId: string) {
  const lessons = await listEpochMemoryLessons({ workspaceId });
  const normalizedId = normalizeLessonKey(lessonId);
  return (
    lessons.find((lesson) => lesson.id === lessonId) ??
    lessons.find((lesson) => lesson.id === `derived:${normalizedId}`) ??
    lessons.find((lesson) => normalizeLessonKey(lesson.title) === normalizedId) ??
    null
  );
}

export async function setEpochMemoryLessonStatus(input: {
  workspaceId: string;
  lessonId: string;
  status: "applied" | "rejected";
  userId: string;
  orgId?: string;
  proof?: Record<string, unknown>;
}) {
  const lesson = await getEpochMemoryLesson(input.workspaceId, input.lessonId);
  if (!lesson) return null;

  const normalizedTitle = lesson.title.trim();
  const existing = lesson.derived
    ? await prisma.lesson.findFirst({
        where: {
          workspaceId: input.workspaceId,
          title: normalizedTitle,
        },
      })
    : await prisma.lesson.findFirst({
        where: {
          workspaceId: input.workspaceId,
          id: lesson.id,
        },
      });

  const proof = {
    ...(lesson.proof ?? {}),
    ...(input.proof ?? {}),
    status: input.status,
    actedAt: new Date().toISOString(),
    actedBy: input.userId,
    ...(input.orgId ? { orgId: input.orgId } : {}),
  };

  const data = {
    workspaceId: input.workspaceId,
    outcomeId: lesson.sourceRecords[0]?.missionId ?? null,
    title: normalizedTitle,
    content: lesson.content || normalizedTitle,
    count: lesson.count,
    proof: json(proof),
    status: input.status,
  } as any;

  const updated = existing
    ? await prisma.lesson.update({
        where: { id: existing.id },
        data,
      })
    : await prisma.lesson.create({
        data,
      });

  return updated;
}

export async function getEpochAuthorityGate(workspaceId: string, missionId: string) {
  const mission = await prisma.epochMission.findFirst({
    where: { id: missionId, workspaceId },
    include: {
      institution: true,
      authorityPolicies: { orderBy: { updatedAt: "desc" }, take: 1 },
      executionRun: true,
      verificationRun: true,
      certificate: true,
      memoryRecord: true,
      evidence: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!mission) return null;

  const policy = mission.authorityPolicies[0] ?? null;
  const blocked = Boolean(policy?.blocked);
  const canExecute = Boolean(policy?.canExecute) && !blocked;
  const needsApproval = Boolean(policy?.needsApproval) || !canExecute;
  const reasons: string[] = [];
  if (!policy) reasons.push("missing_policy");
  if (blocked) reasons.push("blocked_by_policy");
  if (!canExecute) reasons.push("execution_not_allowed");
  if (needsApproval) reasons.push("human_approval_required");
  const explanation = {
    summary: blocked
      ? "The latest authority policy blocks execution."
      : canExecute
        ? "The mission can execute under the current authority policy."
        : "The mission needs approval before it can execute.",
    decision: blocked ? "block" : needsApproval ? "review" : "allow",
    reasons,
    recommendation: blocked
      ? "Remove the blocking policy or create a replacement policy that allows this mission."
      : needsApproval
        ? "Approve the mission or update the policy so execution is allowed without review."
        : "The mission is cleared to execute.",
    blockingPolicies: policy && blocked
      ? [
          {
            id: policy.id,
            name: policy.name,
            reason: "blocked_by_policy",
          },
        ]
      : [],
    approvalPolicies: policy && needsApproval && !blocked
      ? [
          {
            id: policy.id,
            name: policy.name,
            reason: "human_approval_required",
          },
        ]
      : [],
    riskLevel: blocked ? "high" : needsApproval ? "medium" : "low",
    signals: {
      policyId: policy?.id ?? null,
      policyName: policy?.name ?? null,
      permissions: policy?.permissions ?? [],
      budgets: policy?.budgets ?? {},
      approvals: policy?.approvals ?? [],
      checks: policy?.checks ?? [],
      evidenceCount: mission.evidence.length,
      timelineCount: Array.isArray(mission.timeline) ? mission.timeline.length : 0,
      hasPlan: Array.isArray(mission.plan) && mission.plan.length > 0,
      hasExecutionRun: Boolean(mission.executionRun),
      hasVerificationRun: Boolean(mission.verificationRun),
      hasCertificate: Boolean(mission.certificate),
      hasMemoryRecord: Boolean(mission.memoryRecord),
      executionRunId: mission.executionRun?.id ?? null,
      verificationRunId: mission.verificationRun?.id ?? null,
      certificateId: mission.certificate?.id ?? null,
    },
  };

  return {
    mission,
    policy,
    blocked,
    canExecute,
    needsApproval,
    explanation,
    reason: blocked
      ? "blocked_by_policy"
      : !canExecute
        ? "approval_required"
        : "allowed",
  };
}

export async function getEpochMissionControl(workspaceId: string, missionId: string) {
  const mission = await getEpochMission(workspaceId, missionId);
  if (!mission) return null;
  const gate = await getEpochAuthorityGate(workspaceId, missionId);
  return {
    mission,
    gate,
    authorityPolicies: mission.authorityPolicies,
    execution: mission.executionRun ?? null,
    evidence: mission.evidence ?? [],
    verification: mission.verificationRun ?? null,
    certificate: mission.certificate ?? null,
    memoryRecord: mission.memoryRecord ?? null,
  };
}

export async function createEpochMission(input: CreateEpochMissionInput) {
  const normalizedInput = input.inputEnvelope ? normalizeEpochInputEnvelope(input.inputEnvelope) : null;
  const ingestion = normalizedInput ? ingestEpochInput(normalizedInput) : null;
  if (normalizedInput && ingestion?.status === "invalid") throw new Error(`epoch_input_invalid:${ingestion.reasons.join(",")}`);
  if (normalizedInput && ingestion && !validateEpochIntent(ingestion.intent, normalizedInput).valid && ingestion.status === "parsed") throw new Error("epoch_intent_validation_failed");
  const outcomeContract = normalizedInput
    ? compileEpochOutcomeContract({
        inputs: [normalizedInput],
        objective: input.objective,
        successCriteria: input.acceptanceCriteria,
        constraints: input.constraints,
        baseline: input.baseline,
        workload: input.workload,
      })
    : null;
  const requiresApproval = Boolean(input.repository || input.authority?.needsApproval);
  const loop = buildMissionLoopMetadata({
    objective: input.objective,
    acceptanceCriteria: input.acceptanceCriteria,
    plan: input.plan,
  });
  const specification: EpochMissionSpecification = compileEpochMissionSpecification({
    model: input.model,
    outcome: input.outcome,
    constraints: input.constraints,
    baseline: input.baseline,
    workload: input.workload,
    acceptanceCriteria: input.acceptanceCriteria,
  });
  const candidateSearch = {
    version: "epoch_candidate_search.v1",
    candidates: generateEpochCandidates({
      model: input.model,
      runtimeOptions: input.runtimeOptions,
      hardwareOptions: input.hardwareOptions,
      workload: input.workload,
      allowedRuntimes: input.allowedRuntimes,
      allowedHardware: input.allowedHardware,
    }),
    generatedAt: new Date().toISOString(),
  };
  const experimentPlan = {
    version: "epoch_experiment_plan_set.v1",
    plans: buildEpochExperimentPlans({
      candidates: candidateSearch.candidates,
      workload: input.workload,
    }),
    generatedAt: new Date().toISOString(),
  };
  const capabilityProbes = await loadEpochRuntimeProbeMap(input.workspaceId);
  const capabilityAwareCandidates = generateEpochCandidates({
    model: input.model,
    runtimeOptions: input.runtimeOptions,
    hardwareOptions: input.hardwareOptions,
    workload: input.workload,
    allowedRuntimes: input.allowedRuntimes,
    allowedHardware: input.allowedHardware,
    capabilityProbes,
  });
  candidateSearch.candidates = capabilityAwareCandidates;
  experimentPlan.plans = buildEpochExperimentPlans({ candidates: capabilityAwareCandidates, workload: input.workload });
  const capabilityGraph = buildEpochCapabilityCompatibilityGraph({
    model: input.model,
    runtimeOptions: input.runtimeOptions,
    hardwareOptions: input.hardwareOptions,
    workload: input.workload,
    capabilityProbes,
  });
  const mission = await prisma.epochMission.create({
    data: {
      workspaceId: input.workspaceId,
      institutionId: input.institutionId,
      userId: input.userId,
      orgId: input.orgId,
      title: input.title,
      objective: input.objective,
      repository: input.repository,
      baseBranch: input.baseBranch,
      workingBranch: input.workingBranch,
      state: requiresApproval ? "waiting_review" : "draft",
      currentStep: requiresApproval ? "human_review" : "planner",
      timeline: json([timelineEvent("mission", "created", "Mission created")]),
      plan: json(input.plan ?? missionPlanFromObjective(input.objective)),
      budgetCents: input.budgetCents ?? 0,
      deadlineAt: input.deadlineAt ?? undefined,
      proof: json({
        ...(input.proof ?? {}),
        ...(normalizedInput ? { inputEnvelope: normalizedInput, ingestion, outcomeContract } : {}),
        missionLoop: loop,
        missionSpecification: specification,
        candidateSearch,
        experimentPlan,
        capabilityGraph,
      }),
      ...(normalizedInput
        ? {
            inputEnvelopes: {
              create: {
                workspaceId: input.workspaceId,
                userId: input.userId,
                orgId: input.orgId,
                modality: normalizedInput.modality,
                source: normalizedInput.source,
                trust: normalizedInput.trust,
                content: json(normalizedInput.content),
                contentType: normalizedInput.contentType,
                metadata: json(normalizedInput.metadata),
                capturedAt: new Date(normalizedInput.capturedAt),
                contentSha256: normalizedInput.contentSha256,
                sensitivity: normalizedInput.sensitivity,
                classification: normalizedInput.classification,
                validFrom: new Date(normalizedInput.validFrom),
                validUntil: normalizedInput.validUntil ? new Date(normalizedInput.validUntil) : undefined,
                ingestionVersion: normalizedInput.ingestionVersion,
                integritySha256: normalizedInput.integritySha256,
              },
            },
          }
        : {}),
    } as any,
  });

  const repositoryAuthority = input.repository
    ? {
        name: input.title + " repository execution policy",
        canExecute: false,
        needsApproval: true,
        blocked: false,
        permissions: [
          "repository.read",
          "repository.write",
          "branch.create",
          "pull_request.create",
          "checks.read",
          "tests.run",
          "evidence.write",
        ],
        approvals: ["human_review"],
        checks: [
          "branch_is_not_main",
          "pull_request_required",
          "tests_pass",
          "validation_pass",
          "evidence_required",
          "no_secret_file_modifications",
          "no_production_deployment",
          "no_destructive_commands",
          "merge_forbidden",
        ],
      }
    : undefined;
  if (input.authority || repositoryAuthority) {
    await createEpochAuthorityPolicy({
      workspaceId: input.workspaceId,
      institutionId: input.institutionId,
      missionId: mission.id,
      userId: input.userId,
      orgId: input.orgId,
      ...(input.authority ?? {}),
      ...(repositoryAuthority ?? {}),
    });
  }

  await prisma.epochInstitution.update({
    where: { id: input.institutionId },
    data: { missionCount: { increment: 1 }, currentState: "draft" } as any,
  });

  // Start the durable reality loop for every mission. These jobs are safe to
  // retry and make observation projection/freshness independent of API uptime.
  await Promise.all([
    enqueueEpochRealityMaintenance({ workspaceId: input.workspaceId, missionId: mission.id }),
    enqueueEpochRealityProjection({ workspaceId: input.workspaceId, missionId: mission.id }),
  ]);

  emitEpochRuntimeEvent({
    userId: input.userId,
    orgId: input.orgId,
    workspaceId: input.workspaceId,
    kind: "epoch.mission.created",
    label: `Mission ${mission.title} created`,
    subjectId: mission.id,
    payload: { missionId: mission.id, institutionId: input.institutionId },
  });

  return mission;
}

export async function updateEpochMission(
  workspaceId: string,
  missionId: string,
  input: UpdateEpochMissionInput,
) {
  const current = await prisma.epochMission.findFirst({ where: { id: missionId, workspaceId } });
  if (!current) return null;

  if (input.state !== undefined && !((input.allowRetry && current.state === "failed" && (input.state === "draft" || input.state === "waiting_review")) || (input.allowRestore && current.state === "draft"))) {
    assertMissionTransition(current.state as EpochMissionState, input.state);
  }

  const currentLoop = missionLoopFromProof(current.proof);
  const loopChanged = input.objective !== undefined || input.acceptanceCriteria !== undefined || input.plan !== undefined;
  const nextLoop = loopChanged
    ? buildMissionLoopMetadata({
        objective: input.objective ?? current.objective,
        acceptanceCriteria: input.acceptanceCriteria ?? currentLoop?.acceptanceCriteria,
        plan: input.plan ?? (Array.isArray(current.plan) ? current.plan as string[] : undefined),
        previous: currentLoop ?? undefined,
      })
    : null;

  const mission = await prisma.epochMission.update({
    where: { id: current.id },
    data: {
      ...(input.state !== undefined ? { state: input.state } : {}),
      ...(input.objective !== undefined ? { objective: input.objective } : {}),
      ...(input.currentStep !== undefined ? { currentStep: input.currentStep } : {}),
      ...(input.plan !== undefined ? { plan: json(input.plan) } : {}),
      ...(input.result !== undefined ? { result: json(input.result) } : {}),
      ...(input.timeline !== undefined ? { timeline: json(input.timeline) } : {}),
      ...(nextLoop
        ? { proof: json({ ...(current.proof as Record<string, unknown>), ...(input.proof ?? {}), missionLoop: nextLoop }) }
        : input.proof !== undefined
          ? { proof: json(input.proof) }
          : {}),
      ...(input.startedAt !== undefined ? { startedAt: input.startedAt } : {}),
      ...(input.completedAt !== undefined ? { completedAt: input.completedAt } : {}),
      ...(input.budgetCents !== undefined ? { budgetCents: input.budgetCents } : {}),
    } as any,
  });
  emitEpochRuntimeEvent({
    userId: current.userId,
    orgId: current.orgId ?? undefined,
    workspaceId,
    kind: "epoch.mission.updated",
    label: `Mission ${current.title} updated`,
    subjectId: current.id,
    payload: { missionId: current.id, state: input.state ?? current.state },
  });
  return mission;
}

function missionLoopFromProof(proof: unknown): MissionLoopMetadata | null {
  if (!proof || typeof proof !== "object") return null;
  const loop = (proof as Record<string, unknown>).missionLoop;
  if (!loop || typeof loop !== "object") return null;
  return loop as MissionLoopMetadata;
}

export async function updateEpochExecutionCheckpoint(input: {
  workspaceId: string;
  missionId: string;
  executionRunId?: string;
  userId: string;
  stepId: string;
  status: "started" | "completed" | "failed";
  attempt?: number;
  evidenceIds?: string[];
}) {
  const mission = await prisma.epochMission.findFirst({ where: { id: input.missionId, workspaceId: input.workspaceId } });
  if (!mission) return null;
  const currentLoop = missionLoopFromProof(mission.proof) ?? buildMissionLoopMetadata({ objective: mission.objective, plan: Array.isArray(mission.plan) ? mission.plan as string[] : undefined });
  const nextLoop = recordMissionCheckpoint(currentLoop, {
    stepId: input.stepId,
    status: input.status,
    attempt: Math.max(1, input.attempt ?? 1),
    evidenceIds: input.evidenceIds ?? [],
  });
  const nextProof = { ...(mission.proof as Record<string, unknown>), missionLoop: nextLoop, lastCheckpoint: nextLoop.checkpoints[nextLoop.checkpoints.length - 1] };
  const updated = await prisma.epochMission.update({ where: { id: mission.id }, data: { proof: json(nextProof), currentStep: input.stepId } as any });
  if (input.executionRunId) {
    const execution = await prisma.epochExecutionRun.findFirst({ where: { id: input.executionRunId, missionId: mission.id, workspaceId: input.workspaceId } });
    if (execution) {
      await prisma.epochExecutionRun.update({
        where: { id: execution.id },
        data: {
          proof: json({ ...(execution.proof as Record<string, unknown>), checkpoint: nextLoop.checkpoints[nextLoop.checkpoints.length - 1] }),
          logs: json([...(Array.isArray(execution.logs) ? execution.logs : []), nextLoop.checkpoints[nextLoop.checkpoints.length - 1]]),
        } as any,
      });
    }
  }
  emitEpochRuntimeEvent({ userId: input.userId, workspaceId: input.workspaceId, kind: "epoch.mission.updated", label: `Checkpoint ${input.stepId} ${input.status}`, subjectId: mission.id, payload: { missionId: mission.id, executionRunId: input.executionRunId ?? null, checkpoint: nextLoop.checkpoints[nextLoop.checkpoints.length - 1] } });
  return updated;
}

export async function requestEpochMissionCancellation(input: { workspaceId: string; missionId: string; reason?: string }) {
  const mission = await prisma.epochMission.findFirst({ where: { id: input.missionId, workspaceId: input.workspaceId } });
  if (!mission) return null;
  const currentLoop = missionLoopFromProof(mission.proof) ?? buildMissionLoopMetadata({ objective: mission.objective, plan: Array.isArray(mission.plan) ? mission.plan as string[] : undefined });
  return requestMissionCancellation(currentLoop, input.reason);
}

export function isEpochMissionCancelled(proof: unknown): boolean {
  return Boolean(missionLoopFromProof(proof)?.cancellation.requested || (proof as Record<string, unknown> | null)?.cancelled === true);
}

export async function appendEpochEvidence(input: {
  workspaceId: string;
  missionId: string;
  executionRunId?: string;
  userId: string;
  evidence: EpochEvidenceInput[];
  db?: EpochDbClient;
}) {
  if (input.evidence.length === 0) return [];

  const missionForEvidence = await (input.db ?? prisma).epochMission.findFirst({
    where: { id: input.missionId, workspaceId: input.workspaceId },
    select: { proof: true },
  });
  if (isEpochMissionCancelled(missionForEvidence?.proof)) {
    throw new Error("epoch_mission_cancelled");
  }

  const client = input.db ?? prisma;
  const writes = input.evidence.map((item) =>
    client.epochEvidence.create({
      data: {
        workspaceId: input.workspaceId,
        missionId: input.missionId,
        executionRunId: input.executionRunId,
        userId: input.userId,
        kind: item.kind,
        url: item.url,
        filePath: item.filePath,
        contentType: item.contentType,
        summary: item.summary ?? "",
        payload: json(item.payload ?? {}),
        proof: json(buildEvidenceIntegrityProof({
          kind: item.kind,
          url: item.url,
          filePath: item.filePath,
          contentType: item.contentType,
          summary: item.summary ?? "",
          payload: item.payload ?? {},
        }, item.proof)),
      } as any,
    }),
  );
  const records = input.db ? await Promise.all(writes) : await prisma.$transaction(writes);
  await Promise.all(
    records.map((record, index) =>
      saveEpochArtifact({
        workspaceId: input.workspaceId,
        institutionId: undefined,
        missionId: input.missionId,
        category: "evidence",
        name: `mission:${input.missionId}:evidence:${record.id}`,
        summary: input.evidence[index]?.summary ?? record.summary,
        mimeType: input.evidence[index]?.contentType,
        url: input.evidence[index]?.url,
        filePath: input.evidence[index]?.filePath,
        payload: {
          evidenceId: record.id,
          kind: record.kind,
          summary: record.summary,
          proof: record.proof,
        },
        proof: {
          evidenceId: record.id,
          executionRunId: record.executionRunId,
        },
      }),
    ),
  );
  emitEpochRuntimeEvent({
    userId: input.userId,
    workspaceId: input.workspaceId,
    kind: "epoch.evidence.recorded",
    label: `Recorded ${records.length} evidence item(s)`,
    subjectId: input.missionId,
    payload: { missionId: input.missionId, evidenceCount: records.length },
  });
  return records;
}

export async function runEpochVerification(input: {
  workspaceId: string;
  missionId: string;
  executionRunId?: string;
  userId: string;
  orgId?: string;
  evidence?: { id: string }[];
  checklist?: string[];
  humanApproval?: "approved" | "rejected" | "review";
  confidence?: number;
  output?: Record<string, unknown>;
  approvals?: string[];
  db?: EpochDbClient;
}) {
  const client = input.db ?? prisma;
  const mission = await client.epochMission.findFirst({
    where: { id: input.missionId, workspaceId: input.workspaceId },
    include: {
      authorityPolicies: { orderBy: { updatedAt: "desc" }, take: 1 },
      evidence: { orderBy: { createdAt: "asc" } },
      executionRun: true,
    },
  });
  if (!mission) return null;
  if (isEpochMissionCancelled(mission.proof)) return null;

  const policy = mission.authorityPolicies[0] ?? null;
  const requestedEvidenceIds = input.evidence?.map((item: { id: string }) => item.id);
  const evidence = requestedEvidenceIds
    ? mission.evidence.filter((item: { id: string }) => requestedEvidenceIds.includes(item.id))
    : mission.evidence;
  const checklist = input.checklist ?? ["Mission defined", "Authority validated", "Evidence collected", "Human review completed"];
  const evidenceIntegrity: Array<{ id: string; valid: boolean; legacy: boolean }> = evidence.map((item: any) => ({
    id: item.id,
    ...verifyEvidenceIntegrity({
      kind: item.kind,
      url: item.url,
      filePath: item.filePath,
      contentType: item.contentType,
      summary: item.summary,
      payload: item.payload,
      proof: item.proof,
    }),
  }));
  const missingEvidenceIds = (requestedEvidenceIds ?? []).filter((id) => !evidence.some((item: { id: string }) => item.id === id));
  const evidenceValidation = {
    pass: evidence.length > 0 && missingEvidenceIds.length === 0 && evidenceIntegrity.every((item) => item.valid),
    evidenceCount: evidence.length,
    checkedEvidence: evidence.map((item: { id: string }) => item.id),
    missingEvidenceIds,
    tamperedEvidenceIds: evidenceIntegrity.filter((item) => !item.valid).map((item) => item.id),
    legacyEvidenceIds: evidenceIntegrity.filter((item) => item.legacy).map((item) => item.id),
  };
  const approval = input.humanApproval ?? (policy?.needsApproval ? "review" : "approved");
  const policyValidation = {
    pass: Boolean(policy && !policy.blocked && (policy.canExecute || approval === "approved")),
    blocked: Boolean(policy?.blocked),
    needsApproval: Boolean(policy?.needsApproval),
    permissions: policy?.permissions ?? [],
    budgets: policy?.budgets ?? {},
  };
  const confidence = input.confidence ?? Math.max(25, Math.min(100, 50 + evidence.length * 12 + (policy?.canExecute ? 10 : 0)));
  const finalDecision = coerceDecision(
    policy?.blocked ? "FAIL" : approval === "rejected" ? "FAIL" : evidenceValidation.pass && policyValidation.pass && confidence >= 70 ? "PASS" : "REVIEW",
    "REVIEW",
  );
  const assurance: EpochAssuranceResult = finalDecision === "PASS" ? "PASS" : finalDecision === "FAIL" ? "FAIL" : "UNKNOWN";
  const assuranceReport = buildEpochAssuranceReport({
    missionId: mission.id,
    decision: assurance,
    confidence,
    checklist,
    evidenceValidation,
    policyValidation,
    approval,
  });

  if (mission.verificationRun) {
    return {
      ...mission.verificationRun,
      assurance: mission.verificationRun.finalDecision === "PASS"
        ? "PASS"
        : mission.verificationRun.finalDecision === "FAIL"
          ? "FAIL"
          : "UNKNOWN",
    };
  }

  let verificationRun: any = null;
  try {
    verificationRun = await client.epochVerificationRun.create({
      data: {
        workspaceId: input.workspaceId,
        missionId: mission.id,
        executionRunId: input.executionRunId ?? mission.executionRun?.id,
        userId: input.userId,
        orgId: input.orgId,
        checklist: json(checklist),
        evidenceIds: json(evidence.map((item: { id: string }) => item.id)),
        evidenceValidation: json(evidenceValidation),
        policyValidation: json(policyValidation),
        confidence,
        finalDecision,
        output: json({
          ...(input.output ?? {
            missionId: mission.id,
            title: mission.title,
            objective: mission.objective,
            evidenceCount: evidence.length,
            confidence,
            assurance,
          }),
          assuranceReport,
        }),
        proof: json({
          checkedAt: new Date().toISOString(),
          missionId: mission.id,
          assurance,
          assuranceReport,
        }),
      } as any,
    });
  } catch (error) {
    if (!isPrismaUniqueConstraintError(error)) throw error;
    verificationRun = await client.epochVerificationRun.findFirst({
      where: { workspaceId: input.workspaceId, missionId: mission.id },
    });
    if (!verificationRun) throw error;
  }
  emitEpochRuntimeEvent({
    userId: input.userId,
    orgId: input.orgId,
    workspaceId: input.workspaceId,
    kind: "epoch.verification.completed",
    label: `Verification ${verificationRun.finalDecision}`,
    subjectId: mission.id,
    payload: { missionId: mission.id, verificationRunId: verificationRun.id, finalDecision: verificationRun.finalDecision, assurance },
  });
  verificationRun.assurance = assurance;
  return verificationRun;
}

export async function issueEpochCertificate(input: {
  workspaceId: string;
  missionId: string;
  verificationRunId?: string;
  userId: string;
  orgId?: string;
  summary?: string;
  approvals?: string[];
  evidenceSummary?: Record<string, unknown>;
  auditTrail?: Record<string, unknown>[];
  proof?: Record<string, unknown>;
  db?: EpochDbClient;
}) {
  const client = input.db ?? prisma;
  const verification = await client.epochVerificationRun.findFirst({
    where: {
      missionId: input.missionId,
      ...(input.verificationRunId ? { id: input.verificationRunId } : {}),
      workspaceId: input.workspaceId,
    },
  });
  if (!verification) return null;

  const data = {
    workspaceId: input.workspaceId,
    missionId: input.missionId,
    verificationRunId: verification.id,
    userId: input.userId,
    orgId: input.orgId,
    status: verification.finalDecision,
    summary:
      input.summary ?? `Mission ${verification.finalDecision.toLowerCase()} with confidence ${verification.confidence}%`,
    evidenceSummary: json(
      input.evidenceSummary ?? {
        evidenceCount: Array.isArray(verification.evidenceIds) ? verification.evidenceIds.length : 0,
        finalDecision: verification.finalDecision,
      },
    ),
    approvals: json(input.approvals ?? []),
    auditTrail: json(
      input.auditTrail ?? [
        timelineEvent("verification", "completed", "Verification completed", {
          confidence: verification.confidence,
        }),
      ],
    ),
    proof: json({
      verificationRunId: verification.id,
      finalDecision: verification.finalDecision,
      ...(input.proof ?? {}),
    }),
    issuedAt: new Date(),
  } as any;

  if (input.missionId) {
    const certificate = await client.epochCertificate.upsert({
      where: { missionId: input.missionId },
      create: data,
      update: data,
    });
    await saveEpochArtifact({
      workspaceId: input.workspaceId,
      missionId: input.missionId,
      category: "certificate",
      name: `mission:${input.missionId}:certificate`,
      summary: certificate.summary,
      payload: {
        certificateId: certificate.id,
        status: certificate.status,
        evidenceSummary: certificate.evidenceSummary,
      },
      proof: {
        verificationRunId: certificate.verificationRunId,
      },
    });
    emitEpochRuntimeEvent({
      userId: input.userId,
      orgId: input.orgId,
      workspaceId: input.workspaceId,
      kind: "epoch.certificate.issued",
      label: "Mission certificate issued",
      subjectId: input.missionId,
      payload: { missionId: input.missionId, certificateId: certificate.id, status: certificate.status },
    });
    return certificate;
  }

  const certificate = await client.epochCertificate.create({ data });
  emitEpochRuntimeEvent({
    userId: input.userId,
    orgId: input.orgId,
    workspaceId: input.workspaceId,
    kind: "epoch.certificate.issued",
    label: "Mission certificate issued",
    subjectId: input.missionId,
    payload: { missionId: input.missionId, certificateId: certificate.id, status: certificate.status },
  });
  return certificate;
}

export async function recordEpochMemory(input: {
  workspaceId: string;
  institutionId: string;
  missionId?: string;
  certificateId?: string;
  userId: string;
  orgId?: string;
  history?: Record<string, unknown>[];
  lessons?: string[];
  mistakes?: string[];
  suggestedImprovements?: string[];
  proof?: Record<string, unknown>;
  db?: EpochDbClient;
}) {
  const client = input.db ?? prisma;
  const data = {
    workspaceId: input.workspaceId,
    institutionId: input.institutionId,
    missionId: input.missionId,
    certificateId: input.certificateId,
    userId: input.userId,
    orgId: input.orgId,
    history: json(input.history ?? []),
    lessons: json(input.lessons ?? []),
    mistakes: json(input.mistakes ?? []),
    suggestedImprovements: json(input.suggestedImprovements ?? []),
    proof: json(input.proof ?? {}),
  } as any;

  if (input.missionId) {
    const memory = await client.epochMemoryRecord.upsert({
      where: { missionId: input.missionId },
      create: data,
      update: data,
    });
    emitEpochRuntimeEvent({
      userId: input.userId,
      orgId: input.orgId,
      workspaceId: input.workspaceId,
      kind: "epoch.memory.recorded",
      label: "Institution memory recorded",
      subjectId: input.missionId,
      payload: { missionId: input.missionId, memoryRecordId: memory.id },
    });
    return memory;
  }

  const memory = await client.epochMemoryRecord.create({ data });
  emitEpochRuntimeEvent({
    userId: input.userId,
    orgId: input.orgId,
    workspaceId: input.workspaceId,
    kind: "epoch.memory.recorded",
    label: "Institution memory recorded",
    subjectId: input.institutionId,
    payload: { institutionId: input.institutionId, memoryRecordId: memory.id },
  });
  return memory;
}

export async function runEpochMission(input: {
  workspaceId: string;
  missionId: string;
  userId: string;
  orgId?: string;
  evidence?: EpochEvidenceInput[];
  checklist?: string[];
  humanApproval?: "approved" | "rejected" | "review";
  confidence?: number;
  output?: Record<string, unknown>;
  approvals?: string[];
  notes?: string;
}) {
  const gate = await getEpochAuthorityGate(input.workspaceId, input.missionId);
  if (!gate) return null;
  if (gate.blocked) {
    assertMissionTransition(gate.mission.state as EpochMissionState, "failed");
    const blockedMission = await prisma.epochMission.update({
      where: { id: gate.mission.id },
      data: {
        state: "failed",
        currentStep: "blocked",
        completedAt: new Date(),
        timeline: json([
          ...(Array.isArray(gate.mission.timeline) ? gate.mission.timeline : []),
          timelineEvent("authority", "blocked", "Mission blocked by policy", {
            missionId: gate.mission.id,
            policyId: gate.policy?.id ?? null,
          }),
        ]),
        proof: json({
          ...(gate.mission.proof as Record<string, unknown>),
          blockedByPolicy: true,
          policyId: gate.policy?.id ?? null,
        }),
      } as any,
    });
    emitEpochRuntimeEvent({
      userId: input.userId,
      orgId: input.orgId,
      workspaceId: input.workspaceId,
      kind: "epoch.mission.failed",
      label: `Mission ${gate.mission.title} blocked by policy`,
      subjectId: gate.mission.id,
      payload: {
        missionId: gate.mission.id,
        policyId: gate.policy?.id ?? null,
        reason: gate.reason,
      },
    });
    return {
      blocked: true as const,
      reason: gate.reason,
      gate,
      mission: blockedMission,
    };
  }
  if (gate.needsApproval && input.humanApproval !== "approved") {
    assertMissionTransition(gate.mission.state as EpochMissionState, "waiting_review");
    const reviewMission = await prisma.epochMission.update({
      where: { id: gate.mission.id },
      data: {
        state: "waiting_review",
        currentStep: "human_review",
        timeline: json([
          ...(Array.isArray(gate.mission.timeline) ? gate.mission.timeline : []),
          timelineEvent("authority", "review", "Mission requires human approval", {
            missionId: gate.mission.id,
            policyId: gate.policy?.id ?? null,
          }),
        ]),
        proof: json({
          ...(gate.mission.proof as Record<string, unknown>),
          approvalRequired: true,
          policyId: gate.policy?.id ?? null,
        }),
      } as any,
    });
    emitEpochRuntimeEvent({
      userId: input.userId,
      orgId: input.orgId,
      workspaceId: input.workspaceId,
      kind: "epoch.mission.updated",
      label: `Mission ${gate.mission.title} awaiting approval`,
      subjectId: gate.mission.id,
      payload: {
        missionId: gate.mission.id,
        policyId: gate.policy?.id ?? null,
        reason: gate.reason,
      },
    });
    return {
      approvalRequired: true as const,
      reason: gate.reason,
      gate,
      mission: reviewMission,
    };
  }

  if (gate.mission.executionRun || gate.mission.verificationRun || gate.mission.certificate) {
    return {
      idempotent: true as const,
      mission: gate.mission,
      execution: gate.mission.executionRun ?? null,
      evidence: gate.mission.evidence ?? [],
      verification: gate.mission.verificationRun ?? null,
      certificate: gate.mission.certificate ?? null,
      memoryRecord: gate.mission.memoryRecord ?? null,
    };
  }

  return prisma.$transaction(async (db) => {
    const mission = await db.epochMission.findFirst({
      where: { id: input.missionId, workspaceId: input.workspaceId },
      include: {
        institution: true,
        authorityPolicies: { orderBy: { updatedAt: "desc" }, take: 1 },
        evidence: true,
      },
    });
    if (!mission) return null;

    const policy = mission.authorityPolicies[0] ?? null;
    const plan = Array.isArray(mission.plan) && mission.plan.length > 0 ? mission.plan : missionPlanFromObjective(mission.objective);
    const startedAt = new Date();

    const execution = await db.epochExecutionRun.create({
      data: {
        workspaceId: input.workspaceId,
        missionId: mission.id,
        userId: input.userId,
        orgId: input.orgId,
        status: "running",
        planner: json({ stage: "planner", missionId: mission.id, plan }),
        executor: json({ stage: "executor", status: "running" }),
        reviewer: json({ stage: "reviewer", status: "pending" }),
        human: json({ stage: "human", status: input.humanApproval ?? "review" }),
        logs: json([
          timelineEvent("planner", "started", "Planner assembled the mission plan"),
          timelineEvent("executor", "started", "Executor began work"),
        ]),
        proof: json({
          missionObjective: mission.objective,
          policyId: policy?.id ?? null,
        }),
      } as any,
    });

    assertMissionTransition(mission.state as EpochMissionState, "running");
    await db.epochMission.update({
      where: { id: mission.id },
      data: {
        state: "running",
        currentStep: "executor",
        startedAt,
      },
    });

    emitEpochRuntimeEvent({
      userId: input.userId,
      orgId: input.orgId,
      workspaceId: input.workspaceId,
      kind: "epoch.mission.running",
      label: `Mission ${mission.title} running`,
      subjectId: mission.id,
      payload: { missionId: mission.id, executionRunId: execution.id, planLength: plan.length },
    });

    const evidence = await appendEpochEvidence({
      workspaceId: input.workspaceId,
      missionId: mission.id,
      executionRunId: execution.id,
      userId: input.userId,
      db,
      evidence:
        input.evidence && input.evidence.length > 0
          ? input.evidence
          : [
              {
                kind: "mission_summary",
                summary: `Mission executed for ${mission.title}`,
                payload: { objective: mission.objective, plan },
                proof: { generated: true },
              },
            ],
    });

    const verification = await runEpochVerification({
      workspaceId: input.workspaceId,
      missionId: mission.id,
      executionRunId: execution.id,
      userId: input.userId,
      orgId: input.orgId,
      db,
      evidence,
      checklist: input.checklist,
      humanApproval: input.humanApproval,
      confidence: input.confidence,
      output: input.output ?? {
        missionId: mission.id,
        title: mission.title,
        objective: mission.objective,
        evidenceCount: evidence.length,
        executor: "epoch-runtime",
      },
      approvals: input.approvals,
    });

    if (!verification) return null;

    const certificate = await issueEpochCertificate({
      workspaceId: input.workspaceId,
      missionId: mission.id,
      verificationRunId: verification.id,
      userId: input.userId,
      orgId: input.orgId,
      db,
      approvals: input.approvals ?? [],
      auditTrail: [
        timelineEvent("execution", "completed", "Execution completed", { executionRunId: execution.id }),
        timelineEvent("verification", "completed", "Verification completed", {
          verificationRunId: verification.id,
          decision: verification.finalDecision,
        }),
      ],
      evidenceSummary: {
        evidenceCount: evidence.length,
        evidenceIds: evidence.map((item) => item.id),
        decision: verification.finalDecision,
      },
      proof: {
        executionRunId: execution.id,
        verificationRunId: verification.id,
      },
    });

    const memoryRecord = await recordEpochMemory({
      workspaceId: input.workspaceId,
      institutionId: mission.institutionId,
      missionId: mission.id,
      certificateId: certificate?.id,
      userId: input.userId,
      orgId: input.orgId,
      db,
      history: [
        {
          missionId: mission.id,
          title: mission.title,
          objective: mission.objective,
          decision: verification.finalDecision,
        },
      ],
      lessons: [
        verification.finalDecision === "PASS"
          ? "Institution run produced a verified certificate."
          : "Institution run needs tighter authority or more evidence.",
      ],
      mistakes:
        verification.finalDecision === "FAIL"
          ? ["Policy blocked the mission or execution failed verification."]
          : [],
      suggestedImprovements: [
        verification.finalDecision === "PASS"
          ? "Promote this mission into the next institution template version."
          : "Strengthen the authority policy and evidence checklist before rerun.",
      ],
      proof: {
        certificateId: certificate?.id ?? null,
        verificationRunId: verification.id,
      },
    });

    const finalState: EpochMissionState =
      verification.finalDecision === "PASS"
        ? "completed"
        : verification.finalDecision === "FAIL"
          ? "failed"
          : "waiting_review";

    const timeline = [
      ...(Array.isArray(mission.timeline) ? mission.timeline : []),
      timelineEvent("execution", "completed", "Execution completed", { executionRunId: execution.id }),
      timelineEvent("verification", "completed", "Verification completed", {
        verificationRunId: verification.id,
        decision: verification.finalDecision,
      }),
      timelineEvent("certificate", "issued", "Mission certificate issued", {
        certificateId: certificate?.id ?? null,
      }),
    ];

    const updatedMission = await db.epochMission.update({
      where: { id: mission.id },
      data: {
        state: finalState,
        currentStep: finalState === "waiting_review" ? "human_review" : "closed",
        startedAt,
        completedAt: new Date(),
        timeline: json(timeline),
        plan: json(plan),
        result: json({
          executionRunId: execution.id,
          verificationRunId: verification.id,
          certificateId: certificate?.id ?? null,
          memoryRecordId: memoryRecord.id,
          decision: verification.finalDecision,
        }),
        proof: json({
          executionRunId: execution.id,
          verificationRunId: verification.id,
          certificateId: certificate?.id ?? null,
          memoryRecordId: memoryRecord.id,
        }),
      } as any,
    });

    await db.epochExecutionRun.update({
      where: { id: execution.id },
      data: {
        status: finalState,
        executor: json({
          ...((execution.executor && typeof execution.executor === "object") ? execution.executor : {}),
          stage: "executor",
          status: finalState === "failed" ? "failed" : "completed",
        }),
        reviewer: json({
          stage: "reviewer",
          status: verification.finalDecision,
        }),
        human: json({
          stage: "human",
          status: input.humanApproval ?? "review",
        }),
        logs: json([
          ...(Array.isArray(execution.logs) ? execution.logs : []),
          timelineEvent("human", "reviewed", "Human review completed", {
            decision: input.humanApproval ?? "review",
          }),
        ]),
        proof: json({
          ...(execution.proof as Record<string, unknown>),
          verificationRunId: verification.id,
          certificateId: certificate?.id ?? null,
        }),
        finishedAt: new Date(),
      } as any,
    });

    emitEpochRuntimeEvent({
      userId: input.userId,
      orgId: input.orgId,
      workspaceId: input.workspaceId,
      kind: verification.finalDecision === "PASS" ? "epoch.mission.completed" : "epoch.mission.failed",
      label: verification.finalDecision === "PASS" ? `Mission ${mission.title} completed` : `Mission ${mission.title} failed`,
      subjectId: mission.id,
      payload: {
        missionId: mission.id,
        executionRunId: execution.id,
        verificationRunId: verification.id,
        certificateId: certificate?.id ?? null,
        decision: verification.finalDecision,
      },
    });

    return {
      mission: updatedMission,
      execution,
      evidence,
      verification,
      certificate,
      memoryRecord,
    };
  });
}

export async function listEpochIntegrations(scope: { workspaceId: string }) {
  return prisma.epochIntegrationConnection.findMany({
    where: { workspaceId: scope.workspaceId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getEpochIntegration(workspaceId: string, integrationId: string) {
  return prisma.epochIntegrationConnection.findFirst({
    where: { id: integrationId, workspaceId },
    include: {
      institution: true,
    },
  });
}

export async function updateEpochIntegration(
  workspaceId: string,
  integrationId: string,
  input: {
    status?: string;
    environmentId?: string | null;
    config?: Record<string, unknown>;
    proof?: Record<string, unknown>;
    lastSyncAt?: Date | null;
  },
) {
  const current = await prisma.epochIntegrationConnection.findFirst({
    where: { id: integrationId, workspaceId },
  });
  if (!current) return null;

  const integration = await prisma.epochIntegrationConnection.update({
    where: { id: current.id },
    data: {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.environmentId !== undefined ? { environmentId: input.environmentId } : {}),
      ...(input.config !== undefined ? { config: json(input.config) } : {}),
      ...(input.proof !== undefined ? { proof: json(input.proof) } : {}),
      ...(input.lastSyncAt !== undefined ? { lastSyncAt: input.lastSyncAt } : {}),
    } as any,
  });

  emitEpochRuntimeEvent({
    userId: current.userId,
    orgId: current.orgId ?? undefined,
    workspaceId,
    kind: "epoch.integration.upserted",
    label: `Integration ${integration.name} updated`,
    subjectId: integration.id,
    payload: { integrationId: integration.id, provider: integration.provider, status: integration.status },
  });

  return integration;
}

export async function upsertEpochIntegration(input: {
  workspaceId: string;
  institutionId?: string;
  userId: string;
  orgId?: string;
  name: string;
  provider: string;
  status?: string;
  config?: Record<string, unknown>;
  proof?: Record<string, unknown>;
}) {
  const integration = await prisma.epochIntegrationConnection.create({
    data: {
      workspaceId: input.workspaceId,
      institutionId: input.institutionId,
      userId: input.userId,
      orgId: input.orgId,
      name: input.name,
      provider: input.provider,
      status: input.status ?? "connected",
      config: json(input.config ?? {}),
      proof: json(input.proof ?? {}),
      lastSyncAt: new Date(),
    } as any,
  });
  emitEpochRuntimeEvent({
    userId: input.userId,
    orgId: input.orgId,
    workspaceId: input.workspaceId,
    kind: "epoch.integration.upserted",
    label: `Integration ${input.name} connected`,
    subjectId: integration.id,
    payload: { integrationId: integration.id, provider: integration.provider, status: integration.status },
  });
  return integration;
}

export async function getEpochWorkspaceStatus(workspaceId: string) {
  const [institutions, templates, missions, evidence, verifications, certificates, memories, integrations] =
    await Promise.all([
      prisma.epochInstitution.count({ where: { workspaceId } }),
      prisma.epochInstitutionTemplate.count({ where: { workspaceId } }),
      prisma.epochMission.count({ where: { workspaceId } }),
      prisma.epochEvidence.count({ where: { workspaceId } }),
      prisma.epochVerificationRun.count({ where: { workspaceId } }),
      prisma.epochCertificate.count({ where: { workspaceId } }),
      prisma.epochMemoryRecord.count({ where: { workspaceId } }),
      prisma.epochIntegrationConnection.count({ where: { workspaceId } }),
    ]);

  return {
    institutions,
    templates,
    missions,
    evidence,
    verifications,
    certificates,
    memories,
    integrations,
  };
}
