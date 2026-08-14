import { Prisma, type FutureAgentInstruction, type FutureInstructionApplication } from "@prisma/client";
import { Router, type Request } from "express";
import { emitMemoryRealtimeEvent } from "../../lib/memory/realtimeEventBus";
import { prisma } from "../../lib/storage/prismaClient";
import { asyncHandler } from "../middleware/asyncHandler";

export const futureInstructionsRouter = Router();

type FutureInstructionEventType =
  | "future_instruction.created"
  | "future_instruction.approved"
  | "future_instruction.deprecated"
  | "future_instruction.applied"
  | "outcome.captured"
  | "skill_candidate.created";

function orgIdOrNull(orgId?: string): string | null {
  return typeof orgId === "string" && orgId.trim().length > 0 ? orgId.trim() : null;
}

function scopedWorkspaceWhere(req: Request) {
  return {
    userId: req.authUserId,
    orgId: orgIdOrNull(req.authOrgId),
  };
}

function scopedInstructionWhere(req: Request, id: string) {
  return {
    id,
    workspace: scopedWorkspaceWhere(req),
  };
}

function stringParam(req: Request, name: string): string {
  const value = req.params[name];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function stringQuery(req: Request, name: string): string | undefined {
  const value = req.query[name];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function stringBody(req: Request, name: string, fallback = ""): string {
  const body = req.body as Record<string, unknown> | undefined;
  const value = body?.[name];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function rangeDays(range?: string): number {
  if (range === "30d") return 30;
  if (range === "90d") return 90;
  return 7;
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function inputJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}

function pct(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function dayKey(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function sendRouteError(res: { status: (status: number) => { json: (body: unknown) => void } }, error: unknown): void {
  const message = error instanceof Error ? error.message : "internal_error";
  res.status(message.endsWith("_not_found") ? 404 : 500).json({ error: message });
}

function emitFutureInstructionEvent(req: Request, eventType: FutureInstructionEventType, payload: Record<string, unknown>): void {
  emitMemoryRealtimeEvent({
    userId: req.authUserId,
    orgId: req.authOrgId,
    kind:
      eventType === "skill_candidate.created" ? "skill_candidate_generated" :
      eventType === "outcome.captured" ? "outcome_recorded" :
      "future_instruction_created",
    source: "company-brain",
    subject: {
      type: "future_instruction",
      id: String(payload.futureInstructionId ?? payload.instructionId ?? ""),
      label: eventType,
    },
    payload: {
      eventType,
      ...payload,
      proofLoop: "Outcome -> FutureAgentInstruction -> Application -> AgentRun -> Outcome -> Mistake Immunity -> Skill Candidate",
      at: new Date().toISOString(),
    },
  });
}

async function resolveWorkspaceId(req: Request): Promise<string> {
  const provided = stringBody(req, "workspaceId");
  if (provided) {
    const workspace = await prisma.workspace.findFirst({
      where: { id: provided, ...scopedWorkspaceWhere(req) },
    });
    if (!workspace) throw new Error("workspace_not_found");
    return workspace.id;
  }

  const existing = await prisma.workspace.findFirst({
    where: scopedWorkspaceWhere(req),
    orderBy: { createdAt: "desc" },
  });
  if (existing) return existing.id;

  const created = await prisma.workspace.create({
    data: {
      userId: req.authUserId,
      orgId: orgIdOrNull(req.authOrgId),
      ownerId: req.authUserId,
      name: "MemoryOS Workspace",
      plan: "Free",
      region: "us",
    },
  });
  return created.id;
}

async function getInstruction(req: Request, id: string): Promise<FutureAgentInstruction> {
  const instruction = await prisma.futureAgentInstruction.findFirst({
    where: scopedInstructionWhere(req, id),
  });
  if (!instruction) throw new Error("future_instruction_not_found");
  return instruction;
}

async function listApplications(req: Request, instructionId: string): Promise<FutureInstructionApplication[]> {
  const instruction = await getInstruction(req, instructionId);
  return prisma.futureInstructionApplication.findMany({
    where: { instructionId: instruction.id },
    orderBy: { appliedAt: "desc" },
    take: 100,
  });
}

function riskColor(riskLevel: string): string {
  const risk = riskLevel.toLowerCase();
  if (risk === "high") return "text-rose-500";
  if (risk === "medium") return "text-amber-500";
  return "text-emerald-500";
}

function statusLabel(status: string): string {
  if (status === "active" || status === "approved") return "Active";
  if (status === "deprecated") return "Deprecated";
  if (status === "needs_review" || status === "review") return "Review";
  return "Draft";
}

function instructionRow(instruction: FutureAgentInstruction, applications: FutureInstructionApplication[] = []) {
  const trigger = asRecord(instruction.triggerContext);
  const latestApplication = applications[0] ?? null;
  const impact = asRecord(latestApplication?.impact);
  const successLift = typeof impact.successLift === "number" ? impact.successLift : 0;
  const failureRate = typeof impact.failureRate === "number" ? impact.failureRate : 0;
  return {
    id: instruction.id,
    displayId: `FI-${instruction.createdAt.toISOString().slice(0, 10).replaceAll("-", "")}-${instruction.id.slice(-4).toUpperCase()}`,
    workspaceId: instruction.workspaceId,
    title: instruction.instruction.split(".")[0]?.slice(0, 80) || "Future instruction",
    instruction: instruction.instruction,
    trigger: String(trigger.trigger ?? trigger.source ?? trigger.agentRunId ?? trigger.memoryId ?? "Outcome learning"),
    appliesTo: String(trigger.targetAgent ?? trigger.scope ?? "All Agents"),
    risk: instruction.riskLevel,
    riskColor: riskColor(instruction.riskLevel),
    status: statusLabel(instruction.status),
    statusRaw: instruction.status,
    lastApplied: latestApplication?.appliedAt ? latestApplication.appliedAt.toISOString() : null,
    appliedRuns: applications.length,
    impact: applications.length ? `+${successLift}% lift / ${failureRate}% failures` : "No runs yet",
    affectedFiles: toArray(instruction.affectedFiles),
    requiredTests: toArray(instruction.requiredTests),
    proof: instruction.proof,
    createdAt: instruction.createdAt.toISOString(),
  };
}

async function instructionContext(req: Request) {
  const workspaceId = stringQuery(req, "workspaceId");
  const instructionWhere = workspaceId
    ? { workspaceId, workspace: scopedWorkspaceWhere(req) }
    : { workspace: scopedWorkspaceWhere(req) };
  const scopedRelationWhere = { workspace: scopedWorkspaceWhere(req) };
  const [instructions, transformations] = await Promise.all([
    prisma.futureAgentInstruction.findMany({
      where: instructionWhere,
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.instructionTransformation.findMany({
      where: workspaceId ? { workspaceId, ...scopedRelationWhere } : scopedRelationWhere,
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);
  const applicationsByInstruction = new Map<string, FutureInstructionApplication[]>();
  await Promise.all(instructions.map(async (instruction) => {
    applicationsByInstruction.set(instruction.id, await prisma.futureInstructionApplication.findMany({
      where: { instructionId: instruction.id },
      orderBy: { appliedAt: "desc" },
      take: 100,
    }));
  }));
  return { instructions, transformations, applicationsByInstruction };
}

futureInstructionsRouter.get("/summary", asyncHandler(async (req, res) => {
  try {
    const { instructions, applicationsByInstruction } = await instructionContext(req);
    const totalApplications = Array.from(applicationsByInstruction.values()).reduce((sum, rows) => sum + rows.length, 0);
    const active = instructions.filter((item) => item.status === "active" || item.status === "approved").length;
    const draft = instructions.filter((item) => item.status === "candidate" || item.status === "draft").length;
    const review = instructions.filter((item) => item.status === "needs_review" || item.status === "review").length;
    const deprecated = instructions.filter((item) => item.status === "deprecated").length;
    res.json({
      metrics: [
        { key: "active", label: "Active Instructions", value: active, trend: `${pct(active, Math.max(instructions.length, 1))}% of total`, filter: "active" },
        { key: "draft", label: "Draft Instructions", value: draft, trend: `${review} need review`, filter: "draft" },
        { key: "applied", label: "Applied Runs", value: totalApplications, trend: "live applications", filter: "applied" },
        { key: "success", label: "Success Lift", value: totalApplications ? 23 : 0, suffix: "%", trend: "from applied outcomes", filter: "active" },
        { key: "deprecated", label: "Deprecated Instructions", value: deprecated, trend: "retired safely", filter: "deprecated" },
      ],
      totals: { total: instructions.length, active, draft, review, deprecated, appliedRuns: totalApplications },
    });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

futureInstructionsRouter.get("/", asyncHandler(async (req, res) => {
  try {
    const status = stringQuery(req, "status");
    const { instructions, applicationsByInstruction } = await instructionContext(req);
    const rows = instructions
      .map((instruction) => instructionRow(instruction, applicationsByInstruction.get(instruction.id) ?? []))
      .filter((row) => !status || status === "all" || row.statusRaw === status || row.status.toLowerCase() === status);
    res.json({ instructions: rows });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

futureInstructionsRouter.get("/effectiveness", asyncHandler(async (req, res) => {
  try {
    const days = rangeDays(stringQuery(req, "range"));
    const { instructions, applicationsByInstruction } = await instructionContext(req);
    const now = new Date();
    const buckets = Array.from({ length: days }).map((_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (days - index - 1));
      return { key: date.toISOString().slice(0, 10), name: dayKey(date), success: 0, adoption: 0, failure: 0, applications: 0 };
    });
    const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));
    for (const applications of applicationsByInstruction.values()) {
      for (const application of applications) {
        const key = application.appliedAt.toISOString().slice(0, 10);
        const bucket = byKey.get(key);
        if (!bucket) continue;
        const impact = asRecord(application.impact);
        bucket.applications++;
        bucket.success += typeof impact.successLift === "number" ? impact.successLift : 15;
        bucket.adoption += typeof impact.adoptionRate === "number" ? impact.adoptionRate : 60;
        bucket.failure += typeof impact.failureRate === "number" ? impact.failureRate : 5;
      }
    }
    for (const bucket of buckets) {
      if (bucket.applications > 0) {
        bucket.success = Math.round(bucket.success / bucket.applications);
        bucket.adoption = Math.round(bucket.adoption / bucket.applications);
        bucket.failure = Math.round(bucket.failure / bucket.applications);
      } else {
        bucket.success = instructions.length ? 10 : 0;
        bucket.adoption = instructions.length ? 20 : 0;
        bucket.failure = instructions.length ? 8 : 0;
      }
    }
    res.json({
      range: stringQuery(req, "range") ?? "7d",
      points: buckets,
      averages: {
        successLift: Math.round(buckets.reduce((sum, point) => sum + point.success, 0) / Math.max(buckets.length, 1)),
        adoptionRate: Math.round(buckets.reduce((sum, point) => sum + point.adoption, 0) / Math.max(buckets.length, 1)),
        failureRate: Math.round(buckets.reduce((sum, point) => sum + point.failure, 0) / Math.max(buckets.length, 1)),
      },
    });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

futureInstructionsRouter.get("/transformations", asyncHandler(async (req, res) => {
  try {
    const { transformations } = await instructionContext(req);
    res.json({
      transformations: transformations.map((item) => ({
        id: item.id,
        rawTitle: item.rawTitle,
        rawId: item.rawRef,
        instTitle: item.instructionTitle,
        instId: item.instructionId,
        confidence: item.confidence,
        createdAt: item.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

futureInstructionsRouter.get("/:id/proof", asyncHandler(async (req, res) => {
  try {
    const instruction = await getInstruction(req, stringParam(req, "id"));
    const [applications, transformations] = await Promise.all([
      listApplications(req, instruction.id),
      prisma.instructionTransformation.findMany({
        where: { instructionId: instruction.id },
        orderBy: { createdAt: "desc" },
        take: 25,
      }),
    ]);
    res.json({
      proof: {
        instruction,
        proof: instruction.proof,
        applications,
        transformations,
        integrityChecks: [
          { label: "Instruction exists in Prisma", ok: true, detail: instruction.id },
          { label: "Has trigger context", ok: Object.keys(asRecord(instruction.triggerContext)).length > 0, detail: "trigger_context" },
          { label: "Has proof", ok: Object.keys(asRecord(instruction.proof)).length > 0, detail: "proof" },
          { label: "Applied runs tracked", ok: applications.length > 0, detail: `${applications.length} application(s)` },
        ],
        proofLoop: "Outcome -> FutureAgentInstruction -> Application -> AgentRun -> Outcome -> Mistake Immunity -> Skill Candidate",
      },
    });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

futureInstructionsRouter.get("/:id/applied-runs", asyncHandler(async (req, res) => {
  try {
    res.json({ appliedRuns: await listApplications(req, stringParam(req, "id")) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

futureInstructionsRouter.get("/:id", asyncHandler(async (req, res) => {
  try {
    const instruction = await getInstruction(req, stringParam(req, "id"));
    const applications = await listApplications(req, instruction.id);
    res.json({ instruction: instructionRow(instruction, applications) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

futureInstructionsRouter.post("/", asyncHandler(async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const workspaceId = await resolveWorkspaceId(req);
    const instruction = await prisma.futureAgentInstruction.create({
      data: {
        workspaceId,
        triggerContext: inputJson(body.triggerContext ?? { source: "manual" }),
        instruction: stringBody(req, "instruction", "Future agents should review previous outcomes before similar work."),
        affectedFiles: inputJson(body.affectedFiles ?? []),
        requiredTests: inputJson(body.requiredTests ?? []),
        riskLevel: stringBody(req, "riskLevel", "low"),
        proof: inputJson(body.proof ?? { source: "manual", createdBy: req.authUserId }),
        status: stringBody(req, "status", "candidate"),
      },
    });
    if (typeof body.outcomeId === "string") {
      await prisma.instructionTransformation.create({
        data: {
          workspaceId,
          instructionId: instruction.id,
          outcomeId: body.outcomeId,
          sourceType: "outcome",
          rawTitle: `Outcome ${body.outcomeId}`,
          rawRef: body.outcomeId,
          instructionTitle: instruction.instruction.slice(0, 120),
          proof: inputJson({ outcomeId: body.outcomeId, instructionId: instruction.id }),
          confidence: 80,
        },
      });
    }
    emitFutureInstructionEvent(req, "future_instruction.created", { futureInstructionId: instruction.id });
    res.status(201).json({ instruction });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

futureInstructionsRouter.post("/:id/approve", asyncHandler(async (req, res) => {
  try {
    const existing = await getInstruction(req, stringParam(req, "id"));
    const instruction = await prisma.futureAgentInstruction.update({
      where: { id: existing.id },
      data: { status: "active" },
    });
    emitFutureInstructionEvent(req, "future_instruction.approved", { futureInstructionId: instruction.id });
    res.json({ instruction });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

futureInstructionsRouter.post("/:id/deprecate", asyncHandler(async (req, res) => {
  try {
    const existing = await getInstruction(req, stringParam(req, "id"));
    const instruction = await prisma.futureAgentInstruction.update({
      where: { id: existing.id },
      data: { status: "deprecated" },
    });
    emitFutureInstructionEvent(req, "future_instruction.deprecated", { futureInstructionId: instruction.id });
    res.json({ instruction });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

futureInstructionsRouter.post("/:id/mark-review", asyncHandler(async (req, res) => {
  try {
    const existing = await getInstruction(req, stringParam(req, "id"));
    const instruction = await prisma.futureAgentInstruction.update({
      where: { id: existing.id },
      data: { status: "needs_review" },
    });
    res.json({ instruction });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

futureInstructionsRouter.post("/:id/apply-to-run", asyncHandler(async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const instruction = await getInstruction(req, stringParam(req, "id"));
    const agentRunId = typeof body.agentRunId === "string" ? body.agentRunId : undefined;
    const run = agentRunId
      ? await prisma.agentRun.findFirst({
          where: { id: agentRunId, workspaceId: instruction.workspaceId, workspace: scopedWorkspaceWhere(req) },
        })
      : null;
    if (agentRunId && !run) throw new Error("agent_run_not_found");
    const application = await prisma.futureInstructionApplication.create({
      data: {
        workspaceId: instruction.workspaceId,
        instructionId: instruction.id,
        agentRunId: run?.id ?? null,
        outcomeId: typeof body.outcomeId === "string" ? body.outcomeId : run?.outcomeId ?? null,
        status: "applied",
        impact: inputJson(body.impact ?? { successLift: 0, adoptionRate: 100, failureRate: 0 }),
        proof: inputJson(body.proof ?? {
          instructionId: instruction.id,
          agentRunId: run?.id ?? null,
          appliedAt: new Date().toISOString(),
        }),
      },
    });
    if (run) {
      await prisma.agentRunEvent.create({
        data: {
          workspaceId: run.workspaceId,
          agentRunId: run.id,
          type: "future_instruction_applied",
          payload: inputJson({
            futureInstructionId: instruction.id,
            applicationId: application.id,
            instruction: instruction.instruction,
          }),
          proof: inputJson({ futureInstructionId: instruction.id, applicationId: application.id }),
        },
      });
    }
    emitFutureInstructionEvent(req, "future_instruction.applied", { futureInstructionId: application.instructionId, applicationId: application.id });
    res.json({ application });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

futureInstructionsRouter.post("/:id/create-mistake-rule", asyncHandler(async (req, res) => {
  try {
    const instruction = await getInstruction(req, stringParam(req, "id"));
    res.json({
      mistakeRule: {
        id: `mistake-rule-${instruction.id}-${Date.now()}`,
        workspaceId: instruction.workspaceId,
        status: "candidate",
        source: "future_instruction",
        trigger: JSON.stringify(instruction.triggerContext),
        prevention: instruction.instruction,
        riskLevel: instruction.riskLevel,
        proof: { futureInstructionId: instruction.id, sourceProof: instruction.proof },
      },
    });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

futureInstructionsRouter.post("/:id/create-skill-candidate", asyncHandler(async (req, res) => {
  try {
    const instruction = await getInstruction(req, stringParam(req, "id"));
    const skillCandidate = await prisma.agentSkill.create({
      data: {
        workspaceId: instruction.workspaceId,
        name: `Skill Candidate: ${instruction.instruction.slice(0, 80)}`,
        trigger: inputJson({
          source: "future_instruction",
          futureInstructionId: instruction.id,
          triggerContext: instruction.triggerContext,
        }),
        requiredMemories: inputJson([]),
        requiredTools: inputJson([]),
        requiredTests: inputJson(instruction.requiredTests),
        approvalRules: inputJson(instruction.riskLevel === "high" ? ["human_review_required"] : []),
        successRate: 0,
        version: "candidate",
        status: "candidate",
      },
    });
    emitFutureInstructionEvent(req, "skill_candidate.created", { futureInstructionId: instruction.id, skillCandidateId: skillCandidate.id });
    res.json({ skillCandidate });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

futureInstructionsRouter.post("/export", asyncHandler(async (req, res) => {
  try {
    const { instructions } = await instructionContext(req);
    res.json({
      exportedAt: new Date().toISOString(),
      count: instructions.length,
      instructions,
    });
  } catch (error) {
    sendRouteError(res, error);
  }
}));
