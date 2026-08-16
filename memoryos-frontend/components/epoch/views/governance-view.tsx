"use client";

import React, { useState } from "react";
import {
  Shield,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  RotateCcw,
  Clock,
  ExternalLink,
  History,
  FileCheck,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PolicyRule, HumanGate, AutonomyLevel, LearningRecord } from "@/lib/epoch-types";

interface GovernanceViewProps {
  dark?: boolean;
  onApproveGate?: (gateId: string) => void;
  onRejectGate?: (gateId: string) => void;
}

const SAMPLE_POLICIES: PolicyRule[] = [
  {
    id: "pol-1",
    name: "Maximum Experiment Spend Cap",
    category: "spend",
    threshold: "$500.00 / mission",
    actionOnBreach: "REQUIRES_APPROVAL",
    isActive: true,
  },
  {
    id: "pol-2",
    name: "Production Blast Radius / Allowed Regions",
    category: "regions",
    threshold: "US-East-1, EU-Central-1 only",
    actionOnBreach: "DENY",
    isActive: true,
  },
  {
    id: "pol-3",
    name: "Open Source Model License Whitelist",
    category: "licenses",
    threshold: "Apache-2.0, MIT, Llama-3.1 Community",
    actionOnBreach: "DENY",
    isActive: true,
  },
  {
    id: "pol-4",
    name: "Zero Production Downtime SLA",
    category: "downtime",
    threshold: "0 seconds (Shadow -> Canary required)",
    actionOnBreach: "REQUIRES_APPROVAL",
    isActive: true,
  },
];

const SAMPLE_HUMAN_GATES: HumanGate[] = [
  {
    id: "gate-prod-canary-01",
    missionId: "mission-llama3-opt",
    missionName: "Reduce Llama-3.1-8B Inference Cost by 30%",
    gateType: "C_HIGH_RISK_ACTION",
    reason: "Production canary rollout requires organizational authority before shifting 100% live traffic to candidate vLLM AWQ-FP8 cluster.",
    epochRecommendation: "Promote Candidate #4 to 100% traffic. Observed p95 latency is 38.2ms (-34%), with 0.00 quality degradation across 1,000 synthetic test benchmarks.",
    expectedImpact: "Monthly cost reduction: -$42,600 / month. Latency delta: -14ms p95.",
    rollbackPlan: "Automated instant traffic divert to baseline cluster in <150ms upon any p99 latency >45ms or error rate >0.01%.",
    requiredAuthorityLevel: "L4_BOUNDED_PROD",
    createdAt: "8 mins ago",
    status: "PENDING",
  },
  {
    id: "gate-spend-auth-02",
    missionId: "mission-qwen-eval",
    missionName: "Qwen 2.5 72B Synthetic Reasoning Benchmark",
    gateType: "D_SPEND_AUTHORITY",
    reason: "Benchmark sweep requires $850 in GPU compute. Configured mission limit is $500.",
    epochRecommendation: "Approve budget expansion or execute condensed benchmark profile with 500 samples instead of 2,500.",
    expectedImpact: "Confidence score improvement from 92% to 99.8%.",
    rollbackPlan: "N/A (Ephemeral compute stopped immediately after test).",
    requiredAuthorityLevel: "L2_AUTO_EXPERIMENT",
    createdAt: "22 mins ago",
    status: "PENDING",
  },
];

const SAMPLE_LEARNING_RECORDS: LearningRecord[] = [
  {
    id: "learn-091",
    initialState: "FP16 Baseline on 2x A100 (batch=8)",
    intervention: "Upgraded to AWQ-FP8 + FlashInfer kernel (batch=16)",
    resultingState: "1x A100 (batch=16) with P95 38.2ms",
    metricsDelta: { latencyDeltaPct: -34.2, costDeltaPct: -48.0, qualityDeltaPct: 0.0 },
    verifiedAt: "2 hours ago",
    reproducibilityScorePct: 100.0,
  },
];

