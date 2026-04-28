import { Router } from "express";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { runIngestFlowLangGraph } from "../../lib/workflows/ingestGraphLangGraph";
import { runRetrieveFlowLangGraph } from "../../lib/workflows/retrieveGraphLangGraph";
import { analyzeRetrieval } from "../../lib/memory/retrieveRelevantMemory";
import { listRevisionEvents } from "../../lib/memory/revisionMemory";
import { listTimelineEvents } from "../../lib/memory/timelineMemory";
import { explainMemory } from "../../lib/memory/explainMemory";
import {
  archiveMemory,
  unarchiveMemory,
  updateMemoryStatus,
} from "../../lib/memory/archiveMemory";
import { getRetrievalWeights, setRetrievalWeights } from "../../lib/config/retrievalWeights";
import { listMemories, getMemoryForUser } from "../../lib/memory/listMemory";
import { runContinueFlowLangGraph } from "../../lib/workflows/continueGraphLangGraph";
import { runHandoffFlowLangGraph } from "../../lib/workflows/handoffGraphLangGraph";
import { runResumeFlowLangGraph } from "../../lib/workflows/resumeGraphLangGraph";
import { MEMORY_STATUS, MEMORY_TYPES, type MemoryStatus, type MemoryType } from "../../lib/memory/types";
import { ensureMemoryStoreIntegrity } from "../../lib/memory/startupIntegrity";
import { isRelationalRuntimeStore } from "../../lib/storage/runtimeStoreBackend";
import { isRuntimeStoreDbHealthy } from "../../lib/storage/runtimeStoreDb";
import { listRequestHistory } from "../middleware/requestLogger";
import {
  ContinueMemorySchema,
  HandoffMemorySchema,
  ProcessMemorySchema,
  VoiceChunkIngestSchema,
  VoiceSessionEndSchema,
  VoiceSessionStartSchema,
  ResumeMemorySchema,
  MemoryStatusPatchSchema,
  RetrievalWeightsSchema,
  RetrieveMemorySchema,
} from "../schemas/memory.schema";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  type ContinueResponseData,
  type HandoffResponseData,
  type ResumeResponseData,
  type RetrieveExplainResponseData,
  type RetrieveResponseData,
} from "../types/api-contracts";
import { buildApiMeta, sendApiError, sendApiSuccess } from "./api-response";
import {
  endVoiceSession,
  getVoiceSession,
  recordVoiceChunk,
  startVoiceSession,
} from "../../lib/voice/sessionStore";

export const memoryRouter = Router();

const DATA_DIR = path.join(process.cwd(), "data");
const RECENT_MEMORY_STORE_PATH = path.join(DATA_DIR, "recent-memories.json");
const TIMELINE_STORE_PATH = path.join(DATA_DIR, "timeline-events.json");
const REVISION_STORE_PATH = path.join(DATA_DIR, "revision-events.json");
const BEST_CONFIG_PATH = path.join(DATA_DIR, "eval", "best-config.json");
const BASELINE_REPORT_PATH = path.join(DATA_DIR, "eval", "baseline-report.json");
const BENCHMARK_REPORT_PATH = path.join(DATA_DIR, "eval", "benchmark-report.json");

const REQUEST_RANGE_DAYS = {
  "1d": 1,
  "7d": 7,
  "30d": 30,
  all: null,
} as const;

const REQUEST_STATUSES = ["Success", "Error"] as const;

type BaselineReport = {
  passRate: number;
  totalCases: number;
  updatedAt?: string;
};

type RequestRange = keyof typeof REQUEST_RANGE_DAYS;

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasValidJsonFile(
  filePath: string,
  isValid: (value: unknown) => boolean,
): boolean {
  if (!existsSync(filePath)) {
    return false;
  }

  try {
    const raw = readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return isValid(parsed);
  } catch {
    return false;
  }
}

async function hasValidStores(): Promise<boolean> {
  if (isRelationalRuntimeStore()) {
    return isRuntimeStoreDbHealthy();
  }

  const recentOk = hasValidJsonFile(RECENT_MEMORY_STORE_PATH, (value) => {
    if (!isObjectRecord(value)) {
      return false;
    }
    return Object.values(value).every((entry) => Array.isArray(entry));
  });

  const timelineOk = hasValidJsonFile(TIMELINE_STORE_PATH, Array.isArray);
  const revisionOk = hasValidJsonFile(REVISION_STORE_PATH, Array.isArray);

  return recentOk && timelineOk && revisionOk;
}

