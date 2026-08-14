import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  compileSkillsV2,
  getGraph,
  enqueueJob,
  getStatus,
  listActions,
  listAudit,
  listSources,
  processQueueOnce,
  rebuildGraph,
  requestAction,
  simulateAction,
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
import {
  executeApproved,
  getExecutionRiskMatrix,
  listExecutionProposals,
  listPendingExecutionProposals,
  proposeExecution,
  reviewExecution,
} from "../../lib/companyBrain/executionEngine";
import { getCompanyBrainKpis } from "../../lib/companyBrain/kpis";
import { patchContinuityFunnelStep } from "../../lib/companyBrain/funnelStore";
import {
  mergeAgentLineage,
  parseAgentLineageFromBody,
  parseAgentLineageFromHeaders,
} from "../../lib/agents/agentLineage";
import {
  listProjectDriftReports,
  readDriftReport,
} from "../../lib/companyBrain/driftDetection";
import {
  createLoopFromGoal,
  getLoopDriftReport,
} from "../../lib/companyBrain/operationalLoopService";
import { buildMasterplanDashboardSnapshot } from "../../lib/companyBrain/masterplanDashboard";
import {
  getOperationalLoop,
  listOperationalLoops,
} from "../../lib/companyBrain/operationalLoopStore";
import { listMemories } from "../../lib/masterplan/productLoopStore";
import { listMemoryRealtimeEvents } from "../../lib/memory/realtimeEventStore";

export const companyBrainRouter = Router();

function executionScope(req: { authUserId: string; authOrgId?: string }) {
  return {
    userId: req.authUserId,
    orgId: req.authOrgId,
  };
}

companyBrainRouter.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const memories = await listMemories(executionScope(req), {});
    const byStatus = memories.reduce<Record<string, number>>((acc, memory) => {
      acc[memory.status] = (acc[memory.status] ?? 0) + 1;
      return acc;
    }, {});
    const byType = memories.reduce<Record<string, number>>((acc, memory) => {
      acc[memory.type] = (acc[memory.type] ?? 0) + 1;
      return acc;
    }, {});
    const approved = byStatus.approved ?? 0;
    const stale = byStatus.stale ?? 0;
    const needsReview = memories.filter((memory) => !["approved", "deprecated", "merged"].includes(memory.status)).length;
    const highRisk = memories.filter((memory) => memory.riskLevel === "high").length;
    const avgQuality = memories.length
      ? Math.round(memories.reduce((total, memory) => total + memory.qualityScore, 0) / memories.length)
      : 0;
    res.json({
      summary: {
        totalMemories: memories.length,
        approved,
        needsReview,
        stale,
        highRisk,
        linkedOutcomes: (await listMemoryRealtimeEvents(req.authUserId, 1000))
          .filter((event) => event.payload.eventType === "outcome.captured")
          .length,
        avgQuality,
        byStatus,
        byType,
        proofLoop: "SourceItem -> Memory -> Proof -> Integrity Check -> Approved Memory -> MemoryIgnition / Future Instruction / Mistake Immunity / Skill Candidate",
      },
    });
  }),
);

companyBrainRouter.get(
  "/status",
  asyncHandler(async (req, res) => {
    res.json(await getStatus(req.authUserId));
  }),
);

companyBrainRouter.get(
  "/kpis",
  asyncHandler(async (req, res) => {
    const kpis = await getCompanyBrainKpis({
      userId: req.authUserId,
      orgId: req.authOrgId,
    });
    const kpisRecord = kpis as Record<string, unknown>;
    if (!kpisRecord.phase1 || typeof kpisRecord.phase1 !== "object") {
      res.json({
        ...kpis,
        phase1: {
          weeklyActiveTeamsTarget: 10,
          weeklyActiveTeamsObserved: 0,
          activeWorkspaces7d: 0,
          continuityActions7d: 0,
          source: "continuity_threads_7d",
          lastGate: {
            status: "missing",
            generatedAt: null,
            failedChecks: null,
            totalChecks: null,
            reportPath: "",
          },
        },
      });
      return;
    }
    res.json(kpis);
  }),
);

