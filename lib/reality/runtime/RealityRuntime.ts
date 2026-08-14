import { GraphEngine } from "../graph/GraphEngine";
import { EventService } from "../events/EventService";
import { ConnectionService } from "../connections/ConnectionService";
import { SourceService } from "../sources/SourceService";
import { DecisionService } from "../decisions/DecisionService";
import { ImpactService } from "../impacts/ImpactService";
import { APIWatchEngine } from "../watchers/APIWatchEngine";
import { RealityQueryEngine } from "../query/RealityQueryEngine";
import { EvidenceService } from "../evidence/EvidenceService";
import { RuntimeBase } from "../../runtime/RuntimeBase";
import type { RuntimeBusSubscription, RuntimeContext } from "../../runtime/RuntimeBus";
import { createRealityDomainEvent, type RealityDomainEvent, type RealityDomainEventType, type RealityDomainEventPayloadMap } from "../events/RealityDomainEvents";
import { InMemoryGraphRepository } from "../repositories/memory/InMemoryGraphRepository";
import { createMemoryEventRepository } from "../repositories/memory/InMemoryEventRepository";
import { createMemoryConnectionRepository } from "../repositories/memory/InMemoryConnectionRepository";
import { createMemorySourceRepository } from "../repositories/memory/InMemorySourceRepository";
import { createMemoryDecisionRepository } from "../repositories/memory/InMemoryDecisionRepository";
import { createMemoryEvidenceRepository } from "../repositories/memory/InMemoryEvidenceRepository";
import type {
  RealityEdge,
  RealityEvidence,
  RealityEvent,
  RealityGraphSnapshot,
  RealityNode,
  RealityNodeState,
  RealityNodeType,
} from "../models/RealityTypes";

