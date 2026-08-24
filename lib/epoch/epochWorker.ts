import { prisma } from "../storage/prismaClient";
import {
  acknowledgeEpochJob,
  enqueueEpochJob,
  deadLetterEpochJob,
  failEpochJob,
  deferEpochJob,
  hasEpochQueuedJob,
  retryEpochJob,
  leaseEpochJobs,
  releaseEpochJobLease,
  type EpochQueueJob,
  type EpochQueueJobType,
} from "./epochQueue";
import {
  claimEpochWorkerLease,
  ensureEpochProcessWorker,
  recoverExpiredEpochWorkerLeases,
  releaseEpochWorkerLease,
  renewEpochWorkerLease,
} from "./epochWorkers";
import { persistEpochWorkerCheckpoint } from "./durableWorkerState";
import { epochSqsConfigFromEnv, renewEpochSqsLease } from "./awsSqsQueueTransport";
import {
  appendEpochEvidence,
  getEpochAuthorityGate,
  issueEpochCertificate,
  recordEpochMemory,
  runEpochVerification,
  updateEpochExecutionCheckpoint,
  isEpochMissionCancelled,
  updateEpochMission,
} from "./epochStore";
import { runEpochWebhookDeliveryTick } from "./epochWebhooks";
import { emitEpochRuntimeEvent } from "./epochEvents";
import { decideEpochRecovery, evaluateEpochMissionLimits } from "./recoveryPolicy";
import { buildEpochRecoveryPlan } from "./recoveryActions";
import { createEpochRecoveryEscalation } from "./recoveryEscalations";
import { completeEpochAi, readEpochAiProviderConfig } from "./aiProviders";
import { streamEpochAiToExecution } from "./streamExecution";
import { executeBenchmarkRun } from "../benchmark/benchmarkRunner";
import { evaluateEpochQuality, type EpochQualityCase, type EpochQualityOutput } from "./evaluationEngine";
import { loadEpochQualityDataset, validateEpochQualityDataset } from "./qualityDataset";
import { inspectEpochHuggingFaceModel } from "./huggingFace";
import { recordEpochHuggingFaceSyncState, refreshEpochHuggingFaceVerificationGate, syncEpochHuggingFaceModel } from "./huggingFaceStore";
import { runEpochLocalBenchmark } from "./localBenchmarkRunner";
import { planEpochDiscovery } from "./discoveryLoop";
import { runEpochEvidenceExpiryTick } from "./evidenceExpiryWorker";
import { processEpochPipelineJob } from "./durablePipelineWorker";
import { buildEpochRuntimeBenchmark, evaluateEpochRuntimeQuality } from "./runtimeEvaluation";
import { projectEpochObservationsToReality } from "./observationRealityProjector";
import { runEpochRealityMaintenanceTick } from "./realityMaintenance";

const WORKER_ID = `${process.pid}:${Math.random().toString(36).slice(2, 10)}`;

let workerTimer: NodeJS.Timeout | null = null;
let workerBusy = false;
let lastEvidenceExpiryAt = 0;

function workerEnabled(): boolean {
  const raw = process.env.EPOCH_WORKER_ENABLED?.trim().toLowerCase();
  return raw !== "false" && raw !== "0";
}

function workerIntervalMs(): number {
  const raw = Number(process.env.EPOCH_WORKER_INTERVAL_MS);
  return Number.isFinite(raw) && raw >= 250 ? Math.floor(raw) : 2500;
}

function workerBatchSize(): number {
  const raw = Number(process.env.EPOCH_WORKER_BATCH_SIZE);
  return Number.isFinite(raw) && raw > 0 ? Math.min(20, Math.floor(raw)) : 5;
}

function evidenceExpiryIntervalMs(): number {
  const raw = Number(process.env.EPOCH_EVIDENCE_EXPIRY_INTERVAL_MS);
  return Number.isFinite(raw) && raw >= 10_000 ? Math.floor(raw) : 60_000;
}

function workerAiEnabled(): boolean {
  const raw = process.env.EPOCH_WORKER_AI_ENABLED?.trim().toLowerCase();
  return raw === "true" || raw === "1";
}

function workerAiProvider(): "openai" | "openrouter" | "local" | "private" | "modal" {
  const raw = process.env.EPOCH_WORKER_AI_PROVIDER?.trim().toLowerCase();
  return raw === "openrouter" || raw === "local" || raw === "private" || raw === "modal" ? raw : "openai";
}

function workspaceUserId(workspace: { userId: string; orgId: string | null }): string {
  return workspace.userId;
}

function workerEvent(stage: string, status: string, note: string, details?: Record<string, unknown>) {
  return {
    id: `evt_${Math.random().toString(36).slice(2, 10)}`,
    stage,
    status,
    note,
    timestamp: new Date().toISOString(),
    ...(details ?? {}),
  };
}

async function recordWorkerRecovery(input: {
  workspaceId: string;
  job: EpochQueueJob;
  error: string;
  recovery: ReturnType<typeof decideEpochRecovery>;
  terminal: boolean;
  userId: string;
  orgId?: string;
}): Promise<void> {
  if (!input.job.missionId) return;
  const mission = await prisma.epochMission.findFirst({
    where: { id: input.job.missionId, workspaceId: input.workspaceId },
    include: { executionRun: true, authorityPolicies: { orderBy: { updatedAt: "desc" }, take: 1 } },
  });
  if (!mission) return;
  if (mission.state === "completed" || mission.state === "failed") return;

  const proof = mission.proof && typeof mission.proof === "object" ? mission.proof as Record<string, unknown> : {};
  const result = mission.result && typeof mission.result === "object" ? mission.result as Record<string, unknown> : {};
  const recovery = Array.isArray(proof.recovery) ? proof.recovery : [];
  const authority = mission.authorityPolicies[0];
  const permissions = authority && Array.isArray(authority.permissions) ? authority.permissions.filter((item): item is string => typeof item === "string") : [];
  const recoveryPlan = buildEpochRecoveryPlan({
    strategy: input.recovery.action,
    reason: input.recovery.reason,
    rollback: input.recovery.action === "resume" ? ["resume_from_last_checkpoint"] : [],
    compensation: input.terminal ? ["record_failed_attempt"] : [],
    permissions,
  });
  const recoveryRecord = {
    action: input.recovery.action,
    kind: input.recovery.kind,
    reason: input.recovery.reason,
    error: input.error,
    retryCount: input.job.retryCount ?? 0,
    plan: recoveryPlan,
    timestamp: new Date().toISOString(),
  };
  await updateEpochMission(input.workspaceId, mission.id, {
    state: input.terminal ? "failed" : "running",
    currentStep: input.terminal ? "recovery_failed" : "recovery",
    completedAt: input.terminal ? new Date() : undefined,
    result: input.terminal
      ? { ...result, failure: input.error, recoveryAction: input.recovery.action }
      : result,
    proof: { ...proof, recovery: [...recovery, recoveryRecord], lastRecovery: recoveryRecord },
    timeline: [
      ...((Array.isArray(mission.timeline) ? mission.timeline : []) as Record<string, unknown>[]),
      workerEvent("recovery", input.terminal ? "failed" : "retrying", input.terminal ? "Mission recovery exhausted" : "Mission recovery scheduled", recoveryRecord),
    ],
  });
  await appendEpochEvidence({
    workspaceId: input.workspaceId,
    missionId: mission.id,
    executionRunId: mission.executionRun?.id,
    userId: input.userId,
    evidence: [{
      kind: "recovery_attempt",
      summary: input.terminal ? "Worker recovery exhausted" : "Worker recovery scheduled",
      payload: recoveryRecord,
      proof: { recovery: true, terminal: input.terminal },
    }],
  });
  if (recoveryPlan.requiresHuman) {
    await createEpochRecoveryEscalation({
      workspaceId: input.workspaceId,
      missionId: mission.id,
      executionRunId: mission.executionRun?.id,
      reason: input.recovery.reason,
      payload: {
        action: input.recovery.action,
        kind: input.recovery.kind,
        error: input.error,
        recoveryPlan,
      },
    });
  }
}

