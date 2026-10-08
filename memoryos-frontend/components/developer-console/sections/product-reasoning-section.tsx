"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BrainCircuit,
  ClipboardCheck,
  FileText,
  GitBranch,
  Lightbulb,
  Grid2X2,
  Search,
  Target,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export type ReasoningOverview = {
  project: string | null;
  totalReasoningChains: number;
  agentReadyCount?: number;
  blockedCount?: number;
  riskSignalCount?: number;
  requiredTestCount?: number;
  averageReasoningQuality?: number;
  traceProofCoverage: number;
  graph: {
    nodes: Array<{ id: string; kind: string; label: string; reasoningId?: string }>;
    edges: Array<{ from: string; to: string; type: string; reasoningId?: string }>;
  };
  chains: Array<{
    id: string;
    task: string;
    customerPain: string;
    productPriority: string;
    executionContext: string;
    sourceType: string;
    sourceRef: string;
    evidence: string[];
    impactedFiles: string[];
    assumptions?: string[];
    decisionPoints?: string[];
    riskSignals?: string[];
    requiredTests?: string[];
    nextActions?: string[];
    linkedExperiences: Array<{
      id: string;
      task: string;
      sourceRef: string;
      status: string;
    }>;
    reasoningQuality?: {
      score: number;
      status: "agent_ready" | "usable" | "weak" | "blocked";
      agentReady: boolean;
      reasons: string[];
      gaps: string[];
    };
    confidence: number;
    updatedAt: string;
  }>;
  agentBriefAdditions: Array<{
    task: string;
    taskReason: string;
    customerOrProductContext: string;
    executionContext: string;
    reasoningQuality?: ReasoningOverview["chains"][number]["reasoningQuality"];
    riskSignals?: string[];
    requiredTests?: string[];
    recommendedBriefLine: string;
  }>;
};

export type ReasoningAgentBrief = {
  traceId: string;
  generatedAt: string;
  project: string | null;
  targetAgent: string;
  reasoningChain: ReasoningOverview["chains"][number];
  memoryIgnitionBrief: {
    task: string;
    reasoning: {
      whyThisMatters: string;
      customerOrProductContext: string;
      executionContext: string;
      assumptions?: string[];
      decisionPoints?: string[];
      quality?: ReasoningOverview["chains"][number]["reasoningQuality"];
    };
    context: string[];
    memories: Array<{
      id: string;
      summary: string;
      type: string;
      sourceRef: string | null;
      confidence: number;
      proofQuality?: unknown;
    }>;
    experiences: unknown[];
    approvedSkills: unknown[];
    riskRules: string[];
    approvalRules: string[];
    requiredTests: string[];
    impactedFiles: string[];
    nextActions?: string[];
    recommendedFirstAction: string;
    traceProof: Array<{
      source: string;
      memory_id: string;
      source_type?: string;
      source_ref?: string;
      evidence?: string[];
      confidence?: number;
      lineage?: string[];
    }>;
    linkedExperiences: Array<{
      id: string;
      task: string;
      sourceRef: string;
      status: string;
    }>;
    outcomeHooks: string[];
    markdown: string;
  };
};

type ProductReasoningSectionProps = {
  overview?: ReasoningOverview | null;
  isLoading?: boolean;
  onGenerateAgentBrief?: (input: { reasoningId: string; task: string }) => Promise<ReasoningAgentBrief>;
  onOpenExperience?: (experienceId: string) => void;
};

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function compactGraphId(value: string) {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > 34 ? `${text.slice(0, 34)}...` : text;
}

