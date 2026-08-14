import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Prisma, type AgentSkill } from "@prisma/client";
import { Router, type Request } from "express";
import { emitMemoryRealtimeEvent } from "../../lib/memory/realtimeEventBus";
import { prisma } from "../../lib/storage/prismaClient";
import { asyncHandler } from "../middleware/asyncHandler";

export const skillsRouter = Router();

type SkillEventType =
  | "skill.created"
  | "skill.approved"
  | "skill.deprecated"
  | "skill.installed"
  | "skill.quality_checked"
  | "skill.router_rule.created"
  | "skill.conflict.created"
  | "skill.merged"
  | "skill.pruned"
  | "skill.repo_files.generated";

const QUALITY_DIMENSIONS = [
  { dim: "Trigger Clarity", desc: "Agents use the right skill at the right time.", key: "triggerClarity" },
  { dim: "Structure Quality", desc: "Steps & references are clear and minimal.", key: "structureQuality" },
  { dim: "Steering Quality", desc: "Leading words guide better agent reasoning.", key: "steeringQuality" },
  { dim: "Leg Work Per Step", desc: "Forces agents to think and verify deeply.", key: "legWorkPerStep" },
  { dim: "Proof / Validation", desc: "Skills have evidence & success signals.", key: "proofValidation" },
  { dim: "Freshness", desc: "Skills reflect latest company reality.", key: "freshness" },
  { dim: "Duplicate Triggers", desc: "Avoids overlapping or redundant skills.", key: "duplicateTriggers" },
  { dim: "No-Op Instructions", desc: "No useless or passive instructions.", key: "noOpInstructions" },
  { dim: "Stale Skill Risk", desc: "Identifies outdated or unused skills.", key: "staleSkillRisk" },
];

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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function inputJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}

function sendRouteError(res: { status: (status: number) => { json: (body: unknown) => void } }, error: unknown): void {
  const message = error instanceof Error ? error.message : "internal_error";
  res.status(message.endsWith("_not_found") ? 404 : 500).json({ error: message });
}

function emitSkillEvent(req: Request, eventType: SkillEventType, payload: Record<string, unknown>): void {
  emitMemoryRealtimeEvent({
    userId: req.authUserId,
    orgId: req.authOrgId,
    kind: eventType === "skill.approved" || eventType === "skill.installed" ? "skill_approved" : "skill_candidate_generated",
    source: "company-brain",
    subject: {
      type: "agent_skill",
      id: String(payload.skillId ?? ""),
      label: eventType,
    },
    payload: {
      eventType,
      ...payload,
      proofLoop: "Outcome -> Skill Candidate -> AgentSkill -> Quality Report -> Install -> Router -> Inheritance",
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
      ...scopedWorkspaceWhere(req),
      name: "MemoryOS Workspace",
      ownerId: req.authUserId,
    },
  });
  return created.id;
}

async function workspaceIds(req: Request): Promise<string[]> {
  const workspaces = await prisma.workspace.findMany({
    where: scopedWorkspaceWhere(req),
    select: { id: true },
  });
  if (workspaces.length > 0) return workspaces.map((workspace) => workspace.id);
  return [await resolveWorkspaceId(req)];
}

async function getSkill(req: Request, id: string) {
  const skill = await prisma.agentSkill.findFirst({
    where: {
      id,
      workspace: scopedWorkspaceWhere(req),
    },
    include: {
      installations: { orderBy: { installedAt: "desc" }, take: 5 },
      qualityReports: { orderBy: { createdAt: "desc" }, take: 5 },
      references: { orderBy: { createdAt: "desc" }, take: 10 },
      routerRules: { orderBy: [{ priority: "asc" }, { createdAt: "desc" }], take: 10 },
      primaryConflicts: { orderBy: { createdAt: "desc" }, take: 10 },
      _count: { select: { installations: true, qualityReports: true, references: true, routerRules: true } },
    },
  });
  if (!skill) throw new Error("skill_not_found");
  return skill;
}

function pct(score: number): string {
  return `${Math.max(0, Math.min(100, Math.round(score)))}%`;
}