function hasValidBestConfig(): boolean {
  return hasValidJsonFile(BEST_CONFIG_PATH, (value) => {
    if (!isObjectRecord(value)) {
      return false;
    }

    const threshold = value.threshold;
    const weights = value.weights;

    if (
      typeof threshold !== "number" ||
      Number.isNaN(threshold) ||
      threshold < 0 ||
      threshold > 1
    ) {
      return false;
    }

    if (!isObjectRecord(weights)) {
      return false;
    }

    const semantic = weights.semantic;
    const typeRelevance = weights.typeRelevance;
    const importance = weights.importance;
    const recency = weights.recency;

    const values = [semantic, typeRelevance, importance, recency];

    if (
      values.some(
        (item) =>
          typeof item !== "number" ||
          Number.isNaN(item) ||
          item < 0 ||
          item > 1,
      )
    ) {
      return false;
    }

    const sum =
      (semantic as number) +
      (typeRelevance as number) +
      (importance as number) +
      (recency as number);
    return Math.abs(sum - 1) <= 1e-6;
  });
}

function hasValidBaselineReport(): boolean {
  return hasValidJsonFile(BASELINE_REPORT_PATH, (value) => {
    if (!isObjectRecord(value)) {
      return false;
    }

    const passRate = value.passRate;
    const totalCases = value.totalCases;

    return (
      typeof passRate === "number" &&
      !Number.isNaN(passRate) &&
      passRate >= 0 &&
      passRate <= 100 &&
      typeof totalCases === "number" &&
      Number.isInteger(totalCases) &&
      totalCases > 0
    );
  });
}

function readBaselineReport(): BaselineReport | null {
  if (!existsSync(BASELINE_REPORT_PATH)) {
    return null;
  }

  try {
    const raw = readFileSync(BASELINE_REPORT_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (!isObjectRecord(parsed)) {
      return null;
    }

    const passRate = parsed.passRate;
    const totalCases = parsed.totalCases;
    const updatedAt = parsed.updatedAt;

    if (
      typeof passRate !== "number" ||
      Number.isNaN(passRate) ||
      passRate < 0 ||
      passRate > 100
    ) {
      return null;
    }

    if (
      typeof totalCases !== "number" ||
      !Number.isInteger(totalCases) ||
      totalCases <= 0
    ) {
      return null;
    }

    if (updatedAt !== undefined && typeof updatedAt !== "string") {
      return null;
    }

    return {
      passRate,
      totalCases,
      ...(typeof updatedAt === "string" ? { updatedAt } : {}),
    };
  } catch {
    return null;
  }
}

function parseQueryTopK(raw: unknown): number | undefined {
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return undefined;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 20) {
    return undefined;
  }

  return parsed;
}

function parseQueryIncludeArchived(raw: unknown): boolean | undefined {
  if (typeof raw !== "string") {
    return undefined;
  }

  const lowered = raw.toLowerCase();
  if (lowered === "true") {
    return true;
  }

  if (lowered === "false") {
    return false;
  }

  return undefined;
}

function parseOptionalQueryText(raw: unknown): string | undefined {
  if (typeof raw !== "string") {
    return undefined;
  }

  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseRequestRange(raw: unknown): RequestRange {
  if (typeof raw !== "string") {
    return "30d";
  }

  const lowered = raw.toLowerCase() as RequestRange;
  if (lowered in REQUEST_RANGE_DAYS) {
    return lowered;
  }

  return "30d";
}

function buildWhyTop1(top?: {
  memoryType?: string;
  finalScore: number;
  semanticScore: number;
  typeRelevanceScore: number;
  importanceScore: number;
  recencyScore: number;
  continuityBoost: number;
  reasonTags?: string[];
}): string {
  if (!top) {
    return "No ranked memories found for this question.";
  }

  const reasonPart =
    top.reasonTags && top.reasonTags.length > 0
      ? ` Key reasons: ${top.reasonTags.slice(0, 3).join(", ")}.`
      : "";

  return `Top memory ranked highest because it matched intent/type (${top.memoryType ?? "unknown"}), had semantic relevance ${top.semanticScore.toFixed(2)}, and reached final score ${top.finalScore.toFixed(2)} with continuity boost ${top.continuityBoost.toFixed(2)}.${reasonPart}`;
}

function labelForVoiceSpeaker(
  speaker: "user" | "assistant" | "system" | undefined,
): string | null {
  if (!speaker) {
    return null;
  }

  if (speaker === "user") {
    return "User";
  }

  if (speaker === "assistant") {
    return "Assistant";
  }

  return "System";
}

function formatVoiceChunkMessage(input: {
  chunk: string;
  speaker?: "user" | "assistant" | "system";
  chunkIndex?: number;
  tags?: string[];
  sentiment?: "positive" | "neutral" | "negative";
}): string {
  const speakerLabel = labelForVoiceSpeaker(input.speaker);
  const core = speakerLabel ? `${speakerLabel}: ${input.chunk}` : input.chunk;
  const metadata: string[] = [];

  if (typeof input.chunkIndex === "number") {
    metadata.push(`chunkIndex=${input.chunkIndex}`);
  }

  if (input.sentiment) {
    metadata.push(`sentiment=${input.sentiment}`);
  }

  if (input.tags && input.tags.length > 0) {
    metadata.push(`tags=${input.tags.join(",")}`);
  }

  if (metadata.length === 0) {
    return core;
  }

  return `${core}\n[voice_meta ${metadata.join(" ")}]`;
}

memoryRouter.post(
  "/process",
  asyncHandler(async (req, res) => {
    const parsed = ProcessMemorySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request body",
        details: parsed.error.flatten(),
      });
      return;
    }

    const result = await runIngestFlowLangGraph({
      userId: req.authUserId,
      threadId: parsed.data.threadId,
      message: parsed.data.message,
    });

    res.status(200).json({
      acceptedMemories: result.acceptedMemories,
      rejectedMemories: result.rejectedMemories,
      timelineEvents: result.timelineEvents,
    });
  }),
);

