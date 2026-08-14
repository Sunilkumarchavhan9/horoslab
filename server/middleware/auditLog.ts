import { createHash } from "crypto";
import type { NextFunction, Request, Response } from "express";
import { recordAuditLog, type AuditLogRiskLevel, type AuditLogStatus } from "../../lib/security/auditLog";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function getClientIp(req: Request): string | undefined {
  const forwarded = req.header("x-forwarded-for");
  const firstForwarded = forwarded?.split(",")[0]?.trim();
  return firstForwarded || req.ip || undefined;
}

function hashIp(ip: string | undefined): string | undefined {
  if (!ip) return undefined;
  const pepper = process.env.AUDIT_LOG_IP_HASH_PEPPER ?? process.env.MEMORYOS_JWT_SECRET ?? "";
  return createHash("sha256").update(`${pepper}:${ip}`).digest("hex");
}

function inferResourceType(req: Request): string {
  const path = `${req.baseUrl}${req.path}`.replace(/^\/api\/v1\//, "/api/").replace(/^\/api\//, "");
  const [first, second] = path.split("/").filter(Boolean);
  if (!first) return "api";
  if (first === "memory" && second) return `memory.${second}`;
  return first;
}

function inferRiskLevel(req: Request, statusCode: number): AuditLogRiskLevel {
  if (statusCode === 401 || statusCode === 403) return "high";
  if (statusCode >= 500) return "medium";
  if (/(approve|reject|revoke|rotate|disconnect|delete|block|policy|send|token|key)/i.test(req.path)) {
    return "high";
  }
  return "low";
}

function inferStatus(statusCode: number): AuditLogStatus {
  if (statusCode === 401 || statusCode === 403 || statusCode === 429) return "blocked";
  if (statusCode >= 400) return "failed";
  return "success";
}

function shouldAudit(req: Request): boolean {
  if (SAFE_METHODS.has(req.method)) return false;
  const route = `${req.baseUrl}${req.path}`;
  if (/\/api\/events(\/stream)?$/i.test(route)) return false;
  if (/\/api\/health$/i.test(route)) return false;
  return Boolean(req.authUserId);
}

export function auditMutationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const startedAt = Date.now();
  res.on("finish", () => {
    if (!shouldAudit(req)) return;

    const status = inferStatus(res.statusCode);
    const actorType = req.authApiKeyId ? "api_key" : "user";
    const action = `${req.method} ${req.baseUrl}${req.path}`;
    void recordAuditLog({
      userId: req.authUserId,
      orgId: req.authOrgId,
      actorType,
      actorId: req.authApiKeyId ?? req.authUserId,
      action,
      resourceType: inferResourceType(req),
      resourceId: typeof req.params?.id === "string" ? req.params.id : undefined,
      status,
      riskLevel: inferRiskLevel(req, res.statusCode),
      ipHash: hashIp(getClientIp(req)),
      userAgent: req.header("user-agent"),
      requestId: req.requestId,
      metadata: {
        method: req.method,
        route: `${req.baseUrl}${req.path}`,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
        apiKeyMode: req.authApiKeyMode,
      },
    }).catch((error) => {
      console.warn("[AuditLog] failed to record mutation:", error instanceof Error ? error.message : error);
    });
  });

  next();
}