async function processPlanJob(workspaceId: string, job: EpochQueueJob): Promise<void> {
  if (!job.missionId) {
    throw new Error("epoch_job_missing_mission");
  }
  const mission = await prisma.epochMission.findFirst({ where: { id: job.missionId, workspaceId } });
  if (!mission) {
    throw new Error("epoch_mission_not_found");
  }
  if (isEpochMissionCancelled(mission.proof)) {
    throw new Error("epoch_mission_cancelled");
  }
  await updateEpochMission(workspaceId, mission.id, {
    state: "running",
    currentStep: "planner",
    timeline: [
      ...((Array.isArray(mission.timeline) ? mission.timeline : []) as Record<string, unknown>[]),
      workerEvent("planner", "queued", "Mission queued for planning", { missionId: mission.id }),
    ],
  });
  if (!(await hasEpochQueuedJob(workspaceId, mission.id, "execute"))) {
    await enqueueEpochJob({
      workspaceId,
      institutionId: mission.institutionId,
      missionId: mission.id,
      userId: mission.userId,
      orgId: mission.orgId ?? undefined,
      type: "execute",
      payload: {
        plan: Array.isArray(mission.plan) ? mission.plan : undefined,
        humanApproval: "approved",
        confidence: 100,
        approvals: ["worker"],
      },
    });
  }
}

async function processExecuteJob(workspaceId: string, job: EpochQueueJob): Promise<void> {
  if (!job.missionId) {
    throw new Error("epoch_job_missing_mission");
  }
  const payload = job.payload ?? {};
  const mission = await prisma.epochMission.findFirst({
    where: { id: job.missionId, workspaceId },
    include: {
      executionRun: true,
      evidence: { orderBy: { createdAt: "desc" } },
      authorityPolicies: { orderBy: { updatedAt: "desc" }, take: 1 },
    },
  });
  if (!mission) {
    throw new Error("epoch_mission_not_found");
  }
  if (isEpochMissionCancelled(mission.proof)) {
    throw new Error("epoch_mission_cancelled");
  }
  const timeoutMs = Number(process.env.EPOCH_EXECUTION_TIMEOUT_MS ?? 15 * 60 * 1000);
  if (mission.executionRun?.startedAt && Date.now() - mission.executionRun.startedAt.getTime() >= timeoutMs) {
    await prisma.epochExecutionRun.update({
      where: { id: mission.executionRun.id },
      data: {
        status: "timed_out",
        finishedAt: new Date(),
        proof: { ...(mission.executionRun.proof as Record<string, unknown>), timedOut: true, timeoutMs },
      } as any,
    });
    await updateEpochMission(workspaceId, mission.id, {
      state: "failed",
      currentStep: "timeout",
      completedAt: new Date(),
      result: { ...(mission.result as Record<string, unknown>), timedOut: true, timeoutMs },
      proof: { ...(mission.proof as Record<string, unknown>), timedOut: true },
    });
    await appendEpochEvidence({
      workspaceId,
      missionId: mission.id,
      executionRunId: mission.executionRun.id,
      userId: mission.userId,
      evidence: [{ kind: "timeout", summary: `Execution exceeded ${timeoutMs}ms`, payload: { timeoutMs }, proof: { timedOut: true } }],
    });
    return;
  }
  if (!mission.executionRun) {
    const plan = Array.isArray(payload.plan) && payload.plan.length > 0
      ? (payload.plan as string[])
      : Array.isArray(mission.plan) && mission.plan.length > 0
        ? (mission.plan as string[])
        : [
            `Clarify mission objective: ${mission.objective}`,
            "Gather evidence",
            "Validate authority",
            "Review result with human approval",
            "Record institutional memory",
          ];

    const executionRun = await prisma.epochExecutionRun.create({
      data: {
        workspaceId,
        missionId: mission.id,
        userId: mission.userId,
        orgId: mission.orgId ?? undefined,
        status: "running",
        planner: {
          stage: "planner",
          status: "completed",
          plan,
        },
        executor: {
          stage: "executor",
          status: "running",
        },
        reviewer: {
          stage: "reviewer",
          status: "pending",
        },
        human: {
          stage: "human",
          status: payload.humanApproval ?? "approved",
        },
        logs: [
          workerEvent("planner", "completed", "Planner prepared the mission plan", { plan }),
          workerEvent("executor", "started", "Executor started the mission", {}),
        ],
        proof: {
          missionObjective: mission.objective,
          policyId: mission.authorityPolicies[0]?.id ?? null,
          queuedBy: "epoch-worker",
        },
      } as any,
    });

    await updateEpochExecutionCheckpoint({
      workspaceId,
      missionId: mission.id,
      executionRunId: executionRun.id,
      userId: mission.userId,
      stepId: "executor",
      status: "started",
    });

    await updateEpochMission(workspaceId, mission.id, {
      state: "running",
      currentStep: "executor",
      startedAt: mission.startedAt ?? new Date(),
      timeline: [
        ...((Array.isArray(mission.timeline) ? mission.timeline : []) as Record<string, unknown>[]),
        workerEvent("executor", "started", "Executor started the mission", { missionId: mission.id }),
      ],
    });

    const aiProvider = workerAiEnabled() ? workerAiProvider() : null;
    const aiRun = aiProvider
      ? await streamEpochAiToExecution({
          workspaceId,
          missionId: mission.id,
          executionId: executionRun.id,
          userId: mission.userId,
          orgId: mission.orgId ?? undefined,
          correlationId: `corr_${mission.id}`,
          traceId: `trace_${executionRun.id}`,
          request: {
            model: aiProvider === "openrouter" ? (process.env.EPOCH_WORKER_AI_MODEL?.trim() || "openrouter/free") : aiProvider === "modal" ? (process.env.EPOCH_WORKER_AI_MODEL?.trim() || "MiniMaxAI/SynLogic-7B") : (process.env.EPOCH_WORKER_AI_MODEL?.trim() || "gpt-4.1"),
            prompt: `${mission.objective}\nAcceptance criteria:\n${Array.isArray(payload.checklist) ? (payload.checklist as string[]).join("\n") : "Satisfy the mission objective and provide verifiable output."}`,
            maxOutputTokens: Number(process.env.EPOCH_WORKER_AI_MAX_OUTPUT_TOKENS ?? 512),
            requireJson: false,
          },
          provider: readEpochAiProviderConfig(aiProvider),
        })
      : null;
    if (aiRun) {
      await prisma.epochExecutionRun.update({ where: { id: executionRun.id }, data: { executor: { stage: "executor", status: "completed", provider: aiProvider, model: aiRun.response.evidence.model }, proof: { missionObjective: mission.objective, aiProvider, aiModel: aiRun.response.evidence.model, aiCostCents: aiRun.response.evidence.estimatedCostCents, aiLatencyMs: aiRun.response.evidence.latencyMs } } as any });
    }

    const generatedEvidence = Array.isArray(payload.evidence) && payload.evidence.length > 0
      ? (payload.evidence as { kind: string; url?: string; filePath?: string; contentType?: string; summary?: string; payload?: Record<string, unknown>; proof?: Record<string, unknown> }[])
      : [
          {
            kind: "mission_summary",
            summary: `Worker executed ${mission.title}`,
            payload: { objective: mission.objective, plan },
            proof: { generatedBy: "epoch-worker" },
          },
        ];
    if (aiRun) generatedEvidence.push({ kind: "ai_output", summary: "Configured AI worker output", payload: { output: aiRun.response.output }, proof: { provider: aiRun.response.evidence.provider, model: aiRun.response.evidence.model, costCents: aiRun.response.evidence.estimatedCostCents, latencyMs: aiRun.response.evidence.latencyMs } });
    await appendEpochEvidence({
      workspaceId,
      missionId: mission.id,
      executionRunId: executionRun.id,
      userId: mission.userId,
      evidence: generatedEvidence,
    });

    if (!(await hasEpochQueuedJob(workspaceId, mission.id, "review"))) {
      await enqueueEpochJob({
        workspaceId,
        institutionId: mission.institutionId,
        missionId: mission.id,
        userId: mission.userId,
        orgId: mission.orgId ?? undefined,
        type: "review",
        payload: {
          humanApproval: payload.humanApproval ?? "approved",
          checklist: Array.isArray(payload.checklist)
            ? (payload.checklist as string[])
            : ["Planner completed", "Executor completed", "Evidence collected"],
          confidence: typeof payload.confidence === "number" ? payload.confidence : 100,
          approvals: Array.isArray(payload.approvals) ? (payload.approvals as string[]) : ["worker"],
          output: aiRun ? { output: aiRun.response.output, provider: aiRun.response.evidence.provider, model: aiRun.response.evidence.model } : payload.output && typeof payload.output === "object" && !Array.isArray(payload.output)
            ? (payload.output as Record<string, unknown>)
            : {
                missionId: mission.id,
                title: mission.title,
                objective: mission.objective,
              },
        },
      });
    }
    return;
  }

  if (!(await hasEpochQueuedJob(workspaceId, mission.id, "review"))) {
    await enqueueEpochJob({
      workspaceId,
      institutionId: mission.institutionId,
      missionId: mission.id,
      userId: mission.userId,
      orgId: mission.orgId ?? undefined,
      type: "review",
      payload: {
        humanApproval: payload.humanApproval ?? "approved",
        checklist: Array.isArray(payload.checklist)
          ? (payload.checklist as string[])
          : ["Planner completed", "Executor completed", "Evidence collected"],
        confidence: typeof payload.confidence === "number" ? payload.confidence : 100,
        approvals: Array.isArray(payload.approvals) ? (payload.approvals as string[]) : ["worker"],
        output: payload.output && typeof payload.output === "object" && !Array.isArray(payload.output)
          ? (payload.output as Record<string, unknown>)
          : {
              missionId: mission.id,
              title: mission.title,
              objective: mission.objective,
            },
      },
    });
  }
}

