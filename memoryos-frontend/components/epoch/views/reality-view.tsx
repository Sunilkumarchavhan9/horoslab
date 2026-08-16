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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RealityEntity, RealityConflict, DriftEvent } from "@/lib/epoch-types";
import { EpochLoopGraph } from "@/components/epoch/primitives/epoch-loop-graph";

interface RealityViewProps {
  dark?: boolean;
  onSelectEntity?: (entityId: string) => void;
  onTriggerRediscovery?: () => void;
  onNavigateToPipelines?: () => void;
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
  const [activeTab, setActiveTab] = useState<"graph" | "loop" | "temporal" | "conflicts" | "drift">("graph");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedEntityId, setExpandedEntityId] = useState<string | null>("ent-svc-inference-api");

  const filteredEntities = SAMPLE_ENTITIES.filter((e) => {
    if (filterType !== "all" && e.type !== filterType) return false;
    if (searchQuery && !e.name.toLowerCase().includes(searchQuery.toLowerCase()) && !e.type.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const primaryText = dark ? "text-white" : "text-[#171a17]";
  const secondaryText = dark ? "text-[#889084]" : "text-[#656d60]";

  return (
    <div className="space-y-6 max-w-[1240px] mx-auto animate-in fade-in duration-150">
      {/* Top Header Matching Deployments & Registry Design */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono tracking-tight flex items-center gap-1.5">
            <span className={primaryText}>Company</span>
            <span className="bg-[#75bf00] text-black px-2 py-0.5 rounded-xs font-bold inline-block font-sans">
              reality
            </span>
          </h1>
          <p className={cn("mt-1 text-xs", secondaryText)}>
            {SAMPLE_ENTITIES.length} reconstructed entities in workspace. Continuously synchronized across software, runtimes, hardware, clouds, and telemetry.
          </p>
        </div>

        {/* Rediscover Action Button */}
        <button
          type="button"
          onClick={onTriggerRediscovery}
          className={cn(
            "flex items-center gap-2 border border-dashed px-3 py-1.5 text-xs font-mono rounded-xs transition-colors",
            dark
              ? "border-[#383838] bg-[#181818] text-[#a0a89d] hover:border-[#75bf00] hover:text-white"
              : "border-[#d8ddd3] bg-white text-[#555] hover:border-black hover:text-black"
          )}
        >
          <RefreshCw size={13} className="text-[#75bf00]" />
          <span>Rediscover Reality →</span>
        </button>
      </div>

      {/* Tabs & Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs font-mono">
          {[
            { id: "graph", label: `Reality Graph (${SAMPLE_ENTITIES.length})` },
            { id: "loop", label: "Closed Loop Architecture (16 Stages)" },
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
                  "relative flex items-center gap-1.5 px-3 py-1 border border-dashed transition-colors rounded-xs",
                  isActive
                    ? dark
                      ? "border-[#555] bg-[#282828] text-white font-bold"
                      : "border-[#888] bg-[#eaeaea] text-[#111] font-bold"
                    : dark
                    ? "border-transparent text-[#788274] hover:text-white"
                    : "border-transparent text-[#687063] hover:text-[#171a17]"
                )}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Box */}
        <div className="flex items-center gap-3">
          <label className={cn(
            "flex items-center gap-2 border border-dashed px-3 py-1.5 text-xs rounded-xs min-w-[240px]",
            dark ? "border-[#2e2e2e] bg-[#202020] text-[#788274]" : "border-[#d8ddd3] bg-white text-[#687063]"
          )}>
            <Search size={13} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reality entities..."
              className="w-full bg-transparent focus:outline-none placeholder:text-[#666] font-mono text-xs"
            />
          </label>

          <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-[#788274]">
            <span>{filteredEntities.length} entities</span>
            <span>•</span>
            <span className="text-[#75bf00] flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#75bf00]" />
              Synced &amp; Active
            </span>
          </div>
        </div>
      </div>

      {/* TAB 1: REALITY GRAPH FULL-WIDTH TABLE */}
      {activeTab === "graph" && (
        <div className="space-y-3">
          {/* Sub-Filter Pills */}
          <div className="flex items-center gap-1 text-xs font-mono">
            <span className="text-[#788274] mr-1">Filter:</span>
            {["all", "repository", "service", "cluster", "model", "database", "cloud_resource"].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilterType(f)}
                className={cn(
                  "px-2.5 py-0.5 rounded-xs capitalize text-[11px] border border-dashed transition-colors",
                  filterType === f
                    ? dark ? "bg-[#282828] text-[#75bf00] font-bold border-[#75bf00]" : "bg-[#eaeaea] text-[#111] font-bold border-[#75bf00]"
                    : dark ? "border-transparent text-[#788274] hover:text-white" : "border-transparent text-[#687063] hover:text-black"
                )}
              >
                {f.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Full-Width Table Container */}
          <div className={cn(
            "border border-dashed divide-y divide-dashed overflow-hidden rounded-xs",
            dark ? "border-[#2e2e2e] bg-[#202020] divide-[#282828]" : "border-[#d8ddd3] bg-white divide-[#edf0eb]"
          )}>
            {/* Table Header Row */}
            <div className={cn(
              "grid grid-cols-12 gap-3 px-4 py-2.5 text-[11px] font-mono uppercase tracking-wider font-semibold border-b border-dashed",
              dark ? "border-[#282828] bg-[#181818] text-[#889084]" : "border-[#edf0eb] bg-[#fafbfa] text-[#6b7367]"
            )}>
              <div className="col-span-4">Entity &amp; Reconstructed Identifier</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Source / Integration</div>
              <div className="col-span-2">Provenance Trust</div>
              <div className="col-span-1 text-center">Status</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {/* Table Rows */}
            {filteredEntities.map((ent) => {
              const isExpanded = expandedEntityId === ent.id;

              return (
                <div key={ent.id} className="transition-colors">
                  {/* Summary Row */}
                  <div
                    onClick={() => {
                      setExpandedEntityId(isExpanded ? null : ent.id);
                      onSelectEntity?.(ent.id);
                    }}
                    className={cn(
                      "grid grid-cols-12 gap-3 px-4 py-3.5 items-center cursor-pointer text-xs transition-colors",
                      dark ? "hover:bg-[#232323]" : "hover:bg-[#fafbfa]",
                      isExpanded ? dark ? "bg-[#252525]" : "bg-[#f5f7f3]" : ""
                    )}
                  >
                    {/* 1. Entity Name */}
                    <div className="col-span-4 flex items-center gap-2.5 truncate font-mono">
                      <div className={cn(
                        "flex h-7 w-7 items-center justify-center border border-dashed rounded-xs shrink-0",
                        dark ? "border-[#383838] bg-[#181818] text-[#889284]" : "border-[#d8ddd3] bg-[#f8faf6] text-[#687063]"
                      )}>
                        {ent.type === "repository" && <GitBranch size={14} className="text-[#60a5fa]" />}
                        {ent.type === "service" && <Layers size={14} className="text-[#75bf00]" />}
                        {ent.type === "cluster" && <Cpu size={14} className="text-[#a78bfa]" />}
                        {ent.type === "model" && <Activity size={14} className="text-[#f59e0b]" />}
                        {ent.type === "database" && <Database size={14} className="text-[#38bdf8]" />}
                        {ent.type === "cloud_resource" && <Server size={14} className="text-[#ec4899]" />}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className={cn("font-bold text-xs truncate", primaryText)}>{ent.name}</span>
                          <span className="text-[10px] text-[#788274] shrink-0">{ent.updatedAt}</span>
                        </div>
                        <div className="text-[10px] text-[#788274] mt-0.5">
                          ID: {ent.id}
                        </div>
                      </div>
                    </div>

                    {/* 2. Type */}
                    <div className="col-span-2 font-mono text-xs">
                      <span className={cn(
                        "px-2 py-0.5 border border-dashed rounded-xs text-[10px] uppercase font-bold",
                        ent.type === "service" || ent.type === "model"
                          ? "border-[#75bf00]/40 bg-[#75bf00]/10 text-[#75bf00]"
                          : "border-[#383838] bg-[#181818] text-[#a0a89d]"
                      )}>
                        {ent.type.replace("_", " ")}
                      </span>
                    </div>

                    {/* 3. Source */}
                    <div className="col-span-2 font-mono text-xs text-[#788274] truncate">
                      {ent.source}
                    </div>

                    {/* 4. Provenance Trust */}
                    <div className="col-span-2 font-mono text-xs">
                      <span className={cn(
                        "px-2 py-0.5 border border-dashed rounded-xs text-[10px] uppercase font-bold",
                        ent.trustLevel === "VERIFIED"
                          ? "border-[#75bf00]/40 bg-[#75bf00]/10 text-[#75bf00]"
                          : ent.trustLevel === "MEASURED"
                          ? "border-[#60a5fa]/40 bg-[#60a5fa]/10 text-[#60a5fa]"
                          : ent.trustLevel === "OBSERVED"
                          ? "border-[#a78bfa]/40 bg-[#a78bfa]/10 text-[#a78bfa]"
                          : "border-[#f59e0b]/40 bg-[#f59e0b]/10 text-[#f59e0b]"
                      )}>
                        {ent.trustLevel}
                      </span>
                    </div>

                    {/* 5. Status */}
                    <div className="col-span-1 text-center font-mono">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-xs font-bold border border-dashed",
                        ent.status === "healthy"
                          ? "border-[#75bf00]/40 bg-[#75bf00]/10 text-[#75bf00]"
                          : "border-[#ef4444]/40 bg-[#ef4444]/10 text-[#ef4444]"
                      )}>
                        <span className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          ent.status === "healthy" ? "bg-[#75bf00]" : "bg-[#ef4444]"
                        )} />
                        <span>{ent.status.toUpperCase()}</span>
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

                  {/* In-Row Deep Entity Inspector Drawer */}
                  {isExpanded && (
                    <div className={cn(
                      "p-4 border-t border-dashed space-y-4 text-xs font-mono",
                      dark ? "bg-[#161616] border-[#2e2e2e]" : "bg-[#fafbfa] border-[#edf0eb]"
                    )}>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className={cn("p-2.5 border border-dashed rounded-xs space-y-1", dark ? "border-[#282828] bg-[#121212]" : "border-[#ddd] bg-white")}>
                          <span className="text-[10px] text-[#788274] uppercase">Environment</span>
                          <div className={cn("font-bold capitalize", primaryText)}>{ent.environment}</div>
                        </div>
                        <div className={cn("p-2.5 border border-dashed rounded-xs space-y-1", dark ? "border-[#282828] bg-[#121212]" : "border-[#ddd] bg-white")}>
                          <span className="text-[10px] text-[#788274] uppercase">Provenance Trust</span>
                          <div className="font-bold text-[#75bf00]">{ent.trustLevel}</div>
                        </div>
                        <div className={cn("p-2.5 border border-dashed rounded-xs space-y-1", dark ? "border-[#282828] bg-[#121212]" : "border-[#ddd] bg-white")}>
                          <span className="text-[10px] text-[#788274] uppercase">Version / Commit</span>
                          <div className={cn("font-bold", primaryText)}>{ent.version ?? "1.0.0"}</div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#788274]">
                          <span>Observed Properties &amp; Telemetry Payload</span>
                          <span>Last Synced: {ent.updatedAt}</span>
                        </div>

                        <div className={cn(
                          "p-3 border border-dashed rounded-xs font-mono text-[11px] leading-relaxed overflow-x-auto",
                          dark ? "border-[#333] bg-[#0c0c0c] text-[#a3e635]" : "border-[#ddd] bg-[#111] text-[#a3e635]"
                        )}>
                          <pre>{JSON.stringify(ent.properties, null, 2)}</pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Empty State matching Image 1 */}
            {filteredEntities.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center text-center p-6 space-y-3 font-mono">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center border border-dashed rounded-xs",
                  dark ? "border-[#383838] bg-[#1a1a1a] text-[#888]" : "border-[#d8ddd3] bg-[#f8faf6] text-[#555]"
                )}>
                  <Globe size={18} className="text-[#888]" />
                </div>

                <div className="space-y-1 max-w-sm">
                  <h3 className={cn("font-bold text-xs", primaryText)}>
                    No entities match your filter
                  </h3>
                  <p className={cn("text-[11px]", secondaryText)}>
                    Run Rediscovery or select another category filter to view workspace reality.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CLOSED LOOP ARCHITECTURE */}
      {activeTab === "loop" && (
        <div className="space-y-4">
          <EpochLoopGraph dark={dark} />
        </div>
      )}

      {/* TAB 3: TEMPORAL WORLDSTATE INSPECTOR */}
      {activeTab === "temporal" && (
        <div className={cn(
          "border border-dashed p-6 rounded-xs space-y-4 font-mono",
          dark ? "border-[#2e2e2e] bg-[#181818]" : "border-[#d8ddd3] bg-white"
        )}>
          <div className="flex items-center justify-between border-b border-dashed border-[#282828] pb-3">
            <div>
              <div className="text-xs font-bold text-[#75bf00] uppercase">WORLDSTATE SNAPSHOT: WS-2026-08-11-0941</div>
              <div className="text-[11px] text-[#788274] mt-0.5">Merkle Root: 0x4e82b79a1f09c8d32e54a01c7793b821045f91a6</div>
            </div>
            <span className="border border-dashed border-[#75bf00]/40 bg-[#75bf00]/10 text-[#75bf00] px-2 py-0.5 text-[10px] font-bold rounded-xs">
              IMMUTABLE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className={cn("p-3 border border-dashed rounded-xs space-y-1", dark ? "border-[#282828] bg-[#121212]" : "border-[#eee] bg-[#fafafa]")}>
              <span className="text-[10px] text-[#788274] uppercase">Reconstructed Facts</span>
              <div className={cn("font-bold text-base", primaryText)}>6 Verified Facts</div>
            </div>
            <div className={cn("p-3 border border-dashed rounded-xs space-y-1", dark ? "border-[#282828] bg-[#121212]" : "border-[#eee] bg-[#fafafa]")}>
              <span className="text-[10px] text-[#788274] uppercase">State Diff Status</span>
              <div className="font-bold text-base text-[#75bf00]">Zero Drift (Fresh)</div>
            </div>
            <div className={cn("p-3 border border-dashed rounded-xs space-y-1", dark ? "border-[#282828] bg-[#121212]" : "border-[#eee] bg-[#fafafa]")}>
              <span className="text-[10px] text-[#788274] uppercase">State Recheck Protocol</span>
              <div className="font-bold text-base text-[#60a5fa]">Passed Pre-Execution</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CONFLICTS TAB FULL-WIDTH */}
      {activeTab === "conflicts" && (
        <div className={cn(
          "border border-dashed divide-y divide-dashed overflow-hidden rounded-xs",
          dark ? "border-[#2e2e2e] bg-[#202020] divide-[#282828]" : "border-[#d8ddd3] bg-white divide-[#edf0eb]"
        )}>
          {SAMPLE_CONFLICTS.map((conf) => (
            <div key={conf.id} className="p-5 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={15} className="text-[#f59e0b]" />
                  <span className={cn("font-bold text-sm", primaryText)}>{conf.entityName}</span>
                </div>
                <span className="border border-dashed border-[#f59e0b]/40 bg-[#f59e0b]/10 text-[#f59e0b] px-2 py-0.5 text-[10px] font-bold rounded-xs uppercase">
                  {conf.status}
                </span>
              </div>

              <div className="space-y-2">
                {conf.signals.map((sig, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "p-3 border border-dashed rounded-xs flex items-center justify-between text-xs",
                      sig.isHealthy
                        ? dark ? "border-[#75bf00]/30 bg-[#121c12]" : "border-[#b9de78] bg-[#f5faee]"
                        : dark ? "border-[#ef4444]/30 bg-[#1c1212]" : "border-[#fca5a5] bg-[#fff5f5]"
                    )}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span className={sig.isHealthy ? "text-[#75bf00]" : "text-[#ef4444]"}>{sig.source}</span>
                        <span className="text-[10px] text-[#788274]">({sig.trustLevel})</span>
                      </div>
                      <div className="text-[11px] text-[#888] mt-0.5">{sig.claim}</div>
                    </div>
                    <span className="text-[10px] text-[#666]">{sig.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: DRIFT FABRIC TAB FULL-WIDTH */}
      {activeTab === "drift" && (
        <div className={cn(
          "border border-dashed divide-y divide-dashed overflow-hidden rounded-xs",
          dark ? "border-[#2e2e2e] bg-[#202020] divide-[#282828]" : "border-[#d8ddd3] bg-white divide-[#edf0eb]"
        )}>
          {SAMPLE_DRIFTS.map((drift) => (
            <div key={drift.id} className="p-5 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-[#75bf00]" />
                  <span className={cn("font-bold text-sm", primaryText)}>{drift.target}</span>
                </div>
                <span className={cn(
                  "border border-dashed px-2 py-0.5 text-[10px] font-bold rounded-xs uppercase",
                  drift.status === "detected"
                    ? "border-[#f59e0b]/40 bg-[#f59e0b]/10 text-[#f59e0b]"
                    : "border-[#75bf00]/40 bg-[#75bf00]/10 text-[#75bf00]"
                )}>
                  {drift.status}
                </span>
              </div>
              <p className="text-[11px] text-[#888] leading-relaxed">{drift.delta}</p>
              <div className="text-[10px] text-[#75bf00] font-bold">Action: {drift.recommendedAction}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
