"use client";

import React, { useState } from "react";
import {
  Cloud,
  Cpu,
  Server,
  Database,
  Activity,
  Zap,
  Shield,
  Check,
  Plus,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Gauge,
  Key,
  Layers,
  Sparkles,
  ArrowUpRight,
  Info,
  Radio,
  Sliders,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RealityConnectionsViewProps {
  dark?: boolean;
}

export function RealityConnectionsView({ dark = true }: RealityConnectionsViewProps) {
  const [selectedProviderCategory, setSelectedProviderCategory] = useState<
    "all" | "cloud" | "clusters" | "registries" | "telemetry" | "physical" | "energy"
  >("all");

  const [expandedRealityCloud, setExpandedRealityCloud] = useState<string | null>("runpod");
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [selectedConnectProvider, setSelectedConnectProvider] = useState("RunPod");

  const [runpodApiKey, setRunpodApiKey] = useState("");
  const [isRunpodConnected, setIsRunpodConnected] = useState(true);

  return (
    <div className="space-y-8 max-w-[1100px] animate-in fade-in duration-200">
      {/* Header Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-dashed pb-5 dark:border-[#2a2a2a] border-[#d8ddd3]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={cn("text-2xl font-bold tracking-tight", dark ? "text-[#F0EFE2]" : "text-[#171a17]")}>
              <span className="bg-[#75bf00] px-2.5 py-0.5 text-black inline-block font-medium rounded-xs">
                Reality Connections
              </span>
            </h1>
            <span className="border border-[#75bf00]/40 bg-[#162916] text-[#a3e635] text-[10px] font-mono font-bold px-2 py-0.5 rounded-xs uppercase tracking-wider">
              12 Discovered
            </span>
          </div>
          <p className={cn("mt-1.5 text-xs max-w-2xl leading-relaxed", dark ? "text-[#90988c]" : "text-[#555d50]")}>
            Connect and discover computational, physical, and telemetry reality. Epoch automatically maps resources, discovers execution capabilities, ingests live state, and proves mission consequences.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setConnectModalOpen(true)}
          className="flex items-center gap-2 bg-[#75bf00] hover:bg-[#67a800] text-black font-semibold text-xs px-3.5 py-2 rounded-xs transition-colors shrink-0 cursor-pointer shadow-sm"
        >
          <Plus size={14} />
          <span>Connect Reality Surface</span>
        </button>
      </div>

      {/* Overview Reality Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className={cn("p-3.5 border rounded-xs space-y-1", dark ? "border-[#262626] bg-[#141414]" : "border-[#e0e4dc] bg-white")}>
          <div className="text-[10px] font-mono uppercase text-[#788274]">Discovered GPUs</div>
          <div className="text-lg font-bold font-mono text-[#75bf00]">14 GPUs</div>
          <div className="text-[10px] text-[#C8C7BA]">8x H100, 4x H200, 2x L40S</div>
        </div>

        <div className={cn("p-3.5 border rounded-xs space-y-1", dark ? "border-[#262626] bg-[#141414]" : "border-[#e0e4dc] bg-white")}>
          <div className="text-[10px] font-mono uppercase text-[#788274]">Active Workloads</div>
          <div className="text-lg font-bold font-mono text-[#F0EFE2]">11 Active</div>
          <div className="text-[10px] text-[#C8C7BA]">7 Running, 4 Provisioning</div>
        </div>

        <div className={cn("p-3.5 border rounded-xs space-y-1", dark ? "border-[#262626] bg-[#141414]" : "border-[#e0e4dc] bg-white")}>
          <div className="text-[10px] font-mono uppercase text-[#788274]">Reality Sync</div>
          <div className="text-lg font-bold font-mono text-[#a3e635] flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#75bf00] animate-pulse" />
            <span>34s ago</span>
          </div>
          <div className="text-[10px] text-[#C8C7BA]">Continuous state telemetry</div>
        </div>

        <div className={cn("p-3.5 border rounded-xs space-y-1", dark ? "border-[#262626] bg-[#141414]" : "border-[#e0e4dc] bg-white")}>
          <div className="text-[10px] font-mono uppercase text-[#788274]">Monthly Spend</div>
          <div className="text-lg font-bold font-mono text-[#F0EFE2]">$482.17</div>
          <div className="text-[10px] text-[#e6b800]">Proj: $731.40 / mo</div>
        </div>

        <div className={cn("p-3.5 border rounded-xs space-y-1", dark ? "border-[#262626] bg-[#141414]" : "border-[#e0e4dc] bg-white")}>
          <div className="text-[10px] font-mono uppercase text-[#788274]">Health Verdict</div>
          <div className="text-lg font-bold font-mono text-[#75bf00]">HEALTHY</div>
          <div className="text-[10px] text-[#C8C7BA]">Capacity: Low Risk</div>
        </div>

        <div className={cn("p-3.5 border rounded-xs space-y-1", dark ? "border-[#262626] bg-[#141414]" : "border-[#e0e4dc] bg-white")}>
          <div className="text-[10px] font-mono uppercase text-[#788274]">Opportunities</div>
          <div className="text-lg font-bold font-mono text-[#e6b800]">3 Detected</div>
          <div className="text-[10px] text-[#e6b800]">Est. saving: 31%</div>
        </div>
      </div>

      {/* Reality Categories Selector Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b pb-2.5 dark:border-[#282828] border-[#e0e4dc]">
        {[
          { id: "all", label: "All Reality Surfaces" },
          { id: "cloud", label: "Cloud Compute" },
          { id: "clusters", label: "Compute Systems & K8s" },
          { id: "registries", label: "Models & Knowledge" },
          { id: "telemetry", label: "Observability Telemetry" },
          { id: "physical", label: "Physical Sensors & Robotics" },
          { id: "energy", label: "Energy & Facility" },
        ].map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedProviderCategory(cat.id as any)}
            className={cn(
              "whitespace-nowrap px-3 py-1 text-xs font-mono transition-colors rounded-xs cursor-pointer",
              selectedProviderCategory === cat.id
                ? "bg-[#75bf00] text-black font-bold"
                : dark
                ? "text-[#889084] hover:text-[#F0EFE2] hover:bg-[#202020]"
                : "text-[#555e50] hover:text-[#111] hover:bg-[#f0f4ee]"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* SECTION 1: CONNECTED REALITY SURFACES (DEEP DISCOVERED CARDS) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#889084]">
            Connected Reality Surfaces & Discovered Capabilities
          </h2>
          <span className="text-xs text-[#788274]">Click surface card to inspect Discovered Reality Graph</span>
        </div>

        {/* 1. RUNPOD DISCOVERED REALITY CARD */}
        <div className={cn(
          "border transition-all rounded-xs overflow-hidden",
          expandedRealityCloud === "runpod"
            ? "border-[#75bf00] bg-[#161616] shadow-[0_4px_24px_rgba(117,191,0,0.08)]"
            : dark
            ? "border-[#262626] bg-[#141414] hover:border-[#383838]"
            : "border-[#d8ddd3] bg-white hover:border-[#b0b8aa]"
        )}>
          {/* Card Header Bar */}
          <div
            onClick={() => setExpandedRealityCloud(expandedRealityCloud === "runpod" ? null : "runpod")}
            className="flex items-center justify-between p-4 cursor-pointer select-none"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-9 w-9 items-center justify-center border border-[#383838] bg-[#1f1f1f] text-[#75bf00] rounded-xs font-bold font-mono">
                RP
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#F0EFE2]">RunPod</span>
                  <span className="border border-[#75bf00]/40 bg-[#162916] text-[#a3e635] text-[10px] font-mono font-bold px-2 py-0.2 rounded-xs">
                    ● CONNECTED
                  </span>
                  <span className="text-[10px] font-mono text-[#C8C7BA]">THIRD-PARTY CLOUD</span>
                </div>
                <p className="text-xs text-[#889084] mt-0.5">
                  Direct GPU control across Pods, Serverless, storage, templates, and hardware registries.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-[#889084]">
                <span>14 GPUs</span>
                <span>·</span>
                <span>7 Workloads</span>
                <span>·</span>
                <span>2 Volumes</span>
              </div>
              <ChevronDown
                size={16}
                className={cn("text-[#889084] transition-transform duration-200", expandedRealityCloud === "runpod" ? "rotate-180 text-[#75bf00]" : "")}
              />
            </div>
          </div>

          {/* Expanded Discovered Reality Details */}
          {expandedRealityCloud === "runpod" && (
            <div className="border-t border-dashed border-[#282828] bg-[#121212] p-5 space-y-6">
              {/* Discovered Hardware & Capacity */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-[#282828] bg-[#181818] p-3.5 rounded-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#F0EFE2] uppercase">Discovered Compute</span>
                    <span className="text-[10px] font-mono text-[#75bf00]">14 GPUs</span>
                  </div>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-[#C8C7BA]">
                      <span>H100 SXM5 (80GB)</span>
                      <span className="text-[#F0EFE2] font-bold">8 units</span>
                    </div>
                    <div className="flex justify-between text-[#C8C7BA]">
                      <span>H200 NVL (141GB)</span>
                      <span className="text-[#F0EFE2] font-bold">4 units</span>
                    </div>
                    <div className="flex justify-between text-[#C8C7BA]">
                      <span>L40S PCIe (48GB)</span>
                      <span className="text-[#F0EFE2] font-bold">2 units</span>
                    </div>
                  </div>
                </div>

                <div className="border border-[#282828] bg-[#181818] p-3.5 rounded-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#F0EFE2] uppercase">Discovered Workloads</span>
                    <span className="text-[10px] font-mono text-[#a3e635]">7 Active</span>
                  </div>
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-[#C8C7BA]">
                      <span>checkout-service</span>
                      <span className="text-[#75bf00]">vLLM / H100</span>
                    </div>
                    <div className="flex justify-between text-[#C8C7BA]">
                      <span>embedding-pipeline</span>
                      <span className="text-[#75bf00]">TEI / L40S</span>
                    </div>
                    <div className="flex justify-between text-[#C8C7BA]">
                      <span>batch-eval-worker</span>
                      <span className="text-[#e6b800]">SGLang / H200</span>
                    </div>
                  </div>
                </div>

                <div className="border border-[#282828] bg-[#181818] p-3.5 rounded-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#F0EFE2] uppercase">Capabilities Discovered</span>
                    <span className="text-[10px] font-mono text-[#75bf00]">6 Validated</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] font-mono text-[#aaa]">
                    <div>✓ GPU Inference</div>
                    <div>✓ Multi-GPU TRT-LLM</div>
                    <div>✓ Batch Serverless</div>
                    <div>✓ Persistent Volumes</div>
                    <div>✓ Container Engine</div>
                    <div>✓ Telemetry Ingestion</div>
                  </div>
                </div>
              </div>

              {/* Live Telemetry & Health Assessment */}
              <div className="border border-[#282828] bg-[#181818] p-4 rounded-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity size={14} className="text-[#75bf00]" />
                    <span className="text-xs font-bold font-mono uppercase text-[#F0EFE2]">Live Reality Telemetry & Risk Assessment</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#C8C7BA]">Last sync: 34s ago</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="border border-[#2a2a2a] bg-[#141414] p-2.5 rounded-xs">
                    <div className="text-[10px] text-[#788274]">GPU UTILIZATION</div>
                    <div className="text-sm font-bold text-[#F0EFE2] mt-0.5">78%</div>
                  </div>
                  <div className="border border-[#2a2a2a] bg-[#141414] p-2.5 rounded-xs">
                    <div className="text-[10px] text-[#788274]">VRAM FOOTPRINT</div>
                    <div className="text-sm font-bold text-[#F0EFE2] mt-0.5">64% (51.2 GB)</div>
                  </div>
                  <div className="border border-[#2a2a2a] bg-[#141414] p-2.5 rounded-xs">
                    <div className="text-[10px] text-[#788274]">TEMPERATURE</div>
                    <div className="text-sm font-bold text-[#75bf00] mt-0.5">67°C</div>
                  </div>
                  <div className="border border-[#2a2a2a] bg-[#141414] p-2.5 rounded-xs">
                    <div className="text-[10px] text-[#788274]">POWER DRAW</div>
                    <div className="text-sm font-bold text-[#F0EFE2] mt-0.5">524 W / card</div>
                  </div>
                </div>

                <div className="border border-dashed border-[#483818] bg-[#1a160d] p-3 rounded-xs text-xs space-y-1">
                  <div className="flex items-center gap-2 font-mono font-bold text-[#e6b800]">
                    <AlertTriangle size={13} />
                    <span>EPOCH REALITY RECOMMENDATION</span>
                  </div>
                  <p className="text-[#c8b898] leading-relaxed">
                    Batch workload <code className="text-[#F0EFE2]">batch-eval-worker</code> is running on H200 capacity ($3.80/hr). Moving to L40S capacity reduces monthly spend by <strong className="text-[#F0EFE2]">23%</strong> ($112/mo) with zero impact on P99 SLA.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222]">
                <button
                  type="button"
                  className="border border-[#383838] bg-[#202020] hover:bg-[#282828] text-[#F0EFE2] text-xs px-3 py-1.5 rounded-xs transition-colors cursor-pointer"
                >
                  Manage API Key & Permissions
                </button>
                <button
                  type="button"
                  className="bg-[#75bf00] text-black font-semibold text-xs px-3.5 py-1.5 rounded-xs hover:bg-[#67a800] transition-colors cursor-pointer"
                >
                  View Discovered Reality Graph →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 2. MODAL DISCOVERED REALITY CARD */}
        <div className={cn(
          "border transition-all rounded-xs overflow-hidden",
          dark ? "border-[#262626] bg-[#141414] hover:border-[#383838]" : "border-[#d8ddd3] bg-white"
        )}>
          <div className="flex items-center justify-between p-4 cursor-pointer select-none">
            <div className="flex items-center gap-3.5">
              <div className="flex h-9 w-9 items-center justify-center border border-[#383838] bg-[#1f1f1f] text-[#a3e635] font-bold font-mono">
                M
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#F0EFE2]">Modal</span>
                  <span className="border border-[#75bf00]/40 bg-[#162916] text-[#a3e635] text-[10px] font-mono font-bold px-2 py-0.2 rounded-xs">
                    ● CONNECTED
                  </span>
                  <span className="text-[10px] font-mono text-[#C8C7BA]">SERVERLESS COMPUTATIONAL GATEWAY</span>
                </div>
                <p className="text-xs text-[#889084] mt-0.5">
                  Serverless GPU execution, instant cold start scaling, and Modal deployments.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-[#889084]">
                <span>4 Endpoints</span>
                <span>·</span>
                <span>2 Deployments</span>
              </div>
              <ChevronRight size={16} className="text-[#889084]" />
            </div>
          </div>
        </div>

        {/* 3. HUGGING FACE MODEL & KNOWLEDGE REGISTRY */}
        <div className={cn(
          "border transition-all rounded-xs overflow-hidden",
          dark ? "border-[#262626] bg-[#141414] hover:border-[#383838]" : "border-[#d8ddd3] bg-white"
        )}>
          <div className="flex items-center justify-between p-4 cursor-pointer select-none">
            <div className="flex items-center gap-3.5">
              <div className="flex h-9 w-9 items-center justify-center border border-[#383838] bg-[#1f1f1f] text-base rounded-xs">
                🤗
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#F0EFE2]">Hugging Face</span>
                  <span className="border border-[#75bf00]/40 bg-[#162916] text-[#a3e635] text-[10px] font-mono font-bold px-2 py-0.2 rounded-xs">
                    TOKEN ACTIVE
                  </span>
                  <span className="text-[10px] font-mono text-[#C8C7BA]">MODEL & KNOWLEDGE REGISTRY</span>
                </div>
                <p className="text-xs text-[#889084] mt-0.5">
                  Gated model access, automated architecture resolution, and weight digest verification.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-[#889084]">
                <span>24 Gated Models Synced</span>
              </div>
              <ChevronRight size={16} className="text-[#889084]" />
            </div>
          </div>
        </div>

        {/* 4. OPENTELEMETRY OBSERVABILITY TELEMETRY */}
        <div className={cn(
          "border transition-all rounded-xs overflow-hidden",
          dark ? "border-[#262626] bg-[#141414] hover:border-[#383838]" : "border-[#d8ddd3] bg-white"
        )}>
          <div className="flex items-center justify-between p-4 cursor-pointer select-none">
            <div className="flex items-center gap-3.5">
              <div className="flex h-9 w-9 items-center justify-center border border-[#383838] bg-[#1f1f1f] text-[#75bf00] font-bold font-mono">
                OT
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#F0EFE2]">OpenTelemetry & Prometheus</span>
                  <span className="border border-[#75bf00]/40 bg-[#162916] text-[#a3e635] text-[10px] font-mono font-bold px-2 py-0.2 rounded-xs">
                    CONNECTED
                  </span>
                  <span className="text-[10px] font-mono text-[#C8C7BA]">OBSERVABILITY TELEMETRY</span>
                </div>
                <p className="text-xs text-[#889084] mt-0.5">
                  Distributed trace ingestion, P99 latency monitoring, queue depth, and metrics correlation.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-[#889084]">
                <span>Live Tracing Active</span>
              </div>
              <ChevronRight size={16} className="text-[#889084]" />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: EXPANDABLE CATALOG OF SUPPORTED REALITY SURFACES */}
      <div className="space-y-4 pt-4 border-t border-dashed dark:border-[#282828] border-[#e0e4dc]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#889084]">
              Available Reality Surfaces & Connectors
            </h2>
            <p className="text-xs text-[#788274] mt-0.5">
              Connect your cloud providers, clusters, model registries, telemetry sinks, and physical hardware.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { name: "AWS (Amazon Web Services)", category: "CLOUD COMPUTE", icon: "☁️", status: "Available", desc: "EC2 UltraClusters, Bedrock, SageMaker, S3" },
            { name: "Google Cloud Platform (GCP)", category: "CLOUD COMPUTE", icon: "🌐", status: "Available", desc: "A3/G2 GPU Instances, Vertex AI, GCS" },
            { name: "Microsoft Azure", category: "CLOUD COMPUTE", icon: "💎", status: "Available", desc: "NDv4/ND H100 VMs, Azure OpenAI, Blob" },
            { name: "CoreWeave", category: "CLOUD COMPUTE", icon: "⚡", status: "Available", desc: "Specialized HGX H100 & H200 compute clusters" },
            { name: "Kubernetes (K8s)", category: "COMPUTE SYSTEMS", icon: "☸️", status: "Available", desc: "On-prem & cloud GPU pod orchestration" },
            { name: "Slurm HPC Cluster", category: "COMPUTE SYSTEMS", icon: "🖥️", status: "Available", desc: "High-performance research GPU cluster scheduler" },
            { name: "Physical Sensors & LiDAR", category: "PHYSICAL REALITY", icon: "📡", status: "Available", desc: "LiDAR, IMU, thermal camera telemetry feeds" },
            { name: "Data Center Power & Thermal", category: "ENERGY SYSTEMS", icon: "🔌", status: "Available", desc: "PDU power meters, chiller cooling loops" },
            { name: "Custom S3 / Blob Storage", category: "MODEL REGISTRY", icon: "📦", status: "Available", desc: "Private model weights and dataset buckets" },
          ].map((item) => (
            <div
              key={item.name}
              className={cn(
                "border p-3.5 rounded-xs space-y-2 flex flex-col justify-between transition-colors",
                dark ? "border-[#262626] bg-[#141414] hover:border-[#383838]" : "border-[#e0e4dc] bg-white hover:border-[#b0b8aa]"
              )}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-base">{item.icon}</span>
                  <span className="text-[9px] font-mono text-[#788274] uppercase border border-[#333] px-1.5 py-0.2 rounded-xs">
                    {item.category}
                  </span>
                </div>
                <div className="font-bold text-xs text-[#F0EFE2]">{item.name}</div>
                <p className="text-[11px] text-[#788274] leading-relaxed">{item.desc}</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedConnectProvider(item.name);
                  setConnectModalOpen(true);
                }}
                className="mt-2 flex w-full items-center justify-center gap-1.5 border border-dashed border-[#383838] bg-[#1e1e1e] hover:bg-[#252525] text-xs font-mono font-semibold text-[#a3e635] py-1.5 rounded-xs transition-colors cursor-pointer"
              >
                <Plus size={12} />
                <span>+ Connect Surface</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: RECENT REALITY CHANGES FEED & CONSEQUESNCES */}
      <div className="border border-[#262626] bg-[#141414] p-5 rounded-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#282828] pb-3">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-[#75bf00]" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#F0EFE2]">
              Recent Discovered Reality Changes & Observed Consequences
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#C8C7BA]">Continuous Synchronization</span>
        </div>

        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dashed border-[#262626] pb-2.5 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-[#788274] text-[10px]">2 MIN AGO</span>
              <span className="text-[#F0EFE2] font-bold">GPU-07 utilization increased 18%</span>
              <span className="text-[#C8C7BA]">(H100 US-East)</span>
            </div>
            <span className="text-[#75bf00]">Observed: Normal load surge</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dashed border-[#262626] pb-2.5 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-[#788274] text-[10px]">14 MIN AGO</span>
              <span className="text-[#F0EFE2] font-bold">workload-42 deployed</span>
              <span className="text-[#e6b800]">batch_size 32 → 64</span>
            </div>
            <span className="text-[#e6b800]">Observed Consequence: P99 +17% (Confidence 93%)</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-[#788274] text-[10px]">31 MIN AGO</span>
              <span className="text-[#F0EFE2] font-bold">network-02 latency increased (+14ms)</span>
              <span className="text-[#C8C7BA]">(Cross-region VPC)</span>
            </div>
            <span className="text-[#e6b800]">Bottleneck Detected</span>
          </div>
        </div>
      </div>

      {/* CONNECT REALITY SURFACE MODAL */}
      {connectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className={cn(
            "w-full max-w-lg border p-5 shadow-2xl space-y-4 text-xs rounded-xs",
            dark ? "border-[#383838] bg-[#181818] text-[#F0EFE2]" : "border-[#a8b0a2] bg-white text-[#171a17]"
          )}>
            <div className="flex items-center justify-between border-b border-[#2a2a2a] pb-3">
              <div>
                <h3 className="text-sm font-bold font-mono text-[#F0EFE2]">Connect Reality Surface: {selectedConnectProvider}</h3>
                <p className="text-[11px] text-[#788274] mt-0.5">
                  Authorize Epoch to discover execution capabilities and observe system state.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConnectModalOpen(false)}
                className="text-[#C8C7BA] hover:text-[#F0EFE2] text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] text-[#C8C7BA] font-mono block">API Key or Access Token</label>
                <div className="relative">
                  <Key size={13} className="absolute left-3 top-2.5 text-[#666]" />
                  <input
                    autoFocus
                    value={runpodApiKey}
                    onChange={(e) => setRunpodApiKey(e.target.value)}
                    placeholder="Enter credential..."
                    className="w-full border border-[#383838] bg-[#121212] pl-8 pr-3 py-2 text-xs font-mono text-[#F0EFE2] outline-none rounded-xs focus:border-[#75bf00]"
                  />
                </div>
              </div>

              {/* Permission Scopes & Security Rationale */}
              <div className="border border-[#2a2a2a] bg-[#121212] p-3 rounded-xs space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase text-[#75bf00] block">
                  Epoch Permission Scope & Security Model
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono text-[#C8C7BA]">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="accent-[#75bf00]" />
                    <span>Compute Discovery</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="accent-[#75bf00]" />
                    <span>Storage Telemetry</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="accent-[#75bf00]" />
                    <span>Mission Deployments</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="accent-[#75bf00]" />
                    <span>Billing Metadata</span>
                  </label>
                </div>
                <p className="text-[10px] text-[#788274] leading-relaxed pt-1 border-t border-[#222]">
                  🔒 Credentials are encrypted with AES-256 and stored in memory-isolated hardware vaults. Epoch requires compute access to discover execution capabilities and deploy authorized mission workloads.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#282828]">
              <button
                type="button"
                onClick={() => setConnectModalOpen(false)}
                className="border border-[#383838] bg-[#222] text-[#C8C7BA] hover:text-[#F0EFE2] text-xs px-3.5 py-1.5 rounded-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRunpodConnected(true);
                  setConnectModalOpen(false);
                }}
                className="bg-[#75bf00] text-black font-semibold text-xs px-4 py-1.5 rounded-xs hover:bg-[#67a800] transition-colors cursor-pointer"
              >
                Connect Surface & Discover Reality
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
