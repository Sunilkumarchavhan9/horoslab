"use client";

import React, { useState } from "react";
import { 
 Server,
 Cpu,
 Database,
 Activity,
 ArrowRightLeft,
 HardDrive,
 Network,
 Clock,
 CheckCircle2,
 AlertTriangle
} from "lucide-react";
import { 
 LineChart, Line,
 AreaChart, Area,
 XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";
import { cn } from "@/lib/utils";
import { CommandBar, SectionHeader, KPICard, InspectorModal } from "./observe-shared-components";

// --- Mock Data ---
const PERFORMANCE_DATA = Array.from({ length: 24 }, (_, i) => ({
 time: `${i}:00`,
 cpu: Math.floor(Math.random() * 40) + 20, // 20-60%
 memory: Math.floor(Math.random() * 30) + 50, // 50-80%
 latency: Math.floor(Math.random() * 50) + 10, // 10-60ms
}));

const INFRASTRUCTURE = [
 { id: 'api', name: "API Gateway", type: "Network", status: "Healthy", metrics: { latency: "12ms", load: "45%" }, icon: ArrowRightLeft },
 { id: 'mission', name: "Mission Runtime", type: "Compute", status: "Healthy", metrics: { cpu: "34%", mem: "2.4GB" }, icon: Cpu },
 { id: 'verification', name: "Verification Engine", type: "Compute", status: "Warning", metrics: { cpu: "89%", mem: "6.1GB" }, icon: Cpu },
 { id: 'db', name: "Primary Postgres", type: "Database", status: "Healthy", metrics: { io: "2.4MB/s", conn: "145" }, icon: Database },
 { id: 'redis', name: "Redis Cache", type: "Memory", status: "Healthy", metrics: { hit: "99.2%", mem: "1.2GB" }, icon: HardDrive },
 { id: 'websocket', name: "WebSocket Hub", type: "Network", status: "Healthy", metrics: { conn: "1,204", drops: "0" }, icon: Network },
];

const MetricChart = ({ title, data, dataKey, color, icon: Icon }: { title: string, data: any[], dataKey: string, color: string, icon: any }) => (
 <div className="p-6 rounded-3xl bg-card/50 dark:bg-[#121212]/50 border border-border dark:border-white/10 backdrop-blur-md flex flex-col h-[300px]">
 <div className="flex items-center gap-3 mb-6">
 <Icon className="size-5" style={{ color }} />
 <h3 className="text-[15px] font-bold tracking-tight">{title}</h3>
 </div>
 <div className="flex-1 w-full">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={data} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
 <defs>
 <linearGradient id={`grad_${dataKey}`} x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
 <stop offset="95%" stopColor={color} stopOpacity={0}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
 <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, opacity: 0.5 }} />
 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, opacity: 0.5 }} />
 <Tooltip 
 contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: 'white', fontSize: '12px', fontWeight: 'bold' }} 
 itemStyle={{ color: 'white' }}
 />
 <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fillOpacity={1} fill={`url(#grad_${dataKey})`} />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>
);

