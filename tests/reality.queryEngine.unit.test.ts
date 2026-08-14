import { describe, expect, it } from "vitest";
import { RealityQueryEngine } from "../lib/reality/query/RealityQueryEngine";
import type { RealityGraphSnapshot } from "../lib/reality/models/RealityTypes";

describe("RealityQueryEngine", () => {
  it("finds institutional subgraphs with node, edge, and text filters", () => {
    const engine = new RealityQueryEngine();
    const graph: RealityGraphSnapshot = {
      nodes: [
        { id: "reality-fabric", type: "institution", name: "Reality Fabric", state: "healthy", metadata: { role: "core" }, createdAt: "2026-07-27T00:00:00.000Z", updatedAt: "2026-07-27T00:00:00.000Z" },
        { id: "memoryos-core", type: "repository", name: "memoryos-core", state: "healthy", metadata: { provider: "github" }, createdAt: "2026-07-27T00:00:00.000Z", updatedAt: "2026-07-27T00:00:00.000Z" },
        { id: "verification-engine", type: "decision", name: "Verification Engine", state: "warning", metadata: { layer: "verification" }, createdAt: "2026-07-27T00:00:00.000Z", updatedAt: "2026-07-27T00:00:00.000Z" },
        { id: "mission-runtime", type: "mission", name: "Mission Runtime", state: "healthy", metadata: {}, createdAt: "2026-07-27T00:00:00.000Z", updatedAt: "2026-07-27T00:00:00.000Z" },
      ],
      edges: [
        { id: "e1", from: "reality-fabric", to: "memoryos-core", relationship: "tracks", confidence: 0.9, metadata: {}, createdAt: "2026-07-27T00:00:00.000Z" },
        { id: "e2", from: "reality-fabric", to: "mission-runtime", relationship: "projects", confidence: 0.9, metadata: {}, createdAt: "2026-07-27T00:00:00.000Z" },
        { id: "e3", from: "mission-runtime", to: "verification-engine", relationship: "informs", confidence: 0.9, metadata: {}, createdAt: "2026-07-27T00:00:00.000Z" },
      ],
    };
    const evidence = [
      {
        id: "ev-1",
        nodeId: "memoryos-core",
        title: "RuntimeBase migration PR",
        summary: "The team agreed to migrate Reality to RuntimeBase.",
        sourceConnector: "github",
        sourceId: "acme/memoryos#12",
        timestamp: "2026-07-27T00:00:00.000Z",
        author: "sunil",
        workspace: "org-1",
        confidence: 0.95,
        sourceUrl: "https://github.com/acme/memoryos/pull/12",
        metadata: {},
      },
      {
        id: "ev-2",
        nodeId: "mission-runtime",
        title: "Slack discussion",
        summary: "Mission Runtime should be wired before Reality and RuntimeBase.",
        sourceConnector: "slack",
        sourceId: "C123:1710000000.000000",
        timestamp: "2026-07-27T00:00:00.000Z",
        author: "team",
        workspace: "org-1",
        confidence: 0.82,
        metadata: {},
      },
    ];

    const connected = engine.query(graph, {
      nodeType: "repository",
      connectedTo: "reality-fabric",
      relationship: "tracks",
    }, evidence);

    expect(connected.nodes.map((node) => node.id)).toEqual(["memoryos-core"]);
    expect(connected.edges.map((edge) => edge.id)).toEqual(["e1"]);
    expect(connected.answer).toContain("evidence item");
    expect(connected.evidence.map((item) => item.id)).toEqual(["ev-1"]);

    const warningNodes = engine.query(graph, { state: "warning", search: "verification" }, evidence);
    expect(warningNodes.nodes.map((node) => node.id)).toEqual(["verification-engine"]);

    const missionNeighborhood = engine.query(graph, {
      connectedTo: "mission-runtime",
      direction: "any",
      limit: 10,
    }, evidence);
    expect(missionNeighborhood.nodes.map((node) => node.id).sort()).toEqual([
      "reality-fabric",
      "verification-engine",
    ]);
    expect(missionNeighborhood.totalEdges).toBeGreaterThan(0);

    const question = engine.query(graph, { question: "Who decided to migrate to RuntimeBase?" }, evidence);
    expect(question.answer).toContain("github");
    expect(question.evidence.map((item) => item.sourceConnector).sort()).toEqual(["github", "slack"]);
    expect(question.evidence[0]?.sourceUrl).toContain("github.com");

    const missing = engine.query(graph, [], { question: "Show evidence for database sharding on mars" });
    expect(missing.evidence).toHaveLength(0);
    expect(missing.answer).toContain("could not find supporting evidence");
  });
});
