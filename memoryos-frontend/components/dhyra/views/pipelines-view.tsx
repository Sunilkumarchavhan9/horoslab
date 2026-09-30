"use client";

import React, { useState } from "react";
import {
  Layers,
  Plus,
  Search,
  Check,
  Copy,
  Sliders,
  Play,
  ArrowRight,
  ShieldAlert,
  Zap,
  Clock,
  Database,
  BarChart3,
  X,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DeepSeekLogo,
  MetaLogo,
  QwenLogo,
  NvidiaLogo,
  BAAILogo,
} from "@/components/dhyra/primitives/brand-icons";

export interface PipelineItem {
  id: string;
  name: string;
  slug: string;
  status: "active" | "canary" | "draft" | "degraded";
  strategy: string;
  primaryModel: {
    name: string;
    id: string;
    icon: React.ReactNode;
  };
  fallbackModel?: {
    name: string;
    id: string;
    icon: React.ReactNode;
    trigger: string;
  };
  canaryModel?: {
    name: string;
    id: string;
    icon: React.ReactNode;
    weight: number;
  };
  cacheEnabled: boolean;
  cacheHitRate: string;
  requests24h: string;
  latencyP99: string;
  costRate: string;
}

interface PipelinesViewProps {
  dark?: boolean;
  onNavigateToModelApis?: () => void;
  onNavigateToAnalytics?: () => void;
}

