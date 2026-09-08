"use client";

import React, { useState } from "react";
import { 
 BarChart2, 
 TrendingUp,
 DollarSign,
 Activity,
 Zap,
 Target,
 BrainCircuit,
 Bot
} from "lucide-react";
import { 
 AreaChart, Area, 
 BarChart, Bar, 
 LineChart, Line,
 XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";
import { cn } from "@/lib/utils";
import { CommandBar, SectionHeader, KPICard } from "./observe-shared-components";

// --- Mock Data ---
const PERFORMANCE_TRENDS = [
 { name: 'Mon', missions: 4000, automation: 2400, errors: 400 },
 { name: 'Tue', missions: 3000, automation: 1398, errors: 210 },
 { name: 'Wed', missions: 2000, automation: 9800, errors: 229 },
 { name: 'Thu', missions: 2780, automation: 3908, errors: 2000 },
 { name: 'Fri', missions: 1890, automation: 4800, errors: 2181 },
 { name: 'Sat', missions: 2390, automation: 3800, errors: 2500 },
 { name: 'Sun', missions: 3490, automation: 4300, errors: 2100 },
];

const AGENT_UTILIZATION = [
 { name: 'Claude 3.5', usage: 85, cost: 420 },
 { name: 'GPT-4o', usage: 65, cost: 890 },
 { name: 'Gemini 1.5', usage: 45, cost: 210 },
 { name: 'Llama 3', usage: 90, cost: 45 },
];

const HEATMAP_DATA = Array.from({ length: 7 }, (_, day) => 
 Array.from({ length: 24 }, (_, hour) => Math.floor(Math.random() * 100))
);
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function ObserveAnalytics() {
 const [activeTab, setActiveTab] = useState("Overview");

 return (
 <div className="flex flex-col h-full w-full bg-[#FBFBFB] dark:bg-[#030303] text-foreground dark:text-[#F0EFE2] font-sans overflow-hidden">
 <CommandBar>
 <div className="flex items-center gap-2">
 <BarChart2 className="size-4 text-[#0f52ff]" />
 <span className="text-[13px] font-bold tracking-wide">Observe / Analytics</span>
 </div>
 </CommandBar>

 <div className="flex-1 overflow-y-auto custom-scrollbar">
 <div className="p-10 w-full mx-auto flex flex-col gap-10">
 
 <SectionHeader 
 title="Enterprise Analytics Dashboard" 
 description="Business intelligence, automation metrics, and cost analysis across all institutions and agents."
 className="mb-0"
 />

 <div className="grid grid-cols-4 gap-6">
 <KPICard title="Mission Success" value="98.2%" trend="up" trendValue="1.2%" index={0} />
 <KPICard title="Automation %" value="84.5%" trend="up" trendValue="4.5%" index={1} />
 <KPICard title="Compute Cost" value="$12,450" subtext="Month to date" trend="down" trendValue="5%" index={2} />
 <KPICard title="Learning Extracted" value="1,204" subtext="New behaviors" trend="up" trendValue="12%" index={3} />
 </div>

 <div className="grid grid-cols-3 gap-6">
 
 {/* Trend Explorer */}
 <div className="col-span-2 p-6 rounded-3xl bg-card/50 dark:bg-[#121212]/50 border border-border dark:border-white/10 backdrop-blur-md flex flex-col min-h-[400px]">
 <div className="flex items-center justify-between mb-8">
 <div className="flex items-center gap-3">
 <TrendingUp className="size-5 text-[#0f52ff]" />
 <h3 className="text-[18px] font-bold tracking-tight">Mission Throughput</h3>
 </div>
 <div className="flex items-center gap-6 text-[12px] font-bold">
 <div className="flex items-center gap-2"><div className="size-3 rounded bg-[#0f52ff]" /> Missions</div>
 <div className="flex items-center gap-2"><div className="size-3 rounded bg-emerald-500" /> Automation</div>
 </div>
 </div>
 <div className="flex-1 w-full min-h-[300px]">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={PERFORMANCE_TRENDS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
 <defs>
 <linearGradient id="colorMissions" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#0f52ff" stopOpacity={0.3}/>
 <stop offset="95%" stopColor="#0f52ff" stopOpacity={0}/>
 </linearGradient>
 <linearGradient id="colorAuto" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
 <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, opacity: 0.5 }} />
 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, opacity: 0.5 }} />
 <Tooltip 
 contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: 'white', fontSize: '12px', fontWeight: 'bold' }} 
 itemStyle={{ color: 'white' }}
 />
 <Area type="monotone" dataKey="missions" stroke="#0f52ff" strokeWidth={3} fillOpacity={1} fill="url(#colorMissions)" />
 <Area type="monotone" dataKey="automation" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAuto)" />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Distribution Chart */}
 <div className="col-span-1 p-6 rounded-3xl bg-card/50 dark:bg-[#121212]/50 border border-border dark:border-white/10 backdrop-blur-md flex flex-col min-h-[400px]">
 <div className="flex items-center gap-3 mb-8">
 <Bot className="size-5 text-[#0f52ff]" />
 <h3 className="text-[18px] font-bold tracking-tight">Agent Utilization</h3>
 </div>
 <div className="flex-1 w-full min-h-[300px]">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={AGENT_UTILIZATION} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" opacity={0.1} />
 <XAxis type="number" hide />
 <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold' }} width={80} />
 <Tooltip 
 cursor={{ fill: 'transparent' }}
 contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: 'white', fontSize: '12px', fontWeight: 'bold' }} 
 />
 <Bar dataKey="usage" fill="#0f52ff" radius={[0, 4, 4, 0]} barSize={24} />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>

 </div>

 {/* Heatmap Explorer */}
 <div className="p-8 rounded-3xl bg-card/50 dark:bg-[#121212]/50 border border-border dark:border-white/10 backdrop-blur-md">
 <div className="flex items-center justify-between mb-8">
 <div className="flex items-center gap-3">
 <Activity className="size-5 text-[#0f52ff]" />
 <h3 className="text-[18px] font-bold tracking-tight">Global Institution Activity Heatmap</h3>
 </div>
 <span className="text-[12px] font-bold uppercase tracking-widest text-foreground/40 dark:text-[#F0EFE2]/40">7 Day Rolling (UTC)</span>
 </div>

 <div className="flex">
 {/* Y Axis Labels */}
 <div className="flex flex-col justify-between pr-4 py-2 border-r border-border dark:border-white/10 shrink-0">
 {DAYS.map(day => (
 <span key={day} className="text-[12px] font-bold text-foreground/50 dark:text-[#F0EFE2]/50 h-8 flex items-center">{day}</span>
 ))}
 </div>

 {/* Heatmap Grid */}
 <div className="flex-1 pl-4">
 <div className="flex flex-col gap-1 w-full h-full justify-between">
 {HEATMAP_DATA.map((dayData, dayIdx) => (
 <div key={dayIdx} className="flex gap-1 h-8 w-full">
 {dayData.map((val, hourIdx) => (
 <div 
 key={hourIdx} 
 className="flex-1 rounded-sm transition-all hover:scale-110 cursor-pointer"
 style={{
 backgroundColor: `rgba(15, 82, 255, ${val / 100})`,
 opacity: val === 0 ? 0.05 : 1
 }}
 title={`${DAYS[dayIdx]} ${hourIdx}:00 - Activity: ${val}`}
 />
 ))}
 </div>
 ))}
 </div>
 
 {/* X Axis Labels */}
 <div className="flex justify-between mt-4">
 {[0, 6, 12, 18, 23].map(hour => (
 <span key={hour} className="text-[12px] font-bold text-foreground/40 dark:text-[#F0EFE2]/40">{hour}:00</span>
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
