import { Router, type Request } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { emitMemoryRealtimeEvent } from "../../lib/memory/realtimeEventBus";
import {
  createFutureInstructionFromRun,
  createMistakeRuleFromRun,
  createSkillCandidateFromRun,
  getAgentRunBlackBox,
  getOutcome,
  listAgentRuns,
  listAgentSkills,
  listFutureInstructions,
  listOutcomes,
  type MasterplanScope,
} from "../../lib/masterplan/productLoopStore";
import {
  listExperienceLessons,
  listFailurePatterns,
  listRootCauses,
  searchVerificationExperiences,
} from "../../lib/realityCompiler/experienceInsights";
import {
  buildExperienceRecommendations,
  findSimilarExperiences,
} from "../../lib/realityCompiler/experienceRecommendation";

export const experienceRouter = Router();

type ExperienceEventType =
  | "outcome.captured"
  | "lesson.created"
  | "future_instruction.created"
  | "mistake_rule.created"
  | "skill_candidate.created";

function scope(req: Request): MasterplanScope {
  return {
    userId: req.authUserId,
    orgId: req.authOrgId,
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

function rangeDays(range?: string): number {
  if (range === "30d") return 30;
  if (range === "90d") return 90;
  return 7;
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function dayKey(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function pct(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function sendRouteError(res: { status: (status: number) => { json: (body: unknown) => void } }, error: unknown): void {
  const message = error instanceof Error ? error.message : "internal_error";
  res.status(message.endsWith("_not_found") ? 404 : 500).json({ error: message });
}

function emitExperienceEvent(req: Request, eventType: ExperienceEventType, payload: Record<string, unknown>): void {
  emitMemoryRealtimeEvent({
    userId: req.authUserId,
    orgId: req.authOrgId,
    kind:
      eventType === "outcome.captured" ? "outcome_recorded" :
      eventType === "lesson.created" ? "experience_captured" :
      eventType === "future_instruction.created" ? "future_instruction_created" :
      eventType === "skill_candidate.created" ? "skill_candidate_generated" :
      "governance_review_queued",
    source: "company-brain",
    subject: {
      type: "experience",
      id: String(payload.outcomeId ?? payload.futureInstructionId ?? payload.skillCandidateId ?? payload.mistakeRuleId ?? ""),
      label: eventType,
    },
    payload: {
      eventType,
      ...payload,
      proofLoop: "AgentRun -> Outcome -> ExperienceRecord -> Lesson -> Future Instruction -> Mistake Immunity -> Skill Candidate",
      at: new Date().toISOString(),
    },
  });
}

async function experienceContext(req: Request) {
  const currentScope = scope(req);
  const [outcomes, runs, futureInstructions, skills] = await Promise.all([
    listOutcomes(currentScope, stringQuery(req, "workspaceId")),
    listAgentRuns(currentScope, stringQuery(req, "workspaceId")),
    listFutureInstructions(currentScope, stringQuery(req, "workspaceId")),
    listAgentSkills(currentScope, stringQuery(req, "workspaceId")),
  ]);
  const runById = new Map(runs.map((run) => [run.id, run]));
  return { currentScope, outcomes, runs, futureInstructions, skills, runById };
}

function outcomeRow(outcome: Awaited<ReturnType<typeof listOutcomes>>[number], run?: Awaited<ReturnType<typeof listAgentRuns>>[number]) {
  const filesChanged = toArray(outcome.filesChanged);
  const testsPassed = toArray(outcome.testsPassed);
  const testsFailed = toArray(outcome.testsFailed);
  return {
    id: outcome.id,
    displayId: `#O-${outcome.createdAt.toISOString().slice(0, 10)}-${outcome.id.slice(-4).toUpperCase()}`,
    workspaceId: outcome.workspaceId,
    agentRunId: outcome.agentRunId,
    problem: outcome.summary,
    context: run?.targetAgent ?? "Agent Run",
    action: run?.status ?? "Completed",
    mistake: outcome.failed,
    fix: outcome.worked,
    outcome: testsFailed.length > 0 ? "Needs Review" : "Completed",
    lesson: outcome.futureLesson,
    lessonId: `L-${outcome.id.slice(-4).toUpperCase()}`,
    futureInstruction: `FI-${outcome.id.slice(-4).toUpperCase()}`,
    time: outcome.createdAt,
    humanCorrection: outcome.humanCorrection,
    filesChanged,
    testsPassed,
    testsFailed,
    proofAvailable: true,
  };
}

experienceRouter.get("/summary", asyncHandler(async (req, res) => {
  try {
    const { outcomes, futureInstructions, skills } = await experienceContext(req);
    const humanCorrections = outcomes.filter((outcome) => outcome.humanCorrection).length;
    res.json({
      metrics: [
        { key: "outcomes", label: "Outcomes Captured", value: outcomes.length, trendValue: `${pct(outcomes.length, Math.max(outcomes.length - 1, 1))}%` },
        { key: "experienceRecords", label: "Experience Records", value: outcomes.length, trendValue: `${pct(outcomes.filter((outcome) => outcome.futureLesson).length, Math.max(outcomes.length, 1))}%` },
        { key: "humanCorrections", label: "Human Corrections", value: humanCorrections, trendValue: `${pct(humanCorrections, Math.max(outcomes.length, 1))}%` },
        { key: "lessons", label: "Lessons Created", value: outcomes.filter((outcome) => outcome.futureLesson).length, trendValue: `${pct(futureInstructions.length, Math.max(outcomes.length, 1))}%` },
        { key: "skillCandidates", label: "Skill Candidates", value: skills.filter((skill) => skill.status === "candidate").length, trendValue: `${pct(skills.length, Math.max(outcomes.length, 1))}%` },
      ],
      totals: {
        outcomes: outcomes.length,
        experienceRecords: outcomes.length,
        humanCorrections,
        lessons: outcomes.filter((outcome) => outcome.futureLesson).length,
        futureInstructions: futureInstructions.length,
        skillCandidates: skills.length,
      },
    });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

experienceRouter.get("/trend", asyncHandler(async (req, res) => {
  try {
    const days = rangeDays(stringQuery(req, "range"));
    const { outcomes } = await experienceContext(req);
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);
    const points = Array.from({ length: days }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const next = new Date(date);
      next.setDate(date.getDate() + 1);
      const count = outcomes.filter((outcome) => outcome.createdAt >= date && outcome.createdAt < next).length;
      return { name: dayKey(date), value: Math.min(100, count * 20), count };
    });
    const learned = outcomes.filter((outcome) => outcome.futureLesson).length;
    res.json({ range: stringQuery(req, "range") ?? "7d", points, learningRate: pct(learned, outcomes.length) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

experienceRouter.get("/common-lessons", asyncHandler(async (req, res) => {
  try {
    const { outcomes } = await experienceContext(req);
    const counts = new Map<string, number>();
    for (const outcome of outcomes) {
      const lesson = outcome.futureLesson || outcome.summary;
      counts.set(lesson, (counts.get(lesson) ?? 0) + 1);
    }
    res.json({
      lessons: [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([title, count], index) => ({ id: `lesson-${index + 1}`, title, count })),
    });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

experienceRouter.get("/transformations", asyncHandler(async (req, res) => {
  try {
    const { outcomes, runById } = await experienceContext(req);
    res.json({
      transformations: outcomes.slice(0, 5).map((outcome) => ({
        id: `transformation-${outcome.id}`,
        outcomeId: outcome.id,
        rawOutcome: [outcome.summary, outcome.failed, outcome.worked].filter(Boolean),
        futureInstruction: [outcome.futureLesson],
        confidence: outcome.humanCorrection ? 78 : 92,
        targetAgent: runById.get(outcome.agentRunId)?.targetAgent ?? "Agent",
      })),
    });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

experienceRouter.get("/search", asyncHandler(async (req, res) => {
  try {
    const query = stringQuery(req, "query");
    const limit = Number(stringQuery(req, "limit") ?? 20);
    const verdictQuery = stringQuery(req, "verdict");
    const verdict =
      verdictQuery === "PASS" || verdictQuery === "FAIL" || verdictQuery === "UNKNOWN"
        ? verdictQuery
        : verdictQuery?.toUpperCase();
    const results = await searchVerificationExperiences({
      userId: req.authUserId,
      orgId: req.authOrgId,
      query,
      limit: Number.isFinite(limit) ? limit : 20,
      verdict,
    });
    res.json(results);
  } catch (error) {
    sendRouteError(res, error);
  }
}));

experienceRouter.get("/lessons", asyncHandler(async (req, res) => {
  try {
    const query = stringQuery(req, "query");
    const limit = Number(stringQuery(req, "limit") ?? 10);
    const lessons = await listExperienceLessons({
      userId: req.authUserId,
      orgId: req.authOrgId,
      query,
      limit: Number.isFinite(limit) ? limit : 10,
    });
    res.json(lessons);
  } catch (error) {
    sendRouteError(res, error);
  }
}));

experienceRouter.get("/failure-patterns", asyncHandler(async (req, res) => {
  try {
    const query = stringQuery(req, "query");
    const limit = Number(stringQuery(req, "limit") ?? 10);
    const patterns = await listFailurePatterns({
      userId: req.authUserId,
      orgId: req.authOrgId,
      query,
      limit: Number.isFinite(limit) ? limit : 10,
    });
    res.json(patterns);
  } catch (error) {
    sendRouteError(res, error);
  }
}));

experienceRouter.get("/root-causes", asyncHandler(async (req, res) => {
  try {
    const query = stringQuery(req, "query");
    const limit = Number(stringQuery(req, "limit") ?? 10);
    const rootCauses = await listRootCauses({
      userId: req.authUserId,
      orgId: req.authOrgId,
      query,
      limit: Number.isFinite(limit) ? limit : 10,
    });
    res.json(rootCauses);
  } catch (error) {
    sendRouteError(res, error);
  }
}));

experienceRouter.get("/similar", asyncHandler(async (req, res) => {
  try {
    const query = stringQuery(req, "query");
    const experienceId = stringQuery(req, "experienceId");
    const repository = stringQuery(req, "repository");
    const verdictQuery = stringQuery(req, "verdict");
    const verdict =
      verdictQuery === "PASS" || verdictQuery === "FAIL" || verdictQuery === "UNKNOWN"
        ? verdictQuery
        : verdictQuery?.toUpperCase();
    const limit = Number(stringQuery(req, "limit") ?? 10);
    const similar = await findSimilarExperiences({
      userId: req.authUserId,
      orgId: req.authOrgId,
      query,
      experienceId,
      repository,
      verdict,
      limit: Number.isFinite(limit) ? limit : 10,
    });
    res.json(similar);
  } catch (error) {
    sendRouteError(res, error);
  }
}));

experienceRouter.get("/recommendations", asyncHandler(async (req, res) => {
  try {
    const query = stringQuery(req, "query");
    const repository = stringQuery(req, "repository");
    const verdictQuery = stringQuery(req, "verdict");
    const verdict =
      verdictQuery === "PASS" || verdictQuery === "FAIL" || verdictQuery === "UNKNOWN"
        ? verdictQuery
        : verdictQuery?.toUpperCase();
    const limit = Number(stringQuery(req, "limit") ?? 10);
    const recommendations = await buildExperienceRecommendations({
      userId: req.authUserId,
      orgId: req.authOrgId,
      query,
      repository,
      verdict,
      limit: Number.isFinite(limit) ? limit : 10,
    });
    res.json(recommendations);
  } catch (error) {
    sendRouteError(res, error);
  }
}));

experienceRouter.get("/outcomes", asyncHandler(async (req, res) => {
  try {
    const { outcomes, runById } = await experienceContext(req);
    res.json({ outcomes: outcomes.map((outcome) => outcomeRow(outcome, runById.get(outcome.agentRunId))) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

experienceRouter.get("/outcomes/:id/proof", asyncHandler(async (req, res) => {
  try {
    const outcome = await getOutcome(scope(req), stringParam(req, "id"));
    const blackBox = await getAgentRunBlackBox(scope(req), outcome.agentRunId);
    res.json({
      proof: {
        outcome,
        blackBox,
        lineage: "AgentRun -> Outcome -> ExperienceRecord -> Lesson -> Future Instruction -> Mistake Immunity -> Skill Candidate",
      },
    });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

experienceRouter.get("/outcomes/:id", asyncHandler(async (req, res) => {
  try {
    const outcome = await getOutcome(scope(req), stringParam(req, "id"));
    const runs = await listAgentRuns(scope(req), outcome.workspaceId);
    res.json({ outcome: outcomeRow(outcome, runs.find((run) => run.id === outcome.agentRunId)) });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

experienceRouter.post("/outcomes/:id/create-future-instruction", asyncHandler(async (req, res) => {
  try {
    const outcome = await getOutcome(scope(req), stringParam(req, "id"));
    const futureInstruction = await createFutureInstructionFromRun(scope(req), outcome.agentRunId, { instruction: outcome.futureLesson });
    emitExperienceEvent(req, "future_instruction.created", { outcomeId: outcome.id, futureInstructionId: futureInstruction.id });
    res.status(201).json({ futureInstruction });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

experienceRouter.post("/outcomes/:id/create-mistake-rule", asyncHandler(async (req, res) => {
  try {
    const outcome = await getOutcome(scope(req), stringParam(req, "id"));
    const mistakeRule = await createMistakeRuleFromRun(scope(req), outcome.agentRunId, {
      trigger: outcome.summary,
      prevention: outcome.futureLesson,
    });
    emitExperienceEvent(req, "mistake_rule.created", { outcomeId: outcome.id, mistakeRuleId: mistakeRule.id });
    res.status(201).json({ mistakeRule });
  } catch (error) {
    sendRouteError(res, error);
  }
}));

experienceRouter.post("/outcomes/:id/create-skill-candidate", asyncHandler(async (req, res) => {
  try {
    const outcome = await getOutcome(scope(req), stringParam(req, "id"));
    const skillCandidate = await createSkillCandidateFromRun(scope(req), outcome.agentRunId, {
      name: `Skill Candidate: ${outcome.summary.slice(0, 80)}`,
      requiredTests: outcome.testsPassed,
    });
    emitExperienceEvent(req, "skill_candidate.created", { outcomeId: outcome.id, skillCandidateId: skillCandidate.id });
    res.status(201).json({ skillCandidate });
  } catch (error) {
    sendRouteError(res, error);
  }
}));
