"use client";

import React, { useState } from "react";
import {
  ArrowDown,
  Layers,
  Cpu,
  ShieldCheck,
  Zap,
  Globe,
  Database,
  BarChart3,
  Play,
  CheckCircle2,
  Lock,
  GitBranch,
  RefreshCw,
  Sparkles,
  Search,
  Activity,
  AlertTriangle,
  Info,
  Server,
  Cloud,
  FileCode,
  FileCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EpochLoopGraphProps {
  dark?: boolean;
  onNavigateToStage?: (stageKey: string) => void;
  className?: string;
}

interface LoopNode {
  id: string;
  number: string;
  name: string;
  category: "input" | "reasoning" | "synthesis" | "experiment" | "governance" | "execution" | "verification" | "learning";
  description: string;
  sampleInput: string;
  sampleOutput: string;
  schemaRef: string;
  status: "active" | "monitoring" | "verified" | "gated";
  subBranches?: string[];
}

const LOOP_NODES: LoopNode[] = [
  {
    id: "input_norm",
    number: "01",
    name: "Input Normalization",
    category: "input",
    description: "Wraps text, speech, diagrams, code, or telemetry into an immutable InputEnvelope with cryptographic checksum and provenance.",
    sampleInput: "\"Reduce inference cost by 30% without hurting p99 latency\"",
    sampleOutput: "InputEnvelope { id: 'env-982', modality: 'text', trust: 'USER_ASSERTED', digest: 'sha256:8f4c...' }",
    schemaRef: "schemas/input-envelope.schema.json",
    status: "verified",
  },
  {
    id: "intent_engine",
    number: "02",
    name: "Intent Engine",
    category: "input",
    description: "Extracts objective, hard/soft constraints, target scope, urgency, and requested action boundaries from normalized envelope.",
    sampleInput: "InputEnvelope payload",
    sampleOutput: "Intent { objective: 'COST_REDUCTION', target: '>=30%', constraints: ['quality_non_regression', 'p99<=250ms'] }",
    schemaRef: "schemas/intent.schema.json",
    status: "verified",
  },
  {
    id: "outcome_contract",
    number: "03",
    name: "Outcome Contract",
    category: "reasoning",
    description: "Compiles subjective intent into a measurable, verifiable contract with baselines, success criteria, and verification windows.",
    sampleInput: "Intent object + Historical baseline telemetry",
    sampleOutput: "OutcomeContract { baselineCost: '$182k/mo', targetCost: '<=$127k/mo', maxP99: 250, window: '7d' }",
    schemaRef: "schemas/outcome-contract.schema.json",
    status: "verified",
  },
  {
    id: "mission_runtime",
    number: "04",
    name: "Mission Runtime",
    category: "reasoning",
    description: "Persistent state machine managing dependency resolution, timeouts, retries, compensation plans, and event emission.",
    sampleInput: "OutcomeContract",
    sampleOutput: "MissionState: DISCOVERING → UNKNOWN_ANALYSIS → EXPERIMENTING",
    schemaRef: "schemas/mission.schema.json",
    status: "active",
    subBranches: ["Reality Graph", "Capabilities Fabric", "Knowledge Ledger"],
  },
  {
    id: "unknown_engine",
    number: "05",
    name: "Unknown Engine",
    category: "synthesis",
    description: "Treats uncertainty as a first-class object. Prioritizes unknowns by Decision Impact × Uncertainty ÷ Resolution Cost.",
    sampleInput: "WorldState delta + System requirements",
    sampleOutput: "Unknown { statement: 'AWQ FP8 kernel throughput on L40S under 64 concurrency', strategy: 'BENCHMARK' }",
    schemaRef: "schemas/unknown.schema.json",
    status: "active",
  },
  {
    id: "hypothesis_engine",
    number: "06",
    name: "Hypothesis Engine",
    category: "synthesis",
    description: "Generates and ranks causal candidate hypotheses (H1: model change, H2: batching, H3: GPU quantization, H4: runtime).",
    sampleInput: "Unknown priorities + Reality observations",
    sampleOutput: "Hypotheses: [H1: FP8 + vLLM saves 38% VRAM, H2: SGLang improves TTFT by 22%]",
    schemaRef: "schemas/hypothesis.schema.json",
    status: "active",
  },
  {
    id: "system_composer",
    number: "07",
    name: "System Composer",
    category: "synthesis",
    description: "Composes end-to-end multi-model pipelines (STT → RAG → LLM → TTS) across hardware, runtimes, and placement options.",
    sampleInput: "Hypotheses + Capabilities graph",
    sampleOutput: "CandidateSystems: [Candidate A: Llama-3.1-8B-AWQ on 1x A100, Candidate B: Qwen-2.5-7B on L40S]",
    schemaRef: "schemas/system.schema.json",
    status: "active",
  },
  {
    id: "experiment_engine",
    number: "08",
    name: "Experiment Engine",
    category: "experiment",
    description: "Orchestrates simulation, ephemeral sandboxes, and empirical load sweeps to maximize information gain per compute dollar.",
    sampleInput: "CandidateSystems + Real workload traces",
    sampleOutput: "ExperimentRecord { p95Latency: '38.2ms', tokensSec: 240, vramUsed: '14.2GB', costPer1k: '$0.0008' }",
    schemaRef: "schemas/experiment.schema.json",
    status: "active",
    subBranches: ["Simulation Model", "Sandbox Isolation", "Benchmark Runner"],
  },
  {
    id: "decision_engine",
    number: "09",
    name: "Decision Engine",
    category: "reasoning",
    description: "Computes Pareto frontier over Quality, Latency, and Cost. Recommends the optimal candidate system.",
    sampleInput: "Experiment benchmark outcomes vs OutcomeContract",
    sampleOutput: "Decision: Select Candidate A (Cost -34%, Latency -14ms, Quality retention 100%)",
    schemaRef: "schemas/decision.schema.json",
    status: "verified",
  },
  {
    id: "policy_authority",
    number: "10",
    name: "Policy & Authority Gate",
    category: "governance",
    description: "Evaluates institutional policy rules, blast radius, and autonomy level (L0-L5). Triggers Human Gate if required.",
    sampleInput: "Decision + Institutional Policies + Autonomy Level",
    sampleOutput: "AutomationDecision: L4_BOUNDED_PROD → AUTO_EXECUTE (Canary with instant auto-rollback)",
    schemaRef: "schemas/policy.schema.json",
    status: "verified",
    subBranches: ["Automate (L0-L5)", "Human Gate (Gates A-F)"],
  },
  {
    id: "state_recheck",
    number: "11",
    name: "State Recheck",
    category: "governance",
    description: "Atomic diff check right before execution: Planned WorldState vs Live WorldState. Halts and replans if drifted.",
    sampleInput: "PlannedWorldState vs CurrentWorldState",
    sampleOutput: "Diff: ZERO_MATERIAL_DIFF → EXECUTION_AUTHORIZED",
    schemaRef: "schemas/world-state.schema.json",
    status: "verified",
  },
  {
    id: "execution_fabric",
    number: "12",
    name: "Execution Fabric",
    category: "execution",
    description: "Executes changes via idempotent worker protocols across Software (PR/CI), Cloud (K8s/AWS), and Data Centers.",
    sampleInput: "Authorized execution plan",
    sampleOutput: "Shadow → 1% Canary → 20% → 100% Traffic Shift",
    schemaRef: "schemas/action.schema.json",
    status: "active",
    subBranches: ["Software (PR/CI)", "Cloud (Kubernetes/AWS)", "Data Center / Bare Metal"],
  },
  {
    id: "observation_fabric",
    number: "13",
    name: "Observation Fabric",
    category: "verification",
    description: "Ingests OpenTelemetry metrics, GPU traces, application logs, and synthetic probes during and after execution.",
    sampleInput: "Live production telemetry stream",
    sampleOutput: "Observations { p99: '41.2ms', errorRate: '0.00%', throughput: '312 req/s', vramGb: '14.8' }",
    schemaRef: "schemas/observation.schema.json",
    status: "verified",
  },
  {
    id: "evidence_fabric",
    number: "14",
    name: "Evidence Fabric",
    category: "verification",
    description: "Assembles cryptographic proof bundle linking baseline, interventions, telemetry, and checksums.",
    sampleInput: "Observations + Experiment traces + Git SHAs",
    sampleOutput: "EvidenceBundle { id: 'evi-817', checksum: 'sha256:d94a...', signedBy: 'Ed25519' }",
    schemaRef: "schemas/evidence.schema.json",
    status: "verified",
  },
  {
    id: "independent_verifier",
    number: "15",
    name: "Independent Verifier & Verdict",
    category: "verification",
    description: "Independent verifier verifies that OutcomeContract success criteria are empirically satisfied without executor bias.",
    sampleInput: "EvidenceBundle + OutcomeContract invariants",
    sampleOutput: "Verdict: VERIFIED (Cost reduction: -34.2%, Quality delta: 0.0%, P99: 41.2ms <= 250ms)",
    schemaRef: "schemas/verdict.schema.json",
    status: "verified",
  },
  {
    id: "learning_dynamics",
    number: "16",
    name: "Learning Fabric & Dynamics",
    category: "learning",
    description: "Records deterministic state transitions into permanent institutional memory, feeding updated reality back to step 01.",
    sampleInput: "Initial state + Intervention + Resulting state + Measurements",
    sampleOutput: "LearningRecord { model: 'Llama-3.1-8B', intervention: 'AWQ-FP8', latencyDelta: -34%, costDelta: -48% }",
    schemaRef: "schemas/learning.schema.json",
    status: "verified",
  },
];

export function EpochLoopGraph({
  dark = true,
  onNavigateToStage,
  className,
}: EpochLoopGraphProps) {
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>("outcome_contract");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNodes = LOOP_NODES.filter((n) => {
    if (filterCategory !== "all" && n.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        n.name.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q) ||
        n.schemaRef.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const primaryText = dark ? "text-white" : "text-[#171a17]";
  const secondaryText = dark ? "text-[#889084]" : "text-[#687063]";

  return (
    <div className={cn("space-y-4 font-mono", className)}>
      {/* Top Banner with Loop Definition */}
      <div className={cn(
        "p-4 border border-dashed rounded-xs space-y-2",
        dark ? "border-[#2e2e2e] bg-[#181818]" : "border-[#d8ddd3] bg-[#fafbfa]"
      )}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="bg-[#75bf00] text-black px-2 py-0.5 text-xs font-bold rounded-xs font-sans">
              REALITY LOOP
            </span>
            <h2 className={cn("text-sm font-bold", primaryText)}>
              Continuous Autonomous Outcome Architecture
            </h2>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#788274]">
            <span className="flex items-center gap-1 text-[#75bf00]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#75bf00] animate-pulse" />
              <span>Closed Loop Live</span>
            </span>
            <span>•</span>
            <span>16 Orchestrated Stages</span>
          </div>
        </div>

        <p className={cn("text-xs leading-relaxed font-sans", secondaryText)}>
          Epoch executes a non-stop closed operational cycle: <span className="font-mono text-[#75bf00]">INTENT → OUTCOME → REALITY → UNKNOWN → HYPOTHESIS → CAPABILITY → SYSTEM → EXPERIMENT → DECISION → AUTHORITY → ACTION → OBSERVATION → EVIDENCE → VERIFICATION → LEARNING → UPDATED REALITY</span>.
        </p>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1 text-xs font-mono">
          <span className="text-[#788274] mr-1">Filter:</span>
          {["all", "input", "reasoning", "synthesis", "experiment", "governance", "execution", "verification", "learning"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={cn(
                "px-2.5 py-0.5 rounded-xs capitalize text-[11px] border border-dashed transition-colors",
                filterCategory === cat
                  ? dark ? "bg-[#282828] text-[#75bf00] font-bold border-[#75bf00]" : "bg-[#eaeaea] text-[#111] font-bold border-[#75bf00]"
                  : dark ? "border-transparent text-[#788274] hover:text-white" : "border-transparent text-[#687063] hover:text-black"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <label className={cn(
          "flex items-center gap-2 border border-dashed px-3 py-1.5 text-xs rounded-xs min-w-[240px]",
          dark ? "border-[#2e2e2e] bg-[#202020] text-[#788274]" : "border-[#d8ddd3] bg-white text-[#687063]"
        )}>
          <Search size={13} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stages &amp; contracts..."
            className="w-full bg-transparent focus:outline-none placeholder:text-[#666] font-mono text-xs"
          />
        </label>
      </div>

      {/* Full-Width 16-Stage Architecture Table */}
      <div className={cn(
        "border border-dashed divide-y divide-dashed overflow-hidden rounded-xs",
        dark ? "border-[#2e2e2e] bg-[#202020] divide-[#282828]" : "border-[#d8ddd3] bg-white divide-[#edf0eb]"
      )}>
        {/* Table Header */}
        <div className={cn(
          "grid grid-cols-12 gap-3 px-4 py-2.5 text-[11px] font-mono uppercase tracking-wider font-semibold border-b border-dashed",
          dark ? "border-[#282828] bg-[#181818] text-[#889084]" : "border-[#edf0eb] bg-[#fafbfa] text-[#6b7367]"
        )}>
          <div className="col-span-1 text-center">Stage</div>
          <div className="col-span-3">Architectural Node</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-3">Typed Schema Contract</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {/* Table Rows */}
        {filteredNodes.map((node) => {
          const isExpanded = expandedNodeId === node.id;

          return (
            <div key={node.id} className="transition-colors">
              {/* Summary Row */}
              <div
                onClick={() => setExpandedNodeId(isExpanded ? null : node.id)}
                className={cn(
                  "grid grid-cols-12 gap-3 px-4 py-3.5 items-center cursor-pointer text-xs transition-colors",
                  dark ? "hover:bg-[#232323]" : "hover:bg-[#fafbfa]",
                  isExpanded ? dark ? "bg-[#252525]" : "bg-[#f5f7f3]" : ""
                )}
              >
                {/* 1. Stage Number */}
                <div className="col-span-1 text-center font-mono">
                  <span className={cn(
                    "px-2 py-0.5 border border-dashed rounded-xs text-[10px] font-bold",
                    dark ? "border-[#383838] bg-[#181818] text-[#75bf00]" : "border-[#d8ddd3] bg-[#f8faf6] text-[#2d5800]"
                  )}>
                    {node.number}
                  </span>
                </div>

                {/* 2. Architectural Node Name */}
                <div className="col-span-3 font-mono font-bold text-xs truncate">
                  <span className={primaryText}>{node.name}</span>
                </div>

                {/* 3. Category */}
                <div className="col-span-2 font-mono text-xs">
                  <span className={cn(
                    "px-2 py-0.5 border border-dashed rounded-xs text-[10px] uppercase font-bold",
                    node.category === "input" ? "border-[#60a5fa]/40 bg-[#60a5fa]/10 text-[#60a5fa]" :
                    node.category === "reasoning" ? "border-[#75bf00]/40 bg-[#75bf00]/10 text-[#75bf00]" :
                    node.category === "synthesis" ? "border-[#a78bfa]/40 bg-[#a78bfa]/10 text-[#a78bfa]" :
                    node.category === "experiment" ? "border-[#f59e0b]/40 bg-[#f59e0b]/10 text-[#f59e0b]" :
                    node.category === "governance" ? "border-[#ec4899]/40 bg-[#ec4899]/10 text-[#ec4899]" :
                    node.category === "execution" ? "border-[#38bdf8]/40 bg-[#38bdf8]/10 text-[#38bdf8]" :
                    node.category === "verification" ? "border-[#75bf00]/40 bg-[#75bf00]/10 text-[#75bf00]" :
                    "border-[#818cf8]/40 bg-[#818cf8]/10 text-[#818cf8]"
                  )}>
                    {node.category}
                  </span>
                </div>

                {/* 4. Typed Schema Contract */}
                <div className="col-span-3 font-mono text-xs text-[#788274] truncate flex items-center gap-1.5">
                  <FileCode size={12} className="text-[#75bf00] shrink-0" />
                  <span className="truncate">{node.schemaRef}</span>
                </div>

                {/* 5. Status */}
                <div className="col-span-2 text-center font-mono">
                  <span className={cn(
                    "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-xs font-bold border border-dashed",
                    node.status === "verified"
                      ? "border-[#75bf00]/40 bg-[#75bf00]/10 text-[#75bf00]"
                      : "border-[#60a5fa]/40 bg-[#60a5fa]/10 text-[#60a5fa]"
                  )}>
                    <span className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      node.status === "verified" ? "bg-[#75bf00]" : "bg-[#60a5fa]"
                    )} />
                    <span>{node.status.toUpperCase()}</span>
                  </span>
                </div>

                {/* 6. Actions */}
                <div className="col-span-1 flex items-center justify-end font-mono">
                  <button
                    type="button"
                    className="text-[#788274] hover:text-white p-1"
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {/* In-Row Detailed Stage Inspector */}
              {isExpanded && (
                <div className={cn(
                  "p-5 border-t border-dashed space-y-4 text-xs font-mono",
                  dark ? "bg-[#161616] border-[#2e2e2e]" : "bg-[#fafbfa] border-[#edf0eb]"
                )}>
                  {/* Operational Purpose */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-[#788274] uppercase font-bold tracking-wider">
                      Operational Purpose &amp; Execution Mechanism
                    </span>
                    <p className={cn("text-xs leading-relaxed", primaryText)}>
                      {node.description}
                    </p>
                  </div>

                  {/* Sub-branches if present */}
                  {node.subBranches && node.subBranches.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-[#788274] uppercase font-bold tracking-wider">
                        Operational Pillars / Sub-Branches
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {node.subBranches.map((branch, idx) => (
                          <span
                            key={idx}
                            className={cn(
                              "px-2.5 py-1 text-xs border border-dashed rounded-xs flex items-center gap-1.5 font-bold",
                              dark ? "border-[#75bf00]/40 bg-[#75bf00]/10 text-[#75bf00]" : "border-[#75bf00] bg-[#f5faee] text-[#2d5800]"
                            )}
                          >
                            <span>↳</span>
                            <span>{branch}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Live Payloads Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Input Payload */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-[#788274] uppercase font-bold tracking-wider">
                        Stage Input Payload
                      </span>
                      <div className={cn(
                        "p-3 border border-dashed rounded-xs text-[11px] leading-relaxed overflow-x-auto",
                        dark ? "border-[#282828] bg-[#0c0c0c] text-[#a0a89d]" : "border-[#ddd] bg-[#f9f9f9] text-[#444]"
                      )}>
                        <pre className="whitespace-pre-wrap">{node.sampleInput}</pre>
                      </div>
                    </div>

                    {/* Generated Output */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-[#788274] uppercase font-bold tracking-wider">
                        Generated Output / Artifact
                      </span>
                      <div className={cn(
                        "p-3 border border-dashed rounded-xs text-[11px] leading-relaxed overflow-x-auto",
                        dark ? "border-[#75bf00]/30 bg-[#0d170d] text-[#a3e635]" : "border-[#b9de78] bg-[#f5faee] text-[#2d5800]"
                      )}>
                        <pre className="whitespace-pre-wrap">{node.sampleOutput}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
