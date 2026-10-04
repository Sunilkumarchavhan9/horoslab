"use client";

import { useState } from "react";
import {
  Search,
  Bell,
  Filter,
  Shield,
  FileText,
  UserX,
  Wrench,
  ArrowRightLeft,
  Lock,
  Globe,
  AlertTriangle,
  Hexagon,
  ShieldCheck,
  MoreHorizontal,
  X,
  CheckCircle2,
  File,
  ArrowRight,
  TrendingUp,
  Settings,
  ChevronDown,
  Info,
  Sparkles,
  Play
} from "lucide-react";
import { ConsolePage } from "@/components/hemera/console-ui";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from "recharts";

// --- Mock Data ---

const KPI_DATA = [
  { label: "Outcomes Captured", value: "1,248", icon: Shield, iconColor: "text-purple-500", trendIcon: "up", trendValue: "8%", trendColor: "text-emerald-500", sparklineData: [40, 45, 55, 50, 60, 65, 70], sparklineColor: "#A855F7" },
  { label: "Experience Records", value: "932", icon: FileText, iconColor: "text-blue-500", trendIcon: "up", trendValue: "7%", trendColor: "text-emerald-500", sparklineData: [50, 52, 58, 55, 60, 62, 65], sparklineColor: "#3B82F6" },
  { label: "Human Corrections", value: "312", icon: UserX, iconColor: "text-orange-500", trendIcon: "down", trendValue: "6%", trendColor: "text-red-500", sparklineData: [30, 25, 28, 22, 20, 15, 12], sparklineColor: "#F97316" },
  { label: "Lessons Created", value: "418", icon: Wrench, iconColor: "text-emerald-500", trendIcon: "up", trendValue: "11%", trendColor: "text-emerald-500", sparklineData: [20, 25, 30, 35, 45, 50, 60], sparklineColor: "#10B981" },
  { label: "Skill Candidates", value: "34", icon: ArrowRightLeft, iconColor: "text-amber-500", trendIcon: "up", trendValue: "9%", trendColor: "text-emerald-500", sparklineData: [5, 8, 12, 10, 15, 18, 20], sparklineColor: "#F59E0B" },
];

const OUTCOMES_DATA = [
  { id: "#O-2025-05-29-001", problem: "Auth token refresh bug", icon: Lock, iconColor: "text-red-500", agent: "Internal Agent", action: "Refresh token", mistake: "Expired token not handled correctly", fix: "Added proactive refresh & retry logic", outcome: "Completed", lesson: "L-128", instruction: "FI-332", time: "2h ago" },
  { id: "#O-2025-05-29-002", problem: "Billing duplicate charge", icon: Globe, iconColor: "text-blue-500", agent: "Billing Agent", action: "Create charge", mistake: "Idempotency key not enforced", fix: "Enforced idempotency on create", outcome: "Completed", lesson: "L-127", instruction: "FI-331", time: "18h ago" },
  { id: "#O-2025-05-29-003", problem: "Report data mismatch", icon: AlertTriangle, iconColor: "text-orange-500", agent: "Analytics Agent", action: "Generate report", mistake: "Timezone offset ignored", fix: "Normalize timezone before query", outcome: "Completed", lesson: "L-126", instruction: "FI-330", time: "1d ago" },
  { id: "#O-2025-05-29-004", problem: "Package version conflict", icon: Hexagon, iconColor: "text-purple-500", agent: "Release Agent", action: "Install package", mistake: "Peer dependency conflict", fix: "Pinned compatible version range", outcome: "Completed", lesson: "L-125", instruction: "FI-329", time: "1d ago" },
  { id: "#O-2025-05-29-005", problem: "Infra deploy timeout", icon: ShieldCheck, iconColor: "text-emerald-500", agent: "Ops Agent", action: "Deploy service", mistake: "Readiness probe too aggressive", fix: "Adjusted probe & added warmup", outcome: "Completed", lesson: "L-124", instruction: "FI-328", time: "2d ago" },
];

const TABS = ["Outcomes", "Experience Records", "Human Corrections", "Future Instructions", "Mistakes Avoided", "Lessons", "Skill Candidates"];

const TREND_DATA = [
  { name: 'May 23', value: 40 },
  { name: 'May 24', value: 75 },
  { name: 'May 25', value: 55 },
  { name: 'May 26', value: 85 },
  { name: 'May 27', value: 65 },
  { name: 'May 28', value: 90 },
  { name: 'May 29', value: 80 },
];