memoryRouter.post(
  "/voice/sessions/start",
  asyncHandler(async (req, res) => {
    const parsed = VoiceSessionStartSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request body",
        details: parsed.error.flatten(),
      });
      return;
    }

    const session = await startVoiceSession({
      sessionId: parsed.data.sessionId,
      userId: req.authUserId,
      source: parsed.data.source,
      ...(parsed.data.workspace ? { workspace: parsed.data.workspace } : {}),
      ...(parsed.data.project ? { project: parsed.data.project } : {}),
      ...(parsed.data.threadId ? { threadId: parsed.data.threadId } : {}),
      ...(parsed.data.metadata ? { metadata: parsed.data.metadata } : {}),
    });

    res.status(200).json({
      session,
    });
  }),
);

memoryRouter.post(
  "/voice/chunk",
  asyncHandler(async (req, res) => {
    const parsed = VoiceChunkIngestSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request body",
        details: parsed.error.flatten(),
      });
      return;
    }

    const existingSession = getVoiceSession(req.authUserId, parsed.data.sessionId);
    if (!existingSession) {
      await startVoiceSession({
        sessionId: parsed.data.sessionId,
        userId: req.authUserId,
        source: "pipecat",
        ...(parsed.data.workspace ? { workspace: parsed.data.workspace } : {}),
        ...(parsed.data.project ? { project: parsed.data.project } : {}),
        ...(parsed.data.threadId ? { threadId: parsed.data.threadId } : {}),
      });
    }

    const session = getVoiceSession(req.authUserId, parsed.data.sessionId);
    const resolvedThreadId =
      parsed.data.threadId ?? session?.threadId ?? `voice:${parsed.data.sessionId}`;

    const chunkMessage = formatVoiceChunkMessage({
      chunk: parsed.data.chunk,
      speaker: parsed.data.speaker,
      chunkIndex: parsed.data.chunkIndex,
      tags: parsed.data.tags,
      sentiment: parsed.data.sentiment,
    });

    const ingestResult = await runIngestFlowLangGraph({
      userId: req.authUserId,
      threadId: resolvedThreadId,
      message: chunkMessage,
    });

    const updatedSession = await recordVoiceChunk({
      sessionId: parsed.data.sessionId,
      userId: req.authUserId,
      chunkCharacters: parsed.data.chunk.length,
      ...(parsed.data.workspace ? { workspace: parsed.data.workspace } : {}),
      ...(parsed.data.project ? { project: parsed.data.project } : {}),
      threadId: resolvedThreadId,
    });

    res.status(200).json({
      session: updatedSession,
      acceptedMemories: ingestResult.acceptedMemories,
      rejectedMemories: ingestResult.rejectedMemories,
      timelineEvents: ingestResult.timelineEvents,
    });
  }),
);

memoryRouter.get("/voice/sessions/:sessionId", (req, res) => {
  const sessionId =
    typeof req.params.sessionId === "string" && req.params.sessionId.trim().length > 0
      ? req.params.sessionId.trim()
      : undefined;

  if (!sessionId) {
    res.status(400).json({ error: "sessionId is required" });
    return;
  }

  const session = getVoiceSession(req.authUserId, sessionId);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  res.status(200).json({ session });
});

