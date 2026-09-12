"use client";

import React, { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { TextPlugin } from "gsap/TextPlugin";
import {
  Check,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Cpu,
  GitPullRequest,
  AlertTriangle,
  Activity,
  ArrowRight,
  Server,
  Search,
  Layers,
  RefreshCw,
  Key,
  FileCode,
  Clock,
  Sparkles,
  Lock,
  ExternalLink,
  ChevronRight
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(TextPlugin);
}

type TabType = "3.1" | "3.2" | "3.3" | "3.4" | "3.5";

interface AgentMember {
  id: string;
  name: string;
  isAgent: boolean;
  iconPath?: string;
  avatarSeed?: string;
  type?: string;
}

const AGENT_LIST: AgentMember[] = [
  { id: "codex", name: "Codex", isAgent: true, iconPath: "/connector-icons/codex.svg" },
  { id: "steven", name: "Steven", isAgent: false, avatarSeed: "Steven" },
  { id: "ema", name: "Ema", isAgent: false, avatarSeed: "Ema" },
  { id: "copilot", name: "GitHub Copilot", isAgent: true, iconPath: "/connector-icons/github-actions.svg", type: "github" },
  { id: "cursor", name: "Cursor", isAgent: true, iconPath: "/connector-icons/cursor.ico" },
  { id: "meg", name: "Meg", isAgent: false, avatarSeed: "Meg" },
];

const LinearMCPView = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-50px" });
  const [selectedAgent, setSelectedAgent] = useState<string>("codex");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useGSAP(() => {
    if (!isInView) return;
    const tl = gsap.timeline();

    tl.to(".type-line-1", { duration: 0.4, text: "On it! I've received your request.", ease: "none" })
      .to(".type-line-2", { duration: 0.05, opacity: 1, ease: "none" }, "+=0.1")
      .to(".type-line-3", { duration: 0.4, text: "Checking current branch state...", ease: "none" }, "+=0.15")
      .to(".type-line-4", { duration: 0.05, opacity: 1, ease: "none" }, "+=0.1")
      .to(".type-line-5", { duration: 0.4, text: "Searching for root AGENTS file", ease: "none" }, "+=0.15")
      .to(".type-line-6", { duration: 0.05, opacity: 1, ease: "none" }, "+=0.1")
      .to(".type-line-7", { duration: 0.4, text: "Locating initialization logic for agent_state", ease: "none" }, "+=0.15")
      .to(".type-line-8", { duration: 0.05, opacity: 1, ease: "none" }, "+=0.1")
      .to(".type-line-9", { duration: 0.05, opacity: 1, ease: "none" }, "+=0.15")
      .to(".right-menu", { duration: 0.5, opacity: 1, x: 0, ease: "power2.out" }, "+=0.2");
  }, [isInView]);

  const filteredAgents = AGENT_LIST.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeAgentObj = AGENT_LIST.find((a) => a.id === selectedAgent) || AGENT_LIST[0];

  return (
    <div ref={containerRef} className="flex flex-col md:flex-row w-full min-h-[420px]">
      {/* Terminal Text (Left) */}
      <div className="flex-1 text-[#C8C7BA] space-y-5 font-mono text-[13px] md:text-[14px] p-6 md:p-8 flex flex-col justify-between">
        <div className="space-y-3 md:space-y-3.5 overflow-y-auto pr-2 pb-2 max-h-[350px] scrollbar-thin scrollbar-thumb-[#27272a] scrollbar-track-transparent">
          <div className="type-line-1 min-h-[20px] text-[#e4e4e7]"></div>

          <div className="type-line-2 opacity-0 min-h-[20px]">
            Kicked off a task in <span className="text-[#3b82f6] font-medium">memoryos/ignition-core</span> environment.
          </div>

          <div className="type-line-3 min-h-[20px] text-[#C8C7BA]"></div>

          <div className="type-line-4 opacity-0 text-[#71717a] bg-[#111113] p-2.5 rounded border border-[#222225] min-h-[44px] text-[12px] md:text-[13px] leading-relaxed">
            <span className="text-[#38bdf8]">ignition-core$</span> git branch --show-current<br />
            <span className="text-[#e4e4e7]">feat/agent-workforce</span>
          </div>

          <div className="type-line-5 min-h-[20px] text-[#C8C7BA]"></div>

          <div className="type-line-6 opacity-0 text-[#71717a] bg-[#111113] p-2.5 rounded border border-[#222225] min-h-[44px] text-[12px] md:text-[13px] leading-relaxed">
            <span className="text-[#38bdf8]">ignition-core$</span> rg --files -g 'AGENTS.md'<br />
            <span className="text-[#e4e4e7]">.github/AGENTS.md</span>
          </div>

          <div className="type-line-7 min-h-[20px] text-[#C8C7BA]"></div>

          <div className="type-line-8 opacity-0 text-[#71717a] bg-[#111113] p-2.5 rounded border border-[#222225] min-h-[44px] text-[12px] md:text-[13px] leading-relaxed">
            <span className="text-[#38bdf8]">ignition-core$</span> rg -n 'fn init_agent_state' src/<br />
            <span className="text-[#e4e4e7]">src/core/state.rs:142: pub fn init_agent_state(config: &Config) -&gt; Result&lt;AgentState&gt; {'{'}</span>
          </div>

          <div className="type-line-9 opacity-0 flex items-center gap-2.5 text-[#C8C7BA] min-h-[24px]">
            <div className="w-3.5 h-3.5 grid grid-cols-3 gap-[1.5px] items-center">
              <div className="bg-[#3b82f6] h-full w-full animate-pulse" />
              <div className="bg-[#3b82f6] h-full w-full animate-pulse delay-75" />
              <div className="bg-[#3b82f6] h-full w-full animate-pulse delay-150" />
              <div className="bg-[#3b82f6] h-full w-full animate-pulse delay-75" />
              <div className="bg-[#3b82f6] h-full w-full animate-pulse delay-150" />
              <div className="bg-[#3b82f6] h-full w-full animate-pulse delay-200" />
              <div className="bg-[#3b82f6] h-full w-full animate-pulse delay-150" />
              <div className="bg-[#3b82f6] h-full w-full animate-pulse delay-200" />
              <div className="bg-[#3b82f6] h-full w-full animate-pulse delay-300" />
            </div>
            <span>Analyzing state transitions...</span>
          </div>
        </div>

        {/* Audit Status Bar inside Terminal */}
        <div className="pt-4 border-t border-[#18181b] flex items-center justify-between text-[11px] text-[#71717a]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#22c55e]" />
            <span>Epoch Audit: <span className="text-[#22c55e] font-semibold">Active</span></span>
          </div>
          <div className="font-mono text-[#52525b]">
            Assignee: <span className="text-[#F0EFE2] font-medium">{activeAgentObj.name}</span>
          </div>
        </div>
      </div>

      {/* Integrated Menu (Right) */}
      <div className="right-menu opacity-0 translate-x-[20px] w-full md:w-[320px] lg:w-[360px] bg-[#0c0c0e] border-t md:border-t-0 md:border-l border-[#1a1a1e] font-sans flex flex-col shrink-0">
        <div className="px-4 py-3.5 border-b border-[#1a1a1e] flex items-center gap-2 bg-[#08080a]">
          <span className="text-[#3b82f6] font-light text-base animate-pulse">|</span>
          <input
            type="text"
            placeholder="Assign to..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-[13px] text-[#e4e4e7] placeholder-[#52525b] focus:outline-none w-full"
          />
        </div>

        <div className="flex flex-col py-1.5 overflow-y-auto max-h-[360px] divide-y divide-[#141417]">
          {filteredAgents.map((item) => {
            const isSelected = selectedAgent === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setSelectedAgent(item.id)}
                className={`flex items-center justify-between px-4 py-2.5 transition-colors cursor-pointer group ${
                  isSelected ? "bg-[#141418]" : "hover:bg-[#111114]"
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.iconPath ? (
                    <div className="w-6 h-6 rounded-full bg-[#18181b] p-0.5 flex items-center justify-center border border-[#27272a] shrink-0">
                      <img src={item.iconPath} alt={item.name} className="w-full h-full object-contain rounded-full" />
                    </div>
                  ) : item.type === "github" ? (
                    <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center border border-[#333] shrink-0">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#27272a] border border-[#3f3f46] flex items-center justify-center text-[10px] text-[#F0EFE2] font-bold shrink-0 overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${item.avatarSeed}&backgroundColor=transparent`} alt={item.name} className="w-full h-full rounded-full" />
                    </div>
                  )}
                  <span className="text-[#e4e4e7] font-medium text-[13px]">{item.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  {item.isAgent && (
                    <span className="text-[10px] bg-[#18181b] border border-[#27272a] text-[#C8C7BA] px-1.5 py-0.5 rounded font-mono group-hover:border-[#3f3f46]">
                      Agent
                    </span>
                  )}
                  {isSelected && (
                    <Check className="w-4 h-4 text-[#3b82f6]" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const IssuesView = () => {
  const issues = [
    {
      id: "ISSUE-492",
      title: "Production DB Connection Leak under concurrent agent tasks",
      agent: "Codex Agent",
      status: "QUARANTINED",
      risk: "HIGH RISK",
      riskColor: "text-red-400 bg-red-950/40 border-red-800/60",
      reason: "Agent requested DROP TABLE authority without valid token signature",
      timestamp: "2 mins ago"
    },
    {
      id: "ISSUE-491",
      title: "Automated patch for API rate-limiter fallback logic",
      agent: "Cursor Agent",
      status: "APPROVED",
      risk: "LOW RISK",
      riskColor: "text-emerald-400 bg-emerald-950/40 border-emerald-800/60",
      reason: "Policy rule #14 matched; scope confined to /services/ratelimit.ts",
      timestamp: "12 mins ago"
    },
    {
      id: "ISSUE-490",
      title: "Refactor Memory Ignition state serialization strategy",
      agent: "GitHub Copilot",
      status: "VERIFIED",
      risk: "VERIFIED",
      riskColor: "text-blue-400 bg-blue-950/40 border-blue-800/60",
      reason: "Verifiable state proof signed with key 0x9F8B...A72E",
      timestamp: "45 mins ago"
    }
  ];

  return (
    <div className="p-6 md:p-8 space-y-4 font-sans text-[#F0EFE2] w-full">
      <div className="flex items-center justify-between pb-3 border-b border-[#1f1f23]">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-[#3b82f6]" />
          <span className="font-mono text-[14px] text-[#e4e4e7] font-medium">3.1 Issues & Action Safety Log</span>
        </div>
        <span className="text-[12px] font-mono text-[#71717a] bg-[#141417] px-2.5 py-1 rounded border border-[#27272a]">
          3 Active Incidents Captured
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {issues.map((item) => (
          <div key={item.id} className="bg-[#111114] border border-[#1f1f23] rounded-md p-4 hover:border-[#333338] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-[12px] text-[#3b82f6] bg-[#1a2333] px-2 py-0.5 rounded font-semibold">{item.id}</span>
                <span className="text-[14px] font-medium text-[#f4f4f5]">{item.title}</span>
              </div>
              <p className="text-[12px] text-[#888891] font-mono flex items-center gap-2">
                <span>Assignee: <span className="text-[#d4d4d8] font-medium">{item.agent}</span></span>
                <span>•</span>
                <span>{item.reason}</span>
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className={`text-[11px] font-mono px-2.5 py-1 rounded border font-semibold ${item.riskColor}`}>
                {item.risk}
              </span>
              <span className="text-[11px] text-[#71717a] font-mono">{item.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AgentsView = () => {
  const agents = [
    { name: "Codex Agent", status: "Active", scope: "prod:write:gated", throughput: "1,420 t/s", policyScore: "99.8%", color: "border-blue-500/30 bg-blue-950/20" },
    { name: "Cursor Agent", status: "Active", scope: "repo:read, sandbox:full", throughput: "2,890 t/s", policyScore: "100%", color: "border-emerald-500/30 bg-emerald-950/20" },
    { name: "GitHub Copilot", status: "Active", scope: "pr:create, code:review", throughput: "940 t/s", policyScore: "99.4%", color: "border-purple-500/30 bg-purple-950/20" },
    { name: "Devin Autonomous", status: "Quarantined", scope: "infra:deploy (REVOKED)", throughput: "0 t/s", policyScore: "84.2%", color: "border-red-500/30 bg-red-950/20" },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 font-sans text-[#F0EFE2] w-full">
      <div className="flex items-center justify-between pb-3 border-b border-[#1f1f23]">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-[#3b82f6]" />
          <span className="font-mono text-[14px] text-[#e4e4e7] font-medium">3.2 Agent Fleet Telemetry & Governance</span>
        </div>
        <span className="text-[12px] font-mono text-[#22c55e] bg-[#0d2818] px-2.5 py-1 rounded border border-[#166534]">
          ● 4 Agents Monitored
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {agents.map((ag) => (
          <div key={ag.name} className={`p-4 rounded-md border ${ag.color} flex flex-col justify-between gap-3`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[14px] text-[#f4f4f5]">{ag.name}</span>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold ${
                ag.status === "Active" ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
              }`}>
                {ag.status}
              </span>
            </div>
            <div className="space-y-1 font-mono text-[12px] text-[#90909c]">
              <div className="flex justify-between">
                <span>Authority Scope:</span>
                <span className="text-[#F0EFE2] font-medium">{ag.scope}</span>
              </div>
              <div className="flex justify-between">
                <span>Token Velocity:</span>
                <span className="text-[#F0EFE2] font-medium">{ag.throughput}</span>
              </div>
              <div className="flex justify-between">
                <span>Policy Compliance:</span>
                <span className="text-[#38bdf8] font-semibold">{ag.policyScore}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const GitAutomationsView = () => {
  return (
    <div className="p-6 md:p-8 space-y-5 font-sans text-[#F0EFE2] w-full">
      <div className="flex items-center justify-between pb-3 border-b border-[#1f1f23]">
        <div className="flex items-center gap-2">
          <GitPullRequest className="w-5 h-5 text-[#3b82f6]" />
          <span className="font-mono text-[14px] text-[#e4e4e7] font-medium">3.4 Git PR & Commit Authority Inspector</span>
        </div>
        <span className="text-[12px] font-mono text-[#C8C7BA] bg-[#141417] px-2.5 py-1 rounded border border-[#27272a]">
          PR #1084 • Verified State
        </span>
      </div>

      <div className="bg-[#111114] border border-[#1f1f23] rounded-md p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[13px] text-[#38bdf8] bg-[#0c2a38] px-2 py-0.5 rounded font-bold">pr/agent-autofix-1084</span>
            <span className="text-[#e4e4e7] font-medium text-[14px]">Refactor auth token cache layer</span>
          </div>
          <span className="text-[11px] font-mono text-[#22c55e] bg-[#0f2e1b] px-2.5 py-1 rounded border border-[#166534] font-semibold">
            PASSED SAFETY GATE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px] font-mono pt-2 border-t border-[#1a1a1e]">
          <div className="flex items-center gap-2 text-[#C8C7BA]">
            <Check className="w-4 h-4 text-[#22c55e]" />
            <span>Commit Verification Signature: <span className="text-[#F0EFE2]">VALID (0x8F...4B)</span></span>
          </div>
          <div className="flex items-center gap-2 text-[#C8C7BA]">
            <Check className="w-4 h-4 text-[#22c55e]" />
                <span>Epoch Policy Check: <span className="text-[#F0EFE2]">APPROVED (Rule #7)</span></span>
          </div>
          <div className="flex items-center gap-2 text-[#C8C7BA]">
            <Check className="w-4 h-4 text-[#22c55e]" />
            <span>Authority Delegation: <span className="text-[#F0EFE2]">Steven (CTO)</span></span>
          </div>
          <div className="flex items-center gap-2 text-[#C8C7BA]">
            <Check className="w-4 h-4 text-[#22c55e]" />
            <span>Immutable Audit Log: <span className="text-[#38bdf8]">RECORDED</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

const CyclesView = () => {
  const steps = [
    { num: "01", name: "Mission Contract", detail: "Intent becomes a mission with success criteria, institution owner, and evidence duties." },
    { num: "02", name: "Authority Lease", detail: "Epoch grants only the scoped capability required for this mission and role." },
    { num: "03", name: "Institution Run", detail: "Agents and humans execute inside an isolated institutional boundary." },
    { num: "04", name: "Proof Result", detail: "Independent verification checks claims and returns PASS, FAIL, or UNKNOWN." },
    { num: "05", name: "Settlement & Inheritance", detail: "Outcome, cost, and fitness are recorded for the next institution version." }
  ];

  return (
    <div className="p-6 md:p-8 space-y-5 font-sans text-[#F0EFE2] w-full">
      <div className="flex items-center justify-between pb-3 border-b border-[#1f1f23]">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#3b82f6]" />
          <span className="font-mono text-[14px] text-[#e4e4e7] font-medium">3.5 Autonomous Agent Cycle Pipeline</span>
        </div>
        <span className="text-[12px] font-mono text-[#38bdf8] bg-[#0c2a38] px-2.5 py-1 rounded border border-[#0284c7]">
          Cycle #8,419 Complete
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
        {steps.map((st, idx) => (
          <div key={st.num} className="bg-[#111114] border border-[#1f1f23] rounded-md p-3 flex flex-col justify-between hover:border-[#3b82f6]/50 transition-colors">
            <div>
              <span className="text-[#3b82f6] font-mono text-[11px] font-bold block mb-1">STEP {st.num}</span>
              <h4 className="font-semibold text-[13px] text-[#e4e4e7] mb-1">{st.name}</h4>
              <p className="text-[11px] text-[#888891] leading-snug">{st.detail}</p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#1a1a1e] flex items-center justify-between text-[10px] font-mono text-[#22c55e]">
              <span>Status: OK</span>
              <Check className="w-3 h-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AgentAssignUI = () => {
  const [activeTab, setActiveTab] = useState<TabType>("3.3");

  return (
    <div className="w-full flex flex-col items-center mt-12 md:mt-20 mb-16">
      {/* Container matching image style */}
      <div className="w-full max-w-[1020px] bg-[#0a0a0c] rounded-md font-mono text-[13px] md:text-[14px] leading-relaxed relative overflow-hidden flex flex-col shadow-2xl border border-[#1a1a1e]">
        {/* Container Top Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#1a1a1e] bg-[#070709]">
          <div className="w-5 h-5 flex items-center justify-center overflow-hidden rounded-full bg-[#18181b] border border-[#27272a]">
            <img src="/connector-icons/codex.svg" alt="Codex" className="w-full h-full object-contain" />
          </div>
          <span className="text-[#F0EFE2] font-medium font-sans text-[14px]">Codex</span>
          <span className="text-[11px] font-mono text-[#38bdf8] bg-[#0c2a38] px-2 py-0.5 rounded border border-[#0284c7]/40 ml-2 hidden sm:inline-block">
            {activeTab === "3.3" && "Linear MCP Connected"}
            {activeTab === "3.1" && "Safety Log Ingesting"}
            {activeTab === "3.2" && "Fleet Telemetry Active"}
            {activeTab === "3.4" && "Git Policy Guard On"}
            {activeTab === "3.5" && "Cycle Runner Syncing"}
          </span>

          <div className="ml-auto flex items-center gap-3 text-[#71717a]">
            <div className="flex items-center gap-1.5 text-[11px] font-mono bg-[#141417] px-2.5 py-1 rounded border border-[#27272a]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[#e4e4e7] hidden sm:inline">VERIFIED STATE</span>
            </div>
            <div className="text-[#555] tracking-widest text-[16px] cursor-default hover:text-[#F0EFE2] transition-colors">
              ...
            </div>
          </div>
        </div>

        {/* Dynamic View Content */}
        <div className="w-full min-h-[380px] bg-[#070709]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              {activeTab === "3.3" && <LinearMCPView />}
              {activeTab === "3.1" && <IssuesView />}
              {activeTab === "3.2" && <AgentsView />}
              {activeTab === "3.4" && <GitAutomationsView />}
              {activeTab === "3.5" && <CyclesView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Legend below the container - Interactive Tabs */}
      <div className="w-full max-w-[1020px] mt-8 md:mt-10">
        <div className="hidden md:flex w-full">
          {/* Empty left column for balance */}
          <div className="flex-1"></div>

          {/* Right side aligned interactive grid */}
          <div className="w-[380px] grid grid-cols-2 gap-x-6 gap-y-3 px-6">
            <div className="flex flex-col gap-3 font-sans text-[13px]">
              <button
                onClick={() => setActiveTab("3.1")}
                className={`flex items-center gap-3 text-left transition-colors group ${
                  activeTab === "3.1" ? "text-[#F0EFE2] font-semibold" : "text-[#71717a] hover:text-[#C8C7BA]"
                }`}
              >
                <span className={`font-mono w-6 text-[12px] ${activeTab === "3.1" ? "text-[#3b82f6]" : "text-[#52525b]"}`}>3.1</span>
                <span className={activeTab === "3.1" ? "text-[#5e96f2]" : ""}>Issues</span>
              </button>

              <button
                onClick={() => setActiveTab("3.3")}
                className={`flex items-center gap-3 text-left transition-colors group ${
                  activeTab === "3.3" ? "text-[#F0EFE2] font-semibold" : "text-[#71717a] hover:text-[#C8C7BA]"
                }`}
              >
                <span className={`font-mono w-6 text-[12px] ${activeTab === "3.3" ? "text-[#3b82f6]" : "text-[#52525b]"}`}>3.3</span>
                <span className={activeTab === "3.3" ? "text-[#5e96f2]" : ""}>Linear MCP</span>
              </button>

              <button
                onClick={() => setActiveTab("3.5")}
                className={`flex items-center gap-3 text-left transition-colors group ${
                  activeTab === "3.5" ? "text-[#F0EFE2] font-semibold" : "text-[#71717a] hover:text-[#C8C7BA]"
                }`}
              >
                <span className={`font-mono w-6 text-[12px] ${activeTab === "3.5" ? "text-[#3b82f6]" : "text-[#52525b]"}`}>3.5</span>
                <span className={activeTab === "3.5" ? "text-[#5e96f2]" : ""}>Cycles</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 font-sans text-[13px]">
              <button
                onClick={() => setActiveTab("3.2")}
                className={`flex items-center gap-3 text-left transition-colors group ${
                  activeTab === "3.2" ? "text-[#F0EFE2] font-semibold" : "text-[#71717a] hover:text-[#C8C7BA]"
                }`}
              >
                <span className={`font-mono w-6 text-[12px] ${activeTab === "3.2" ? "text-[#3b82f6]" : "text-[#52525b]"}`}>3.2</span>
                <span className={activeTab === "3.2" ? "text-[#5e96f2]" : ""}>Agents</span>
              </button>

              <button
                onClick={() => setActiveTab("3.4")}
                className={`flex items-center gap-3 text-left transition-colors group ${
                  activeTab === "3.4" ? "text-[#F0EFE2] font-semibold" : "text-[#71717a] hover:text-[#C8C7BA]"
                }`}
              >
                <span className={`font-mono w-6 text-[12px] ${activeTab === "3.4" ? "text-[#3b82f6]" : "text-[#52525b]"}`}>3.4</span>
                <span className={activeTab === "3.4" ? "text-[#5e96f2]" : ""}>Git automations</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile legend tabs */}
        <div className="md:hidden grid grid-cols-2 gap-x-4 gap-y-3 px-6">
          <button
            onClick={() => setActiveTab("3.1")}
            className={`flex items-center gap-2 text-left ${activeTab === "3.1" ? "text-[#5e96f2] font-semibold" : "text-[#71717a]"}`}
          >
            <span className="font-mono text-[12px]">3.1</span>
            <span>Issues</span>
          </button>
          <button
            onClick={() => setActiveTab("3.2")}
            className={`flex items-center gap-2 text-left ${activeTab === "3.2" ? "text-[#5e96f2] font-semibold" : "text-[#71717a]"}`}
          >
            <span className="font-mono text-[12px]">3.2</span>
            <span>Agents</span>
          </button>
          <button
            onClick={() => setActiveTab("3.3")}
            className={`flex items-center gap-2 text-left ${activeTab === "3.3" ? "text-[#5e96f2] font-semibold" : "text-[#71717a]"}`}
          >
            <span className="font-mono text-[12px]">3.3</span>
            <span>Linear MCP</span>
          </button>
          <button
            onClick={() => setActiveTab("3.4")}
            className={`flex items-center gap-2 text-left ${activeTab === "3.4" ? "text-[#5e96f2] font-semibold" : "text-[#71717a]"}`}
          >
            <span className="font-mono text-[12px]">3.4</span>
            <span>Git automations</span>
          </button>
          <button
            onClick={() => setActiveTab("3.5")}
            className={`flex items-center gap-2 text-left ${activeTab === "3.5" ? "text-[#5e96f2] font-semibold" : "text-[#71717a]"}`}
          >
            <span className="font-mono text-[12px]">3.5</span>
            <span>Cycles</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export function ThePainSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } }
  };

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-transparent text-black font-sans overflow-hidden py-24 md:py-36"
      style={{ fontFamily: 'var(--font-sans, "Inter", sans-serif)' }}
    >
      <div className="w-full max-w-[1300px] mx-auto px-6 lg:px-12 relative z-10 flex flex-col">

        {/* Top Text Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start w-full">

          {/* Left Column: Heading */}
          <motion.div
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-slate-900 leading-[1.1] max-w-[600px]">
              Companies are hiring agents faster than they can organize <span className="text-[#0015FF]">them.</span>
            </motion.h2>
          </motion.div>

          {/* Right Column: Copy */}
          <motion.div
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={{ visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } } }}
            className="pt-2 lg:pt-6"
          >
            <motion.p variants={fadeUp} className="text-[#52525b] text-[18px] md:text-[22px] leading-[1.5] max-w-[600px] mb-8">
              A single coding agent is a tool. A fleet of research, support, sales, finance, security, and engineering agents is an autonomous organization. Without institutions, nobody can prove who acted, who authorized it, what budget was spent, what evidence supports the outcome, or what should be inherited.
            </motion.p>

            <motion.div variants={fadeUp} className="flex items-center text-[13px] text-[#71717a] font-mono hover:text-black transition-colors cursor-pointer group">
              <span>6.0</span>
              <span className="mx-3">The Pain</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </motion.div>
          </motion.div>

        </div>



        {/* Bottom Wide Interactive UI Container */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          className="w-full"
        >
          <AgentAssignUI />
        </motion.div>

      </div>
    </section>
  );
}


