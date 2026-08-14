import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { createReadStream } from "node:fs";
import { mkdir, rm, rename, stat } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { prisma } from "../storage/prismaClient";
import type { EpochHuggingFaceInspection } from "./huggingFace";
import { validateEpochHuggingFaceArtifacts, type EpochModelArtifactValidation } from "./modelArtifactValidation";
import { applyEpochHuggingFaceApproval, scanEpochHuggingFaceFiles, type EpochHuggingFaceApproval } from "./huggingFaceGovernance";
import { evaluateEpochModelVerificationGate, type EpochModelVerificationGate } from "./modelVerificationGate";

type Scope = { workspaceId: string; userId: string; orgId?: string };
export type EpochHuggingFaceSyncState = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";

export type EpochHuggingFaceArtifact = { path: string; localPath: string; size: number; sha256: string };
export type EpochHuggingFaceSyncOptions = { maxAttempts?: number; downloadArtifacts?: boolean; files?: string[]; maxBytes?: number; fetchImpl?: typeof fetch; token?: string; resume?: boolean; jobId?: string };

function safeArtifactPath(root: string, candidate: string): string {
  const absoluteRoot = resolve(root);
  const target = resolve(absoluteRoot, candidate);
  const relativeTarget = relative(absoluteRoot, target);
  if (!relativeTarget || relativeTarget === ".." || relativeTarget.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) || resolve(absoluteRoot) === target) throw new Error("HUGGINGFACE_ARTIFACT_PATH_UNSAFE");
  return target;
}

async function sha256File(path: string): Promise<{ size: number; sha256: string }> {
  const hash = createHash("sha256");
  let size = 0;
  for await (const chunk of createReadStream(path)) { const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk); size += buffer.length; hash.update(buffer); }
  return { size, sha256: hash.digest("hex") };
}