async function processReviewJob(workspaceId: string, job: EpochQueueJob): Promise<void> {
  if (!job.missionId) {
    throw new Error("epoch_job_missing_mission");
  }
  const payload = job.payload ?? {};
  const mission = await prisma.epochMission.findFirst({
    where: { id: job.missionId, workspaceId },
    include: { executionRun: true, evidence: true },
  });
  if (!mission) {
    throw new Error("epoch_mission_not_found");
  }
  await updateEpochMission(workspaceId, mission.id, {
    state: "waiting_review",
    currentStep: "human_review",
    timeline: [
      ...((Array.isArray(mission.timeline) ? mission.timeline : []) as Record<string, unknown>[]),
      workerEvent("review", "queued", "Mission queued for review", { missionId: mission.id }),
    ],
  });
  if (payload.humanApproval === "approved" || payload.humanApproval === "review") {
    if (!(await hasEpochQueuedJob(workspaceId, mission.id, "verify"))) {
      await enqueueEpochJob({
        workspaceId,
        institutionId: mission.institutionId,
        missionId: mission.id,
        userId: mission.userId,
        orgId: mission.orgId ?? undefined,
        type: "verify",
        payload: {
          checklist: Array.isArray(payload.checklist) ? (payload.checklist as string[]) : undefined,
          evidenceIds: mission.evidence.map((item) => item.id),
          humanApproval: "approved",
          confidence: typeof payload.confidence === "number" ? payload.confidence : 100,
          approvals: Array.isArray(payload.approvals) ? (payload.approvals as string[]) : ["worker"],
          output: payload.output && typeof payload.output === "object" && !Array.isArray(payload.output)
            ? (payload.output as Record<string, unknown>)
            : {
                missionId: mission.id,
                title: mission.title,
                objective: mission.objective,
              },
        },
      });
    }
  }
}

async function processVerifyJob(workspaceId: string, job: EpochQueueJob): Promise<void> {
  if (!job.missionId) {
    throw new Error("epoch_job_missing_mission");
  }
  const payload = job.payload ?? {};
  const mission = await prisma.epochMission.findFirst({
    where: { id: job.missionId, workspaceId },
    include: { evidence: true, verificationRun: true },
  });
  if (!mission) {
    throw new Error("epoch_mission_not_found");
  }
  const verification = await runEpochVerification({
    workspaceId,
    missionId: mission.id,
    userId: mission.userId,
    orgId: mission.orgId ?? undefined,
    evidence:
      Array.isArray(payload.evidenceIds)
        ? payload.evidenceIds.map((id) => ({ id: String(id) }))
        : mission.evidence.map((item) => ({ id: item.id })),
    checklist: Array.isArray(payload.checklist) ? (payload.checklist as string[]) : undefined,
    humanApproval:
      payload.humanApproval === "approved" || payload.humanApproval === "rejected" || payload.humanApproval === "review"
        ? payload.humanApproval
        : undefined,
    confidence: typeof payload.confidence === "number" ? payload.confidence : undefined,
    output: payload.output && typeof payload.output === "object" && !Array.isArray(payload.output) ? payload.output as Record<string, unknown> : undefined,
    approvals: Array.isArray(payload.approvals) ? (payload.approvals as string[]) : undefined,
  });
  if (!verification) {
    throw new Error("epoch_verification_failed");
  }
  if (!(await hasEpochQueuedJob(workspaceId, mission.id, "certificate"))) {
    await enqueueEpochJob({
      workspaceId,
      institutionId: mission.institutionId,
      missionId: mission.id,
      userId: mission.userId,
      orgId: mission.orgId ?? undefined,
      type: "certificate",
      payload: {
        verificationRunId: verification.id,
        approvals: Array.isArray(payload.approvals) ? (payload.approvals as string[]) : ["worker"],
        evidenceSummary: {
          evidenceIds: verification.evidenceIds,
          finalDecision: verification.finalDecision,
        },
      },
    });
  }
}