const DEFAULT_GRAPH: RealityGraphSnapshot = {
  nodes: [
    {
      id: "reality-fabric",
      type: "institution",
      name: "Reality Fabric",
      state: "healthy",
      metadata: {
        role: "core backend graph",
        projections: [
          "graph",
          "connections",
          "sources",
          "events",
          "impact",
          "watcher",
          "decisions",
        ],
      },
      createdAt: "2026-07-27T00:00:00.000Z",
      updatedAt: "2026-07-27T00:00:00.000Z",
    },
    {
      id: "institution",
      type: "institution",
      name: "Institution",
      state: "healthy",
      metadata: { layer: "governance" },
      createdAt: "2026-07-27T00:00:00.000Z",
      updatedAt: "2026-07-27T00:00:00.000Z",
    },
    {
      id: "governance",
      type: "policy",
      name: "Governance",
      state: "healthy",
      metadata: { layer: "policy" },
      createdAt: "2026-07-27T00:00:00.000Z",
      updatedAt: "2026-07-27T00:00:00.000Z",
    },
    {
      id: "mission-runtime",
      type: "mission",
      name: "Mission Runtime",
      state: "healthy",
      metadata: { layer: "operations" },
      createdAt: "2026-07-27T00:00:00.000Z",
      updatedAt: "2026-07-27T00:00:00.000Z",
    },
    {
      id: "execution-runtime",
      type: "worker",
      name: "Execution Runtime",
      state: "healthy",
      metadata: { layer: "execution" },
      createdAt: "2026-07-27T00:00:00.000Z",
      updatedAt: "2026-07-27T00:00:00.000Z",
    },
    {
      id: "evidence-index",
      type: "evidence",
      name: "Evidence Index",
      state: "healthy",
      metadata: { layer: "proof" },
      createdAt: "2026-07-27T00:00:00.000Z",
      updatedAt: "2026-07-27T00:00:00.000Z",
    },
    {
      id: "verification-engine",
      type: "decision",
      name: "Verification Engine",
      state: "warning",
      metadata: { layer: "verification" },
      createdAt: "2026-07-27T00:00:00.000Z",
      updatedAt: "2026-07-27T00:00:00.000Z",
    },
    {
      id: "settlement-ledger",
      type: "decision",
      name: "Settlement Ledger",
      state: "healthy",
      metadata: { layer: "settlement" },
      createdAt: "2026-07-27T00:00:00.000Z",
      updatedAt: "2026-07-27T00:00:00.000Z",
    },
    {
      id: "memoryos-core",
      type: "repository",
      name: "memoryos-core",
      state: "healthy",
      metadata: { provider: "github", visibility: "private" },
      createdAt: "2026-07-27T00:00:00.000Z",
      updatedAt: "2026-07-27T00:00:00.000Z",
    },
    {
      id: "api-watch",
      type: "watcher",
      name: "API Watch Engine",
      state: "healthy",
      metadata: { trackedProviders: ["stripe", "github", "openai", "aws"] },
      createdAt: "2026-07-27T00:00:00.000Z",
      updatedAt: "2026-07-27T00:00:00.000Z",
    },
    {
      id: "source-graph",
      type: "source",
      name: "Source Service",
      state: "healthy",
      metadata: { connectors: ["github", "slack", "jira", "drive"] },
      createdAt: "2026-07-27T00:00:00.000Z",
      updatedAt: "2026-07-27T00:00:00.000Z",
    },
    {
      id: "reality-event-store",
      type: "event",
      name: "Reality Event Store",
      state: "healthy",
      metadata: { retention: "immutable" },
      createdAt: "2026-07-27T00:00:00.000Z",
      updatedAt: "2026-07-27T00:00:00.000Z",
    },
  ],
  edges: [
    {
      id: "edge-institution-governance",
      from: "institution",
      to: "governance",
      relationship: "governs",
      confidence: 0.99,
      metadata: {},
      createdAt: "2026-07-27T00:00:00.000Z",
    },
    {
      id: "edge-governance-fabric",
      from: "governance",
      to: "reality-fabric",
      relationship: "directs",
      confidence: 0.97,
      metadata: {},
      createdAt: "2026-07-27T00:00:00.000Z",
    },
    {
      id: "edge-fabric-mission",
      from: "reality-fabric",
      to: "mission-runtime",
      relationship: "projects",
      confidence: 0.96,
      metadata: {},
      createdAt: "2026-07-27T00:00:00.000Z",
    },
    {
      id: "edge-mission-execution",
      from: "mission-runtime",
      to: "execution-runtime",
      relationship: "executes",
      confidence: 0.95,
      metadata: {},
      createdAt: "2026-07-27T00:00:00.000Z",
    },
    {
      id: "edge-execution-evidence",
      from: "execution-runtime",
      to: "evidence-index",
      relationship: "generates",
      confidence: 0.94,
      metadata: {},
      createdAt: "2026-07-27T00:00:00.000Z",
    },
    {
      id: "edge-evidence-verification",
      from: "evidence-index",
      to: "verification-engine",
      relationship: "informs",
      confidence: 0.93,
      metadata: {},
      createdAt: "2026-07-27T00:00:00.000Z",
    },
    {
      id: "edge-verification-settlement",
      from: "verification-engine",
      to: "settlement-ledger",
      relationship: "settles",
      confidence: 0.92,
      metadata: {},
      createdAt: "2026-07-27T00:00:00.000Z",
    },
    {
      id: "edge-fabric-repo",
      from: "reality-fabric",
      to: "memoryos-core",
      relationship: "tracks",
      confidence: 0.9,
      metadata: { source: "repository-sync" },
      createdAt: "2026-07-27T00:00:00.000Z",
    },
    {
      id: "edge-fabric-watch",
      from: "reality-fabric",
      to: "api-watch",
      relationship: "monitors",
      confidence: 0.91,
      metadata: { source: "api-monitor" },
      createdAt: "2026-07-27T00:00:00.000Z",
    },
    {
      id: "edge-source-evidence",
      from: "source-graph",
      to: "evidence-index",
      relationship: "feeds",
      confidence: 0.9,
      metadata: { source: "connector-sync" },
      createdAt: "2026-07-27T00:00:00.000Z",
    },
    {
      id: "edge-event-fabric",
      from: "reality-event-store",
      to: "reality-fabric",
      relationship: "records",
      confidence: 0.94,
      metadata: {},
      createdAt: "2026-07-27T00:00:00.000Z",
    },
  ],
};

