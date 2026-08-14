export type EpochPipelineNode = {
  id: string;
  kind: string;
  input: string[];
  output: string[];
  latencyBudgetMs?: number;
  qualityRequirement?: number;
  resources?: { cpu?: number; memoryGb?: number; vramGb?: number; gpu?: boolean };
  failureBehavior?: "fail" | "retry" | "fallback";
  retryLimit?: number;
  security?: { network?: "denied" | "allowlisted"; credentials?: "none" | "scoped" };
};

export type EpochPipelineEdge = { from: string; to: string; contract: string };

export type EpochCompiledPipeline = {
  version: "epoch_pipeline.v1";
  status: "COMPILED" | "INVALID";
  inputs: string[];
  outputs: string[];
  nodes: EpochPipelineNode[];
  edges: EpochPipelineEdge[];
  executionOrder: string[];
  totalLatencyBudgetMs: number | null;
  requiredCapabilities: string[];
  errors: string[];
  warnings: string[];
};

export function compileEpochPipeline(input: { nodes: EpochPipelineNode[]; edges: EpochPipelineEdge[]; inputs?: string[]; outputs?: string[] }): EpochCompiledPipeline {
  const errors: string[] = [];
  const warnings: string[] = [];
  const nodeIds = new Set(input.nodes.map((node) => node.id));
  if (nodeIds.size !== input.nodes.length) errors.push("pipeline node ids must be unique");
  for (const edge of input.edges) {
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) errors.push(`edge references missing node: ${edge.from}->${edge.to}`);
    if (edge.from === edge.to) errors.push(`pipeline self-cycle: ${edge.from}`);
  }
  const indegree = new Map(input.nodes.map((node) => [node.id, 0]));
  const outgoing = new Map(input.nodes.map((node) => [node.id, [] as string[]]));
  for (const edge of input.edges) {
    if (nodeIds.has(edge.from) && nodeIds.has(edge.to) && edge.from !== edge.to) { indegree.set(edge.to, (indegree.get(edge.to) ?? 0) + 1); outgoing.get(edge.from)?.push(edge.to); }
  }
  const queue = [...indegree.entries()].filter(([, degree]) => degree === 0).map(([id]) => id);
  const executionOrder: string[] = [];
  while (queue.length) { const id = queue.shift()!; executionOrder.push(id); for (const next of outgoing.get(id) ?? []) { const degree = (indegree.get(next) ?? 0) - 1; indegree.set(next, degree); if (degree === 0) queue.push(next); } }
  if (executionOrder.length !== input.nodes.length) errors.push("pipeline contains a cycle");
  const incoming = new Set(input.edges.map((edge) => edge.to));
  const outgoingNodes = new Set(input.edges.map((edge) => edge.from));
  const inputs = input.inputs ?? input.nodes.filter((node) => !incoming.has(node.id)).map((node) => node.id);
  const outputs = input.outputs ?? input.nodes.filter((node) => !outgoingNodes.has(node.id)).map((node) => node.id);
  if (!inputs.length || !outputs.length) errors.push("pipeline must have at least one input and output");
  const totalLatencyBudgetMs = input.nodes.every((node) => Number.isFinite(node.latencyBudgetMs)) ? input.nodes.reduce((sum, node) => sum + (node.latencyBudgetMs ?? 0), 0) : null;
  if (totalLatencyBudgetMs === null) warnings.push("one or more nodes have no latency budget");
  const requiredCapabilities = [...new Set(input.nodes.map((node) => node.kind).filter(Boolean))];
  for (const node of input.nodes) if (node.failureBehavior === "retry" && (node.retryLimit ?? 0) < 1) errors.push(`retry node requires retryLimit: ${node.id}`);
  return { version: "epoch_pipeline.v1", status: errors.length ? "INVALID" : "COMPILED", inputs, outputs, nodes: input.nodes, edges: input.edges, executionOrder, totalLatencyBudgetMs, requiredCapabilities, errors, warnings };
}
