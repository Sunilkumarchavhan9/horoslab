import { Router, Request, Response } from "express";
import { MemoryStatus } from "@prisma/client";
import {
  getSessions,
  getSessionById,
  createAgentSession,
  recordEvent,
  endSession,
  getTimeline,
  runVerification,
  getProposedMemories,
  updateMemoryStatus,
  generateHandoff,
  proposeMemoriesFromSession,
  explainMemory,
} from "../services/agent-session.service";
import { asyncHandler } from "../middleware/asyncHandler";
import { sendApiSuccess, buildApiMeta } from "./api-response";

export const agentSessionRouter = Router();

async function ensureSessionAccess(sessionId: string, authUserId: string): Promise<boolean> {
  const session = await getSessionById(sessionId);
  return Boolean(session && session.projectId === authUserId);
}

agentSessionRouter.get("/", asyncHandler(async (req: Request, res: Response) => {
  const startedAt = Date.now();
  try {
    const sessions = await getSessions(req.authUserId);
    sendApiSuccess(res, 200, sessions, buildApiMeta(req, startedAt));
  } catch (error) {
    console.error("[AgentSessions] Failed to list sessions; returning empty list.", error);
    sendApiSuccess(res, 200, [], buildApiMeta(req, startedAt));
  }
}));

agentSessionRouter.post("/start", asyncHandler(async (req: Request, res: Response) => {
  const startedAt = Date.now();
  const data = req.body;
  if (typeof data.projectId === "string" && data.projectId !== req.authUserId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const session = await createAgentSession({
    ...data,
    projectId: req.authUserId,
  });
  sendApiSuccess(res, 201, session, buildApiMeta(req, startedAt));
}));

agentSessionRouter.post("/:id/event", asyncHandler(async (req: Request, res: Response) => {
  const startedAt = Date.now();
  const sessionId = req.params.id as string;
  if (!(await ensureSessionAccess(sessionId, req.authUserId))) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const { type, summary, payload } = req.body;
  const event = await recordEvent(sessionId, type, summary, payload);
  sendApiSuccess(res, 201, event, buildApiMeta(req, startedAt));
}));

agentSessionRouter.post("/:id/end", asyncHandler(async (req: Request, res: Response) => {
  const startedAt = Date.now();
  const sessionId = req.params.id as string;
  if (!(await ensureSessionAccess(sessionId, req.authUserId))) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const { summary } = req.body;
  const session = await endSession(sessionId, summary);
  sendApiSuccess(res, 200, session, buildApiMeta(req, startedAt));
}));

agentSessionRouter.get("/:id/timeline", asyncHandler(async (req: Request, res: Response) => {
  const startedAt = Date.now();
  const sessionId = req.params.id as string;
  if (!(await ensureSessionAccess(sessionId, req.authUserId))) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const timeline = await getTimeline(sessionId);
  sendApiSuccess(res, 200, timeline, buildApiMeta(req, startedAt));
}));

agentSessionRouter.post("/:id/verify", asyncHandler(async (req: Request, res: Response) => {
  const startedAt = Date.now();
  const sessionId = req.params.id as string;
  if (!(await ensureSessionAccess(sessionId, req.authUserId))) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const result = await runVerification(sessionId);
  sendApiSuccess(res, 200, result, buildApiMeta(req, startedAt));
}));

agentSessionRouter.get("/:id/proposed-memories", asyncHandler(async (req: Request, res: Response) => {
  const startedAt = Date.now();
  const sessionId = req.params.id as string;
  if (!(await ensureSessionAccess(sessionId, req.authUserId))) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const memories = await getProposedMemories(sessionId);
  sendApiSuccess(res, 200, memories, buildApiMeta(req, startedAt));
}));

agentSessionRouter.post("/:id/propose-memories", asyncHandler(async (req: Request, res: Response) => {
  const startedAt = Date.now();
  const sessionId = req.params.id as string;
  if (!(await ensureSessionAccess(sessionId, req.authUserId))) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const memories = await proposeMemoriesFromSession(sessionId);
  sendApiSuccess(res, 200, memories, buildApiMeta(req, startedAt));
}));

agentSessionRouter.post("/:id/proposed-memories/:memoryId/approve", asyncHandler(async (req: Request, res: Response) => {
  const startedAt = Date.now();
  const sessionId = req.params.id as string;
  if (!(await ensureSessionAccess(sessionId, req.authUserId))) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const memoryId = req.params.memoryId as string;
  const memory = await updateMemoryStatus(memoryId, MemoryStatus.APPROVED, sessionId);
  sendApiSuccess(res, 200, memory, buildApiMeta(req, startedAt));
}));

agentSessionRouter.post("/:id/proposed-memories/:memoryId/reject", asyncHandler(async (req: Request, res: Response) => {
  const startedAt = Date.now();
  const sessionId = req.params.id as string;
  if (!(await ensureSessionAccess(sessionId, req.authUserId))) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const memoryId = req.params.memoryId as string;
  const memory = await updateMemoryStatus(memoryId, MemoryStatus.REJECTED, sessionId);
  sendApiSuccess(res, 200, memory, buildApiMeta(req, startedAt));
}));

agentSessionRouter.post("/:id/proposed-memories/:memoryId/merge", asyncHandler(async (req: Request, res: Response) => {
  const startedAt = Date.now();
  const sessionId = req.params.id as string;
  if (!(await ensureSessionAccess(sessionId, req.authUserId))) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const memoryId = req.params.memoryId as string;
  const memory = await updateMemoryStatus(memoryId, MemoryStatus.MERGED, sessionId);
  sendApiSuccess(res, 200, memory, buildApiMeta(req, startedAt));
}));

agentSessionRouter.post("/:id/proposed-memories/:memoryId/promote", asyncHandler(async (req: Request, res: Response) => {
  const startedAt = Date.now();
  const sessionId = req.params.id as string;
  if (!(await ensureSessionAccess(sessionId, req.authUserId))) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const memoryId = req.params.memoryId as string;
  const memory = await updateMemoryStatus(memoryId, MemoryStatus.PROMOTED, sessionId);
  sendApiSuccess(res, 200, memory, buildApiMeta(req, startedAt));
}));

agentSessionRouter.get("/proposed-memories/:memoryId/explain", asyncHandler(async (req: Request, res: Response) => {
  const startedAt = Date.now();
  const memoryId = req.params.memoryId as string;
  const explanation = await explainMemory(memoryId);
  sendApiSuccess(res, 200, { explanation }, buildApiMeta(req, startedAt));
}));

agentSessionRouter.post("/:id/handoff", asyncHandler(async (req: Request, res: Response) => {
  const startedAt = Date.now();
  const sessionId = req.params.id as string;
  if (!(await ensureSessionAccess(sessionId, req.authUserId))) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  const handoff = await generateHandoff(sessionId);
  sendApiSuccess(res, 200, { handoff }, buildApiMeta(req, startedAt));
}));