export function PipelinesView({
  dark = true,
  onNavigateToModelApis,
  onNavigateToAnalytics,
}: PipelinesViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "canary">("all");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [selectedPipelineForTest, setSelectedPipelineForTest] = useState<PipelineItem | null>(null);
  const [testPrompt, setTestPrompt] = useState("Summarize the architectural differences between dense transformers and MoE models.");
  const [testRunning, setTestRunning] = useState(false);
  const [testResult, setTestResult] = useState<{
    routeUsed: string;
    latencyMs: number;
    tokens: number;
    cached: boolean;
    response: string;
  } | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New pipeline form state
  const [newPipelineName, setNewPipelineName] = useState("");
  const [newPrimaryModel, setNewPrimaryModel] = useState("DeepSeek V4 Flash");
  const [newFallbackModel, setNewFallbackModel] = useState("meta-llama/Llama-3.1-70B-Instruct");
  const [newTimeoutMs, setNewTimeoutMs] = useState("500");

  const [pipelines, setPipelines] = useState<PipelineItem[]>([
    {
      id: "pipe-1",
      name: "prod-fast-rag-v2",
      slug: "api.dhyra.run/v1/pipelines/prod-fast-rag-v2",
      status: "active",
      strategy: "Latency SLA Priority (< 400ms)",
      primaryModel: {
        name: "DeepSeek V4 Flash",
        id: "deepseek-ai/DeepSeek-V4",
        icon: <DeepSeekLogo size={13} />,
      },
      fallbackModel: {
        name: "Llama 3.1 70B Instruct",
        id: "meta-llama/Llama-3.1-70B-Instruct",
        icon: <MetaLogo size={13} />,
        trigger: "Timeout > 400ms OR 5xx",
      },
      cacheEnabled: true,
      cacheHitRate: "86.4%",
      requests24h: "540,210",
      latencyP99: "184ms",
      costRate: "$0.14 / 1M",
    },
    {
      id: "pipe-2",
      name: "code-generation-ensemble",
      slug: "api.dhyra.run/v1/pipelines/code-generation-ensemble",
      status: "canary",
      strategy: "90/10 Weighted Canary Split",
      primaryModel: {
        name: "DeepSeek V4 Flash",
        id: "deepseek-ai/DeepSeek-V4",
        icon: <DeepSeekLogo size={13} />,
      },
      canaryModel: {
        name: "Qwen 2.5 32B Instruct",
        id: "Qwen/Qwen2.5-32B-Instruct",
        icon: <QwenLogo size={13} />,
        weight: 10,
      },
      cacheEnabled: true,
      cacheHitRate: "78.2%",
      requests24h: "412,890",
      latencyP99: "210ms",
      costRate: "$0.18 / 1M",
    },
    {
      id: "pipe-3",
      name: "reasoning-critic-chain",
      slug: "api.dhyra.run/v1/pipelines/reasoning-critic-chain",
      status: "active",
      strategy: "Cost & Accuracy Optimized",
      primaryModel: {
        name: "NVIDIA Nemotron 3.5",
        id: "nvidia/NVIDIA-Nemotron-3.5-Lightning",
        icon: <NvidiaLogo size={13} />,
      },
      fallbackModel: {
        name: "DeepSeek V4 Flash",
        id: "deepseek-ai/DeepSeek-V4",
        icon: <DeepSeekLogo size={13} />,
        trigger: "Timeout > 800ms OR 5xx",
      },
      cacheEnabled: true,
      cacheHitRate: "91.0%",
      requests24h: "184,200",
      latencyP99: "320ms",
      costRate: "$0.28 / 1M",
    },
    {
      id: "pipe-4",
      name: "multimodal-embedding-pipe",
      slug: "api.dhyra.run/v1/pipelines/multimodal-embedding-pipe",
      status: "active",
      strategy: "Embedding Ingest Route",
      primaryModel: {
        name: "BAAI bge-m3",
        id: "BAAI/bge-m3",
        icon: <BAAILogo size={13} />,
      },
      cacheEnabled: true,
      cacheHitRate: "94.5%",
      requests24h: "82,190",
      latencyP99: "45ms",
      costRate: "$0.02 / 1M",
    },
  ]);

  const copySlug = (slug: string) => {
    navigator.clipboard.writeText(slug);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleRunTest = () => {
    if (!selectedPipelineForTest) return;
    setTestRunning(true);
    setTestResult(null);

    setTimeout(() => {
      setTestRunning(false);
      setTestResult({
        routeUsed: selectedPipelineForTest.primaryModel.name,
        latencyMs: 142,
        tokens: 384,
        cached: false,
        response: `[Route: ${selectedPipelineForTest.primaryModel.name}] Dense transformers activate 100% of parameters on every token generation step, while Mixture of Experts (MoE) dynamically routes tokens through a sparse subset of expert feed-forward networks (e.g. 2 active experts out of 16). This delivers 4-8x higher compute efficiency and lower per-token latency at equivalent capacity.`,
      });
    }, 600);
  };

  const handleCreatePipeline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPipelineName.trim()) return;

    const slug = `api.dhyra.run/v1/pipelines/${newPipelineName.toLowerCase().replace(/\s+/g, "-")}`;
    const newPipe: PipelineItem = {
      id: `pipe-${Date.now()}`,
      name: newPipelineName.toLowerCase().replace(/\s+/g, "-"),
      slug,
      status: "active",
      strategy: `Latency SLA Priority (< ${newTimeoutMs}ms)`,
      primaryModel: {
        name: newPrimaryModel,
        id: newPrimaryModel.toLowerCase().replace(/\s+/g, "-"),
        icon: <DeepSeekLogo size={13} />,
      },
      fallbackModel: {
        name: newFallbackModel,
        id: newFallbackModel.toLowerCase().replace(/\s+/g, "-"),
        icon: <MetaLogo size={13} />,
        trigger: `Timeout > ${newTimeoutMs}ms OR 5xx`,
      },
      cacheEnabled: true,
      cacheHitRate: "0.0%",
      requests24h: "0",
      latencyP99: "--",
      costRate: "$0.14 / 1M",
    };

    setPipelines([newPipe, ...pipelines]);
    setCreateModalOpen(false);
    setNewPipelineName("");
  };

  const filteredPipelines = pipelines.filter((pipe) => {
    const matchesSearch =
      pipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pipe.primaryModel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pipe.strategy.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && pipe.status === "active") ||
      (statusFilter === "canary" && pipe.status === "canary");
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-[1240px] mx-auto pb-16 font-sans text-xs animate-in fade-in duration-150">
      {/* Top Header Matching RunInfra Style */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#282828] pb-4">
        <div>
          <h1 className="text-xl font-bold font-mono tracking-tight flex items-center gap-1.5 text-[#F0EFE2]">
            <span>Pipelines</span>
            <span className="bg-[#75bf00] text-black px-2 py-0.5 rounded-xs font-bold inline-block font-sans text-base">
              Deployments
            </span>
          </h1>
          <p className="mt-1 text-xs text-[#90988c]">
            Intelligent multi-model fallback chains, latency SLAs, and canary deployments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onNavigateToModelApis}
            className="border border-[#383838] bg-[#202020] text-[#a0a89d] hover:text-[#F0EFE2] hover:border-[#75bf00] px-3 py-1.5 text-xs font-medium transition-colors rounded-xs font-mono cursor-pointer"
          >
            Model APIs
          </button>
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#75bf00] hover:bg-[#86dc00] text-black px-3.5 py-1.5 text-xs font-bold transition-colors rounded-xs font-mono cursor-pointer shadow-sm"
          >
            <Plus size={13} strokeWidth={2.5} />
            <span>Create pipeline</span>
          </button>
        </div>
      </div>



      {/* Search & Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#788274]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pipelines by name, model, or strategy..."
            className="w-full bg-[#181818] border border-dashed border-[#383838] focus:border-[#75bf00] rounded-xs pl-8 pr-3 py-1.5 text-xs text-[#F0EFE2] placeholder-[#666] outline-none font-mono transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="flex items-center border border-dashed border-[#383838] bg-[#181818] p-0.5 rounded-xs">
            {[
              { id: "all", label: `All (${pipelines.length})` },
              { id: "active", label: "Active" },
              { id: "canary", label: "Canary" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id as typeof statusFilter)}
                className={cn(
                  "px-2.5 py-0.5 rounded-xs transition-colors text-[11px] cursor-pointer",
                  statusFilter === f.id
                    ? "bg-[#282828] text-[#F0EFE2] font-bold"
                    : "text-[#788274] hover:text-[#F0EFE2]"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
            }}
            className="flex items-center gap-1 text-[11px] text-[#788274] hover:text-[#F0EFE2] transition-colors px-1 cursor-pointer"
          >
            <RotateCcw size={10} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Pipelines List (Clean Dashed Cards matching RunInfra) */}
      <div className="space-y-3">
        {filteredPipelines.map((pipe) => (
          <div
            key={pipe.id}
            className="border border-dashed border-[#282828] bg-[#141414] hover:border-[#444] transition-colors rounded-xs p-4 font-mono text-xs space-y-3.5"
          >
            {/* Row Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-[#222] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-[#F0EFE2] font-bold text-sm tracking-tight">{pipe.name}</span>
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-xs text-[10px] font-bold uppercase",
                    pipe.status === "active"
                      ? "bg-[#86dc00]/15 text-[#86dc00] border border-[#86dc00]/30"
                      : "bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30"
                  )}
                >
                  ● {pipe.status}
                </span>
                <span className="text-[11px] text-[#788274]">• {pipe.strategy}</span>
              </div>

              {/* Endpoint with Copy */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[#788274] font-mono select-all truncate max-w-xs">
                  {pipe.slug}
                </span>
                <button
                  type="button"
                  onClick={() => copySlug(pipe.slug)}
                  className="border border-[#2e2e2e] bg-[#1a1a1a] text-[#a0a89d] hover:text-[#F0EFE2] px-2 py-0.5 rounded-xs text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedSlug === pipe.slug ? (
                    <>
                      <Check size={10} className="text-[#86dc00]" />
                      <span className="text-[#86dc00]">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={10} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 100% Arrow-Free Stage Hierarchy Table (Option C) */}
            <div className="border border-dashed border-[#262626] bg-[#101010] rounded-xs overflow-hidden my-1">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="border-b border-dashed border-[#222] text-[10px] text-[#666] bg-[#161616]">
                    <th className="py-2 px-3">STAGE</th>
                    <th className="py-2 px-3">MODEL / COMPONENT</th>
                    <th className="py-2 px-3">STRATEGY / PERFORMANCE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dashed divide-[#1f1f1f]">
                  {/* Primary Stage */}
                  <tr className="hover:bg-[#161616] transition-colors">
                    <td className="py-2 px-3 text-[#75bf00] font-bold text-[10px]">01 (PRIMARY)</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5 text-[#F0EFE2] font-sans font-bold">
                        {pipe.primaryModel.icon}
                        <span>{pipe.primaryModel.name}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-[#aaa]">Primary Route (<span className="text-[#75bf00]">SLA Priority</span>)</td>
                  </tr>

                  {/* Fallback Stage if present */}
                  {pipe.fallbackModel && (
                    <tr className="hover:bg-[#161616] transition-colors">
                      <td className="py-2 px-3 text-[#f59e0b] font-bold text-[10px]">02 (FALLBACK)</td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5 text-[#F0EFE2] font-sans font-bold">
                          {pipe.fallbackModel.icon}
                          <span>{pipe.fallbackModel.name}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-[#f59e0b]">{pipe.fallbackModel.trigger}</td>
                    </tr>
                  )}

                  {/* Canary Stage if present */}
                  {pipe.canaryModel && (
                    <tr className="hover:bg-[#161616] transition-colors">
                      <td className="py-2 px-3 text-[#38bdf8] font-bold text-[10px]">02 (CANARY)</td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5 text-[#F0EFE2] font-sans font-bold">
                          {pipe.canaryModel.icon}
                          <span>{pipe.canaryModel.name}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-[#38bdf8]">{pipe.canaryModel.weight}% Traffic Split</td>
                    </tr>
                  )}

                  {/* Cache Stage if enabled */}
                  {pipe.cacheEnabled && (
                    <tr className="hover:bg-[#161616] transition-colors">
                      <td className="py-2 px-3 text-[#C8C7BA] font-bold text-[10px]">03 (CACHE)</td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5 text-[#F0EFE2] font-sans font-bold">
                          <Zap size={13} className="text-[#75bf00]" />
                          <span>Semantic Cache</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-[#75bf00] font-bold">{pipe.cacheHitRate} Hit Rate</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Metrics Strip & Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-dashed border-[#222]">
              <div className="flex items-center gap-4 text-[11px] text-[#788274]">
                <div className="flex items-center gap-1.5">
                  <span>24h Requests:</span>
                  <span className="text-[#F0EFE2] font-bold">{pipe.requests24h}</span>
                </div>
                <div className="flex items-center gap-1.5 border-l border-dashed border-[#282828] pl-3">
                  <span>P99 Latency:</span>
                  <span className="text-[#F0EFE2] font-bold">{pipe.latencyP99}</span>
                </div>
                <div className="flex items-center gap-1.5 border-l border-dashed border-[#282828] pl-3">
                  <span>Cost Rate:</span>
                  <span className="text-[#F0EFE2] font-bold">{pipe.costRate}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPipelineForTest(pipe)}
                  className="flex items-center gap-1.5 border border-[#383838] bg-[#1f1f1f] text-[#d1d5db] hover:text-[#F0EFE2] hover:border-[#75bf00] px-2.5 py-1 text-[11px] rounded-xs transition-colors cursor-pointer"
                >
                  <Play size={10} className="text-[#75bf00]" />
                  <span>Test route</span>
                </button>

                <button
                  type="button"
                  onClick={onNavigateToAnalytics}
                  className="flex items-center gap-1.5 border border-[#2e2e2e] bg-[#181818] text-[#a0a89d] hover:text-[#F0EFE2] px-2.5 py-1 text-[11px] rounded-xs transition-colors cursor-pointer"
                >
                  <BarChart3 size={10} />
                  <span>Analytics</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Live Route Test Drawer */}
      {selectedPipelineForTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-in fade-in duration-100">
          <div className="w-full max-w-xl border border-dashed border-[#383838] bg-[#141414] rounded-xs p-5 font-mono text-xs space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#282828] pb-3">
              <div className="flex items-center gap-2">
                <Play size={13} className="text-[#75bf00]" />
                <span className="text-[#F0EFE2] font-bold text-sm">Test Pipeline Route</span>
                <span className="text-[#788274]">• {selectedPipelineForTest.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPipelineForTest(null)}
                className="text-[#788274] hover:text-[#F0EFE2] cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-[#788274]">Test Input Prompt</label>
              <textarea
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                rows={3}
                className="w-full bg-[#181818] border border-dashed border-[#383838] focus:border-[#75bf00] rounded-xs p-2 text-[#F0EFE2] outline-none text-xs"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedPipelineForTest(null)}
                className="px-3 py-1.5 border border-[#383838] bg-[#202020] text-[#a0a89d] hover:text-[#F0EFE2] rounded-xs cursor-pointer text-xs"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleRunTest}
                disabled={testRunning}
                className="flex items-center gap-1.5 bg-[#75bf00] hover:bg-[#86dc00] text-black font-bold px-4 py-1.5 rounded-xs cursor-pointer text-xs transition-colors"
              >
                {testRunning ? (
                  <>
                    <RotateCcw size={11} className="animate-spin" />
                    <span>Executing Route...</span>
                  </>
                ) : (
                  <>
                    <Play size={11} />
                    <span>Execute test</span>
                  </>
                )}
              </button>
            </div>

            {/* Test Result Box */}
            {testResult && (
              <div className="border border-dashed border-[#282828] bg-[#0e0e0e] p-3 rounded-xs space-y-2 animate-in fade-in duration-150">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#202020] pb-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="text-[#788274]">Executed via:</span>
                    <span className="text-[#86dc00] font-bold">{testResult.routeUsed}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-[#788274]">
                    <span>Latency: <strong className="text-[#F0EFE2]">{testResult.latencyMs}ms</strong></span>
                    <span>Tokens: <strong className="text-[#F0EFE2]">{testResult.tokens}</strong></span>
                    <span>Cached: <strong className="text-[#F0EFE2]">{testResult.cached ? "Yes" : "No"}</strong></span>
                  </div>
                </div>
                <p className="text-[#d1d5db] text-xs leading-relaxed">{testResult.response}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Pipeline Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-in fade-in duration-100">
          <form
            onSubmit={handleCreatePipeline}
            className="w-full max-w-lg border border-dashed border-[#383838] bg-[#141414] rounded-xs p-5 font-mono text-xs space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#282828] pb-3">
              <div className="flex items-center gap-2">
                <Plus size={13} className="text-[#75bf00]" />
                <span className="text-[#F0EFE2] font-bold text-sm">Create New Pipeline</span>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-[#788274] hover:text-[#F0EFE2] cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-[#788274] block mb-1">Pipeline Name</label>
                <input
                  type="text"
                  required
                  value={newPipelineName}
                  onChange={(e) => setNewPipelineName(e.target.value)}
                  placeholder="e.g. prod-code-fast-route"
                  className="w-full bg-[#181818] border border-dashed border-[#383838] focus:border-[#75bf00] rounded-xs px-3 py-1.5 text-[#F0EFE2] outline-none text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#788274] block mb-1">Primary Model</label>
                <select
                  value={newPrimaryModel}
                  onChange={(e) => setNewPrimaryModel(e.target.value)}
                  className="w-full bg-[#181818] border border-dashed border-[#383838] focus:border-[#75bf00] rounded-xs px-3 py-1.5 text-[#F0EFE2] outline-none text-xs font-mono"
                >
                  <option value="DeepSeek V4 Flash">DeepSeek V4 Flash ($0.14 / 1M)</option>
                  <option value="meta-llama/Llama-3.1-8B-Instruct">Llama 3.1 8B Instruct ($0.10 / 1M)</option>
                  <option value="Qwen/Qwen2.5-32B-Instruct">Qwen 2.5 32B Instruct ($0.22 / 1M)</option>
                  <option value="nvidia/NVIDIA-Nemotron-3.5-Lightning">NVIDIA Nemotron 3.5 ($0.28 / 1M)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-[#788274] block mb-1">Failover Model (Automatic Backup)</label>
                <select
                  value={newFallbackModel}
                  onChange={(e) => setNewFallbackModel(e.target.value)}
                  className="w-full bg-[#181818] border border-dashed border-[#383838] focus:border-[#75bf00] rounded-xs px-3 py-1.5 text-[#F0EFE2] outline-none text-xs font-mono"
                >
                  <option value="meta-llama/Llama-3.1-70B-Instruct">Llama 3.1 70B Instruct</option>
                  <option value="DeepSeek V4 Flash">DeepSeek V4 Flash</option>
                  <option value="Qwen/Qwen2.5-32B-Instruct">Qwen 2.5 32B Instruct</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-[#788274] block mb-1">
                  Failover Latency SLA Threshold: <strong className="text-[#F0EFE2]">{newTimeoutMs}ms</strong>
                </label>
                <input
                  type="range"
                  min="200"
                  max="2000"
                  step="50"
                  value={newTimeoutMs}
                  onChange={(e) => setNewTimeoutMs(e.target.value)}
                  className="w-full accent-[#75bf00] cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#282828]">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-3 py-1.5 border border-[#383838] bg-[#202020] text-[#a0a89d] hover:text-[#F0EFE2] rounded-xs cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#75bf00] hover:bg-[#86dc00] text-black font-bold px-4 py-1.5 rounded-xs cursor-pointer text-xs transition-colors"
              >
                Deploy Pipeline
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
