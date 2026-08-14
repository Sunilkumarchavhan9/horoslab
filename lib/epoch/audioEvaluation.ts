import { createHash } from "node:crypto";

export type EpochAudioArtifact = { encoding: "base64" | "data-url" | "url"; value: string; mimeType?: string; bytes?: number };
export type EpochSpeechEvaluationCase = { id: string; expectedText: string; observedText: string };
export type EpochSpeechEvaluation = { version: "epoch_speech_evaluation.v1"; datasetSha256: string; status: "PASS" | "FAIL" | "UNKNOWN"; cases: number; exactMatchPct: number | null; tokenF1: number | null; invalidCaseIds: string[]; evidenceStatus: "OBSERVED"; recommendations: string[] };
export type EpochAudioArtifactValidation = { valid: boolean; encoding: EpochAudioArtifact["encoding"] | null; mimeType: string | null; bytes: number | null; sha256: string | null; reasons: string[] };

function canonical(value: unknown): string { if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`; if (value && typeof value === "object") return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(",")}}`; return JSON.stringify(value) ?? "null"; }
function normalize(value: string) { return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim(); }
function f1(expected: string, observed: string) { const left = normalize(expected).split(" ").filter(Boolean); const right = normalize(observed).split(" ").filter(Boolean); if (!left.length || !right.length) return left.join(" ") === right.join(" ") ? 1 : 0; const counts = new Map<string, number>(); for (const token of left) counts.set(token, (counts.get(token) ?? 0) + 1); let overlap = 0; for (const token of right) { const count = counts.get(token) ?? 0; if (count > 0) { overlap++; counts.set(token, count - 1); } } const precision = overlap / right.length; const recall = overlap / left.length; return precision + recall ? (2 * precision * recall) / (precision + recall) : 0; }

export function validateEpochAudioArtifact(input: EpochAudioArtifact): EpochAudioArtifactValidation {
  const reasons: string[] = []; let encoding: EpochAudioArtifact["encoding"] | null = null; let mimeType: string | null = input.mimeType ?? null; let bytes: number | null = null; let sha256: string | null = null;
  if (!input || typeof input.value !== "string" || !input.value.trim()) reasons.push("missing_audio_artifact");
  if (input.encoding === "base64") { encoding = "base64"; if (!/^[A-Za-z0-9+/]+={0,2}$/.test(input.value) || input.value.length < 8) reasons.push("invalid_base64_audio"); else { bytes = Math.floor((input.value.length * 3) / 4) - (input.value.endsWith("==") ? 2 : input.value.endsWith("=") ? 1 : 0); sha256 = createHash("sha256").update(Buffer.from(input.value, "base64")).digest("hex"); } }
  else if (input.encoding === "data-url") { encoding = "data-url"; const match = input.value.match(/^data:([\w.+-]+\/[\w.+-]+);base64,([A-Za-z0-9+/=]+)$/); if (!match) reasons.push("invalid_audio_data_url"); else { mimeType = mimeType ?? match[1]; bytes = Buffer.from(match[2], "base64").length; sha256 = createHash("sha256").update(Buffer.from(match[2], "base64")).digest("hex"); } }
  else if (input.encoding === "url") { encoding = "url"; try { const url = new URL(input.value); if (!['https:', 'http:'].includes(url.protocol)) reasons.push("invalid_audio_url"); } catch { reasons.push("invalid_audio_url"); } }
  else reasons.push("unknown_audio_encoding");
  if (bytes !== null && bytes < 16) reasons.push("audio_artifact_too_small");
  return { valid: reasons.length === 0, encoding, mimeType, bytes, sha256, reasons };
}

export function evaluateEpochSpeech(input: { cases: EpochSpeechEvaluationCase[]; minimumTokenF1?: number }): EpochSpeechEvaluation {
  const invalidCaseIds: string[] = []; const valid = input.cases.filter((item) => { const ok = item.expectedText.trim().length > 0 && item.observedText.trim().length > 0; if (!ok) invalidCaseIds.push(item.id); return ok; });
  const exactMatchPct = valid.length ? valid.filter((item) => normalize(item.expectedText) === normalize(item.observedText)).length / valid.length : null;
  const tokenF1 = valid.length ? valid.reduce((sum, item) => sum + f1(item.expectedText, item.observedText), 0) / valid.length : null;
  const minimumTokenF1 = input.minimumTokenF1 ?? 0.8; const datasetSha256 = createHash("sha256").update(canonical({ cases: input.cases, minimumTokenF1 })).digest("hex"); const pass = valid.length > 0 && !invalidCaseIds.length && (tokenF1 ?? 0) >= minimumTokenF1;
  return { version: "epoch_speech_evaluation.v1", datasetSha256, status: valid.length ? (pass ? "PASS" : "FAIL") : "UNKNOWN", cases: valid.length, exactMatchPct, tokenF1, invalidCaseIds, evidenceStatus: "OBSERVED", recommendations: pass ? [] : ["inspect audio preprocessing and transcription model", "add accents, noise, and multilingual speech cases"] };
}
