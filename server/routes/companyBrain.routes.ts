import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  compileSkillsV2,
  enqueueJob,
  getStatus,
  listActions,
  listAudit,
  listSources,
  processQueueOnce,
  rebuildGraph,
  requestAction,
  reviewAction,
  runEvalHarness,
  startScheduler,
  stopScheduler,
  syncAllSources,
  upsertSource,
  enqueueSourceEvent,
  processQueuedSourceEvents,
  listAlerts,
  listWorkers,
  registerWorker,
  workerHeartbeat,
  recoverFailedQueueJobs,
  backfillDeadLetterSourceEvents,
  getSreRunbook,
  replayAudit,
  executeApprovedAction,
  getGovernancePolicy,
  setRoleAssignment,
  updateGovernancePolicy,
  getCompliancePolicy,
  updateCompliancePolicy,
  requestAuditReplayApproval,
  reviewAuditReplayApproval,
  listAuditReplayApprovals,
  getExecutionEvidence,
} from "../../lib/companyBrain/platform";

export const companyBrainRouter = Router();

companyBrainRouter.get("/status", asyncHandler(async (req, res) => {
  res.json(getStatus(req.authUserId));
}));

companyBrainRouter.get("/sources", asyncHandler(async (req, res) => {
  res.json({ sources: listSources(req.authUserId) });
}));

companyBrainRouter.get("/sources/templates", asyncHandler(async (_req, res) => {
  res.json({
    templates: {
      support: [
        { provider: "zendesk", config: { provider: "zendesk", subdomain: "your-subdomain", apiUrl: "", bearerToken: "", authHeader: "Authorization" } },
        { provider: "freshdesk", config: { provider: "freshdesk", domain: "your-domain", apiUrl: "", bearerToken: "", authHeader: "Authorization" } },
      ],
      crm: [
        { provider: "hubspot", config: { provider: "hubspot", apiUrl: "https://api.hubapi.com/crm/v3/objects/contacts", bearerToken: "", authHeader: "Authorization" } },
      ],
      db: [
        { provider: "postgres", config: { provider: "postgres", apiUrl: "https://internal.example.com/db/events", apiKey: "", authHeader: "Authorization" } },
        { provider: "mysql", config: { provider: "mysql", apiUrl: "https://internal.example.com/db/events", apiKey: "", authHeader: "Authorization" } },
      ],
    },
  });
}));

companyBrainRouter.post("/sources", asyncHandler(async (req, res) => {
  const type = typeof req.body?.type === "string" ? req.body.type : "";
  const enabled = typeof req.body?.enabled === "boolean" ? req.body.enabled : true;
  const config = req.body && typeof req.body.config === "object" ? req.body.config as Record<string, unknown> : {};
  if (!type) {
    res.status(400).json({ error: "type is required" });
    return;
  }
  const source = upsertSource(req.authUserId, {
    type: type as "github" | "notion" | "local_files" | "slack" | "gmail" | "support" | "crm" | "db",
    enabled,
    config,
  });
  res.json({ source });
}));

companyBrainRouter.post("/sync/run", asyncHandler(async (req, res) => {
  const result = await syncAllSources(req.authUserId);
  res.json(result);
}));

companyBrainRouter.post("/source-events/:type", asyncHandler(async (req, res) => {
  const rawType = req.params.type;
  const type = Array.isArray(rawType) ? rawType[0] : rawType;
  const payload = req.body && typeof req.body === "object" ? req.body as Record<string, unknown> : {};
  const acceptedTypes = new Set(["support", "crm", "db", "slack", "gmail"]);
  if (!acceptedTypes.has(type)) {
    res.status(400).json({ error: "unsupported source event type" });
    return;
  }
  const event = enqueueSourceEvent(
    req.authUserId,
    type as "support" | "crm" | "db" | "slack" | "gmail",
    payload,
  );
  res.json(event);
}));

companyBrainRouter.post("/source-events/process", asyncHandler(async (req, res) => {
  const rawType = typeof req.body?.type === "string" ? req.body.type : undefined;
  const processed = await processQueuedSourceEvents(
    req.authUserId,
    rawType as "support" | "crm" | "db" | "slack" | "gmail" | undefined,
  );
  res.json({ accepted: processed });
}));