function isNodeState(value: unknown): value is RealityNodeState {
  return value === "healthy" || value === "warning" || value === "critical" || value === "offline";
}

const REALITY_RUNTIME_CONTEXT: RuntimeContext = {
  institutionId: "reality-fabric",
  workspaceId: "memoryos-core",
  missionId: "reality-runtime",
  actorId: "system",
  requestId: "reality-runtime",
  sessionId: "reality-runtime",
  traceId: "reality-runtime",
};

class RealityRuntimeImpl extends RuntimeBase<RealityDomainEvent> {
  id = "reality-runtime";

  private readonly seedGraph: RealityGraphSnapshot;

  private readonly graphRepository: InMemoryGraphRepository;

  private graphEngine: GraphEngine;

  private readonly eventService: EventService;

  private readonly connectionService: ConnectionService;

  private readonly sourceService: SourceService;

  private readonly decisionService: DecisionService;

  private readonly impactService: ImpactService;

  private readonly apiWatchEngine: APIWatchEngine;

  private readonly evidenceService: EvidenceService;

  private readonly queryEngine: RealityQueryEngine;

  private readonly runtimeBusSubscriptions: RuntimeBusSubscription[] = [];

  private seedApiWatchTargets(): void {
    for (const watcherNode of DEFAULT_GRAPH.nodes.filter((node) => node.type === "watcher")) {
      const trackedProviders = watcherNode.metadata.trackedProviders;
      if (!Array.isArray(trackedProviders)) continue;
      for (const provider of trackedProviders) {
        if (typeof provider !== "string" || provider.trim().length === 0) continue;
        this.apiWatchEngine.watch(provider, { watcherNodeId: watcherNode.id, seededFrom: watcherNode.name });
      }
    }
  }

  private seedConnectorState(): void {
    const connectors = [
      { system: "GitHub", metadata: { provider: "github", kind: "repository", volume: "52 repos" }, documentsIndexed: 52 },
      { system: "Slack", metadata: { provider: "slack", kind: "channel", volume: "18 channels" }, documentsIndexed: 18 },
      { system: "Jira", metadata: { provider: "jira", kind: "ticket", volume: "42 issues" }, documentsIndexed: 42 },
      { system: "Notion", metadata: { provider: "notion", kind: "document", volume: "21 pages" }, documentsIndexed: 21 },
    ];

    for (const connector of connectors) {
      this.connectSystem(connector.system, connector.metadata);
      const source = this.registerSource(connector.system, connector.metadata);
      this.indexSource(source.id, connector.documentsIndexed);
    }
  }

  private installRuntimeBus(): void {
    this.runtimeBusSubscriptions.push(
      this.runtimeBus.subscribe(
        (event) => {
          if (event.type !== "DecisionCreated") return;
          const decisionEvent = event as RealityDomainEvent<"DecisionCreated">;
          const impact = this.impactService.assess(
            this.graphEngine.snapshot(),
            decisionEvent.payload.decision.subjectId,
            decisionEvent.payload.decision,
          );
          if (!impact) return;
          this.runtimeBus.publish(
            createRealityDomainEvent(
              this.id,
              "ImpactCalculated",
              { impact },
              { correlationId: decisionEvent.correlationId ?? decisionEvent.id, causationId: decisionEvent.id },
            ),
          );
        },
        { type: "DecisionCreated", runtime: this.id },
      ),
    );
  }

  private publishDomainEvent<TType extends RealityDomainEventType>(
    type: TType,
    payload: RealityDomainEventPayloadMap[TType],
    causationId?: string,
    correlationId?: string,
  ) {
    const event = createRealityDomainEvent(this.id, type, payload, {
      correlationId,
      causationId,
    });
    return this.runtimeBus.publish(event);
  }