memoryRouter.post(
  "/voice/sessions/end",
  asyncHandler(async (req, res) => {
    const parsed = VoiceSessionEndSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request body",
        details: parsed.error.flatten(),
      });
      return;
    }

    const existingSession = getVoiceSession(req.authUserId, parsed.data.sessionId);
    if (!existingSession) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    let summaryIngestResult:
      | {
          acceptedMemories: unknown[];
          rejectedMemories: unknown[];
          timelineEvents: unknown[];
        }
      | undefined;

    if (parsed.data.finalSummary) {
      const threadId = existingSession.threadId ?? `voice:${parsed.data.sessionId}`;
      const result = await runIngestFlowLangGraph({
        userId: req.authUserId,
        threadId,
        message: `Voice session summary: ${parsed.data.finalSummary}`,
      });

      summaryIngestResult = {
        acceptedMemories: result.acceptedMemories,
        rejectedMemories: result.rejectedMemories,
        timelineEvents: result.timelineEvents,
      };
    }

    const session = await endVoiceSession({
      userId: req.authUserId,
      sessionId: parsed.data.sessionId,
    });

    res.status(200).json({
      session,
      ...(summaryIngestResult ? { summaryIngestResult } : {}),
    });
  }),
);

memoryRouter.post(
  "/retrieve",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = RetrieveMemorySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError<RetrieveResponseData>(
        res,
        400,
        {
          code: "BAD_REQUEST",
          message: "Invalid request body",
          details: parsed.error.flatten(),
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const result = await runRetrieveFlowLangGraph({
      userId: req.authUserId,
      question: parsed.data.question,
      topK: parsed.data.topK,
      ...(parsed.data.includeArchived !== undefined
        ? { includeArchived: parsed.data.includeArchived }
        : {}),
      ...(parsed.data.workspace ? { workspace: parsed.data.workspace } : {}),
      ...(parsed.data.project ? { project: parsed.data.project } : {}),
      ...(parsed.data.threadId ? { threadId: parsed.data.threadId } : {}),
    });

    sendApiSuccess<RetrieveResponseData>(
      res,
      200,
      result,
      buildApiMeta(req, startedAt, {
        intent: result.debug[0]?.intent,
      }),
    );
  }),
);