companyBrainRouter.get(
  "/masterplan-dashboard",
  asyncHandler(async (req, res) => {
    const snapshot = await buildMasterplanDashboardSnapshot({
      userId: req.authUserId,
      orgId: req.authOrgId,
    });
    res.json(snapshot);
  }),
);

companyBrainRouter.get(
  "/masterplan-dashboard/events",
  asyncHandler(async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    let closed = false;
    req.on("close", () => {
      closed = true;
    });

    const writeSnapshot = async (): Promise<void> => {
      if (closed) return;
      const snapshot = await buildMasterplanDashboardSnapshot({
        userId: req.authUserId,
        orgId: req.authOrgId,
      });
      res.write(`event: snapshot\n`);
      res.write(`data: ${JSON.stringify(snapshot)}\n\n`);
    };

    await writeSnapshot();
    const interval = setInterval(() => {
      void writeSnapshot().catch((error) => {
        res.write(`event: error\n`);
        res.write(
          `data: ${JSON.stringify({ message: error instanceof Error ? error.message : "snapshot_failed" })}\n\n`,
        );
      });
    }, 5000);

    req.on("close", () => {
      clearInterval(interval);
    });
  }),
);

companyBrainRouter.get(
  "/sources",
  asyncHandler(async (req, res) => {
    res.json({ sources: await listSources(req.authUserId) });
  }),
);

companyBrainRouter.get(
  "/sources/templates",
  asyncHandler(async (_req, res) => {
    res.json({
      templates: {
        support: [
          {
            provider: "zendesk",
            config: {
              provider: "zendesk",
              subdomain: "your-subdomain",
              apiUrl: "",
              bearerToken: "",
              authHeader: "Authorization",
            },
          },
          {
            provider: "freshdesk",
            config: {
              provider: "freshdesk",
              domain: "your-domain",
              apiUrl: "",
              bearerToken: "",
              authHeader: "Authorization",
            },
          },
        ],
        crm: [
          {
            provider: "hubspot",
            config: {
              provider: "hubspot",
              apiUrl: "https://api.hubapi.com/crm/v3/objects/contacts",
              bearerToken: "",
              authHeader: "Authorization",
            },
          },
        ],
        db: [
          {
            provider: "postgres",
            config: {
              provider: "postgres",
              apiUrl: "https://internal.example.com/db/events",
              apiKey: "",
              authHeader: "Authorization",
            },
          },
          {
            provider: "mysql",
            config: {
              provider: "mysql",
              apiUrl: "https://internal.example.com/db/events",
              apiKey: "",
              authHeader: "Authorization",
            },
          },
        ],
      },
    });
  }),
);

companyBrainRouter.post(
  "/sources",
  asyncHandler(async (req, res) => {
    const type = typeof req.body?.type === "string" ? req.body.type : "";
    const enabled =
      typeof req.body?.enabled === "boolean" ? req.body.enabled : true;
    const config =
      req.body && typeof req.body.config === "object"
        ? (req.body.config as Record<string, unknown>)
        : {};
    if (!type) {
      res.status(400).json({ error: "type is required" });
      return;
    }
    const source = await upsertSource(req.authUserId, {
      type: type as
        | "github"
        | "notion"
        | "local_files"
        | "slack"
        | "gmail"
        | "zendesk"
        | "jira"
        | "support"
        | "crm"
        | "db",
      enabled,
      config,
    });
    res.json({ source });
  }),
);

companyBrainRouter.post(
  "/sync/run",
  asyncHandler(async (req, res) => {
    const result = await syncAllSources(req.authUserId);
    res.json(result);
  }),
);