  constructor() {
    super({
      runtimeName: "reality-runtime",
      runtimeContext: REALITY_RUNTIME_CONTEXT,
    });
    this.seedGraph = {
      nodes: DEFAULT_GRAPH.nodes.map((node) => ({ ...node, metadata: { ...node.metadata } })),
      edges: DEFAULT_GRAPH.edges.map((edge) => ({ ...edge, metadata: { ...edge.metadata } })),
    };
    this.graphRepository = new InMemoryGraphRepository(this.seedGraph);
    this.graphEngine = new GraphEngine(this.graphRepository);
    this.eventService = new EventService(createMemoryEventRepository());
    this.connectionService = new ConnectionService(createMemoryConnectionRepository());
    this.sourceService = new SourceService(createMemorySourceRepository());
    this.decisionService = new DecisionService(createMemoryDecisionRepository());
    this.impactService = new ImpactService();
    this.apiWatchEngine = new APIWatchEngine();
    this.evidenceService = new EvidenceService(createMemoryEvidenceRepository());
    this.queryEngine = new RealityQueryEngine();
    this.seedConnectorState();
    this.installRuntimeBus();
    this.seedApiWatchTargets();
  }

  resetForTests(): void {
    this.runtimeBus.clear();
    this.runtimeBusSubscriptions.length = 0;
    this.graphEngine.reset(this.seedGraph);
    this.eventService.reset();
    this.connectionService.reset();
    this.sourceService.reset();
    this.decisionService.reset();
    this.impactService.reset();
    this.apiWatchEngine.reset();
    this.evidenceService.reset();
    this.seedConnectorState();
    this.installRuntimeBus();
    this.seedApiWatchTargets();
  }

  getNode(nodeId: string): RealityNode | null {
    return this.graphEngine.getNode(nodeId);
  }

  getNeighbors(nodeId: string) {
    return this.graphEngine.neighbors(nodeId);
  }

  listNodes(): RealityNode[] {
    return this.graphEngine.listNodes();
  }

  listEdges(): RealityEdge[] {
    return this.graphEngine.listEdges();
  }

  search(query: string): RealityNode[] {
    return this.graphEngine.search(query);
  }

  traverse(startId: string, options?: { depthLimit?: number }): RealityNode[] {
    return this.graphEngine.traverse(startId, options);
  }

  findPath(from: string, to: string): RealityNode[] {
    return this.graphEngine.shortestPath(from, to);
  }

  validateGraph(): { valid: boolean; errors: string[] } {
    return this.graphEngine.validateGraph();
  }

  queryReality(input: {
    question?: string;
    nodeType?: RealityNodeType | RealityNodeType[];
    state?: RealityNodeState | RealityNodeState[];
    search?: string;
    connectedTo?: string;
    relationship?: string | string[];
    direction?: "incoming" | "outgoing" | "any";
    limit?: number;
  }) {
    return this.queryEngine.query(this.graphEngine.snapshot(), this.evidenceService.list(), input);
  }

  createNode(input: {
    type: RealityNodeType;
    name: string;
    state?: RealityNodeState;
    metadata?: Record<string, unknown>;
  }): RealityNode {
    const node = this.graphEngine.createNode({
      ...input,
      ...(isNodeState(input.state) ? { state: input.state } : {}),
    });
    this.publishDomainEvent("RealityNodeCreated", { node });
    return node;
  }

  updateNode(
    nodeId: string,
    input: Partial<Pick<RealityNode, "name" | "type" | "state" | "metadata">>,
  ): RealityNode | null {
    const previousNode = this.graphEngine.getNode(nodeId);
    const updated = this.graphEngine.updateNode(nodeId, input);
    if (updated) {
      this.publishDomainEvent("RealityNodeUpdated", { node: updated, previousNode });
    }
    return updated;
  }

  deleteNode(nodeId: string): boolean {
    const existing = this.graphEngine.getNode(nodeId);
    const removed = this.graphEngine.removeNode(nodeId);
    if (removed) {
      this.publishDomainEvent("RealityNodeDeleted", { nodeId: existing?.id ?? nodeId });
    }
    return removed;
  }

