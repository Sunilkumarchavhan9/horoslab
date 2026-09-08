"use client";

import React, { useState } from "react";
import {
  Globe,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Layers,
  ArrowRight,
  Shield,
  Activity,
  Cpu,
  Server,
  Database,
  GitBranch,
  ChevronDown,
  ChevronUp,
  FileCode,
  Terminal,
  ExternalLink,
  HelpCircle,
  Clock,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RealityEntity, RealityConflict, DriftEvent } from "@/lib/epoch-types";
import {
  MetaLogo,
  NvidiaLogo,
  QwenLogo,
  DeepSeekLogo,
  GoogleLogo,
  HuggingFaceLogo,
  MistralLogo,
  GitHubLogo,
  AWSLogo,
  KubernetesLogo,
  QdrantLogo,
} from "../primitives/brand-icons";

interface RealityViewProps {
  dark?: boolean;
  onSelectEntity?: (entityId: string) => void;
  onTriggerRediscovery?: () => void;
  onNavigateToPipelines?: () => void;
}

interface UnknownRecord {
  id: string;
  statement: string;
  category: "hardware" | "workload" | "pricing" | "quality";
  importance: "CRITICAL" | "HIGH" | "MEDIUM";
  uncertaintyPct: number;
  decisionImpact: string;
  resolutionCost: string;
  resolutionStrategy: "BENCHMARK" | "OBSERVE" | "SIMULATE" | "QUERY";
  status: "investigating" | "resolved" | "queued";
}

const SAMPLE_ENTITIES: RealityEntity[] = [
  {
    id: "ent-repo-checkout",
    name: "github.com/enterprise/checkout-service",
    type: "repository",
    status: "healthy",
    environment: "production",
    version: "v3.18.2",
    source: "GitHub Webhook",
    trustLevel: "OBSERVED",
    properties: { commits24h: 14, openPRs: 2, defaultBranch: "main" },
    updatedAt: "3 mins ago",
  },
  {
    id: "ent-svc-inference-api",
    name: "inference-gateway-prod",
    type: "service",
    status: "healthy",
    environment: "production",
    version: "1.4.0",
    source: "OpenTelemetry / K8s",
    trustLevel: "MEASURED",
    properties: { replicas: 8, rpsP95: 1420, p99LatencyMs: 38.4 },
    updatedAt: "1 min ago",
  },
  {
    id: "ent-hw-cluster-east",
    name: "gpu-node-h100-pool-east1a",
    type: "cluster",
    status: "healthy",
    environment: "datacenter",
    source: "Data Center IPMI + K8s",
    trustLevel: "OBSERVED",
    properties: { totalGpus: 32, allocatedGpus: 28, tempAvgC: 58, powerUsageKw: 22.4 },
    updatedAt: "30s ago",
  },
  {
    id: "ent-model-llama3",
    name: "meta-llama/Llama-3.1-8B-Instruct",
    type: "model",
    status: "healthy",
    environment: "production",
    version: "commit:8f4ca7b",
    source: "Hugging Face Pinned Hub",
    trustLevel: "VERIFIED",
    properties: { engine: "vLLM-0.6.2", format: "FP8", hardware: "A100-SXM4-40GB" },
    updatedAt: "5 mins ago",
  },
  {
    id: "ent-model-qwen",
    name: "Qwen/Qwen2.5-32B-Instruct",
    type: "model",
    status: "healthy",
    environment: "production",
    version: "commit:8ac32f",
    source: "Alibaba Cloud / ModelScope",
    trustLevel: "VERIFIED",
    properties: { engine: "SGLang-0.4.1", format: "FP8", hardware: "H100-SXM5-80GB" },
    updatedAt: "8 mins ago",
  },
  {
    id: "ent-db-vector-store",
    name: "qdrant-enterprise-cluster",
    type: "database",
    status: "healthy",
    environment: "production",
    version: "1.9.4",
    source: "K8s StatefulSet",
    trustLevel: "OBSERVED",
    properties: { vectorsIndexed: "14.2M", memoryUsageGb: 48.2 },
    updatedAt: "10 mins ago",
  },
  {
    id: "ent-cloud-aws-spot",
    name: "aws-us-east-1-g5.12xlarge",
    type: "cloud_resource",
    status: "degraded",
    environment: "production",
    source: "AWS CloudWatch API",
    trustLevel: "EXTERNAL",
    properties: { spotInterruptionRisk: "Medium (18%)", instanceCount: 4 },
    updatedAt: "2 mins ago",
  },
  // Section 121: Data Center & Bare-Metal Hardware Telemetry
  {
    id: "ent-dc-node-01",
    name: "gpu-node-h100-01.dc-east",
    type: "datacenter" as any,
    status: "healthy",
    environment: "datacenter",
    source: "Data Center IPMI + NVLink Telemetry",
    trustLevel: "MEASURED",
    properties: { hardware: "NVIDIA H100 80GB SXM5", vramAlloc: "48.5 / 80 GB", tempC: 64, powerW: 410, nvlinkContention: "4.2%" },
    updatedAt: "12s ago",
  },
  {
    id: "ent-dc-rack-04",
    name: "baremetal-h100-rack-04",
    type: "datacenter" as any,
    status: "healthy",
    environment: "datacenter",
    source: "Facilities Modbus Telemetry",
    trustLevel: "MEASURED",
    properties: { pue: "1.12 PUE", powerDrawKw: 18.4, coolingTempC: 21.4, rackBalance: "Optimal" },
    updatedAt: "45s ago",
  },
  // Section 120: Physical World Sensory Assets
  {
    id: "ent-sensory-cam-01",
    name: "cam-factory-01.workcell3",
    type: "sensory" as any,
    status: "healthy",
    environment: "production",
    source: "RTSP 4K Video Stream",
    trustLevel: "OBSERVED",
    properties: { feed: "4K 60fps Stream", scope: "Workcell 03 Floor", clarity: "99.4%", modelRecog: "89% Accuracy" },
    updatedAt: "5s ago",
  },
  {
    id: "ent-sensory-temp-04",
    name: "temp-motor-04.conveyor2",
    type: "sensory" as any,
    status: "degraded",
    environment: "production",
    source: "Industrial Modbus Sensor",
    trustLevel: "MEASURED",
    properties: { target: "Conveyor Motor 04", tempC: 72, limitC: 75, vibrationHz: 124 },
    updatedAt: "2s ago",
  },
];

