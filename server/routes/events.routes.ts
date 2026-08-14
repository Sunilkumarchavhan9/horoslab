import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { registerMemoryRealtimeSink } from "../../lib/memory/realtimeEventBus";

export const eventsRouter = Router();

eventsRouter.get("/stream", asyncHandler(async (req, res) => {
  const userId = req.authUserId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
  res.write(`event: ready\ndata: ${JSON.stringify({ ok: true, stream: "overview", userId })}\n\n`);
  res.write(`event: overview-refresh\ndata: ${JSON.stringify({ eventType: "overview_ready", at: new Date().toISOString() })}\n\n`);

  const unregister = registerMemoryRealtimeSink(userId, res);
  const heartbeat = setInterval(() => {
    try {
      res.write(`event: ping\ndata: ${JSON.stringify({ eventType: "ping", at: new Date().toISOString() })}\n\n`);
      res.write(`event: overview-refresh\ndata: ${JSON.stringify({ eventType: "overview_refresh", at: new Date().toISOString() })}\n\n`);
    } catch {
      // The close handler removes stale streams.
    }
  }, 15000);

  req.on("close", () => {
    clearInterval(heartbeat);
    unregister();
  });
}));
