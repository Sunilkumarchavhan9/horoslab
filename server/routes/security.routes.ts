import { Router } from "express";
import { z } from "zod";
import { listAuditLogs } from "../../lib/security/auditLog";

export const securityRouter = Router();

const auditLogQuerySchema = z.object({
  action: z.string().trim().min(1).optional(),
  resourceType: z.string().trim().min(1).optional(),
  status: z.string().trim().min(1).optional(),
  workspaceId: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
});

securityRouter.get("/audit-log", async (req, res, next) => {
  try {
    const query = auditLogQuerySchema.parse(req.query);
    const logs = await listAuditLogs({
      userId: req.authUserId,
      orgId: req.authOrgId,
      workspaceId: query.workspaceId,
      action: query.action,
      resourceType: query.resourceType,
      status: query.status,
      limit: query.limit,
    });
    res.json({ logs });
  } catch (error) {
    next(error);
  }
});

securityRouter.get("/trust-status", async (req, res) => {
  res.json({
    auth: "clerk",
    edgeProtection: "cloudflare",
    rateLimiting: process.env.UPSTASH_REDIS_REST_URL?.trim()
      ? "cloudflare_upstash_redis"
      : process.env.REDIS_URL?.trim()
        ? "cloudflare_redis"
        : "cloudflare_in_memory_dev_fallback",
    database: "postgres",
    orm: "prisma",
    secrets: "infisical",
    errorMonitoring: "sentry",
    codeSecurity: ["dependabot", "semgrep"],
    internalTrust: ["audit_log", "agent_black_box", "compliance_evidence_room"],
    userId: req.authUserId,
    orgId: req.authOrgId ?? null,
  });
});