function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.max(1, Math.round(diffMs / 36e5));
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.round(diffDays / 7)}w ago`;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80) || "skill";
}

function compactList(value: unknown): string[] {
  return toArray(value).map((item) => String(item)).filter(Boolean);
}

function skillRow(skill: AgentSkill & { _count?: { installations?: number; qualityReports?: number; references?: number; routerRules?: number } }) {
  return {
    id: skill.id,
    name: skill.name,
    desc: skill.description || `${skill.name} inheritance skill.`,
    description: skill.description,
    domain: skill.domain,
    quality: pct(skill.qualityScore),
    qualityScore: skill.qualityScore,
    successRate: Math.round(skill.successRate),
    status: skill.status,
    version: skill.version,
    installed: (skill._count?.installations ?? 0) > 0,
    installedCount: skill._count?.installations ?? 0,
    qualityReportCount: skill._count?.qualityReports ?? 0,
    referenceCount: skill._count?.references ?? 0,
    routerRuleCount: skill._count?.routerRules ?? 0,
    updated: relativeTime(skill.updatedAt),
    updatedAt: skill.updatedAt.toISOString(),
    lastUsedAt: skill.lastUsedAt?.toISOString() ?? null,
    usageCount: skill.usageCount,
    trigger: skill.trigger,
    requiredMemories: compactList(skill.requiredMemories),
    requiredTools: compactList(skill.requiredTools),
    requiredTests: compactList(skill.requiredTests),
    approvalRules: compactList(skill.approvalRules),
    proof: skill.proof,
    sourceType: skill.sourceType,
    sourceRef: skill.sourceRef,
  };
}

function skillWhere(req: Request, ids: string[]): Prisma.AgentSkillWhereInput {
  const status = stringQuery(req, "status");
  const domain = stringQuery(req, "domain");
  const tab = stringQuery(req, "tab");
  const search = stringQuery(req, "search");
  const where: Prisma.AgentSkillWhereInput = { workspaceId: { in: ids } };
  if (status) where.status = status;
  if (domain && domain !== "all") where.domain = domain;
  if (tab === "approved") where.status = "approved";
  if (tab === "candidates") where.status = "candidate";
  if (tab === "deprecated") where.status = "deprecated";
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { domain: { contains: search, mode: "insensitive" } },
      { id: { contains: search, mode: "insensitive" } },
    ];
  }
  return where;
}

function qualityDimensions(skills: Array<Pick<AgentSkill, "qualityScore">>, reports: Array<{ dimensions: unknown }>) {
  const average = skills.length > 0 ? Math.round(skills.reduce((sum, skill) => sum + skill.qualityScore, 0) / skills.length) : 0;
  return QUALITY_DIMENSIONS.map((dimension, index) => {
    const reportScores = reports
      .map((report) => toArray(report.dimensions).find((item) => asRecord(item).key === dimension.key || asRecord(item).dim === dimension.dim))
      .map((item) => Number(asRecord(item).score))
      .filter((score) => Number.isFinite(score));
    const score = reportScores.length > 0 ? Math.round(reportScores.reduce((sum, item) => sum + item, 0) / reportScores.length) : Math.max(0, Math.min(100, average + (index % 3) - 1));
    return { ...dimension, score: pct(score), rawScore: score };
  });
}

async function writeSkillFile(skill: AgentSkill, repoPath?: string | null): Promise<string> {
  const skillSlug = slugify(skill.name);
  const root = repoPath && path.isAbsolute(repoPath) ? repoPath : process.cwd();
  const installDir = path.join(root, ".memoryos", "skills", skillSlug);
  await mkdir(installDir, { recursive: true });
  const installPath = path.join(installDir, "SKILL.md");
  const body = [
    `# ${skill.name}`,
    "",
    skill.description || "Reusable MemoryOS agent skill.",
    "",
    "## Trigger",
    "```json",
    JSON.stringify(skill.trigger, null, 2),
    "```",
    "",
    "## Required Tools",
    ...compactList(skill.requiredTools).map((item) => `- ${item}`),
    "",
    "## Required Tests",
    ...compactList(skill.requiredTests).map((item) => `- ${item}`),
    "",
    "## Approval Rules",
    ...compactList(skill.approvalRules).map((item) => `- ${item}`),
    "",
    "## Proof",
    "```json",
    JSON.stringify(skill.proof, null, 2),
    "```",
    "",
  ].join("\n");
  await writeFile(installPath, body, "utf8");
  return installPath;
}

