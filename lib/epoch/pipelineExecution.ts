import { createHash } from "node:crypto";
import { compileEpochPipeline, type EpochCompiledPipeline, type EpochPipelineNode } from "./pipelineCompiler";
import { classifyEpochRuntimeError, decideEpochRecovery, type EpochRecoveryPolicy } from "./recoveryPolicy";
import { planEpochDiscovery, type EpochDiscoveryPlan } from "./discoveryLoop";

export type EpochPipelineValue = Record<string, unknown>;
export type EpochPipelineNodeContext = { node: EpochPipelineNode; input: EpochPipelineValue; attempt: number; signal: AbortSignal; runId: string };
export type EpochPipelineNodeResult = { output: EpochPipelineValue; metadata?: Record<string, unknown> };
export type EpochPipelineExecutor = (context: EpochPipelineNodeContext) => Promise<EpochPipelineNodeResult>;
export type EpochPipelineEvent = { type: "node_started" | "node_completed" | "node_failed" | "fallback_selected" | "pipeline_completed" | "rediscovery_requested"; runId: string; nodeId?: string; at: string; payload: Record<string, unknown> };
export type EpochPipelineNodeRun = { nodeId: string; status: "completed" | "failed" | "cancelled" | "timed_out"; attempts: number; latencyMs: number; output: EpochPipelineValue | null; error: string | null; recovery: ReturnType<typeof decideEpochRecovery>[] };
export type EpochPipelineExecution = { version: "epoch_pipeline_execution.v1"; runId: string; status: "completed" | "failed" | "cancelled" | "timed_out" | "invalid"; compiled: EpochCompiledPipeline; nodes: EpochPipelineNodeRun[]; outputs: EpochPipelineValue; events: EpochPipelineEvent[]; rediscovery: EpochDiscoveryPlan | null; evidenceSha256: string; startedAt: string; completedAt: string };

class EpochPipelineExecutionError extends Error { constructor(message: string, public readonly code = "PIPELINE_EXECUTION_FAILED") { super(message); this.name = "EpochPipelineExecutionError"; } }

function timeoutSignal(parent: AbortSignal, timeoutMs: number): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const relay = () => controller.abort(parent.reason ?? new Error("cancelled"));
  if (parent.aborted) relay(); else parent.addEventListener("abort", relay, { once: true });
  const timer = setTimeout(() => controller.abort(new Error("timeout")), Math.max(1, timeoutMs));
  return { signal: controller.signal, clear: () => { clearTimeout(timer); parent.removeEventListener("abort", relay); } };
}

function errorText(error: unknown): string { return error instanceof Error ? error.message : typeof error === "string" ? error : "pipeline_node_failed"; }
function boundedAttempts(node: EpochPipelineNode, policy: EpochRecoveryPolicy): number { return Math.max(1, Math.min(10, node.failureBehavior === "retry" ? Math.max(1, node.retryLimit ?? 1) + 1 : policy.maxAttempts)); }
function contractInput(node: EpochPipelineNode, root: EpochPipelineValue, dependencies: Map<string, EpochPipelineNodeResult>): EpochPipelineValue {
  const input: EpochPipelineValue = {};
  if (!dependencies.size) return { ...root };
  for (const key of node.input) {
    if (key in root) input[key] = root[key];
    for (const result of dependencies.values()) if (key in result.output) input[key] = result.output[key];
  }
  return input;
}
function validateOutput(node: EpochPipelineNode, result: EpochPipelineNodeResult): string[] { return node.output.filter((key) => !(key in result.output)).map((key) => `missing_output_contract:${key}`); }
function levels(compiled: EpochCompiledPipeline): string[][] {
  const byId = new Map(compiled.nodes.map((node) => [node.id, node]));
  const incoming = new Map(compiled.nodes.map((node) => [node.id, compiled.edges.filter((edge) => edge.to === node.id).map((edge) => edge.from)]));
  const done = new Set<string>(); const result: string[][] = [];
  while (done.size < compiled.nodes.length) { const level = compiled.executionOrder.filter((id) => !done.has(id) && (incoming.get(id) ?? []).every((dep) => done.has(dep))); if (!level.length) break; result.push(level); level.forEach((id) => done.add(id)); }
  return result;
}