memoryRouter.get(
  "/retrieve/explain",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const question =
      typeof req.query.question === "string" && req.query.question.trim().length > 0
        ? req.query.question
        : undefined;

    if (!question) {
      sendApiError<RetrieveExplainResponseData>(
        res,
        400,
        {
          code: "BAD_REQUEST",
          message: "question is required",
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const topK = parseQueryTopK(req.query.topK);
    if (req.query.topK !== undefined && topK === undefined) {
      sendApiError<RetrieveExplainResponseData>(
        res,
        400,
        {
          code: "BAD_REQUEST",
          message: "topK must be a positive integer <= 20",
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const includeArchived = parseQueryIncludeArchived(req.query.includeArchived);
    if (req.query.includeArchived !== undefined && includeArchived === undefined) {
      sendApiError<RetrieveExplainResponseData>(
        res,
        400,
        {
          code: "BAD_REQUEST",
          message: "includeArchived must be true or false",
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const workspace = parseOptionalQueryText(req.query.workspace);
    const project = parseOptionalQueryText(req.query.project);
    const threadId = parseOptionalQueryText(req.query.threadId);

    const result = await runRetrieveFlowLangGraph({
      userId: req.authUserId,
      question,
      ...(topK !== undefined ? { topK } : {}),
      ...(includeArchived !== undefined ? { includeArchived } : {}),
      ...(workspace ? { workspace } : {}),
      ...(project ? { project } : {}),
      ...(threadId ? { threadId } : {}),
    });

    const debugById = new Map(result.debug.map((item) => [item.id, item]));
    const ranked = result.memories.map((memory) => {
      const debug = debugById.get(memory.id);
      return {
        id: memory.id,
        memory: memory.memory,
        memoryType: memory.memoryType,
        finalScore: memory.finalScore,
        semanticScore: memory.semanticScore,
        typeRelevanceScore: memory.typeRelevanceScore,
        importanceScore: memory.importanceScore,
        recencyScore: memory.recencyScore,
        continuityBoost: memory.continuityBoost,
        updatedAt: memory.updatedAt,
        intent: debug?.intent,
        weightsUsed: debug?.weightsUsed,
        reasonTags: debug?.reasonTags ?? [],
        contributions: debug?.contributions ?? {
          semantic: 0,
          typeRelevance: 0,
          importance: 0,
          recency: 0,
          continuity: 0,
          total: memory.finalScore,
        },
        lifecycle: debug?.lifecycle ?? {
          latestEventType: null,
          latestReason: null,
          latestChangedAt: null,
        },
      };
    });

    const firstDebug = result.debug[0];

    const responseData: RetrieveExplainResponseData = {
      intent: firstDebug?.intent ?? "general",
      weightsUsed: firstDebug?.weightsUsed ?? getRetrievalWeights(),
      ranked,
      whyTop1: buildWhyTop1(ranked[0]),
    };

    sendApiSuccess<RetrieveExplainResponseData>(
      res,
      200,
      responseData,
      buildApiMeta(req, startedAt, {
        intent: responseData.intent,
      }),
    );
  }),
);

memoryRouter.post(
  "/continue",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = ContinueMemorySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError<ContinueResponseData>(
        res,
        400,
        {
          code: "BAD_REQUEST",
          message: "Invalid request body",
          details: parsed.error.flatten(),
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const result = await runContinueFlowLangGraph({
      userId: req.authUserId,
      question: parsed.data.question,
      mode: parsed.data.mode,
      topK: parsed.data.topK,
      includeArchived: parsed.data.includeArchived,
      ...(parsed.data.workspace ? { workspace: parsed.data.workspace } : {}),
      ...(parsed.data.project ? { project: parsed.data.project } : {}),
      ...(parsed.data.threadId ? { threadId: parsed.data.threadId } : {}),
    });

    sendApiSuccess<ContinueResponseData>(
      res,
      200,
      result,
      buildApiMeta(req, startedAt, {
        intent: result.debug.mode,
      }),
    );
  }),
);

memoryRouter.post(
  "/handoff",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = HandoffMemorySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError<HandoffResponseData>(
        res,
        400,
        {
          code: "BAD_REQUEST",
          message: "Invalid request body",
          details: parsed.error.flatten(),
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const result = await runHandoffFlowLangGraph({
      userId: req.authUserId,
      project: parsed.data.project,
      question: parsed.data.question,
      topK: parsed.data.topK,
      includeArchived: parsed.data.includeArchived,
      ...(parsed.data.workspace ? { workspace: parsed.data.workspace } : {}),
      ...(parsed.data.threadId ? { threadId: parsed.data.threadId } : {}),
    });

    sendApiSuccess<HandoffResponseData>(
      res,
      200,
      result,
      buildApiMeta(req, startedAt, {
        intent: "handoff",
      }),
    );
  }),
);

memoryRouter.post(
  "/resume",
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const parsed = ResumeMemorySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendApiError<ResumeResponseData>(
        res,
        400,
        {
          code: "BAD_REQUEST",
          message: "Invalid request body",
          details: parsed.error.flatten(),
        },
        buildApiMeta(req, startedAt),
      );
      return;
    }

    const result = await runResumeFlowLangGraph({
      userId: req.authUserId,
      project: parsed.data.project,
      question: parsed.data.question,
      topK: parsed.data.topK,
      includeArchived: parsed.data.includeArchived,
      ...(parsed.data.workspace ? { workspace: parsed.data.workspace } : {}),
      ...(parsed.data.threadId ? { threadId: parsed.data.threadId } : {}),
    });

    sendApiSuccess<ResumeResponseData>(
      res,
      200,
      result,
      buildApiMeta(req, startedAt, {
        intent: "resume_project",
      }),
    );
  }),
);

memoryRouter.patch("/config/retrieval-weights", (req, res) => {
  if (process.env.NODE_ENV === "production") {
    res.status(403).json({ error: "Retrieval weight config is disabled in production" });
    return;
  }

  const parsed = RetrievalWeightsSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid request body",
      details: parsed.error.flatten(),
    });
    return;
  }

  const result = setRetrievalWeights(parsed.data);
  if (!result.ok) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.status(200).json({
    weights: getRetrievalWeights(),
  });
});

memoryRouter.patch(
  "/:memoryId/archive",
  asyncHandler(async (req, res) => {
    const memoryId =
      typeof req.params.memoryId === "string" && req.params.memoryId.length > 0
        ? req.params.memoryId
        : undefined;

    if (!memoryId) {
      res.status(400).json({ error: "memoryId is required" });
      return;
    }

    const result = await archiveMemory({
      memoryId,
      userId: req.authUserId,
    });

    if (result.status === "not_found") {
      res.status(404).json({ error: "Memory not found" });
      return;
    }

    if (result.status === "already_archived") {
      res.status(400).json({ error: "Memory is already archived" });
      return;
    }

    res.status(200).json({
      memory: result.memory,
      revisionEvent: result.revisionEvent ?? null,
      timelineEvent: result.timelineEvent,
    });
  }),
);

memoryRouter.patch(
  "/:memoryId/unarchive",
  asyncHandler(async (req, res) => {
    const memoryId =
      typeof req.params.memoryId === "string" && req.params.memoryId.length > 0
        ? req.params.memoryId
        : undefined;

    if (!memoryId) {
      res.status(400).json({ error: "memoryId is required" });
      return;
    }

    const result = await unarchiveMemory({
      memoryId,
      userId: req.authUserId,
    });

    if (result.status === "not_found") {
      res.status(404).json({ error: "Memory not found" });
      return;
    }

    if (result.status === "already_active") {
      res.status(400).json({ error: "Memory is already active" });
      return;
    }

    res.status(200).json({
      memory: result.memory,
      revisionEvent: result.revisionEvent ?? null,
      timelineEvent: result.timelineEvent,
    });
  }),
);

memoryRouter.patch("/:memoryId/status", asyncHandler(async (req, res) => {
    const memoryId =
      typeof req.params.memoryId === "string" && req.params.memoryId.length > 0
        ? req.params.memoryId
        : undefined;

    if (!memoryId) {
      res.status(400).json({ error: "memoryId is required" });
      return;
    }

    const parsed = MemoryStatusPatchSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request body",
        details: parsed.error.flatten(),
      });
      return;
    }

    const result = await updateMemoryStatus({
      memoryId,
      userId: req.authUserId,
      status: parsed.data.status,
    });

    if (result.status === "not_found") {
      res.status(404).json({ error: "Memory not found" });
      return;
    }

    if (result.status === "already_in_status") {
      res.status(400).json({
        error: `Memory is already ${parsed.data.status}`,
      });
      return;
    }

    res.status(200).json({
      memory: result.memory,
      revisionEvent: result.revisionEvent ?? null,
      timelineEvent: result.timelineEvent ?? null,
    });
  }),
);

