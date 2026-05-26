/**
 * Product metering — per-operation token/search costs.
 * Plan monthly caps: `shared/planCatalog.ts` → `lib/billing/store.ts`.
 */

/** Approximate characters per billed token on ingest/write paths. */
export const BILLING_CHARS_PER_TOKEN = 4;

/** @deprecated Use per-operation `searchCost` in OPERATION_METERING */
export const BILLING_SEARCH_QUERY_COST = 1;

export type MemoryMeterOperation =
  | "process_ingest"
  | "voice_ingest"
  | "retrieve"
  | "retrieve_explain"
  | "retrieve_debug"
  | "retrieve_why_not"
  | "continue"
  | "handoff"
  | "resume"
  | "resume_brief"
  | "resume_prompt";

export type UsageCost = {
  tokenCost: number;
  searchCost: number;
};

type OperationMeterConfig = {
  /** Bill search-query units for this operation. */
  searchCost: number;
  /** Multiply estimated text tokens (0 = no token charge). */
  tokenWeight: number;
  /** Minimum token charge when tokenWeight > 0. */
  minTokenCost: number;
};

/**
 * Tune product charging here — one row per API family.
 * searchCost increments the monthly search meter; tokenWeight × text length increments tokens.
 */
export const OPERATION_METERING: Record<MemoryMeterOperation, OperationMeterConfig> = {
  process_ingest: { searchCost: 0, tokenWeight: 1, minTokenCost: 1 },
  voice_ingest: { searchCost: 0, tokenWeight: 1, minTokenCost: 1 },
  retrieve: { searchCost: 1, tokenWeight: 0.25, minTokenCost: 0 },
  retrieve_explain: { searchCost: 1, tokenWeight: 0.25, minTokenCost: 0 },
  retrieve_debug: { searchCost: 2, tokenWeight: 0.25, minTokenCost: 0 },
  retrieve_why_not: { searchCost: 1, tokenWeight: 0.25, minTokenCost: 0 },
  continue: { searchCost: 1, tokenWeight: 0.25, minTokenCost: 0 },
  handoff: { searchCost: 2, tokenWeight: 0.5, minTokenCost: 0 },
  resume: { searchCost: 1, tokenWeight: 0.25, minTokenCost: 0 },
  resume_brief: { searchCost: 1, tokenWeight: 0.25, minTokenCost: 0 },
  resume_prompt: { searchCost: 2, tokenWeight: 0.5, minTokenCost: 0 },
};

export function estimateTokenCostFromText(input: string): number {
  const trimmed = input.trim();
  if (!trimmed) return 1;
  return Math.max(1, Math.ceil(trimmed.length / BILLING_CHARS_PER_TOKEN));
}

export function resolveUsageCost(
  operation: MemoryMeterOperation,
  text = "",
): UsageCost {
  const config = OPERATION_METERING[operation];
  const estimated = estimateTokenCostFromText(text);
  const weightedTokens =
    config.tokenWeight <= 0
      ? 0
      : Math.max(config.minTokenCost, Math.ceil(estimated * config.tokenWeight));

  return {
    tokenCost: weightedTokens,
    searchCost: config.searchCost,
  };
}

export function listMeteringOperations(): Array<{
  operation: MemoryMeterOperation;
  searchCost: number;
  tokenWeight: number;
}> {
  return (Object.keys(OPERATION_METERING) as MemoryMeterOperation[]).map((operation) => ({
    operation,
    searchCost: OPERATION_METERING[operation].searchCost,
    tokenWeight: OPERATION_METERING[operation].tokenWeight,
  }));
}

const METER_OPERATION_META: Record<
  MemoryMeterOperation,
  { label: string; routes: string }
> = {
  process_ingest: { label: "Process / ingest", routes: "POST /process" },
  voice_ingest: { label: "Voice chunk", routes: "POST /voice/chunk" },
  retrieve: { label: "Retrieve", routes: "POST /retrieve" },
  retrieve_explain: { label: "Retrieve explain", routes: "GET /retrieve/explain" },
  retrieve_debug: { label: "Retrieve debug", routes: "POST /retrieve/debug" },
  retrieve_why_not: { label: "Retrieve why-not", routes: "POST /retrieve/why-not" },
  continue: { label: "Continue", routes: "POST /continue" },
  handoff: { label: "Handoff", routes: "POST /handoff" },
  resume: { label: "Resume", routes: "POST /resume" },
  resume_brief: { label: "Resume brief", routes: "POST /resume/brief" },
  resume_prompt: { label: "Resume prompt", routes: "POST /resume/prompt" },
};

export type MeteringCatalogEntry = {
  operation: MemoryMeterOperation;
  label: string;
  routes: string;
  searchCost: number;
  tokenWeight: number;
  minTokenCost: number;
  /** Token units billed for a 1,000-character payload (illustrative). */
  exampleTokenCost1kChars: number;
};

export type MeteringCatalog = {
  charsPerToken: number;
  operations: MeteringCatalogEntry[];
};

export function getMeteringCatalog(): MeteringCatalog {
  const sampleText = "x".repeat(1000);
  return {
    charsPerToken: BILLING_CHARS_PER_TOKEN,
    operations: (Object.keys(OPERATION_METERING) as MemoryMeterOperation[]).map((operation) => {
      const config = OPERATION_METERING[operation];
      const meta = METER_OPERATION_META[operation];
      return {
        operation,
        label: meta.label,
        routes: meta.routes,
        searchCost: config.searchCost,
        tokenWeight: config.tokenWeight,
        minTokenCost: config.minTokenCost,
        exampleTokenCost1kChars: resolveUsageCost(operation, sampleText).tokenCost,
      };
    }),
  };
}
