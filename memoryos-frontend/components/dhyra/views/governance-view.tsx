"use client";

import React, { useState } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Plus,
  Check,
  X,
  AlertTriangle,
  FileText,
  Sliders,
  Cpu,
  Zap,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MetaLogo,
  QwenLogo,
  NvidiaLogo,
  VLLMLogo,
  SGLangLogo,
  DeepSeekLogo,
} from "@/components/dhyra/primitives/brand-icons";

export interface PolicyRule {
  id: string;
  name: string;
  scope: string;
  constraint: string;
  status: "ENFORCED" | "LOG_ONLY" | "DISABLED";
  authorityGate: string;
  lastUpdated: string;
}

export interface HumanGateItem {
  id: string;
  gateType: "Gate C — Production Cutover" | "Gate D — Spend Commitment" | "Gate E — Destructive Action";
  missionTitle: string;
  description: string;
  requestedBy: string;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  timestamp: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

interface GovernanceViewProps {
  dark?: boolean;
  onNavigateToEvidence?: () => void;
  onNavigateToMissions?: () => void;
}

export function GovernanceView({
  dark = true,
  onNavigateToEvidence,
  onNavigateToMissions,
}: GovernanceViewProps) {
  const [activeTab, setActiveTab] = useState<"policies" | "gates" | "autonomy">("policies");
  const [autonomyLevel, setAutonomyLevel] = useState<number>(3); // L3 Sandbox Execution
  const [addRuleModalOpen, setAddRuleModalOpen] = useState(false);
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleScope, setNewRuleScope] = useState("Global Spend");
  const [newRuleConstraint, setNewRuleConstraint] = useState("Max $500.00 / Experiment");

  // Sample Policy Rules (Section 45)
  const [policies, setPolicies] = useState<PolicyRule[]>([
    {
      id: "pol-spend-01",
      name: "Maximum Experiment Spend Cap",
      scope: "Global Experiment Fabric",
      constraint: "Max $500.00 USD / Single Sweep",
      status: "ENFORCED",
      authorityGate: "Gate D (Spend)",
      lastUpdated: "2h ago",
    },
    {
      id: "pol-model-02",
      name: "Allowed Model Open Licenses",
      scope: "Model Ingestion Registry",
      constraint: "Apache-2.0, MIT, Llama-3 Community",
      status: "ENFORCED",
      authorityGate: "Gate A (Policy)",
      lastUpdated: "1d ago",
    },
    {
      id: "pol-region-03",
      name: "Data Residency Isolation",
      scope: "Cloud Infrastructure",
      constraint: "us-east-1, eu-central-1 only",
      status: "ENFORCED",
      authorityGate: "Auto-Permitted",
      lastUpdated: "3d ago",
    },
    {
      id: "pol-cutover-04",
      name: "Production Cutover Authorization",
      scope: "100% Traffic Rollout",
      constraint: "Operator approval required for > 10% canary",
      status: "ENFORCED",
      authorityGate: "Gate C (Cutover)",
      lastUpdated: "Just now",
    },
  ]);

  // Sample Active Human Gates (Sections 48 & 91)
  const [humanGates, setHumanGates] = useState<HumanGateItem[]>([
    {
      id: "gate-req-01",
      gateType: "Gate C — Production Cutover",
      missionTitle: "Reduce inference cost for Qwen3-32B on vLLM by 40%",
      description: "Policy requires explicit human operator authorization to execute 100% production traffic cutover to Qwen 2.5 32B SGLang FP8.",
      requestedBy: "Dhyra Autonomous Runtime (EIG: 9.2/10)",
      riskLevel: "Medium",
      timestamp: "12m ago",
      status: "PENDING",
    },
    {
      id: "gate-req-02",
      gateType: "Gate D — Spend Commitment",
      missionTitle: "LLM 70B Multi-Node Load Benchmark Sweep",
      description: "Experiment sweep requested budget cap of $850.00 USD, exceeding the $500.00 mission policy threshold.",
      requestedBy: "Experiment Fabric Runner",
      riskLevel: "High",
      timestamp: "45m ago",
      status: "PENDING",
    },
  ]);

  const handleApproveGate = (id: string) => {
    setHumanGates((prev) =>
      prev.map((g) => (g.id === id ? { ...g, status: "APPROVED" } : g))
    );
  };

  const handleRejectGate = (id: string) => {
    setHumanGates((prev) =>
      prev.map((g) => (g.id === id ? { ...g, status: "REJECTED" } : g))
    );
  };

  const handleAddPolicyRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;

    const newRule: PolicyRule = {
      id: `pol-custom-${Date.now().toString().slice(-4)}`,
      name: newRuleName.trim(),
      scope: newRuleScope,
      constraint: newRuleConstraint,
      status: "ENFORCED",
      authorityGate: "Gate A (Policy)",
      lastUpdated: "Just now",
    };