companyBrainRouter.post(
  "/source-events/:type",
  asyncHandler(async (req, res) => {
    const rawType = req.params.type;
    const type = Array.isArray(rawType) ? rawType[0] : rawType;
    const payload =
      req.body && typeof req.body === "object"
        ? (req.body as Record<string, unknown>)
        : {};
    const acceptedTypes = new Set([
      "support",
      "crm",
      "db",
      "slack",
      "gmail",
      "zendesk",
      "jira",
    ]);
    if (!acceptedTypes.has(type)) {
      res.status(400).json({ error: "unsupported source event type" });
      return;
    }
    const event = await enqueueSourceEvent(
      req.authUserId,
      type as "support" | "crm" | "db" | "slack" | "gmail" | "zendesk" | "jira",
      payload,
    );
    res.json(event);
  }),
);

companyBrainRouter.post(
  "/source-events/process",
  asyncHandler(async (req, res) => {
    const rawType =
      typeof req.body?.type === "string" ? req.body.type : undefined;
    const processed = await processQueuedSourceEvents(
      req.authUserId,
      rawType as
        | "support"
        | "crm"
        | "db"
        | "slack"
        | "gmail"
        | "zendesk"
        | "jira"
        | undefined,
    );
    res.json({ accepted: processed });
  }),
);

companyBrainRouter.post(
  "/queue/enqueue",
  asyncHandler(async (req, res) => {
    const type = typeof req.body?.type === "string" ? req.body.type : "";
    if (!type) {
      res.status(400).json({ error: "type is required" });
      return;
    }
    const job = await enqueueJob(
      req.authUserId,
      type as "sync_all_sources" | "rebuild_graph" | "compile_skills",
    );
    res.json({ job });
  }),
);

companyBrainRouter.post(
  "/queue/process",
  asyncHandler(async (req, res) => {
    const result = await processQueueOnce(req.authUserId);
    res.json(result);
  }),
);

companyBrainRouter.post(
  "/scheduler/start",
  asyncHandler(async (req, res) => {
    const intervalSeconds =
      typeof req.body?.intervalSeconds === "number"
        ? req.body.intervalSeconds
        : 300;
    const result = await startScheduler(req.authUserId, intervalSeconds);
    res.json(result);
  }),
);

companyBrainRouter.post(
  "/scheduler/stop",
  asyncHandler(async (req, res) => {
    res.json(await stopScheduler(req.authUserId));
  }),
);

companyBrainRouter.post(
  "/graph/rebuild",
  asyncHandler(async (req, res) => {
    const result = await rebuildGraph(req.authUserId);
    res.json(result);
  }),
);

companyBrainRouter.get(
  "/graph",
  asyncHandler(async (req, res) => {
    const projectId =
      typeof req.query.projectId === "string" &&
      req.query.projectId.trim().length > 0
        ? req.query.projectId.trim()
        : undefined;
    res.json({
      ...(await getGraph(req.authUserId)),
      filters: { projectId },
    });
  }),
);

companyBrainRouter.post(
  "/skills/compile",
  asyncHandler(async (req, res) => {
    const result = await compileSkillsV2(req.authUserId);
    res.json(result);
  }),
);

companyBrainRouter.get(
  "/actions",
  asyncHandler(async (req, res) => {
    res.json({ actions: await listActions(req.authUserId) });
  }),
);

companyBrainRouter.post(
  "/actions/request",
  asyncHandler(async (req, res) => {
    const name = typeof req.body?.name === "string" ? req.body.name : "";
    const payload =
      req.body && typeof req.body.payload === "object"
        ? (req.body.payload as Record<string, unknown>)
        : {};
    if (!name) {
      res.status(400).json({ error: "name is required" });
      return;
    }
    const action = await requestAction(req.authUserId, name, payload);
    res.json({ action });
  }),
);

