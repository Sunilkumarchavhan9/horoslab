import type { RealityDecision } from "../decisions/DecisionService";
import type { RealityGraphSnapshot, RealityNode } from "../models/RealityTypes";

export type ImpactSeverity = "low" | "medium" | "high" | "critical";

export interface RealityImpactAssessment {
  id: string;
  subjectId: string;
  subjectType: string;
  affectedSystems: string[];
  dependencies: string[];
  riskLevel: ImpactSeverity;
  predictedImpact: string;
  confidence: number;
  decisionId: string | null;
  createdAt: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function compactId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "impact";
}

function cloneAssessment(assessment: RealityImpactAssessment): RealityImpactAssessment {
  return {
    ...assessment,
    affectedSystems: [...assessment.affectedSystems],
    dependencies: [...assessment.dependencies],
  };
}

function getAdjacency(graph: RealityGraphSnapshot): Map<string, Set<string>> {
  const adjacency = new Map<string, Set<string>>();
  for (const node of graph.nodes) {
    adjacency.set(node.id, new Set());
  }
  for (const edge of graph.edges) {
    const from = adjacency.get(edge.from) ?? new Set<string>();
    from.add(edge.to);
    adjacency.set(edge.from, from);
    const to = adjacency.get(edge.to) ?? new Set<string>();
    to.add(edge.from);
    adjacency.set(edge.to, to);
  }
  return adjacency;
}

function inferRiskLevel(
  node: RealityNode,
  affectedCount: number,
  dependencyCount: number,
  decision: RealityDecision | null,
): ImpactSeverity {
  const baseScore =
    (node.type === "institution" ? 2 : 0) +
    (node.type === "mission" ? 1 : 0) +
    (affectedCount >= 6 ? 3 : affectedCount >= 3 ? 2 : affectedCount > 0 ? 1 : 0) +
    (dependencyCount >= 4 ? 2 : dependencyCount >= 2 ? 1 : 0) +
    (decision?.outcome === "escalate" ? 3 : decision?.outcome === "review" ? 2 : decision?.outcome === "reject" ? 1 : 0);

  if (baseScore >= 7) return "critical";
  if (baseScore >= 5) return "high";
  if (baseScore >= 3) return "medium";
  return "low";
}

function summarizeImpact(node: RealityNode, affectedCount: number, dependencyCount: number, riskLevel: ImpactSeverity): string {
  const affectedText = affectedCount === 1 ? "1 affected system" : `${affectedCount} affected systems`;
  const dependencyText = dependencyCount === 1 ? "1 dependency" : `${dependencyCount} dependencies`;
  return `${node.name} may impact ${affectedText} across ${dependencyText} at ${riskLevel} risk.`;
}

export class ImpactService {
  private readonly seedAssessments: RealityImpactAssessment[];

  private assessments: RealityImpactAssessment[];

  constructor(seedAssessments: RealityImpactAssessment[] = []) {
    this.seedAssessments = seedAssessments.map(cloneAssessment);
    this.assessments = seedAssessments.map(cloneAssessment);
  }

  reset(): void {
    this.assessments = this.seedAssessments.map(cloneAssessment);
  }

  assess(
    graph: RealityGraphSnapshot,
    subjectId: string,
    decision: RealityDecision | null = null,
  ): RealityImpactAssessment | null {
    const subject = graph.nodes.find((node) => node.id === subjectId);
    if (!subject) return null;

    const adjacency = getAdjacency(graph);
    const directlyConnectedIds = [...(adjacency.get(subjectId) ?? new Set<string>())];
    const impactedIds = new Set<string>(directlyConnectedIds);

    for (const edge of graph.edges) {
      if (edge.from === subjectId || edge.to === subjectId) {
        impactedIds.add(edge.from);
        impactedIds.add(edge.to);
      }
    }

    const affectedSystems = graph.nodes
      .filter((node) => impactedIds.has(node.id) && node.id !== subjectId)
      .map((node) => node.name)
      .sort((left, right) => left.localeCompare(right));

    const dependencies = directlyConnectedIds
      .map((id) => graph.nodes.find((node) => node.id === id))
      .filter((node): node is RealityNode => Boolean(node))
      .filter((node) => node.id !== subjectId)
      .map((node) => node.name)
      .sort((left, right) => left.localeCompare(right));

    const riskLevel = inferRiskLevel(subject, affectedSystems.length, dependencies.length, decision);
    const confidence = Math.min(
      1,
      Math.max(
        0.4,
        0.55 +
          affectedSystems.length * 0.06 +
          dependencies.length * 0.05 +
          (decision?.confidence ?? 0.5) * 0.2,
      ),
    );
    const assessment: RealityImpactAssessment = {
      id: `impact-${compactId(subjectId)}-${this.assessments.length + 1}`,
      subjectId,
      subjectType: subject.type,
      affectedSystems,
      dependencies,
      riskLevel,
      predictedImpact: summarizeImpact(subject, affectedSystems.length, dependencies.length, riskLevel),
      confidence: Number(confidence.toFixed(3)),
      decisionId: decision?.id ?? null,
      createdAt: nowIso(),
    };
    this.assessments.unshift(assessment);
    return cloneAssessment(assessment);
  }

  get(assessmentId: string): RealityImpactAssessment | null {
    const assessment = this.assessments.find((entry) => entry.id === assessmentId);
    return assessment ? cloneAssessment(assessment) : null;
  }

  list(): RealityImpactAssessment[] {
    return this.assessments.map(cloneAssessment);
  }

  latest(): RealityImpactAssessment | null {
    return this.assessments[0] ? cloneAssessment(this.assessments[0]) : null;
  }

  summary(): {
    total: number;
    low: number;
    medium: number;
    high: number;
    critical: number;
  } {
    return this.assessments.reduce(
      (acc, assessment) => {
        acc.total += 1;
        acc[assessment.riskLevel] += 1;
        return acc;
      },
      { total: 0, low: 0, medium: 0, high: 0, critical: 0 },
    );
  }
}
