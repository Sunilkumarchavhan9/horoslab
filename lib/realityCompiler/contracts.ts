export type RiskDomain = "migrations" | "auth" | "billing";
export type RiskLevel = "low" | "medium" | "high" | "critical";

export type IntentContract = {
  version: "v1";
  inferredGoal: string;
  humanGoal?: string;
  riskDomains: RiskDomain[];
  touchedPaths: string[];
  assumptions: string[];
  unknowns: string[];
};

export type CodeMutation = {
  path: string;
  operation: "add" | "modify" | "delete" | "rename";
  semanticKind:
    | "route_handler"
    | "middleware"
    | "auth_guard"
    | "rbac_policy"
    | "billing_webhook"
    | "entitlement_check"
    | "service_logic"
    | "test"
    | "unknown";
  summary: string;
};

export type SchemaMutation = {
  source: "prisma_schema" | "sql_migration";
  objectType: "table" | "column" | "index" | "constraint" | "enum" | "unknown";
  objectName: string;
  operation: "create" | "alter" | "drop" | "rename";
  backwardCompatible: boolean | "unknown";
  mayLock: boolean;
  mayRewriteData: boolean;
  mayLoseData: boolean;
  notes: string[];
};

export type ChangeIR = {
  version: "v1";
  codeMutations: CodeMutation[];
  schemaMutations: SchemaMutation[];
  configMutations: string[];
  dependencyMutations: string[];
};

export type PredictedEffect = {
  id: string;
  domain: RiskDomain;
  severity: RiskLevel;
  hypothesis: string;
  confidence: number;
  supportingSignals: string[];
};

export type VerificationCheck = {
  id: string;
  name: string;
  domain: RiskDomain;
  required: boolean;
  reason: string;
};

export type VerificationPlan = {
  version: "v1";
  riskLevel: RiskLevel;
  checks: VerificationCheck[];
  unknowns: string[];
};

export type InvariantResult = {
  id: string;
  domain: RiskDomain;
  status: "pass" | "fail" | "unknown";
  severity: RiskLevel;
  evidence: string[];
  repair?: string;
};

export type CompilationDecision = {
  decision: "PASS" | "CONDITIONAL" | "BLOCK";
  riskLevel: RiskLevel;
  reasons: string[];
  invariantResults: InvariantResult[];
  verificationPlan: VerificationPlan;
};