companyBrainRouter.post(
  "/actions/simulate",
  asyncHandler(async (req, res) => {
    const name = typeof req.body?.name === "string" ? req.body.name : "";
    const payload =
      req.body && typeof req.body.payload === "object"
        ? (req.body.payload as Record<string, unknown>)
        : {};
    if (!name) {
      res.status(400).json({ error: "name is required" });
      return;
    }
    const simulation = await simulateAction(req.authUserId, name, payload);
    res.json({ simulation });
  }),
);

companyBrainRouter.post(
  "/actions/review",
  asyncHandler(async (req, res) => {
    const actionId =
      typeof req.body?.actionId === "string" ? req.body.actionId : "";
    const decision =
      req.body?.decision === "approve"
        ? "approve"
        : req.body?.decision === "reject"
          ? "reject"
          : "";
    if (!actionId || !decision) {
      res.status(400).json({ error: "actionId and decision are required" });
      return;
    }
    const action = await reviewAction(req.authUserId, actionId, decision);
    if (!action) {
      res.status(404).json({ error: "action not found" });
      return;
    }
    res.json({ action });
  }),
);

companyBrainRouter.post(
  "/actions/execute",
  asyncHandler(async (req, res) => {
    const actionId =
      typeof req.body?.actionId === "string" ? req.body.actionId : "";
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
  }),
);

companyBrainRouter.get(
  "/governance",
  asyncHandler(async (req, res) => {
    res.json({ governance: await getGovernancePolicy(req.authUserId) });
  }),
);

companyBrainRouter.post(
  "/governance",
  asyncHandler(async (req, res) => {
    const riskPolicy = req.body?.riskPolicy;
    if (!riskPolicy || typeof riskPolicy !== "object") {
      res.status(400).json({ error: "riskPolicy object is required" });
      return;
    }
    const governance = await updateGovernancePolicy(
      req.authUserId,
      riskPolicy as Partial<
        Record<
          "low" | "medium" | "high",
          {
            autoExecute?: boolean;
            requiredApprovals?: Array<"owner" | "admin" | "operator">;
          }
        >
      >,
    );
    res.json({ governance });
  }),
);

companyBrainRouter.post(
  "/roles",
  asyncHandler(async (req, res) => {
    const targetUserId =
      typeof req.body?.targetUserId === "string" ? req.body.targetUserId : "";
    const role = req.body?.role;
    const scopes = Array.isArray(req.body?.scopes)
      ? req.body.scopes.filter(
          (item: unknown): item is string => typeof item === "string",
        )
      : [];
    if (
      !targetUserId ||
      (role !== "owner" &&
        role !== "admin" &&
        role !== "operator" &&
        role !== "viewer")
    ) {
      res
        .status(400)
        .json({ error: "targetUserId and valid role are required" });
      return;
    }
    const result = await setRoleAssignment(
      req.authUserId,
      targetUserId,
      role,
      scopes,
    );
    res.json(result);
  }),
);

companyBrainRouter.get(
  "/audit",
  asyncHandler(async (req, res) => {
    res.json({ events: await listAudit(req.authUserId) });
  }),
);

companyBrainRouter.get(
  "/audit/replay",
  asyncHandler(async (req, res) => {
    const from =
      typeof req.query.from === "string" ? req.query.from : undefined;
    const to = typeof req.query.to === "string" ? req.query.to : undefined;
    res.json(await replayAudit(req.authUserId, from, to));
  }),
);

companyBrainRouter.get(
  "/audit/replay/approvals",
  asyncHandler(async (req, res) => {
    res.json({ items: await listAuditReplayApprovals(req.authUserId) });
  }),
);

companyBrainRouter.post(
  "/audit/replay/approvals/request",
  asyncHandler(async (req, res) => {
    const from = typeof req.body?.from === "string" ? req.body.from : undefined;
    const to = typeof req.body?.to === "string" ? req.body.to : undefined;
    const note = typeof req.body?.note === "string" ? req.body.note : undefined;
    res.json(await requestAuditReplayApproval(req.authUserId, from, to, note));
  }),
);