    setPolicies([newRule, ...policies]);
    setNewRuleName("");
    setAddRuleModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-[1240px] mx-auto pb-24 font-sans text-xs text-left animate-in fade-in duration-150">
      {/* Noise-Free RunInfra Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#282828] pb-4 font-mono">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#75bf00] text-black px-2 py-0.5 rounded-xs font-bold text-xs uppercase tracking-wider">
              Policy & Authority Control
            </span>
            <h1 className="text-lg font-bold tracking-tight text-[#F0EFE2] font-sans">
              Governance Matrix
            </h1>
          </div>
          <p className="mt-1 text-xs text-[#C8C7BA]">
            Defining boundaries of organizational authority, spend caps, autonomy levels, and human gates (Sections 45–50).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAddRuleModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#75bf00] hover:bg-[#86dc00] text-black font-bold px-3.5 py-1.5 text-xs rounded-xs transition-colors cursor-pointer"
          >
            <Plus size={13} />
            <span>Add Policy Rule</span>
          </button>
        </div>
      </div>



      {/* Subnav Tabs & 24 hours Policy Window matching User Image */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center border border-dashed border-[#383838] bg-[#141414] p-0.5 font-mono text-xs rounded-sm gap-1 overflow-x-auto">
          {[
            { id: "policies", label: `Policy Rules (${policies.length})` },
            { id: "gates", label: `Active Safety Gates (${humanGates.filter((g) => g.status === "PENDING").length})` },
            { id: "autonomy", label: "Authority Permissions Matrix" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  "px-2.5 py-0.5 text-xs font-mono transition-colors cursor-pointer rounded-sm",
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

        {/* 24 hours Time Window Badge (1:1 Match with User Image) */}
        <div className="inline-flex items-center border border-dashed border-[#383838] bg-[#141414] p-0.5 font-mono text-xs rounded-sm">
          <span className="bg-[#242424] text-[#F0EFE2] font-bold px-2 py-0.5 rounded-sm">
            24 hours
          </span>
        </div>
      </div>

      {/* TAB 1: POLICY RULES TABLE (Section 45) */}
      {activeTab === "policies" && (
        <div className="space-y-3 font-mono">
          <div className="border border-dashed border-[#262626] bg-[#141414] rounded-xs overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-dashed border-[#282828] text-[10px] text-[#666] bg-[#181818]">
                  <th className="p-3">RULE ID & NAME</th>
                  <th className="p-3">TARGET SCOPE</th>
                  <th className="p-3">CONSTRAINT LIMIT</th>
                  <th className="p-3">AUTHORITY GATE</th>
                  <th className="p-3">ENFORCEMENT</th>
                  <th className="p-3 text-right">LAST UPDATED</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-[#222]">
                {policies.map((pol) => (
                  <tr key={pol.id} className="hover:bg-[#181818] transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-[#F0EFE2] font-sans">{pol.name}</div>
                      <div className="text-[10px] text-[#777] font-mono mt-0.5">{pol.id}</div>
                    </td>
                    <td className="p-3 text-[#C8C7BA] text-[11px]">{pol.scope}</td>
                    <td className="p-3 text-[#F0EFE2] font-bold">{pol.constraint}</td>
                    <td className="p-3 text-[#75bf00]">{pol.authorityGate}</td>
                    <td className="p-3">
                      <span className="bg-[#75bf00]/10 text-[#75bf00] border border-dashed border-[#75bf00]/40 px-2 py-0.5 text-[10px] rounded-xs font-bold">
                        ● {pol.status}
                      </span>
                    </td>
                    <td className="p-3 text-right text-[#777] text-[11px]">{pol.lastUpdated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE HUMAN GATES (Sections 48 & 91) */}
      {activeTab === "gates" && (
        <div className="space-y-4 font-mono">
          <div className="text-xs text-[#C8C7BA]">
            Pending actions requiring explicit human organizational authority before execution (Section 48):
          </div>

          <div className="space-y-3">
            {humanGates.map((gate) => (
              <div
                key={gate.id}
                className={cn(
                  "p-4 border border-dashed rounded-xs space-y-3",
                  gate.status === "PENDING"
                    ? "border-[#f59e0b]/50 bg-[#181510]"
                    : gate.status === "APPROVED"
                      ? "border-[#75bf00]/40 bg-[#121812]"
                      : "border-[#ef4444]/40 bg-[#181212]"
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-[#282828] pb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle
                      size={14}
                      className={
                        gate.status === "PENDING"
                          ? "text-[#f59e0b]"
                          : gate.status === "APPROVED"
                            ? "text-[#75bf00]"
                            : "text-[#ef4444]"
                      }
                    />
                    <span className="font-bold text-[#F0EFE2] font-sans">{gate.gateType}</span>
                    <span className="text-[10px] text-[#777]">• {gate.timestamp}</span>
                  </div>
                  <span
                    className={cn(
                      "px-2 py-0.5 text-[10px] font-bold rounded-xs",
                      gate.status === "PENDING"
                        ? "bg-[#f59e0b]/20 text-[#f59e0b]"
                        : gate.status === "APPROVED"
                          ? "bg-[#75bf00]/20 text-[#75bf00]"
                          : "bg-[#ef4444]/20 text-[#ef4444]"
                    )}
                  >
                    ● {gate.status}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="font-bold text-[#F0EFE2] text-sm font-sans">{gate.missionTitle}</div>
                  <p className="text-xs text-[#C8C7BA] leading-relaxed">{gate.description}</p>
                  <div className="text-[10px] text-[#777] pt-1">Requested by: {gate.requestedBy}</div>
                </div>

                {gate.status === "PENDING" && (
                  <div className="flex items-center justify-between pt-2 border-t border-dashed border-[#282828]">
                    <button
                      type="button"
                      onClick={onNavigateToEvidence}
                      className="text-[11px] text-[#75bf00] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Inspect Proof Package</span>
                      <ExternalLink size={10} />
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRejectGate(gate.id)}
                        className="px-3 py-1 border border-dashed border-[#ef4444]/40 hover:bg-[#ef4444]/10 text-[#ef4444] rounded-xs text-xs font-bold transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApproveGate(gate.id)}
                        className="px-3.5 py-1 bg-[#75bf00] hover:bg-[#86dc00] text-black rounded-xs text-xs font-bold transition-colors cursor-pointer"
                      >
                        Approve Gate
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: AUTHORITY PERMISSIONS MATRIX (Section 46) */}
      {activeTab === "autonomy" && (
        <div className="space-y-3 font-mono">
          <div className="text-xs text-[#C8C7BA]">
            Organizational role mapping to permitted intervention capabilities (Section 46):
          </div>

          <div className="border border-dashed border-[#262626] bg-[#141414] rounded-xs overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-dashed border-[#282828] text-[10px] text-[#666] bg-[#181818]">
                  <th className="p-3">ACTOR / ROLE</th>
                  <th className="p-3">BENCHMARK RUNNER</th>
                  <th className="p-3">SANDBOX EXECUTION</th>
                  <th className="p-3">CANARY CUTOVER</th>
                  <th className="p-3">SPEND COMMITMENT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-[#222]">
                <tr className="hover:bg-[#181818] transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-[#75bf00] font-sans">Dhyra Autonomous Agent</div>
                    <div className="text-[10px] text-[#777] font-mono">Runtime Controller</div>
                  </td>
                  <td className="p-3 text-[#75bf00] font-bold">ALLOWED (L2)</td>
                  <td className="p-3 text-[#75bf00] font-bold">ALLOWED (L3)</td>
                  <td className="p-3 text-[#f59e0b]">REQUIRES GATE C</td>
                  <td className="p-3 text-[#f59e0b]">REQUIRES GATE D</td>
                </tr>
                <tr className="hover:bg-[#181818] transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-[#F0EFE2] font-sans">SRE Lead / Administrator</div>
                    <div className="text-[10px] text-[#777] font-mono">Human Operator</div>
                  </td>
                  <td className="p-3 text-[#75bf00] font-bold">ALLOWED</td>
                  <td className="p-3 text-[#75bf00] font-bold">ALLOWED</td>
                  <td className="p-3 text-[#75bf00] font-bold">FULL AUTHORITY</td>
                  <td className="p-3 text-[#75bf00] font-bold">FULL AUTHORITY</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Policy Rule Modal */}
      {addRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md border border-dashed border-[#262626] bg-[#141414] rounded-xs p-6 font-mono text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-dashed border-[#282828] pb-3">
              <span className="font-bold text-[#F0EFE2] text-sm font-sans">Add Policy Rule</span>
              <button
                type="button"
                onClick={() => setAddRuleModalOpen(false)}
                className="text-[#777] hover:text-[#F0EFE2] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddPolicyRule} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-[#777] uppercase tracking-wider">RULE NAME</label>
                <input
                  type="text"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  placeholder="e.g. Max GPU VRAM Limit"
                  className="w-full bg-[#181818] border border-dashed border-[#383838] focus:border-[#75bf00] rounded-xs px-3 py-1.5 text-[#F0EFE2] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#777] uppercase tracking-wider">TARGET SCOPE</label>
                <input
                  type="text"
                  value={newRuleScope}
                  onChange={(e) => setNewRuleScope(e.target.value)}
                  className="w-full bg-[#181818] border border-dashed border-[#383838] focus:border-[#75bf00] rounded-xs px-3 py-1.5 text-[#F0EFE2] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[#777] uppercase tracking-wider">CONSTRAINT LIMIT</label>
                <input
                  type="text"
                  value={newRuleConstraint}
                  onChange={(e) => setNewRuleConstraint(e.target.value)}
                  className="w-full bg-[#181818] border border-dashed border-[#383838] focus:border-[#75bf00] rounded-xs px-3 py-1.5 text-[#F0EFE2] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-dashed border-[#282828]">
                <button
                  type="button"
                  onClick={() => setAddRuleModalOpen(false)}
                  className="px-3 py-1 border border-dashed border-[#383838] hover:border-white text-[#F0EFE2] rounded-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-[#75bf00] hover:bg-[#86dc00] text-black font-bold rounded-xs"
                >
                  Save Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