const SAMPLE_UNKNOWNS: UnknownRecord[] = [
  {
    id: "unk-101",
    statement: "Peak throughput for Qwen-2.5-32B under 128k context on 1x NVIDIA H100 SXM5",
    category: "hardware",
    importance: "CRITICAL",
    uncertaintyPct: 42,
    decisionImpact: "Determines whether 1x H100 replaces 2x A100 for batch agent workload",
    resolutionCost: "$4.20 (Sandbox GPU run)",
    resolutionStrategy: "BENCHMARK",
    status: "investigating",
  },
  {
    id: "unk-102",
    statement: "Inter-datacenter network latency variance between us-east-1 and colocation during peak US trading hours",
    category: "workload",
    importance: "HIGH",
    uncertaintyPct: 28,
    decisionImpact: "Dictates pipeline partitioning between cloud gateway and on-prem inference nodes",
    resolutionCost: "$0.00 (Telemetry ingest)",
    resolutionStrategy: "OBSERVE",
    status: "investigating",
  },
];

const SAMPLE_CONFLICTS: RealityConflict[] = [
  {
    id: "conf-1",
    entityId: "ent-hw-cluster-east",
    entityName: "gpu-node-h100-pool-east1a (Node #4)",
    signals: [
      { source: "AWS EC2 API", claim: "Instance i-08a9f is RUNNING and Healthy", trustLevel: "EXTERNAL", timestamp: "1 min ago", isHealthy: true },
      { source: "Kubernetes Kubelet", claim: "Node NotReady - nvidia.com/gpu device missing", trustLevel: "OBSERVED", timestamp: "30s ago", isHealthy: false },
      { source: "GPU Telemetry (DCGM)", claim: "PCIe Bus Fatal Error reported on GPU 0", trustLevel: "MEASURED", timestamp: "20s ago", isHealthy: false },
    ],
    resolutionStrategy: "experiment",
    status: "investigating",
  },
];

const SAMPLE_DRIFTS: DriftEvent[] = [
  {
    id: "drift-1",
    target: "Llama-3.1-8B Inference Gateway",
    driftType: "workload",
    severity: "medium",
    delta: "Prompt context token length shifted from 512 avg to 2,840 avg (p95 +450%)",
    detectedAt: "14 mins ago",
    recommendedAction: "Trigger Rediscovery for dynamic prefix-cache & KV-cache allocation",
    status: "detected",
  },
  {
    id: "drift-2",
    target: "AWS US-East-1 vs On-Prem Colocation",
    driftType: "cost",
    severity: "low",
    delta: "Spot instance cost increased +18.4% above On-Prem GPU benchmark threshold",
    detectedAt: "1 hour ago",
    recommendedAction: "Propose migration mission to colocation data center cluster",
    status: "remediated",
  },
];