export function GovernanceView({
  dark = false,
  onApproveGate,
  onRejectGate,
}: GovernanceViewProps) {
  const [activeTab, setActiveTab] = useState<"gates" | "policies" | "autonomy" | "learning">("gates");
  const [selectedAutonomy, setSelectedAutonomy] = useState<AutonomyLevel>("L4_BOUNDED_PROD");
  const [gatesList, setGatesList] = useState<HumanGate[]>(SAMPLE_HUMAN_GATES);

  const handleApprove = (gateId: string) => {
    setGatesList((prev) =>
      prev.map((g) => (g.id === gateId ? { ...g, status: "APPROVED" as const } : g))
    );
    onApproveGate?.(gateId);
  };

  const handleReject = (gateId: string) => {
    setGatesList((prev) =>
      prev.map((g) => (g.id === gateId ? { ...g, status: "REJECTED" as const } : g))
    );
    onRejectGate?.(gateId);
  };

  return (
    <div className="space-y-6 max-w-[1280px] mx-auto">
      {/* Top Header Matching Image 1 */}
      <div className={cn(
        "flex flex-wrap items-end justify-between gap-4 border-b pb-5",
        dark ? "border-[#2e2e2e]" : "border-[#d8ddd3]"
      )}>
        <div>
          <h1 className={cn("text-2xl md:text-3xl font-medium tracking-tight", dark ? "text-white" : "text-[#151515]")}>
            Authority{" "}
            <span className="bg-[#75bf00] text-black px-2 py-0.5 font-bold inline-block rounded-xs">
              governance
            </span>
          </h1>
          <p className={cn("mt-1 text-xs md:text-sm", dark ? "text-[#889084]" : "text-[#555]")}>
            {SAMPLE_POLICIES.length} active policy rules and {gatesList.filter((g) => g.status === "PENDING").length} pending human gates. Autonomous execution is bounded by organizational policy.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="border border-dashed px-3 py-1.5 text-xs font-mono rounded-xs border-[#383838] bg-[#202020] text-[#a0a89d]">
            <span className="text-[#75bf00] font-bold mr-1.5">●</span>
            Autonomy: {selectedAutonomy.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Tabs Toolbar Matching Image 1 */}
      <div className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-y border-dashed py-3",
        dark ? "border-[#2e2e2e]" : "border-[#d8ddd3]"
      )}>
        <div className="flex items-center gap-1 overflow-x-auto text-xs font-mono">
          {[
            { id: "gates", label: `Interactive Human Gates (${gatesList.filter((g) => g.status === "PENDING").length})` },
            { id: "policies", label: `Institutional Policies (${SAMPLE_POLICIES.length})` },
            { id: "autonomy", label: "Autonomy Levels (L0 - L5)" },
            { id: "learning", label: "Learning Fabric & Replays" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  "relative px-3 py-1 text-xs transition-colors rounded-xs",
                  isActive
                    ? dark ? "text-white font-bold" : "text-[#151515] font-bold"
                    : dark ? "text-[#788274] hover:text-white" : "text-[#687063] hover:text-black"
                )}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-[-13px] left-0 right-0 h-[2px] bg-[#75bf00]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: HUMAN GATES */}
      {activeTab === "gates" && (
        <div className="space-y-4">
          {gatesList.map((gate) => (
            <div
              key={gate.id}
              className={cn(
                "p-4 border border-dashed rounded-xs space-y-3",
                gate.status === "PENDING"
                  ? dark ? "border-[#f59e0b]/50 bg-[#1e1910]" : "border-[#f59e0b]/50 bg-[#fffdf7]"
                  : gate.status === "APPROVED"
                  ? dark ? "border-[#16a34a]/40 bg-[#101e12]" : "border-[#16a34a]/40 bg-[#f0fdf4]"
                  : dark ? "border-[#ef4444]/40 bg-[#1f1010]" : "border-[#ef4444]/40 bg-[#fef2f2]"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 border border-[#f59e0b] text-[#f59e0b] bg-[#f59e0b]/10 rounded-xs uppercase">
                    {gate.gateType.replace(/_/g, " ")}
                  </span>
                  <h3 className={cn("text-sm font-bold", dark ? "text-white" : "text-[#111]")}>
                    {gate.missionName}
                  </h3>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-[#888]">{gate.createdAt}</span>
                  <span
                    className={cn(
                      "px-2 py-0.5 border rounded-xs font-bold uppercase text-[10px]",
                      gate.status === "PENDING"
                        ? "border-[#f59e0b] text-[#f59e0b]"
                        : gate.status === "APPROVED"
                        ? "border-[#16a34a] text-[#16a34a]"
                        : "border-[#ef4444] text-[#ef4444]"
                    )}
                  >
                    {gate.status}
                  </span>
                </div>
              </div>

              <div className="p-3 border border-dashed rounded-xs font-mono text-xs space-y-2 border-[#333]/20 bg-black/5 dark:bg-white/5">
                <div>
                  <span className="text-[#888] block text-[10px] uppercase font-bold">Reason for Gate:</span>
                  <span className={dark ? "text-white" : "text-[#111]"}>{gate.reason}</span>
                </div>
                <div>
                  <span className="text-[#75bf00] block text-[10px] uppercase font-bold">Epoch Recommendation:</span>
                  <span className={dark ? "text-white" : "text-[#111]"}>{gate.epochRecommendation}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 border-t border-dashed border-[#333]/10">
                  <div>
                    <span className="text-[#888] block text-[9px] uppercase">Expected Impact</span>
                    <span className="text-[#75bf00] font-bold">{gate.expectedImpact}</span>
                  </div>
                  <div>
                    <span className="text-[#888] block text-[9px] uppercase">Rollback Safety Net</span>
                    <span className="text-[#16a34a] font-bold">{gate.rollbackPlan}</span>
                  </div>
                </div>
              </div>

              {gate.status === "PENDING" && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-dashed border-[#333]/20">
                  <button
                    type="button"
                    onClick={() => handleReject(gate.id)}
                    className="px-3 py-1.5 text-xs font-mono font-bold border border-dashed border-[#ef4444] text-[#ef4444] rounded-xs hover:bg-[#ef4444]/10 transition-colors"
                  >
                    Reject Action
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(gate.id)}
                    className="px-4 py-1.5 text-xs font-mono font-bold border border-dashed border-[#75bf00] bg-[#75bf00] text-black rounded-xs hover:bg-[#86d900] transition-colors"
                  >
                    Approve &amp; Execute
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: INSTITUTIONAL POLICIES */}
      {activeTab === "policies" && (
        <div className="space-y-4">
          <div
            className={cn(
              "p-4 border border-dashed rounded-xs space-y-3",
              dark ? "border-[#2e2e2e] bg-[#181818]" : "border-[#d8ddd3] bg-white"
            )}
          >
            <h3 className={cn("text-sm font-bold", dark ? "text-white" : "text-[#111]")}>
              Configured Institutional Policy Boundaries
            </h3>

            <div className="space-y-2 font-mono text-xs">
              {SAMPLE_POLICIES.map((pol) => (
                <div
                  key={pol.id}
                  className={cn(
                    "flex items-center justify-between p-3 border border-dashed rounded-xs",
                    dark ? "border-[#333] bg-[#111]" : "border-[#ddd] bg-[#fafafa]"
                  )}
                >
                  <div>
                    <div className="font-bold">{pol.name}</div>
                    <div className="text-[11px] text-[#888]">Threshold: {pol.threshold}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] px-2 py-0.5 border border-dashed rounded-xs font-bold border-[#75bf00] text-[#75bf00]">
                      Action: {pol.actionOnBreach}
                    </span>
                    <span className="text-[#16a34a] text-[10px] font-bold">ACTIVE</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUTONOMY LEVELS */}
      {activeTab === "autonomy" && (
        <div className="space-y-4">
          <div
            className={cn(
              "p-4 border border-dashed rounded-xs space-y-4",
              dark ? "border-[#2e2e2e] bg-[#181818]" : "border-[#d8ddd3] bg-white"
            )}
          >
            <h3 className={cn("text-sm font-bold", dark ? "text-white" : "text-[#111]")}>
              Institutional Autonomy Level Selector
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
              {[
                { lvl: "L0_OBSERVE", title: "L0 — Observe Only", desc: "Collects telemetry and flags drift. No automatic actions." },
                { lvl: "L1_RECOMMEND", title: "L1 — Recommend", desc: "Generates candidate systems and proof packages for review." },
                { lvl: "L2_AUTO_EXPERIMENT", title: "L2 — Auto-Experiment", desc: "Autonomously executes benchmarks and isolated tests within budget." },
                { lvl: "L3_SANDBOX", title: "L3 — Sandbox Execution", desc: "Deploys code and runtimes into ephemeral isolated environments." },
                { lvl: "L4_BOUNDED_PROD", title: "L4 — Bounded Production", desc: "Autonomously performs shadow & canary deployments with auto-rollback." },
                { lvl: "L5_ORGANIZATIONAL_AUTONOMY", title: "L5 — Organizational Autonomy", desc: "Continuous autonomous multi-domain remediation and evolution." },
              ].map((item) => (
                <div
                  key={item.lvl}
                  onClick={() => setSelectedAutonomy(item.lvl as AutonomyLevel)}
                  className={cn(
                    "p-3 border border-dashed rounded-xs cursor-pointer transition-all space-y-1.5",
                    selectedAutonomy === item.lvl
                      ? "border-[#75bf00] bg-[#75bf00]/10 text-white font-bold"
                      : dark
                      ? "border-[#333] bg-[#111] text-[#888] hover:border-[#555]"
                      : "border-[#ddd] bg-[#fafafa] text-[#666] hover:border-[#999]"
                  )}
                >
                  <div className="text-xs text-[#75bf00] font-bold">{item.title}</div>
                  <div className="text-[11px] leading-relaxed">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LEARNING FABRIC & REPLAYS */}
      {activeTab === "learning" && (
        <div className="space-y-4">
          <div
            className={cn(
              "p-4 border border-dashed rounded-xs space-y-4",
              dark ? "border-[#2e2e2e] bg-[#181818]" : "border-[#d8ddd3] bg-white"
            )}
          >
            <h3 className={cn("text-sm font-bold", dark ? "text-white" : "text-[#111]")}>
              Learned System Dynamics &amp; Deterministic Interventions
            </h3>

            <div className="space-y-3 font-mono text-xs">
              {SAMPLE_LEARNING_RECORDS.map((rec) => (
                <div
                  key={rec.id}
                  className={cn(
                    "p-3 border border-dashed rounded-xs space-y-2",
                    dark ? "border-[#333] bg-[#111]" : "border-[#ddd] bg-[#fafafa]"
                  )}
                >
                  <div className="flex items-center justify-between text-[#75bf00] font-bold">
                    <span>Record {rec.id}</span>
                    <span className="text-[10px] text-[#888]">{rec.verifiedAt}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[#888] block text-[9px] uppercase">State Transition</span>
                      <div>{rec.initialState} → {rec.resultingState}</div>
                    </div>
                    <div>
                      <span className="text-[#888] block text-[9px] uppercase">Intervention</span>
                      <div>{rec.intervention}</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-[#16a34a] font-bold pt-1 border-t border-dashed border-[#333]/20">
                    Reproducibility Score: {rec.reproducibilityScorePct}% • Verified Deterministic
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
