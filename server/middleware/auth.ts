import type { NextFunction, Request, Response } from "express";
import { orgRequestContext, readOrgIdFromRequest } from "../../lib/auth/orgScope";
import { verifyAuthorizationHeader } from "../../lib/auth/verifyToken";

function scopedApiKeyAllowsRequest(req: Request): boolean {
  if (req.authApiKeyMode !== "scoped") return true;
  const endpoints = new Set(req.authApiKeyEndpoints ?? []);
  const path = req.path;
  const baseUrl = req.baseUrl;

  if (endpoints.has("mcp_invoke") && (baseUrl === "/api/mcp" || baseUrl === "/api/v1/mcp")) {
    return true;
  }
  if (endpoints.has("epoch_runtime") && (baseUrl === "/api/epoch" || baseUrl === "/api/v1/epoch")) {
    return true;
  }
  if (
    endpoints.has("connector_codex") &&
    baseUrl === "/api/connector" &&
    /^\/codex_chats\/(?:connect|sync|upload|disconnect)$/.test(path)
  ) {
    return true;
  }
  if (baseUrl === "/api/memory" || baseUrl === "/api/v1/memory") {
    if (endpoints.has("memoryignition_brief") && path.startsWith("/memoryignition/brief")) return true;
    if (endpoints.has("memoryignition_brief") && path.startsWith("/memoryignition/before-agent")) return true;
    if ((endpoints.has("send_now") || endpoints.has("memoryignition_brief")) && path.startsWith("/memoryignition/send-now")) return true;
    if (endpoints.has("before_action") && path.startsWith("/memoryignition/before-action")) return true;
    if (endpoints.has("before_action") && path.startsWith("/memoryignition/during-action")) return true;
    if (endpoints.has("risk_check") && path.startsWith("/memoryignition/risk-check")) return true;
    if (endpoints.has("outcome") && path.startsWith("/memoryignition/after-agent")) return true;
    if (endpoints.has("outcome") && path.startsWith("/memoryignition/outcome-learn")) return true;
    if (endpoints.has("outcome") && path.startsWith("/memoryignition/outcome")) return true;
    if (endpoints.has("handoff") && path.startsWith("/memoryignition/handoff")) return true;
    if (endpoints.has("trace_proof") && /^\/memory\/[^/]+\/trace-proof$/.test(path)) return true;
    if (endpoints.has("retrieve") && path.startsWith("/retrieve")) return true;
    if (endpoints.has("resume") && path.startsWith("/resume")) return true;
    if (endpoints.has("continue") && path.startsWith("/continue")) return true;
    if (endpoints.has("handoff") && path.startsWith("/handoff")) return true;
    if (endpoints.has("search") && path.startsWith("/search")) return true;
    if (endpoints.has("memory_add") && path.startsWith("/process")) return true;
    if (endpoints.has("memory_update") && path.startsWith("/status")) return true;
  }
  return false;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const verified = await verifyAuthorizationHeader(req.header("authorization"));
  if (!verified) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.authUserId = verified.userId;
  // Clerk proxy JWTs carry orgId as a signed claim. Never let a raw client
  // header override that signed tenant scope.
  const orgId = verified.orgId ?? readOrgIdFromRequest(req);
  if (orgId) {
    req.authOrgId = orgId;
  }
  if (verified.apiKeyId) {
    req.authApiKeyId = verified.apiKeyId;
    req.authApiKeyMode = verified.apiKeyMode;
    req.authApiKeyEndpoints = verified.apiKeyEndpoints;
    req.authApiKeyContentTag = verified.apiKeyContentTag;
    if (!scopedApiKeyAllowsRequest(req)) {
      res.status(403).json({ error: "API key scope does not allow this endpoint" });
      return;
    }
  }
  orgRequestContext.run({ orgId: req.authOrgId }, () => next());
}