memoryRouter.get("/revisions", asyncHandler(async (req, res) => {
  const memoryId =
    typeof req.query.memoryId === "string" && req.query.memoryId.length > 0
      ? req.query.memoryId
      : undefined;

  const revisions = (await listRevisionEvents(
    memoryId ? { memoryId } : { userId: req.authUserId },
  )).filter((event) => event.userId === req.authUserId);

  res.status(200).json({
    revisions,
    count: revisions.length,
  });
}));

memoryRouter.get("/timeline", asyncHandler(async (req, res) => {
  const events = await listTimelineEvents(req.authUserId);

  res.status(200).json({
    events,
    count: events.length,
  });
}));

memoryRouter.get("/system/health", asyncHandler(async (_req, res) => {
  ensureMemoryStoreIntegrity();

  const storesIntegrity = await hasValidStores();
  const retrievalConfigLoaded = hasValidBestConfig();
  const baselineReportPresent = hasValidBaselineReport();

  const status =
    storesIntegrity && retrievalConfigLoaded && baselineReportPresent
      ? "ok"
      : "degraded";

  res.status(200).json({
    status,
    checkedAt: new Date().toISOString(),
    checks: {
      storesIntegrity,
      retrievalConfigLoaded,
      baselineReportPresent,
    },
  });
}));

memoryRouter.get("/mvp/status", asyncHandler(async (_req, res) => {
  ensureMemoryStoreIntegrity();

  const storesIntegrity = await hasValidStores();
  const retrievalConfigLoaded = hasValidBestConfig();
  const baselineReport = readBaselineReport();
  const baselineReportPresent = baselineReport !== null;
  const evalPassRate = baselineReport?.passRate ?? null;
  const totalEvalCases = baselineReport?.totalCases ?? null;
  const evalPassRateAtLeast90 =
    typeof evalPassRate === "number" && evalPassRate >= 90;

  const completed: string[] = [];
  const pending: string[] = [];

  if (storesIntegrity) {
    completed.push("Runtime memory stores are valid JSON.");
  } else {
    pending.push("Fix runtime memory store integrity.");
  }

  if (retrievalConfigLoaded) {
    completed.push("Best retrieval config is present and valid.");
  } else {
    pending.push("Generate and save a valid best retrieval config.");
  }

  if (baselineReportPresent) {
    completed.push("Retrieval baseline report is present.");
  } else {
    pending.push("Create retrieval baseline report.");
  }

  if (evalPassRateAtLeast90) {
    completed.push("Retrieval eval pass rate is at least 90%.");
  } else {
    pending.push("Improve retrieval quality to at least 90% pass rate.");
  }

  const status = pending.length === 0 ? "on_track" : "at_risk";

  res.status(200).json({
    status,
    checkedAt: new Date().toISOString(),
    checks: {
      storesIntegrity,
      retrievalConfigLoaded,
      baselineReportPresent,
      evalPassRateAtLeast90,
    },
    metrics: {
      evalPassRate,
      totalEvalCases,
    },
    completed,
    pending,
  });
}));

memoryRouter.get(
  "/benchmark/report",
  asyncHandler(async (_req, res) => {
    if (!existsSync(BENCHMARK_REPORT_PATH)) {
      res.status(404).json({
        error: "Benchmark report not found",
        path: BENCHMARK_REPORT_PATH,
      });
      return;
    }

    try {
      const raw = readFileSync(BENCHMARK_REPORT_PATH, "utf8");
      const parsed = JSON.parse(raw);

      if (!isObjectRecord(parsed)) {
        res.status(500).json({
          error: "Benchmark report is invalid",
        });
        return;
      }

      res.status(200).json(parsed);
    } catch {
      res.status(500).json({
        error: "Failed to read benchmark report",
      });
    }
  }),
);