export async function downloadEpochHuggingFaceArtifacts(inspection: EpochHuggingFaceInspection, options: Pick<EpochHuggingFaceSyncOptions, "files" | "maxBytes" | "fetchImpl" | "token" | "resume"> = {}): Promise<EpochHuggingFaceArtifact[]> {
  if (inspection.governance.status !== "ELIGIBLE" || !inspection.commitSha) throw new Error("HUGGINGFACE_ARTIFACT_DOWNLOAD_BLOCKED_BY_GOVERNANCE");
  const selected = options.files?.length ? inspection.files.filter((file) => options.files!.includes(file.path)) : inspection.files;
  if (!selected.length) throw new Error("HUGGINGFACE_NO_ARTIFACTS_SELECTED");
  const maxBytes = Math.max(1, options.maxBytes ?? Number(process.env.EPOCH_HF_MAX_ARTIFACT_BYTES ?? 50 * 1024 * 1024 * 1024));
  const root = resolve(process.env.EPOCH_HF_CACHE_DIR ?? join(process.cwd(), ".epoch-cache", "huggingface"), inspection.repositoryId.replace(/[^A-Za-z0-9._-]+/g, "__"), inspection.commitSha);
  const results: EpochHuggingFaceArtifact[] = [];
  let totalBytes = 0;
  for (const file of selected) {
    const localPath = safeArtifactPath(root, file.path);
    const partialPath = `${localPath}.part`;
    const expectedSize = file.size ?? null;
    await mkdir(resolve(localPath, ".."), { recursive: true });

    // A completed, verified artifact is immutable because the cache is keyed by commit.
    // Re-hash it instead of downloading it again after a process restart.
    try {
      const existing = await sha256File(localPath);
      if ((expectedSize === null || existing.size === expectedSize) && (!file.sha256 || file.sha256 === existing.sha256)) {
        if (totalBytes + existing.size > maxBytes) throw new Error("HUGGINGFACE_ARTIFACT_SIZE_LIMIT_EXCEEDED");
        totalBytes += existing.size;
        results.push({ path: file.path, localPath, size: existing.size, sha256: existing.sha256 });
        continue;
      }
      await rm(localPath, { force: true });
    } catch (error) {
      if (error instanceof Error && error.message === "HUGGINGFACE_ARTIFACT_SIZE_LIMIT_EXCEEDED") throw error;
    }
    let partialSize = 0;
    if (options.resume !== false) {
      try { partialSize = (await stat(partialPath)).size; } catch { partialSize = 0; }
      if (expectedSize !== null && partialSize >= expectedSize) partialSize = 0;
    }
    if (expectedSize !== null && totalBytes + expectedSize > maxBytes) throw new Error("HUGGINGFACE_ARTIFACT_SIZE_LIMIT_EXCEEDED");
    const encodedPath = file.path.split("/").map((part) => encodeURIComponent(part)).join("/");
    const url = `https://huggingface.co/${inspection.repositoryId.split("/").map((part) => encodeURIComponent(part)).join("/")}/resolve/${encodeURIComponent(inspection.commitSha)}/${encodedPath}?download=true`;
    const headers: Record<string, string> = { accept: "application/octet-stream", ...(options.token || process.env.HF_TOKEN ? { authorization: `Bearer ${options.token ?? process.env.HF_TOKEN}` } : {}) };
    if (partialSize > 0) headers.range = `bytes=${partialSize}-`;
    let response = await (options.fetchImpl ?? fetch)(url, { headers });
    if (partialSize > 0 && response.status !== 206) { await rm(partialPath, { force: true }); partialSize = 0; delete headers.range; response = await (options.fetchImpl ?? fetch)(url, { headers }); }
    if (!response.ok || !response.body) throw new Error(`HUGGINGFACE_ARTIFACT_DOWNLOAD_HTTP_${response.status}`);
    const hash = createHash("sha256"); let size = partialSize;
    if (partialSize > 0) {
      const existing = createReadStream(partialPath);
      for await (const chunk of existing) hash.update(chunk as Buffer);
    }
    const bytesBeforeFile = totalBytes;
    const digest = new Transform({ transform(chunk, _encoding, callback) { const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk); size += buffer.length; if (bytesBeforeFile + size > maxBytes) { callback(new Error("HUGGINGFACE_ARTIFACT_SIZE_LIMIT_EXCEEDED")); return; } hash.update(buffer); callback(null, buffer); } });
    if (totalBytes + partialSize > maxBytes) throw new Error("HUGGINGFACE_ARTIFACT_SIZE_LIMIT_EXCEEDED");
    try { await pipeline(Readable.fromWeb(response.body as any), digest, createWriteStream(partialPath, { flags: partialSize > 0 ? "a" : "w" })); await rename(partialPath, localPath); }
    catch (error) { throw error; }
    const sha256 = hash.digest("hex");
    if (expectedSize !== null && size !== expectedSize) { await rm(localPath, { force: true }); await rm(partialPath, { force: true }); throw new Error(`HUGGINGFACE_ARTIFACT_SIZE_MISMATCH:${file.path}:${size}:${expectedSize}`); }
    totalBytes += size;
    if (file.sha256 && file.sha256 !== sha256) { await rm(localPath, { force: true }); await rm(partialPath, { force: true }); throw new Error(`HUGGINGFACE_ARTIFACT_CHECKSUM_MISMATCH:${file.path}`); }
    results.push({ path: file.path, localPath, size, sha256 });
  }
  return results;
}