async function processCertificateJob(workspaceId: string, job: EpochQueueJob): Promise<void> {
  if (!job.missionId) {
    throw new Error("epoch_job_missing_mission");
  }
  const mission = await prisma.epochMission.findFirst({
    where: { id: job.missionId, workspaceId },
    include: { verificationRun: true, certificate: true },
  });
  if (!mission) {
    throw new Error("epoch_mission_not_found");
  }
  const certificate = await issueEpochCertificate({
    workspaceId,
    missionId: mission.id,
    verificationRunId: mission.verificationRun?.id,
    userId: mission.userId,
    orgId: mission.orgId ?? undefined,
  });
  if (!certificate) {
    throw new Error("epoch_certificate_failed");
  }
  if (!(await hasEpochQueuedJob(workspaceId, mission.id, "memory"))) {
    await enqueueEpochJob({
      workspaceId,
      institutionId: mission.institutionId,
      missionId: mission.id,
      userId: mission.userId,
      orgId: mission.orgId ?? undefined,
      type: "memory",
      payload: {
        certificateId: certificate.id,
      },
    });
  }
}

async function processMemoryJob(workspaceId: string, job: EpochQueueJob): Promise<void> {
  if (!job.missionId) {
    throw new Error("epoch_job_missing_mission");
  }
  const mission = await prisma.epochMission.findFirst({
    where: { id: job.missionId, workspaceId },
    include: {
      verificationRun: true,
      certificate: true,
      memoryRecord: true,
      executionRun: true,
    },
  });
  if (!mission) {
    throw new Error("epoch_mission_not_found");
  }
  const memory = await recordEpochMemory({
    workspaceId,
    institutionId: mission.institutionId,
    missionId: mission.id,
    certificateId: mission.certificate?.id,
    userId: mission.userId,
    orgId: mission.orgId ?? undefined,
    history: [{ missionId: mission.id, title: mission.title, objective: mission.objective }],
    lessons: ["Recorded by Epoch queue worker."],
    mistakes: [],
    suggestedImprovements: ["Add richer evidence and approval metadata."],
  });
  const finalState = mission.verificationRun?.finalDecision === "PASS"
    ? "completed"
    : mission.verificationRun?.finalDecision === "FAIL"
      ? "failed"
      : "waiting_review";

  await updateEpochMission(workspaceId, mission.id, {
    state: finalState,
    currentStep: finalState === "waiting_review" ? "human_review" : "closed",
    completedAt: new Date(),
    result: {
      executionRunId: mission.executionRun?.id ?? null,
      verificationRunId: mission.verificationRun?.id ?? null,
      certificateId: mission.certificate?.id ?? null,
      memoryRecordId: memory.id,
      decision: mission.verificationRun?.finalDecision ?? "REVIEW",
    },
    timeline: [
      ...((Array.isArray(mission.timeline) ? mission.timeline : []) as Record<string, unknown>[]),
      workerEvent("memory", "recorded", "Institution memory recorded", {
        memoryRecordId: memory.id,
      }),
    ],
  });

  if (mission.executionRun) {
    const existingExecutor = mission.executionRun.executor && typeof mission.executionRun.executor === "object"
      ? mission.executionRun.executor as Record<string, unknown>
      : {};
    await prisma.epochExecutionRun.update({
      where: { id: mission.executionRun.id },
      data: {
        status: finalState,
        finishedAt: new Date(),
        executor: {
          ...existingExecutor,
          stage: "executor",
          status: finalState === "failed" ? "failed" : "completed",
        },
        reviewer: {
          stage: "reviewer",
          status: mission.verificationRun?.finalDecision ?? "REVIEW",
        },
        human: {
          stage: "human",
          status: "approved",
        },
        proof: {
          memoryRecordId: memory.id,
          certificateId: mission.certificate?.id ?? null,
          verificationRunId: mission.verificationRun?.id ?? null,
        },
      } as any,
    });
  }
}

async function processBenchmarkJob(workspaceId: string, job: EpochQueueJob): Promise<void> {
  const payload = job.payload ?? {};
  const mode = payload.mode === "preview" || payload.mode === "production" ? payload.mode : "local";
  const caseIds = Array.isArray(payload.caseIds) ? payload.caseIds.filter((value): value is string => typeof value === "string").slice(0, 500) : undefined;
  const run = await executeBenchmarkRun(mode, caseIds ? { caseIds } : undefined);
  if (!job.missionId) return;
  const mission = await prisma.epochMission.findFirst({ where: { id: job.missionId, workspaceId } });
  if (!mission) throw new Error("epoch_mission_not_found");
  const proof = mission.proof && typeof mission.proof === "object" ? mission.proof as Record<string, unknown> : {};
  await updateEpochMission(workspaceId, mission.id, {
    proof: { ...proof, benchmarkRun: { runId: run.runId, status: run.status, passRate: run.passRate, totalCases: run.totalCases, passedCases: run.passedCases, completedAt: run.completedAt } },
    timeline: [...(Array.isArray(mission.timeline) ? mission.timeline : []) as Record<string, unknown>[], workerEvent("benchmark", run.status, "Durable benchmark worker completed", { runId: run.runId, passRate: run.passRate })],
  });
  await appendEpochEvidence({ workspaceId, missionId: mission.id, userId: mission.userId, evidence: [{ kind: "benchmark_run", summary: `Benchmark ${run.status}`, payload: { runId: run.runId, passRate: run.passRate, totalCases: run.totalCases, passedCases: run.passedCases }, proof: { durableWorker: true } }] });
}