companyBrainRouter.post(
  "/audit/replay/approvals/review",
  asyncHandler(async (req, res) => {
    const approvalId =
      typeof req.body?.approvalId === "string" ? req.body.approvalId : "";
    const decision =
      req.body?.decision === "approve"
        ? "approve"
        : req.body?.decision === "reject"
          ? "reject"
          : "";
    if (!approvalId || !decision) {
      res.status(400).json({ error: "approvalId and decision are required" });
      return;
    }
    const result = await reviewAuditReplayApproval(
      req.authUserId,
      approvalId,
      decision,
    );
    if (!result.ok) {
      res.status(404).json({ error: "approval request not found" });
      return;
    }
    res.json(result);
  }),
);

companyBrainRouter.get(
  "/compliance",
  asyncHandler(async (req, res) => {
    res.json({ compliance: await getCompliancePolicy(req.authUserId) });
  }),
);

companyBrainRouter.post(
  "/compliance",
  asyncHandler(async (req, res) => {
    const sourcePolicies = req.body?.sourcePolicies;
    if (!sourcePolicies || typeof sourcePolicies !== "object") {
      res.status(400).json({ error: "sourcePolicies object is required" });
      return;
    }
    const compliance = await updateCompliancePolicy(
      req.authUserId,
      sourcePolicies as Partial<
        Record<
          | "github"
          | "notion"
          | "local_files"
          | "slack"
          | "gmail"
          | "support"
          | "crm"
          | "db",
          {
            redactPII?: boolean;
            retentionClass?: "short" | "standard" | "extended";
            ttlHours?: number;
            requireReplayApproval?: boolean;
          }
        >
      >,
    );
    res.json({ compliance });
  }),
);

companyBrainRouter.get(
  "/alerts",
  asyncHandler(async (req, res) => {
    res.json({ alerts: await listAlerts(req.authUserId) });
  }),
);

companyBrainRouter.get(
  "/workers",
  asyncHandler(async (req, res) => {
    res.json({ workers: await listWorkers(req.authUserId) });
  }),
);

companyBrainRouter.post(
  "/workers/register",
  asyncHandler(async (req, res) => {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    if (!name) {
      res.status(400).json({ error: "name is required" });
      return;
    }
    res.json(await registerWorker(req.authUserId, name));
  }),
);

companyBrainRouter.post(
  "/workers/heartbeat",
  asyncHandler(async (req, res) => {
    const workerId =
      typeof req.body?.workerId === "string" ? req.body.workerId : "";
    const status = req.body?.status;
    const error =
      typeof req.body?.error === "string" ? req.body.error : undefined;
    if (
      !workerId ||
      (status !== "idle" && status !== "running" && status !== "error")
    ) {
      res.status(400).json({ error: "workerId and valid status are required" });
      return;
    }
    const result = await workerHeartbeat(req.authUserId, workerId, status, error);
    if (!result.ok) {
      res.status(404).json({ error: "worker not found" });
      return;
    }
    res.json(result);
  }),
);

companyBrainRouter.post(
  "/workers/run-once",
  asyncHandler(async (req, res) => {
    const result = await processQueueOnce(req.authUserId);
    res.json(result);
  }),
);

companyBrainRouter.post(
  "/sre/recover-queue",
  asyncHandler(async (req, res) => {
    res.json(await recoverFailedQueueJobs(req.authUserId));
  }),
);

companyBrainRouter.post(
  "/sre/backfill-dead-letter",
  asyncHandler(async (req, res) => {
    res.json(await backfillDeadLetterSourceEvents(req.authUserId));
  }),
);

companyBrainRouter.get(
  "/sre/runbook",
  asyncHandler(async (req, res) => {
    res.json(await getSreRunbook(req.authUserId));
  }),
);

companyBrainRouter.post(
  "/eval/run",
  asyncHandler(async (req, res) => {
    res.json(await runEvalHarness(req.authUserId));
  }),
);

