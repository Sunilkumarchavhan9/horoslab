import type { Request, Response } from "express";
import { runIngestFlowLangGraph } from "../../lib/workflows/ingestGraphLangGraph";
import { retrieveRelevantMemory } from "../../lib/memory/retrieveRelevantMemory";
import { listRevisionEvents } from "../../lib/memory/revisionMemory";
import { listTimelineEvents } from "../../lib/memory/timelineMemory";
import { explainMemory } from "../../lib/memory/explainMemory";
import { archiveMemory, unarchiveMemory } from "../../lib/memory/archiveMemory";
import { getRetrievalWeights, setRetrievalWeights } from "../../lib/config/retrievalWeights";
import {
  ProcessMemorySchema,
  RetrievalWeightsSchema,
  RetrieveMemorySchema,
} from "../schemas/memory.schema";

export async function processMemory(req: Request, res: Response): Promise<void> {
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
}

export async function retrieveMemory(req: Request, res: Response): Promise<void> {
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
}

export function getRevisions(req: Request, res: Response): void {
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
}

export function getTimeline(req: Request, res: Response): void {
  const events = listTimelineEvents(req.authUserId);

  res.status(200).json({
    events,
    count: events.length,
  });
}

export async function getExplain(req: Request, res: Response): Promise<void> {
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
}

export async function archiveMemoryById(req: Request, res: Response): Promise<void> {
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
}

export async function unarchiveMemoryById(req: Request, res: Response): Promise<void> {
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
}

export function patchRetrievalWeights(req: Request, res: Response): void {
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
}
