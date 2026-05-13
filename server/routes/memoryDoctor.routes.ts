/**
 * Memory Doctor Routes — AI-powered memory operations.
 *
 * POST /explain/:id        — Agent A explains why a memory exists
 * POST /promote/:id        — Promote episodic → structured memory
 * POST /autopilot          — Agent B full memory audit
 * POST /compile            — Agent B compile raw memories
 */

import { Router, type Request, type Response } from "express";
import { invokeAgentJson } from "../../lib/ai/agentRouter";
import { explainMemory } from "../../lib/memory/explainMemory";
import { getMemoryStoreAdapter } from "../../lib/adapters/registry";
import { listMemories } from "../../lib/memory/listMemory";
import { asyncHandler } from "../middleware/asyncHandler";
import { buildApiMeta, sendApiError, sendApiSuccess } from "./api-response";

export const memoryDoctorRouter = Router();

// ─── Types ───────────────────────────────────────────────────────────────────

interface ExplainAgentResponse {
  summary: string;
  reason: string;
  category: string;
  recommendation: string;
  confidence: number;
}

interface AutopilotIssue {
  type: string;
  severity: "info" | "warning" | "critical";
  message: string;
  action: string;
}

interface AutopilotSuggestedAction {
  label: string;
  action: string;
  count: number;
}

interface AutopilotResponse {
  issues: AutopilotIssue[];
  suggestedActions: AutopilotSuggestedAction[];
}

interface CompiledMemory {
  type: string;
  content: string;
  mergedFrom: string[];
  confidence: number;
}

interface CompileResponse {
  compiled: CompiledMemory[];
  removedDuplicates: number;
  keptRawTrace: boolean;
}

// ─── POST /explain/:id ───────────────────────────────────────────────────────

memoryDoctorRouter.post(
  "/explain/:id",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const started = Date.now();
    const memoryId = req.params.id as string;
    const userId = req.authUserId ?? "anonymous";

    const localExplain = await explainMemory({ memoryId, userId });
    if (!localExplain) {
      sendApiError(res, 404, {
        code: "NOT_FOUND",
        message: `Memory ${memoryId} not found`,
      }, buildApiMeta(req, started));
      return;
    }

    try {
      const memoryJson = JSON.stringify({
        id: localExplain.memory.id,
        content: localExplain.memory.content,
        type: localExplain.memory.type,
        summary: localExplain.memory.summary,
        status: localExplain.memory.status,
        confidence: localExplain.memory.confidence,
        importanceScore: localExplain.memory.importanceScore,
        evidenceCount: localExplain.memory.evidenceCount,
        createdAt: localExplain.memory.createdAt,
        updatedAt: localExplain.memory.updatedAt,
        stalenessBucket: localExplain.explanation.stalenessBucket,
        stalenessDays: localExplain.explanation.stalenessDays,
      }, null, 2);

      const agentResult = await invokeAgentJson<ExplainAgentResponse>({
        agentId: "agent-a",
        systemPrompt: `You are MemoryOS Agent A, a fast memory classification agent.
Given a memory object, explain why it exists, classify it, and recommend an action.
Respond ONLY with JSON:
{
  "summary": "One-line summary",
  "reason": "Why this memory was saved",
  "category": "project | task | decision | preference | constraint | risk | handoff | episodic",
  "recommendation": "keep | merge | promote | delete",
  "confidence": 0.0-1.0
}`,
        userMessage: `Analyze this memory:\n${memoryJson}`,
        maxTokens: 500,
      });

      sendApiSuccess(res, 200, {
        ...agentResult,
        localExplanation: localExplain.explanation,
        memory: localExplain.memory,
      }, buildApiMeta(req, started));
    } catch (error) {
      sendApiSuccess(res, 200, {
        summary: localExplain.memory.summary ?? localExplain.memory.content.slice(0, 100),
        reason: localExplain.explanation.whySaved,
        category: localExplain.memory.type ?? "episodic",
        recommendation: "keep",
        confidence: localExplain.memory.confidence,
        localExplanation: localExplain.explanation,
        memory: localExplain.memory,
        agentError: error instanceof Error ? error.message : "Agent unavailable",
      }, buildApiMeta(req, started));
    }
  }),
);

// ─── POST /promote/:id ──────────────────────────────────────────────────────

memoryDoctorRouter.post(
  "/promote/:id",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const started = Date.now();
    const memoryId = req.params.id as string;
    const userId = req.authUserId ?? "anonymous";

    const adapter = getMemoryStoreAdapter();
    const raw = await adapter.getMemoryById({ id: memoryId });
    if (!raw) {
      sendApiError(res, 404, {
        code: "NOT_FOUND",
        message: `Memory ${memoryId} not found`,
      }, buildApiMeta(req, started));
      return;
    }

    const metadata = (raw.metadata && typeof raw.metadata === "object"
      ? raw.metadata
      : {}) as Record<string, unknown>;

    const currentType = typeof metadata.type === "string" ? metadata.type : "episodic";

    let promotedType = "project";
    try {
      const classifyResult = await invokeAgentJson<{
        promotedType: string;
        reason: string;
        confidence: number;
      }>({
        agentId: "agent-a",
        systemPrompt: `You are MemoryOS Agent A. Classify what type a memory should be promoted to.
Respond ONLY with JSON:
{ "promotedType": "project | preference | learning | profile", "reason": "Why", "confidence": 0.0-1.0 }`,
        userMessage: `Current type: ${currentType}\nContent: ${raw.memory ?? ""}\nSummary: ${metadata.summary ?? ""}`,
        maxTokens: 300,
      });
      promotedType = classifyResult.promotedType || "project";
    } catch {
      // default to "project"
    }

    await adapter.saveMemory({
      memory: {
        id: raw.id,
        userId,
        type: promotedType as any,
        content: raw.memory ?? "",
        summary: (metadata.summary as string) ?? "",
        importanceScore: typeof metadata.importanceScore === "number" ? metadata.importanceScore : 0.7,
        confidence: typeof metadata.confidence === "number" ? Math.min(1, metadata.confidence + 0.1) : 0.8,
        source: (metadata.source as any) ?? "system",
        status: "active",
        createdAt: (metadata.createdAt as string) ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        evidenceCount: typeof metadata.evidenceCount === "number" ? metadata.evidenceCount + 1 : 2,
      },
    });

    sendApiSuccess(res, 200, {
      memoryId,
      previousType: currentType,
      promotedType,
      status: "promoted",
    }, buildApiMeta(req, started));
  }),
);

