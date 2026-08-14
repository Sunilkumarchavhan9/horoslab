import { inspectEpochModel } from "./modelIdentity";

export type EpochConstraintOperator = "<=" | ">=" | "=" | "<" | ">";

export type EpochMetricConstraint = {
  metric: string;
  operator: EpochConstraintOperator;
  target: number;
  unit?: string;
  hard: boolean;
  source: "explicit" | "acceptance_criteria";
};

export type EpochMissionSpecificationInput = {
  model?: Record<string, unknown>;
  outcome?: Record<string, unknown>;
  constraints?: Record<string, unknown>;
  baseline?: Record<string, unknown>;
  workload?: Record<string, unknown>;
  acceptanceCriteria?: string[];
};

export type EpochMissionSpecification = {
  version: "epoch_mission_specification.v1";
  model: Record<string, unknown> & { inspection?: ReturnType<typeof inspectEpochModel> };
  outcome: Record<string, unknown>;
  constraints: {
    hard: EpochMetricConstraint[];
    soft: EpochMetricConstraint[];
    unresolved: string[];
  };
  baseline: Record<string, unknown>;
  workload: Record<string, unknown>;
  readiness: "ready" | "needs_baseline" | "needs_constraints" | "needs_workload";
  compiledAt: string;
};

const CONSTRAINT_PATTERN = /^\s*([a-zA-Z][a-zA-Z0-9_.-]*)\s*(<=|>=|=|<|>)\s*\$?(-?\d+(?:\.\d+)?)\s*(%|ms|s|usd|usd\/month|tokens\/s|req\/s)?\s*$/i;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim()) : [];
}

function parseConstraint(value: string, source: EpochMetricConstraint["source"]): EpochMetricConstraint | null {
  const match = CONSTRAINT_PATTERN.exec(value);
  if (!match) return null;
  return {
    metric: match[1],
    operator: match[2] as EpochConstraintOperator,
    target: Number(match[3]),
    ...(match[4] ? { unit: match[4].toLowerCase() } : {}),
    hard: true,
    source,
  };
}

function normalizeExplicitConstraints(input: Record<string, unknown>): EpochMetricConstraint[] {
  const values = Array.isArray(input.metrics) ? input.metrics : [];
  return values.flatMap((value) => {
    const record = asRecord(value);
    const metric = typeof record.metric === "string" ? record.metric.trim() : "";
    const operator = record.operator;
    const target = typeof record.target === "number" ? record.target : Number(record.target);
    if (!metric || !["<=", ">=", "=", "<", ">"].includes(String(operator)) || !Number.isFinite(target)) return [];
    return [{
      metric,
      operator: operator as EpochConstraintOperator,
      target,
      ...(typeof record.unit === "string" ? { unit: record.unit } : {}),
      hard: record.hard !== false,
      source: "explicit" as const,
    }];
  });
}

export function compileEpochMissionSpecification(input: EpochMissionSpecificationInput, now = new Date()): EpochMissionSpecification {
  const explicit = normalizeExplicitConstraints(asRecord(input.constraints));
  const criteria = asStringArray(input.acceptanceCriteria);
  const parsedCriteria = criteria.flatMap((criterion) => {
    const parsed = parseConstraint(criterion, "acceptance_criteria");
    return parsed ? [parsed] : [];
  });
  const recognized = new Set([...explicit, ...parsedCriteria].map((constraint) => `${constraint.metric}:${constraint.operator}:${constraint.target}:${constraint.unit ?? ""}`));
  const unresolved = criteria.filter((criterion) => {
    const parsed = parseConstraint(criterion, "acceptance_criteria");
    return !parsed || !recognized.has(`${parsed.metric}:${parsed.operator}:${parsed.target}:${parsed.unit ?? ""}`);
  });
  const hard = [...explicit, ...parsedCriteria.filter((constraint) => !explicit.some((item) => item.metric === constraint.metric))];
  const soft = Array.isArray(asRecord(input.constraints).softMetrics)
    ? normalizeExplicitConstraints({ metrics: asRecord(input.constraints).softMetrics }).map((constraint) => ({ ...constraint, hard: false }))
    : [];
  const baseline = asRecord(input.baseline);
  const workload = asRecord(input.workload);
  const outcome = asRecord(input.outcome);
  const model = asRecord(input.model);
  const modelInspection = inspectEpochModel(model);

  return {
    version: "epoch_mission_specification.v1",
    model: { ...model, inspection: modelInspection },
    outcome,
    constraints: { hard, soft, unresolved },
    baseline,
    workload,
    readiness: Object.keys(baseline).length === 0
      ? "needs_baseline"
      : hard.length === 0
        ? "needs_constraints"
        : Object.keys(workload).length === 0
          ? "needs_workload"
          : "ready",
    compiledAt: now.toISOString(),
  };
}

export function evaluateEpochConstraints(constraints: EpochMetricConstraint[], measurements: Record<string, unknown>) {
  return constraints.map((constraint) => {
    const actual = typeof measurements[constraint.metric] === "number" ? measurements[constraint.metric] as number : Number(measurements[constraint.metric]);
    const passed = Number.isFinite(actual) && (
      constraint.operator === "<=" ? actual <= constraint.target :
      constraint.operator === ">=" ? actual >= constraint.target :
      constraint.operator === "<" ? actual < constraint.target :
      constraint.operator === ">" ? actual > constraint.target : actual === constraint.target
    );
    return { ...constraint, actual: Number.isFinite(actual) ? actual : null, passed };
  });
}