export async function executeEpochPipeline(input: { pipeline: { nodes: EpochPipelineNode[]; edges: EpochCompiledPipeline["edges"]; inputs?: string[]; outputs?: string[] }; input: EpochPipelineValue; executors: Record<string, EpochPipelineExecutor>; fallbackExecutors?: Record<string, EpochPipelineExecutor>; timeoutMs?: number; recoveryPolicy?: Partial<EpochRecoveryPolicy>; signal?: AbortSignal; runId?: string; resume?: { completed: Record<string, EpochPipelineValue> }; onEvent?: (event: EpochPipelineEvent) => void | Promise<void> }): Promise<EpochPipelineExecution> {
  const startedAt = new Date().toISOString(); const runId = input.runId ?? `pipeline-${Date.now()}`; const events: EpochPipelineEvent[] = [];
  const emit = async (event: EpochPipelineEvent) => { events.push(event); await input.onEvent?.(event); };
  const compiled = compileEpochPipeline(input.pipeline); const base: EpochPipelineExecution = { version: "epoch_pipeline_execution.v1", runId, status: "invalid", compiled, nodes: [], outputs: {}, events, rediscovery: null, evidenceSha256: "", startedAt, completedAt: "" };
  if (compiled.status !== "COMPILED") { base.status = "invalid"; base.completedAt = new Date().toISOString(); base.rediscovery = planEpochDiscovery({ trigger: "missing_evidence", failedStage: "pipeline_compile", failureReason: compiled.errors.join(", ") }); base.evidenceSha256 = createHash("sha256").update(JSON.stringify(base)).digest("hex"); return base; }
  const signal = input.signal ?? new AbortController().signal; const policy: EpochRecoveryPolicy = { maxAttempts: 3, allowFallbackWorker: true, allowFallbackProvider: true, allowHumanEscalation: false, ...input.recoveryPolicy };
  const results = new Map<string, EpochPipelineNodeResult>(Object.entries(input.resume?.completed ?? {}).map(([nodeId, output]) => [nodeId, { output }]));
  const runs = new Map<string, EpochPipelineNodeRun>(Object.entries(input.resume?.completed ?? {}).map(([nodeId, output]) => [nodeId, { nodeId, status: "completed", attempts: 0, latencyMs: 0, output, error: null, recovery: [] }]));
  const nodeById = new Map(compiled.nodes.map((node) => [node.id, node]));
  let terminal: "failed" | "cancelled" | "timed_out" | null = null;
  for (const level of levels(compiled)) {
    const pendingLevel = level.filter((nodeId) => !runs.has(nodeId));
    if (!pendingLevel.length) continue;
    if (signal.aborted) { terminal = "cancelled"; break; }
    await Promise.all(pendingLevel.map(async (nodeId) => {
      const node = nodeById.get(nodeId)!; const executor = input.executors[nodeId] ?? input.executors[node.kind]; const fallback = input.fallbackExecutors?.[nodeId] ?? input.fallbackExecutors?.[node.kind]; const run: EpochPipelineNodeRun = { nodeId, status: "failed", attempts: 0, latencyMs: 0, output: null, error: null, recovery: [] }; runs.set(nodeId, run); const started = Date.now();
      if (!executor) { run.error = "executor_not_configured"; terminal = "failed"; await emit({ type: "node_failed", runId, nodeId, at: new Date().toISOString(), payload: { reason: run.error } }); return; }
      let active = executor;
      for (let attempt = 1; attempt <= boundedAttempts(node, policy); attempt++) {
        run.attempts = attempt; if (signal.aborted) { run.status = "cancelled"; run.error = "cancelled"; terminal = "cancelled"; break; }
        await emit({ type: "node_started", runId, nodeId, at: new Date().toISOString(), payload: { attempt } }); const timed = timeoutSignal(signal, Math.min(input.timeoutMs ?? 120_000, node.latencyBudgetMs ?? input.timeoutMs ?? 120_000));
        try {
          const deps = new Map<string, EpochPipelineNodeResult>(); for (const edge of compiled.edges.filter((item) => item.to === nodeId)) { const dependency = results.get(edge.from); if (dependency) deps.set(edge.from, dependency); }
          const result = await active({ node, input: contractInput(node, input.input, deps), attempt, signal: timed.signal, runId }); const contractErrors = validateOutput(node, result);
          if (contractErrors.length) throw new EpochPipelineExecutionError(contractErrors.join(","), "INVALID_OUTPUT_CONTRACT");
          run.status = "completed"; run.output = result.output; run.latencyMs = Date.now() - started; results.set(nodeId, result); await emit({ type: "node_completed", runId, nodeId, at: new Date().toISOString(), payload: { attempt, latencyMs: run.latencyMs, metadata: result.metadata ?? {}, output: result.output } }); break;
        } catch (error) {
          const message = errorText(error); run.error = message; const decision = decideEpochRecovery({ error: message, attempt, policy }); run.recovery.push(decision); if (fallback && decision.action === "fallback_provider") { active = fallback; await emit({ type: "fallback_selected", runId, nodeId, at: new Date().toISOString(), payload: { reason: message } }); }
          if (decision.action === "retry" || decision.action === "fallback_provider") { if (attempt < boundedAttempts(node, policy)) continue; }
          run.status = signal.aborted ? "cancelled" : classifyEpochRuntimeError(message) === "timeout" ? "timed_out" : "failed"; const nodeTerminal = run.status; terminal = nodeTerminal === "timed_out" ? "timed_out" : nodeTerminal === "cancelled" ? "cancelled" : "failed"; await emit({ type: "node_failed", runId, nodeId, at: new Date().toISOString(), payload: { attempt, error: message, recovery: decision } }); break;
        } finally { timed.clear(); }
      }
    }));
    if (terminal) break;
  }
  base.nodes = [...runs.values()]; base.status = terminal ?? "completed"; base.outputs = Object.fromEntries(compiled.outputs.flatMap((id) => { const result = results.get(id); return result ? Object.entries(result.output) : []; })); base.completedAt = new Date().toISOString();
  if (terminal) { const terminalStatus = terminal as "failed" | "cancelled" | "timed_out"; base.rediscovery = planEpochDiscovery({ trigger: terminalStatus === "timed_out" ? "runtime_failure" : "verification_failure", failedStage: "pipeline_execution", failureReason: base.nodes.find((node) => node.status !== "completed")?.error ?? terminalStatus }); await emit({ type: "rediscovery_requested", runId, at: base.completedAt, payload: { trigger: base.rediscovery.trigger, actions: base.rediscovery.actions.length } }); }
  await emit({ type: "pipeline_completed", runId, at: base.completedAt, payload: { status: base.status, nodes: base.nodes.length } }); base.evidenceSha256 = createHash("sha256").update(JSON.stringify({ ...base, events })).digest("hex"); return base;
}