async function processQualityJob(workspaceId: string, job: EpochQueueJob): Promise<void> {
  if (!job.missionId) throw new Error("epoch_quality_job_missing_mission");
  const payload = job.payload ?? {};
  const dataset = payload.datasetId === "epoch-local-quality-v1" ? await loadEpochQualityDataset() : null;
  const cases = Array.isArray(payload.cases) ? payload.cases as EpochQualityCase[] : dataset?.cases ?? [];
  const outputs = Array.isArray(payload.outputs) ? payload.outputs as EpochQualityOutput[] : [];
  if (!cases.length) throw new Error("epoch_quality_job_missing_cases");
  const evaluation = evaluateEpochQuality({ cases, outputs, minimumScorePct: typeof payload.minimumScorePct === "number" ? payload.minimumScorePct : 0 });
  const mission = await prisma.epochMission.findFirst({ where: { id: job.missionId, workspaceId } });
  if (!mission) throw new Error("epoch_mission_not_found");
  const proof = mission.proof && typeof mission.proof === "object" ? mission.proof as Record<string, unknown> : {};
  await updateEpochMission(workspaceId, mission.id, {
    proof: { ...proof, qualityEvaluation: { ...evaluation, dataset: dataset ? { id: dataset.id, sha256: dataset.sha256 } : undefined } },
    timeline: [...(Array.isArray(mission.timeline) ? mission.timeline : []) as Record<string, unknown>[], workerEvent("quality", evaluation.status, "Durable quality worker completed", { scorePct: evaluation.weightedScorePct, passedCases: evaluation.passedCases, totalCases: evaluation.totalCases })],
  });
  await appendEpochEvidence({ workspaceId, missionId: mission.id, userId: mission.userId, evidence: [{ kind: "quality_evaluation", summary: `Quality evaluation ${evaluation.status}`, payload: evaluation, proof: { durableWorker: true, evaluatorVersion: evaluation.version } }] });
}

