import type {
  ChangeIR,
  CompilationDecision,
  InvariantResult,
  PredictedEffect,
  RiskDomain,
  RiskLevel,
  VerificationPlan,
} from "./contracts";

const rank: Record<RiskLevel, number> = { low: 0, medium: 1, high: 2, critical: 3 };

function highestRisk(effects: PredictedEffect[]): RiskLevel {
  return effects.reduce<RiskLevel>((highest, effect) => rank[effect.severity] > rank[highest] ? effect.severity : highest, "low");
}

function hasTestForDomain(changeIR: ChangeIR, domain: RiskDomain): boolean {
  return changeIR.codeMutations.some((mutation) => mutation.semanticKind === "test" && (
    domain === "auth" || domain === "billing" || mutation.path.toLowerCase().includes(domain)
  ));
}

export function createVerificationPlan(changeIR: ChangeIR, effects: PredictedEffect[]): VerificationPlan {
  const domains = Array.from(new Set(effects.map((effect) => effect.domain)));
  const checks = domains.flatMap((domain) => {
    const checksForDomain = domain === "migrations"
      ? [{ id: "migration.compatibility", name: "Migration compatibility and data safety", reason: "Schema mutations can affect existing data or deployment compatibility." }]
      : domain === "auth"
        ? [{ id: "auth.negative-path", name: "Authentication and authorization negative paths", reason: "Auth-sensitive changes require proof that protected paths remain protected." }]
        : [{ id: "billing.idempotency", name: "Billing retry and duplicate-event safety", reason: "Billing-sensitive changes require idempotency and retry evidence." }];
    return checksForDomain.map((check) => ({ ...check, domain, required: true }));
  });
  const unknowns = domains
    .filter((domain) => domain !== "migrations" && !hasTestForDomain(changeIR, domain))
    .map((domain) => `No ${domain} verification test was detected in the proposed change.`);
  return { version: "v1", riskLevel: highestRisk(effects), checks, unknowns };
}

export function evaluateInvariants(changeIR: ChangeIR, effects: PredictedEffect[]): InvariantResult[] {
  const results: InvariantResult[] = [];
  if (effects.some((effect) => effect.id === "migration.data_loss")) {
    results.push({ id: "migration.no-data-loss", domain: "migrations", status: "fail", severity: "critical", evidence: ["destructive schema mutation detected"], repair: "Use an expand-contract migration or provide an approved data migration plan." });
  }
  if (effects.some((effect) => effect.domain === "auth")) {
    const tested = hasTestForDomain(changeIR, "auth");
    results.push({ id: "auth.protected-paths", domain: "auth", status: tested ? "pass" : "unknown", severity: "high", evidence: tested ? ["auth test mutation detected"] : [], repair: tested ? undefined : "Add authentication and authorization negative-path tests." });
  }
  if (effects.some((effect) => effect.domain === "billing")) {
    const tested = hasTestForDomain(changeIR, "billing");
    results.push({ id: "billing.idempotent-events", domain: "billing", status: tested ? "pass" : "unknown", severity: "high", evidence: tested ? ["billing test mutation detected"] : [], repair: tested ? undefined : "Add duplicate webhook and retry idempotency tests." });
  }
  return results;
}

export function decideCompilation(changeIR: ChangeIR, effects: PredictedEffect[]): CompilationDecision {
  const verificationPlan = createVerificationPlan(changeIR, effects);
  const invariantResults = evaluateInvariants(changeIR, effects);
  const reasons: string[] = [];
  if (invariantResults.some((result) => result.status === "fail")) reasons.push("A critical invariant failed.");
  if (invariantResults.some((result) => result.status === "unknown")) reasons.push("Required evidence is unknown or missing.");
  const decision = invariantResults.some((result) => result.status === "fail")
    ? "BLOCK"
    : invariantResults.some((result) => result.status === "unknown")
      ? "CONDITIONAL"
      : "PASS";
  if (decision === "PASS" && effects.length === 0) reasons.push("No supported high-risk effects were detected.");
  return { decision, riskLevel: verificationPlan.riskLevel, reasons, invariantResults, verificationPlan };
}