companyBrainRouter.get(
  "/validation/evidence",
  asyncHandler(async (req, res) => {
    res.json(await getExecutionEvidence(req.authUserId));
  }),
);

companyBrainRouter.get(
  "/loops",
  asyncHandler(async (req, res) => {
    const projectId =
      typeof req.query.projectId === "string" ? req.query.projectId : undefined;
    const loops = await listOperationalLoops(req.authUserId, {
      orgId: req.authOrgId,
      projectId,
      limit: 50,
    });
    res.json({ loops });
  }),
);

companyBrainRouter.get(
  "/loops/:loopId",
  asyncHandler(async (req, res) => {
    const rawId = req.params.loopId;
    const loopId = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!loopId) {
      res.status(400).json({ error: "loopId is required" });
      return;
    }
    const loop = await getOperationalLoop(
      req.authUserId,
      loopId,
      req.authOrgId,
    );
    if (!loop) {
      res.status(404).json({ error: "Operational loop not found" });
      return;
    }
    res.json({ loop });
  }),
);

companyBrainRouter.get(
  "/loops/:loopId/drift",
  asyncHandler(async (req, res) => {
    const rawId = req.params.loopId;
    const loopId = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!loopId) {
      res.status(400).json({ error: "loopId is required" });
      return;
    }
    const loop = await getOperationalLoop(
      req.authUserId,
      loopId,
      req.authOrgId,
    );
    if (!loop) {
      res.status(404).json({ error: "Operational loop not found" });
      return;
    }
    const driftReport =
      (await getLoopDriftReport(executionScope(req), loopId)) ??
      readDriftReport(loop);
    res.json({ loopId, driftReport });
  }),
);

companyBrainRouter.get(
  "/drift",
  asyncHandler(async (req, res) => {
    const projectId =
      typeof req.query.projectId === "string" ? req.query.projectId.trim() : "";
    if (!projectId) {
      res.status(400).json({ error: "projectId query parameter is required" });
      return;
    }
    const limitRaw =
      typeof req.query.limit === "string" ? Number(req.query.limit) : 20;
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 50)
      : 20;
    const driftReports = await listProjectDriftReports(
      executionScope(req),
      projectId,
      limit,
    );
    res.json({ projectId, driftReports, count: driftReports.length });
  }),
);

companyBrainRouter.post(
  "/loops",
  asyncHandler(async (req, res) => {
    const goal = typeof req.body?.goal === "string" ? req.body.goal.trim() : "";
    const projectId =
      typeof req.body?.projectId === "string"
        ? req.body.projectId.trim()
        : undefined;
    const metadata =
      req.body?.metadata &&
      typeof req.body.metadata === "object" &&
      !Array.isArray(req.body.metadata)
        ? (req.body.metadata as Record<string, unknown>)
        : undefined;
    if (!goal) {
      res.status(400).json({ error: "goal is required" });
      return;
    }
    try {
      const loop = await createLoopFromGoal(executionScope(req), {
        goal,
        projectId: projectId ?? null,
        metadata,
      });
      res.status(201).json({ loop });
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Could not create operational loop.",
      });
    }
  }),
);

companyBrainRouter.get(
  "/execution/risk-matrix",
  asyncHandler(async (_req, res) => {
    res.json({ matrix: getExecutionRiskMatrix() });
  }),
);

companyBrainRouter.get(
  "/execution/proposals",
  asyncHandler(async (req, res) => {
    const status =
      req.query.status === "pending" ||
      req.query.status === "approved" ||
      req.query.status === "rejected" ||
      req.query.status === "executed" ||
      req.query.status === "failed"
        ? req.query.status
        : undefined;
    const pendingOnly = req.query.pending === "true";
    const proposals = pendingOnly
      ? await listPendingExecutionProposals(executionScope(req))
      : await listExecutionProposals(req.authUserId, {
          orgId: req.authOrgId,
          status,
          limit: 50,
        });
    res.json({ proposals });
  }),
);