export async function syncEpochHuggingFaceModel(scope: Scope, inspection: EpochHuggingFaceInspection, options: EpochHuggingFaceSyncOptions = {}) {
  const prior = await prisma.epochCapabilityRegistry.findFirst({ where: { workspaceId: scope.workspaceId, source: "huggingface", name: inspection.repositoryId }, orderBy: { updatedAt: "desc" }, select: { metadata: true } });
  const metadata = prior?.metadata && typeof prior.metadata === "object" ? prior.metadata as Record<string, unknown> : {};
  const approval = metadata.approval && typeof metadata.approval === "object" ? metadata.approval as EpochHuggingFaceApproval : null;
  const scan = scanEpochHuggingFaceFiles({ files: inspection.files });
  if (approval && approval.securityScanSha256 === scan.scanSha256) inspection = applyEpochHuggingFaceApproval({ inspection, approval, scan });
  const maxAttempts = Math.max(1, Math.min(5, Math.floor(options.maxAttempts ?? 3)));
  const jobId = options.jobId;
  const persistState = async (state: EpochHuggingFaceSyncState, attempts: number, error?: unknown, artifacts?: EpochHuggingFaceArtifact[], retryAt?: string) => {
    try { await recordEpochHuggingFaceSyncState(scope, { repositoryId: inspection.repositoryId, revision: inspection.revision, state, jobId, attempts, inspection, error: error instanceof Error ? error.message : typeof error === "string" ? error : undefined, artifacts, retryAt }); }
    catch (stateError) { if (state === "FAILED") throw stateError; }
  };
  await persistState("QUEUED", 0);
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    await persistState("RUNNING", attempt);
    try {
      const artifacts = options.downloadArtifacts ? await downloadEpochHuggingFaceArtifacts(inspection, options) : [];
      const validation = artifacts.length ? await validateEpochHuggingFaceArtifacts({ inspection, artifacts }) : null;
      if (validation?.status === "FAIL") throw new Error(`HUGGINGFACE_ARTIFACT_VALIDATION_FAILED:${validation.reasons.join(",")}`);
      const synced = await persistSyncedEpochHuggingFaceModel(scope, inspection, attempt, artifacts, validation);
      await persistState("COMPLETED", attempt, undefined, artifacts);
      return synced;
    }
    catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        const retryAt = new Date(Date.now() + Math.min(10_000, 250 * (2 ** (attempt - 1)))).toISOString();
        await persistState("QUEUED", attempt, error, undefined, retryAt);
        await new Promise((resolve) => setTimeout(resolve, Math.min(1000, 100 * (2 ** (attempt - 1)))));
      } else await persistState("FAILED", attempt, error);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Hugging Face sync failed");
}

export async function recordEpochHuggingFaceApproval(scope: Scope, input: { repositoryId: string; approval: EpochHuggingFaceApproval; scan: ReturnType<typeof scanEpochHuggingFaceFiles> }) {
  const existing = await prisma.epochCapabilityRegistry.findFirst({ where: { workspaceId: scope.workspaceId, source: "huggingface", name: input.repositoryId }, orderBy: { updatedAt: "desc" }, select: { id: true, metadata: true } });
  if (!existing) throw new Error("HUGGINGFACE_MODEL_NOT_SYNCED");
  const metadata = existing.metadata && typeof existing.metadata === "object" ? existing.metadata as Record<string, unknown> : {};
  const approvalHistory = Array.isArray(metadata.approvalHistory) ? metadata.approvalHistory : [];
  return prisma.epochCapabilityRegistry.update({ where: { id: existing.id }, data: { metadata: { ...metadata, approval: input.approval, securityScan: input.scan, approvalHistory: [...approvalHistory, { ...input.approval, recordedAt: new Date().toISOString() }], securityScanHistory: [...(Array.isArray(metadata.securityScanHistory) ? metadata.securityScanHistory : []), input.scan] } as any } });
}

export async function recordEpochHuggingFaceVerification(scope: Scope, input: { repositoryId: string; gate: Record<string, unknown>; verification: Record<string, unknown> }) {
  const existing = await prisma.epochCapabilityRegistry.findFirst({ where: { workspaceId: scope.workspaceId, source: "huggingface", name: input.repositoryId }, orderBy: { updatedAt: "desc" }, select: { id: true, metadata: true } });
  if (!existing) throw new Error("HUGGINGFACE_MODEL_NOT_SYNCED");
  const metadata = existing.metadata && typeof existing.metadata === "object" ? existing.metadata as Record<string, unknown> : {};
  const eligible = input.gate.eligible === true;
  return prisma.epochCapabilityRegistry.update({ where: { id: existing.id }, data: { status: eligible ? "active" : "unknown", metadata: { ...metadata, verification: input.verification, verificationGate: input.gate, verifiedAt: new Date().toISOString() } as any } });
}

