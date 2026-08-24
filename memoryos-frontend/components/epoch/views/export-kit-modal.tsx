"use client";

import React, { useState } from "react";
import {
  X,
  Folder,
  File,
  ChevronRight,
  ChevronDown,
  Download,
  Copy,
  Check,
  Package,
  Terminal,
  Code,
  ShieldCheck,
  FileCode,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ExportKitModalProps {
  open: boolean;
  onClose: () => void;
  missionId?: string;
  dark?: boolean;
}

export function ExportKitModal({
  open,
  onClose,
  missionId = "MIS-8492",
  dark = true,
}: ExportKitModalProps) {
  const [activeTab, setActiveTab] = useState<"export" | "download">("export");
  const [selectedFile, setSelectedFile] = useState<string>("mission.json");
  const [downloadTab, setDownloadTab] = useState<"vllm" | "docker" | "k8s" | "perception">("vllm");
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  // File tree structure matching Blueprint Sec 49
  const fileTree = [
    { name: "mission.json", type: "file", path: "mission.json" },
    { name: "outcome.json", type: "file", path: "outcome.json" },
    {
      name: "model/",
      type: "folder",
      children: [
        { name: "revision.json", type: "file", path: "model/revision.json" },
        { name: "weights_manifest.json", type: "file", path: "model/weights_manifest.json" },
      ],
    },
    {
      name: "runtime/",
      type: "folder",
      children: [
        { name: "vllm_config.py", type: "file", path: "runtime/vllm_config.py" },
        { name: "engine_args.json", type: "file", path: "runtime/engine_args.json" },
      ],
    },
    {
      name: "deployment/",
      type: "folder",
      children: [
        { name: "Dockerfile", type: "file", path: "deployment/Dockerfile" },
        { name: "kubernetes.yaml", type: "file", path: "deployment/kubernetes.yaml" },
      ],
    },
    {
      name: "verifier/",
      type: "folder",
      children: [
        { name: "receipt.sha256", type: "file", path: "verifier/receipt.sha256" },
        { name: "telemetry_proof.json", type: "file", path: "verifier/telemetry_proof.json" },
      ],
    },
    { name: "README.md", type: "file", path: "README.md" },
  ];

  // File contents preview map
  const fileContents: Record<string, string> = {
    "mission.json": `{
  "mission_id": "${missionId}",
  "outcome_type": "VERIFIED_OPTIMIZATION",
  "world_state": "v85",
  "target": "meta-llama/Llama-3.1-8B-Instruct",
  "status": "COMPLETED",
  "provenance_hash": "8f9b2c3a4e7f1d8c9a0b1c2d3e4f5a6b7c8d9e1"
}`,
    "outcome.json": `{
  "objective": "Reduce P99 Latency & GPU Spend on @checkout-service",
  "baseline_p99_ms": 184,
  "observed_p99_ms": 139,
  "cost_delta_pct": -31.0,
  "quality_retention_pct": 98.7
}`,
    "model/revision.json": `{
  "repository_id": "meta-llama/Llama-3.1-8B-Instruct",
  "revision": "main",
  "commit_sha": "d4e5f6a7b8c9d0b1a2c3d4e5f6a7b8c9d0b1a2c3",
  "precision": "FP16"
}`,
    "model/weights_manifest.json": `{
  "tensors_count": 291,
  "shards": 2,
  "checksum": "sha256:7a9c1e4f8d2b7a0e9f8c7b6a5d4c3b2a1f02"
}`,
    "runtime/vllm_config.py": `python -m vllm.entrypoints.openai.api_server \\
  --model meta-llama/Llama-3.1-8B-Instruct \\
  --max-num-seqs 256 \\
  --enable-prefix-caching \\
  --gpu-memory-utilization 0.90 \\
  --port 8000`,
    "runtime/engine_args.json": `{
  "gpu_memory_utilization": 0.90,
  "max_num_seqs": 256,
  "enable_prefix_caching": true,
  "tensor_parallel_size": 1
}`,
    "deployment/Dockerfile": `FROM vllm/vllm-openai:v0.6.2
ENV MODEL_ID="meta-llama/Llama-3.1-8B-Instruct"
ENV MAX_NUM_SEQS=256
ENV ENABLE_PREFIX_CACHING=true
EXPOSE 8000
CMD ["--model", "meta-llama/Llama-3.1-8B-Instruct", "--enable-prefix-caching"]`,
    "deployment/kubernetes.yaml": `apiVersion: apps/v1
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
    "verifier/receipt.sha256": `8f9b2c3a4e7f1d8c9a0b1c2d3e4f5a6b7c8d9e1  mission_receipt.json
3a9c1e4f8d2b7a0e9f8c7b6a5d4c3b2a1f02  telemetry_proof.json`,
    "verifier/telemetry_proof.json": `{
  "verifier": "Independent Billing & Telemetry Verifier",
  "billing_delta_usd": -54.60,
  "opentelemetry_p99_ms": 139.2,
  "verified_at": "2026-08-21T13:42:00Z"
}`,
    "README.md": `# Epoch Mission Deliverable Package
Mission: ${missionId}

## Reproducible Serving Stack
Run \`docker build -t vllm-optimized .\` to build and deploy locally or to your Kubernetes cluster.`,
  };

  const handleCopy = () => {
    const code = fileContents[selectedFile] || "";
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = () => {
    alert(`Downloading complete epoch-mission/ bundle for ${missionId}...`);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono text-xs select-none">
      <div className="w-full max-w-4xl border border-[#282828] bg-[#141414] text-[#f0f3ee] shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-dashed border-[#282828] bg-[#171717]">
          <div className="flex items-center gap-2.5">
            <Package className="text-[#75bf00]" size={18} />
            <h2 className="text-base font-bold text-white tracking-wide">
              Reproducibility Bundle &amp; Download Kit
            </h2>
            <span className="text-[10px] text-[#889284] border border-[#2e2e2e] bg-[#202020] px-2 py-0.5 font-bold">
              {missionId}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-[#889284] hover:text-white transition-colors cursor-pointer p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Sub-Navigation Tabs */}
        <div className="flex items-center justify-between px-4 border-b border-[#282828] bg-[#181818] font-mono text-xs">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setActiveTab("export")}
              className={cn(
                "py-2.5 transition-colors border-b-2 cursor-pointer font-bold",
                activeTab === "export"
                  ? "border-[#75bf00] text-white"
                  : "border-transparent text-[#889284] hover:text-white"
              )}
            >
              Export Stack File Tree (Sec 49)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("download")}
              className={cn(
                "py-2.5 transition-colors border-b-2 cursor-pointer font-bold",
                activeTab === "download"
                  ? "border-[#75bf00] text-white"
                  : "border-transparent text-[#889284] hover:text-white"
              )}
            >
              Download Kit Manifests (Sec 50)
            </button>
          </div>

          <button
            type="button"
            onClick={handleDownloadZip}
            className="flex items-center gap-1.5 border border-[#75bf00] bg-[#75bf00] hover:bg-[#86dc00] text-black font-bold px-3 py-1 my-1 rounded-none transition-colors cursor-pointer"
          >
            <Download size={13} />
            <span>Download .zip</span>
          </button>
        </div>

        {/* TAB 1: EXPORT STACK FILE TREE (Blueprint Sec 49) */}
        {activeTab === "export" && (
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#282828] flex-1 overflow-hidden">
            
            {/* File Tree Column */}
            <div className="p-4 space-y-2 overflow-y-auto bg-[#171717]">
              <div className="text-[10px] text-[#889284] uppercase font-bold tracking-wider mb-2">
                epoch-mission/
              </div>

              <div className="space-y-1 text-xs">
                {fileTree.map((item, idx) => {
                  if (item.type === "file") {
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedFile(item.path!)}
                        className={cn(
                          "flex items-center gap-2 w-full text-left px-2 py-1 transition-colors cursor-pointer",
                          selectedFile === item.path
                            ? "bg-[#252525] text-[#75bf00] font-bold"
                            : "text-[#a0a89d] hover:text-white hover:bg-[#1a1a1a]"
                        )}
                      >
                        <File size={13} />
                        <span>{item.name}</span>
                      </button>
                    );
                  }

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center gap-2 text-white font-bold px-2 py-1">
                        <Folder size={13} className="text-[#eab308]" />
                        <span>{item.name}</span>
                      </div>

                      <div className="pl-4 space-y-1 border-l border-[#282828]">
                        {item.children?.map((child, cIdx) => (
                          <button
                            key={cIdx}
                            type="button"
                            onClick={() => setSelectedFile(child.path)}
                            className={cn(
                              "flex items-center gap-2 w-full text-left px-2 py-1 transition-colors cursor-pointer",
                              selectedFile === child.path
                                ? "bg-[#252525] text-[#75bf00] font-bold"
                                : "text-[#a0a89d] hover:text-white hover:bg-[#1a1a1a]"
                            )}
                          >
                            <File size={13} />
                            <span>{child.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* File Preview Column */}
            <div className="md:col-span-2 p-4 space-y-3 flex flex-col justify-between overflow-hidden bg-[#141414]">
              <div className="space-y-2 flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between border-b border-[#282828] pb-2">
                  <div className="flex items-center gap-2 font-bold text-white text-xs">
                    <FileCode size={14} className="text-[#75bf00]" />
                    <span>{selectedFile}</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[#889284] hover:text-white text-xs transition-colors cursor-pointer"
                  >
                    {copied ? <Check size={13} className="text-[#75bf00]" /> : <Copy size={13} />}
                    <span>{copied ? "Copied!" : "Copy"}</span>
                  </button>
                </div>

                <div className="flex-1 bg-[#050505] p-4 border border-[#222222] text-[#a0a89d] text-xs font-mono overflow-auto">
                  <pre>{fileContents[selectedFile] || "// Empty file"}</pre>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: DOWNLOAD KIT MANIFESTS (Blueprint Sec 50) */}
        {activeTab === "download" && (
          <div className="p-6 space-y-4 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#282828] pb-3">
              <div>
                <h3 className="font-bold text-white text-sm">Runnable Delivery Bundle</h3>
                <p className="text-xs text-[#889284] font-sans">
                  Copy or export reproducible execution manifests for serving, containers, and physical sensor setups.
                </p>
              </div>

              <div className="flex items-center gap-1">
                {(["vllm", "docker", "k8s", "perception"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setDownloadTab(tab)}
                    className={cn(
                      "px-3 py-1 text-xs font-mono transition-colors border cursor-pointer",
                      downloadTab === tab
                        ? "border-[#555555] bg-[#222222] text-white font-bold"
                        : "border-[#282828] bg-[#171717] text-[#889284] hover:text-white"
                    )}
                  >
                    {tab === "vllm" ? "vLLM Config" : tab === "docker" ? "Dockerfile" : tab === "k8s" ? "Kubernetes" : "Perception / Sensor"}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#050505] p-4 border border-[#222222] text-[#a0a89d] text-xs font-mono leading-relaxed overflow-x-auto">
              <pre>
                {downloadTab === "vllm"
                  ? fileContents["runtime/vllm_config.py"]
                  : downloadTab === "docker"
                  ? fileContents["deployment/Dockerfile"]
                  : downloadTab === "k8s"
                  ? fileContents["deployment/kubernetes.yaml"]
                  : `# Edge Perception Sensor Calibration Matrix
epoch-edge-agent run \\
  --vehicle-id Vehicle-07 \\
  --policy-adapter epoch-decoder-v1.4 \\
  --thermal-matrix auto \\
  --fps 60`}
              </pre>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