  connect(input: {
    from: string;
    to: string;
    relationship: string;
    confidence?: number;
    metadata?: Record<string, unknown>;
  }): RealityEdge | null {
    const edge = this.graphEngine.connect(input);
    if (edge) {
      this.publishDomainEvent("RealityEdgeCreated", { edge });
    }
    return edge;
  }

  disconnect(edgeId: string): boolean {
    const edge = this.graphEngine.getEdge(edgeId);
    const removed = this.graphEngine.disconnect(edgeId);
    if (removed) {
      this.publishDomainEvent("RealityEdgeDeleted", { edgeId, edge });
    }
    return removed;
  }

  listConnections() {
    return this.connectionService.list();
  }

  connectionHealth(connectionId: string) {
    return this.connectionService.health(connectionId);
  }

  connectSystem(system: string, metadata: Record<string, unknown> = {}) {
    const connection = this.connectionService.connectSystem(system, metadata);
    this.publishDomainEvent("ConnectionHealthy", { connection });
    return connection;
  }

  syncConnection(connectionId: string) {
    const connection = this.connectionService.sync(connectionId);
    if (connection) {
      this.publishDomainEvent("ConnectionHealthy", { connection });
    }
    return connection;
  }

  connectionSummary() {
    return this.connectionService.summary();
  }

  appendEvent(input: {
    nodeId: string;
    type: string;
    payload?: Record<string, unknown>;
    source?: string;
  }): RealityEvent | null {
    if (!this.graphEngine.getNode(input.nodeId)) {
      return null;
    }
    const event = this.eventService.append(input);
    this.publishDomainEvent("RealityEventRecorded", { event });
    return event;
  }

  listEvents(limit = 100): RealityEvent[] {
    return this.eventService.list(limit);
  }

  replayEvents(filter?: {
    nodeId?: string;
    type?: string;
    source?: string;
    since?: string;
    until?: string;
  }) {
    return this.eventService.replay(filter);
  }

  subscribeEvents(
    listener: (event: RealityEvent) => void,
    filter?: {
      nodeId?: string;
      type?: string;
      source?: string;
      since?: string;
      until?: string;
    },
  ) {
    return this.eventService.subscribe(listener, filter);
  }

  eventSnapshot() {
    return this.eventService.snapshot();
  }

  recordEvidence(input: {
    nodeId: string;
    title: string;
    summary: string;
    sourceConnector: string;
    sourceId: string;
    author: string;
    workspace: string;
    confidence?: number;
    sourceUrl?: string;
    timestamp?: string;
    metadata?: Record<string, unknown>;
  }) {
    const evidence = this.evidenceService.record(input);
    const node = this.graphEngine.getNode(input.nodeId);
    if (node) {
      const nodeMetadata = node.metadata as Record<string, unknown> & { evidenceIds?: string[] };
      const existingEvidenceIds = Array.isArray(node.evidenceIds)
        ? node.evidenceIds
        : Array.isArray(nodeMetadata.evidenceIds)
          ? nodeMetadata.evidenceIds
          : [];
      this.graphEngine.updateNode(input.nodeId, {
        metadata: {
          ...node.metadata,
          sourceConnector: input.sourceConnector,
          sourceId: input.sourceId,
          timestamp: input.timestamp ?? evidence.timestamp,
          author: input.author,
          workspace: input.workspace,
          confidence: input.confidence ?? evidence.confidence,
          evidenceIds: Array.from(new Set([...existingEvidenceIds, evidence.id])),
        },
        sourceConnector: input.sourceConnector,
        sourceId: input.sourceId,
        timestamp: input.timestamp ?? evidence.timestamp,
        author: input.author,
        workspace: input.workspace,
        confidence: input.confidence ?? evidence.confidence,
        evidenceIds: Array.from(new Set([...existingEvidenceIds, evidence.id])),
      });
    }
    return evidence;
  }

  getEvidence(evidenceId: string): RealityEvidence | null {
    return this.evidenceService.get(evidenceId);
  }

