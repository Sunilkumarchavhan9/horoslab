import { Router } from "express";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { runIngestFlowLangGraph } from "../../lib/workflows/ingestGraphLangGraph";
import { runRetrieveFlowLangGraph } from "../../lib/workflows/retrieveGraphLangGraph";
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
import { runResumeFlowLangGraph } from "../../lib/workflows/resumeGraphLangGraph";
import { MEMORY_STATUS, MEMORY_TYPES, type MemoryStatus, type MemoryType } from "../../lib/memory/types";
import { ensureMemoryStoreIntegrity } from "../../lib/memory/startupIntegrity";
import { isSqliteRuntimeStore } from "../../lib/storage/runtimeStoreBackend";
import { isRuntimeStoreDbHealthy } from "../../lib/storage/runtimeStoreDb";
import {
  ContinueMemorySchema,
  ProcessMemorySchema,
  ResumeMemorySchema,
  MemoryStatusPatchSchema,
  RetrievalWeightsSchema,
  RetrieveMemorySchema,
} from "../schemas/memory.schema";
import { asyncHandler } from "../middleware/asyncHandler";

export const memoryRouter = Router();

const DATA_DIR = path.join(process.cwd(), "data");
const RECENT_MEMORY_STORE_PATH = path.join(DATA_DIR, "recent-memories.json");
const TIMELINE_STORE_PATH = path.join(DATA_DIR, "timeline-events.json");
const REVISION_STORE_PATH = path.join(DATA_DIR, "revision-events.json");
const BEST_CONFIG_PATH = path.join(DATA_DIR, "eval", "best-config.json");
const BASELINE_REPORT_PATH = path.join(DATA_DIR, "eval", "baseline-report.json");

type BaselineReport = {
  passRate: number;
  totalCases: number;
  updatedAt?: string;
};

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

function hasValidStores(): boolean {
  if (isSqliteRuntimeStore()) {
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
  "/retrieve",
  asyncHandler(async (req, res) => {
    const parsed = RetrieveMemorySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request body",
        details: parsed.error.flatten(),
      });
      return;
    }

    const result = await runRetrieveFlowLangGraph({
      userId: req.authUserId,
      question: parsed.data.question,
      topK: parsed.data.topK,
      ...(parsed.data.includeArchived !== undefined
        ? { includeArchived: parsed.data.includeArchived }
        : {}),
    });

    res.status(200).json(result);
  }),
);

memoryRouter.get(
  "/retrieve/explain",
  asyncHandler(async (req, res) => {
    const question =
      typeof req.query.question === "string" && req.query.question.trim().length > 0
        ? req.query.question
        : undefined;

    if (!question) {
      res.status(400).json({
        error: "question is required",
      });
      return;
    }

    const topK = parseQueryTopK(req.query.topK);
    if (req.query.topK !== undefined && topK === undefined) {
      res.status(400).json({
        error: "topK must be a positive integer <= 20",
      });
      return;
    }

    const includeArchived = parseQueryIncludeArchived(req.query.includeArchived);
    if (req.query.includeArchived !== undefined && includeArchived === undefined) {
      res.status(400).json({
        error: "includeArchived must be true or false",
      });
      return;
    }

    const result = await runRetrieveFlowLangGraph({
      userId: req.authUserId,
      question,
      ...(topK !== undefined ? { topK } : {}),
      ...(includeArchived !== undefined ? { includeArchived } : {}),
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
      };
    });

    const firstDebug = result.debug[0];

    res.status(200).json({
      intent: firstDebug?.intent ?? "general",
      weightsUsed: firstDebug?.weightsUsed ?? getRetrievalWeights(),
      ranked,
      whyTop1: buildWhyTop1(ranked[0]),
    });
  }),
);

memoryRouter.post(
  "/continue",
  asyncHandler(async (req, res) => {
    const parsed = ContinueMemorySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request body",
        details: parsed.error.flatten(),
      });
      return;
    }

    const result = await runContinueFlowLangGraph({
      userId: req.authUserId,
      question: parsed.data.question,
      mode: parsed.data.mode,
      topK: parsed.data.topK,
      includeArchived: parsed.data.includeArchived,
    });

    res.status(200).json(result);
  }),
);

memoryRouter.post(
  "/resume",
  asyncHandler(async (req, res) => {
    const parsed = ResumeMemorySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request body",
        details: parsed.error.flatten(),
      });
      return;
    }

    const result = await runResumeFlowLangGraph({
      userId: req.authUserId,
      project: parsed.data.project,
      question: parsed.data.question,
      topK: parsed.data.topK,
      includeArchived: parsed.data.includeArchived,
    });

    res.status(200).json(result);
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

memoryRouter.get("/revisions", (req, res) => {
  const memoryId =
    typeof req.query.memoryId === "string" && req.query.memoryId.length > 0
      ? req.query.memoryId
      : undefined;

  const revisions = listRevisionEvents(
    memoryId ? { memoryId } : { userId: req.authUserId },
  ).filter((event) => event.userId === req.authUserId);

  res.status(200).json({
    revisions,
    count: revisions.length,
  });
});

memoryRouter.get("/timeline", (req, res) => {
  const events = listTimelineEvents(req.authUserId);

  res.status(200).json({
    events,
    count: events.length,
  });
});

memoryRouter.get("/system/health", (_req, res) => {
  ensureMemoryStoreIntegrity();

  const storesIntegrity = hasValidStores();
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
});

memoryRouter.get("/mvp/status", (_req, res) => {
  ensureMemoryStoreIntegrity();

  const storesIntegrity = hasValidStores();
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
});

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
    const events = listTimelineEvents(userId);

    const totalsByType = {
      profile: 0,
      preference: 0,
      learning: 0,
      project: 0,
      episodic: 0,
    };

    const totalsByStatus = {
      active: 0,
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

memoryRouter.all("/*splat", (_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