companyBrainRouter.post(
  "/execution/propose",
  asyncHandler(async (req, res) => {
    const adapter =
      typeof req.body?.adapter === "string" ? req.body.adapter : "";
    const actionType =
      typeof req.body?.actionType === "string" ? req.body.actionType : "";
    const payload =
      req.body &&
      typeof req.body.payload === "object" &&
      !Array.isArray(req.body.payload)
        ? (req.body.payload as Record<string, unknown>)
        : {};
    const riskTier =
      req.body?.riskTier === "low" ||
      req.body?.riskTier === "medium" ||
      req.body?.riskTier === "high"
        ? req.body.riskTier
        : undefined;
    const goal =
      typeof req.body?.goal === "string" ? req.body.goal.trim() : undefined;
    const loopId =
      typeof req.body?.loopId === "string" ? req.body.loopId.trim() : undefined;
    const projectId =
      typeof req.body?.projectId === "string"
        ? req.body.projectId.trim()
        : undefined;
    const loopContext =
      goal || loopId || projectId
        ? { goal, loopId, projectId: projectId ?? null }
        : undefined;
    const agentLineage = mergeAgentLineage(
      parseAgentLineageFromHeaders(req),
      parseAgentLineageFromBody(req.body),
    );
    if (!adapter || !actionType) {
      res.status(400).json({ error: "adapter and actionType are required" });
      return;
    }
    try {
      const proposal = await proposeExecution(executionScope(req), {
        adapter,
        actionType,
        payload,
        riskTier,
        loop: loopContext,
        agentLineage,
      });
      void patchContinuityFunnelStep(req.authUserId, "proposalCreated", {
        orgId: req.authOrgId,
      }).catch((error) => {
        console.warn(
          "[CompanyBrainFunnel] proposalCreated patch failed:",
          error,
        );
      });
      res.status(201).json({ proposal });
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Could not create execution proposal.",
      });
    }
  }),
);

companyBrainRouter.post(
  "/execution/review",
  asyncHandler(async (req, res) => {
    const proposalId =
      typeof req.body?.proposalId === "string" ? req.body.proposalId : "";
    const decision =
      req.body?.decision === "approve"
        ? "approve"
        : req.body?.decision === "reject"
          ? "reject"
          : "";
    if (!proposalId || !decision) {
      res
        .status(400)
        .json({
          error: "proposalId and decision (approve|reject) are required",
        });
      return;
    }
    try {
      const proposal = await reviewExecution(executionScope(req), {
        proposalId,
        decision,
        rejectionReason:
          typeof req.body?.rejectionReason === "string"
            ? req.body.rejectionReason
            : undefined,
        secondFactorVerified: req.body?.secondFactorVerified === true,
      });
      if (decision === "approve") {
        void patchContinuityFunnelStep(req.authUserId, "approved", {
          orgId: req.authOrgId,
        }).catch((error) => {
          console.warn("[CompanyBrainFunnel] approved patch failed:", error);
        });
      }
      res.json({ proposal });
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Could not review execution proposal.",
      });
    }
  }),
);

companyBrainRouter.post(
  "/execution/execute",
  asyncHandler(async (req, res) => {
    const proposalId =
      typeof req.body?.proposalId === "string" ? req.body.proposalId : "";
    if (!proposalId) {
      res.status(400).json({ error: "proposalId is required" });
      return;
    }
    try {
      const proposal = await executeApproved(executionScope(req), proposalId);
      if (proposal.status === "executed") {
        void patchContinuityFunnelStep(req.authUserId, "executed", {
          orgId: req.authOrgId,
        }).catch((error) => {
          console.warn("[CompanyBrainFunnel] executed patch failed:", error);
        });
      }
      res.json({ proposal });
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error
            ? error.message
            : "Could not execute proposal.",
      });
    }
  }),
);
