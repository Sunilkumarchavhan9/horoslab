import { createHash } from "node:crypto";

export type EpochModelVerificationGate = { version: "epoch_model_verification_gate.v1"; eligible: boolean; status: "PASS" | "FAIL" | "REVIEW"; reasons: string[]; checks: { runtimeLoad: boolean; quality: boolean | null; benchmark: boolean | null; economics: boolean | null; freshness: boolean | null }; gateSha256: string; evaluatedAt: string };
export function evaluateEpochModelVerificationGate(input: { runtimeLoadStatus: string; qualityStatus?: string; qualityScorePct?: number | null; minimumQualityScorePct?: number; benchmarkStatus?: string; p99Ms?: number | null; maximumP99Ms?: number; economicsStatus?: string; requireEconomics?: boolean; evidenceTimestamps?: { runtimeLoad?: string; quality?: string; benchmark?: string; economics?: string }; maxEvidenceAgeMs?: number; now?: Date }): EpochModelVerificationGate {
  const reasons: string[] = [];
  const runtimeLoad = input.runtimeLoadStatus === "VERIFIED_COMPATIBLE";
  const quality = input.qualityStatus === undefined ? null : input.qualityStatus === "PASS" && (input.qualityScorePct ?? 0) >= (input.minimumQualityScorePct ?? 80);
  const benchmark = input.benchmarkStatus === undefined ? null : input.benchmarkStatus === "completed" && input.p99Ms !== null && input.p99Ms !== undefined && input.p99Ms <= (input.maximumP99Ms ?? 2000);
  const economics = input.economicsStatus === undefined ? null : input.economicsStatus === "PASS";
  const evidenceValues = [input.evidenceTimestamps?.runtimeLoad, input.evidenceTimestamps?.quality, input.evidenceTimestamps?.benchmark, input.evidenceTimestamps?.economics];
  const freshnessRequired = input.evidenceTimestamps !== undefined;
  const maxAge = Math.max(1, input.maxEvidenceAgeMs ?? 24 * 60 * 60 * 1000);
  const now = (input.now ?? new Date()).getTime();
  const freshness = !freshnessRequired ? null : evidenceValues.every((value) => typeof value === "string" && Number.isFinite(Date.parse(value)) && now - Date.parse(value) >= 0 && now - Date.parse(value) <= maxAge);
  if (!runtimeLoad) reasons.push("runtime_load_not_verified");
  if (quality === false) reasons.push("quality_gate_failed");
  if (benchmark === false) reasons.push("benchmark_gate_failed");
  if (input.requireEconomics && economics !== true) reasons.push("economics_gate_required");
  if (freshness === false) reasons.push("evidence_expired_or_missing_timestamp");
  const review = [quality, benchmark, economics].some((value) => value === null) || freshness === false;
  const eligible = runtimeLoad && !reasons.length && !review;
  const status = eligible ? "PASS" : reasons.length ? "FAIL" : "REVIEW";
  const payload = { runtimeLoad, quality, benchmark, economics, freshness, reasons, input };
  return { version: "epoch_model_verification_gate.v1", eligible, status, reasons: review && !reasons.length ? ["complete quality, benchmark, economics, and fresh evidence before promotion"] : reasons, checks: { runtimeLoad, quality, benchmark, economics, freshness }, gateSha256: createHash("sha256").update(JSON.stringify(payload)).digest("hex"), evaluatedAt: new Date().toISOString() };
}
