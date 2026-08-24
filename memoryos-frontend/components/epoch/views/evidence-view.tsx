"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Download,
  Copy,
  Check,
  Search,
  Lock,
  X,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface EvidenceClaimItem {
  id: string;
  claimId: string;
  verdict: "VERIFIED" | "PARTIALLY_VERIFIED" | "NOT_PROVEN" | "CONTRADICTED";
  title: string;
  target: string;
  baseline: string;
  measured: string;
  verifier: string;
  window: string;
  sha256: string;
  timestamp: string;
  reason?: string;
  metricsDiff?: Array<{
    name: string;
    baseline: string;
    measured: string;
    delta: string;
    status: "PASS" | "FAIL";
  }>;
}

interface EvidenceViewProps {
  dark?: boolean;
  onNavigateToPipelines?: () => void;
  onNavigateToAnalytics?: () => void;
}

export function EvidenceView({
  dark = true,
  onNavigateToPipelines,
  onNavigateToAnalytics,
}: EvidenceViewProps) {
  const [filterVerdict, setFilterVerdict] = useState<"ALL" | "VERIFIED" | "PARTIALLY_VERIFIED" | "NOT_PROVEN" | "CONTRADICTED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedClaimIds, setExpandedClaimIds] = useState<Set<string>>(new Set(["claim-1"]));
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [copiedShaId, setCopiedShaId] = useState<string | null>(null);

  const claims: EvidenceClaimItem[] = [
    {
      id: "claim-1",
      claimId: "EV-9041",
      verdict: "VERIFIED",
      title: "Reduced inference cost by 34.2% on prod-fast-rag-v2 without quality regression",
      target: "Cost reduction >= 30.0%",
      baseline: "$182,000 / mo",
      measured: "$119,700 / mo (-34.2%)",
      verifier: "OpenTelemetry + Stripe Billing Worker",
      window: "72h observation window",
      sha256: "e3b69035ffd844e2999e2b10492810883f8a920102919aa12903",
      timestamp: "Aug 19, 2026 • 18:42 UTC",
      metricsDiff: [
        { name: "P99 Latency", baseline: "214ms", measured: "198ms", delta: "-16ms", status: "PASS" },
        { name: "Quality Score (Groundedness)", baseline: "98.7%", measured: "98.8%", delta: "+0.1%", status: "PASS" },
        { name: "Cost per 1M Tokens", baseline: "$0.28", measured: "$0.18", delta: "-35.7%", status: "PASS" },
        { name: "Availability SLO", baseline: "99.97%", measured: "99.99%", delta: "+0.02%", status: "PASS" },
      ],
    },
    {
      id: "claim-2",
      claimId: "EV-9038",
      verdict: "NOT_PROVEN",
      title: "FP8 Quantization on Nemotron 3.5 reduced first-token latency by 50%",
      target: "TTFT Latency reduction >= 50.0%",
      baseline: "120ms TTFT",
      measured: "98ms TTFT (-18.3%)",
      verifier: "NVIDIA NIM GPU Telemetry Worker",
      window: "24h benchmark window",
      sha256: "a49f123088192019aa1177bd991048182903120",
      timestamp: "Aug 18, 2026 • 14:15 UTC",
      reason: "Measured TTFT reduction was 18.3%, which did not meet the target 50.0% reduction requirement.",
      metricsDiff: [
        { name: "First-Token Latency (TTFT)", baseline: "120ms", measured: "98ms", delta: "-18.3%", status: "FAIL" },
        { name: "Throughput (tokens/sec)", baseline: "142 t/s", measured: "168 t/s", delta: "+18.3%", status: "PASS" },
        { name: "VRAM Footprint", baseline: "48 GB", measured: "26 GB", delta: "-45.8%", status: "PASS" },
      ],
    },
    {
      id: "claim-3",
      claimId: "EV-9022",
      verdict: "CONTRADICTED",
      title: "Off-Peak Standby Scale-down has 0% impact on production availability",
      target: "Availability SLO >= 99.99%",
      baseline: "99.99% Availability",
      measured: "99.82% Availability",
      verifier: "Kubernetes Event Monitor",
      window: "48h observation window",
      sha256: "88fe2219bc88410091100344551c892010219800",
      timestamp: "Aug 17, 2026 • 03:30 UTC",
      reason: "2x HTTP 503 Gateway Timeouts were detected during the 03:00 UTC standby node scale-down.",
      metricsDiff: [
        { name: "Availability SLO", baseline: "99.99%", measured: "99.82%", delta: "-0.17%", status: "FAIL" },
        { name: "HTTP 503 Error Count", baseline: "0 errors", measured: "2 errors", delta: "+2 errors", status: "FAIL" },
      ],
    },
    {
      id: "claim-4",
      claimId: "EV-9019",
      verdict: "PARTIALLY_VERIFIED",
      title: "Qwen 2.5 32B Code Ensemble increased test pass rate by 15%",
      target: "Unit Test Pass Rate >= +15.0%",
      baseline: "81.2% Test Pass Rate",
      measured: "93.4% Test Pass Rate (+15.02%)",
      verifier: "GitHub Actions CI Worker",
      window: "48h / 72h observation window",
      sha256: "41c09931ad124ef12019aa1177bd8810293",
      timestamp: "Aug 16, 2026 • 21:05 UTC",
      reason: "Primary unit test pass rate verified; 72h continuous regression monitoring window is pending.",
      metricsDiff: [
        { name: "Unit Test Pass Rate", baseline: "81.2%", measured: "93.4%", delta: "+15.02%", status: "PASS" },
        { name: "Security Vulnerabilities", baseline: "0 high", measured: "0 high", delta: "0", status: "PASS" },
      ],
    },
  ];

  const toggleExpand = (id: string) => {
    setExpandedClaimIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedShaId(id);
    setTimeout(() => setCopiedShaId(null), 2000);
  };

  const filteredClaims = claims.filter((c) => {
    const matchesVerdict = filterVerdict === "ALL" || c.verdict === filterVerdict;
    const matchesQuery =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.claimId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.verifier.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesVerdict && matchesQuery;
  });

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-24 font-sans text-xs text-left animate-in fade-in duration-150">
      {/* Noise-Free RunInfra Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#282828] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#75bf00] text-black px-2 py-0.5 rounded-xs font-bold font-sans text-xs uppercase tracking-wider">
              Verification Ledger
            </span>
            <h1 className="text-lg font-bold font-mono tracking-tight text-white">
              Proof & Evidence
            </h1>
          </div>
          <p className="mt-1 text-xs text-[#888]">
            Independent verification of claims, cryptographic evidence bundles, baseline diffs, and verdicts.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <button
            type="button"
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-1.5 border border-dashed border-[#383838] bg-[#181818] hover:border-[#555] hover:bg-[#222] text-white px-3 py-1.5 text-xs rounded-xs transition-colors cursor-pointer"
          >
            <Download size={12} className="text-[#888]" />
            <span>Export Proof Package</span>
          </button>
        </div>
      </div>



      {/* Minimalist Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#666]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search claims by ID, query, or verifier..."
            className="w-full bg-[#141414] border border-dashed border-[#282828] focus:border-[#75bf00] rounded-xs pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#666] outline-none transition-colors"
          />
        </div>

        {/* Verdict Filter Strip & 24 Hours Observation Window (matching user image) */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center border border-dashed border-[#383838] bg-[#141414] p-0.5 font-mono text-xs rounded-sm gap-1">
            {(["ALL", "VERIFIED", "PARTIALLY_VERIFIED", "NOT_PROVEN", "CONTRADICTED"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setFilterVerdict(v)}
                className={cn(
                  "px-2.5 py-0.5 transition-colors text-xs cursor-pointer rounded-sm font-mono",
                  filterVerdict === v
                    ? "bg-[#242424] text-white font-bold"
                    : "text-[#889284] hover:text-white"
                )}
              >
                {v === "ALL" ? "All" : v.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* 24 hours Time Window Badge (1:1 Match with User Image) */}
          <div className="inline-flex items-center border border-dashed border-[#383838] bg-[#141414] p-0.5 font-mono text-xs rounded-sm">
            <span className="bg-[#242424] text-white font-bold px-2 py-0.5 rounded-sm">
              24 hours
            </span>
          </div>
        </div>
      </div>

      {/* Noise-Free Claims List */}
      <div className="space-y-3 font-mono">
        {filteredClaims.map((c) => {
          const isExpanded = expandedClaimIds.has(c.id);

          return (
            <div
              key={c.id}
              className="border border-dashed border-[#262626] bg-[#141414] hover:bg-[#161616] rounded-xs transition-colors overflow-hidden"
            >
              {/* Header Row */}
              <div className="p-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    {/* Minimalist Status Badge */}
                    {c.verdict === "VERIFIED" && (
                      <span className="border border-dashed border-[#75bf00]/40 bg-[#75bf00]/10 text-[#75bf00] px-2 py-0.5 rounded-xs font-bold text-[10px] font-sans">
                        ● VERIFIED
                      </span>
                    )}
                    {c.verdict === "PARTIALLY_VERIFIED" && (
                      <span className="border border-dashed border-[#eab308]/40 bg-[#eab308]/10 text-[#eab308] px-2 py-0.5 rounded-xs font-bold text-[10px] font-sans">
                        ● PARTIALLY VERIFIED
                      </span>
                    )}
                    {c.verdict === "NOT_PROVEN" && (
                      <span className="border border-dashed border-[#f59e0b]/40 bg-[#f59e0b]/10 text-[#f59e0b] px-2 py-0.5 rounded-xs font-bold text-[10px] font-sans">
                        ● NOT PROVEN
                      </span>
                    )}
                    {c.verdict === "CONTRADICTED" && (
                      <span className="border border-dashed border-[#ef4444]/40 bg-[#ef4444]/10 text-[#ef4444] px-2 py-0.5 rounded-xs font-bold text-[10px] font-sans">
                        ● CONTRADICTED
                      </span>
                    )}

                    <span className="text-white font-bold text-xs">#{c.claimId}</span>
                    <span className="text-[#666] text-[10px]">{c.timestamp}</span>
                  </div>

                  <div className="text-[11px] text-[#777]">
                    Verifier: <span className="text-[#ccc]">{c.verifier}</span>
                  </div>
                </div>

                <h3 className="font-sans text-sm font-semibold text-white leading-normal">
                  {c.title}
                </h3>

                <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#777] pt-1">
                  <div className="flex flex-wrap items-center gap-4">
                    <div>Target: <span className="text-white">{c.target}</span></div>
                    <div>
                      Baseline: <span className="text-[#999]">{c.baseline}</span> → Measured:{" "}
                      <span className="text-[#75bf00] font-bold">{c.measured}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleExpand(c.id)}
                    className="flex items-center gap-1 text-[#75bf00] hover:underline cursor-pointer font-mono text-[11px]"
                  >
                    <span>{isExpanded ? "Hide Evidence Bundle" : "Inspect Evidence Bundle"}</span>
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>
              </div>

              {/* SHA-256 Footer Strip */}
              <div className="px-4 py-2 border-t border-dashed border-[#222] bg-[#111111] flex items-center justify-between text-[10px] text-[#666]">
                <div className="flex items-center gap-2">
                  <Lock size={10} className="text-[#75bf00]" />
                  <span>SHA-256:</span>
                  <code className="text-[#888] font-mono text-[10px]">
                    {c.sha256}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(c.sha256, c.id)}
                    className="text-[#666] hover:text-white p-0.5 cursor-pointer transition-colors"
                    title="Copy Checksum"
                  >
                    {copiedShaId === c.id ? <Check size={10} className="text-[#75bf00]" /> : <Copy size={10} />}
                  </button>
                </div>

                <span>Window: {c.window}</span>
              </div>

              {/* Collapsible Evidence Bundle (Noise-Free) */}
              {isExpanded && (
                <div className="p-4 border-t border-dashed border-[#222] bg-[#0d0d0d] space-y-3 animate-in fade-in duration-100">
                  {c.reason && (
                    <div className="p-3 border border-dashed border-[#333] bg-[#161616] text-[#ccc] rounded-xs text-xs font-sans">
                      <strong className="text-white font-mono uppercase text-[10px] tracking-wider block mb-0.5">Audit Finding:</strong>
                      {c.reason}
                    </div>
                  )}

                  {/* Telemetry Diff Table */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] text-[#666] uppercase tracking-wider font-mono">
                      BEFORE VS AFTER TELEMETRY DIFF (SECTION 59)
                    </div>
                    <div className="border border-dashed border-[#222] bg-[#141414] rounded-xs overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-dashed border-[#222] text-[10px] text-[#666] bg-[#181818]">
                            <th className="py-2 px-3">METRIC</th>
                            <th className="py-2 px-3">BASELINE</th>
                            <th className="py-2 px-3">MEASURED</th>
                            <th className="py-2 px-3">DELTA</th>
                            <th className="py-2 px-3 text-right">STATUS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dashed divide-[#222]">
                          {c.metricsDiff?.map((m, idx) => (
                            <tr key={idx} className="hover:bg-[#181818] transition-colors">
                              <td className="py-2 px-3 font-medium text-white">{m.name}</td>
                              <td className="py-2 px-3 text-[#777]">{m.baseline}</td>
                              <td className="py-2 px-3 text-white font-bold">{m.measured}</td>
                              <td className="py-2 px-3 text-[#75bf00] font-mono">{m.delta}</td>
                              <td className="py-2 px-3 text-right font-mono">
                                {m.status === "PASS" ? (
                                  <span className="text-[#75bf00] font-bold">PASS</span>
                                ) : (
                                  <span className="text-[#ef4444] font-bold">FAIL</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Export Proof Package Modal */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-100 backdrop-blur-xs">
          <div className="w-full max-w-xl border border-[#282828] bg-[#141414] rounded-xs p-6 text-xs space-y-4 shadow-2xl text-left font-mono">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h2 className="text-sm font-bold text-white">Export Proof Package</h2>
                <p className="text-[11px] text-[#777]">
                  Machine-verifiable JSON bundle containing all evidence and SHA-256 checksums.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="text-[#777] hover:text-white cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>

            <div className="p-3 bg-[#0d0d0d] border border-dashed border-[#282828] rounded-xs max-h-60 overflow-y-auto">
              <pre className="text-[#75bf00] text-[10px] leading-relaxed select-all">
                {JSON.stringify(claims[0], null, 2)}
              </pre>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setExportModalOpen(false)}
                className="px-4 py-2 border border-dashed border-[#383838] bg-[#181818] hover:bg-[#222] text-white rounded-xs cursor-pointer text-xs transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(claims, null, 2));
                  alert("Proof Package JSON copied to clipboard!");
                }}
                className="flex items-center gap-1.5 bg-[#75bf00] hover:bg-[#86dc00] text-black font-bold px-4 py-2 rounded-xs cursor-pointer text-xs transition-colors"
              >
                <Copy size={12} />
                <span>Copy JSON Bundle</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