export function ObservePerformance() {
 const [inspectorOpen, setInspectorOpen] = useState(false);
 const [inspectorTarget, setInspectorTarget] = useState<any>(null);

 const handleInspect = (node: any) => {
 setInspectorTarget(node);
 setInspectorOpen(true);
 };

 return (
 <div className="flex flex-col h-full w-full bg-[#FBFBFB] dark:bg-[#030303] text-foreground dark:text-[#F0EFE2] font-sans overflow-hidden">
 <CommandBar>
 <div className="flex items-center gap-2">
 <Server className="size-4 text-[#0f52ff]" />
 <span className="text-[13px] font-bold tracking-wide">Observe / Performance</span>
 </div>
 </CommandBar>

 <div className="flex-1 overflow-y-auto custom-scrollbar">
 <div className="p-10 w-full mx-auto flex flex-col gap-10 pb-20">
 
 <SectionHeader 
 title="Infrastructure Performance" 
 description="Deep system-level telemetry. Monitor hardware, databases, queues, and latency across the fleet."
 className="mb-0"
 />

 {/* KPI Row */}
 <div className="grid grid-cols-4 gap-6">
 <KPICard title="Global P99 Latency" value="142ms" trend="up" trendValue="12ms" index={0} />
 <KPICard title="Total CPU Load" value="42.5%" trend="down" trendValue="2.1%" index={1} />
 <KPICard title="Memory Utilized" value="24.8 GB" trend="up" trendValue="1.2GB" index={2} />
 <KPICard title="Active Workers" value="48 / 50" subtext="Near capacity" trend="up" trendValue="5" index={3} />
 </div>

 {/* Mini Charts Row */}
 <div className="grid grid-cols-3 gap-6">
 <MetricChart title="CPU Utilization (%)" data={PERFORMANCE_DATA} dataKey="cpu" color="#0f52ff" icon={Cpu} />
 <MetricChart title="Memory Usage (%)" data={PERFORMANCE_DATA} dataKey="memory" color="#8b5cf6" icon={HardDrive} />
 <MetricChart title="System Latency (ms)" data={PERFORMANCE_DATA} dataKey="latency" color="#f59e0b" icon={Clock} />
 </div>

 {/* Infrastructure Map List */}
 <div>
 <h3 className="text-[18px] font-bold tracking-tight mb-6">Infrastructure Map</h3>
 <div className="grid grid-cols-3 gap-6">
 {INFRASTRUCTURE.map((node, index) => {
 const Icon = node.icon;
 return (
 <div 
 key={node.id}
 onClick={() => handleInspect(node)}
 className="p-6 rounded-3xl bg-card/50 dark:bg-[#121212]/50 border border-border dark:border-white/10 backdrop-blur-md flex flex-col gap-6 cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all group relative overflow-hidden"
 >
 <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
 
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className={cn(
 "size-10 rounded-md flex items-center justify-center",
 node.type === "Compute" ? "bg-[#0f52ff]/10 text-[#0f52ff]" :
 node.type === "Database" ? "bg-emerald-500/10 text-emerald-500" :
 node.type === "Memory" ? "bg-purple-500/10 text-purple-500" :
 "bg-amber-500/10 text-amber-500"
 )}>
 <Icon className="size-5" />
 </div>
 <div className="flex flex-col">
 <span className="text-[15px] font-bold tracking-tight">{node.name}</span>
 <span className="text-[11px] font-bold uppercase tracking-widest text-foreground/40 dark:text-[#F0EFE2]/40">{node.type}</span>
 </div>
 </div>
 <div className="flex items-center gap-1.5">
 <div className={cn("size-2.5 rounded-full ", node.status === "Healthy" ? "bg-emerald-500 shadow-emerald-500/50" : "bg-amber-500 shadow-amber-500/50 animate-pulse")} />
 </div>
 </div>

 <div className="flex items-center gap-6 pt-4 border-t border-border dark:border-white/5">
 {Object.entries(node.metrics).map(([key, val]) => (
 <div key={key} className="flex flex-col">
 <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 dark:text-[#F0EFE2]/40">{key}</span>
 <span className="text-[14px] font-mono font-bold text-foreground/70 dark:text-[#F0EFE2]/70">{val}</span>
 </div>
 ))}
 </div>
 </div>
 )
 })}
 </div>
 </div>

 </div>
 </div>

 <InspectorModal 
 isOpen={inspectorOpen} 
 onClose={() => setInspectorOpen(false)} 
 title={inspectorTarget ? `Infrastructure: ${inspectorTarget.name}` : "Inspector"}
 subtitle="Live hardware and OS-level telemetry."
 >
 {inspectorTarget && (
 <div className="space-y-6">
 <div className="p-6 rounded-md border border-border dark:border-white/10 bg-muted dark:bg-white/5 flex items-center justify-between">
 <div className="flex items-center gap-6">
 <inspectorTarget.icon className="size-8 opacity-60" />
 <div className="flex flex-col">
 <span className="text-[18px] font-bold tracking-tight">{inspectorTarget.name}</span>
 <span className="text-[12px] font-bold uppercase tracking-widest text-foreground/40 dark:text-[#F0EFE2]/40">{inspectorTarget.type} Node</span>
 </div>
 </div>
 <div className={cn(
 "px-6 py-2 rounded-md text-[13px] font-bold flex items-center gap-2",
 inspectorTarget.status === "Healthy" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
 )}>
 {inspectorTarget.status === "Healthy" ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
 {inspectorTarget.status}
 </div>
 </div>

 <div className="grid grid-cols-2 gap-6">
 {Object.entries(inspectorTarget.metrics).map(([key, val]) => (
 <div key={key} className="p-6 rounded-md border border-border dark:border-white/10 bg-card/50 dark:bg-[#121212]/50">
 <span className="text-[11px] font-bold uppercase tracking-widest text-foreground/40 dark:text-[#F0EFE2]/40 block mb-2">{key}</span>
 <span className="text-[24px] font-mono font-bold">{val as string}</span>
 </div>
 ))}
 </div>

 <div className="p-6 rounded-md border border-border dark:border-white/10 bg-muted dark:bg-white/5">
 <h4 className="text-[13px] font-bold mb-3">System Logs (tail -f)</h4>
 <div className="font-mono text-[11px] text-foreground/60 dark:text-[#F0EFE2]/60 space-y-2">
 <p>[OK] Daemon running successfully.</p>
 <p>[OK] Memory footprint stabilized at {inspectorTarget.metrics.mem || "nominal levels"}.</p>
 {inspectorTarget.status === "Warning" && (
 <p className="text-amber-500">[WARN] CPU usage spike detected, scaling workers may be delayed.</p>
 )}
 </div>
 </div>
 </div>
 )}
 </InspectorModal>

 </div>
 );
}
