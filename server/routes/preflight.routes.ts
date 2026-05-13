import { Router, type Request } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { buildApiMeta, sendApiSuccess } from "./api-response";
import { executePreflight } from "../../lib/memory/preflightLogic";

export const preflightRouter = Router();

preflightRouter.post("/", asyncHandler(async (req: Request, res) => {
  const startedAt = Date.now();
  const { projectId, agentId, tool, task, mode, currentFiles } = req.body;
  const userId = req.authUserId;

  const data = await executePreflight({
    userId,
    projectId,
    agentId,
    tool,
    task,
    mode,
    currentFiles
  });

  sendApiSuccess(res, 200, data, buildApiMeta(req, startedAt));
}));

// Safe route for /api/agent-sessions/start if it doesn't exist
preflightRouter.post("/agent-sessions/start", asyncHandler(async (req: Request, res) => {
  // Mock session start for now
  sendApiSuccess(res, 200, { sessionId: `sess_${Date.now()}`, status: "started" }, buildApiMeta(req, Date.now()));
}));