  listEvidence(limit = 100): RealityEvidence[] {
    return this.evidenceService.list().slice(0, Math.max(1, Math.floor(limit)));
  }

  listRuntimeEvents(limit = 100) {
    return this.runtimeBus.replay().slice(-Math.max(1, Math.floor(limit)));
  }

  listSources() {
    return this.sourceService.list();
  }

  registerSource(system: string, metadata: Record<string, unknown> = {}) {
    const source = this.sourceService.register(system, metadata);
    this.publishDomainEvent("SourceRegistered", { source });
    return source;
  }

  syncSource(sourceId: string) {
    const source = this.sourceService.sync(sourceId);
    if (source) {
      this.publishDomainEvent("SourceSynced", { source });
    }
    return source;
  }

  indexSource(sourceId: string, documentsIndexed = 1) {
    const source = this.sourceService.index(sourceId, documentsIndexed);
    if (source) {
      this.publishDomainEvent("SourceIndexed", { source });
    }
    return source;
  }

  sourceStatus(sourceId: string) {
    return this.sourceService.status(sourceId);
  }

  sourceSummary() {
    return this.sourceService.summary();
  }

  recordDecision(input: {
    subjectId: string;
    subjectType: string;
    outcome: "approve" | "reject" | "review" | "escalate";
    reason: string;
    evidenceIds?: string[];
    impactIds?: string[];
    confidence?: number;
    createdBy?: string;
  }) {
    const decision = this.decisionService.record(input);
    this.publishDomainEvent("DecisionCreated", { decision });
    return decision;
  }

  evaluateDecision(input: {
    subjectId: string;
    subjectType: string;
    evidenceIds?: string[];
    impactIds?: string[];
    reason: string;
    confidence?: number;
    createdBy?: string;
  }) {
    const decision = this.decisionService.evaluate(input);
    this.publishDomainEvent("DecisionCreated", { decision });
    return decision;
  }

  listDecisions() {
    return this.decisionService.list();
  }

  decisionSummary() {
    return this.decisionService.summary();
  }

  assessImpact(subjectId: string, decisionId?: string) {
    const decision = decisionId ? this.decisionService.get(decisionId) : this.decisionService.latest();
    const impact = this.impactService.assess(this.graphEngine.snapshot(), subjectId, decision);
    if (impact) {
      this.publishDomainEvent("ImpactCalculated", { impact });
    }
    return impact;
  }

  listImpacts() {
    return this.impactService.list();
  }

  impactSummary() {
    return this.impactService.summary();
  }

  listApiWatchTargets() {
    return this.apiWatchEngine.list();
  }

  watchApi(provider: string, metadata: Record<string, unknown> = {}) {
    return this.apiWatchEngine.watch(provider, metadata);
  }

  checkApiWatch(input: {
    provider: string;
    state?: "healthy" | "degraded" | "offline" | "monitoring";
    metadata?: Record<string, unknown>;
  }) {
    return this.apiWatchEngine.check(input);
  }

  apiWatchSummary() {
    return this.apiWatchEngine.summary();
  }

  getSnapshot(): { nodes: RealityNode[]; edges: RealityEdge[]; events: RealityEvent[] } {
    return {
      nodes: this.listNodes(),
      edges: this.listEdges(),
      events: this.listEvents(1000),
    };
  }

  getStatus() {
    const countsByType = this.graphEngine.serializeForStatus().countsByType;
    const latestEvent = this.listEvents(1)[0] ?? null;

    return {
      backend: "reality-fabric",
      version: "reality-runtime.v1",
      nodes: this.graphEngine.getNodeCount(),
      edges: this.graphEngine.getEdgeCount(),
      events: this.eventService.count(),
      countsByType,
      latestEvent: latestEvent ?? this.eventService.latest(),
      seededAt: DEFAULT_GRAPH.nodes[0]?.createdAt ?? new Date().toISOString(),
      validation: this.graphEngine.validateGraph(),
    };
  }
}

export const RealityRuntime = new RealityRuntimeImpl();
export type RealityRuntimeType = RealityRuntimeImpl;