const COMMON_LESSONS = [
  { title: "Proactively refresh tokens and handle 401 with retry.", icon: Lock, color: "text-blue-500", bg: "bg-blue-50", count: 18 },
  { title: "Enforce idempotency on all create/payment operations.", icon: Globe, color: "text-emerald-500", bg: "bg-emerald-50", count: 14 },
  { title: "Normalize timezones before data computations.", icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-50", count: 11 },
  { title: "Validate external dependencies before execution.", icon: ShieldCheck, color: "text-amber-500", bg: "bg-amber-50", count: 9 },
  { title: "Use exponential backoff for transient failures.", icon: Hexagon, color: "text-purple-500", bg: "bg-purple-50", count: 8 },
];

// --- Sub-components ---

function SimpleSparkline({ data, color }: { data: number[], color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((val - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 -10 100 120" className="w-full h-full preserve-3d" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ExperienceSection() {
  const [activeTab, setActiveTab] = useState("Outcomes");
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string | null>(OUTCOMES_DATA[0].id);

  return (
    <ConsolePage className="w-full max-w-none bg-[#FAFAFA] h-full overflow-y-auto memoryos-console-scroll pb-12">
      <div className="max-w-[1600px] mx-auto p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[26px] font-black text-slate-900 tracking-tight">Experience</h1>
            <p className="text-[14px] text-slate-500 mt-1 font-medium">Turn outcomes into reusable experience, lessons, and future-agent instructions.</p>
          </div>
          <div className="flex items-center gap-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input type="text" placeholder="Search anything..." className="h-10 pl-9 pr-10 border border-slate-200 rounded-full text-[13px] w-[280px] bg-white focus:outline-none focus:border-amber-500 shadow-sm transition-all" />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 bg-slate-100 rounded text-[10px] text-slate-500 font-medium border border-slate-200">⌘K</div>
            </div>
            <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <Bell className="size-5" />
              <span className="absolute top-1 right-1 bg-amber-500 text-[#C8C7BA] text-[9px] size-3.5 rounded-full flex items-center justify-center font-medium ring-2 ring-[#FAFAFA]">3</span>
            </button>
            <div className="size-9 rounded-full bg-slate-100 flex items-center justify-center text-[12px] font-medium text-slate-700 border border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors">
              KS
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-5 gap-5 mb-8">
          {KPI_DATA.map((kpi, i) => (
            <div key={i} className="bg-white rounded-[16px] shadow-sm border border-slate-200 p-5 relative overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-3 z-10 relative">
                <div className={`p-1.5 rounded-lg bg-slate-50 border border-slate-100`}>
                  <kpi.icon className={`size-4 ${kpi.iconColor}`} />
                </div>
                <span className="text-[13px] font-medium text-slate-700">{kpi.label}</span>
              </div>
              <div className="flex flex-col z-10 relative">
                <div className="text-[32px] font-black text-slate-900 tracking-tighter leading-none mb-1">
                  {kpi.value}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                  <span className={`flex items-center ${kpi.trendColor}`}>
                    {kpi.trendIcon === "up" ? "↑" : "↓"} {kpi.trendValue}
                  </span>
                  <span>vs last 7 days</span>
                </div>
              </div>
              <div className="absolute bottom-4 left-5 right-5 h-8 pointer-events-none z-0 opacity-40">
                <SimpleSparkline data={kpi.sparklineData} color={kpi.sparklineColor} />
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-8 border-b border-slate-200 mb-6 px-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-[13px] font-medium pb-4 border-b-2 transition-colors ${activeTab === tab ? 'border-amber-500 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Filters Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button className="flex items-center justify-between w-[140px] px-3 py-2 bg-white border border-slate-200 rounded-[8px] text-[12px] font-medium text-slate-700 hover:bg-slate-50">
              All Outcomes <ChevronDown className="size-3.5 text-slate-400" />
            </button>
            <button className="flex items-center justify-between w-[140px] px-3 py-2 bg-white border border-slate-200 rounded-[8px] text-[12px] font-medium text-slate-700 hover:bg-slate-50">
              All Agents <ChevronDown className="size-3.5 text-slate-400" />
            </button>
            <button className="flex items-center justify-between w-[160px] px-3 py-2 bg-white border border-slate-200 rounded-[8px] text-[12px] font-medium text-slate-700 hover:bg-slate-50">
              May 23 - May 29 <ChevronDown className="size-3.5 text-slate-400" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
              <input type="text" placeholder="Search outcomes..." className="h-9 pl-9 pr-4 border border-slate-200 rounded-[8px] text-[12px] w-[200px] bg-white focus:outline-none focus:border-amber-500" />
            </div>
            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-[8px] text-[12px] font-medium text-slate-700 hover:bg-slate-50">
              <Filter className="size-3.5" /> Filters <ChevronDown className="size-3.5 text-slate-400 ml-1" />
            </button>
          </div>
        </div>

        {/* Outcomes Table */}
        <div className="bg-white rounded-[16px] border border-slate-200 shadow-sm overflow-hidden mb-6">
          <table className="w-full text-left">
            <thead className="bg-[#FAFAFA] border-b border-slate-100">
              <tr>
                <th className="w-10 px-4 py-3"><input type="checkbox" className="rounded border-slate-300" /></th>
                <th className="px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Problem</th>
                <th className="px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Context</th>
                <th className="px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Action</th>
                <th className="px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Mistake</th>
                <th className="px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Fix</th>
                <th className="px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Outcome</th>
                <th className="px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Lesson</th>
                <th className="px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Future Instruction</th>
                <th className="px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Proof</th>
                <th className="px-4 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wider">Time</th>
                <th className="w-10 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {OUTCOMES_DATA.map((row) => {
                const isSelected = selectedOutcomeId === row.id;
                return (
                  <tr
                    key={row.id}
                    className={`group cursor-pointer transition-colors ${isSelected ? 'bg-amber-50/50' : 'hover:bg-slate-50'}`}
                    onClick={() => setSelectedOutcomeId(row.id)}
                  >
                    <td className="px-4 py-4">
                      <input type="checkbox" checked={isSelected} readOnly className="rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <row.icon className={`size-4 ${row.iconColor}`} />
                        <span className="text-[13px] font-medium text-slate-900">{row.problem}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[13px] font-medium text-slate-700">{row.agent}</td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 rounded-full text-[12px] font-medium text-slate-700 border border-slate-200/60">{row.action}</span>
                    </td>
                    <td className="px-4 py-4 text-[13px] font-medium text-slate-600">{row.mistake}</td>
                    <td className="px-4 py-4 text-[13px] font-medium text-slate-600">{row.fix}</td>
                    <td className="px-4 py-4">
                      <span className="text-[12px] font-medium text-emerald-600">{row.outcome}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-[6px] text-[11px] font-medium">{row.lesson}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-[6px] text-[11px] font-medium">{row.instruction}</span>
                    </td>
                    <td className="px-4 py-4 text-slate-400">
                      <File className="size-4" />
                    </td>
                    <td className="px-4 py-4 text-[12px] font-medium text-slate-500">{row.time}</td>
                    <td className="px-4 py-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1 hover:bg-slate-200 rounded"><MoreHorizontal className="size-4" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Outcome Expanded Panel */}
        {selectedOutcomeId && (
          <div className="bg-[#FFFDF5] border border-amber-200/60 rounded-[16px] p-6 mb-8 shadow-[0_4px_24px_rgba(251,191,36,0.08)] relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-amber-500" />
                <h3 className="text-[14px] font-medium text-slate-900">Selected Outcome</h3>
                <span className="text-[12px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 ml-2">#O-2025-05-29-001</span>
              </div>
              <button className="flex items-center gap-1.5 text-[12px] font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-[8px]" onClick={() => setSelectedOutcomeId(null)}>
                Close <X className="size-3.5" />
              </button>
            </div>

            {/* Flow Diagram */}
            <div className="flex items-start gap-3 mb-8 overflow-x-auto pb-4 custom-scrollbar">

              {/* Problem */}
              <div className="flex flex-col w-[160px] shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="size-4 text-red-500" />
                  <span className="text-[12px] font-medium text-slate-900 uppercase tracking-wider">Problem</span>
                </div>
                <div className="text-[13px] font-medium text-slate-900 mb-1">Auth token refresh bug</div>
                <div className="text-[12px] font-medium text-slate-500">Expired tokens caused intermittent 401 errors.</div>
              </div>

              <div className="pt-2 shrink-0"><ArrowRight className="size-4 text-slate-300" /></div>

              {/* Context */}
              <div className="flex flex-col w-[160px] shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="size-4 text-purple-500" />
                  <span className="text-[12px] font-medium text-slate-900 uppercase tracking-wider">Context</span>
                </div>
                <div className="text-[13px] font-medium text-slate-900 mb-1">Internal Agent</div>
                <div className="text-[12px] font-medium text-slate-500">Service-to-service calls using short-lived tokens.</div>
              </div>

              <div className="pt-2 shrink-0"><ArrowRight className="size-4 text-slate-300" /></div>

              {/* Action */}
              <div className="flex flex-col w-[160px] shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <Play className="size-4 text-blue-500" />
                  <span className="text-[12px] font-medium text-slate-900 uppercase tracking-wider">Action</span>
                </div>
                <div className="text-[13px] font-medium text-slate-900 mb-1">Refresh token</div>
                <div className="text-[12px] font-medium text-slate-500">Agent attempted call with existing token.</div>
              </div>

              <div className="pt-2 shrink-0"><ArrowRight className="size-4 text-amber-500" /></div>

              {/* Mistake */}
              <div className="flex flex-col w-[160px] shrink-0 bg-white p-3 rounded-[12px] border border-amber-200 shadow-sm relative -top-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="size-4 text-amber-500" />
                  <span className="text-[12px] font-medium text-amber-700 uppercase tracking-wider">Mistake</span>
                </div>
                <div className="text-[13px] font-medium text-slate-900 mb-1">Expired token not handled correctly</div>
                <div className="text-[12px] font-medium text-slate-600">No retry logic on 401.</div>
              </div>

              <div className="pt-2 shrink-0"><ArrowRight className="size-4 text-emerald-500" /></div>

              {/* Fix */}
              <div className="flex flex-col w-[170px] shrink-0 bg-white p-3 rounded-[12px] border border-emerald-200 shadow-sm relative -top-3">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="size-4 text-emerald-500" />
                  <span className="text-[12px] font-medium text-emerald-700 uppercase tracking-wider">Fix</span>
                </div>
                <div className="text-[13px] font-medium text-slate-900 mb-1">Added proactive refresh & retry logic</div>
                <div className="text-[12px] font-medium text-slate-600">Refresh before expiry + retry with backoff.</div>
              </div>

              <div className="pt-2 shrink-0"><ArrowRight className="size-4 text-slate-300" /></div>

              {/* Outcome */}
              <div className="flex flex-col w-[140px] shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <span className="text-[12px] font-medium text-slate-900 uppercase tracking-wider">Outcome</span>
                </div>
                <div className="text-[13px] font-medium text-slate-900 mb-1">Completed</div>
                <div className="text-[12px] font-medium text-slate-500">401 errors eliminated. Success rate improved.</div>
              </div>

              <div className="pt-2 shrink-0"><ArrowRight className="size-4 text-slate-300" /></div>

              {/* Lesson */}
              <div className="flex flex-col w-[140px] shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <Wrench className="size-4 text-purple-500" />
                  <span className="text-[12px] font-medium text-slate-900 uppercase tracking-wider">Lesson</span>
                </div>
                <div className="text-[13px] font-medium text-slate-900 mb-1">L-128</div>
                <div className="text-[12px] font-medium text-slate-500">Proactively refresh tokens and handle 401 with retry.</div>
              </div>

              <div className="pt-2 shrink-0"><ArrowRight className="size-4 text-slate-300" /></div>

              {/* Future Instruction */}
              <div className="flex flex-col w-[160px] shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="size-4 text-blue-500" />
                  <span className="text-[12px] font-medium text-slate-900 uppercase tracking-wider">Future Instruction</span>
                </div>
                <div className="text-[13px] font-medium text-slate-900 mb-1">FI-332</div>
                <div className="text-[12px] font-medium text-slate-500">Always refresh token if &lt; 120s to expiry. Retry on 401 once.</div>
              </div>

              <div className="pt-2 shrink-0"><ArrowRight className="size-4 text-slate-300" /></div>

              {/* Proof */}
              <div className="flex flex-col w-[140px] shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="size-4 text-slate-700" />
                  <span className="text-[12px] font-medium text-slate-900 uppercase tracking-wider">Proof</span>
                </div>
                <div className="text-[13px] font-medium text-slate-900 mb-1">Agent run #7841</div>
                <div className="text-[12px] font-medium text-slate-500">Logs, diff, and validation results.</div>
              </div>

            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-amber-200/60 pt-4">
              <div className="flex items-center gap-6 text-[12px] font-medium text-slate-600">
                <div><span className="text-slate-400 font-medium">Agent:</span> Internal Agent</div>
                <div><span className="text-slate-400 font-medium">Run ID:</span> 7841</div>
                <div><span className="text-slate-400 font-medium">Captured:</span> May 29, 2025 • 10:21 AM</div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-[8px] text-[12px] font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors">
                View full record <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1.5fr] gap-6">

          {/* Outcome Learning Trend */}
          <div className="bg-white rounded-[16px] border border-slate-200 p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-1.5">
                <h3 className="text-[14px] font-medium text-slate-900">Outcome Learning Trend</h3>
                <Info className="size-3.5 text-slate-400" />
              </div>
              <button className="flex items-center gap-1 text-[11px] font-medium text-slate-600 border border-slate-200 rounded px-2 py-1 hover:bg-slate-50">
                Last 7 days <ChevronDown className="size-3" />
              </button>
            </div>

            <div className="flex gap-4 flex-1">
              <div className="flex-1 min-w-0">
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8' }} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                    <Line type="monotone" dataKey="value" stroke="#FBBF24" strokeWidth={2} dot={{ r: 3, fill: "#FBBF24", strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="w-[100px] shrink-0 flex flex-col justify-center items-end border-l border-slate-100 pl-4">
                <div className="text-[11px] font-medium text-slate-500 mb-1 w-full">Learning Rate</div>
                <div className="text-[32px] font-black text-slate-900 leading-none mb-2 w-full">68%</div>
                <div className="flex flex-col w-full">
                  <span className="text-[12px] font-medium text-emerald-500">↑ 6%</span>
                  <span className="text-[10px] text-slate-400">vs last 7 days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Common Lessons */}
          <div className="bg-white rounded-[16px] border border-slate-200 p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[14px] font-medium text-slate-900">Common Lessons</h3>
              <a href="#" className="text-[12px] font-medium text-blue-600 hover:underline">View all</a>
            </div>
            <div className="flex flex-col gap-4 flex-1">
              {COMMON_LESSONS.map((lesson, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-lg ${lesson.bg} shrink-0 mt-0.5`}>
                    <lesson.icon className={`size-3.5 ${lesson.color}`} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-medium text-slate-700 leading-snug">{lesson.title}</span>
                    <span className="text-[11px] font-medium text-slate-400">{lesson.count} occurrences</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transformations */}
          <div className="bg-white rounded-[16px] border border-slate-200 p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[14px] font-medium text-slate-900">Outcome to Future Instruction Transformations</h3>
              <a href="#" className="text-[12px] font-medium text-blue-600 hover:underline">View all</a>
            </div>

            <div className="flex items-center gap-4 flex-1 mb-4">
              {/* Raw */}
              <div className="flex-1 bg-red-50/50 border border-red-100 rounded-[12px] p-4 relative">
                <h4 className="text-[12px] font-medium text-slate-900 mb-3">Raw Outcome (Example)</h4>
                <ul className="flex flex-col gap-2">
                  <li className="flex gap-2 items-start">
                    <div className="size-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                    <span className="text-[12px] font-medium text-slate-700">Expired tokens caused 401 errors.</span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <div className="size-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                    <span className="text-[12px] font-medium text-slate-700">Retry was not attempted.</span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <div className="size-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                    <span className="text-[12px] font-medium text-slate-700">Users saw intermittent failures.</span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <div className="size-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                    <span className="text-[12px] font-medium text-slate-700">Manual re-run fixed the issue.</span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <div className="size-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                    <span className="text-[12px] font-medium text-slate-700">Service stability impacted.</span>
                  </li>
                </ul>
              </div>

              <div className="shrink-0 text-slate-300">
                <ArrowRight className="size-5" />
              </div>

              {/* Processed */}
              <div className="flex-1 bg-blue-50/50 border border-blue-100 rounded-[12px] p-4">
                <h4 className="text-[12px] font-medium text-blue-900 mb-3">Future Instruction (Generated)</h4>
                <ul className="flex flex-col gap-2">
                  <li className="flex gap-2 items-start">
                    <CheckCircle2 className="size-3.5 text-blue-500 mt-0.5 shrink-0" />
                    <span className="text-[12px] font-medium text-slate-800">Always refresh token if &lt; 120s to expiry.</span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <CheckCircle2 className="size-3.5 text-blue-500 mt-0.5 shrink-0" />
                    <span className="text-[12px] font-medium text-slate-800">On 401, retry once after refresh.</span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <CheckCircle2 className="size-3.5 text-blue-500 mt-0.5 shrink-0" />
                    <span className="text-[12px] font-medium text-slate-800">Do not retry non-auth related 401s.</span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <CheckCircle2 className="size-3.5 text-blue-500 mt-0.5 shrink-0" />
                    <span className="text-[12px] font-medium text-slate-800">Log token expiry and retry attempts.</span>
                  </li>
                  <li className="flex gap-2 items-start">
                    <CheckCircle2 className="size-3.5 text-blue-500 mt-0.5 shrink-0" />
                    <span className="text-[12px] font-medium text-blue-700 underline underline-offset-2">Ensure service calls use valid tokens.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-[11px] font-medium text-slate-500">Transformation confidence</span>
              <div className="flex items-center gap-3">
                <div className="w-[120px] h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-300 to-emerald-500 rounded-full" style={{ width: '92%' }}></div>
                </div>
                <span className="text-[12px] font-medium text-emerald-600">92%</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </ConsolePage>
  );
}