// ─── POST /autopilot ─────────────────────────────────────────────────────────

memoryDoctorRouter.post(
  "/autopilot",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const started = Date.now();
    const userId = req.authUserId ?? "anonymous";

    const result = await listMemories({ userId, limit: 200 });
    const allMemories = result.memories;

    if (allMemories.length === 0) {
      sendApiSuccess(res, 200, {
        issues: [],
        suggestedActions: [],
      } as AutopilotResponse, buildApiMeta(req, started));
      return;
    }

    const memoryDigest = allMemories.slice(0, 50).map((m) => ({
      id: m.id,
      type: m.type,
      summary: m.summary?.slice(0, 80),
      content: m.content?.slice(0, 120),
      status: m.status,
      confidence: m.confidence,
      updatedAt: m.updatedAt,
    }));

    try {
      const agentResult = await invokeAgentJson<AutopilotResponse>({
        agentId: "agent-b",
        systemPrompt: `You are MemoryOS Agent B, a deep reasoning agent for memory quality analysis.
Analyze the developer's memory store and detect issues like duplicates, weak goals, low confidence, stale, conflicts.
Return ONLY JSON:
{
  "issues": [{ "type": "string", "severity": "info|warning|critical", "message": "string", "action": "string" }],
  "suggestedActions": [{ "label": "string", "action": "string", "count": 0 }]
}
Be specific. Reference actual patterns you see.`,
        userMessage: `Total memories: ${allMemories.length}\n\nDigest:\n${JSON.stringify(memoryDigest, null, 2)}`,
        maxTokens: 1200,
      });
      sendApiSuccess(res, 200, agentResult, buildApiMeta(req, started));
    } catch (error) {
      // Heuristic fallback
      const issues: AutopilotIssue[] = [];
      const suggestedActions: AutopilotSuggestedAction[] = [];

      const episodicCount = allMemories.filter((m) => m.type === "episodic").length;
      const lowConfCount = allMemories.filter((m) => m.confidence < 0.5).length;
      const projectCount = allMemories.filter((m) => m.type === "project").length;

      if (episodicCount > allMemories.length * 0.5) {
        issues.push({
          type: "high_noise", severity: "warning",
          message: `${episodicCount} of ${allMemories.length} memories are episodic. This reduces retrieval quality.`,
          action: "merge_duplicates",
        });
        suggestedActions.push({ label: "Compile episodic memories", action: "merge", count: episodicCount });
      }
      if (lowConfCount > 0) {
        issues.push({ type: "low_confidence", severity: "info", message: `${lowConfCount} memories have low confidence.`, action: "delete_stale" });
      }
      if (projectCount === 0) {
        issues.push({ type: "missing_project", severity: "critical", message: "No project-type memory found.", action: "create_project" });
      }

      sendApiSuccess(res, 200, {
        issues, suggestedActions,
        agentError: error instanceof Error ? error.message : "Agent B unavailable",
      }, buildApiMeta(req, started));
    }
  }),
);

// ─── POST /compile ───────────────────────────────────────────────────────────

memoryDoctorRouter.post(
  "/compile",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const started = Date.now();
    const userId = req.authUserId ?? "anonymous";

    const result = await listMemories({ userId, limit: 200 });
    const episodicMemories = result.memories.filter(
      (m) => m.type === "episodic" || m.confidence < 0.5,
    );

    if (episodicMemories.length === 0) {
      sendApiSuccess(res, 200, {
        compiled: [], removedDuplicates: 0, keptRawTrace: true,
      } as CompileResponse, buildApiMeta(req, started));
      return;
    }

    const memoryDigest = episodicMemories.slice(0, 30).map((m) => ({
      id: m.id, type: m.type,
      content: m.content?.slice(0, 200),
      summary: m.summary?.slice(0, 100),
      confidence: m.confidence,
    }));

    try {
      const agentResult = await invokeAgentJson<CompileResponse>({
        agentId: "agent-b",
        systemPrompt: `You are MemoryOS Agent B. Compile noisy raw/episodic memories into clean project intelligence.
Merge repeated chat turns, group by theme, keep raw trace IDs in mergedFrom.
Return ONLY JSON:
{
  "compiled": [{ "type": "string", "content": "string", "mergedFrom": ["id"], "confidence": 0.0-1.0 }],
  "removedDuplicates": 0,
  "keptRawTrace": true
}`,
        userMessage: `Episodic memories (${episodicMemories.length}):\n${JSON.stringify(memoryDigest, null, 2)}`,
        maxTokens: 1500,
      });
      sendApiSuccess(res, 200, agentResult, buildApiMeta(req, started));
    } catch (error) {
      sendApiError(res, 500, {
        code: "AGENT_ERROR",
        message: error instanceof Error ? error.message : "Agent B failed",
      }, buildApiMeta(req, started));
    }
  }),
);