memoryRouter.get(
  "/explain",
  asyncHandler(async (req, res) => {
    const memoryId =
      typeof req.query.memoryId === "string" && req.query.memoryId.length > 0
        ? req.query.memoryId
        : undefined;

    if (!memoryId) {
      res.status(400).json({ error: "memoryId is required" });
      return;
    }

    const result = await explainMemory({
      memoryId,
      userId: req.authUserId,
    });

    if (!result) {
      res.status(404).json({ error: "Memory not found" });
      return;
    }

    const ownerFromMetadata =
      typeof result.memory.rawMetadata.userId === "string"
        ? result.memory.rawMetadata.userId
        : undefined;
    const ownerFromRevision = result.latestRevision?.userId;
    const ownerFromTimeline = result.timeline[0]?.userId;
    const owner = ownerFromMetadata ?? ownerFromRevision ?? ownerFromTimeline;

    if (owner && owner !== req.authUserId) {
      res.status(404).json({ error: "Memory not found" });
      return;
    }

    res.status(200).json(result);
  }),
);
memoryRouter.get(
  "/insights",
  asyncHandler(async (req, res) => {
    const userId = req.authUserId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const memoriesResult = await listMemories({ userId, limit: 200 });
    const memories = memoriesResult.memories;
    const events = await listTimelineEvents(userId);

    const totalsByType = {
      profile: 0,
      preference: 0,
      learning: 0,
      project: 0,
      episodic: 0,
    };

    const totalsByStatus = {
      active: 0,
      stale: 0,
      contradicted: 0,
      archived: 0,
      merged: 0,
    };

    const wordCount = new Map<string, number>();

    for (const memory of memories) {
      totalsByType[memory.type] += 1;
      totalsByStatus[memory.status] += 1;

      if (
        memory.type === "learning" ||
        memory.type === "profile" ||
        memory.type === "preference"
      ) {
        const text = `${memory.content} ${memory.summary}`.toLowerCase();
        const words = text.split(/[^a-z0-9+#.]+/).filter(Boolean);

        for (const word of words) {
          if (word.length < 3) {
            continue;
          }

          if (
            ["user", "using", "with", "and", "for", "the", "is", "are"].includes(
              word,
            )
          ) {
            continue;
          }

          wordCount.set(word, (wordCount.get(word) ?? 0) + 1);
        }
      }
    }

    const activeProjects = Array.from(
      new Set(
        memories
          .filter((memory) => memory.type === "project" && memory.status === "active")
          .map((memory) => memory.summary),
      ),
    );

    const topSkills = Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);

    const recentMilestones = [...events]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5)
      .map((event) => `${event.eventType}: ${event.reason}`);

    res.status(200).json({
      totalsByType,
      totalsByStatus,
      topSkills,
      activeProjects,
      recentMilestones,
    });
    return;
  }),
);
memoryRouter.get("/list", asyncHandler(async (req, res) => {
    const status =
      typeof req.query.status === "string" && req.query.status.length > 0
        ? req.query.status
        : undefined;
    const type =
      typeof req.query.type === "string" && req.query.type.length > 0
        ? req.query.type
        : undefined;
    const limitRaw =
      typeof req.query.limit === "string" && req.query.limit.length > 0
        ? req.query.limit
        : undefined;

    if (status && !MEMORY_STATUS.includes(status as MemoryStatus)) {
      res.status(400).json({
        error: "Invalid query",
        details: { status: `status must be one of: ${MEMORY_STATUS.join(", ")}` },
      });
      return;
    }

    if (type && !MEMORY_TYPES.includes(type as MemoryType)) {
      res.status(400).json({
        error: "Invalid query",
        details: { type: `type must be one of: ${MEMORY_TYPES.join(", ")}` },
      });
      return;
    }

    let limit: number | undefined;
    if (limitRaw !== undefined) {
      const parsedLimit = Number.parseInt(limitRaw, 10);
      if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
        res.status(400).json({
          error: "Invalid query",
          details: { limit: "limit must be a positive integer" },
        });
        return;
      }
      limit = parsedLimit;
    }

    const result = await listMemories({
      userId: req.authUserId,
      ...(status ? { status: status as MemoryStatus } : {}),
      ...(type ? { type: type as MemoryType } : {}),
      ...(limit !== undefined ? { limit } : {}),
    });

    res.status(200).json({
      memories: result.memories,
      count: result.count,
    });
  }),
);

