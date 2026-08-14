import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { buildApiMeta, sendApiError, sendApiSuccess } from "./api-response";
import {
  compileGitHubPullRequest,
  InMemoryCompilationStore,
  parseGitHubPayload,
  SUPPORTED_PULL_REQUEST_ACTIONS,
  verifyGitHubSignature,
} from "../../lib/realityCompiler/githubIntake";
import { ingestGitHubCompilation } from "../../lib/reality/ingestion/realityIngestion";
import { verificationStore, verifyPullRequest } from "../../lib/realityCompiler/verificationService";
import { REALITY_EXCHANGE_PLAN } from "../../shared/realityExchangePlan";

export const realityCompilerStore = new InMemoryCompilationStore();
const router = Router();

type MvpVerificationResult = {
  verdict: "PASS" | "FAIL" | "UNKNOWN";
  confidence: number;
  evidenceReport: {
    summary: string;
    findings: string[];
  };
  risks: string[];
  recommendedAction: string;
  timeline: Array<{
    id: string;
    label: string;
    detail: string;
    status: "complete" | "active" | "pending";
  }>;
};

type MvpMissionSummary = {
  id: string;
  repository: string;
  owner: string;
  repo: string;
  pullRequestNumber: number;
  pullRequestTitle: string;
  verdict: "PASS" | "FAIL" | "UNKNOWN";
  confidence: number;
  status: "complete" | "blocked" | "unknown";
  riskCount: number;
  evidenceSummary: string;
  recommendedAction: string;
  createdAt: string;
  updatedAt: string;
};

function parseRawJsonBody(body: unknown): Record<string, unknown> | null {
  try {
    if (Buffer.isBuffer(body)) {
      const parsed = JSON.parse(body.toString("utf8")) as unknown;
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;
    }
    if (typeof body === "string") {
      const parsed = JSON.parse(body) as unknown;
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;
    }
    if (body && typeof body === "object" && !Array.isArray(body)) {
      return body as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

function toMvpVerificationResult(record: Awaited<ReturnType<typeof verifyPullRequest>>["record"]): MvpVerificationResult {
  return {
    verdict: record.verdict,
    confidence: record.confidence,
    evidenceReport: {
      summary: record.evidenceReport.summary,
      findings: record.evidenceReport.findings,
    },
    risks: record.risks,
    recommendedAction: record.recommendedAction,
    timeline: record.timeline,
  };
}

function toMvpMissionSummary(record: Awaited<ReturnType<typeof verifyPullRequest>>["record"]): MvpMissionSummary {
  const [owner = "", repo = ""] = record.repository.split("/");
  return {
    id: record.id,
    repository: record.repository,
    owner,
    repo,
    pullRequestNumber: record.pullRequestNumber,
    pullRequestTitle: record.pullRequestTitle,
    verdict: record.verdict,
    confidence: record.confidence,
    status:
      record.verdict === "PASS"
        ? "complete"
        : record.verdict === "FAIL"
          ? "blocked"
          : "unknown",
    riskCount: record.risks.length,
    evidenceSummary: record.evidenceReport.summary,
    recommendedAction: record.recommendedAction,
    createdAt: record.createdAt,
    updatedAt: record.createdAt,
  };
}

async function handleVerificationRequest(
  req: Request,
  res: Response,
  startedAt: number,
  opts?: { minimal?: boolean },
): Promise<void> {
  const body = parseRawJsonBody(req.body);
  const owner = typeof body?.owner === "string" ? body.owner.trim() : "";
  const repo = typeof body?.repo === "string" ? body.repo.trim() : "";
  const pullRequestNumberRaw = body?.pullRequestNumber ?? body?.number;
  const pullRequestNumber = Number(pullRequestNumberRaw);
  const fileLimitRaw = body?.fileLimit;
  const fileLimit = Number(fileLimitRaw);

  if (!owner || !repo || !Number.isFinite(pullRequestNumber)) {
    sendApiError(
      res,
      400,
      {
        code: "BAD_REQUEST",
        message: "owner, repo, and pullRequestNumber are required",
      },
      buildApiMeta(req, startedAt),
    );
    return;
  }

  try {
    const result = await verifyPullRequest({
      userId: req.authUserId,
      orgId: req.authOrgId,
      owner,
      repo,
      pullRequestNumber,
      fileLimit: Number.isFinite(fileLimit) ? fileLimit : undefined,
    });

    const payload = {
      duplicate: result.duplicate,
      verification: result.record,
      result: toMvpVerificationResult(result.record),
    };

    sendApiSuccess(
      res,
      result.duplicate ? 200 : 201,
      opts?.minimal
        ? {
            duplicate: payload.duplicate,
            result: payload.result,
          }
        : payload,
      buildApiMeta(req, startedAt),
    );
  } catch (error) {
    sendApiError(
      res,
      400,
      {
        code: "VERIFICATION_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Could not verify pull request.",
      },
      buildApiMeta(req, startedAt),
    );
  }
}

router.get("/status", async (_req: Request, res: Response): Promise<void> => {
  const records = await realityCompilerStore.list();
  const decisions = records.reduce<Record<string, number>>((summary, record) => {
    const decision = record.decision.decision;
    summary[decision] = (summary[decision] ?? 0) + 1;
    return summary;
  }, {});
  const latest = records.at(-1);
  res.json({
    ok: true,
    data: {
      compilerVersion: "reality-compiler.v1",
      plan: REALITY_EXCHANGE_PLAN,
      totalCompilations: records.length,
      decisions,
      latest: latest ? {
        id: latest.id,
        repository: latest.repository,
        pullRequest: latest.pullRequest,
        decision: latest.decision.decision,
        riskLevel: latest.decision.riskLevel,
        createdAt: latest.createdAt,
      } : null,
    },
  });
});

router.get(
  "/verifications",
  requireAuth,
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const records = await verificationStore.list(req.authUserId, req.authOrgId);
    sendApiSuccess(
      res,
      200,
      {
        verifications: records,
      },
      buildApiMeta(req, startedAt),
    );
  }),
);

router.get(
  "/missions",
  requireAuth,
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const records = await verificationStore.list(req.authUserId, req.authOrgId);
    sendApiSuccess(
      res,
      200,
      {
        missions: records.map(toMvpMissionSummary),
      },
      buildApiMeta(req, startedAt),
    );
  }),
);