function graphNodeLabel(node: ReasoningOverview["graph"]["nodes"][number]) {
  return `${node.kind} · ${compactGraphId(node.label)}`;
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

export function ProductReasoningSection({
  overview,
  onGenerateAgentBrief,
  onOpenExperience,
}: ProductReasoningSectionProps) {
  const chains = overview?.chains ?? [];
  const briefAdditions = overview?.agentBriefAdditions ?? [];
  const [generatedBrief, setGeneratedBrief] = useState<ReasoningAgentBrief | null>(null);
  const [generatingBriefId, setGeneratingBriefId] = useState<string | null>(null);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
  const [chainSearch, setChainSearch] = useState("");
  const [selectedGraphNodeId, setSelectedGraphNodeId] = useState<string | null>(null);
  const graphNodes = overview?.graph.nodes ?? [];
  const graphEdges = overview?.graph.edges ?? [];
  const visibleChains = useMemo(() => {
    const query = normalizeSearch(chainSearch);
    if (!query) return chains;
    return chains.filter((chain) => {
      const haystack = [
        chain.task,
        chain.customerPain,
        chain.productPriority,
        chain.executionContext,
        chain.sourceType,
        chain.sourceRef,
        ...(chain.assumptions ?? []),
        ...(chain.decisionPoints ?? []),
        ...(chain.riskSignals ?? []),
        ...(chain.requiredTests ?? []),
        ...(chain.nextActions ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [chains, chainSearch]);
  const selectedChain = useMemo(
    () => visibleChains.find((chain) => chain.id === selectedChainId) ?? visibleChains[0] ?? null,
    [selectedChainId, visibleChains],
  );
  const selectedReasoningId = selectedChain?.id ?? null;
  const focusedGraphNodes = useMemo(
    () => (selectedReasoningId ? graphNodes.filter((node) => node.reasoningId === selectedReasoningId) : graphNodes),
    [graphNodes, selectedReasoningId],
  );
  const focusedGraphEdges = useMemo(
    () => (selectedReasoningId ? graphEdges.filter((edge) => edge.reasoningId === selectedReasoningId) : graphEdges),
    [graphEdges, selectedReasoningId],
  );
  const selectedGraphNode = useMemo(
    () =>
      focusedGraphNodes.find((node) => node.id === selectedGraphNodeId) ??
      focusedGraphNodes[0] ??
      null,
    [focusedGraphNodes, selectedGraphNodeId],
  );

  useEffect(() => {
    if (!selectedGraphNodeId) return;
    if (!focusedGraphNodes.some((node) => node.id === selectedGraphNodeId)) {
      setSelectedGraphNodeId(null);
    }
  }, [focusedGraphNodes, selectedGraphNodeId]);

  async function generateAgentBrief(chain: ReasoningOverview["chains"][number]) {
    if (!onGenerateAgentBrief) return;
    setGeneratingBriefId(chain.id);
    setBriefError(null);
    try {
      const brief = await onGenerateAgentBrief({ reasoningId: chain.id, task: chain.task });
      setGeneratedBrief(brief);
    } catch (error) {
      setBriefError(error instanceof Error ? error.message : "Could not generate agent brief.");
    } finally {
      setGeneratingBriefId(null);
    }
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-white text-[#111827]">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 pb-8 pt-4 sm:px-6">
        <header className="border-b border-[#e5e7eb] pb-4">
          <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.035em] text-[#050505]">
            Work Graph
          </h1>
          <p className="mt-2 max-w-3xl text-[13px] leading-5 text-[#697386]">
            Phase 2.5 connects customer pain, product priority, engineering task, and execution context into an agent-ready work graph.
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Reasoning chains", value: String(overview?.totalReasoningChains ?? 0), icon: GitBranch },
            { label: "Agent ready", value: String(overview?.agentReadyCount ?? 0), icon: ClipboardCheck },
            { label: "Reasoning quality", value: overview?.averageReasoningQuality ? `${overview.averageReasoningQuality}/100` : "0/100", icon: BrainCircuit },
            { label: "Trace proof coverage", value: `${overview?.traceProofCoverage ?? 0}%`, icon: Grid2X2 },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label} className="rounded-[4px] border-[#e5e7eb] bg-white py-0 shadow-none ring-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] text-[#697386]">{label}</p>
                  <Icon className="size-4 text-[#4b5563]" strokeWidth={1.8} />
                </div>
                <p className="mt-7 text-[28px] font-medium leading-none tracking-[-0.04em] text-[#050505]">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <Card className="rounded-[4px] border-[#e5e7eb] bg-white py-0 shadow-none ring-0">
            <CardHeader className="border-b border-[#eef0f3] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-[13px] font-medium text-[#111827]">Work graph chains</CardTitle>
                  <CardDescription className="text-[12px] text-[#697386]">
                    customer pain -&gt; product priority -&gt; task -&gt; execution context
                  </CardDescription>
                </div>
                <div className="flex min-w-[240px] items-center gap-2 border border-[#e5e7eb] bg-white px-3 py-2">
                  <Search className="size-4 text-[#8a94a6]" />
                  <input
                    value={chainSearch}
                    onChange={(event) => setChainSearch(event.target.value)}
                    placeholder="Search reasoning chains"
                    className="w-full bg-transparent text-[12px] text-[#111827] outline-none placeholder:text-[#8a94a6]"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {visibleChains.length > 0 ? (
                <ScrollArea className="max-h-[620px]">
                  <div className="divide-y divide-[#eef0f3]">
                    {visibleChains.map((chain) => {
                      const linkedExperiences = chain.linkedExperiences ?? [];
                      return (
                        <div
                          key={chain.id}
                          onClick={() => setSelectedChainId(chain.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setSelectedChainId(chain.id);
                            }
                          }}
                          aria-pressed={selectedChain?.id === chain.id}
                          className="block w-full p-4 text-left transition hover:bg-[#fafafa] focus:outline-none"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex items-center gap-2 text-[11px] text-[#8a94a6]">
                              <Badge variant="outline" className="rounded-[3px] border-[#e5e7eb] bg-[#fafafa] text-[10px]">
                                {chain.sourceType}
                              </Badge>
                              <span>{formatDate(chain.updatedAt)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelectedChainId(chain.id);
                                  setSelectedGraphNodeId(null);
                                }}
                                className="h-7 rounded-[4px] border-[#dfe3e8] bg-white px-2 text-[11px] shadow-none hover:bg-[#f8fafc]"
                              >
                                Focus graph
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={!onGenerateAgentBrief || generatingBriefId === chain.id}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void generateAgentBrief(chain);
                                }}
                                className="h-7 rounded-[4px] border-[#dfe3e8] bg-white px-2 text-[11px] shadow-none hover:bg-[#f8fafc]"
                              >
                                {generatingBriefId === chain.id ? "Generating..." : "Generate Agent Brief"}
                              </Button>
                            </div>
                          </div>
                          <p className="mt-3 text-[13px] font-medium text-[#111827]">{chain.task}</p>
                          <div className="mt-3 grid gap-2 text-[12px] leading-5 text-[#697386]">
                            <p><span className="font-medium text-[#111827]">Pain:</span> {chain.customerPain}</p>
                            <p><span className="font-medium text-[#111827]">Priority:</span> {chain.productPriority}</p>
                            <p><span className="font-medium text-[#111827]">Context:</span> {chain.executionContext}</p>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {chain.reasoningQuality ? (
                              <Badge variant="outline" className="rounded-[3px] border-[#bfdbfe] bg-[#eff6ff] text-[10px] text-[#1d4ed8]">
                                {chain.reasoningQuality.status} · {chain.reasoningQuality.score}/100
                              </Badge>
                            ) : null}
                            {(chain.riskSignals ?? []).slice(0, 3).map((risk, index) => (
                              <Badge key={`${chain.id}:risk:${index}:${risk}`} variant="outline" className="rounded-[3px] border-[#fed7aa] bg-[#fff7ed] text-[10px] text-[#c2410c]">
                                {risk}
                              </Badge>
                            ))}
                            {(chain.requiredTests ?? []).slice(0, 2).map((test, index) => (
                              <Badge key={`${chain.id}:test:${index}:${test}`} variant="outline" className="rounded-[3px] border-[#bbf7d0] bg-[#f0fdf4] text-[10px] text-[#047857]">
                                {test}
                              </Badge>
                            ))}
                            {chain.impactedFiles.slice(0, 5).map((file, index) => (
                              <Badge key={`${chain.id}:file:${index}:${file}`} variant="outline" className="rounded-[3px] border-[#e5e7eb] bg-white text-[10px] text-[#4b5563]">
                                {file}
                              </Badge>
                            ))}
                          </div>
                          {linkedExperiences.length > 0 ? (
                          <div className="mt-3 rounded-[4px] border border-[#eef0f3] bg-[#fafafa] p-3">
                            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#8a94a6]">Linked experiences</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {linkedExperiences.slice(0, 4).map((experience, index) => (
                                  <Button
                                    key={`${chain.id}:experience:${index}:${experience.id}`}
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      onOpenExperience?.(experience.id);
                                    }}
                                    aria-label={`Open experience ${experience.task}`}
                                    title={`Open experience ${experience.task}`}
                                    className="h-7 rounded-[3px] border-[#bfdbfe] bg-[#eff6ff] px-2 text-[10px] text-[#1d4ed8] shadow-none hover:bg-[#dbeafe]"
                                  >
                                    {compactGraphId(experience.task)}
                                  </Button>
                              ))}
                            </div>
                            <p className="mt-2 break-all font-mono text-[10px] text-[#8a94a6]">
                              {linkedExperiences.slice(0, 2).map((experience) => experience.sourceRef).join(" | ")}
                            </p>
                          </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <Empty className="min-h-[320px] rounded-none border-0 bg-white">
                  <EmptyHeader>
                    <EmptyMedia variant="icon" className="bg-[#fafafa] text-[#697386] ring-1 ring-[#e5e7eb]">
                      <Lightbulb className="size-4" />
                    </EmptyMedia>
                    <EmptyTitle className="text-[13px] text-[#111827]">No reasoning chains yet</EmptyTitle>
                    <EmptyDescription className="max-w-lg text-[#8a94a6]">
                      Capture product pain or issue context to create the first agent-ready reasoning chain.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[4px] border-[#e5e7eb] bg-white py-0 shadow-none ring-0">
            <CardHeader className="border-b border-[#eef0f3] p-4">
              <CardTitle className="text-[13px] font-medium text-[#111827]">Brief additions</CardTitle>
              <CardDescription className="text-[12px] text-[#697386]">
                Lines MemoryIgnition can inject into future inheritance packages.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              {briefAdditions.length > 0 ? briefAdditions.map((item) => (
                <div key={`${item.task}-${item.recommendedBriefLine}`} className="rounded-[4px] border border-[#eef0f3] bg-[#fafafa] p-3">
                  <div className="flex items-start gap-2">
                    <Target className="mt-0.5 size-4 shrink-0 text-[#4b5563]" strokeWidth={1.8} />
                    <div>
                      <p className="text-[12px] font-medium text-[#111827]">{item.task}</p>
                      <p className="mt-1 text-[12px] leading-5 text-[#697386]">{item.recommendedBriefLine}</p>
                      {item.reasoningQuality ? (
                        <p className="mt-1 text-[11px] text-[#1d4ed8]">
                          Quality {item.reasoningQuality.score}/100 · {item.reasoningQuality.status}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="rounded-[4px] border border-[#eef0f3] bg-[#fafafa] p-4 text-[12px] text-[#8a94a6]">
                  No reasoning is ready for MemoryIgnition yet.
                </div>
              )}
              {briefError ? (
                <div className="rounded-[4px] border border-[#fecaca] bg-[#fef2f2] p-3 text-[12px] text-[#b91c1c]">
                  {briefError}
                </div>
              ) : null}
              {selectedChain ? (
                <div className="rounded-[4px] border border-[#bfdbfe] bg-[#eff6ff] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1d4ed8]">
                        Selected reasoning chain
                      </p>
                      <p className="mt-2 text-[12px] font-medium text-[#111827]">{selectedChain.task}</p>
                    </div>
                    <Badge variant="outline" className="rounded-[3px] border-[#bfdbfe] bg-white text-[10px] text-[#1d4ed8]">
                      {selectedChain.reasoningQuality?.status ?? "usable"} · {selectedChain.reasoningQuality?.score ?? 0}/100
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-2 text-[12px] leading-5 text-[#1f2937]">
                    <p><span className="font-medium">Pain:</span> {selectedChain.customerPain}</p>
                    <p><span className="font-medium">Priority:</span> {selectedChain.productPriority}</p>
                    <p><span className="font-medium">Execution context:</span> {selectedChain.executionContext}</p>
                    <p><span className="font-medium">Assumptions:</span> {(selectedChain.assumptions ?? []).join(" · ") || "None captured"}</p>
                    <p><span className="font-medium">Decision points:</span> {(selectedChain.decisionPoints ?? []).join(" · ") || "None captured"}</p>
                    <p><span className="font-medium">Risk signals:</span> {(selectedChain.riskSignals ?? []).join(" · ") || "None captured"}</p>
                    <p><span className="font-medium">Required tests:</span> {(selectedChain.requiredTests ?? []).join(" · ") || "None captured"}</p>
                    <p><span className="font-medium">Next actions:</span> {(selectedChain.nextActions ?? []).join(" · ") || "None captured"}</p>
                    <p><span className="font-medium">Trace:</span> {selectedChain.sourceType}:{selectedChain.sourceRef}</p>
                  </div>
                  <div className="mt-3 rounded-[4px] border border-[#bfdbfe] bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#1d4ed8]">
                        Focused graph
                      </p>
                      <Badge variant="outline" className="rounded-[3px] border-[#bfdbfe] bg-[#eff6ff] text-[10px] text-[#1d4ed8]">
                        {focusedGraphNodes.length} nodes · {focusedGraphEdges.length} edges
                      </Badge>
                    </div>
                    <div className="mt-2 grid gap-2 text-[12px] text-[#1f2937] sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setSelectedGraphNodeId(null)}
                        className="border border-[#e5e7eb] bg-[#fafafa] px-3 py-2 text-left hover:bg-[#f8fafc]"
                      >
                        <span className="block text-[10px] uppercase tracking-[0.12em] text-[#8a94a6]">Reset focus</span>
                        <span className="mt-1 block text-[12px] text-[#111827]">Inspect the full reasoning chain graph</span>
                      </button>
                      <div className="border border-[#e5e7eb] bg-[#fafafa] px-3 py-2">
                        <span className="block text-[10px] uppercase tracking-[0.12em] text-[#8a94a6]">Selected node</span>
                        <span className="mt-1 block text-[12px] text-[#111827]">
                          {selectedGraphNode ? `${selectedGraphNode.kind} · ${compactGraphId(selectedGraphNode.label)}` : "None selected"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {selectedChain.linkedExperiences.length > 0 ? (
                    <div className="mt-3 rounded-[4px] border border-[#bfdbfe] bg-white p-3">
                      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#1d4ed8]">Graph-linked experiences</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedChain.linkedExperiences.slice(0, 4).map((experience, index) => (
                          <Button
                            key={`${selectedChain.id}:selected-experience:${index}:${experience.id}`}
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => onOpenExperience?.(experience.id)}
                            aria-label={`Open experience ${experience.task}`}
                            title={`Open experience ${experience.task}`}
                            className="h-7 rounded-[3px] border-[#bfdbfe] bg-[#eff6ff] px-2 text-[10px] text-[#1d4ed8] shadow-none hover:bg-[#dbeafe]"
                          >
                            {compactGraphId(experience.task)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {generatedBrief ? (
                <div className="rounded-[4px] border border-[#bfdbfe] bg-[#eff6ff] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1d4ed8]">
                        Generated Agent Brief
                      </p>
                      <p className="mt-2 text-[12px] font-medium text-[#111827]">
                        {generatedBrief.memoryIgnitionBrief.task}
                      </p>
                    </div>
                    <Badge variant="outline" className="rounded-[3px] border-[#bfdbfe] bg-white text-[10px] text-[#1d4ed8]">
                      {generatedBrief.targetAgent}
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-2 text-[12px] leading-5 text-[#1f2937]">
                    <p>
                      <span className="font-medium">Why:</span>{" "}
                      {generatedBrief.memoryIgnitionBrief.reasoning.whyThisMatters}
                    </p>
                    {generatedBrief.memoryIgnitionBrief.reasoning.quality ? (
                      <p>
                        <span className="font-medium">Quality:</span>{" "}
                        {generatedBrief.memoryIgnitionBrief.reasoning.quality.status} ·{" "}
                        {generatedBrief.memoryIgnitionBrief.reasoning.quality.score}/100
                      </p>
                    ) : null}
                    <p>
                      <span className="font-medium">First action:</span>{" "}
                      {generatedBrief.memoryIgnitionBrief.recommendedFirstAction}
                    </p>
                    <p>
                      <span className="font-medium">Trace:</span>{" "}
                      {generatedBrief.memoryIgnitionBrief.traceProof[0]?.source_ref ?? generatedBrief.traceId}
                    </p>
                      <div className="rounded-[4px] border border-[#bfdbfe] bg-white p-3">
                        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#1d4ed8]">
                          Linked experiences
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {generatedBrief.memoryIgnitionBrief.linkedExperiences.length > 0 ? (
                            generatedBrief.memoryIgnitionBrief.linkedExperiences.slice(0, 4).map((experience) => (
                            <Button
                              key={experience.id}
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => onOpenExperience?.(experience.id)}
                              aria-label={`Open experience ${experience.task}`}
                              title={`Open experience ${experience.task}`}
                              className="h-7 rounded-[3px] border-[#bfdbfe] bg-[#eff6ff] px-2 text-[10px] text-[#1d4ed8] shadow-none hover:bg-[#dbeafe]"
                            >
                              {compactGraphId(experience.task)}
                            </Button>
                          ))
                        ) : (
                          <span className="text-[12px] text-[#697386]">No linked experiences captured yet.</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <pre className="mt-3 max-h-56 overflow-auto rounded-[3px] border border-[#bfdbfe] bg-white p-3 text-[11px] leading-5 text-[#111827]">
                    {generatedBrief.memoryIgnitionBrief.markdown}
                  </pre>
                </div>
              ) : null}
              <div className="flex items-center gap-2 rounded-[4px] border border-[#e5e7eb] bg-white p-3 text-[12px] text-[#697386]">
                <FileText className="size-4 text-[#4b5563]" strokeWidth={1.8} />
                Work Graph feeds task reason, product context, and execution context into the Agent Inheritance Package.
                <ArrowRight className="ml-auto size-4 text-[#9aa4b2]" strokeWidth={1.8} />
              </div>
            </CardContent>
          </Card>
        </div>

          <Card className="rounded-[4px] border-[#e5e7eb] bg-white py-0 shadow-none ring-0">
            <CardHeader className="border-b border-[#eef0f3] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-[13px] font-medium text-[#111827]">Work Graph</CardTitle>
                  <CardDescription className="text-[12px] text-[#697386]">
                    Live nodes and edges from customer pain through product priority into execution context.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="rounded-[3px] border-[#dfe3e8] bg-white text-[11px] text-[#697386]">
                  {focusedGraphNodes.length} nodes · {focusedGraphEdges.length} edges
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[#697386]">
                <span className="border border-[#e5e7eb] bg-[#fafafa] px-2 py-1">
                  Focus: {selectedChain ? selectedChain.task : "All reasoning chains"}
                </span>
                <span className="border border-[#e5e7eb] bg-[#fafafa] px-2 py-1">
                  Trace: {selectedChain ? `${selectedChain.sourceType}:${selectedChain.sourceRef}` : "No chain selected"}
                </span>
                <span className="border border-[#e5e7eb] bg-[#fafafa] px-2 py-1">
                  Ready: {selectedChain?.reasoningQuality?.agentReady ? "yes" : "no"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="grid gap-0 p-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="border-b border-[#eef0f3] p-4 lg:border-b-0 lg:border-r">
              <div className="flex items-center gap-2 text-[12px] font-medium text-[#111827]">
                <Grid2X2 className="size-4 text-[#4b5563]" strokeWidth={1.8} />
                Graph nodes
              </div>
              <ScrollArea className="mt-3 max-h-[280px]">
                <div className="space-y-2 pr-3">
                  {focusedGraphNodes.length > 0 ? focusedGraphNodes.slice(0, 12).map((node) => (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => setSelectedGraphNodeId(node.id)}
                      className={cn(
                        "w-full border border-[#eef0f3] bg-[#fafafa] p-3 text-left transition hover:bg-[#f8fafc]",
                        selectedGraphNode?.id === node.id && "border-[#bfdbfe] bg-[#eff6ff]",
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="text-[12px] font-medium text-[#111827]">{graphNodeLabel(node)}</p>
                        <Badge variant="outline" className="rounded-[3px] border-[#e5e7eb] bg-white text-[10px] text-[#697386]">
                          {compactGraphId(node.id)}
                        </Badge>
                      </div>
                    </button>
                  )) : (
                    <div className="rounded-[4px] border border-[#eef0f3] bg-[#fafafa] p-4 text-[12px] text-[#8a94a6]">
                      No focused graph nodes yet. Capture a reasoning chain to seed the graph.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 text-[12px] font-medium text-[#111827]">
                <ArrowRight className="size-4 text-[#4b5563]" strokeWidth={1.8} />
                Graph edges
              </div>
              <ScrollArea className="mt-3 max-h-[280px]">
                <div className="space-y-2 pr-3">
                  {focusedGraphEdges.length > 0 ? focusedGraphEdges.slice(0, 12).map((edge, index) => (
                    <div key={`${edge.from}-${edge.to}-${edge.type}-${index}`} className="border border-[#eef0f3] bg-white p-3">
                      <p className="text-[12px] font-medium text-[#111827]">{compactGraphId(edge.type)}</p>
                      <p className="mt-1 text-[11px] leading-4 text-[#697386]">
                        {compactGraphId(edge.from)} → {compactGraphId(edge.to)}
                      </p>
                    </div>
                  )) : (
                    <div className="rounded-[4px] border border-[#eef0f3] bg-[#fafafa] p-4 text-[12px] text-[#8a94a6]">
                      No focused graph edges yet. Add one linked reasoning chain so the graph can connect.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

