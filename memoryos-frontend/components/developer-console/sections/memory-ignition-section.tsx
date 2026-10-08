"use client";

import { useState } from "react";
import {
  Bell,
  BookOpen,
  ChevronDown,
  Copy,
  Download,
  FileText,
  Search,
  Send,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Database,
  Workflow,
  Sparkles,
  ArrowRight,
  Maximize2,
  Mic,
  BookmarkPlus,
  Lock,
  Code2,
  PlayCircle,
  PackageCheck
} from "lucide-react";
import { MemoryosLogoMark } from "@/components/continuity-lab/memoryos-logo-mark";
import { cn } from "@/lib/utils";

type MemoryIgnitionSectionProps = {
  workspaceName?: string;
  memoryCount?: number;
  requestCount?: number;
  timelineCount?: number;
  latestRequestRoute?: string | null;
  latestRequestAt?: string | null;
  onOpenAgentAccess?: () => void;
  onOpenRuntime?: () => void;
};

export function MemoryIgnitionSection(props: MemoryIgnitionSectionProps) {
  const [targetAgent, setTargetAgent] = useState("Codex");
  const [targetFormat, setTargetFormat] = useState("System Prompt");
  const [autonomyLevel, setAutonomyLevel] = useState("Medium (Guarded)");
  const [safetyMode, setSafetyMode] = useState("Enterprise (Strict)");
  const [activeTab, setActiveTab] = useState("Prompt Preview");

  return (
    <div className="h-full overflow-y-auto bg-[#FAFAFA] text-[#111827] px-8 py-8 relative">
      <style dangerouslySetInnerHTML={{
        __html: `
        [data-console-header-chrome] { display: none !important; }
        header.relative.z-\\[90\\] { display: none !important; }
      `}} />

      <div className="max-w-[1440px] mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex flex-col">
            <h1 className="text-[28px] font-bold tracking-tight text-slate-900 mb-1">MemoryIgnition Command Center</h1>
            <p className="text-[14px] text-slate-500 font-medium">Prepare any AI agent with the right company memory, risk controls, proof, and execution context.</p>
          </div>

          <div className="flex items-center gap-6 mt-1">
            <div className="relative hidden md:block w-[300px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search anything..."
                className="w-full h-[42px] bg-white border border-slate-200 rounded-xl pl-10 pr-12 text-[13px] font-medium placeholder:text-slate-400 outline-none focus:border-amber-400 transition-colors shadow-sm"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] text-slate-400 font-medium bg-[#FAFAFA] border border-slate-100 rounded px-1.5 py-0.5">
                ⌘ K
              </div>
            </div>

            <div className="flex items-center gap-5">
              <button className="relative text-slate-600 hover:text-slate-900 transition-colors">
                <Bell className="size-5" />
                <span className="absolute -top-1.5 -right-1.5 size-4 bg-amber-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">3</span>
              </button>

              <button className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-[#FAFAFA] border border-slate-200 rounded-full py-1.5 pl-1.5 pr-3 hover:bg-slate-50 transition-colors">
                <span className="size-8 rounded-full bg-orange-50 text-slate-900 flex items-center justify-center text-[13px] font-bold">
                  KS
                </span>
                <ChevronDown className="size-4 text-slate-500" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Input Block */}
        <div className="bg-white border border-slate-200 rounded-[20px] p-4 flex gap-4 shadow-sm items-center">
          <div className="flex-1 flex items-center gap-3 pl-2">
            <Sparkles className="size-5 text-amber-400 shrink-0" />
            <input 
              className="w-full text-[15px] outline-none placeholder:text-slate-400 text-slate-900 font-medium bg-transparent"
              placeholder="What do you want the agent to do?"
            />
            <button className="shrink-0 size-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
              <Mic className="size-5" />
            </button>
          </div>
          <div className="flex flex-col items-center shrink-0">
             <button className="bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold px-6 py-3 rounded-[12px] flex items-center gap-2 transition-colors shadow-sm text-[14px]">
               Prepare Agent <ArrowRight className="size-4" />
             </button>
             <span className="text-[11px] text-slate-500 font-medium mt-2 max-w-[150px] text-center leading-tight">
               Creates a ready-to-run agent package with proof.
             </span>
          </div>
        </div>

        {/* Configurations */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Target Agent", value: targetAgent, icon: "codex" },
            { label: "Target Format", value: targetFormat, icon: FileText },
            { label: "Autonomy Level", value: autonomyLevel, icon: ShieldCheck },
            { label: "Safety Mode", value: safetyMode, icon: Lock },
          ].map((cfg, i) => (
             <div key={i} className="bg-white border border-slate-200 rounded-[12px] p-3 shadow-sm flex items-center justify-between cursor-pointer hover:border-slate-300 transition-colors">
               <div className="flex flex-col">
                 <span className="text-[11px] font-bold text-slate-500 mb-1">{cfg.label}</span>
                 <div className="flex items-center gap-2">
                   {cfg.label === "Target Agent" ? (
                     <MemoryosLogoMark className="shrink-0" size={18} variant="tile" />
                   ) : typeof cfg.icon === "string" ? (
                     <div className="size-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">C</div>
                   ) : (
                     <cfg.icon className="size-[18px] text-slate-700" />
                   )}
                   <span className="text-[13px] font-bold text-slate-900">{cfg.value}</span>
                 </div>
               </div>
               <ChevronDown className="size-4 text-slate-400" />
             </div>
          ))}
        </div>

        {/* Main Grid: 3 Things + Metrics + Package Preview (Left), Sidebar (Right) */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6">
          <div className="space-y-6">
            
            {/* 3 Things */}
            <div>
              <h2 className="text-[15px] font-bold text-slate-900 mb-4">3 Things</h2>
              <div className="grid grid-cols-3 gap-4">
                {/* 1 */}
                <div className="bg-white border border-emerald-100 rounded-[14px] p-5 shadow-sm relative overflow-hidden">
                  <div className="absolute inset-0 bg-emerald-50/50 pointer-events-none" />
                  <div className="relative z-10 flex gap-3">
                    <BookOpen className="size-5 text-emerald-600 shrink-0" strokeWidth={2} />
                    <div>
                      <h3 className="text-[13px] font-bold text-emerald-900 mb-2">1. What the agent should know</h3>
                      <ul className="text-[12px] text-slate-600 space-y-1.5 list-disc pl-4 marker:text-slate-400">
                        <li>Product roadmap and priorities</li>
                        <li>Coding standards and best practices</li>
                        <li>Approved patterns and libraries</li>
                      </ul>
                      <div className="mt-4 inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                        12 knowledge sources
                      </div>
                    </div>
                  </div>
                </div>
                {/* 2 */}
                <div className="bg-white border border-amber-100 rounded-[14px] p-5 shadow-sm relative overflow-hidden">
                  <div className="absolute inset-0 bg-amber-50/50 pointer-events-none" />
                  <div className="relative z-10 flex gap-3">
                    <AlertTriangle className="size-5 text-amber-500 shrink-0" strokeWidth={2} />
                    <div>
                      <h3 className="text-[13px] font-bold text-amber-900 mb-2">2. What to watch out for</h3>
                      <ul className="text-[12px] text-slate-600 space-y-1.5 list-disc pl-4 marker:text-slate-400">
                        <li>PII handling and data privacy</li>
                        <li>Billing and pricing policy</li>
                        <li>Infra changes require approval</li>
                      </ul>
                      <div className="mt-4 inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                        8 risk areas
                      </div>
                    </div>
                  </div>
                </div>
                {/* 3 */}
                <div className="bg-white border border-blue-100 rounded-[14px] p-5 shadow-sm relative overflow-hidden">
                  <div className="absolute inset-0 bg-blue-50/50 pointer-events-none" />
                  <div className="relative z-10 flex gap-3">
                    <ShieldCheck className="size-5 text-blue-500 shrink-0" strokeWidth={2} />
                    <div>
                      <h3 className="text-[13px] font-bold text-blue-900 mb-2">3. What must be proven</h3>
                      <ul className="text-[12px] text-slate-600 space-y-1.5 list-disc pl-4 marker:text-slate-400">
                        <li>Unit tests must pass</li>
                        <li>Security scan must pass</li>
                        <li>Changes reviewed and approved</li>
                      </ul>
                      <div className="mt-4 inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                        5 proof requirements
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-5 gap-4">
              {[
                { label: "Agent Readiness", value: "84%", trend: "↑ 8% vs last 7 days", trendColor: "text-emerald-500" },
                { label: "Memory Quality", value: "91%", trend: "↑ 6% vs last 7 days", trendColor: "text-emerald-500" },
                { label: "Policy Check", value: "92%", trend: "↑ 5% vs last 7 days", trendColor: "text-emerald-500" },
                { label: "Required Tests", value: "6 / 8", trend: "75% completed", trendColor: "text-slate-500", sparkline: false },
                { label: "Risk Warnings", value: "3", trend: "↓ 1 vs yesterday", trendColor: "text-amber-500" },
              ].map((m, i) => (
                <div key={i} className="rounded-[20px] bg-[#E2E4E9] flex flex-col h-[180px] border border-black/5 relative hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                  <div className="bg-white rounded-[20px] shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-black/[0.04] p-5 relative z-10 flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center gap-2 mb-2 z-10 relative">
                      <span className="text-[12px] font-bold text-slate-700">{m.label}</span>
                    </div>
                    <div className="text-[32px] font-black text-slate-900 tracking-tighter leading-none mt-1 z-10 relative">
                      {m.value}
                    </div>
                    {m.sparkline !== false && (
                      <div className="absolute bottom-5 left-5 right-5 h-8 pointer-events-none">
                        <svg viewBox="0 0 100 24" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                          <path d="M 0 15 Q 20 15 30 10 T 60 12 T 90 5 L 100 5" fill="none" stroke={m.trendColor.includes('amber') ? '#F59E0B' : '#10B981'} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="h-10 shrink-0 flex items-center justify-center px-4 rounded-b-[20px] relative z-0">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white text-[11px] font-bold text-slate-500">
                      <span className={cn("flex items-center", m.trendColor)}>
                        {m.trend}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Package Preview */}
            <div className="bg-white border border-slate-200 rounded-[14px] p-6 shadow-sm">
               <div className="flex items-center gap-3 mb-6">
                 <h2 className="text-[15px] font-bold text-slate-900">Package Preview</h2>
                 <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  All systems operational
                </span>
               </div>
               
               <div className="grid grid-cols-5 gap-6">
                 {/* Inheritance Summary */}
                 <div>
                   <h3 className="text-[12px] font-bold text-slate-500 mb-4">Inheritance Summary</h3>
                   <div className="space-y-4">
                     <div className="flex items-center gap-3">
                       <Database className="size-4 text-slate-700" />
                       <div className="flex flex-col">
                         <span className="text-[13px] font-bold text-slate-900">42</span>
                         <span className="text-[11px] text-slate-500">Packages</span>
                       </div>
                     </div>
                     <div className="flex items-center gap-3">
                       <FileText className="size-4 text-slate-700" />
                       <div className="flex flex-col">
                         <span className="text-[13px] font-bold text-slate-900">128</span>
                         <span className="text-[11px] text-slate-500">Knowledge Sources</span>
                       </div>
                     </div>
                     <div className="flex items-center gap-3">
                       <BookOpen className="size-4 text-slate-700" />
                       <div className="flex flex-col">
                         <span className="text-[13px] font-bold text-slate-900">74</span>
                         <span className="text-[11px] text-slate-500">Skills</span>
                       </div>
                     </div>
                     <div className="flex items-center gap-3">
                       <PlayCircle className="size-4 text-slate-700" />
                       <div className="flex flex-col">
                         <span className="text-[13px] font-bold text-slate-900">19</span>
                         <span className="text-[11px] text-slate-500">Run Histories</span>
                       </div>
                     </div>
                     <div className="mt-2 inline-flex items-center px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                       Structured inheritance
                     </div>
                   </div>
                 </div>

                 {/* Risky Files */}
                 <div>
                   <div className="flex justify-between items-center mb-4">
                     <h3 className="text-[12px] font-bold text-slate-500">Risky Files</h3>
                     <span className="text-[11px] text-amber-500 font-bold bg-amber-50 px-1.5 rounded">3</span>
                   </div>
                   <div className="space-y-3">
                     {[
                       { file: "auth/service.ts", risk: "High", color: "text-red-600 bg-red-50" },
                       { file: "billing/price.ts", risk: "Medium", color: "text-amber-600 bg-amber-50" },
                       { file: "infra/prod.tf", risk: "Low", color: "text-green-600 bg-green-50" },
                     ].map((item, i) => (
                       <div key={i} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                         <span className="text-[12px] font-medium text-slate-700 truncate">{item.file}</span>
                         <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded", item.color)}>{item.risk}</span>
                       </div>
                     ))}
                   </div>
                   <button className="text-[11px] text-amber-600 font-bold mt-4 flex items-center gap-1 hover:text-amber-700">View all risky files <ArrowRight className="size-3" /></button>
                 </div>

                 {/* Tests */}
                 <div>
                   <div className="flex justify-between items-center mb-4">
                     <h3 className="text-[12px] font-bold text-slate-500">Tests</h3>
                     <span className="text-[11px] text-slate-500 font-bold">6 / 8</span>
                   </div>
                   <div className="space-y-3">
                     {[
                       { name: "Unit Tests", status: "Passed", icon: CheckCircle2, color: "text-emerald-500", badge: "text-emerald-600 bg-emerald-50" },
                       { name: "Lint", status: "Passed", icon: CheckCircle2, color: "text-emerald-500", badge: "text-emerald-600 bg-emerald-50" },
                       { name: "Type Check", status: "Passed", icon: CheckCircle2, color: "text-emerald-500", badge: "text-emerald-600 bg-emerald-50" },
                       { name: "Security Scan", status: "Passed", icon: CheckCircle2, color: "text-emerald-500", badge: "text-emerald-600 bg-emerald-50" },
                       { name: "Integration Tests", status: "In Progress", icon: PlayCircle, color: "text-blue-500", badge: "text-blue-600 bg-blue-50" },
                     ].map((item, i) => (
                       <div key={i} className="flex justify-between items-center">
                         <div className="flex items-center gap-2">
                           <item.icon className={cn("size-3.5", item.color)} />
                           <span className="text-[12px] font-medium text-slate-700">{item.name}</span>
                         </div>
                         <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded", item.badge)}>{item.status}</span>
                       </div>
                     ))}
                   </div>
                   <button className="text-[11px] text-amber-600 font-bold mt-4 flex items-center gap-1 hover:text-amber-700">View all tests <ArrowRight className="size-3" /></button>
                 </div>

                 {/* Approvals */}
                 <div>
                   <div className="flex justify-between items-center mb-4">
                     <h3 className="text-[12px] font-bold text-slate-500">Approvals</h3>
                     <span className="text-[11px] text-slate-500 font-bold">2 / 3</span>
                   </div>
                   <div className="space-y-4">
                     {[
                       { name: "Security Review", status: "Approved", icon: ShieldCheck, color: "text-emerald-500", badge: "text-emerald-600 bg-emerald-50" },
                       { name: "Data Privacy", status: "Approved", icon: ShieldCheck, color: "text-emerald-500", badge: "text-emerald-600 bg-emerald-50" },
                       { name: "Architecture", status: "Pending", icon: AlertTriangle, color: "text-amber-500", badge: "text-amber-600 bg-amber-50" },
                     ].map((item, i) => (
                       <div key={i} className="flex justify-between items-center">
                         <div className="flex items-center gap-2">
                           <item.icon className={cn("size-3.5", item.color)} />
                           <span className="text-[12px] font-medium text-slate-700">{item.name}</span>
                         </div>
                         <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded", item.badge)}>{item.status}</span>
                       </div>
                     ))}
                   </div>
                   <button className="text-[11px] text-amber-600 font-bold mt-4 flex items-center gap-1 hover:text-amber-700">View approvals <ArrowRight className="size-3" /></button>
                 </div>

                 {/* Proof Chain */}
                 <div>
                   <h3 className="text-[12px] font-bold text-slate-500 mb-4">Proof Chain</h3>
                   <div className="space-y-3 relative">
                      <div className="absolute left-2 top-2 bottom-2 w-px bg-emerald-100" />
                      {[
                        { title: "Source Selected", sub: "12 sources" },
                        { title: "Memory Linked", sub: "128 items" },
                        { title: "Policy Applied", sub: "24 policies" },
                        { title: "Tests Executed", sub: "6 / 8 passed" },
                        { title: "Ready to Send", sub: "Package complete" },
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-2 relative z-10">
                          <div className="size-4 rounded-full bg-emerald-50 border border-emerald-500 flex items-center justify-center shrink-0 mt-0.5 bg-white">
                            <CheckCircle2 className="size-3 text-emerald-500" />
                          </div>
                          <div>
                            <p className="text-[12px] font-bold text-slate-900">{item.title}</p>
                            <p className="text-[10px] text-slate-500">{item.sub}</p>
                          </div>
                        </div>
                      ))}
                   </div>
                 </div>

               </div>
            </div>
            
          </div>
          
          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            <div className="bg-white border border-slate-200 rounded-[14px] p-5 shadow-sm">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-[15px] font-bold text-slate-900">Package Summary</h2>
                 <span className="text-[10px] font-bold text-slate-400">v2.1.3</span>
               </div>
               
               <div className="space-y-3 text-[12px] mb-6">
                 <div className="flex justify-between">
                   <span className="text-slate-500">Target Agent</span>
                   <span className="font-bold text-slate-900">Codex</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-slate-500">Created By</span>
                   <span className="font-bold text-slate-900">Kiran Shah</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-slate-500">Created At</span>
                   <span className="font-bold text-slate-900">May 29, 2025 10:42 AM</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-slate-500">Package Size</span>
                   <span className="font-bold text-slate-900">1.24 MB</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-slate-500">Expires In</span>
                   <span className="font-bold text-slate-900">7 days</span>
                 </div>
               </div>

               <button className="w-full bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold py-3 rounded-[10px] flex items-center justify-center gap-2 transition-colors shadow-sm text-[13px] mb-4">
                 <Send className="size-4" /> Send Now
               </button>

               <div className="flex flex-col gap-2">
                 {[
                   { label: "Copy Prompt", icon: Copy },
                   { label: "Export JSON", icon: Download },
                   { label: "Send via MCP", icon: Workflow },
                   { label: "Send via API", icon: Code2 },
                   { label: "Save as Blueprint", icon: BookmarkPlus },
                 ].map((action, i) => (
                   <button key={i} className="flex items-center gap-3 w-full p-2.5 rounded-[10px] border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors bg-white">
                     <action.icon className="size-4 text-slate-500" />
                     <span className="text-[12px] font-bold">{action.label}</span>
                   </button>
                 ))}
               </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 mt-6">
          <div className="bg-white border border-slate-200 rounded-[14px] flex flex-col shadow-sm">
             <div className="flex items-center justify-between px-2 pt-2 border-b border-slate-100">
               <div className="flex gap-1">
                 {["Prompt Preview", "JSON Payload", "Trace Proof", "Send History"].map(tab => (
                   <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-4 py-3 text-[13px] font-bold border-b-2 transition-colors",
                      activeTab === tab ? "border-amber-400 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"
                    )}
                   >
                     {tab}
                   </button>
                 ))}
               </div>
               <button className="flex items-center gap-2 text-[12px] font-bold text-slate-500 hover:text-slate-700 px-4">
                 View full screen <Maximize2 className="size-3.5" />
               </button>
             </div>
             <div className="p-4 flex-1">
               <div className="bg-[#FAF9F6] border border-[#EBE7DF] rounded-xl p-5 h-full font-mono text-[13px] text-slate-700 whitespace-pre-wrap leading-relaxed shadow-inner">
{`You are Codex, an AI engineer at Acme Inc.

Your mission: Implement the requested change safely, following company standards, policies, and approved patterns.

Context you must follow:
- Product priorities and roadmap
- Engineering standards and best practices
- Security, privacy, and compliance policies`}
               </div>
             </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[14px] p-6 shadow-sm flex flex-col">
            <h2 className="text-[14px] font-bold text-slate-900 mb-6">Context Summary</h2>
            <div className="space-y-4 flex-1 text-[13px]">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="flex items-center gap-2 text-slate-600"><BookOpen className="size-4" /> Knowledge Sources</span>
                <span className="font-bold text-slate-900">128</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="flex items-center gap-2 text-slate-600"><ShieldCheck className="size-4" /> Policies Applied</span>
                <span className="font-bold text-slate-900">24</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="flex items-center gap-2 text-slate-600"><PackageCheck className="size-4" /> Skills Attached</span>
                <span className="font-bold text-slate-900">21</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="flex items-center gap-2 text-slate-600"><PlayCircle className="size-4" /> Recent Runs Referenced</span>
                <span className="font-bold text-slate-900">7</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="flex items-center gap-2 text-slate-600"><FileText className="size-4" /> Package Version</span>
                <span className="font-bold text-slate-900">v2.1.3</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

