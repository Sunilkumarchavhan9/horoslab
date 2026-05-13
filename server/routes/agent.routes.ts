import { Router } from "express";
import { prisma } from "../../lib/storage/prismaClient";
import { asyncHandler } from "../middleware/asyncHandler";
import { sendApiSuccess, sendApiError, buildApiMeta } from "./api-response";

export const agentRouter = Router();

agentRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    console.log(`[Agents] Listing agents for user: ${req.authUserId}`);
    const startedAt = Date.now();
    try {
      const agents = await prisma.agentProfile.findMany({
        where: { userId: req.authUserId },
        orderBy: { createdAt: "desc" },
      });
      let enrichedAgents = agents;
      try {
        const agentIds = agents.map((agent) => agent.id);
        const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const sessions = agentIds.length
          ? await prisma.agentSession.findMany({
              where: { agentId: { in: agentIds } },
              select: {
                id: true,
                agentId: true,
                startedAt: true,
                handoffId: true,
                verificationResult: {
                  select: {
                    status: true,
                  },
                },
              },
            })
          : [];

        const sessionsByAgent = new Map<string, typeof sessions>();
        for (const session of sessions) {
          const current = sessionsByAgent.get(session.agentId) ?? [];
          current.push(session);
          sessionsByAgent.set(session.agentId, current);
        }

        enrichedAgents = agents.map((agent) => {
          const rows = sessionsByAgent.get(agent.id) ?? [];
          const rows24h = rows.filter((row) => row.startedAt >= since24h);
          const threads24h = rows24h.length;
          const handoffs24h = rows24h.filter((row) => Boolean(row.handoffId)).length;

          const verified = rows.filter((row) => row.verificationResult?.status);
          const passed = verified.filter(
            (row) => row.verificationResult?.status === "PASSED",
          ).length;
          const resumeScore =
            verified.length > 0 ? Math.round((passed / verified.length) * 100) : 0;

          return {
            ...agent,
            threads24h,
            handoffs24h,
            resumeScore,
          };
        });
      } catch (aggregateError) {
        console.warn("[Agents] Metric aggregation failed; returning base agent rows.", aggregateError);
      }

      console.log(`[Agents] Found ${agents.length} agents`);
      sendApiSuccess(res, 200, { agents: enrichedAgents }, buildApiMeta(req, startedAt));
    } catch (error) {
      console.error(`[Agents] Error listing agents:`, error);
      // Keep Workflow OS alive even when agent storage/aggregation fails.
      sendApiSuccess(res, 200, { agents: [] }, buildApiMeta(req, startedAt));
    }
  })
);

agentRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const { templateId, name, runtime, category, setup, status } = req.body;

    if (!templateId || !name) {
      sendApiError(res, 400, { code: "BAD_REQUEST", message: "Missing required fields" }, buildApiMeta(req, Date.now()));
      return;
    }

    const agent = await prisma.agentProfile.create({
      data: {
        userId: req.authUserId!,
        templateId,
        name,
        runtime,
        category,
        status: status || "online",
        connectedAt: "Just now",
        lastHeartbeat: "Just now",
        threads24h: 0,
        resumeScore: 0,
        handoffs24h: 0,
      },
    });

    sendApiSuccess(res, 201, { agent }, buildApiMeta(req, Date.now()));
  })
);

agentRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;

    const agent = await prisma.agentProfile.findUnique({ where: { id } });
    if (!agent || agent.userId !== req.authUserId) {
      sendApiError(res, 404, { code: "NOT_FOUND", message: "Agent not found" }, buildApiMeta(req, Date.now()));
      return;
    }

    await prisma.agentProfile.delete({ where: { id } });

    sendApiSuccess(res, 200, { message: "Deleted" }, buildApiMeta(req, Date.now()));
  })
);