export async function recordEpochHuggingFaceRuntimeLoad(scope: Scope, input: { repositoryId: string; verification: Record<string, unknown> }) {
  const existing = await prisma.epochCapabilityRegistry.findFirst({ where: { workspaceId: scope.workspaceId, source: "huggingface", name: input.repositoryId }, orderBy: { updatedAt: "desc" }, select: { id: true, metadata: true } });
  if (!existing) throw new Error("HUGGINGFACE_MODEL_NOT_SYNCED");
  const metadata = existing.metadata && typeof existing.metadata === "object" ? existing.metadata as Record<string, unknown> : {};
  return prisma.epochCapabilityRegistry.update({ where: { id: existing.id }, data: { metadata: { ...metadata, runtimeLoad: input.verification, runtimeLoadVerifiedAt: new Date().toISOString() } as any } });
}

export async function refreshEpochHuggingFaceVerificationGate(scope: Scope, repositoryId: string): Promise<EpochModelVerificationGate> {
  const existing = await prisma.epochCapabilityRegistry.findFirst({ where: { workspaceId: scope.workspaceId, source: "huggingface", name: repositoryId }, orderBy: { updatedAt: "desc" }, select: { id: true, metadata: true } });
  if (!existing) throw new Error("HUGGINGFACE_MODEL_NOT_SYNCED");
  const metadata = existing.metadata && typeof existing.metadata === "object" ? existing.metadata as Record<string, unknown> : {};
  const runtimeLoad = metadata.runtimeLoad && typeof metadata.runtimeLoad === "object" ? metadata.runtimeLoad as Record<string, unknown> : {};
  const qualityEvidence = metadata.quality && typeof metadata.quality === "object" ? metadata.quality as Record<string, unknown> : {};
  const quality = qualityEvidence.evaluation && typeof qualityEvidence.evaluation === "object" ? qualityEvidence.evaluation as Record<string, unknown> : {};
  const benchmarkEvidence = metadata.benchmark && typeof metadata.benchmark === "object" ? metadata.benchmark as Record<string, unknown> : {};
  const benchmark = benchmarkEvidence.benchmark && typeof benchmarkEvidence.benchmark === "object" ? benchmarkEvidence.benchmark as Record<string, unknown> : {};
  const economics = metadata.economics && typeof metadata.economics === "object" ? metadata.economics as Record<string, unknown> : {};
  const freshnessWindowMs = Number(process.env.EPOCH_MODEL_EVIDENCE_MAX_AGE_MS ?? 24 * 60 * 60 * 1000);
  const gate = evaluateEpochModelVerificationGate({
    runtimeLoadStatus: typeof runtimeLoad.status === "string" ? runtimeLoad.status : "UNKNOWN",
    qualityStatus: typeof quality.status === "string" ? quality.status : undefined,
    qualityScorePct: typeof quality.weightedScorePct === "number" ? quality.weightedScorePct : null,
    minimumQualityScorePct: typeof qualityEvidence.minimumScorePct === "number" ? qualityEvidence.minimumScorePct : 80,
    benchmarkStatus: typeof benchmark.status === "string" ? benchmark.status : undefined,
    p99Ms: typeof benchmark.latencyMs === "object" && benchmark.latencyMs && typeof (benchmark.latencyMs as Record<string, unknown>).p99 === "number" ? (benchmark.latencyMs as Record<string, unknown>).p99 as number : null,
    maximumP99Ms: typeof benchmarkEvidence.gate === "object" && benchmarkEvidence.gate && typeof (benchmarkEvidence.gate as Record<string, unknown>).maximumP99Ms === "number" ? (benchmarkEvidence.gate as Record<string, unknown>).maximumP99Ms as number : 2000,
    economicsStatus: typeof economics.status === "string" ? economics.status : undefined,
    evidenceTimestamps: { runtimeLoad: typeof metadata.runtimeLoadVerifiedAt === "string" ? metadata.runtimeLoadVerifiedAt : undefined, quality: typeof qualityEvidence.recordedAt === "string" ? qualityEvidence.recordedAt : undefined, benchmark: typeof benchmarkEvidence.recordedAt === "string" ? benchmarkEvidence.recordedAt : undefined, economics: typeof metadata.economicsVerifiedAt === "string" ? metadata.economicsVerifiedAt : undefined },
    maxEvidenceAgeMs: Number.isFinite(freshnessWindowMs) && freshnessWindowMs > 0 ? freshnessWindowMs : 24 * 60 * 60 * 1000,
  });
  await prisma.epochCapabilityRegistry.update({ where: { id: existing.id }, data: { status: gate.eligible ? "active" : "unknown", metadata: { ...metadata, verificationGate: gate, verifiedAt: gate.evaluatedAt } as any } });
  return gate;
}