export function RealityView({
  dark = true,
  onSelectEntity,
  onTriggerRediscovery,
  onNavigateToPipelines,
}: RealityViewProps) {
  const [activeTab, setActiveTab] = useState<"graph" | "unknowns" | "temporal" | "conflicts" | "drift">("graph");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedEntityId, setExpandedEntityId] = useState<string | null>(null);
  function getBrandLogo(ent: RealityEntity) {
    const raw = `${ent.id} ${ent.name} ${ent.source}`.toLowerCase();
    if (raw.includes("llama") || raw.includes("meta")) return <MetaLogo size={16} />;
    if (raw.includes("qwen") || raw.includes("alibaba") || raw.includes("inforact")) return <QwenLogo size={16} />;
    if (raw.includes("deepseek")) return <DeepSeekLogo size={16} />;
    if (raw.includes("mistral") || raw.includes("mixtral")) return <MistralLogo size={16} />;
    if (ent.type === "cluster" || raw.includes("h100") || raw.includes("a100") || raw.includes("nvidia")) return <NvidiaLogo size={16} />;
    if (ent.type === "repository" || raw.includes("github")) return <GitHubLogo size={15} />;
    if (ent.type === "cloud_resource" || raw.includes("aws") || raw.includes("amazon")) return <AWSLogo size={16} />;
    if (ent.type === "service" || raw.includes("k8s") || raw.includes("kubernetes")) return <KubernetesLogo size={15} />;
    if (ent.type === "database" || raw.includes("qdrant")) return <QdrantLogo size={15} />;
    return <Globe size={15} className="text-[#788274]" />;
  }

  const filteredEntities = SAMPLE_ENTITIES.filter((e) => {
    if (filterType !== "all") {
      if (filterType === "computational") {
        if (e.type !== "repository" && e.type !== "service" && e.type !== "model" && e.type !== "database" && e.type !== "cluster") return false;
      } else if (filterType === "sensory") {
        if (e.type !== ("sensory" as any)) return false;
      } else if (filterType === "datacenter") {
        if (e.type !== ("datacenter" as any) && e.environment !== "datacenter") return false;
      } else if (e.type !== filterType) {
        return false;
      }
    }
    if (searchQuery && !e.name.toLowerCase().includes(searchQuery.toLowerCase()) && !e.type.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-[1240px] mx-auto pb-16 font-sans text-xs animate-in fade-in duration-150">
      {/* Top Header Matching Sleek Dark Style */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#282828] pb-4">
        <div>
          <h1 className="text-xl font-bold font-mono tracking-tight flex items-center gap-1.5 text-[#F0EFE2]">
            <span>Company</span>
            <span className="bg-[#75bf00] text-black px-2 py-0.5 rounded-xs font-bold inline-block font-sans text-base">
              reality
            </span>
          </h1>
          <p className="mt-1 text-xs text-[#90988c]">
            Live operational state and infrastructure across your workspace.
          </p>
        </div>

        <div className="flex items-center gap-2.5 font-mono text-xs">
          {/* WorldState Digest Badge */}
          <div className="border border-[#333] bg-[#181818] text-[#a0a89d] px-2.5 py-1 rounded-xs flex items-center gap-1.5">
            <Lock size={12} className="text-[#86dc00]" />
            <span>v14.2 (sha256:7f8a...)</span>
          </div>

          {/* Rediscover Action Button */}
          <button
            type="button"
            onClick={onTriggerRediscovery}
            className="flex items-center gap-1.5 border border-[#383838] bg-[#222] text-[#F0EFE2] hover:border-[#555] px-3 py-1 text-xs font-medium transition-colors rounded-xs cursor-pointer"
          >
            <RefreshCw size={12} className="text-[#86dc00]" />
            <span>Rediscover Reality</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-4 border-b border-[#282828] pb-1 font-mono text-xs overflow-x-auto">
          {[
            { id: "graph", label: `Reality Graph (${SAMPLE_ENTITIES.length})` },
            { id: "unknowns", label: `Unknowns (${SAMPLE_UNKNOWNS.length})` },
            { id: "temporal", label: "WorldState Inspector" },
            { id: "conflicts", label: `Conflicts (${SAMPLE_CONFLICTS.length})` },
            { id: "drift", label: `Drift Fabric (${SAMPLE_DRIFTS.length})` },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  "pb-2 transition-colors border-b-2 cursor-pointer font-medium whitespace-nowrap",
                  isActive
                    ? "border-[#75bf00] text-[#F0EFE2] font-bold"
                    : "border-transparent text-[#889284] hover:text-[#F0EFE2]"
                )}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Box */}
        <div className="flex items-center gap-2 border border-dashed border-[#282828] bg-[#181818] px-3 py-1.5 text-xs rounded-xs w-full sm:w-72">
          <Search size={13} className="text-[#788274]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reality entities..."
            className="w-full bg-transparent focus:outline-none placeholder:text-[#666] font-mono text-xs text-[#F0EFE2]"
          />
        </div>
      </div>

      {/* TAB 1: REALITY GRAPH TABLE */}
      {activeTab === "graph" && (
        <div className="space-y-3">
          {/* Sub-Filter Strip & 24 hours Freshness Window matching User Image */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center border border-dashed border-[#383838] bg-[#141414] p-0.5 font-mono text-xs rounded-sm gap-1 overflow-x-auto max-w-full">
              <span className="text-[#788274] px-1.5 font-bold shrink-0">Domain:</span>
              {[
                { id: "all", label: "All" },
                { id: "computational", label: "Computational" },
                { id: "sensory", label: "Physical Edge" },
                { id: "datacenter", label: "Industrial Data Center" },
                { id: "repository", label: "Repository" },
                { id: "service", label: "Service" },
                { id: "model", label: "Model" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterType(f.id)}
                  className={cn(
                    "px-2.5 py-0.5 text-xs font-mono transition-colors cursor-pointer rounded-sm whitespace-nowrap",
                    filterType === f.id
                      ? "bg-[#242424] text-[#F0EFE2] font-bold"
                      : "text-[#889284] hover:text-[#F0EFE2]"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* 24 hours Time Window Badge (1:1 Match with User Image) */}
            <div className="inline-flex items-center border border-dashed border-[#383838] bg-[#141414] p-0.5 font-mono text-xs rounded-sm">
              <span className="bg-[#242424] text-[#F0EFE2] font-bold px-2 py-0.5 rounded-sm">
                24 hours
              </span>
            </div>
          </div>

          {/* Full-Width Table */}
          <div className="border border-dashed border-[#282828] bg-[#181818] divide-y divide-[#242424] rounded-xs overflow-hidden">
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-3 px-4 py-2.5 text-[10px] font-mono uppercase tracking-wider font-semibold border-b border-[#282828] bg-[#141414] text-[#889084]">
              <div className="col-span-4">Entity &amp; Identifier</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Source / Integration</div>
              <div className="col-span-2">Provenance Trust</div>
              <div className="col-span-1 text-center">Status</div>
              <div className="col-span-1 text-right">Inspect</div>
            </div>

            {/* Table Rows */}
            {filteredEntities.map((ent) => {
              const isExpanded = expandedEntityId === ent.id;

              return (
                <div key={ent.id} className="transition-colors">
                  <div
                    onClick={() => {
                      setExpandedEntityId(isExpanded ? null : ent.id);
                      onSelectEntity?.(ent.id);
                    }}
                    className={cn(
                      "grid grid-cols-12 gap-3 px-4 py-3 items-center cursor-pointer text-xs transition-colors group",
                      isExpanded ? "bg-[#202020]" : "hover:bg-[#1e1e1e]"
                    )}
                  >
                    {/* Entity Name with Authentic Brand Vector Logo */}
                    <div className="col-span-4 flex items-center gap-3 truncate font-mono">
                      <div className="flex h-6 w-6 items-center justify-center shrink-0">
                        {getBrandLogo(ent)}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs truncate text-[#F0EFE2] group-hover:text-[#75bf00]">{ent.name}</span>
                          <span className="text-[10px] text-[#788274] shrink-0">{ent.updatedAt}</span>
                        </div>
                        <div className="text-[10px] text-[#788274]">ID: {ent.id}</div>
                      </div>
                    </div>

                    {/* Type (Clean text without loud button box) */}
                    <div className="col-span-2 font-mono text-xs text-[#a0a89d]">
                      <span className="capitalize">{ent.type.replace("_", " ")}</span>
                      <span className="text-[10px] text-[#788274] block">({ent.environment})</span>
                    </div>

                    {/* Source */}
                    <div className="col-span-2 font-mono text-xs text-[#788274] truncate">
                      {ent.source}
                    </div>

                    {/* Provenance Trust */}
                    <div className="col-span-2 font-mono text-xs">
                      <span className={cn(
                        "px-2 py-0.5 border rounded-xs text-[10px] uppercase font-bold",
                        ent.trustLevel === "VERIFIED"
                          ? "border-[#384820] bg-[#1c2a12] text-[#86dc00]"
                          : ent.trustLevel === "MEASURED"
                            ? "border-[#1e3a8a] bg-[#172554] text-[#60a5fa]"
                            : "border-[#383838] bg-[#181818] text-[#a0a89d]"
                      )}>
                        {ent.trustLevel}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="col-span-1 text-center font-mono">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-xs font-bold border",
                        ent.status === "healthy"
                          ? "border-[#384820] bg-[#1c2a12] text-[#86dc00]"
                          : "border-[#7f1d1d] bg-[#450a0a] text-[#f87171]"
                      )}>
                        <span>{ent.status.toUpperCase()}</span>
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex items-center justify-end font-mono">
                      <button type="button" className="text-[#788274] group-hover:text-[#F0EFE2] p-1 cursor-pointer">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Deep Entity Inspector Drawer */}
                  {isExpanded && (
                    <div className="p-4 border-t border-dashed border-[#282828] bg-transparent space-y-4 font-mono text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3 border border-dashed border-[#282828] rounded-xs space-y-1">
                          <span className="text-[10px] text-[#788274] uppercase tracking-wider">Environment</span>
                          <div className="font-bold text-[#F0EFE2] capitalize">{ent.environment}</div>
                        </div>
                        <div className="p-3 border border-dashed border-[#282828] rounded-xs space-y-1">
                          <span className="text-[10px] text-[#788274] uppercase tracking-wider">Provenance Trust</span>
                          <div className="font-bold text-[#75bf00]">{ent.trustLevel}</div>
                        </div>
                        <div className="p-3 border border-dashed border-[#282828] rounded-xs space-y-1">
                          <span className="text-[10px] text-[#788274] uppercase tracking-wider">Version / Commit</span>
                          <div className="font-bold text-[#F0EFE2]">{ent.version ?? "1.0.0"}</div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#788274]">
                          <span>Observed Properties &amp; Telemetry Payload</span>
                          <span>Last Synced: {ent.updatedAt}</span>
                        </div>
                        <pre className="p-3 border border-dashed border-[#282828] bg-transparent text-[#75bf00] rounded-xs text-[11px] overflow-x-auto leading-relaxed">
                          <code>{JSON.stringify(ent.properties, null, 2)}</code>
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: UNKNOWNS & HYPOTHESIS ENGINE (Master Blueprint Sec 23 & 24) */}
      {activeTab === "unknowns" && (
        <div className="border border-dashed border-[#282828] bg-[#181818] divide-y divide-[#242424] rounded-xs overflow-hidden font-mono text-xs">
          <div className="p-4 bg-[#141414] border-b border-[#282828] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs text-[#F0EFE2] uppercase tracking-wider font-sans">
                Unknown Engine &amp; Active Hypotheses
              </h3>
              <p className="text-[11px] text-[#788274] mt-0.5">
                First-class unknowns prioritized by: decision_impact × uncertainty × risk / resolution_cost
              </p>
            </div>
            <span className="border border-[#384820] bg-[#1c2a12] text-[#86dc00] px-2 py-0.5 text-[10px] font-bold rounded-xs">
              AUTONOMOUS INVESTIGATION ACTIVE
            </span>
          </div>

          {SAMPLE_UNKNOWNS.map((unk) => (
            <div key={unk.id} className="p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <HelpCircle size={14} className="text-[#f59e0b] shrink-0" />
                  <span className="font-bold text-[#F0EFE2] text-xs">{unk.statement}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="border border-[#333] bg-[#202020] text-[#a0a89d] px-2 py-0.5 rounded-xs text-[10px] font-bold">
                    Uncertainty: {unk.uncertaintyPct}%
                  </span>
                  <span className="border border-[#384820] bg-[#1c2a12] text-[#86dc00] px-2 py-0.5 rounded-xs text-[10px] font-bold">
                    {unk.resolutionStrategy}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-[#788274]">
                <div className="border border-[#262626] bg-[#141414] p-2.5 rounded-xs">
                  <span className="text-[10px] uppercase text-[#C8C7BA] block mb-0.5">Decision Dependency</span>
                  <span className="text-[#F0EFE2]">{unk.decisionImpact}</span>
                </div>
                <div className="border border-[#262626] bg-[#141414] p-2.5 rounded-xs">
                  <span className="text-[10px] uppercase text-[#C8C7BA] block mb-0.5">Estimated Resolution Cost</span>
                  <span className="text-[#F0EFE2]">{unk.resolutionCost}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: TEMPORAL WORLDSTATE INSPECTOR */}
      {activeTab === "temporal" && (
        <div className="border border-dashed border-[#282828] bg-[#181818] p-6 rounded-xs space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-[#282828] pb-3">
            <div>
              <div className="text-xs font-bold text-[#86dc00] uppercase">WORLDSTATE SNAPSHOT: WS-2026-08-19-0941</div>
              <div className="text-[11px] text-[#788274] mt-0.5">Merkle Root: 0x4e82b79a1f09c8d32e54a01c7793b821045f91a6</div>
            </div>
            <span className="border border-[#384820] bg-[#1c2a12] text-[#86dc00] px-2 py-0.5 text-[10px] font-bold rounded-xs">
              IMMUTABLE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 border border-[#282828] bg-[#141414] rounded-xs space-y-1">
              <span className="text-[10px] text-[#788274] uppercase">Reconstructed Facts</span>
              <div className="font-bold text-base text-[#F0EFE2]">48 Verified Facts</div>
            </div>
            <div className="p-3 border border-[#282828] bg-[#141414] rounded-xs space-y-1">
              <span className="text-[10px] text-[#788274] uppercase">State Diff Status</span>
              <div className="font-bold text-base text-[#86dc00]">Zero Drift (Fresh)</div>
            </div>
            <div className="p-3 border border-[#282828] bg-[#141414] rounded-xs space-y-1">
              <span className="text-[10px] text-[#788274] uppercase">State Recheck Protocol</span>
              <div className="font-bold text-base text-[#60a5fa]">Passed Pre-Execution</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CONFLICTS TAB */}
      {activeTab === "conflicts" && (
        <div className="border border-dashed border-[#282828] bg-[#181818] divide-y divide-[#242424] rounded-xs overflow-hidden font-mono text-xs">
          {SAMPLE_CONFLICTS.map((conf) => (
            <div key={conf.id} className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={15} className="text-[#f59e0b]" />
                  <span className="font-bold text-sm text-[#F0EFE2]">{conf.entityName}</span>
                </div>
                <span className="border border-[#78350f] bg-[#451a03]/40 text-[#f59e0b] px-2 py-0.5 text-[10px] font-bold rounded-xs uppercase">
                  {conf.status}
                </span>
              </div>

              <div className="space-y-2">
                {conf.signals.map((sig, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "p-3 border rounded-xs flex items-center justify-between text-xs",
                      sig.isHealthy
                        ? "border-[#384820] bg-[#142012]"
                        : "border-[#7f1d1d] bg-[#300a0a]"
                    )}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span className={sig.isHealthy ? "text-[#86dc00]" : "text-[#f87171]"}>{sig.source}</span>
                        <span className="text-[10px] text-[#788274]">({sig.trustLevel})</span>
                      </div>
                      <div className="text-[11px] text-[#a0a89d] mt-0.5">{sig.claim}</div>
                    </div>
                    <span className="text-[10px] text-[#788274]">{sig.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: DRIFT FABRIC TAB */}
      {activeTab === "drift" && (
        <div className="border border-dashed border-[#282828] bg-[#181818] divide-y divide-[#242424] rounded-xs overflow-hidden font-mono text-xs">
          {SAMPLE_DRIFTS.map((drift) => (
            <div key={drift.id} className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-[#86dc00]" />
                  <span className="font-bold text-sm text-[#F0EFE2]">{drift.target}</span>
                </div>
                <span className={cn(
                  "border px-2 py-0.5 text-[10px] font-bold rounded-xs uppercase",
                  drift.status === "detected"
                    ? "border-[#78350f] bg-[#451a03]/40 text-[#f59e0b]"
                    : "border-[#384820] bg-[#1c2a12] text-[#86dc00]"
                )}>
                  {drift.status}
                </span>
              </div>
              <p className="text-[11px] text-[#a0a89d] leading-relaxed">{drift.delta}</p>
              <div className="text-[10px] text-[#86dc00] font-bold">Action: {drift.recommendedAction}</div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
