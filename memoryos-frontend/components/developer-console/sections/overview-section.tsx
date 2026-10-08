"use client";

import { useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Box,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Cloud,
  Database,
  DollarSign,
  FileText,
  GitBranch,
  Headphones,
  HeartPulse,
  Key,
  Lock,
  Mail,
  MessageSquare,
  MoreVertical,
  Package,
  Play,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Triangle,
  Zap,
  Bell,
  CircleDollarSign,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

// Make sure to import simple-icons
import {
  siGithub,
  siLinear,
  siJira,
  siNotion,
  siSentry,
  siVercel,
  siZendesk,
  siTwitch,
  siCursor,
} from "simple-icons";
import { CATALOG_BRAND_PATHS } from "@/components/continuity-lab/brand-icons/catalog-brand-paths";
import { ConnectorBrandIcon } from "@/components/continuity-lab/connector-brand-icons";

// Helper component for simple-icons
function SimpleIcon({ icon, className }: { icon: any, className?: string }) {
  if (!icon) return null;
  return (
    <svg role="img" viewBox="0 0 24 24" fill="currentColor" className={className} dangerouslySetInnerHTML={{ __html: `<path d="${icon.path}" />` }} />
  );
}

// --- Mock Data ---

const metrics = [
  {
    label: "Inheritance Health",
    value: "84%",
    trendValue: "8%",
    trendSuffix: "vs last 7 days",
    trendIcon: "up",
    icon: HeartPulse,
    color: "text-orange-500",
    sparkline: "M 0 20 Q 15 20 25 22 T 50 15 T 70 20 T 90 8 T 100 20",
    sparklineColor: "stroke-orange-500",
    trendColor: "text-emerald-500"
  },
  {
    label: "Memory Quality",
    value: "91%",
    trendValue: "6%",
    trendSuffix: "vs last 7 days",
    trendIcon: "up",
    icon: Database,
    color: "text-blue-500",
    sparkline: "M 0 20 Q 20 20 30 16 T 60 16 T 90 10 L 100 8",
    sparklineColor: "stroke-blue-500",
    trendColor: "text-emerald-500"
  },
  {
    label: "Agent Readiness",
    value: "76%",
    trendValue: "5%",
    trendSuffix: "vs last 7 days",
    trendIcon: "up",
    icon: Zap,
    color: "text-purple-500",
    sparkline: "M 0 18 Q 20 18 30 14 T 60 16 T 90 10 L 100 12",
    sparklineColor: "stroke-purple-400",
    trendColor: "text-emerald-500"
  },
  {
    label: "Mistakes Avoided",
    value: "12",
    trendValue: "3",
    trendSuffix: "vs last 7 days",
    trendIcon: "up",
    icon: ShieldCheck,
    color: "text-emerald-500",
    sparkline: "M 0 18 Q 50 17 80 12 L 100 12",
    sparklineColor: "stroke-emerald-400",
    trendColor: "text-emerald-500"
  },
];

const performanceData = [
  { name: "May 23", packages: 40, runs: 60, outcome: 20 },
  { name: "May 24", packages: 60, runs: 100, outcome: 40 },
  { name: "May 25", packages: 50, runs: 130, outcome: 30 },
  { name: "May 26", packages: 80, runs: 90, outcome: 50 },
  { name: "May 27", packages: 70, runs: 110, outcome: 40 },
  { name: "May 28", packages: 90, runs: 85, outcome: 60 },
  { name: "May 29", packages: 80, runs: 120, outcome: 50 },
];

const learningTrendData = [
  { name: "May 23", value: 45 },
  { name: "May 24", value: 75 },
  { name: "May 25", value: 50 },
  { name: "May 26", value: 65 },
  { name: "May 27", value: 55 },
  { name: "May 28", value: 85 },
  { name: "May 29", value: 68 },
];

const needsAttention = [
  { id: 1, title: "High-risk auth fix awaiting approval", desc: "Affects auth/token refresh flow", icon: ShieldCheck, severity: "High", action: "Approve" },
  { id: 2, title: "Low-confidence memory conflict", desc: "Conflicting guidance in 2 sources", icon: CheckCircle2, severity: "Medium", action: "Review" },
  { id: 3, title: "Missing required billing test", desc: "Required test not found in package", icon: FileText, severity: "Medium", action: "Resolve" },
  { id: 4, title: "Stale infrastructure decision", desc: "Infra decision is 30+ days old", icon: FileText, severity: "Low", action: "Review" },
];

const sources = [
  { name: "GitHub", count: "1,248 items", status: "online", si: siGithub, color: "text-[#181717]" },
  { name: "Slack", count: "892 items", status: "online", connectorId: "slack" },
  { name: "Linear", count: "612 items", status: "online", si: siLinear, color: "text-[#5E6AD2]" },
  { name: "Jira", count: "631 items", status: "online", si: siJira, color: "text-[#0052CC]" },
  { name: "Notion", count: "512 items", status: "online", si: siNotion, color: "text-black" },
  { name: "Sentry", count: "403 items", status: "online", si: siSentry, color: "text-[#362D59]" },
  { name: "AWS", count: "287 items", status: "online", connectorId: "aws" },
  { name: "Vercel", count: "221 items", status: "online", si: siVercel, color: "text-black" },
  { name: "Zendesk", count: "184 items", status: "online", si: siZendesk, color: "text-[#03363D]" },
  { name: "Email", count: "156 items", status: "online", lucide: Mail, color: "text-[#2563EB]" },
  { name: "IDE Chats", count: "129 items", status: "online", si: siTwitch, color: "text-[#9146FF]" },
];

const recentRuns = [
  { id: 1, agent: "Codex", task: "Fix auth token refre...", status: "Running", risk: "High", memory: 132, tests: "6 / 8", outcome: "IN PROGRESS", statusColor: "text-blue-600", dotColor: "bg-blue-600" },
  { id: 2, agent: "Cursor", task: "Add billing guardrails", status: "Completed", risk: "Medium", memory: 98, tests: "10 /\n10", outcome: "PASSED", statusColor: "text-green-600", dotColor: "bg-green-600" },
  { id: 3, agent: "Claude", task: "Refactor session st...", status: "Completed", risk: "Low", memory: 76, tests: "7 / 7", outcome: "PASSED", statusColor: "text-green-600", dotColor: "bg-green-600" },
  { id: 4, agent: "Internal Agent", task: "Update IAM policy", status: "Approval Needed", risk: "High", memory: 54, tests: "3 / 5", outcome: "BLOCKED", statusColor: "text-amber-500", dotColor: "bg-amber-500" },
  { id: 5, agent: "OpenClav Adapter", task: "Infra drift detection", status: "Learning Created", risk: "Low", memory: 41, tests: "5 / 5", outcome: "INSTRUCTION\nCREATED", statusColor: "text-purple-600", dotColor: "bg-purple-600" },
];

const mistakes = [
  { id: 1, title: "Refresh-token bug", desc: "• required auth tests added\nProtected future runs", icon: Lock, iconBg: "bg-blue-50/50", iconColor: "text-blue-500", border: "border-blue-100/50" },
  { id: 2, title: "Billing rollback mistake", desc: "• approval rule created\nProtected future runs", icon: CircleDollarSign, iconBg: "bg-green-50/50", iconColor: "text-green-600", border: "border-green-100/50" },
  { id: 3, title: "Missing env secret", desc: "• deployment checklist updated\nProtected future runs", icon: Key, iconBg: "bg-purple-50/50", iconColor: "text-purple-500", border: "border-purple-100/50" },
];

export function OverviewSection(props: any) {
  return (
    <div className="h-full overflow-y-auto bg-white text-[#111827] px-8 py-8 relative">
      <style dangerouslySetInnerHTML={{
        __html: `
        [data-console-header-chrome] { display: none !important; }
        header.relative.z-\\[90\\] { display: none !important; }
      `}} />

      <div className="max-w-[1440px] mx-auto space-y-6 pb-12">

        {/* Exact Header Section from image */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex flex-col">
            <h1 className="text-[28px] font-bold tracking-tight text-slate-900 mb-1">Agent Inheritance Command Center</h1>
            <p className="text-[14px] text-slate-500 font-medium">Monitor inheritance health, agent performance, and system readiness.</p>
          </div>

          <div className="flex items-center gap-6 mt-1">
            {/* Search */}
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

            {/* Bell & Avatar */}
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

        {/* 1. KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, i) => (
            <div key={i} className="rounded-[20px] bg-[#E2E4E9] flex flex-col h-[180px] border border-black/5 relative hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
              {/* White card (Top part) */}
              <div className="bg-white rounded-[20px] shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-black/[0.04] p-5 relative z-10 flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-2 mb-2 z-10 relative">
                  <metric.icon className={cn("size-4", metric.color)} strokeWidth={2.5} />
                  <span className="text-[13px] font-bold text-slate-700">{metric.label}</span>
                </div>

                {/* Value */}
                <div className="text-[40px] font-black text-slate-900 tracking-tighter leading-none mt-1 z-10 relative">
                  {metric.value}
                </div>

                {/* Sparkline */}
                <div className="absolute bottom-5 left-5 right-5 h-8 pointer-events-none">
                  <svg viewBox="0 0 100 24" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <path d={metric.sparkline} fill="none" className={metric.sparklineColor} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {/* Grey Footer (Bottom part) */}
              <div className="h-10 shrink-0 flex items-center justify-center px-4 rounded-b-[20px] relative z-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white text-[11px] font-bold text-slate-500">
                  <span className={cn("flex items-center", metric.trendColor)}>
                    {metric.trendIcon === "up" ? "↑" : "↓"} {metric.trendValue}
                  </span>
                  <span>{metric.trendSuffix}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Live Proof Chain & Needs Attention */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">

          {/* Live Proof Chain */}
          <div className="bg-white border border-slate-200 rounded-[14px] p-6 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <h2 className="text-[15px] font-bold text-slate-900">Live Proof Chain</h2>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-100">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  All systems operational
                </span>
              </div>
              <button className="text-[13px] text-amber-600 font-bold hover:text-amber-700 flex items-center gap-1.5">
                View full chain <ArrowRight className="size-4" strokeWidth={2.5} />
              </button>
            </div>

            <div className="flex-1 flex items-center justify-between px-2 pb-4 overflow-x-auto min-w-[650px]">
              {[
                { label: "Source", sub: "Imported", icon: Share2, color: "text-amber-500", badge: "text-emerald-700 bg-emerald-50 border-emerald-100" },
                { label: "Memory", sub: "Structured", icon: Database, color: "text-amber-500", badge: "text-emerald-700 bg-emerald-50 border-emerald-100" },
                { label: "Package", sub: "Generated", icon: Package, color: "text-amber-500", badge: "text-amber-700 bg-amber-50 border-amber-100" },
                { label: "Agent Run", sub: "Completed", icon: Play, color: "text-amber-500", badge: "text-emerald-700 bg-emerald-50 border-emerald-100" },
                { label: "Outcome", sub: "Captured", icon: CheckCircle2, color: "text-amber-500", badge: "text-amber-700 bg-amber-50 border-amber-100" },
                { label: "Future Instruction", sub: "Ready", icon: FileText, color: "text-amber-500", badge: "text-emerald-700 bg-emerald-50 border-emerald-100" },
              ].map((step, i, arr) => (
                <div key={i} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className="size-[52px] rounded-full border border-slate-100 flex items-center justify-center mb-3 shadow-sm bg-white relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent rounded-full" />
                      <step.icon className={cn("size-6 relative z-10", step.color)} strokeWidth={1.5} />
                    </div>
                    <span className="text-[13px] font-bold text-slate-900">{step.label}</span>
                    <span className={cn("text-[10px] mt-1.5 px-2 py-0.5 rounded border font-bold uppercase tracking-wide", step.badge)}>
                      {step.sub}
                    </span>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="flex items-center mx-3 lg:mx-5 relative -top-6 text-slate-300">
                      <ArrowRight className="size-5" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Needs Human Attention */}
          <div className="bg-white border border-slate-200 rounded-[14px] p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[15px] font-bold text-slate-900">Needs Human Attention</h2>
              <button className="text-[13px] text-amber-600 font-bold hover:text-amber-700">View all</button>
            </div>
            <div className="space-y-4">
              {needsAttention.map((item) => (
                <div key={item.id} className="flex gap-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="mt-0.5"><item.icon className="size-[18px] text-slate-700" strokeWidth={2} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-slate-900 truncate">{item.title}</p>
                    <p className="text-[12px] text-slate-500 truncate mt-0.5">{item.desc}</p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full",
                      item.severity === "High" ? "text-red-500 bg-red-50" :
                        item.severity === "Medium" ? "text-amber-500 bg-amber-50" : "text-green-500 bg-green-50"
                    )}>{item.severity}</span>
                    <button className={cn(
                      "text-[11px] font-bold px-3 py-1 border rounded bg-white hover:bg-slate-50 transition-colors shadow-sm",
                      item.severity === "High" ? "border-slate-200 text-red-600" :
                        item.severity === "Medium" ? "border-slate-200 text-amber-600" : "border-slate-200 text-green-600"
                    )}>
                      {item.action}
                    </button>
                    <MoreVertical className="size-4 text-slate-400 cursor-pointer hover:text-slate-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="rounded-[20px] bg-[#E2E4E9] flex flex-col border border-black/5 relative transition-all duration-300 h-full">
            <div className="h-14 shrink-0 flex items-center justify-between px-6 rounded-t-[20px] relative z-0">
              <h2 className="text-[15px] font-bold text-slate-900">Inheritance Performance</h2>
              <button className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded px-2.5 py-1.5 flex items-center gap-1 hover:bg-slate-50 transition-colors shadow-sm">
                Last 7 days <ChevronDown className="size-3.5 text-slate-400" strokeWidth={2.5} />
              </button>
            </div>
            <div className="bg-white rounded-[20px] shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-black/[0.04] p-6 pt-4 relative z-10 flex-1 flex flex-col overflow-hidden">
              <div className="flex flex-wrap gap-5 mb-6 text-[12px] font-semibold text-slate-500">
                <span className="flex items-center gap-2"><span className="size-2 rounded-sm bg-[#FCD34D]" /> Inheritance Packages</span>
                <span className="flex items-center gap-2"><span className="size-2 rounded-sm bg-[#F59E0B]" /> Agent Runs</span>
                <span className="flex items-center gap-2"><span className="size-2 rounded-sm bg-[#CBD5E1]" /> Outcome Learning</span>
              </div>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="0" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} ticks={[0, 50, 100, 150]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="runs" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 3.5, fill: '#F59E0B', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="packages" stroke="#FCD34D" strokeWidth={2.5} dot={{ r: 3.5, fill: '#FCD34D', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="outcome" stroke="#CBD5E1" strokeWidth={2.5} dot={{ r: 3.5, fill: '#CBD5E1', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="rounded-[20px] bg-[#E2E4E9] flex flex-col border border-black/5 relative transition-all duration-300 h-full">
            <div className="h-14 shrink-0 flex items-center justify-between px-6 rounded-t-[20px] relative z-0">
              <h2 className="text-[15px] font-bold text-slate-900">Outcome Learning Trend</h2>
              <button className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded px-2.5 py-1.5 flex items-center gap-1 hover:bg-slate-50 transition-colors shadow-sm">
                Last 7 days <ChevronDown className="size-3.5 text-slate-400" strokeWidth={2.5} />
              </button>
            </div>
            <div className="bg-white rounded-[20px] shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-black/[0.04] p-6 pt-4 relative z-10 flex-1 flex flex-col overflow-hidden">
              <div className="flex h-[240px]">
                <div className="flex-1 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={learningTrendData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="0" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} tickFormatter={(val) => `${val}%`} ticks={[0, 25, 50, 75, 100]} />
                      <Tooltip />
                      <Area type="monotone" dataKey="value" stroke="#F59E0B" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2.5} dot={{ r: 3.5, fill: '#F59E0B', strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-36 pl-6 flex flex-col justify-center border-l border-slate-100 ml-4">
                  <p className="text-[13px] text-slate-700 font-bold mb-2">Learning Rate</p>
                  <p className="text-[42px] font-bold text-slate-900 mb-2 tracking-tight leading-none">68%</p>
                  <p className="text-[12px] text-green-600 font-bold flex flex-col gap-0.5 mt-2">
                    <span className="flex items-center gap-1">↑ 6%</span>
                    <span className="text-[10px] text-slate-400 font-medium">vs last 7 days</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Company Brain Sources */}
        <div className="rounded-[20px] bg-[#E2E4E9] flex flex-col border border-black/5 relative transition-all duration-300">
          <div className="h-14 shrink-0 flex items-center justify-between px-6 rounded-t-[20px] relative z-0">
            <h2 className="text-[15px] font-bold text-slate-900">Company Brain Sources</h2>
            <div className="flex items-center gap-3">
              <button className="size-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors text-lg leading-none pb-0.5">+</button>
              <button className="text-[13px] text-slate-500 font-bold hover:text-slate-700">View all sources</button>
            </div>
          </div>
          <div className="bg-white rounded-[20px] shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-black/[0.04] p-6 relative z-10 flex-1 flex flex-col overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {sources.map((source, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 border border-slate-100 rounded-xl hover:border-slate-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex items-center justify-center shrink-0">
                      {source.connectorId ? (
                        <ConnectorBrandIcon id={source.connectorId} className="size-6" />
                      ) : source.si ? (
                        <SimpleIcon icon={source.si} className={cn("size-6", source.color)} />
                      ) : (
                        source.lucide && <source.lucide className={cn("size-6", source.color)} strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-slate-900 truncate leading-tight">{source.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5 leading-tight">{source.count}</p>
                    </div>
                  </div>
                  <div className={cn("size-[6px] rounded-full shrink-0 ml-2", source.status === "online" ? "bg-green-500" : "bg-slate-300")} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_350px] gap-6">

          {/* Recent Agent Runs */}
          <div className="rounded-[20px] bg-[#E2E4E9] flex flex-col border border-black/5 relative transition-all duration-300 h-full">
            <div className="h-16 shrink-0 flex items-center justify-between px-8 rounded-t-[20px] relative z-0">
              <h2 className="text-lg font-bold text-slate-900">Recent Agent Runs</h2>
              <button className="text-[13px] text-slate-500 font-bold hover:text-slate-700">View all runs</button>
            </div>
            <div className="bg-white rounded-[20px] shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-black/[0.04] p-8 pt-4 relative z-10 flex-1 flex flex-col overflow-hidden">
            <div className="overflow-x-auto -mx-8 flex-1">
              <table className="w-full text-left text-[13px] min-w-[700px]">
                <thead className="text-slate-500 border-b border-slate-100 bg-white">
                  <tr>
                    <th className="font-bold px-8 py-3">Agent</th>
                    <th className="font-bold px-8 py-3">Task</th>
                    <th className="font-bold px-8 py-3">Status</th>
                    <th className="font-bold px-8 py-3 text-center">Risk</th>
                    <th className="font-bold px-8 py-3 text-right">
                      <div className="flex flex-col items-end leading-tight">
                        <span>Memory</span>
                        <span>Used</span>
                      </div>
                    </th>
                    <th className="font-bold px-8 py-3 text-center">Tests</th>
                    <th className="font-bold px-8 py-3">Outcome</th>
                    <th className="font-bold px-8 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentRuns.map((run) => (
                    <tr key={run.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-4 font-bold text-slate-900 flex items-center gap-3">
                        {run.agent === "Codex" && (
                          <div className="size-7 rounded-full bg-[#0F172A] flex items-center justify-center text-white">
                            <svg viewBox="0 0 24 24" className="size-[14px]" fill="currentColor">
                              <path d={CATALOG_BRAND_PATHS.openai.d} />
                            </svg>
                          </div>
                        )}
                        {run.agent === "Cursor" && (
                          <div className="size-7 rounded-sm bg-[#0F172A] flex items-center justify-center text-white">
                            <SimpleIcon icon={siCursor} className="size-4 text-white" />
                          </div>
                        )}
                        {run.agent === "Claude" && (
                          <div className="size-7 rounded-full bg-[#D97706] flex items-center justify-center text-white">
                            <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor">
                              <path d={CATALOG_BRAND_PATHS.anthropic.d} />
                            </svg>
                          </div>
                        )}
                        {run.agent === "Internal Agent" && (
                          <div className="size-7 rounded-full bg-[#EEF2FF] flex items-center justify-center text-blue-600">
                            <ShieldCheck className="size-4" strokeWidth={2.5} />
                          </div>
                        )}
                        {run.agent === "OpenClav Adapter" && (
                          <div className="size-7 rounded-md bg-[#050810] flex items-center justify-center">
                            <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="size-5">
                              <defs>
                                <linearGradient id="lobster-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#ff4d4d" />
                                  <stop offset="100%" stopColor="#991b1b" />
                                </linearGradient>
                              </defs>
                              <path d="M60 10 C30 10 15 35 15 55 C15 75 30 95 45 100 L45 110 L55 110 L55 100 C55 100 60 102 65 100 L65 110 L75 110 L75 100 C90 95 105 75 105 55 C105 35 90 10 60 10Z" fill="url(#lobster-gradient)" />
                              <path d="M20 45 C5 40 0 50 5 60 C10 70 20 65 25 55 C28 48 25 45 20 45Z" fill="url(#lobster-gradient)" />
                              <path d="M100 45 C115 40 120 50 115 60 C110 70 100 65 95 55 C92 48 95 45 100 45Z" fill="url(#lobster-gradient)" />
                              <path d="M45 15 Q35 5 30 8" stroke="#ff4d4d" strokeWidth="3" strokeLinecap="round" />
                              <path d="M75 15 Q85 5 90 8" stroke="#ff4d4d" strokeWidth="3" strokeLinecap="round" />
                              <circle cx="45" cy="35" r="6" fill="#050810" />
                              <circle cx="75" cy="35" r="6" fill="#050810" />
                              <circle cx="46" cy="34" r="2.5" fill="#00e5cc" />
                              <circle cx="76" cy="34" r="2.5" fill="#00e5cc" />
                            </svg>
                          </div>
                        )}
                        <span className="text-[13px] ml-1">{run.agent}</span>
                      </td>
                      <td className="px-8 py-4 text-slate-700 font-semibold truncate max-w-[180px]" title={run.task}>{run.task}</td>
                      <td className="px-8 py-4">
                        <span className="flex items-center gap-2 font-bold text-[12px]">
                          <span className={cn("size-1.5 rounded-full", run.dotColor)} />
                          <span className={run.statusColor} dangerouslySetInnerHTML={{ __html: run.status.replace(" ", "<br/>") }} />
                        </span>
                      </td>
                      <td className="px-8 py-4 text-center">
                        <span className={cn("px-2.5 py-1 rounded font-bold text-[10px] uppercase tracking-wide",
                          run.risk === "High" ? "bg-red-50 text-red-600" :
                            run.risk === "Medium" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600")}>
                          {run.risk}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-right text-slate-700 font-bold">{run.memory}</td>
                      <td className="px-8 py-4 text-center text-slate-700 font-bold whitespace-pre-line leading-tight">{run.tests}</td>
                      <td className="px-8 py-4">
                        <span className={cn("px-2.5 py-1 rounded font-bold text-[9px] uppercase tracking-wide whitespace-pre-line text-center inline-block leading-tight",
                          run.outcome === "IN PROGRESS" ? "bg-blue-50 text-blue-600" :
                            run.outcome === "PASSED" ? "bg-emerald-50 text-emerald-600" :
                              run.outcome === "BLOCKED" ? "bg-red-50 text-red-600" : "bg-purple-50 text-purple-600")}>
                          {run.outcome}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button className="flex items-center justify-center size-6 border border-slate-200 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                            <FileText className="size-3.5" strokeWidth={2.5} />
                          </button>
                          <button className="text-slate-400 hover:text-slate-600 transition-colors"><MoreVertical className="size-[18px]" strokeWidth={2.5} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        {/* Mistake Immunity */}
          <div className="rounded-[20px] bg-[#E2E4E9] flex flex-col border border-black/5 relative transition-all duration-300 h-full">
            <div className="h-14 shrink-0 flex items-center justify-between px-6 rounded-t-[20px] relative z-0">
              <h2 className="text-[15px] font-bold text-slate-900">Mistake Immunity</h2>
              <button className="text-[13px] text-slate-500 font-bold hover:text-slate-700">View all</button>
            </div>
            <div className="bg-white rounded-[20px] shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-black/[0.04] p-6 pt-4 relative z-10 flex-1 flex flex-col overflow-hidden">
              <div className="space-y-6">
                {mistakes.map((mistake) => (
                  <div key={mistake.id} className="flex gap-4 pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className={cn("size-10 rounded-[12px] flex items-center justify-center shrink-0 border", mistake.iconBg, mistake.border)}>
                      <mistake.icon className={cn("size-[18px]", mistake.iconColor)} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-[13px] font-bold text-slate-900 truncate">{mistake.title}</p>
                      <p className="text-[12px] text-slate-500 whitespace-pre-line mt-1.5 font-medium leading-relaxed">{mistake.desc}</p>
                    </div>
                    <div className="shrink-0 flex items-center justify-center pl-2">
                      <ShieldCheck className="size-6 text-emerald-500" fill="#10B981" stroke="white" strokeWidth={2} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}