export async function recordEpochHuggingFaceSyncState(scope: Scope, input: { repositoryId: string; revision?: string; state: EpochHuggingFaceSyncState; jobId?: string; attempts?: number; error?: string; inspection?: EpochHuggingFaceInspection; artifacts?: EpochHuggingFaceArtifact[]; retryAt?: string }) {
  const existing = await prisma.epochCapabilityRegistry.findFirst({ where: { workspaceId: scope.workspaceId, source: "huggingface", name: input.repositoryId }, orderBy: { updatedAt: "desc" }, select: { id: true, metadata: true } });
  const prior = existing?.metadata && typeof existing.metadata === "object" ? existing.metadata as Record<string, unknown> : {};
  const syncEvent = { status: input.state, jobId: input.jobId, attempts: input.attempts ?? 0, error: input.error, retryAt: input.retryAt, artifacts: input.artifacts ?? [], updatedAt: new Date().toISOString() };
  const data = { workspaceId: scope.workspaceId, userId: scope.userId, orgId: scope.orgId, name: input.repositoryId, source: "huggingface", version: input.inspection?.commitSha ?? input.revision ?? "unknown", status: input.state === "COMPLETED" ? "active" : input.state === "FAILED" ? "unknown" : "syncing", capabilities: input.inspection?.tags ?? [], metadata: { ...prior, ...(input.inspection ? { inspection: input.inspection } : {}), sync: syncEvent, syncHistory: [...(Array.isArray(prior.syncHistory) ? prior.syncHistory : []), syncEvent].slice(-20) } } as any;
  return existing ? prisma.epochCapabilityRegistry.update({ where: { id: existing.id }, data }) : prisma.epochCapabilityRegistry.create({ data });
}

async function persistSyncedEpochHuggingFaceModel(scope: Scope, inspection: EpochHuggingFaceInspection, attempts: number, artifacts: EpochHuggingFaceArtifact[], validation: EpochModelArtifactValidation | null = null) {
  const existing = await prisma.epochCapabilityRegistry.findFirst({
    where: { workspaceId: scope.workspaceId, source: "huggingface", name: inspection.repositoryId },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  const data = {
    workspaceId: scope.workspaceId, userId: scope.userId, orgId: scope.orgId,
    name: inspection.repositoryId, source: "huggingface", version: inspection.commitSha ?? inspection.revision,
    status: (inspection.governance.status ?? (inspection.governance.eligible ? "ELIGIBLE" : "BLOCKED")) === "ELIGIBLE" ? "active" : (inspection.governance.status ?? "BLOCKED") === "BLOCKED" ? "blocked" : "unknown",
    capabilities: inspection.tags,
    metadata: {
      inspection,
      governanceStatus: inspection.governance.status ?? (inspection.governance.eligible ? "ELIGIBLE" : "BLOCKED"),
      sync: { status: "COMPLETED", attempts, artifactMode: artifacts.length ? "DOWNLOADED" : "REGISTERED_MANIFEST_ONLY", artifacts, validation, completedAt: new Date().toISOString() },
    },
  } as any;
  return existing
    ? prisma.epochCapabilityRegistry.update({ where: { id: existing.id }, data })
    : prisma.epochCapabilityRegistry.create({ data });
}

export async function listSyncedEpochHuggingFaceModels(scope: Scope, limit = 100) {
  return prisma.epochCapabilityRegistry.findMany({
    where: { workspaceId: scope.workspaceId, source: "huggingface" },
    orderBy: { updatedAt: "desc" }, take: Math.min(Math.max(limit, 1), 200),
  });
}