async function processModelSyncJob(workspaceId: string, job: EpochQueueJob): Promise<void> {
  const payload = job.payload ?? {}; const repositoryId = typeof payload.repositoryId === "string" ? payload.repositoryId : "";
  if (!repositoryId) throw new Error("epoch_huggingface_sync_missing_repository");
  const scope = { workspaceId, userId: typeof payload.userId === "string" ? payload.userId : workspaceId, orgId: typeof payload.orgId === "string" ? payload.orgId : undefined };
  const revision = typeof payload.revision === "string" ? payload.revision : undefined;
  await recordEpochHuggingFaceSyncState(scope, { repositoryId, revision, state: "RUNNING", jobId: job.id, attempts: (job.retryCount ?? 0) + 1 });
  try {
    const inspection = await inspectEpochHuggingFaceModel({ repositoryId, revision });
    const synced = await syncEpochHuggingFaceModel(scope, inspection, { downloadArtifacts: payload.downloadArtifacts === true, files: Array.isArray(payload.files) ? payload.files.filter((value): value is string => typeof value === "string") : undefined, maxBytes: typeof payload.maxBytes === "number" ? payload.maxBytes : undefined, resume: payload.resume !== false, jobId: job.id });
    await recordEpochHuggingFaceSyncState(scope, { repositoryId, revision, state: "COMPLETED", jobId: job.id, attempts: (job.retryCount ?? 0) + 1, inspection, artifacts: (synced.metadata as any)?.sync?.artifacts ?? [] });
  } catch (error) {
    await recordEpochHuggingFaceSyncState(scope, { repositoryId, revision, state: "FAILED", jobId: job.id, attempts: (job.retryCount ?? 0) + 1, error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

async function processModelBenchmarkJob(workspaceId: string, job: EpochQueueJob): Promise<void> {
  const payload = job.payload ?? {};
  const repositoryId = typeof payload.repositoryId === "string" ? payload.repositoryId : "";
  const model = typeof payload.model === "string" ? payload.model : "";
  const prompts = Array.isArray(payload.prompts) ? payload.prompts.filter((value): value is string => typeof value === "string" && value.trim().length > 0).slice(0, 100) : [];
  if (!repositoryId || !model || !prompts.length) throw new Error("epoch_model_benchmark_requires_repository_model_prompts");
  const benchmark = await runEpochLocalBenchmark({
    model,
    prompts,
    repetitions: typeof payload.repetitions === "number" ? payload.repetitions : undefined,
    warmup: typeof payload.warmup === "number" ? payload.warmup : undefined,
    maxOutputTokens: typeof payload.maxOutputTokens === "number" ? payload.maxOutputTokens : undefined,
    endpoint: typeof payload.endpoint === "string" ? payload.endpoint : undefined,
  });
  const registry = await prisma.epochCapabilityRegistry.findFirst({ where: { workspaceId, source: "huggingface", name: repositoryId }, orderBy: { updatedAt: "desc" }, select: { id: true, metadata: true } });
  if (!registry) throw new Error("HUGGINGFACE_MODEL_NOT_SYNCED");
  const metadata = registry.metadata && typeof registry.metadata === "object" ? registry.metadata as Record<string, unknown> : {};
  const maxP99Ms = typeof payload.maximumP99Ms === "number" ? payload.maximumP99Ms : 2000;
  const benchmarkPassed = benchmark.status === "completed" && benchmark.latencyMs.p99 !== null && benchmark.latencyMs.p99 <= maxP99Ms;
  const benchmarkEvidence = { version: "epoch_model_benchmark.v1", repositoryId, model, benchmark, gate: { status: benchmarkPassed ? "PASS" : "FAIL", maximumP99Ms: maxP99Ms }, jobId: job.id, recordedAt: new Date().toISOString() };
  await prisma.epochCapabilityRegistry.update({ where: { id: registry.id }, data: { metadata: { ...metadata, benchmark: benchmarkEvidence } as any } });
  await refreshEpochHuggingFaceVerificationGate({ workspaceId, userId: workspaceId }, repositoryId);
  const observation = await prisma.epochObservation.create({ data: { workspaceId, missionId: job.missionId, kind: "epoch_model_benchmark", value: JSON.parse(JSON.stringify(benchmarkEvidence)) as any, evidenceIds: [], observedAt: new Date(benchmark.completedAt) } });
  if (!benchmarkPassed) {
    const plan = planEpochDiscovery({ trigger: "verification_failure", failedStage: "benchmark", failureReason: benchmark.status !== "completed" ? "model benchmark produced failed samples" : `model p99 latency exceeded ${maxP99Ms}ms`, now: new Date() });
    await prisma.epochObservation.create({ data: { workspaceId, missionId: job.missionId, kind: "epoch_model_rediscovery", value: JSON.parse(JSON.stringify({ plan, sourceObservationId: observation.id, repositoryId })) as any, evidenceIds: [observation.id], observedAt: new Date() } });
  }
}

async function processModelQualityJob(workspaceId: string, job: EpochQueueJob): Promise<void> {
  const payload = job.payload ?? {};
  const repositoryId = typeof payload.repositoryId === "string" ? payload.repositoryId : "";
  const model = typeof payload.model === "string" ? payload.model : "";
  if (!repositoryId || !model) throw new Error("epoch_model_quality_requires_repository_and_model");
  const dataset = payload.datasetId === "epoch-local-quality-v1" ? await loadEpochQualityDataset() : null;
  const cases = dataset?.cases ?? (Array.isArray(payload.cases) ? validateEpochQualityDataset(payload.cases).slice(0, 100) : []);
  if (!cases.length) throw new Error("epoch_model_quality_requires_cases");
  const config = { ...readEpochAiProviderConfig("ollama"), ...(typeof payload.endpoint === "string" ? { endpoint: payload.endpoint } : {}) };
  const outputs: EpochQualityOutput[] = [];
  for (const testCase of cases) {
    try {
      const response = await completeEpochAi({ model, prompt: testCase.prompt, maxOutputTokens: typeof payload.maxOutputTokens === "number" ? payload.maxOutputTokens : 256 }, config);
      outputs.push({ caseId: testCase.id, output: response.output });
    } catch (error) {
      outputs.push({ caseId: testCase.id, output: "", error: error instanceof Error ? error.message : "quality_model_request_failed" });
    }
  }
  const minimumScorePct = typeof payload.minimumScorePct === "number" ? payload.minimumScorePct : 80;
  const evaluation = evaluateEpochQuality({ cases, outputs, minimumScorePct });
  const registry = await prisma.epochCapabilityRegistry.findFirst({ where: { workspaceId, source: "huggingface", name: repositoryId }, orderBy: { updatedAt: "desc" }, select: { id: true, metadata: true } });
  if (!registry) throw new Error("HUGGINGFACE_MODEL_NOT_SYNCED");
  const metadata = registry.metadata && typeof registry.metadata === "object" ? registry.metadata as Record<string, unknown> : {};
  const evidence = { version: "epoch_model_quality.v1", repositoryId, model, dataset: dataset ? { id: dataset.id, sha256: dataset.sha256 } : { id: "caller-supplied", sha256: null }, minimumScorePct, evaluation, jobId: job.id, recordedAt: new Date().toISOString() };
  await prisma.epochCapabilityRegistry.update({ where: { id: registry.id }, data: { metadata: { ...metadata, quality: evidence } as any } });
  await refreshEpochHuggingFaceVerificationGate({ workspaceId, userId: workspaceId }, repositoryId);
  const observation = await prisma.epochObservation.create({ data: { workspaceId, missionId: job.missionId, kind: "epoch_model_quality", value: JSON.parse(JSON.stringify(evidence)) as any, evidenceIds: [], observedAt: new Date() } });
  if (evaluation.status !== "PASS") {
    const plan = planEpochDiscovery({ trigger: "verification_failure", failedStage: "quality_evaluation", failureReason: `model quality score ${evaluation.weightedScorePct ?? 0}% is below ${minimumScorePct}%`, now: new Date() });
    await prisma.epochObservation.create({ data: { workspaceId, missionId: job.missionId, kind: "epoch_model_rediscovery", value: JSON.parse(JSON.stringify({ plan, sourceObservationId: observation.id, repositoryId })) as any, evidenceIds: [observation.id], observedAt: new Date() } });
  }
}

async function processRuntimeBenchmarkJob(workspaceId: string, job: EpochQueueJob): Promise<void> {
  if (!job.missionId) throw new Error("epoch_runtime_benchmark_missing_mission");
  const observations = await prisma.epochObservation.findMany({ where: { workspaceId, missionId: job.missionId, kind: "epoch_runtime_execution" }, orderBy: { observedAt: "asc" }, take: 1000 });
  const executions = observations.flatMap((observation) => { const value = observation.value && typeof observation.value === "object" ? observation.value as Record<string, unknown> : {}; return value.execution && typeof value.execution === "object" ? [value.execution as any] : []; });
  const benchmark = buildEpochRuntimeBenchmark({ executions });
  const mission = await prisma.epochMission.findFirst({ where: { id: job.missionId, workspaceId }, select: { proof: true, timeline: true } });
  if (!mission) throw new Error("epoch_mission_not_found");
  const proof = mission.proof && typeof mission.proof === "object" ? mission.proof as Record<string, unknown> : {};
  await updateEpochMission(workspaceId, job.missionId, { proof: { ...proof, runtimeBenchmark: { ...benchmark, jobId: job.id } }, timeline: [...(Array.isArray(mission.timeline) ? mission.timeline : []) as Record<string, unknown>[], workerEvent("benchmark", benchmark.status, "Runtime observations benchmarked", { samples: benchmark.samples, p99Ms: benchmark.latencyMs.p99 })] });
  await prisma.epochObservation.create({ data: { workspaceId, missionId: job.missionId, kind: "epoch_runtime_benchmark", value: JSON.parse(JSON.stringify({ ...benchmark, jobId: job.id })) as any, evidenceIds: observations.map((observation) => observation.id), observedAt: new Date(benchmark.completedAt) } });
  if (benchmark.status !== "completed" || benchmark.successRatePct < 100) {
    const plan = planEpochDiscovery({ trigger: "verification_failure", failedStage: "benchmark", failureReason: `runtime benchmark success rate ${benchmark.successRatePct}%`, now: new Date() });
    await prisma.epochObservation.create({ data: { workspaceId, missionId: job.missionId, kind: "epoch_runtime_rediscovery", value: JSON.parse(JSON.stringify({ plan, source: "runtime_benchmark", jobId: job.id })) as any, evidenceIds: observations.map((observation) => observation.id), observedAt: new Date() } });
  }
}

async function processRuntimeQualityJob(workspaceId: string, job: EpochQueueJob): Promise<void> {
  if (!job.missionId) throw new Error("epoch_runtime_quality_missing_mission");
  const payload = job.payload ?? {};
  const cases = Array.isArray(payload.cases) ? payload.cases as EpochQualityCase[] : [];
  if (!cases.length) throw new Error("epoch_runtime_quality_requires_cases");
  const observations = await prisma.epochObservation.findMany({ where: { workspaceId, missionId: job.missionId, kind: "epoch_runtime_execution" }, orderBy: { observedAt: "asc" }, take: 1000 });
  const outputs = observations.flatMap((observation) => { const value = observation.value && typeof observation.value === "object" ? observation.value as Record<string, any> : {}; const execution = value.execution; const caseId = typeof value.caseId === "string" ? value.caseId : null; const output = execution && typeof execution === "object" && typeof execution.output === "string" ? execution.output : null; return caseId && output !== null ? [{ caseId, output }] : []; });
  const evaluation = evaluateEpochRuntimeQuality({ cases, outputs, minimumScorePct: typeof payload.minimumScorePct === "number" ? payload.minimumScorePct : 80 });
  const mission = await prisma.epochMission.findFirst({ where: { id: job.missionId, workspaceId }, select: { proof: true, timeline: true } });
  if (!mission) throw new Error("epoch_mission_not_found");
  const proof = mission.proof && typeof mission.proof === "object" ? mission.proof as Record<string, unknown> : {};
  const evidence = { version: "epoch_runtime_quality.v1", evaluation, jobId: job.id, sourceObservationIds: observations.map((observation) => observation.id), recordedAt: new Date().toISOString() };
  await updateEpochMission(workspaceId, job.missionId, { proof: { ...proof, runtimeQuality: evidence }, timeline: [...(Array.isArray(mission.timeline) ? mission.timeline : []) as Record<string, unknown>[], workerEvent("quality_evaluation", evaluation.status, "Runtime outputs quality-evaluated", { scorePct: evaluation.weightedScorePct })] });
  await prisma.epochObservation.create({ data: { workspaceId, missionId: job.missionId, kind: "epoch_runtime_quality", value: JSON.parse(JSON.stringify(evidence)) as any, evidenceIds: observations.map((observation) => observation.id), observedAt: new Date(evidence.recordedAt) } });
  if (evaluation.status !== "PASS") {
    const plan = planEpochDiscovery({ trigger: "verification_failure", failedStage: "quality_evaluation", failureReason: `runtime quality score ${evaluation.weightedScorePct ?? 0}%`, now: new Date() });
    await prisma.epochObservation.create({ data: { workspaceId, missionId: job.missionId, kind: "epoch_runtime_rediscovery", value: JSON.parse(JSON.stringify({ plan, source: "runtime_quality", jobId: job.id })) as any, evidenceIds: observations.map((observation) => observation.id), observedAt: new Date() } });
  }
}

async function processPipelineJob(workspaceId: string, job: EpochQueueJob): Promise<void> {
  if (!job.missionId) throw new Error("epoch_pipeline_job_missing_mission");
  const execution = await processEpochPipelineJob({ workspaceId, missionId: job.missionId, job });
  if (execution.status !== "completed") throw new Error(`epoch_pipeline_${execution.status}`);
}

function workerLeaseMs(): number {
  const raw = Number(process.env.EPOCH_WORKER_LEASE_MS);
  return Number.isFinite(raw) && raw >= 5_000 ? Math.floor(raw) : 60_000;
}

function workerHeartbeatMs(leaseMs: number): number {
  const raw = Number(process.env.EPOCH_WORKER_HEARTBEAT_MS);
  return Number.isFinite(raw) && raw >= 1_000 ? Math.min(Math.floor(raw), Math.max(1_000, Math.floor(leaseMs / 2))) : Math.max(1_000, Math.floor(leaseMs / 2));
}

async function processRealityProjectionJob(workspaceId: string, job: EpochQueueJob): Promise<void> {
  const result = await projectEpochObservationsToReality({ workspaceId, missionId: job.missionId, limit: typeof job.payload?.limit === "number" ? job.payload.limit : 100 });
  if (result.checked > 0 && result.projected === 0 && result.skipped < result.checked) throw new Error("epoch_reality_projection_no_progress");
}

async function processRealityMaintenanceJob(workspaceId: string, job: EpochQueueJob): Promise<void> {
  const result = await runEpochRealityMaintenanceTick({ workspaceId, staleAfterMs: typeof job.payload?.staleAfterMs === "number" ? job.payload.staleAfterMs : undefined, limit: typeof job.payload?.limit === "number" ? job.payload.limit : undefined });
  if (result.refreshRequests.length) {
    await enqueueEpochJob({ workspaceId, missionId: job.missionId, type: "reality_rediscovery", payload: { refreshRequests: result.refreshRequests, maintenanceCheckedAt: result.checkedAt } });
  }
}

async function processRealityRediscoveryJob(workspaceId: string, job: EpochQueueJob): Promise<void> {
  const requests = Array.isArray(job.payload?.refreshRequests) ? job.payload.refreshRequests : [];
  const plan = planEpochDiscovery({ trigger: "drift", failedStage: "current_reality", failureReason: requests.length ? `${requests.length} reality facts require refresh` : "reality refresh requested", now: new Date() });
  await prisma.epochObservation.create({ data: { workspaceId, missionId: job.missionId, kind: "epoch_reality_rediscovery", value: JSON.parse(JSON.stringify({ plan, refreshRequests: requests, jobId: job.id })) as any, evidenceIds: [], observedAt: new Date() } });
}

async function processJob(workspaceId: string, job: EpochQueueJob): Promise<void> {
  const gate = job.missionId ? await getEpochAuthorityGate(workspaceId, job.missionId) : null;
  if (gate?.mission && isEpochMissionCancelled(gate.mission.proof)) {
    await failEpochJob(job.id, "epoch_mission_cancelled", gate.mission.userId, gate.mission.orgId ?? undefined);
    return;
  }
  if (gate?.mission && gate.mission.state !== "completed" && gate.mission.state !== "failed") {
    const proof = gate.mission.proof && typeof gate.mission.proof === "object" ? gate.mission.proof as Record<string, unknown> : {};
    const result = gate.mission.result && typeof gate.mission.result === "object" ? gate.mission.result as Record<string, unknown> : {};
    const spentCents = [proof.spentCents, result.spentCents, result.costCents].find((value): value is number => typeof value === "number" && Number.isFinite(value)) ?? 0;
    const limits = evaluateEpochMissionLimits({
      budgetCents: gate.mission.budgetCents,
      spentCents,
      deadlineAt: gate.mission.deadlineAt,
    });
    if (!limits.allowed) {
      await updateEpochMission(workspaceId, gate.mission.id, {
        state: "failed",
        currentStep: "runtime_limits",
        completedAt: new Date(),
        result: { ...result, failure: limits.reason, spentCents, budgetCents: gate.mission.budgetCents },
        proof: { ...proof, failure: limits.reason, limitsEnforcedAt: new Date().toISOString() },
        timeline: [
          ...((Array.isArray(gate.mission.timeline) ? gate.mission.timeline : []) as Record<string, unknown>[]),
          workerEvent("recovery", "blocked", `Mission stopped: ${limits.reason}`, { spentCents, budgetCents: gate.mission.budgetCents }),
        ],
      });
      throw new Error(limits.reason);
    }
  }
  if (gate?.blocked && job.type !== "memory") {
    await deadLetterEpochJob(job.id, gate.reason, {
      userId: gate.mission.userId,
      orgId: gate.mission.orgId ?? undefined,
    });
    return;
  }

  if (job.type === "execute" && gate?.needsApproval && job.payload?.humanApproval !== "approved") {
    await deferEpochJob(job.id, "human_approval_required", {
      userId: gate.mission.userId,
      orgId: gate.mission.orgId ?? undefined,
      delayMs: 5_000,
    });
    return;
  }

  switch (job.type as EpochQueueJobType) {
    case "plan":
      await processPlanJob(workspaceId, job);
      break;
    case "execute":
      await processExecuteJob(workspaceId, job);
      break;
    case "review":
      await processReviewJob(workspaceId, job);
      break;
    case "verify":
      await processVerifyJob(workspaceId, job);
      break;
    case "certificate":
      await processCertificateJob(workspaceId, job);
      break;
    case "memory":
      await processMemoryJob(workspaceId, job);
      break;
    case "benchmark":
      await processBenchmarkJob(workspaceId, job);
      break;
    case "quality":
      await processQualityJob(workspaceId, job);
      break;
    case "pipeline":
      await processPipelineJob(workspaceId, job);
      break;
    case "model_sync":
      await processModelSyncJob(workspaceId, job);
      break;
    case "model_benchmark":
      await processModelBenchmarkJob(workspaceId, job);
      break;
    case "model_quality":
      await processModelQualityJob(workspaceId, job);
      break;
    case "runtime_benchmark":
      await processRuntimeBenchmarkJob(workspaceId, job);
      break;
    case "runtime_quality":
      await processRuntimeQualityJob(workspaceId, job);
      break;
    case "reality_projection":
      await processRealityProjectionJob(workspaceId, job);
      break;
    case "reality_maintenance":
      await processRealityMaintenanceJob(workspaceId, job);
      break;
    case "reality_rediscovery":
      await processRealityRediscoveryJob(workspaceId, job);
      break;
    default:
      break;
  }

}

export async function runEpochWorkerTick(): Promise<{ processed: number; leased: number }> {
  if (workerBusy) return { processed: 0, leased: 0 };
  workerBusy = true;
  let processed = 0;
  let leasedTotal = 0;
  try {
    if (Date.now() - lastEvidenceExpiryAt >= evidenceExpiryIntervalMs()) {
      lastEvidenceExpiryAt = Date.now();
      await runEpochEvidenceExpiryTick().catch((error) => console.error("[epoch] evidence expiry tick failed", error));
    }
    const workspaces = await prisma.workspace.findMany({ select: { id: true, userId: true, orgId: true } });
    for (const workspace of workspaces) {
      await recoverExpiredEpochWorkerLeases(workspace.id).catch((error) => console.error("[epoch] expired worker lease recovery failed", error));
      const processWorker = await ensureEpochProcessWorker({
        workspaceId: workspace.id,
        userId: workspace.userId,
        orgId: workspace.orgId ?? undefined,
        processId: WORKER_ID,
        maxConcurrency: workerBatchSize(),
        capabilities: ["mission", "pipeline", "benchmark", "quality", "model_sync", "reality"],
      });
      let cycles = 0;
      while (cycles < 10) {
        cycles += 1;
        const jobs = await leaseEpochJobs({
          workspaceId: workspace.id,
          userId: workspaceUserId(workspace),
          orgId: workspace.orgId ?? undefined,
          workerId: WORKER_ID,
          limit: workerBatchSize(),
        });
        leasedTotal += jobs.length;
        if (jobs.length === 0) break;
        for (const job of jobs) {
          const durableLease = await claimEpochWorkerLease({
            workspaceId: workspace.id,
            workerId: processWorker.id,
            jobId: job.id,
            leaseMs: workerLeaseMs(),
          });
          if (!durableLease) {
            await releaseEpochJobLease(job.id, "worker_durable_lease_unavailable");
            continue;
          }
          const leaseMs = workerLeaseMs();
          const sqs = epochSqsConfigFromEnv();
          const heartbeat = setInterval(() => {
            void Promise.all([
              renewEpochWorkerLease({ workspaceId: workspace.id, workerId: processWorker.id, jobId: job.id, fencingToken: durableLease.fencingToken, leaseMs }),
              sqs ? renewEpochSqsLease(job.id, sqs).catch(() => false) : Promise.resolve(true),
            ]).catch(() => undefined);
          }, workerHeartbeatMs(leaseMs));
          try {
            await persistEpochWorkerCheckpoint({ workspaceId: workspace.id, workerId: processWorker.id, jobId: job.id, fencingToken: durableLease.fencingToken, stage: "worker", status: "started", userId: workspace.userId, orgId: workspace.orgId ?? undefined });
            await processJob(workspace.id, job);
            await persistEpochWorkerCheckpoint({ workspaceId: workspace.id, workerId: processWorker.id, jobId: job.id, fencingToken: durableLease.fencingToken, stage: "worker", status: "completed", progress: 1, userId: workspace.userId, orgId: workspace.orgId ?? undefined });
            await acknowledgeEpochJob(job.id, workspace.userId, workspace.orgId ?? undefined);
            await releaseEpochWorkerLease({ workspaceId: workspace.id, workerId: processWorker.id, jobId: job.id, fencingToken: durableLease.fencingToken, status: "completed" });
            processed += 1;
          } catch (error) {
            const message = error instanceof Error ? error.message : "epoch_worker_failed";
            const recovery = decideEpochRecovery({
              error: message,
              attempt: job.retryCount ?? 0,
              policy: { maxAttempts: job.maxRetries ?? 3 },
            });
            const retried = recovery.retryable
              ? await retryEpochJob(job.id, `${recovery.kind}:${message}`, {
                  userId: workspace.userId,
                  orgId: workspace.orgId ?? undefined,
                  payloadPatch: {
                    recoveryAction: recovery.action,
                    recoveryKind: recovery.kind,
                    recoveryReason: recovery.reason,
                  },
                })
              : null;
            if (!retried || !recovery.retryable) {
              await deadLetterEpochJob(job.id, message, {
                userId: workspace.userId,
                orgId: workspace.orgId ?? undefined,
              });
            }
            await persistEpochWorkerCheckpoint({ workspaceId: workspace.id, workerId: processWorker.id, jobId: job.id, fencingToken: durableLease.fencingToken, stage: "worker", status: retried ? "retrying" : "failed", data: { error: message, recovery: recovery.action }, userId: workspace.userId, orgId: workspace.orgId ?? undefined }).catch(() => undefined);
            await releaseEpochWorkerLease({ workspaceId: workspace.id, workerId: processWorker.id, jobId: job.id, fencingToken: durableLease.fencingToken, status: retried ? "released" : "failed" }).catch(() => false);
            await recordWorkerRecovery({
              workspaceId: workspace.id,
              job,
              error: message,
              recovery,
              terminal: !retried || !recovery.retryable,
              userId: workspace.userId,
              orgId: workspace.orgId ?? undefined,
            });
            emitEpochRuntimeEvent({
              userId: workspace.userId,
              orgId: workspace.orgId ?? undefined,
              workspaceId: workspace.id,
              kind: "epoch.queue.failed",
              label: "Epoch worker failed a job",
              subjectId: job.id,
              payload: {
                jobId: job.id,
                error: message,
                recoveryAction: recovery.action,
                recoveryKind: recovery.kind,
                recoveryReason: recovery.reason,
              },
            });
          } finally {
            clearInterval(heartbeat);
          }
        }
      }
    }
    await runEpochWebhookDeliveryTick();
  } finally {
    workerBusy = false;
  }
  return { processed, leased: leasedTotal };
}

export function startEpochWorker(): void {
  if (workerTimer || !workerEnabled()) return;
  workerTimer = setInterval(() => {
    void runEpochWorkerTick();
  }, workerIntervalMs());
  workerTimer.unref?.();
  void runEpochWorkerTick();
}

export function stopEpochWorkerForTests(): void {
  if (workerTimer) clearInterval(workerTimer);
  workerTimer = null;
  workerBusy = false;
  lastEvidenceExpiryAt = 0;
}