companyBrainRouter.post("/queue/enqueue", asyncHandler(async (req, res) => {
  const type = typeof req.body?.type === "string" ? req.body.type : "";
  if (!type) {
    res.status(400).json({ error: "type is required" });
    return;
  }
  const job = enqueueJob(req.authUserId, type as "sync_all_sources" | "rebuild_graph" | "compile_skills");
  res.json({ job });
}));

companyBrainRouter.post("/queue/process", asyncHandler(async (req, res) => {
  const result = await processQueueOnce(req.authUserId);
  res.json(result);
}));

companyBrainRouter.post("/scheduler/start", asyncHandler(async (req, res) => {
  const intervalSeconds = typeof req.body?.intervalSeconds === "number" ? req.body.intervalSeconds : 300;
  const result = startScheduler(req.authUserId, intervalSeconds);
  res.json(result);
}));

companyBrainRouter.post("/scheduler/stop", asyncHandler(async (req, res) => {
  res.json(stopScheduler(req.authUserId));
}));

companyBrainRouter.post("/graph/rebuild", asyncHandler(async (req, res) => {
  const result = await rebuildGraph(req.authUserId);
  res.json(result);
}));

companyBrainRouter.post("/skills/compile", asyncHandler(async (req, res) => {
  const result = compileSkillsV2(req.authUserId);
  res.json(result);
}));

companyBrainRouter.get("/actions", asyncHandler(async (req, res) => {
  res.json({ actions: listActions(req.authUserId) });
}));

companyBrainRouter.post("/actions/request", asyncHandler(async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name : "";
  const payload = req.body && typeof req.body.payload === "object" ? req.body.payload as Record<string, unknown> : {};
  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const action = requestAction(req.authUserId, name, payload);
  res.json({ action });
}));

companyBrainRouter.post("/actions/review", asyncHandler(async (req, res) => {
  const actionId = typeof req.body?.actionId === "string" ? req.body.actionId : "";
  const decision = req.body?.decision === "approve" ? "approve" : req.body?.decision === "reject" ? "reject" : "";
  if (!actionId || !decision) {
    res.status(400).json({ error: "actionId and decision are required" });
    return;
  }
  const action = reviewAction(req.authUserId, actionId, decision);
  if (!action) {
    res.status(404).json({ error: "action not found" });
    return;
  }
  res.json({ action });
}));

companyBrainRouter.post("/actions/execute", asyncHandler(async (req, res) => {
  const actionId = typeof req.body?.actionId === "string" ? req.body.actionId : "";
  if (!actionId) {
    res.status(400).json({ error: "actionId is required" });
    return;
  }
  const action = await executeApprovedAction(req.authUserId, actionId);
  if (!action) {
    res.status(404).json({ error: "action not found" });
    return;
  }
  res.json({ action });
}));

companyBrainRouter.get("/governance", asyncHandler(async (req, res) => {
  res.json({ governance: getGovernancePolicy(req.authUserId) });
}));

companyBrainRouter.post("/governance", asyncHandler(async (req, res) => {
  const riskPolicy = req.body?.riskPolicy;
  if (!riskPolicy || typeof riskPolicy !== "object") {
    res.status(400).json({ error: "riskPolicy object is required" });
    return;
  }
  const governance = updateGovernancePolicy(
    req.authUserId,
    riskPolicy as Partial<Record<"low" | "medium" | "high", { autoExecute?: boolean; requiredApprovals?: Array<"owner" | "admin" | "operator"> }>>,
  );
  res.json({ governance });
}));

companyBrainRouter.post("/roles", asyncHandler(async (req, res) => {
  const targetUserId = typeof req.body?.targetUserId === "string" ? req.body.targetUserId : "";
  const role = req.body?.role;
  const scopes = Array.isArray(req.body?.scopes)
    ? req.body.scopes.filter((item: unknown): item is string => typeof item === "string")
    : [];
  if (!targetUserId || (role !== "owner" && role !== "admin" && role !== "operator" && role !== "viewer")) {
    res.status(400).json({ error: "targetUserId and valid role are required" });
    return;
  }
  const result = setRoleAssignment(req.authUserId, targetUserId, role, scopes);
  res.json(result);
}));

companyBrainRouter.get("/audit", asyncHandler(async (req, res) => {
  res.json({ events: listAudit(req.authUserId) });
}));