memoryRouter.get(
  "/requests",
  asyncHandler(async (req, res) => {
    const limitRaw =
      typeof req.query.limit === "string" && req.query.limit.length > 0
        ? req.query.limit
        : undefined;
    const typeFilter =
      typeof req.query.type === "string" && req.query.type.length > 0
        ? req.query.type.trim()
        : undefined;
    const statusFilter =
      typeof req.query.status === "string" && req.query.status.length > 0
        ? req.query.status.trim()
        : undefined;
    const rangeFilter = parseRequestRange(req.query.range);

    let limit = 100;
    if (limitRaw !== undefined) {
      const parsedLimit = Number.parseInt(limitRaw, 10);
      if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
        res.status(400).json({
          error: "Invalid query",
          details: { limit: "limit must be a positive integer" },
        });
        return;
      }
      limit = Math.min(parsedLimit, 400);
    }

    if (
      statusFilter !== undefined &&
      !(REQUEST_STATUSES as readonly string[]).includes(statusFilter)
    ) {
      res.status(400).json({
        error: "Invalid query",
        details: { status: "status must be Success or Error" },
      });
      return;
    }

    const requestHistory = listRequestHistory({
      userId: req.authUserId,
      limit: 400,
      memoryOnly: true,
    });

    const rangeDays = REQUEST_RANGE_DAYS[rangeFilter];
    const rangeThresholdMs =
      rangeDays === null ? null : Date.now() - rangeDays * 24 * 60 * 60 * 1000;

    const filtered = requestHistory
      .filter((entry) => {
        if (typeFilter && entry.routeType !== typeFilter) {
          return false;
        }
        if (statusFilter && entry.status !== statusFilter) {
          return false;
        }
        if (rangeThresholdMs !== null) {
          const createdAtMs = new Date(entry.createdAt).getTime();
          if (!Number.isFinite(createdAtMs) || createdAtMs < rangeThresholdMs) {
            return false;
          }
        }
        return true;
      })
      .slice(0, limit);

    res.status(200).json({
      requests: filtered,
      count: filtered.length,
      filters: {
        type: typeFilter ?? "all",
        status: statusFilter ?? "All",
        range: rangeFilter,
        limit,
      },
    });
  }),
);

memoryRouter.get(
  "/:memoryId",
  asyncHandler(async (req, res) => {
    const memoryId =
      typeof req.params.memoryId === "string" && req.params.memoryId.length > 0
        ? req.params.memoryId
        : undefined;

    if (!memoryId) {
      res.status(400).json({ error: "memoryId is required" });
      return;
    }

    const memory = await getMemoryForUser({
      memoryId,
      userId: req.authUserId,
    });

    if (!memory) {
      res.status(404).json({ error: "Memory not found" });
      return;
    }

    res.status(200).json({ memory });
  }),
);
memoryRouter.post( "/retrieve/debug", asyncHandler(async (req, res) => {
    const parsed = RetrieveMemorySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request body",
        details: parsed.error.flatten(),
      });
      return;
    }

    const requestedTopK = parsed.data.topK ?? 5;
    const debugTopK = 100;

    const result = await runRetrieveFlowLangGraph({
      userId: req.authUserId,
      question: parsed.data.question,
      topK: debugTopK,
      ...(parsed.data.includeArchived !== undefined
        ? { includeArchived: parsed.data.includeArchived }
        : {}),
      ...(parsed.data.workspace ? { workspace: parsed.data.workspace } : {}),
      ...(parsed.data.project ? { project: parsed.data.project } : {}),
      ...(parsed.data.threadId ? { threadId: parsed.data.threadId } : {}),
    });

    res.status(200).json({
      memories: result.memories,
      debug: result.debug,
      meta: {
        requestedTopK,
        debugTopK,
        returnedCount: result.memories.length,
      },
    });
  }),
);

memoryRouter.post("/retrieve/why-not", asyncHandler(async (req, res) => {
    const parsed = RetrieveMemorySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request body",
        details: parsed.error.flatten(),
      });
      return;
    }

    const requestedTopK = parsed.data.topK ?? 5;
    const analysis = await analyzeRetrieval({
      userId: req.authUserId,
      question: parsed.data.question,
      topK: requestedTopK,
      ...(parsed.data.includeArchived !== undefined
        ? { includeArchived: parsed.data.includeArchived }
        : {}),
      ...(parsed.data.workspace ? { workspace: parsed.data.workspace } : {}),
      ...(parsed.data.project ? { project: parsed.data.project } : {}),
      ...(parsed.data.threadId ? { threadId: parsed.data.threadId } : {}),
    });

    res.status(200).json({
      intent: analysis.intent,
      weightsUsed: analysis.weightsUsed,
      selected: analysis.allCandidates.filter((candidate) => !candidate.filteredOut),
      rejected: analysis.rejected,
      meta: {
        requestedTopK,
        totalCandidates: analysis.allCandidates.length,
        selectedCount: analysis.selected.length,
        rejectedCount: analysis.rejected.length,
      },
    });
  }),
);

memoryRouter.all("/*splat", (_req, res) => {
  res.status(404).json({ error: "Route not found" });
});
