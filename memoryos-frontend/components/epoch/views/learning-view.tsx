"use client";

import React, { useState } from "react";
import {
  Brain,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  Search,
  BookOpen,
  Cpu,
  ChevronRight,
  ArrowLeft,
  Copy,
  Check,
  Rocket,
  Play,
  Terminal,
  FileCode,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MetaLogo, NvidiaLogo, VLLMLogo, SGLangLogo, QwenLogo, DeepSeekLogo } from "@/components/epoch/primitives/brand-icons";

interface LearningViewProps {
  dark?: boolean;
  onNavigateToMission?: (missionId: string) => void;
}

export function LearningView({ dark = true, onNavigateToMission }: LearningViewProps) {
  const [activeTab, setActiveTab] = useState<"experiences" | "lessons" | "evolution" | "teaching">("experiences");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomainFilter, setSelectedDomainFilter] = useState("All");
  const [selectedExpId, setSelectedExpId] = useState<string | null>(null);
  const [codeTab, setCodeTab] = useState<"vllm" | "docker" | "k8s" | "curl">("vllm");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  // Mock Verified Experiences (Blueprint Sec 58 & Sec 07 Intent Chips)
  const mockExperiences = [
    {
      id: "EXP-8492",
      title: "vLLM Prefix Caching & Batching Optimization",
      domain: "Computational",
      verdict: "Verified Consequence",
      workload: "meta-llama/Llama-3.1-8B-Instruct · 1x A100-40GB",
      baselineWorldState: "v84",
      observedWorldState: "v85",
      latency: "139ms (-24%)",
      throughput: "518 tok/s (+29%)",
      cost: "-$54.60/mo (-31%)",
      quality: "98.7% Maintained",
      hash: "8f9b2c3a4e7f1d8c9a0b1c2d3e4f5a6b7c8d9e1",
      timestamp: "12m ago",
      icon: <MetaLogo size={22} />,
      intentPrompt: (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#889284] font-mono py-1">
          <span className="text-[#F0EFE2] font-bold">Optimize</span>
          <span className="inline-flex items-center gap-1 bg-[#1a1a1a] text-[#F0EFE2] border border-[#333333] px-1.5 py-0.5 rounded-none text-[11px]">
            <MetaLogo size={12} /> Llama 3.1 8B
          </span>
          <span>on</span>
          <span className="inline-flex items-center gap-1 bg-[#1a1a1a] text-[#F0EFE2] border border-[#333333] px-1.5 py-0.5 rounded-none text-[11px]">
            <VLLMLogo size={12} /> vLLM
          </span>
          <span>for lower cost while preserving quality and P99 latency</span>
        </div>
      ),
      spec: [
        { key: "PROVIDER / ENGINE", val: "vLLM (v0.6.2)", highlight: false },
        { key: "MODEL ID", val: "meta-llama/Llama-3.1-8B-Instruct", highlight: false },
        { key: "HARDWARE TARGET", val: "1x NVIDIA A100-40GB GPU", highlight: false },
        { key: "BASELINE WORLD STATE", val: "WorldState v84", highlight: false },
        { key: "OBSERVED WORLD STATE", val: "WorldState v85", highlight: false },
        { key: "PREFIX CACHING", val: "✓ Verified Active", highlight: true },
        { key: "JSON MODE", val: "✓ Supported", highlight: true },
        { key: "STREAMING", val: "✓ Supported", highlight: true },
        { key: "QUALITY RETENTION", val: "✓ 98.7% (Passed)", highlight: true },
        { key: "INDEPENDENT VERIFIER", val: "✓ 100% Cryptographically Verified (Billing Telemetry)", highlight: true },
        { key: "PROVENANCE RECEIPT", val: "SHA-256: 8f9b2c3a4e7f1d8c9a0b1c2d3e4f5a6b7c8d9e1", highlight: false },
        { key: "REVERSIBILITY", val: "✓ Idempotent Rollback Available", highlight: true },
      ],
      snippets: {
        vllm: `python -m vllm.entrypoints.openai.api_server \\
  --model meta-llama/Llama-3.1-8B-Instruct \\
  --max-num-seqs 256 \\
  --enable-prefix-caching \\
  --gpu-memory-utilization 0.90 \\
  --port 8000`,
        docker: `FROM vllm/vllm-openai:v0.6.2
ENV MODEL_ID="meta-llama/Llama-3.1-8B-Instruct"
ENV MAX_NUM_SEQS=256
ENV ENABLE_PREFIX_CACHING=true
EXPOSE 8000
CMD ["--model", "meta-llama/Llama-3.1-8B-Instruct", "--enable-prefix-caching"]`,
        k8s: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: vllm-llama3-8b-optimized
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: vllm
        image: vllm/vllm-openai:v0.6.2
        args: ["--model", "meta-llama/Llama-3.1-8B-Instruct", "--max-num-seqs", "256", "--enable-prefix-caching"]
        resources:
          limits:
            nvidia.com/gpu: 1`,
        curl: `curl -X POST "http://localhost:8000/v1/chat/completions" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "meta-llama/Llama-3.1-8B-Instruct",
    "messages": [{"role": "user", "content": "Hello Epoch!"}],
    "max_tokens": 512
  }'`,
      },
    },
    {
      id: "EXP-8411",
      title: "Physical Vehicle Edge Sensor Thermal Calibration",
      domain: "Physical Edge",
      verdict: "Verified Consequence",
      workload: "Vehicle-07 LiDAR & Perception Pipeline · NVIDIA Orin AGX",
      baselineWorldState: "v78",
      observedWorldState: "v81",
      latency: "28ms (-33%)",
      throughput: "60 FPS",
      cost: "$0.00 (Edge)",
      quality: "88% (+37.5% Accuracy)",
      hash: "3a9c1e4f8d2b7a0e9f8c7b6a5d4c3b2a1f02",
      timestamp: "2h ago",
      icon: <NvidiaLogo size={22} />,
      intentPrompt: (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#889284] font-mono py-1">
          <span className="text-[#F0EFE2] font-bold">Teach</span>
          <span className="inline-flex items-center gap-1 bg-[#1a1a1a] text-[#F0EFE2] border border-[#333333] px-1.5 py-0.5 rounded-none text-[11px]">
            <NvidiaLogo size={12} /> epoch-decoder-v1.4
          </span>
          <span>to decode physical objects on</span>
          <span className="inline-flex items-center gap-1 bg-[#1a1a1a] text-[#F0EFE2] border border-[#333333] px-1.5 py-0.5 rounded-none text-[11px]">
            Vehicle-07
          </span>
          <span>from @lidar-data and @thermal-imu before driving</span>
        </div>
      ),
      spec: [
        { key: "TARGET VEHICLE", val: "Vehicle-07 (Autonomous Edge Controller)", highlight: false },
        { key: "SENSOR SUITE", val: "Solid-State LiDAR + Thermal IMU (Orin AGX)", highlight: false },
        { key: "PERCEPTION POLICY", val: "epoch-decoder-v1.4 (Rank-16 LoRA)", highlight: true },
        { key: "THERMAL COMPENSATION", val: "✓ Dynamic Offset Matrix Active (>42°C)", highlight: true },
        { key: "OBJECT ACCURACY", val: "64% → 88% (+37.5% Accuracy Gain)", highlight: true },
        { key: "PROVENANCE RECEIPT", val: "SHA-256: 3a9c1e4f8d2b7a0e9f8c7b6a5d4c3b2a1f02", highlight: false },
      ],
      snippets: {
        vllm: `# Perception Policy Execution Script
epoch-edge-agent run \\
  --vehicle-id Vehicle-07 \\
  --policy-adapter epoch-decoder-v1.4 \\
  --thermal-matrix auto \\
  --fps 60`,
        docker: `FROM nvidia/cuda:12.2.0-base-ubuntu22.04
ENV VEHICLE_ID="Vehicle-07"
ENV POLICY="epoch-decoder-v1.4"
CMD ["epoch-edge-agent", "start"]`,
        k8s: `# Edge K3s Manifest
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: vehicle-perception-agent
spec:
  template:
    spec:
      containers:
      - name: edge-agent
        image: epoch/edge-agent:v1.4`,
        curl: `curl -X POST "http://vehicle-07.local:9090/v1/perception/calibrate" \\
  -d '{"thermal_offset": "auto"}'`,
      },
    },
    {
      id: "EXP-8390",
      title: "Data Center Liquid-Cooling Power Policy Tuning",
      domain: "Industrial Data Center",
      verdict: "Verified Consequence",
      workload: "Cluster-US-East (128x A100 Nodes) · Data Center Rack 04-12",
      baselineWorldState: "v72",
      observedWorldState: "v75",
      latency: "PUE 1.18 (-12%)",
      throughput: "-42 kW Power",
      cost: "-$1,240/mo (-18%)",
      quality: "0 Throttling",
      hash: "7d1b4a9e2c8f30a1b2c3d4e5f6a7b8c9d0b891",
      timestamp: "5h ago",
      icon: <SGLangLogo size={22} />,
      intentPrompt: (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#889284] font-mono py-1">
          <span className="text-[#F0EFE2] font-bold">Optimize</span>
          <span className="inline-flex items-center gap-1 bg-[#1a1a1a] text-[#F0EFE2] border border-[#333333] px-1.5 py-0.5 rounded-none text-[11px]">
            <SGLangLogo size={12} /> Cluster-US-East
          </span>
          <span>cooling policy on</span>
          <span className="inline-flex items-center gap-1 bg-[#1a1a1a] text-[#F0EFE2] border border-[#333333] px-1.5 py-0.5 rounded-none text-[11px]">
            Rack 04-12
          </span>
          <span>for lower PUE and zero thermal throttling</span>
        </div>
      ),
      spec: [
        { key: "DATA CENTER RACK", val: "Rack 04-12 (Cluster-US-East)", highlight: false },
        { key: "COOLING SYSTEM", val: "Direct-to-Chip Liquid Cooling (PUE 1.18)", highlight: true },
        { key: "POWER REDUCTION", val: "-42 kW (-18% Energy Savings)", highlight: true },
        { key: "THROTTLING INCIDENTS", val: "0 Thermal Throttling Events", highlight: true },
        { key: "PROVENANCE RECEIPT", val: "SHA-256: 7d1b4a9e2c8f30a1b2c3d4e5f6a7b8c9d0b891", highlight: false },
      ],
      snippets: {
        vllm: `# Industrial Cooling Scheduler Command
epoch-datacenter-cli apply \\
  --rack-id 04-12 \\
  --cooling-policy dynamic-pump-v3 \\
  --target-pue 1.18`,
        docker: `FROM epoch/datacenter-controller:v3.0
ENV RACK_ID="04-12"
ENV COOLING_POLICY="dynamic-pump-v3"
CMD ["datacenter-agent", "start"]`,
        k8s: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: liquid-cooling-controller
spec:
  replicas: 1`,
        curl: `curl -X POST "http://datacenter-control.local/api/v1/power/schedule" \\
  -d '{"rack": "04-12", "target_pue": 1.18}'`,
      },
    },
  ];

  // Mock Organizational Lessons (Blueprint Sec 59)
  const mockLessons = [
    {
      id: "LES-104",
      title: "vLLM Prefix Caching Latency Rule for 8B Models",
      rule: "vLLM prefix caching with max_num_seqs=256 reduces P99 latency by ~24% on 8B workloads when context length > 2048 tokens.",
      domain: "Computational",
      confidence: "96.4%",
      hardwareScope: "A100-40GB / L4 / A10G",
      measuredGain: "P99 Latency -24% · Cost -31%",
      icon: <MetaLogo size={22} />,
    },
    {
      id: "LES-108",
      title: "Single A100 vs Dual-T4 Tensor Parallel Cost Superiority",
      rule: "Single A100-40GB achieves lowest per-request cost ($0.002866) compared to dual-T4 tensor parallel communication overhead ($0.00393).",
      domain: "Computational",
      confidence: "98.9%",
      hardwareScope: "Cloud (Managed) / Bare Metal",
      measuredGain: "Cost -27% vs Dual-T4",
      icon: <VLLMLogo size={22} />,
    },
    {
      id: "LES-112",
      title: "LiDAR Thermal Offset Rule for Rain & Wet Road Perception",
      rule: "Applying a dynamic thermal calibration offset when sensor temperature > 42°C eliminates false-positive object bounding box jitter on wet roads.",
      domain: "Physical Edge",
      confidence: "94.1%",
      hardwareScope: "NVIDIA Orin AGX / Edge Sensor Kit",
      measuredGain: "Accuracy +37.5%",
      icon: <NvidiaLogo size={22} />,
    },
  ];

  // Mock Intelligence Evolution Records (Blueprint Sec 60)
  const mockEvolutions = [
    {
      version: "epoch-decoder-v1.4",
      type: "LoRA Adapted Skill",
      description: "Physical Object Decoding Model for Autonomous Edge",
      delta: "State Understanding: 64% → 88% (+24%) · Anomaly Detection: 51% → 79%",
      status: "Canary (100%)",
      date: "Aug 20, 2026",
      verifiedTrials: 140,
      icon: <NvidiaLogo size={22} />,
    },
    {
      version: "vllm-cost-router-v2",
      type: "Policy Routing Engine",
      description: "Cost-First GPU Sizing & Placement Policy Engine",
      delta: "Average Spend Impact: -$54.60/mo (-31%) · P99 Latency: -24%",
      status: "Production",
      date: "Aug 18, 2026",
      verifiedTrials: 312,
      icon: <VLLMLogo size={22} />,
    },
    {
      version: "vlm-object-detector-v0.9",
      type: "Vision-Language Model",
      description: "Qwen2-VL-7B Fine-Tuned for Driving Perception",
      delta: "Object Precision: 92.4% · Inference Latency: 112ms",
      status: "Shadow Eval",
      date: "Aug 15, 2026",
      verifiedTrials: 84,
      icon: <QwenLogo size={22} />,
    },
  ];

  const selectedExp = mockExperiences.find((e) => e.id === selectedExpId) || mockExperiences[0];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  // IF AN EXPERIENCE RECORD IS SELECTED, SHOW DETAIL VIEW MATCHING IMAGE 4 & 5!
  if (selectedExpId) {
    return (
      <div className={cn("min-h-screen text-xs space-y-6 p-6 select-none font-sans", dark ? "bg-[#141414] text-[#f0f3ee]" : "bg-white text-[#151515]")}>

        {/* Top Action Bar (Matching Image 4 Top Navigation) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-dashed border-[#282828] pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedExpId(null)}
              className="flex items-center gap-1.5 border border-[#383838] bg-[#202020] hover:border-white text-[#F0EFE2] px-3 py-1.5 rounded-none font-mono text-xs transition-colors cursor-pointer"
            >
              <ArrowLeft size={13} />
              <span>All experiences</span>
            </button>

            <div className="h-4 w-px bg-[#333]" />

            <div className="flex items-center gap-3">
              <div className="shrink-0 flex items-center justify-center pt-0.5">
                {selectedExp.icon}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-[#F0EFE2] tracking-wide">{selectedExp.title}</h1>
                  <span className="text-[10px] text-[#75bf00] font-mono font-bold flex items-center gap-1 px-2 py-0.5 border border-[#283818] bg-[#121c0e]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#75bf00]" />
                    {selectedExp.verdict}
                  </span>
                  <span className="text-[10px] text-[#889284] font-mono border border-[#2e2e2e] bg-[#202020] px-2 py-0.5">
                    {selectedExp.id}
                  </span>
                </div>
                {selectedExp.intentPrompt}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              type="button"
              onClick={() => handleCopyCode(selectedExp.snippets[codeTab])}
              className="flex items-center gap-1.5 border border-[#383838] bg-[#202020] hover:border-white text-[#F0EFE2] px-3 py-1.5 rounded-none transition-colors cursor-pointer"
            >
              {copiedCode ? <Check size={13} className="text-[#75bf00]" /> : <Copy size={13} />}
              <span>{copiedCode ? "Copied Config!" : "Copy Config"}</span>
            </button>

            <button
              type="button"
              onClick={() => alert(`Applying verified configuration from ${selectedExp.id} to active mission...`)}
              className="flex items-center gap-1.5 border border-[#75bf00] bg-[#75bf00] hover:bg-[#86dc00] text-black font-bold px-3 py-1.5 rounded-none transition-colors cursor-pointer"
            >
              <Rocket size={13} />
              <span>Apply to Mission</span>
            </button>
          </div>
        </div>

        {/* Top Metric Strip (Exact 1:1 Match to Image 4 Top Row - No Cards!) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 font-mono text-xs py-2 border-b border-dashed border-[#282828]">
          <div className="space-y-0.5">
            <div className="text-[#889284] text-[10px] uppercase tracking-wider">↓ P99 LATENCY</div>
            <div className="text-2xl font-bold text-[#F0EFE2]">{selectedExp.latency}</div>
            <div className="text-[10px] text-[#75bf00]">Verified 24% reduction</div>
          </div>

          <div className="space-y-0.5">
            <div className="text-[#889284] text-[10px] uppercase tracking-wider">↑ THROUGHPUT</div>
            <div className="text-2xl font-bold text-[#F0EFE2]">{selectedExp.throughput}</div>
            <div className="text-[10px] text-[#889284]">Target capacity fit</div>
          </div>

          <div className="space-y-0.5">
            <div className="text-[#889284] text-[10px] uppercase tracking-wider">MONTHLY COST IMPACT</div>
            <div className="text-2xl font-bold text-[#75bf00]">{selectedExp.cost}</div>
            <div className="text-[10px] text-[#75bf00]">Lowest modeled GPU tier</div>
          </div>

          <div className="space-y-0.5">
            <div className="text-[#889284] text-[10px] uppercase tracking-wider">QUALITY RETENTION</div>
            <div className="text-2xl font-bold text-[#F0EFE2]">{selectedExp.quality}</div>
            <div className="text-[10px] text-[#889284]">0 Accuracy Loss</div>
          </div>
        </div>

        {/* Serving Configuration Code Box (Exact 1:1 Match to Image 4 API Request Box) */}
        <div className="p-4 border border-[#282828] bg-[#171717] space-y-3 rounded-none font-mono">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <Terminal size={14} className="text-[#788274]" />
              <span className="font-bold text-[#F0EFE2] text-sm font-mono">&lt;/&gt; Serving configuration</span>
            </div>

            <div className="flex items-center gap-1 text-xs">
              {(["vllm", "docker", "k8s", "curl"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setCodeTab(tab)}
                  className={cn(
                    "px-2.5 py-1 text-xs font-mono transition-colors border cursor-pointer",
                    codeTab === tab
                      ? "border-[#555555] bg-[#2a2a2a] text-[#F0EFE2] font-bold"
                      : "border-transparent text-[#889284] hover:text-[#F0EFE2]"
                  )}
                >
                  {tab === "vllm" ? "vLLM Config" : tab === "docker" ? "Dockerfile" : tab === "k8s" ? "Kubernetes" : "curl"}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-[#889284] font-sans">
            Copy the reproducible configuration below and apply directly to your target serving cluster.
          </p>

          <div className="relative p-4 bg-[#050505] border border-[#222222] text-[#a0a89d] text-xs font-mono leading-relaxed overflow-x-auto">
            <pre>{selectedExp.snippets[codeTab]}</pre>
          </div>
        </div>

        {/* Full Specification Table (Exact 1:1 Match to Image 5 Full Spec Accordion) */}
        <div className="p-4 border border-[#282828] bg-[#171717] space-y-3 rounded-none font-mono">
          <div className="flex items-center justify-between border-b border-dashed border-[#282828] pb-2">
            <span className="font-bold text-[#F0EFE2] text-xs uppercase tracking-wider">FULL SPECIFICATION &amp; PROVENANCE</span>
            <span className="text-xs text-[#788274]">{selectedExp.domain}</span>
          </div>

          <div className="divide-y divide-dashed divide-[#282828] text-xs">
            {selectedExp.spec.map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-4">
                <span className="text-[#889284] uppercase text-[10.5px] shrink-0 font-bold">{item.key}</span>
                <span className={cn("text-right font-mono truncate", item.highlight ? "text-[#75bf00] font-bold" : "text-[#F0EFE2]")}>
                  {item.val}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    );
  }

  // STANDARD LIST VIEW (Matching Image 1 & Neutral Dark Token Chip Prompts)
  return (
    <div className={cn("min-h-screen text-xs space-y-6 p-6 select-none font-sans", dark ? "bg-[#141414] text-[#f0f3ee]" : "bg-white text-[#151515]")}>

      {/* Top Header Matching Image 2 Style */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-[#F0EFE2] tracking-wide">Learning</h1>
            <span className="bg-[#75bf00] text-[#111] font-bold font-mono px-1.5 py-0.5 rounded text-[10px]">
              FLYWHEEL
            </span>
          </div>
          <p className="text-xs text-[#889284]">
            Verified interaction records, generalized organizational lessons, and intelligence evolution.
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert("Re-evaluating shadow models against current world state...")}
          className="flex items-center gap-1.5 border border-[#2e2e2e] bg-[#202020] hover:border-white text-[#F0EFE2] px-3 py-1.5 rounded-none font-mono text-xs transition-colors cursor-pointer self-start md:self-auto"
        >
          <RefreshCw size={12} />
          <span>Re-evaluate Flywheel</span>
        </button>
      </div>

      {/* Subnav Tabs matching User Image 1:1 */}
      <div className="inline-flex items-center border border-dashed border-[#383838] bg-[#141414] p-1 font-mono text-xs rounded-sm gap-1 overflow-x-auto">
        {[
          { id: "experiences", label: "Experience Ledger" },
          { id: "lessons", label: "Organizational Lessons" },
          { id: "evolution", label: "Intelligence Evolution" },
          { id: "teaching", label: "Teaching Fabric" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                "px-3 py-1 text-xs font-mono transition-colors cursor-pointer rounded-sm flex items-center gap-1.5 whitespace-nowrap",
                isActive
                  ? "bg-[#242424] text-[#F0EFE2] font-bold"
                  : "text-[#889284] hover:text-[#F0EFE2]"
              )}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: EXPERIENCE LEDGER (Image 1 List View + Clean Neutral Outlined Token Chips) */}
      {activeTab === "experiences" && (
        <div className="space-y-4">

          {/* Search & Domain Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
            <div className="flex items-center gap-2 flex-1 max-w-md border border-[#282828] bg-[#1a1a1a] px-3 py-1.5">
              <Search size={13} className="text-[#788274]" />
              <input
                type="text"
                placeholder="Find experience records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-[#F0EFE2] placeholder-[#666666] outline-none text-xs w-full font-mono"
              />
            </div>

            {/* Domain Filter Strip matching Image 2 (Single Outer Dashed Container) */}
            <div className="inline-flex items-center border border-dashed border-[#383838] bg-[#141414] p-1 font-mono text-xs rounded-sm gap-1">
              <span className="text-[#788274] px-1.5 font-bold">Domain:</span>
              {["All", "Computational", "Physical Edge", "Industrial Data Center"].map((dom) => (
                <button
                  key={dom}
                  type="button"
                  onClick={() => setSelectedDomainFilter(dom)}
                  className={cn(
                    "px-2 py-0.5 text-xs font-mono transition-colors cursor-pointer rounded-sm",
                    selectedDomainFilter === dom
                      ? "bg-[#242424] text-[#F0EFE2] font-bold"
                      : "text-[#a0a89d] hover:text-[#F0EFE2]"
                  )}
                >
                  {dom}
                </button>
              ))}
            </div>
          </div>

          {/* List Layout (Clean Floating Logos + Neutral Outlined Token Chips) */}
          <div className="space-y-0 divide-y divide-dashed divide-[#282828] border-t border-b border-dashed border-[#282828] font-mono">
            {mockExperiences.map((exp) => (
              <div
                key={exp.id}
                onClick={() => setSelectedExpId(exp.id)}
                className="py-4 px-3 cursor-pointer group flex items-start justify-between gap-4 hover:bg-[#1a1a1a] transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  {/* CLEAN FLOATING BRAND LOGO */}
                  <div className="shrink-0 flex items-center justify-center pt-0.5">
                    {exp.icon}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-[#F0EFE2] group-hover:text-[#75bf00] transition-colors truncate">
                        {exp.title}
                      </h3>
                      <span className="text-[10px] text-[#788274] shrink-0 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#75bf00]" />
                        {exp.verdict}
                      </span>
                    </div>

                    {/* USER REQUEST PROMPT WITH NEUTRAL OUTLINED TOKEN CHIPS */}
                    {exp.intentPrompt}

                    <div className="text-[11px] text-[#889284] truncate">
                      {exp.id} · {exp.workload}
                    </div>

                    {/* Inline Key Metrics Matching Image 1 */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-[#a0a89d] pt-1">
                      <span>↓ P99: <span className="text-[#F0EFE2] font-bold">{exp.latency}</span></span>
                      <span>↑ Throughput: <span className="text-[#F0EFE2] font-bold">{exp.throughput}</span></span>
                      <span>Cost: <span className="text-[#F0EFE2] font-bold">{exp.cost}</span></span>
                      <span>Quality: <span className="text-[#F0EFE2] font-bold">{exp.quality}</span></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 pt-1">
                  <span className="text-[11px] text-[#788274]">{exp.timestamp}</span>
                  <ChevronRight size={15} className="text-[#788274] group-hover:text-[#F0EFE2] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ORGANIZATIONAL LESSONS */}
      {activeTab === "lessons" && (
        <div className="space-y-0 divide-y divide-dashed divide-[#282828] border-t border-b border-dashed border-[#282828] font-mono text-xs">
          {mockLessons.map((les) => (
            <div key={les.id} className="py-4 px-3 flex items-start justify-between gap-4 hover:bg-[#1a1a1a] transition-colors">
              <div className="flex items-start gap-3 min-w-0">
                <div className="shrink-0 flex items-center justify-center pt-0.5">
                  {les.icon}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#F0EFE2] text-sm">{les.title}</span>
                    <span className="text-[10px] text-[#788274] font-bold">● Confidence: {les.confidence}</span>
                  </div>
                  <p className="text-xs text-[#a0a89d] font-sans leading-relaxed">
                    &quot;{les.rule}&quot;
                  </p>
                  <div className="flex items-center gap-4 text-[11px] text-[#788274] pt-1">
                    <span>Scope: <span className="text-[#F0EFE2]">{les.hardwareScope}</span></span>
                    <span>Gain: <span className="text-[#F0EFE2] font-bold">{les.measuredGain}</span></span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => alert(`Applied lesson ${les.id} to active mission!`)}
                className="border border-[#383838] bg-[#202020] hover:border-white text-[#F0EFE2] font-mono text-xs px-3 py-1.5 shrink-0 cursor-pointer"
              >
                Apply Lesson
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: INTELLIGENCE EVOLUTION */}
      {activeTab === "evolution" && (
        <div className="space-y-0 divide-y divide-dashed divide-[#282828] border-t border-b border-dashed border-[#282828] font-mono text-xs">
          {mockEvolutions.map((evo, idx) => (
            <div key={idx} className="py-4 px-3 flex items-start justify-between gap-4 hover:bg-[#1a1a1a] transition-colors">
              <div className="flex items-start gap-3 min-w-0">
                <div className="shrink-0 flex items-center justify-center pt-0.5">
                  {evo.icon}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#F0EFE2] text-sm">{evo.version}</span>
                    <span className="text-[10px] text-[#889284]">{evo.type}</span>
                    <span className="text-[10px] text-[#788274] font-bold">● {evo.status}</span>
                  </div>
                  <p className="text-xs text-[#a0a89d] font-sans">
                    {evo.description}
                  </p>
                  <div className="text-xs text-[#F0EFE2] font-bold pt-0.5">
                    ★ Measured Evolution Delta: {evo.delta}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => alert(`Promoting ${evo.version} to 100% production...`)}
                className="border border-[#383838] bg-[#202020] hover:border-white text-[#F0EFE2] font-mono text-xs px-3 py-1.5 shrink-0 cursor-pointer"
              >
                Promote Version
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: TEACHING FABRIC */}
      {activeTab === "teaching" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs py-2">
          <div className="space-y-1">
            <div className="text-[#889284] text-[10px] uppercase">TEACHING DATA INDEX</div>
            <div className="text-xl font-bold text-[#F0EFE2]">dataset-v8.2</div>
            <p className="text-[11px] text-[#a0a89d] font-sans">
              1,482 verified experience pairs distilled into preference fine-tuning triplets.
            </p>
          </div>

          <div className="space-y-1">
            <div className="text-[#889284] text-[10px] uppercase">LORA ADAPTATIONS</div>
            <div className="text-xl font-bold text-[#F0EFE2]">18 Skill Adapters</div>
            <p className="text-[11px] text-[#a0a89d] font-sans">
              Active rank-16 LoRA adapters trained on physical perception & cost routing.
            </p>
          </div>

          <div className="space-y-1">
            <div className="text-[#889284] text-[10px] uppercase">SHADOW SAFETY</div>
            <div className="text-xl font-bold text-[#F0EFE2]">100% Passed</div>
            <p className="text-[11px] text-[#a0a89d] font-sans">
              0 quality regressions detected during shadow evaluation window.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
