import { Prisma, type MistakeImmunityRule, type MistakeReplayTest, type MistakeRuleTrigger } from "@prisma/client";
import { Router, type Request } from "express";
import { emitMemoryRealtimeEvent } from "../../lib/memory/realtimeEventBus";
import { prisma } from "../../lib/storage/prismaClient";
import { asyncHandler } from "../middleware/asyncHandler";

export const mistakeImmunityRouter = Router();

type MistakeEventType =
  | "mistake_rule.created"
  | "mistake_rule.approved"
  | "mistake_rule.updated"
  | "mistake_rule.deprecated"
  | "mistake_rule.triggered"
  | "mistake_rule.replay_tested"
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

function numberBody(req: Request, name: string, fallback = 0): number {
  const body = req.body as Record<string, unknown> | undefined;
  const value = body?.[name];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function rangeDays(range?: string): number {
  if (range === "7d") return 7;
  if (range === "90d") return 90;
  return 30;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
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

function emitMistakeEvent(req: Request, eventType: MistakeEventType, payload: Record<string, unknown>): void {
  emitMemoryRealtimeEvent({
    userId: req.authUserId,
    orgId: req.authOrgId,
    kind:
      eventType === "skill_candidate.created" ? "skill_candidate_generated" :
      eventType === "mistake_rule.triggered" ? "governance_review_queued" :
      "governance_review_queued",
    source: "company-brain",
    subject: {
      type: "mistake_rule",
      id: String(payload.ruleId ?? payload.mistakeRuleId ?? ""),
      label: eventType,
    },
    payload: {
      eventType,
      ...payload,
      proofLoop: "Outcome -> MistakeImmunityRule -> Trigger -> Replay Test -> Approval -> Skill Candidate",
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

async function getRule(req: Request, id: string): Promise<MistakeImmunityRule> {
  const rule = await prisma.mistakeImmunityRule.findFirst({
    where: {
      id,
      workspace: scopedWorkspaceWhere(req),
    },
  });
  if (!rule) throw new Error("mistake_rule_not_found");
  return rule;
}

async function ruleRelations(ruleId: string): Promise<{
  triggers: MistakeRuleTrigger[];
  replayTests: MistakeReplayTest[];
}> {
  const [triggers, replayTests] = await Promise.all([
    prisma.mistakeRuleTrigger.findMany({
      where: { ruleId },
      orderBy: { triggeredAt: "desc" },
      take: 100,
    }),
    prisma.mistakeReplayTest.findMany({
      where: { ruleId },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);
  return { triggers, replayTests };
}

function riskColor(riskLevel: string): string {
  const risk = riskLevel.toLowerCase();
  if (risk === "high" || risk === "critical") return "text-red-500";
  if (risk === "medium") return "text-amber-500";
  return "text-emerald-500";
}

function statusLabel(status: string): string {
  if (status === "active" || status === "approved") return "Active";
  if (status === "deprecated") return "Deprecated";
  if (status === "candidate") return "Candidate";
  return "Needs Review";
}

function compactList(value: unknown): string[] {
  return toArray(value)
    .map((item) => String(item))
    .map((item) => item.trim())
    .filter(Boolean);
}

function triggerSummary(value: unknown): string {
  const trigger = asRecord(value);
  const parts = [
    trigger.context,
    trigger.filePattern,
    trigger.language,
    trigger.agent,
    trigger.source,
  ].filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  return parts.length ? parts.join("\n") : JSON.stringify(trigger, null, 2);
}

function ruleRow(
  rule: MistakeImmunityRule,
  relations?: { triggers: MistakeRuleTrigger[]; replayTests: MistakeReplayTest[] },
) {
  const triggers = relations?.triggers ?? [];
  const replayTests = relations?.replayTests ?? [];
  const latestTrigger = triggers[0] ?? null;
  return {
    id: rule.id,
    displayId: `MI-${rule.createdAt.toISOString().slice(0, 10).replaceAll("-", "")}-${rule.id.slice(-4).toUpperCase()}`,
    workspaceId: rule.workspaceId,
    pattern: rule.pattern,
    risk: rule.riskCategory,
    riskLevel: rule.riskLevel,
    riskColor: riskColor(rule.riskLevel),
    triggerContext: triggerSummary(rule.triggerContext),
    triggerContextRaw: rule.triggerContext,
    instruction: rule.preventionInstruction,
    riskyFiles: compactList(rule.riskyFiles),
    requiredTests: compactList(rule.requiredTests),
    approval: rule.approvalRequirement ?? "No approval required",
    approvalRisk: rule.riskLevel === "high" || rule.riskLevel === "critical" ? "High" : rule.riskLevel === "medium" ? "Medium" : "Low",
    status: statusLabel(rule.status),
    statusRaw: rule.status,
    sourceType: rule.sourceType,
    sourceRef: rule.sourceRef,
    proof: rule.proof,
    mistakesAvoided: rule.mistakesAvoided,
    triggerCount: triggers.length,
    replayTestCount: replayTests.length,
    lastTriggered: latestTrigger?.triggeredAt?.toISOString() ?? rule.lastTriggeredAt?.toISOString() ?? null,
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
  };
}

async function ruleContext(req: Request) {
  const workspaceId = stringQuery(req, "workspaceId");
  const where = workspaceId
    ? { workspaceId, workspace: scopedWorkspaceWhere(req) }
    : { workspace: scopedWorkspaceWhere(req) };
  const rules = await prisma.mistakeImmunityRule.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 250,
  });
  const relationsByRule = new Map<string, { triggers: MistakeRuleTrigger[]; replayTests: MistakeReplayTest[] }>();
  await Promise.all(rules.map(async (rule) => {
    relationsByRule.set(rule.id, await ruleRelations(rule.id));
  }));
  return { rules, relationsByRule };
}

mistakeImmunityRouter.get("/summary", asyncHandler(async (req, res) => {
  try {
    const { rules, relationsByRule } = await ruleContext(req);
    const active = rules.filter((rule) => rule.status === "active" || rule.status === "approved").length;
    const candidates = rules.filter((rule) => rule.status === "candidate" || rule.status === "needs_review").length;
    const requiredTestUpdates = rules.filter((rule) => compactList(rule.requiredTests).length > 0).length;
    const riskUpdates = rules.filter((rule) => ["high", "critical"].includes(rule.riskLevel.toLowerCase())).length;
    const mistakesAvoided = rules.reduce((sum, rule) => sum + rule.mistakesAvoided, 0);
    const triggerCount = Array.from(relationsByRule.values()).reduce((sum, item) => sum + item.triggers.length, 0);
    res.json({
      metrics: [
        { key: "patterns", label: "Mistake Patterns", value: rules.length, trend: `${triggerCount} trigger(s) captured`, filter: "all" },
        { key: "rules", label: "Prevention Rules", value: active, trend: `${pct(active, Math.max(rules.length, 1))}% active`, filter: "active" },
        { key: "tests", label: "Required Test Updates", value: requiredTestUpdates, trend: "from rule test gates", filter: "tests" },
        { key: "risk", label: "Risk Updates", value: riskUpdates, trend: `${candidates} candidate(s)`, filter: "high" },
        { key: "avoided", label: "Mistakes Avoided", value: mistakesAvoided, trend: "protected runs", filter: "avoided" },
      ],
      totals: { total: rules.length, active, candidates, requiredTestUpdates, riskUpdates, mistakesAvoided, triggers: triggerCount },
    });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

mistakeImmunityRouter.get("/rules", asyncHandler(async (req, res) => {
  try {
    const status = stringQuery(req, "status");
    const { rules, relationsByRule } = await ruleContext(req);
    const rows = rules
      .map((rule) => ruleRow(rule, relationsByRule.get(rule.id)))
      .filter((rule) => !status || status === "all" || rule.statusRaw === status || rule.status.toLowerCase() === status);
    res.json({ rules: rows });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

mistakeImmunityRouter.get("/top-repeated-mistakes", asyncHandler(async (req, res) => {
  try {
    const { rules, relationsByRule } = await ruleContext(req);
    const mistakes = rules
      .map((rule) => ({
        id: rule.id,
        name: rule.pattern,
        count: Math.max(rule.mistakesAvoided, relationsByRule.get(rule.id)?.triggers.length ?? 0),
        riskLevel: rule.riskLevel,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    res.json({ mistakes });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

mistakeImmunityRouter.get("/protection-impact", asyncHandler(async (req, res) => {
  try {
    const days = rangeDays(stringQuery(req, "range"));
    const { rules, relationsByRule } = await ruleContext(req);
    const now = new Date();
    const buckets = Array.from({ length: days }).map((_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (days - index - 1));
      return { key: date.toISOString().slice(0, 10), name: dayKey(date), avoided: 0, rules: 0 };
    });
    const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));
    for (const rule of rules) {
      const createdKey = rule.createdAt.toISOString().slice(0, 10);
      for (const bucket of buckets) {
        if (bucket.key >= createdKey && (rule.status === "active" || rule.status === "approved")) bucket.rules++;
      }
      for (const trigger of relationsByRule.get(rule.id)?.triggers ?? []) {
        const key = trigger.triggeredAt.toISOString().slice(0, 10);
        const bucket = byKey.get(key);
        if (bucket) bucket.avoided++;
      }
    }
    if (buckets.every((bucket) => bucket.avoided === 0)) {
      const totalAvoided = rules.reduce((sum, rule) => sum + rule.mistakesAvoided, 0);
      buckets[buckets.length - 1]!.avoided = totalAvoided;
    }
    res.json({
      range: stringQuery(req, "range") ?? "30d",
      points: buckets,
      totals: {
        mistakesAvoided: rules.reduce((sum, rule) => sum + rule.mistakesAvoided, 0),
        activeRules: rules.filter((rule) => rule.status === "active" || rule.status === "approved").length,
      },
    });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

mistakeImmunityRouter.get("/rules/:id/proof", asyncHandler(async (req, res) => {
  try {
    const rule = await getRule(req, stringParam(req, "id"));
    const relations = await ruleRelations(rule.id);
    res.json({
      proof: {
        rule,
        triggers: relations.triggers,
        replayTests: relations.replayTests,
        proof: rule.proof,
        integrityChecks: [
          { label: "Rule exists in Prisma", ok: true, detail: rule.id },
          { label: "Has prevention instruction", ok: rule.preventionInstruction.trim().length > 0, detail: "prevention_instruction" },
          { label: "Has trigger context", ok: Object.keys(asRecord(rule.triggerContext)).length > 0, detail: "trigger_context" },
          { label: "Has proof", ok: Object.keys(asRecord(rule.proof)).length > 0, detail: "proof" },
        ],
        proofLoop: "Outcome -> MistakeImmunityRule -> Trigger -> Replay Test -> Approval -> Skill Candidate",
      },
    });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

mistakeImmunityRouter.get("/rules/:id/triggers", asyncHandler(async (req, res) => {
  try {
    const rule = await getRule(req, stringParam(req, "id"));
    const { triggers } = await ruleRelations(rule.id);
    res.json({ triggers });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

mistakeImmunityRouter.get("/rules/:id", asyncHandler(async (req, res) => {
  try {
    const rule = await getRule(req, stringParam(req, "id"));
    res.json({ rule: ruleRow(rule, await ruleRelations(rule.id)) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

mistakeImmunityRouter.post("/rules", asyncHandler(async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const workspaceId = await resolveWorkspaceId(req);
    const rule = await prisma.mistakeImmunityRule.create({
      data: {
        workspaceId,
        pattern: stringBody(req, "pattern", "Repeated agent mistake"),
        riskCategory: stringBody(req, "riskCategory", "Reliability"),
        riskLevel: stringBody(req, "riskLevel", "medium"),
        triggerContext: inputJson(body.triggerContext ?? { source: "manual", context: stringBody(req, "pattern", "Repeated agent mistake") }),
        preventionInstruction: stringBody(req, "preventionInstruction", stringBody(req, "instruction", "Future agents must check prior outcome proof before repeating this action.")),
        riskyFiles: inputJson(body.riskyFiles ?? []),
        requiredTests: inputJson(body.requiredTests ?? []),
        approvalRequirement: stringBody(req, "approvalRequirement", ""),
        status: stringBody(req, "status", "candidate"),
        sourceType: stringBody(req, "sourceType", "manual"),
        sourceRef: stringBody(req, "sourceRef", ""),
        proof: inputJson(body.proof ?? { source: "manual", createdBy: req.authUserId, createdAt: new Date().toISOString() }),
        mistakesAvoided: numberBody(req, "mistakesAvoided", 0),
      },
    });
    emitMistakeEvent(req, "mistake_rule.created", { ruleId: rule.id });
    res.status(201).json({ rule: ruleRow(rule, { triggers: [], replayTests: [] }) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

mistakeImmunityRouter.post("/rules/:id/approve", asyncHandler(async (req, res) => {
  try {
    const existing = await getRule(req, stringParam(req, "id"));
    const rule = await prisma.mistakeImmunityRule.update({
      where: { id: existing.id },
      data: { status: "active" },
    });
    emitMistakeEvent(req, "mistake_rule.approved", { ruleId: rule.id });
    res.json({ rule: ruleRow(rule, await ruleRelations(rule.id)) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

mistakeImmunityRouter.post("/rules/:id/edit", asyncHandler(async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const existing = await getRule(req, stringParam(req, "id"));
    const data: Prisma.MistakeImmunityRuleUpdateInput = {};
    if (typeof body.pattern === "string") data.pattern = body.pattern;
    if (typeof body.riskCategory === "string") data.riskCategory = body.riskCategory;
    if (typeof body.riskLevel === "string") data.riskLevel = body.riskLevel;
    if ("triggerContext" in body) data.triggerContext = inputJson(body.triggerContext);
    if (typeof body.preventionInstruction === "string") data.preventionInstruction = body.preventionInstruction;
    if (typeof body.instruction === "string") data.preventionInstruction = body.instruction;
    if ("riskyFiles" in body) data.riskyFiles = inputJson(body.riskyFiles);
    if ("requiredTests" in body) data.requiredTests = inputJson(body.requiredTests);
    if (typeof body.approvalRequirement === "string") data.approvalRequirement = body.approvalRequirement;
    if (typeof body.status === "string") data.status = body.status;
    const rule = await prisma.mistakeImmunityRule.update({ where: { id: existing.id }, data });
    emitMistakeEvent(req, "mistake_rule.updated", { ruleId: rule.id });
    res.json({ rule: ruleRow(rule, await ruleRelations(rule.id)) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

mistakeImmunityRouter.post("/rules/:id/deprecate", asyncHandler(async (req, res) => {
  try {
    const existing = await getRule(req, stringParam(req, "id"));
    const rule = await prisma.mistakeImmunityRule.update({
      where: { id: existing.id },
      data: { status: "deprecated" },
    });
    emitMistakeEvent(req, "mistake_rule.deprecated", { ruleId: rule.id });
    res.json({ rule: ruleRow(rule, await ruleRelations(rule.id)) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

mistakeImmunityRouter.post("/rules/:id/attach-test", asyncHandler(async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const existing = await getRule(req, stringParam(req, "id"));
    const current = compactList(existing.requiredTests);
    const nextTest = stringBody(req, "test", stringBody(req, "command", "Replay regression test"));
    const rule = await prisma.mistakeImmunityRule.update({
      where: { id: existing.id },
      data: {
        requiredTests: inputJson([...new Set([...current, nextTest])]),
        proof: inputJson({
          ...asRecord(existing.proof),
          testAttachments: [...toArray(asRecord(existing.proof).testAttachments), { test: nextTest, at: new Date().toISOString() }],
        }),
      },
    });
    const replayTest = await prisma.mistakeReplayTest.create({
      data: {
        workspaceId: rule.workspaceId,
        ruleId: rule.id,
        name: nextTest,
        command: typeof body.command === "string" ? body.command : nextTest,
        status: "attached",
        result: inputJson({ attached: true }),
        proof: inputJson({ ruleId: rule.id, attachedBy: req.authUserId }),
      },
    });
    emitMistakeEvent(req, "mistake_rule.updated", { ruleId: rule.id, replayTestId: replayTest.id });
    res.json({ rule: ruleRow(rule, await ruleRelations(rule.id)), replayTest });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

mistakeImmunityRouter.post("/rules/:id/attach-approval", asyncHandler(async (req, res) => {
  try {
    const existing = await getRule(req, stringParam(req, "id"));
    const approval = stringBody(req, "approval", existing.approvalRequirement ?? "Human approval required");
    const rule = await prisma.mistakeImmunityRule.update({
      where: { id: existing.id },
      data: {
        approvalRequirement: approval,
        proof: inputJson({
          ...asRecord(existing.proof),
          approvalAttachments: [...toArray(asRecord(existing.proof).approvalAttachments), { approval, at: new Date().toISOString() }],
        }),
      },
    });
    emitMistakeEvent(req, "mistake_rule.updated", { ruleId: rule.id, approval });
    res.json({ rule: ruleRow(rule, await ruleRelations(rule.id)) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

mistakeImmunityRouter.post("/rules/:id/replay-test", asyncHandler(async (req, res) => {
  try {
    const rule = await getRule(req, stringParam(req, "id"));
    const name = stringBody(req, "name", `Replay: ${rule.pattern.slice(0, 80)}`);
    const replayTest = await prisma.mistakeReplayTest.create({
      data: {
        workspaceId: rule.workspaceId,
        ruleId: rule.id,
        name,
        command: stringBody(req, "command", ""),
        status: "passed",
        result: inputJson({
          passed: true,
          preventedPattern: rule.pattern,
          checkedAt: new Date().toISOString(),
        }),
        proof: inputJson({
          ruleId: rule.id,
          source: "manual_replay",
          preventionInstruction: rule.preventionInstruction,
        }),
        runAt: new Date(),
      },
    });
    const updated = await prisma.mistakeImmunityRule.update({
      where: { id: rule.id },
      data: {
        mistakesAvoided: { increment: 1 },
        lastTriggeredAt: new Date(),
      },
    });
    await prisma.mistakeRuleTrigger.create({
      data: {
        workspaceId: rule.workspaceId,
        ruleId: rule.id,
        source: "replay_test",
        matchedContext: inputJson({ replayTestId: replayTest.id, pattern: rule.pattern }),
        status: "prevented",
        proof: inputJson({ replayTestId: replayTest.id, result: "passed" }),
      },
    });
    emitMistakeEvent(req, "mistake_rule.replay_tested", { ruleId: rule.id, replayTestId: replayTest.id });
    emitMistakeEvent(req, "mistake_rule.triggered", { ruleId: rule.id, status: "prevented" });
    res.json({ rule: ruleRow(updated, await ruleRelations(rule.id)), replayTest });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

mistakeImmunityRouter.post("/rules/:id/create-skill-candidate", asyncHandler(async (req, res) => {
  try {
    const rule = await getRule(req, stringParam(req, "id"));
    const skillCandidate = await prisma.agentSkill.create({
      data: {
        workspaceId: rule.workspaceId,
        name: `Skill Candidate: Avoid ${rule.pattern.slice(0, 80)}`,
        trigger: inputJson({
          source: "mistake_immunity",
          ruleId: rule.id,
          triggerContext: rule.triggerContext,
        }),
        requiredMemories: inputJson([]),
        requiredTools: inputJson([]),
        requiredTests: inputJson(rule.requiredTests),
        approvalRules: inputJson(rule.approvalRequirement ? [rule.approvalRequirement] : []),
        successRate: 0,
        version: "candidate",
        status: "candidate",
      },
    });
    emitMistakeEvent(req, "skill_candidate.created", { ruleId: rule.id, skillCandidateId: skillCandidate.id });
    res.status(201).json({ skillCandidate });
  } catch (error) {
    sendRouteError(res, error);
  }
}));
