"use client";

import React, { useState } from "react";
import {
  Gauge,
  Search,
  Rocket,
  RotateCcw,
  Pause,
  Play,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Check,
  Copy,
  Terminal,
  Activity,
  Zap,
  Globe,
  Layers,
  Cpu,
  ShieldCheck,
  Plus,
} from "lucide-react";
import { DeploymentEntity } from "@/lib/epoch-types";
import { MetaLogo, QwenLogo, BAAILogo, VLLMLogo, SGLangLogo, NvidiaLogo, HuggingFaceLogo } from "../primitives/brand-icons";
import { cn } from "@/lib/utils";

interface DeploymentsViewProps {
  deployments?: DeploymentEntity[];
  onRollback?: (id: string) => void;
  onSelectProgram?: (programId: string) => void;
  dark?: boolean;
}

interface DeploymentItem {
  id: string;
  name: string;
  model: string;
  modelIcon: React.ReactNode;
  engine: string;
  engineIcon: React.ReactNode;
  gpu: string;
  environment: "production" | "staging" | "edge";
  region: string;
  status: "live" | "deploying" | "paused" | "stopped";
  requests24h: string;
  costTotal: string;
  costPerMillion: string;
  latencyP95: string;
  ttft: string;
  errorRate: string;
  endpointUrl: string;
  activeVersion: string;
  createdAt: string;
}

const DEFAULT_DEPLOYMENTS: DeploymentItem[] = [
  {
    id: "dep-llama-3-1-8b",
    name: "llama-3.1-8b-production",
    model: "meta-llama/Llama-3.1-8B-Instruct",
    modelIcon: <MetaLogo size={15} />,
    engine: "vLLM",
    engineIcon: <VLLMLogo size={14} />,
    gpu: "1x A100-40GB",
    environment: "production",
    region: "us-east-1 (Cloud)",
    status: "live",
    requests24h: "1.42M",
    costTotal: "$25.56",
    costPerMillion: "$0.18",
    latencyP95: "38.2 ms",
    ttft: "14.1 ms",
    errorRate: "0.01%",
    endpointUrl: "https://api.runinfra.ai/v1/chat/completions",
    activeVersion: "v14.2 (AWQ-FP8)",
    createdAt: "2d ago",
  },
  {
    id: "dep-qwen-2-5-7b",
    name: "qwen2.5-coder-prod",
    model: "Qwen/Qwen2.5-7B-Instruct",
    modelIcon: <QwenLogo size={15} />,
    engine: "SGLang",
    engineIcon: <SGLangLogo size={14} />,
    gpu: "1x L40S",
    environment: "production",
    region: "us-central-1 (Cloud)",
    status: "live",
    requests24h: "840K",
    costTotal: "$11.76",
    costPerMillion: "$0.14",
    latencyP95: "42.5 ms",
    ttft: "16.8 ms",
    errorRate: "0.00%",
    endpointUrl: "https://api.runinfra.ai/v1/chat/completions",
    activeVersion: "v14.1 (Radix-Cache)",
    createdAt: "4d ago",
  },
  {
    id: "dep-bge-m3-embeddings",
    name: "bge-m3-embeddings-live",
    model: "BAAI/bge-m3",
    modelIcon: <BAAILogo size={15} />,
    engine: "TEI",
    engineIcon: <HuggingFaceLogo size={14} />,
    gpu: "1x T4",
    environment: "edge",
    region: "eu-west-1 (Edge)",
    status: "live",
    requests24h: "3.10M",
    costTotal: "$12.40",
    costPerMillion: "$0.04",
    latencyP95: "12.1 ms",
    ttft: "4.2 ms",
    errorRate: "0.00%",
    endpointUrl: "https://api.runinfra.ai/v1/embeddings",
    activeVersion: "v12.0 (FP16)",
    createdAt: "1w ago",
  },
  {
    id: "dep-flux-schnell",
    name: "flux-schnell-generator",
    model: "black-forest-labs/FLUX.1-schnell",
    modelIcon: <HuggingFaceLogo size={15} />,
    engine: "diffusers",
    engineIcon: <HuggingFaceLogo size={14} />,
    gpu: "1x A100-80GB",
    environment: "staging",
    region: "us-west-2 (Cloud)",
    status: "deploying",
    requests24h: "42K",
    costTotal: "$4.12",
    costPerMillion: "$0.98",
    latencyP95: "680 ms",
    ttft: "120 ms",
    errorRate: "0.02%",
    endpointUrl: "https://api.runinfra.ai/v1/images/generations",
    activeVersion: "v1.0 (BF16)",
    createdAt: "1h ago",
  },
];

