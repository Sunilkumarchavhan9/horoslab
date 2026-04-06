import { Router } from "express";
import { runIngestFlowLangGraph } from "../../lib/workflows/ingestGraphLangGraph";
import { retrieveRelevantMemory } from "../../lib/memory/retrieveRelevantMemory";
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
import { planContinuity } from "../../lib/memory/continuityPlanner";
import { planResume } from "../../lib/memory/resumePlanner";
import { MEMORY_STATUS, MEMORY_TYPES, type MemoryStatus, type MemoryType } from "../../lib/memory/types";
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

    const result = await retrieveRelevantMemory({
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

    const result = await planContinuity({
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

    const result = await planResume({
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

memoryRouter.patch(
  "/:memoryId/status",
  asyncHandler(async (req, res) => {
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
memoryRouter.get( "/list",
  asyncHandler(async (req, res) => {
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

memoryRouter.all("/*splat", (_req, res) => {
  res.status(404).json({ error: "Route not found" });
});
