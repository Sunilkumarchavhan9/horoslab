import { createHash } from "node:crypto";

export type EpochEmbeddingCase = { id: string; query: number[]; relevantDocumentIds: string[] };
export type EpochEmbeddingDocument = { id: string; embedding: number[] };
export type EpochEmbeddingEvaluation = { version: "epoch_embedding_evaluation.v1"; datasetSha256: string; status: "PASS" | "FAIL" | "UNKNOWN"; cases: number; recallAtK: Record<string, number | null>; mrr: number | null; ndcgAtK: Record<string, number | null>; invalidCaseIds: string[]; evidenceStatus: "OBSERVED"; recommendations: string[] };

function validVector(vector: unknown): vector is number[] { return Array.isArray(vector) && vector.length > 0 && vector.every((value) => typeof value === "number" && Number.isFinite(value)); }
function cosine(a: number[], b: number[]) { if (a.length !== b.length || !validVector(a) || !validVector(b)) return null; const dot = a.reduce((sum, value, index) => sum + value * b[index], 0); const an = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0)); const bn = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0)); return an === 0 || bn === 0 ? null : dot / (an * bn); }
function canonical(value: unknown): string { if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`; if (value && typeof value === "object") return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(",")}}`; return JSON.stringify(value) ?? "null"; }

export function evaluateEpochEmbeddings(input: { cases: EpochEmbeddingCase[]; documents: EpochEmbeddingDocument[]; ks?: number[] }): EpochEmbeddingEvaluation {
  const ks = [...new Set((input.ks ?? [1, 3, 5]).filter((value) => Number.isInteger(value) && value > 0).map((value) => Math.floor(value)))].sort((a, b) => a - b);
  const docs = new Map(input.documents.map((document) => [document.id, document]));
  const invalidCaseIds: string[] = [];
  const rankings = input.cases.map((item) => {
    if (!validVector(item.query) || item.relevantDocumentIds.length === 0) { invalidCaseIds.push(item.id); return null; }
    const scored = input.documents.map((document) => ({ id: document.id, score: cosine(item.query, document.embedding) })).filter((value): value is { id: string; score: number } => value.score !== null).sort((a, b) => b.score - a.score);
    if (!scored.length || item.relevantDocumentIds.some((id) => !docs.has(id))) { invalidCaseIds.push(item.id); return null; }
    return { item, scored };
  });
  const valid = rankings.filter((value): value is { item: EpochEmbeddingCase; scored: Array<{ id: string; score: number }> } => value !== null);
  const recallAtK: Record<string, number | null> = {};
  const ndcgAtK: Record<string, number | null> = {};
  for (const k of ks) {
    recallAtK[String(k)] = valid.length ? valid.reduce((sum, value) => sum + (value.scored.slice(0, k).some((doc) => value.item.relevantDocumentIds.includes(doc.id)) ? 1 : 0), 0) / valid.length : null;
    ndcgAtK[String(k)] = valid.length ? valid.reduce((sum, value) => {
      const ranked = value.scored.slice(0, k); const dcg = ranked.reduce((score, doc, index) => score + (value.item.relevantDocumentIds.includes(doc.id) ? 1 / Math.log2(index + 2) : 0), 0); const ideal = Array.from({ length: Math.min(k, value.item.relevantDocumentIds.length) }, (_, index) => 1 / Math.log2(index + 2)).reduce((a, b) => a + b, 0); return sum + (ideal ? dcg / ideal : 0);
    }, 0) / valid.length : null;
  }
  const mrr = valid.length ? valid.reduce((sum, value) => { const index = value.scored.findIndex((doc) => value.item.relevantDocumentIds.includes(doc.id)); return sum + (index >= 0 ? 1 / (index + 1) : 0); }, 0) / valid.length : null;
  const datasetSha256 = createHash("sha256").update(canonical({ cases: input.cases, documents: input.documents, ks })).digest("hex");
  const topRecall = ks.length ? recallAtK[String(ks[ks.length - 1])] : null;
  return { version: "epoch_embedding_evaluation.v1", datasetSha256, status: valid.length && !invalidCaseIds.length ? "PASS" : valid.length ? "FAIL" : "UNKNOWN", cases: valid.length, recallAtK, mrr, ndcgAtK, invalidCaseIds, evidenceStatus: "OBSERVED", recommendations: topRecall !== null && topRecall < 0.8 ? ["inspect chunking and embedding model choice", "run a larger representative retrieval dataset"] : [] };
}