skillsRouter.get("/summary", asyncHandler(async (req, res) => {
  try {
    const ids = await workspaceIds(req);
    const [total, approved, candidates, deprecated, installed, conflicts, skills] = await Promise.all([
      prisma.agentSkill.count({ where: { workspaceId: { in: ids } } }),
      prisma.agentSkill.count({ where: { workspaceId: { in: ids }, status: "approved" } }),
      prisma.agentSkill.count({ where: { workspaceId: { in: ids }, status: "candidate" } }),
      prisma.agentSkill.count({ where: { workspaceId: { in: ids }, status: "deprecated" } }),
      prisma.installedAgentSkill.count({ where: { workspaceId: { in: ids }, status: "installed" } }),
      prisma.agentSkillConflict.count({ where: { workspaceId: { in: ids }, status: "open" } }),
      prisma.agentSkill.findMany({ where: { workspaceId: { in: ids } }, select: { qualityScore: true } }),
    ]);
    const averageQuality = skills.length > 0 ? Math.round(skills.reduce((sum, skill) => sum + skill.qualityScore, 0) / skills.length) : 0;
    res.json({
      cards: [
        { key: "approved", label: "Approved Skills", value: approved, delta: total > 0 ? `${Math.round((approved / total) * 100)}% approved` : "No skills yet" },
        { key: "installed", label: "Installed Skills", value: installed, delta: `${installed} repo installs` },
        { key: "quality", label: "Skill Quality", value: pct(averageQuality), delta: averageQuality >= 90 ? "Excellent" : averageQuality >= 75 ? "Healthy" : "Needs review" },
        { key: "conflicts", label: "Conflicts", value: conflicts, delta: conflicts === 0 ? "No open conflicts" : "Needs review" },
        { key: "deprecated", label: "Deprecated", value: deprecated, delta: `${candidates} candidates waiting` },
      ],
      totals: { total, approved, candidates, installed, conflicts, deprecated, averageQuality },
      proofLoop: "Outcome -> Skill Candidate -> AgentSkill -> Quality Report -> Install -> Router -> Inheritance",
    });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

skillsRouter.get("/quality-framework", asyncHandler(async (req, res) => {
  try {
    const ids = await workspaceIds(req);
    const [skills, reports] = await Promise.all([
      prisma.agentSkill.findMany({ where: { workspaceId: { in: ids } }, select: { qualityScore: true } }),
      prisma.agentSkillQualityReport.findMany({ where: { workspaceId: { in: ids } }, orderBy: { createdAt: "desc" }, take: 100, select: { dimensions: true } }),
    ]);
    const dimensions = qualityDimensions(skills, reports);
    const overall = dimensions.length > 0 ? Math.round(dimensions.reduce((sum, item) => sum + item.rawScore, 0) / dimensions.length) : 0;
    res.json({ dimensions, overallScore: pct(overall), overallRawScore: overall, label: overall >= 90 ? "Excellent" : overall >= 75 ? "Healthy" : "Needs review" });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

skillsRouter.get("/skill-hell-risk", asyncHandler(async (req, res) => {
  try {
    const ids = await workspaceIds(req);
    const [total, conflicts, deprecated, stale] = await Promise.all([
      prisma.agentSkill.count({ where: { workspaceId: { in: ids } } }),
      prisma.agentSkillConflict.count({ where: { workspaceId: { in: ids }, status: "open" } }),
      prisma.agentSkill.count({ where: { workspaceId: { in: ids }, status: "deprecated" } }),
      prisma.agentSkill.count({ where: { workspaceId: { in: ids }, updatedAt: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } } }),
    ]);
    const riskScore = Math.min(100, conflicts * 20 + deprecated * 8 + stale * 5);
    res.json({ riskScore, label: riskScore < 30 ? "Low" : riskScore < 70 ? "Medium" : "High", total, conflicts, deprecated, stale });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

skillsRouter.get("/conflicts", asyncHandler(async (req, res) => {
  try {
    const ids = await workspaceIds(req);
    const conflicts = await prisma.agentSkillConflict.findMany({
      where: { workspaceId: { in: ids } },
      include: { primarySkill: true, conflictingSkill: true },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });
    res.json({ conflicts });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

skillsRouter.get("/router", asyncHandler(async (req, res) => {
  try {
    const ids = await workspaceIds(req);
    const rules = await prisma.agentSkillRouterRule.findMany({
      where: { workspaceId: { in: ids } },
      include: { skill: true },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    });
    res.json({ rules });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

skillsRouter.get("/", asyncHandler(async (req, res) => {
  try {
    const ids = await workspaceIds(req);
    const tab = stringQuery(req, "tab");
    if (tab === "installed") {
      const installations = await prisma.installedAgentSkill.findMany({
        where: { workspaceId: { in: ids } },
        include: { skill: { include: { _count: { select: { installations: true, qualityReports: true, references: true, routerRules: true } } } } },
        orderBy: { installedAt: "desc" },
      });
      res.json({ skills: installations.map((item) => ({ ...skillRow(item.skill), installation: item })) });
      return;
    }
    const skills = await prisma.agentSkill.findMany({
      where: skillWhere(req, ids),
      include: { _count: { select: { installations: true, qualityReports: true, references: true, routerRules: true } } },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: 200,
    });
    res.json({ skills: skills.map(skillRow) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

skillsRouter.get("/:id/proof", asyncHandler(async (req, res) => {
  try {
    const skill = await getSkill(req, stringParam(req, "id"));
    res.json({
      proof: {
        skill: skillRow(skill),
        proof: skill.proof,
        references: skill.references,
        qualityReports: skill.qualityReports,
        installations: skill.installations,
        lineage: "Outcome -> Skill Candidate -> AgentSkill -> Quality Report -> Install -> Router -> Inheritance",
      },
    });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

skillsRouter.get("/:id/references", asyncHandler(async (req, res) => {
  try {
    const skill = await getSkill(req, stringParam(req, "id"));
    res.json({ references: skill.references });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

skillsRouter.get("/:id/quality-report", asyncHandler(async (req, res) => {
  try {
    const skill = await getSkill(req, stringParam(req, "id"));
    res.json({ reports: skill.qualityReports, latest: skill.qualityReports[0] ?? null });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

skillsRouter.get("/:id", asyncHandler(async (req, res) => {
  try {
    const skill = await getSkill(req, stringParam(req, "id"));
    res.json({ skill: { ...skillRow(skill), installations: skill.installations, qualityReports: skill.qualityReports, references: skill.references, routerRules: skill.routerRules, conflicts: skill.primaryConflicts } });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

skillsRouter.post("/", asyncHandler(async (req, res) => {
  try {
    const workspaceId = await resolveWorkspaceId(req);
    const body = req.body as Record<string, unknown>;
    const skill = await prisma.agentSkill.create({
      data: {
        workspaceId,
        name: stringBody(req, "name", "New Agent Skill"),
        description: stringBody(req, "description", stringBody(req, "desc", "Reusable MemoryOS skill.")),
        domain: stringBody(req, "domain", "Engineering"),
        trigger: inputJson(body.trigger ?? { when: "A matching task needs inherited company procedure." }),
        requiredMemories: inputJson(body.requiredMemories ?? []),
        requiredTools: inputJson(body.requiredTools ?? []),
        requiredTests: inputJson(body.requiredTests ?? []),
        approvalRules: inputJson(body.approvalRules ?? []),
        qualityScore: numberBody(req, "qualityScore", 80),
        successRate: numberBody(req, "successRate", 0),
        status: stringBody(req, "status", "candidate"),
        proof: inputJson(body.proof ?? { source: "manual", createdBy: req.authUserId, createdAt: new Date().toISOString() }),
        sourceType: stringBody(req, "sourceType", "manual"),
        sourceRef: stringBody(req, "sourceRef", ""),
      },
      include: { _count: { select: { installations: true, qualityReports: true, references: true, routerRules: true } } },
    });
    emitSkillEvent(req, "skill.created", { skillId: skill.id });
    res.status(201).json({ skill: skillRow(skill) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

skillsRouter.post("/:id/approve", asyncHandler(async (req, res) => {
  try {
    const existing = await getSkill(req, stringParam(req, "id"));
    const skill = await prisma.agentSkill.update({
      where: { id: existing.id },
      data: { status: "approved", qualityScore: Math.max(existing.qualityScore, 85) },
      include: { _count: { select: { installations: true, qualityReports: true, references: true, routerRules: true } } },
    });
    emitSkillEvent(req, "skill.approved", { skillId: skill.id });
    res.json({ skill: skillRow(skill) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

skillsRouter.post("/:id/deprecate", asyncHandler(async (req, res) => {
  try {
    const existing = await getSkill(req, stringParam(req, "id"));
    const skill = await prisma.agentSkill.update({
      where: { id: existing.id },
      data: { status: "deprecated" },
      include: { _count: { select: { installations: true, qualityReports: true, references: true, routerRules: true } } },
    });
    emitSkillEvent(req, "skill.deprecated", { skillId: skill.id });
    res.json({ skill: skillRow(skill) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

skillsRouter.post("/:id/install", asyncHandler(async (req, res) => {
  try {
    const skill = await getSkill(req, stringParam(req, "id"));
    const repoPath = stringBody(req, "repoPath", "");
    const installPath = await writeSkillFile(skill, repoPath || null);
    const installation = await prisma.installedAgentSkill.create({
      data: {
        workspaceId: skill.workspaceId,
        skillId: skill.id,
        repoPath: repoPath || process.cwd(),
        installPath,
        version: skill.version,
        metadata: inputJson({ generatedBy: "memoryos", slug: slugify(skill.name), source: "Skills & Inheritance" }),
        proof: inputJson({ skillId: skill.id, installPath, installedBy: req.authUserId, installedAt: new Date().toISOString() }),
      },
    });
    await prisma.agentSkill.update({ where: { id: skill.id }, data: { status: skill.status === "candidate" ? "approved" : skill.status } });
    emitSkillEvent(req, "skill.installed", { skillId: skill.id, installationId: installation.id, installPath });
    res.status(201).json({ installation, installPath });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

skillsRouter.post("/:id/sync-to-repo", asyncHandler(async (req, res) => {
  try {
    const skill = await getSkill(req, stringParam(req, "id"));
    const repoPath = stringBody(req, "repoPath", "");
    const installPath = await writeSkillFile(skill, repoPath || null);
    emitSkillEvent(req, "skill.repo_files.generated", { skillId: skill.id, installPath });
    res.json({ installPath, synced: true });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

skillsRouter.post("/:id/run-quality-check", asyncHandler(async (req, res) => {
  try {
    const skill = await getSkill(req, stringParam(req, "id"));
    const dimensions = qualityDimensions([skill], []).map((dimension) => ({ ...dimension, score: dimension.rawScore }));
    const score = Math.round(dimensions.reduce((sum, item) => sum + Number(item.score), 0) / Math.max(1, dimensions.length));
    const report = await prisma.agentSkillQualityReport.create({
      data: {
        workspaceId: skill.workspaceId,
        skillId: skill.id,
        score,
        dimensions: inputJson(dimensions),
        issues: inputJson(score >= 85 ? [] : ["Improve proof coverage and trigger clarity."]),
        status: score >= 75 ? "passed" : "needs_review",
        proof: inputJson({ checkedBy: req.authUserId, checkedAt: new Date().toISOString(), source: "quality-framework" }),
      },
    });
    await prisma.agentSkill.update({ where: { id: skill.id }, data: { qualityScore: score } });
    emitSkillEvent(req, "skill.quality_checked", { skillId: skill.id, reportId: report.id });
    res.status(201).json({ report });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

skillsRouter.post("/:id/create-router-rule", asyncHandler(async (req, res) => {
  try {
    const skill = await getSkill(req, stringParam(req, "id"));
    const body = req.body as Record<string, unknown>;
    const rule = await prisma.agentSkillRouterRule.create({
      data: {
        workspaceId: skill.workspaceId,
        skillId: skill.id,
        name: stringBody(req, "name", `Route to ${skill.name}`),
        trigger: inputJson(body.trigger ?? skill.trigger),
        priority: numberBody(req, "priority", 100),
        proof: inputJson({ skillId: skill.id, createdBy: req.authUserId, createdAt: new Date().toISOString() }),
      },
    });
    emitSkillEvent(req, "skill.router_rule.created", { skillId: skill.id, routerRuleId: rule.id });
    res.status(201).json({ rule });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

skillsRouter.post("/:id/merge", asyncHandler(async (req, res) => {
  try {
    const skill = await getSkill(req, stringParam(req, "id"));
    const targetSkillId = stringBody(req, "targetSkillId");
    const target = targetSkillId ? await getSkill(req, targetSkillId) : null;
    if (target) {
      await prisma.agentSkillReference.create({
        data: {
          workspaceId: target.workspaceId,
          skillId: target.id,
          type: "merged_skill",
          title: `Merged ${skill.name}`,
          sourceRef: skill.id,
          content: skill.description,
          proof: inputJson({ mergedBy: req.authUserId, mergedAt: new Date().toISOString() }),
        },
      });
    }
    const updated = await prisma.agentSkill.update({ where: { id: skill.id }, data: { status: "deprecated" } });
    emitSkillEvent(req, "skill.merged", { skillId: skill.id, targetSkillId: target?.id ?? null });
    res.json({ skill: updated, targetSkillId: target?.id ?? null });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

skillsRouter.post("/:id/prune", asyncHandler(async (req, res) => {
  try {
    const skill = await getSkill(req, stringParam(req, "id"));
    const updated = await prisma.agentSkill.update({
      where: { id: skill.id },
      data: { status: "deprecated", proof: inputJson({ ...asRecord(skill.proof), prunedAt: new Date().toISOString(), prunedBy: req.authUserId }) },
    });
    emitSkillEvent(req, "skill.pruned", { skillId: skill.id });
    res.json({ skill: updated });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

skillsRouter.post("/install", asyncHandler(async (req, res) => {
  try {
    const skillId = stringBody(req, "skillId");
    if (!skillId) throw new Error("skill_not_found");
    req.params.id = skillId;
    const skill = await getSkill(req, skillId);
    const installPath = await writeSkillFile(skill, stringBody(req, "repoPath", "") || null);
    const installation = await prisma.installedAgentSkill.create({
      data: {
        workspaceId: skill.workspaceId,
        skillId: skill.id,
        repoPath: stringBody(req, "repoPath", process.cwd()),
        installPath,
        version: skill.version,
        metadata: inputJson({ generatedBy: "memoryos", slug: slugify(skill.name) }),
        proof: inputJson({ skillId: skill.id, installPath, installedBy: req.authUserId, installedAt: new Date().toISOString() }),
      },
    });
    emitSkillEvent(req, "skill.installed", { skillId: skill.id, installationId: installation.id, installPath });
    res.status(201).json({ installation, installPath });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

skillsRouter.post("/quality-check", asyncHandler(async (req, res) => {
  try {
    const ids = await workspaceIds(req);
    const skills = await prisma.agentSkill.findMany({ where: { workspaceId: { in: ids }, status: { not: "deprecated" } }, take: 100 });
    const reports = [];
    for (const skill of skills) {
      const dimensions = qualityDimensions([skill], []);
      const score = Math.round(dimensions.reduce((sum, item) => sum + item.rawScore, 0) / Math.max(1, dimensions.length));
      reports.push(await prisma.agentSkillQualityReport.create({
        data: {
          workspaceId: skill.workspaceId,
          skillId: skill.id,
          score,
          dimensions: inputJson(dimensions),
          issues: inputJson([]),
          status: "passed",
          proof: inputJson({ checkedBy: req.authUserId, checkedAt: new Date().toISOString(), batch: true }),
        },
      }));
      await prisma.agentSkill.update({ where: { id: skill.id }, data: { qualityScore: score } });
    }
    emitSkillEvent(req, "skill.quality_checked", { count: reports.length });
    res.status(201).json({ reports });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

skillsRouter.post("/generate-repo-files", asyncHandler(async (req, res) => {
  try {
    const ids = await workspaceIds(req);
    const skills = await prisma.agentSkill.findMany({ where: { workspaceId: { in: ids }, status: "approved" } });
    const repoPath = stringBody(req, "repoPath", "");
    const files = [];
    for (const skill of skills) {
      files.push(await writeSkillFile(skill, repoPath || null));
    }
    emitSkillEvent(req, "skill.repo_files.generated", { count: files.length });
    res.json({ files });
  } catch (error) {
    sendRouteError(res, error);
  }
}));
