"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Check,
  X,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Sliders,
  DollarSign,
  Cpu,
  Layers,
  FileCode,
  ArrowRight,
  Shield,
  Activity,
  Zap,
  Info,
  Lock,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MetaLogo, NvidiaLogo, SGLangLogo, QwenLogo } from "@/components/epoch/primitives/brand-icons";

interface ApprovalsViewProps {
  dark?: boolean;
  onNavigateToMission?: (missionId: string) => void;
}

export function ApprovalsView({ dark = true, onNavigateToMission }: ApprovalsViewProps) {
  const [selectedGateFilter, setSelectedGateFilter] = useState<string>("All");

  // Action-level permissions matrix (Blueprint Sec 67 & Automated Policy Control)
  const actionPermissions = [
    { action: "Read reality", mode: "AUTO", modeColor: "text-[#75bf00] border-[#283818] bg-[#121c0e]", desc: "Continuous state decoding & graph inspection" },
    { action: "Diagnose root cause", mode: "AUTO", modeColor: "text-[#75bf00] border-[#283818] bg-[#121c0e]", desc: "Hypothesis generation & trace analysis" },
    { action: "Run sandbox experiment", mode: "AUTO", modeColor: "text-[#75bf00] border-[#283818] bg-[#121c0e]", desc: "Bounded isolated evaluation & benchmarking" },
    { action: "Deploy to production", mode: "AUTO VERIFIED", modeColor: "text-[#75bf00] border-[#283818] bg-[#121c0e]", desc: "Automated canary verification & model rollout" },
    { action: "Spend > $500 budget", mode: "AUTO BOUNDED", modeColor: "text-[#eab308] border-[#422006] bg-[#1c1917]", desc: "Automated FinOps spend cap re-allocation" },
    { action: "Physical actuation", mode: "AUTO BOUNDED", modeColor: "text-[#eab308] border-[#422006] bg-[#1c1917]", desc: "Autonomous vehicle / robot control under safety policy" },
    { action: "Destructive action", mode: "BLOCKED", modeColor: "text-[#ef4444] border-[#450a0a] bg-[#1a0505]", desc: "Database teardown or permanent resource deletion" },
  ];

  // Autonomous Policy & Safety Gate Evaluations (Zero Human-in-the-Loop)
  const autonomousGates = [
    {
      id: "GATE-402",
      gateType: "Gate C",
      gateTitle: "Automated Production Safety Evaluation",
      gateBadge: "GATE C · CANARY VERIFIED",
      icon: <MetaLogo size={20} />,
      missionId: "MIS-8492",
      objective: "Reduce P99 Latency & GPU Spend on @checkout-service",
      worldStateRef: "v85 (SHA-256: 8f9b2c3a...)",
      evidence: "4,821 observations · 12 experiments · 2 canaries · 3 verification records",
      consequence: {
        expected: "P99 184ms → 139ms (-24%) · Cost -$54.60/mo (-31%)",
        baseline: "P99 184ms · Cost $182.40/mo",
        risk: "Low (Idempotent Rollback Verified)",
        rollback: "vLLM rollback recipe active & verified",
      },
      authority: {
        required: "Production Operator Policy",
        current: "Epoch Runtime Authority",
        statusText: "✓ Automated Policy Clearance Granted",
      },
      policy: {
        name: "production-deployment",
        requirement: "Automated Canary Pass",
        reason: "Canary traffic verification 100% successful on @checkout-service",
      },
      autoStatus: "PASSED",
      autoBadge: "✓ AUTOMATED CANARY VERIFICATION PASSED",
      conflict: null,
    },
    {
      id: "GATE-405",
      gateType: "Gate D",
      gateTitle: "Automated FinOps Budget Evaluation",
      gateBadge: "GATE D · BUDGET AUTO-ALLOCATED",
      icon: <NvidiaLogo size={20} />,
      missionId: "MIS-8411",
      objective: "Vehicle-07 LiDAR & Perception Calibration On Edge",
      worldStateRef: "v81 (SHA-256: 3a9c1e4f...)",
      evidence: "140 verified trials · 88% accuracy (+37.5%) · 0 throttling events",
      consequence: {
        expected: "Accuracy 64% → 88% (+37.5%) on wet road conditions",
        baseline: "Accuracy 64% (Bounding box jitter detected)",
        risk: "Financial Spend Threshold ($740.00 auto-cleared against Q3 savings)",
        rollback: "Edge daemon fallback to v1.3 policy",
      },
      authority: {
        required: "FinOps Policy Engine",
        current: "Epoch Runtime Authority",
        statusText: "✓ Auto-Allocated against Compute Savings",
      },
      policy: {
        name: "spend-governance",
        requirement: "Automated Trade-off Authorization",
        reason: "Requested spend ($740.00) offset by $1,240.00 monthly cooling savings",
      },
      autoStatus: "PASSED",
      autoBadge: "✓ SPEND THRESHOLD AUTO-AUTHORIZED",
      conflict: null,
    },
    {
      id: "GATE-409",
      gateType: "Gate F",
      gateTitle: "Automated Reality Conflict Resolution",
      gateBadge: "GATE F · CONFLICT RESOLVED",
      icon: <SGLangLogo size={20} />,
      missionId: "MIS-8390",
      objective: "Data Center Liquid-Cooling Power Policy Tuning",
      worldStateRef: "v75 (SHA-256: 7d1b4a9e...)",
      evidence: "Automated cross-validation re-check completed across 3 telemetry nodes",
      consequence: {
        expected: "PUE 1.18 (-12%) · Power -42 kW · Savings -$1,240/mo",
        baseline: "PUE 1.34 · Power 234 kW",
        risk: "State Sync (Telemetry heartbeat restored)",
        rollback: "N/A (Action executed post-resolution)",
      },
      authority: {
        required: "Infrastructure Integrity Policy",
        current: "Epoch Runtime Authority",
        statusText: "✓ Auto-Re-observation Complete",
      },
      policy: {
        name: "reality-integrity",
        requirement: "Automated Telemetry Cross-Validation",
        reason: "Telemetry heartbeat re-established via secondary node probe",
      },
      autoStatus: "RESOLVED",
      autoBadge: "✓ AUTOMATED CONFLICT RESOLUTION PASSED",
      conflict: {
        sources: [
          { name: "Cloud API", status: "RUNNING", statusColor: "text-[#75bf00]" },
          { name: "Kubernetes", status: "RUNNING (HEALED)", statusColor: "text-[#75bf00]" },
          { name: "Telemetry", status: "HEARTBEAT OK", statusColor: "text-[#75bf00]" },
        ],
        verdict: "WORLD STATE SYNCHRONIZED",
      },
    },
  ];

  const filteredGates = autonomousGates.filter((g) => {
    if (selectedGateFilter === "All") return true;
    return g.gateType === selectedGateFilter;
  });

  return (
    <div className={cn("min-h-screen text-xs space-y-6 p-6 select-none font-sans", dark ? "bg-[#141414] text-[#f0f3ee]" : "bg-white text-[#151515]")}>
      
      {/* Top Header Matching Model APIs Style */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-[#F0EFE2] tracking-wide">Autonomy &amp; Policy Verification Engine</h1>
            <span className="bg-[#75bf00] text-[#111] font-bold font-mono px-1.5 py-0.5 rounded text-[10px]">
              100% AUTONOMOUS EXECUTION
            </span>
          </div>
          <p className="text-xs text-[#889284]">
            Zero human-in-the-loop operational overhead. Autonomous Gate A–F policy verification, risk verification, and reality conflict resolution.
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert("Re-evaluating active policy gates against live WorldState...")}
          className="flex items-center gap-1.5 border border-[#2e2e2e] bg-[#202020] hover:border-white text-[#F0EFE2] px-3 py-1.5 rounded-none font-mono text-xs transition-colors cursor-pointer self-start md:self-auto"
        >
          <RefreshCw size={12} />
          <span>Re-verify Policies</span>
        </button>
      </div>

      {/* Top Border-Free Metric Strip (Matching Image 3 & 4 Metric Header) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 font-mono text-xs py-2 border-t border-b border-dashed border-[#282828]">
        <div className="space-y-0.5">
          <div className="text-[#889284] text-[10px] uppercase tracking-wider">HUMAN OVERHEAD</div>
          <div className="text-2xl font-bold text-[#75bf00]">0 Manual Clicks</div>
          <div className="text-[10px] text-[#75bf00]">Fully autonomous loop</div>
        </div>

        <div className="space-y-0.5">
          <div className="text-[#889284] text-[10px] uppercase tracking-wider">ORGANIZATIONAL AUTONOMY</div>
          <div className="text-2xl font-bold text-[#75bf00]">L5 · Autonomous</div>
          <div className="text-[10px] text-[#889284]">Bounded by policy &amp; risk</div>
        </div>

        <div className="space-y-0.5">
          <div className="text-[#889284] text-[10px] uppercase tracking-wider">SPEND GOVERNANCE</div>
          <div className="text-2xl font-bold text-[#F0EFE2]">$500.00 Cap</div>
          <div className="text-[10px] text-[#75bf00]">Auto-offset by cooling savings</div>
        </div>

        <div className="space-y-0.5">
          <div className="text-[#889284] text-[10px] uppercase tracking-wider">ACTIVE POLICY RULES</div>
          <div className="text-2xl font-bold text-[#F0EFE2]">14 Policies</div>
          <div className="text-[10px] text-[#75bf00]">100% Policy Compliant</div>
        </div>
      </div>

      {/* SECTION 1: AUTONOMY MATRIX & ACTION PERMISSIONS (INSPECTABLE POLICY BOUNDARIES) */}
      <div className="p-4 border border-[#282828] bg-[#171717] space-y-4 rounded-none font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dashed border-[#282828] pb-3">
          <div className="flex items-center gap-2">
            <Shield className="text-[#75bf00]" size={16} />
            <span className="font-bold text-[#F0EFE2] text-sm">Autonomous Policy Boundaries &amp; Action Matrix</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#889284]">Runtime Autonomy:</span>
            <span className="px-2 py-0.5 bg-[#121c0e] border border-[#283818] text-[#75bf00] font-bold">
              L5 · ORGANIZATIONAL AUTONOMY
            </span>
          </div>
        </div>

        <p className="text-xs text-[#a0a89d] font-sans">
          Epoch executes actions autonomously within predefined policy rules, cryptographic verifiers, and risk boundaries without manual human intervention.
        </p>

        {/* Action Permissions Table */}
        <div className="overflow-x-auto border border-[#222222] bg-[#050505]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#222222] text-[#889284] text-[10px] uppercase font-mono">
                <th className="py-2.5 px-3 font-bold">ACTION TYPE</th>
                <th className="py-2.5 px-3 font-bold">EXECUTION MODE</th>
                <th className="py-2.5 px-3 font-bold">AUTOMATED POLICY SAFEGUARDS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c1c1c] text-xs font-mono">
              {actionPermissions.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#111111] transition-colors">
                  <td className="py-2.5 px-3 font-bold text-[#F0EFE2]">{row.action}</td>
                  <td className="py-2.5 px-3">
                    <span className={cn("px-2 py-0.5 text-[10px] font-bold border", row.modeColor)}>
                      {row.mode}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[#889284] font-sans text-xs">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: AUTONOMOUS POLICY EVALUATIONS (REMOVED MANUAL HUMAN CLICK BUTTONS) */}
      <div className="space-y-4">
        
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-[#75bf00]" />
            <span className="font-bold text-[#F0EFE2] uppercase tracking-wider text-xs">AUTONOMOUS POLICY EVALUATIONS</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[#889284] text-[11px]">Filter Gate:</span>
            {["All", "Gate C", "Gate D", "Gate F"].map((gate) => (
              <button
                key={gate}
                type="button"
                onClick={() => setSelectedGateFilter(gate)}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-mono transition-colors rounded-none cursor-pointer border",
                  selectedGateFilter === gate
                    ? "border-[#555555] bg-[#222222] text-[#F0EFE2] font-bold"
                    : "border-[#282828] bg-[#1a1a1a] text-[#889284] hover:text-[#F0EFE2]"
                )}
              >
                {gate}
              </button>
            ))}
          </div>
        </div>

        {/* Gate Evaluations Cards List (No Manual Human Clicks) */}
        <div className="space-y-4 font-mono">
          {filteredGates.map((gate) => (
            <div
              key={gate.id}
              className="p-5 border border-[#282828] bg-[#171717] space-y-4 rounded-none transition-colors"
            >
              
              {/* Gate Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-dashed border-[#282828] pb-3">
                <div className="flex items-center gap-3">
                  <div className="shrink-0 flex items-center justify-center pt-0.5">
                    {gate.icon}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-[#F0EFE2] tracking-wide">{gate.gateTitle}</h2>
                      <span className="text-[10px] text-[#75bf00] font-mono font-bold flex items-center gap-1 px-2 py-0.5 border border-[#283818] bg-[#121c0e]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#75bf00]" />
                        {gate.gateBadge}
                      </span>
                      <span className="text-[10px] text-[#889284] border border-[#2e2e2e] bg-[#202020] px-2 py-0.5">
                        {gate.id}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#889284] pt-1">
                      <span>Mission: <span className="text-[#F0EFE2] font-bold">{gate.missionId}</span></span>
                      <span>·</span>
                      <span>WorldState: <span className="text-[#F0EFE2]">{gate.worldStateRef}</span></span>
                    </div>
                  </div>
                </div>

                {/* Automated Status Badge (NO MANUAL CLICK BUTTONS) */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#121c0e] border border-[#283818] text-[#75bf00] font-bold text-xs">
                    <Check size={13} /> {gate.autoBadge}
                  </span>
                </div>
              </div>

              {/* Objective & Mission Context */}
              <div className="space-y-1 bg-[#0f0f0f] p-3 border border-[#222222]">
                <span className="text-[10px] text-[#889284] uppercase font-bold">TARGET OUTCOME</span>
                <p className="text-xs text-[#F0EFE2] font-bold">{gate.objective}</p>
              </div>

              {/* Conflict Auto-Resolution Details if present */}
              {gate.conflict && (
                <div className="p-3 bg-[#0c1809] border border-[#283818] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#75bf00]">
                      <Check size={14} />
                      <span>AUTOMATED WORLD STATE SYNCHRONIZATION (GATE F RESOLVED)</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#75bf00] bg-[#121c0e] px-2 py-0.5 border border-[#283818]">
                      {gate.conflict.verdict}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs pt-1">
                    {gate.conflict.sources.map((src, idx) => (
                      <div key={idx} className="p-2 bg-[#050505] border border-[#1c2c16] space-y-0.5">
                        <div className="text-[10px] text-[#889284]">{src.name} Source</div>
                        <div className={cn("font-bold", src.statusColor)}>{src.status}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4-Grid Specification Detail */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                
                {/* Grid 1: Supporting Evidence */}
                <div className="p-3 bg-[#0f0f0f] border border-[#222222] space-y-1">
                  <span className="text-[10px] text-[#889284] uppercase font-bold">SUPPORTING EVIDENCE</span>
                  <p className="text-xs text-[#a0a89d] font-sans">{gate.evidence}</p>
                </div>

                {/* Grid 2: Consequence Preview */}
                <div className="p-3 bg-[#0f0f0f] border border-[#222222] space-y-1">
                  <span className="text-[10px] text-[#889284] uppercase font-bold">OBSERVED CONSEQUENCE</span>
                  <p className="text-xs text-[#75bf00] font-bold">{gate.consequence.expected}</p>
                  <div className="text-[10.5px] text-[#889284] pt-0.5">
                    Risk: <span className="text-[#F0EFE2]">{gate.consequence.risk}</span>
                  </div>
                </div>

                {/* Grid 3: Authority Context */}
                <div className="p-3 bg-[#0f0f0f] border border-[#222222] space-y-1">
                  <span className="text-[10px] text-[#889284] uppercase font-bold">AUTHORITY STATUS</span>
                  <div className="text-xs text-[#75bf00] font-bold">{gate.authority.statusText}</div>
                </div>

                {/* Grid 4: Policy Evaluated */}
                <div className="p-3 bg-[#0f0f0f] border border-[#222222] space-y-1">
                  <span className="text-[10px] text-[#889284] uppercase font-bold">POLICY EVALUATION</span>
                  <div className="text-xs text-[#F0EFE2] font-bold">Policy: {gate.policy.name}</div>
                  <p className="text-[10.5px] text-[#889284] font-sans">{gate.policy.reason}</p>
                </div>

              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
