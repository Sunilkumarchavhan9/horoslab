import { createHash, randomUUID } from "node:crypto";
import {
  EvidenceSchema,
  LessonSchema,
  TeachingDatasetSchema,
  VerificationSchema,
  WorldExperienceSchema,
  type Evidence,
  type Lesson,
  type TeachingDataset,
  type Verification,
  type WorldExperience,
} from "./contracts";
import { getCanonicalArtifact, persistCanonicalArtifact } from "./artifactStore";

type BaseInput = { workspaceId: string; missionId: string; correlationId: string; traceId: string; now?: Date };

function base(input: BaseInput, id: string) {
  const timestamp = (input.now ?? new Date()).toISOString();
  return { contractVersion: "epoch.canonical.v1" as const, id, workspaceId: input.workspaceId, createdAt: timestamp, updatedAt: timestamp, correlation: { correlationId: input.correlationId, traceId: input.traceId } };
}

function digest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function buildCanonicalEvidence(input: BaseInput & {
  executionId?: string;
  claimId?: string;
  type: Evidence["type"];
  uri: string;
  summary?: string;
  payload?: Record<string, unknown>;
  classification?: "OBSERVED" | "MEASURED" | "USER_ASSERTED" | "EXTERNAL" | "INFERRED" | "PREDICTED" | "SIMULATED" | "VERIFIED";
  confidence?: number;
}): Evidence {
  const payload = input.payload ?? {};
  const capturedAt = (input.now ?? new Date()).toISOString();
  return EvidenceSchema.parse({
    ...base(input, `evidence_${randomUUID()}`),
    missionId: input.missionId,
    ...(input.executionId ? { executionId: input.executionId } : {}),
    ...(input.claimId ? { claimId: input.claimId } : {}),
    type: input.type,
    uri: input.uri,
    contentHash: digest({ uri: input.uri, payload, capturedAt }),
    capturedAt,
    provenance: { classification: input.classification ?? "MEASURED", confidence: input.confidence ?? 1, capturedAt, sourceUri: input.uri, derivation: [] },
  });
}

export async function persistCanonicalEvidence(input: Parameters<typeof buildCanonicalEvidence>[0]) {
  const evidence = buildCanonicalEvidence(input);
  await persistCanonicalArtifact({ workspaceId: input.workspaceId, objectType: "Evidence", objectId: evidence.id, missionId: input.missionId, parentId: input.executionId, payload: evidence, provenance: evidence.provenance, correlationId: input.correlationId, traceId: input.traceId });
  return evidence;
}

export function buildCanonicalVerification(input: BaseInput & {
  evidenceIds: string[];
  verifierId: string;
  executorId: string;
  method: string;
  observationWindow: { start: string; end: string };
  verdict: Verification["verdict"];
  findings?: Array<Record<string, unknown>>;
}): Verification {
  if (input.verifierId === input.executorId) throw new Error("INDEPENDENT_VERIFIER_MUST_DIFFER_FROM_EXECUTOR");
  return VerificationSchema.parse({
    ...base(input, `verification_${randomUUID()}`),
    missionId: input.missionId,
    evidenceIds: input.evidenceIds,
    verifierId: input.verifierId,
    method: input.method,
    observationWindow: input.observationWindow,
    verdict: input.verdict,
    findings: input.findings ?? [],
    independent: true,
  });
}

export async function persistCanonicalVerification(input: Parameters<typeof buildCanonicalVerification>[0]) {
  if (!input.evidenceIds.length) throw new Error("VERIFICATION_EVIDENCE_REQUIRED");
  const evidence = await Promise.all(input.evidenceIds.map((id) => getCanonicalArtifact(input.workspaceId, "Evidence", id)));
  if (evidence.some((item) => !item || item.missionId !== input.missionId)) throw new Error("VERIFICATION_EVIDENCE_NOT_FOUND");
  const verification = buildCanonicalVerification(input);
  await persistCanonicalArtifact({ workspaceId: input.workspaceId, objectType: "Verification", objectId: verification.id, missionId: input.missionId, payload: verification, provenance: { classification: "VERIFIED", source: "independent-verifier", evidenceIds: input.evidenceIds }, correlationId: input.correlationId, traceId: input.traceId });
  return verification;
}

export function evaluateTeachingEligibility(input: { verdict: Verification["verdict"]; privacy: WorldExperience["privacy"]; license: WorldExperience["license"]; safety: WorldExperience["safety"] }): WorldExperience["teachingEligibility"] {
  if (input.verdict !== "VERIFIED") return "requires_review";
  if (input.privacy === "rejected" || input.license === "rejected" || input.safety === "rejected") return "rejected";
  if (input.privacy !== "approved" || input.license !== "approved" || input.safety !== "approved") return "requires_review";
  return "eligible";
}

