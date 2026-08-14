import type {
  ChangeIR,
  CodeMutation,
  IntentContract,
  PredictedEffect,
  RiskDomain,
  SchemaMutation,
} from "./contracts";

export type ChangedFile = {
  path: string;
  patch?: string;
  operation?: "add" | "modify" | "delete" | "rename";
};

const pathDomain = (path: string): RiskDomain | undefined => {
  const value = path.toLowerCase();
  if (/auth|session|rbac|permission|middleware/.test(value)) return "auth";
  if (/billing|stripe|invoice|entitlement|subscription|payment/.test(value)) return "billing";
  if (/prisma|migration|schema|\.sql$/.test(value)) return "migrations";
  return undefined;
};

function codeKind(path: string): CodeMutation["semanticKind"] {
  const value = path.toLowerCase();
  if (/test|spec\./.test(value)) return "test";
  if (/auth|session|rbac|permission|middleware/.test(value)) return "auth_guard";
  if (/billing|stripe|invoice|entitlement|subscription|payment/.test(value)) return "billing_webhook";
  if (/route|controller|handler/.test(value)) return "route_handler";
  return "service_logic";
}

function schemaMutations(file: ChangedFile): SchemaMutation[] {
  const content = file.patch ?? "";
  const value = file.path.toLowerCase();
  if (!/prisma|migration|\.sql$/.test(value)) return [];

  const mutations: SchemaMutation[] = [];
  const patterns: Array<{
    pattern: RegExp;
    operation: SchemaMutation["operation"];
    objectType: SchemaMutation["objectType"];
    lose: boolean;
    notes: string[];
  }> = [
    { pattern: /drop\s+(?:column|table)/i, operation: "drop", objectType: "column", lose: true, notes: ["destructive schema operation"] },
    { pattern: /add\s+column/i, operation: "alter", objectType: "column", lose: false, notes: ["new column requires compatibility review"] },
    { pattern: /create\s+(?:unique\s+)?index/i, operation: "create", objectType: "index", lose: false, notes: ["index creation may lock or consume significant resources"] },
    { pattern: /alter\s+table/i, operation: "alter", objectType: "table", lose: false, notes: ["table alteration requires migration review"] },
  ];
  for (const item of patterns) {
    if (!item.pattern.test(content)) continue;
    mutations.push({
      source: /\.sql$/.test(value) ? "sql_migration" : "prisma_schema",
      objectType: item.objectType,
      objectName: file.path,
      operation: item.operation,
      backwardCompatible: item.lose ? false : "unknown",
      mayLock: item.lose || item.objectType === "index" || item.objectType === "table",
      mayRewriteData: item.lose,
      mayLoseData: item.lose,
      notes: item.notes,
    });
  }
  return mutations;
}

export function compileChange(files: ChangedFile[]): {
  intent: IntentContract;
  changeIR: ChangeIR;
  predictedEffects: PredictedEffect[];
} {
  const domains = Array.from(new Set(files.map((file) => pathDomain(file.path)).filter(Boolean))) as RiskDomain[];
  const codeMutations: CodeMutation[] = files
    .filter((file) => !/prisma|migration|\.sql$/.test(file.path.toLowerCase()))
    .map((file) => ({
      path: file.path,
      operation: file.operation ?? "modify",
      semanticKind: codeKind(file.path),
      summary: `${file.operation ?? "modify"} ${file.path}`,
    }));
  const schema = files.flatMap(schemaMutations);
  const effects: PredictedEffect[] = [];
  if (schema.some((item) => item.mayLoseData)) {
    effects.push({
      id: "migration.data_loss",
      domain: "migrations",
      severity: "critical",
      hypothesis: "The proposed schema change may remove or rewrite existing data.",
      confidence: 0.99,
      supportingSignals: schema.filter((item) => item.mayLoseData).map((item) => item.objectName),
    });
  }
  if (domains.includes("auth")) {
    effects.push({ id: "auth.regression", domain: "auth", severity: "high", hypothesis: "Authentication or authorization behavior may change.", confidence: 0.82, supportingSignals: files.filter((file) => pathDomain(file.path) === "auth").map((file) => file.path) });
  }
  if (domains.includes("billing")) {
    effects.push({ id: "billing.idempotency", domain: "billing", severity: "high", hypothesis: "Billing or entitlement behavior may require duplicate-event and retry verification.", confidence: 0.82, supportingSignals: files.filter((file) => pathDomain(file.path) === "billing").map((file) => file.path) });
  }
  return {
    intent: { version: "v1", inferredGoal: "Evaluate the safety of the proposed repository change.", riskDomains: domains, touchedPaths: files.map((file) => file.path), assumptions: [], unknowns: [] },
    changeIR: { version: "v1", codeMutations, schemaMutations: schema, configMutations: [], dependencyMutations: [] },
    predictedEffects: effects,
  };
}