export function DeploymentsView({
  deployments,
  onRollback,
  onSelectProgram,
  dark = true,
}: DeploymentsViewProps) {
  const [filterTab, setFilterTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const list: DeploymentItem[] = (deployments ?? []).map((deployment) => ({
    id: deployment.id,
    name: deployment.name,
    model: deployment.model,
    modelIcon: <Layers size={15} className="text-[#75bf00]" />,
    engine: deployment.executionDomain,
    engineIcon: <Cpu size={14} className="text-[#60a5fa]" />,
    gpu: "Backend-reported hardware",
    environment: deployment.environment,
    region: deployment.region,
    status: deployment.status === "live" || deployment.status === "deploying" ? deployment.status : deployment.status === "stopped" ? "stopped" : "paused",
    requests24h: deployment.requests24h.toLocaleString(),
    costTotal: `$${deployment.cost24hUsd.toFixed(2)}`,
    costPerMillion: "Backend-reported",
    latencyP95: `${deployment.p95LatencyMs} ms`,
    ttft: "Backend-reported",
    errorRate: `${deployment.errorRatePct}%`,
    endpointUrl: deployment.endpointUrl,
    activeVersion: deployment.activeVersion,
    createdAt: deployment.createdAt,
  }));

  const filteredList = list.filter((item) => {
    if (filterTab === "live" && item.status !== "live") return false;
    if (filterTab === "deploying" && item.status !== "deploying") return false;
    if (filterTab === "stopped" && item.status !== "stopped" && item.status !== "paused") return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.model.toLowerCase().includes(q) ||
        item.gpu.toLowerCase().includes(q) ||
        item.region.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard?.writeText(url);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-[1100px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">
            <span className="bg-[#75bf00] text-black px-2 py-0.5 rounded-xs font-bold inline-block">
              Deployments
            </span>
          </h1>
          <p className={cn("mt-1 text-xs", dark ? "text-[#889084]" : "text-[#656d60]")}>
            From promoted optimization to live endpoint, on Epoch Cloud or your own hardware. Click a row for its analytics, URL, and API tokens.
          </p>
        </div>

        <button
          type="button"
          className={cn(
            "flex items-center gap-1.5 border px-3 py-1.5 text-xs font-semibold rounded-xs transition-colors shadow-xs",
            dark ? "border-[#383838] bg-[#202020] text-[#F0EFE2] hover:border-[#75bf00]" : "border-[#d8ddd3] bg-white text-[#171a17] hover:border-[#171a17]"
          )}
        >
          <Plus size={13} />
          <span>New Deployment</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Filter Tabs matching Image 2 (Single Outer Dashed Container) */}
        <div className="inline-flex items-center border border-dashed border-[#383838] bg-[#141414] p-0.5 font-mono text-xs rounded-sm gap-1">
          {[
            { id: "all", label: `All (${list.length})` },
            { id: "live", label: `Live (${list.filter((item) => item.status === "live").length})` },
            { id: "deploying", label: `Deploying (${list.filter((item) => item.status === "deploying").length})` },
            { id: "stopped", label: `Stopped (${list.filter((item) => item.status === "stopped" || item.status === "paused").length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id)}
              className={cn(
                "px-2.5 py-0.5 text-xs font-mono transition-colors cursor-pointer rounded-sm flex items-center gap-1.5",
                filterTab === tab.id
                  ? "bg-[#242424] text-[#F0EFE2] font-bold"
                  : "text-[#889284] hover:text-[#F0EFE2]"
              )}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <label className={cn(
          "flex items-center gap-2 border border-dashed px-3 py-1.5 text-xs rounded-xs min-w-[240px]",
          dark ? "border-[#2e2e2e] bg-[#202020] text-[#788274]" : "border-[#d8ddd3] bg-white text-[#687063]"
        )}>
          <Search size={13} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deployments by model..."
            className="bg-transparent outline-none placeholder:text-[#666] font-mono text-xs w-full"
          />
        </label>
      </div>

      {/* Deployments Table Container */}
      <div className={cn(
        "border border-dashed divide-y divide-dashed overflow-hidden rounded-xs",
        dark ? "border-[#2e2e2e] bg-[#202020] divide-[#282828]" : "border-[#d8ddd3] bg-white divide-[#edf0eb]"
      )}>
        {/* Table Header Row */}
        <div className={cn(
          "grid grid-cols-12 gap-3 px-4 py-2.5 text-[11px] font-mono uppercase tracking-wider font-semibold border-b border-dashed",
          dark ? "border-[#282828] bg-[#181818] text-[#889084]" : "border-[#edf0eb] bg-[#fafbfa] text-[#6b7367]"
        )}>
          <div className="col-span-4">Pipeline & Model</div>
          <div className="col-span-2">Hardware & Engine</div>
          <div className="col-span-2 text-right">Requests (24h)</div>
          <div className="col-span-2 text-right">Cost / 1M</div>
          <div className="col-span-2 text-right">Latency p95</div>
        </div>

        {/* Table Data Rows */}
        {filteredList.map((item) => {
          const isExpanded = expandedRowId === item.id;

          return (
            <div key={item.id} className="transition-colors">
              {/* Main Summary Row */}
              <div
                onClick={() => setExpandedRowId(isExpanded ? null : item.id)}
                className={cn(
                  "grid grid-cols-12 gap-3 px-4 py-3.5 items-center cursor-pointer text-xs transition-colors",
                  isExpanded
                    ? dark ? "bg-[#252525]" : "bg-[#f5f8f3]"
                    : dark ? "hover:bg-[#232323]" : "hover:bg-[#fafbfa]"
                )}
              >
                {/* 1. Pipeline & Model */}
                <div className="col-span-4 flex items-center gap-2.5 truncate">
                  <span className={cn(
                    "flex h-2 w-2 rounded-full shrink-0",
                    item.status === "live" ? "bg-[#75bf00]" : "bg-[#38bdf8] animate-pulse"
                  )} />
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("font-semibold text-xs", dark ? "text-[#F0EFE2]" : "text-[#171a17]")}>
                        {item.name}
                      </span>
                      <span className={cn(
                        "text-[9px] uppercase font-mono px-1 py-0.2 rounded-xs font-bold",
                        item.status === "live"
                          ? dark ? "bg-[#162916] text-[#a3e635] border border-[#75bf00]/30" : "bg-[#f2fbe6] text-[#2d5800] border border-[#b9de78]"
                          : dark ? "bg-[#0c2a38] text-[#7dd3fc] border border-[#38bdf8]/30" : "bg-[#e0f2fe] text-[#0284c7] border border-[#bae6fd]"
                      )}>
                        {item.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#788274] font-mono mt-0.5 truncate">
                      {item.modelIcon}
                      <span className="truncate">{item.model}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Hardware & Engine */}
                <div className="col-span-2 space-y-0.5">
                  <div className="flex items-center gap-1.5 font-mono text-xs text-[#60a5fa]">
                    <NvidiaLogo size={12} />
                    <span>{item.gpu}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-[#788274] font-mono">
                    {item.engineIcon}
                    <span>{item.engine}</span>
                    <span>•</span>
                    <span>{item.region.split(" ")[0]}</span>
                  </div>
                </div>

                {/* 3. Requests (24h) */}
                <div className="col-span-2 text-right font-mono">
                  <div className={cn("font-bold text-xs", dark ? "text-[#F0EFE2]" : "text-[#171a17]")}>
                    {item.requests24h}
                  </div>
                  <div className="text-[11px] text-[#788274]">
                    err: {item.errorRate}
                  </div>
                </div>

                {/* 4. Cost */}
                <div className="col-span-2 text-right font-mono">
                  <div className={cn("font-bold text-xs text-[#a3e635]", !dark && "text-[#3c7000]")}>
                    {item.costPerMillion}
                  </div>
                  <div className="text-[11px] text-[#788274]">
                    24h: {item.costTotal}
                  </div>
                </div>

                {/* 5. Latency */}
                <div className="col-span-2 text-right font-mono flex items-center justify-end gap-2">
                  <div>
                    <div className={cn("font-bold text-xs", dark ? "text-[#F0EFE2]" : "text-[#171a17]")}>
                      {item.latencyP95}
                    </div>
                    <div className="text-[11px] text-[#788274]">
                      ttft: {item.ttft}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={14} className="text-[#C8C7BA] shrink-0" />
                  ) : (
                    <ChevronDown size={14} className="text-[#C8C7BA] shrink-0" />
                  )}
                </div>
              </div>

              {/* Expanded Detail Panel */}
              {isExpanded && (
                <div className={cn(
                  "border-t border-dashed p-4 space-y-4 text-xs font-mono animate-in fade-in duration-100",
                  dark ? "border-[#282828] bg-[#1a1a1a]" : "border-[#edf0eb] bg-[#fafbfa]"
                )}>
                  {/* Endpoint and cURL Snippet Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Left: Endpoint details (7 cols) */}
                    <div className="lg:col-span-7 space-y-2">
                      <span className="text-[10px] font-semibold uppercase text-[#788274] tracking-wider block font-sans">
                        Live API Endpoint URL
                      </span>

                      <div className={cn(
                        "flex items-center justify-between border border-dashed px-3 py-2 rounded-xs",
                        dark ? "border-[#333] bg-[#151515] text-[#F0EFE2]" : "border-[#d8ddd3] bg-white text-[#171a17]"
                      )}>
                        <span className="text-xs truncate">{item.endpointUrl}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyUrl(item.endpointUrl, item.id)}
                          className={cn(
                            "flex items-center gap-1 font-sans text-xs ml-2 px-2 py-0.5 rounded-xs transition-colors shrink-0",
                            copiedKeyId === item.id
                              ? "text-[#75bf00] font-bold"
                              : dark ? "text-[#889084] hover:text-[#F0EFE2] bg-[#222]" : "text-[#656d60] hover:text-black bg-[#f2f4f0]"
                          )}
                        >
                          {copiedKeyId === item.id ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedKeyId === item.id ? "Copied" : "Copy URL"}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                        <div className={cn("border border-dashed p-2 rounded-xs", dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#d8ddd3] bg-white")}>
                          <span className="text-[10px] text-[#788274] block uppercase font-sans">Active Version</span>
                          <span className={cn("font-bold text-xs truncate block", dark ? "text-[#F0EFE2]" : "text-[#171a17]")}>{item.activeVersion}</span>
                        </div>
                        <div className={cn("border border-dashed p-2 rounded-xs", dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#d8ddd3] bg-white")}>
                          <span className="text-[10px] text-[#788274] block uppercase font-sans">Region</span>
                          <span className={cn("font-bold text-xs truncate block", dark ? "text-[#F0EFE2]" : "text-[#171a17]")}>{item.region}</span>
                        </div>
                        <div className={cn("border border-dashed p-2 rounded-xs", dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#d8ddd3] bg-white")}>
                          <span className="text-[10px] text-[#788274] block uppercase font-sans">Created</span>
                          <span className={cn("font-bold text-xs truncate block", dark ? "text-[#F0EFE2]" : "text-[#171a17]")}>{item.createdAt}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Quick Actions & cURL (5 cols) */}
                    <div className="lg:col-span-5 space-y-2">
                      <span className="text-[10px] font-semibold uppercase text-[#788274] tracking-wider block font-sans">
                        Operations & Governance
                      </span>

                      <div className="flex items-center gap-2 flex-wrap pt-1 font-sans">
                        <button
                          type="button"
                          className={cn(
                            "flex items-center gap-1.5 border border-dashed px-3 py-1.5 text-xs font-semibold rounded-xs transition-colors",
                            dark ? "border-[#383838] bg-[#252525] text-[#F0EFE2] hover:border-[#75bf00]" : "border-[#d8ddd3] bg-white text-[#171a17] hover:border-[#171a17]"
                          )}
                        >
                          <Play size={12} />
                          <span>Test Request</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onRollback?.(item.id)}
                          className={cn(
                            "flex items-center gap-1.5 border border-dashed px-3 py-1.5 text-xs font-medium rounded-xs transition-colors",
                            dark ? "border-[#383838] bg-[#202020] text-[#a0a89d] hover:text-[#F0EFE2]" : "border-[#d8ddd3] bg-white text-[#525a4d]"
                          )}
                        >
                          <RotateCcw size={12} />
                          <span>Rollback</span>
                        </button>

                        <button
                          type="button"
                          className={cn(
                            "flex items-center gap-1.5 border border-dashed px-3 py-1.5 text-xs font-medium rounded-xs transition-colors",
                            dark ? "border-[#383838] bg-[#202020] text-[#a0a89d] hover:text-[#F0EFE2]" : "border-[#d8ddd3] bg-white text-[#525a4d]"
                          )}
                        >
                          <Pause size={12} />
                          <span>Pause</span>
                        </button>
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
