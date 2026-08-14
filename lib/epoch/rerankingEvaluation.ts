import { createHash } from "node:crypto";

export type EpochRerankingCase = { id: string; relevantDocumentIds: string[]; rankedDocumentIds: string[] };
export type EpochRerankingEvaluation = { version: "epoch_reranking_evaluation.v1"; datasetSha256: string; status: "PASS" | "FAIL" | "UNKNOWN"; cases: number; recallAtK: Record<string, number | null>; mrr: number | null; ndcgAtK: Record<string, number | null>; invalidCaseIds: string[]; evidenceStatus: "OBSERVED"; recommendations: string[] };
function canonical(value: unknown): string { if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`; if (value && typeof value === "object") return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(",")}}`; return JSON.stringify(value) ?? "null"; }
export function evaluateEpochReranking(input: { cases: EpochRerankingCase[]; ks?: number[] }): EpochRerankingEvaluation {
  const ks = [...new Set((input.ks ?? [1, 3, 5]).filter((value) => Number.isInteger(value) && value > 0).map((value) => Math.floor(value)))].sort((a, b) => a - b);
  const invalidCaseIds: string[] = [];
  const valid = input.cases.filter((item) => { const ok = item.relevantDocumentIds.length > 0 && item.rankedDocumentIds.length > 0 && new Set(item.rankedDocumentIds).size === item.rankedDocumentIds.length && item.relevantDocumentIds.every((id) => item.rankedDocumentIds.includes(id)); if (!ok) invalidCaseIds.push(item.id); return ok; });
  const recallAtK: Record<string, number | null> = {}; const ndcgAtK: Record<string, number | null> = {};
  for (const k of ks) {
    recallAtK[String(k)] = valid.length ? valid.reduce((sum, item) => sum + (item.rankedDocumentIds.slice(0, k).some((id) => item.relevantDocumentIds.includes(id)) ? 1 : 0), 0) / valid.length : null;
    ndcgAtK[String(k)] = valid.length ? valid.reduce((sum, item) => { const ranked = item.rankedDocumentIds.slice(0, k); const dcg = ranked.reduce((score, id, index) => score + (item.relevantDocumentIds.includes(id) ? 1 / Math.log2(index + 2) : 0), 0); const ideal = Array.from({ length: Math.min(k, item.relevantDocumentIds.length) }, (_, index) => 1 / Math.log2(index + 2)).reduce((a, b) => a + b, 0); return sum + (ideal ? dcg / ideal : 0); }, 0) / valid.length : null;
  }
  const mrr = valid.length ? valid.reduce((sum, item) => { const rank = item.rankedDocumentIds.findIndex((id) => item.relevantDocumentIds.includes(id)); return sum + (rank >= 0 ? 1 / (rank + 1) : 0); }, 0) / valid.length : null;
  const datasetSha256 = createHash("sha256").update(canonical({ cases: input.cases, ks })).digest("hex");
  const topRecall = ks.length ? recallAtK[String(ks[ks.length - 1])] : null;
  return { version: "epoch_reranking_evaluation.v1", datasetSha256, status: valid.length && !invalidCaseIds.length ? "PASS" : valid.length ? "FAIL" : "UNKNOWN", cases: valid.length, recallAtK, mrr, ndcgAtK, invalidCaseIds, evidenceStatus: "OBSERVED", recommendations: topRecall !== null && topRecall < 0.8 ? ["inspect reranker model and candidate pool", "expand judged relevance data"] : [] };
}