export async function buildAndPersistWorldExperience(input: BaseInput & {
  environmentId: string;
  initialStateId: string;
  observationIds: string[];
  unknownIds: string[];
  hypothesisId?: string;
  actionId?: string;
  resultingStateId?: string;
  evidenceIds: string[];
  verificationId: string;
  lessonIds?: string[];
  privacy: WorldExperience["privacy"];
  license: WorldExperience["license"];
  safety: WorldExperience["safety"];
  lineage?: string[];
}) {
  const verification = await getCanonicalArtifact(input.workspaceId, "Verification", input.verificationId);
  if (!verification || verification.missionId !== input.missionId) throw new Error("EXPERIENCE_VERIFICATION_NOT_FOUND");
  const verdict = typeof verification.payload === "object" && verification.payload && "verdict" in verification.payload ? String(verification.payload.verdict) as Verification["verdict"] : "UNCERTAIN";
  const experience = WorldExperienceSchema.parse({
    ...base(input, `experience_${randomUUID()}`),
    missionId: input.missionId,
    environmentId: input.environmentId,
    initialStateId: input.initialStateId,
    observationIds: input.observationIds,
    unknownIds: input.unknownIds,
    ...(input.hypothesisId ? { hypothesisId: input.hypothesisId } : {}),
    ...(input.actionId ? { actionId: input.actionId } : {}),
    ...(input.resultingStateId ? { resultingStateId: input.resultingStateId } : {}),
    evidenceIds: input.evidenceIds,
    verificationId: input.verificationId,
    lessonIds: input.lessonIds ?? [],
    provenance: [{ classification: verdict === "VERIFIED" ? "VERIFIED" : "INFERRED", confidence: verdict === "VERIFIED" ? 1 : 0.5, derivation: [input.verificationId] }],
    privacy: input.privacy,
    license: input.license,
    safety: input.safety,
    teachingEligibility: evaluateTeachingEligibility({ verdict, privacy: input.privacy, license: input.license, safety: input.safety }),
    lineage: input.lineage ?? [input.missionId, input.verificationId],
  });
  await persistCanonicalArtifact({ workspaceId: input.workspaceId, objectType: "WorldExperience", objectId: experience.id, missionId: input.missionId, parentId: input.verificationId, payload: experience, provenance: experience.provenance[0], correlationId: input.correlationId, traceId: input.traceId });
  return experience;
}

export async function buildAndPersistLesson(input: BaseInput & {
  experienceId: string;
  statement: string;
  target: Lesson["target"];
  evidenceIds: string[];
  confidence: number;
}) {
  const experience = await getCanonicalArtifact(input.workspaceId, "WorldExperience", input.experienceId);
  if (!experience || experience.missionId !== input.missionId) throw new Error("LESSON_EXPERIENCE_NOT_FOUND");
  const lesson = LessonSchema.parse({ ...base(input, `lesson_${randomUUID()}`), experienceId: input.experienceId, statement: input.statement, target: input.target, evidenceIds: input.evidenceIds, confidence: input.confidence, status: "candidate" });
  await persistCanonicalArtifact({ workspaceId: input.workspaceId, objectType: "Lesson", objectId: lesson.id, missionId: input.missionId, parentId: input.experienceId, payload: lesson, provenance: { classification: "INFERRED", confidence: input.confidence, derivation: [input.experienceId] }, correlationId: input.correlationId, traceId: input.traceId });
  return lesson;
}

export async function buildAndPersistTeachingDataset(input: BaseInput & {
  lessonIds: string[];
  target: TeachingDataset["target"];
  version: string;
  itemCount: number;
  eligibility: TeachingDataset["eligibility"];
  lineage?: string[];
}) {
  if (!input.lessonIds.length) throw new Error("TEACHING_DATASET_LESSON_REQUIRED");
  const lessons = await Promise.all(input.lessonIds.map((id) => getCanonicalArtifact(input.workspaceId, "Lesson", id)));
  if (lessons.some((item) => !item || item.missionId !== input.missionId)) throw new Error("TEACHING_DATASET_LESSON_NOT_FOUND");
  const dataset = TeachingDatasetSchema.parse({ ...base(input, `teaching_dataset_${randomUUID()}`), lessonIds: input.lessonIds, target: input.target, version: input.version, itemCount: input.itemCount, eligibility: input.eligibility, lineage: input.lineage ?? [input.missionId, ...input.lessonIds] });
  await persistCanonicalArtifact({ workspaceId: input.workspaceId, objectType: "TeachingDataset", objectId: dataset.id, missionId: input.missionId, payload: dataset, provenance: { classification: "VERIFIED", confidence: 1, derivation: input.lessonIds }, correlationId: input.correlationId, traceId: input.traceId });
  return dataset;
}