companyBrainRouter.get("/audit/replay", asyncHandler(async (req, res) => {
  const from = typeof req.query.from === "string" ? req.query.from : undefined;
  const to = typeof req.query.to === "string" ? req.query.to : undefined;
  res.json(replayAudit(req.authUserId, from, to));
}));

companyBrainRouter.get("/audit/replay/approvals", asyncHandler(async (req, res) => {
  res.json({ items: listAuditReplayApprovals(req.authUserId) });
}));

companyBrainRouter.post("/audit/replay/approvals/request", asyncHandler(async (req, res) => {
  const from = typeof req.body?.from === "string" ? req.body.from : undefined;
  const to = typeof req.body?.to === "string" ? req.body.to : undefined;
  const note = typeof req.body?.note === "string" ? req.body.note : undefined;
  res.json(requestAuditReplayApproval(req.authUserId, from, to, note));
}));

companyBrainRouter.post("/audit/replay/approvals/review", asyncHandler(async (req, res) => {
  const approvalId = typeof req.body?.approvalId === "string" ? req.body.approvalId : "";
  const decision = req.body?.decision === "approve" ? "approve" : req.body?.decision === "reject" ? "reject" : "";
  if (!approvalId || !decision) {
    res.status(400).json({ error: "approvalId and decision are required" });
    return;
  }
  const result = reviewAuditReplayApproval(req.authUserId, approvalId, decision);
  if (!result.ok) {
    res.status(404).json({ error: "approval request not found" });
    return;
  }
  res.json(result);
}));

companyBrainRouter.get("/compliance", asyncHandler(async (req, res) => {
  res.json({ compliance: getCompliancePolicy(req.authUserId) });
}));

companyBrainRouter.post("/compliance", asyncHandler(async (req, res) => {
  const sourcePolicies = req.body?.sourcePolicies;
  if (!sourcePolicies || typeof sourcePolicies !== "object") {
    res.status(400).json({ error: "sourcePolicies object is required" });
    return;
  }
  const compliance = updateCompliancePolicy(req.authUserId, sourcePolicies as Partial<Record<
    "github" | "notion" | "local_files" | "slack" | "gmail" | "support" | "crm" | "db",
    { redactPII?: boolean; retentionClass?: "short" | "standard" | "extended"; ttlHours?: number; requireReplayApproval?: boolean }
  >>);
  res.json({ compliance });
}));

companyBrainRouter.get("/alerts", asyncHandler(async (req, res) => {
  res.json({ alerts: listAlerts(req.authUserId) });
}));

companyBrainRouter.get("/workers", asyncHandler(async (req, res) => {
  res.json({ workers: listWorkers(req.authUserId) });
}));

companyBrainRouter.post("/workers/register", asyncHandler(async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  res.json(registerWorker(req.authUserId, name));
}));

companyBrainRouter.post("/workers/heartbeat", asyncHandler(async (req, res) => {
  const workerId = typeof req.body?.workerId === "string" ? req.body.workerId : "";
  const status = req.body?.status;
  const error = typeof req.body?.error === "string" ? req.body.error : undefined;
  if (!workerId || (status !== "idle" && status !== "running" && status !== "error")) {
    res.status(400).json({ error: "workerId and valid status are required" });
    return;
  }
  const result = workerHeartbeat(req.authUserId, workerId, status, error);
  if (!result.ok) {
    res.status(404).json({ error: "worker not found" });
    return;
  }
  res.json(result);
}));

companyBrainRouter.post("/workers/run-once", asyncHandler(async (req, res) => {
  const result = await processQueueOnce(req.authUserId);
  res.json(result);
}));

companyBrainRouter.post("/sre/recover-queue", asyncHandler(async (req, res) => {
  res.json(recoverFailedQueueJobs(req.authUserId));
}));

companyBrainRouter.post("/sre/backfill-dead-letter", asyncHandler(async (req, res) => {
  res.json(backfillDeadLetterSourceEvents(req.authUserId));
}));

companyBrainRouter.get("/sre/runbook", asyncHandler(async (req, res) => {
  res.json(getSreRunbook(req.authUserId));
}));

companyBrainRouter.post("/eval/run", asyncHandler(async (req, res) => {
  res.json(runEvalHarness(req.authUserId));
}));

companyBrainRouter.get("/validation/evidence", asyncHandler(async (req, res) => {
  res.json(getExecutionEvidence(req.authUserId));
}));