router.get(
  "/history",
  requireAuth,
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const records = await verificationStore.list(req.authUserId, req.authOrgId);
    sendApiSuccess(
      res,
      200,
      {
        history: records.map(toMvpMissionSummary),
      },
      buildApiMeta(req, startedAt),
    );
  }),
);

router.get(
  "/verifications/:verificationId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const startedAt = Date.now();
    const verificationId = typeof req.params.verificationId === "string" ? req.params.verificationId : "";
    if (!verificationId) {
      sendApiError(
        res,
        400,
        { code: "BAD_REQUEST", message: "verificationId is required" },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    const record = await verificationStore.findById(verificationId);
    if (
      !record ||
      record.userId !== req.authUserId ||
      (record.orgId ?? null) !== (req.authOrgId ?? null)
    ) {
      sendApiError(
        res,
        404,
        { code: "VERIFICATION_NOT_FOUND", message: "Verification not found." },
        buildApiMeta(req, startedAt),
      );
      return;
    }
    sendApiSuccess(
      res,
      200,
      { verification: record },
      buildApiMeta(req, startedAt),
    );
  }),
);

router.post(
  "/verify",
  requireAuth,
  asyncHandler(async (req, res): Promise<void> => {
    await handleVerificationRequest(req, res, Date.now());
  }),
);

router.post(
  "/mvp/verify",
  requireAuth,
  asyncHandler(async (req, res): Promise<void> => {
    await handleVerificationRequest(req, res, Date.now(), { minimal: true });
  }),
);

router.post("/github/webhook", async (req: Request, res: Response): Promise<void> => {
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body ?? {}));
  const secret = process.env.REALITY_COMPILER_GITHUB_WEBHOOK_SECRET ?? process.env.GITHUB_WEBHOOK_SECRET ?? "";
  if (!verifyGitHubSignature(rawBody, req.header("x-hub-signature-256"), secret)) {
    res.status(401).json({ ok: false, error: "Invalid GitHub webhook signature" });
    return;
  }
  const event = req.header("x-github-event") ?? "";
  if (event !== "pull_request") {
    res.status(202).json({ ok: true, ignored: true, reason: "unsupported_event" });
    return;
  }
  try {
    const payload = parseGitHubPayload(req.body);
    const action = payload.action ?? "";
    if (!SUPPORTED_PULL_REQUEST_ACTIONS.has(action)) {
      res.status(202).json({ ok: true, ignored: true, reason: "unsupported_action", action });
      return;
    }
    const result = await compileGitHubPullRequest({
      eventId: req.header("x-github-delivery") ?? `${event}:${action}:${Date.now()}`,
      action,
      payload,
      files: [],
      store: realityCompilerStore,
    });
    try {
      ingestGitHubCompilation({
        userId: "system",
        record: {
          repository: result.record.repository,
          pullRequest: result.record.pullRequest,
          action: result.record.action,
          headSha: result.record.headSha,
          baseSha: result.record.baseSha,
          url: result.record.url,
          decision: {
            decision: result.record.decision.decision,
            riskLevel: result.record.decision.riskLevel,
          },
        },
      });
    } catch (error) {
      console.warn("[RealityCompiler] Reality ingestion bridge failed:", error);
    }
    res.status(result.duplicate ? 200 : 201).json({
      ok: true,
      duplicate: result.duplicate,
      compilation: {
        id: result.record.id,
        repository: result.record.repository,
        pullRequest: result.record.pullRequest,
        headSha: result.record.headSha,
        decision: result.record.decision.decision,
        riskLevel: result.record.decision.riskLevel,
      },
    });
  } catch (error) {
    res.status(400).json({ ok: false, error: error instanceof Error ? error.message : "Invalid GitHub webhook" });
  }
});

export { router as realityCompilerRouter };
