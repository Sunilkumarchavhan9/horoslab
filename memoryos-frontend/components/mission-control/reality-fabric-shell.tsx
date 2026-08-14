"use client";

import { ReactNode, useState } from "react";
import { Search, Filter, Clock, RefreshCw, Plus, Activity, GitCommit, Target, ActivitySquare, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemePreference } from "@/lib/continuity-lab/use-theme-preference";

interface RealityFabricShellProps {
 title: string;
 subtitle: string;
 metrics?: {
 sources?: number;
 activeEvents?: number;
 activeMissions?: number;
 health?: number;
 [key: string]: number | undefined;
 };
 children: ReactNode;
 rightPanel?: ReactNode;
 onRefresh?: () => void;
}

export function RealityFabricShell({
 title,
 subtitle,
 metrics,
 children,
 rightPanel,
 onRefresh,
}: RealityFabricShellProps) {
 const { resolved } = useThemePreference();

 const isDark = resolved === "dark";
 const bgMain = isDark ? "bg-[#0a0a0a]" : "bg-[#F9F9F9]";
 const borderMain = isDark ? "border-white/5" : "border-border";
 const borderSub = isDark ? "border-white/10" : "border-border";
 const textMain = isDark ? "text-white" : "text-foreground";
 const textMuted = isDark ? "text-white/50" : "text-foreground/50";
 const textMutedHover = isDark ? "text-white/70" : "text-foreground/70";
 const iconMuted = isDark ? "text-white/40" : "text-foreground/40";
 const bgHover = isDark ? "hover:bg-card/10" : "hover:bg-accent";
 const inputBg = isDark ? "bg-card/5" : "bg-muted/50";

 return (
 <div className={cn("flex flex-col h-full w-full relative", bgMain)}>
 {/* Header */}
 <header className={cn("px-6 py-6 border-b shrink-0 z-10 flex flex-col gap-6", borderMain, bgMain)}>
 <div className="flex items-center justify-between">
 <div>
 <div className="flex items-center gap-3">
 <h1 className={cn("text-xl font-semibold tracking-tight", textMain)}>{title}</h1>
 <span className={cn(
 "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5",
 isDark ? "bg-[#eef7ee]/10 text-[#4ade80]" : "bg-[#eef7ee] text-[#2a7b2a]"
 )}>
 <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isDark ? "bg-[#4ade80]" : "bg-[#2a7b2a]")} />
 Live
 </span>
 </div>
 <p className={cn("text-[13px] mt-1", textMuted)}>{subtitle}</p>
 </div>
 
 <div className="flex items-center gap-6">
 <div className={cn("flex items-center gap-6 mr-4 border-r pr-6", borderSub)}>
 <div className="flex items-center gap-2">
 <ActivitySquare className={cn("size-4", iconMuted)} />
 <span className={cn("text-[15px] font-semibold", textMain)}>{metrics?.sources ?? 124}</span>
 <span className={cn("text-[12px] font-medium", textMuted)}>Sources</span>
 </div>
 <div className="flex items-center gap-2">
 <GitCommit className={cn("size-4", iconMuted)} />
 <span className={cn("text-[15px] font-semibold", textMain)}>{metrics?.activeEvents ?? 14}</span>
 <span className={cn("text-[12px] font-medium", textMuted)}>Events</span>
 </div>
 <div className="flex items-center gap-2">
 <Target className={cn("size-4", iconMuted)} />
 <span className={cn("text-[15px] font-semibold", textMain)}>{metrics?.activeMissions ?? 6}</span>
 <span className={cn("text-[12px] font-medium", textMuted)}>Missions</span>
 </div>
 <div className="flex items-center gap-2">
 <Activity className={cn("size-4", isDark ? "text-[#4ade80]/60" : "text-[#2a7b2a]/60")} />
 <span className={cn("text-[12px] font-medium", textMuted)}>Health</span>
 <span className={cn("text-[13px] font-bold", isDark ? "text-[#4ade80]" : "text-[#2a7b2a]")}>{metrics?.health ?? 99.8}%</span>
 </div>
 </div>

 <button className="flex items-center gap-2 px-6 py-1.5 bg-blue-600 text-white rounded-md text-[13px] font-semibold hover:bg-blue-700 transition-colors ">
 <Plus className="size-4" /> Connect Source
 </button>
 </div>
 </div>

 {/* Toolbar */}
 <div className="flex items-center justify-between mt-2">
 <div className="flex items-center gap-2">
 <div className={cn("flex items-center gap-2 px-3 py-1.5 border rounded-md text-[13px] w-64 transition-colors cursor-text", inputBg, borderSub, textMutedHover)}>
 <Search className="size-4 shrink-0 opacity-50" />
 <input 
 type="text" 
 placeholder={`Search ${title.toLowerCase()}...`} 
 className={cn("bg-transparent border-none outline-none w-full", isDark ? "placeholder:text-white/30" : "placeholder:text-foreground/30", textMain)}
 />
 </div>
 <button className={cn("flex items-center gap-2 px-3 py-1.5 border rounded-md text-[13px] transition-colors ", inputBg, borderSub, textMutedHover, bgHover)}>
 <Filter className="size-3.5 opacity-70" /> Filter
 </button>
 <button className={cn("flex items-center gap-2 px-3 py-1.5 border rounded-md text-[13px] transition-colors ", inputBg, borderSub, textMutedHover, bgHover)}>
 <Clock className="size-3.5 opacity-70" /> Time
 </button>
 <button 
 onClick={onRefresh}
 className={cn("flex items-center gap-2 px-3 py-1.5 border rounded-md text-[13px] transition-colors ", inputBg, borderSub, textMutedHover, bgHover)}
 >
 <RefreshCw className="size-3.5 opacity-70" /> Refresh
 </button>
 </div>
 </div>
 </header>

 {/* Main Workspace Area */}
 <div className={cn("flex-1 flex overflow-hidden", bgMain)}>
 {/* Center Content */}
 <div className={cn("flex-1 overflow-y-auto custom-scrollbar relative p-6", isDark ? "text-white/90" : "text-foreground/90")}>
 {children}
 </div>
 </div>

 {/* Centered Modal Inspector */}
 {rightPanel && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 sm:p-6 animate-in fade-in duration-200">
 <div className={cn("w-full max-w-2xl max-h-[85vh] flex flex-col rounded-md overflow-hidden shadow-2xl border animate-in zoom-in-95 duration-200", bgMain, borderMain)}>
 {rightPanel}
 </div>
 </div>
 )}
 </div>
 );
}

export interface InspectorProps {
 title: string;
 subtitle?: string;
 onClose?: () => void;
 children?: ReactNode;
}

export function RealityFabricInspector({ title, subtitle, onClose, children }: InspectorProps) {
 const [activeTab, setActiveTab] = useState<"Overview" | "Timeline" | "Metadata" | "Related">("Overview");
 const { resolved } = useThemePreference();
 
 const isDark = resolved === "dark";
 const bgMain = isDark ? "bg-[#0a0a0a]" : "bg-[#F9F9F9]";
 const borderMain = isDark ? "border-white/5" : "border-border";
 const textMain = isDark ? "text-white" : "text-foreground";
 const textMuted = isDark ? "text-white/50" : "text-foreground/50";
 const textMutedHover = isDark ? "hover:text-white/80" : "hover:text-foreground/80";
 const iconMuted = isDark ? "text-white/40" : "text-foreground/40";
 const bgHover = isDark ? "hover:bg-card/10" : "hover:bg-accent";

 return (
 <div className={cn("flex flex-col h-full", bgMain)}>
 <div className={cn("px-6 py-6 border-b shrink-0 flex items-start justify-between", borderMain, bgMain)}>
 <div>
 <h2 className={cn("text-[15px] font-semibold tracking-tight", textMain)}>{title}</h2>
 {subtitle && <p className={cn("text-[12px] mt-0.5", textMuted)}>{subtitle}</p>}
 </div>
 {onClose && (
 <button 
 onClick={onClose}
 className={cn("p-1 rounded-md transition-colors", bgHover, iconMuted, textMutedHover)}
 >
 <X className="size-4" />
 </button>
 )}
 </div>

 <div className={cn("flex px-6 gap-6 border-b shrink-0 overflow-x-auto custom-scrollbar", borderMain, bgMain)}>
 {(["Overview", "Timeline", "Metadata", "Related"] as const).map((tab) => (
 <button
 key={tab}
 onClick={() => setActiveTab(tab)}
 className={cn(
 "py-3 text-[12.5px] font-medium transition-all relative whitespace-nowrap",
 activeTab === tab ? textMain : cn(textMuted, isDark ? "hover:text-white/70" : "hover:text-foreground/70")
 )}
 >
 {tab}
 {activeTab === tab && (
 <div className={cn("absolute bottom-0 left-0 right-0 h-0.5", isDark ? "bg-card" : "bg-black")} />
 )}
 </button>
 ))}
 </div>

 <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
 {activeTab === "Overview" ? (
 <div className="space-y-6">
 {children}
 </div>
 ) : (
 <div className={cn("flex items-center justify-center h-full text-[13px] italic", iconMuted)}>
 {activeTab} data not available
 </div>
 )}
 </div>
 </div>
 );
}

export function RealityFabricCard({ title, icon, actions, children }: { title: string, icon?: ReactNode, actions?: ReactNode, children: ReactNode }) {
 const { resolved } = useThemePreference();
 const isDark = resolved === "dark";
 const bgMain = isDark ? "bg-[#121212]" : "bg-card";
 const bgHeader = isDark ? "bg-[#0a0a0a]" : "bg-[#F9F9F9]";
 const borderMain = isDark ? "border-white/5" : "border-border";
 const borderHeader = isDark ? "border-white/5" : "border-border";
 const textMain = isDark ? "text-white" : "text-foreground";

 return (
 <div className={cn("flex flex-col h-full rounded-md border overflow-hidden relative", bgMain, borderMain)}>
 <div className={cn("px-6 py-3 border-b flex items-center justify-between shrink-0", bgHeader, borderHeader)}>
 <div className="flex items-center gap-2">
 {icon}
 <h3 className={cn("text-[13px] font-semibold tracking-tight", textMain)}>{title}</h3>
 </div>
 {actions && (
 <div className="flex items-center gap-2">
 {actions}
 </div>
 )}
 </div>
 <div className={cn("flex-1 overflow-y-auto overflow-x-hidden p-0 custom-scrollbar relative", bgHeader)}>
 {children}
 </div>
 </div>
 );
}

export function RealityFabricProperty({ label, value, type = "text" }: { label: string, value: string | ReactNode, type?: "text" | "code" | "status" | "badge" }) {
 const { resolved } = useThemePreference();
 const isDark = resolved === "dark";
 const borderMain = isDark ? "border-white/5" : "border-border";
 const textLabel = isDark ? "text-white/40" : "text-foreground/40";
 const textCode = isDark ? "text-white" : "text-foreground";
 const bgCode = isDark ? "bg-card/5" : "bg-muted";
 const textVal = isDark ? "text-white/90" : "text-foreground/90";
 const badgeBg = isDark ? "bg-card/5" : "bg-muted";
 const badgeText = isDark ? "text-white/70" : "text-foreground/70";
 const statusColor = isDark ? "text-[#4ade80]" : "text-[#2a7b2a]";
 const statusBg = isDark ? "bg-[#4ade80]" : "bg-[#2a7b2a]";

 return (
 <div className={cn("flex flex-col gap-1.5 pb-4 mb-4 border-b last:border-0 last:mb-0 last:pb-0", borderMain)}>
 <span className={cn("text-[11px] font-medium uppercase tracking-wider", textLabel)}>{label}</span>
 {type === "code" ? (
 <code className={cn("text-[12px] px-1.5 py-0.5 rounded font-mono break-all", bgCode, textCode)}>{value}</code>
 ) : type === "status" ? (
 <span className={cn("inline-flex items-center gap-1.5 text-[13px] font-medium", statusColor)}>
 <span className={cn("w-1.5 h-1.5 rounded-full", statusBg)} />
 {value}
 </span>
 ) : type === "badge" ? (
 <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[12px] w-fit", badgeBg, badgeText)}>
 {value}
 </span>
 ) : (
 <span className={cn("text-[13px] leading-relaxed", textVal)}>{value}</span>
 )}
 </div>
 );
}

export function RealityFabricInspectorSection({ title, children, defaultExpanded = true }: { title: string, children: ReactNode, defaultExpanded?: boolean }) {
 const [expanded, setExpanded] = useState(defaultExpanded);
 const { resolved } = useThemePreference();
 const isDark = resolved === "dark";
 const textHeader = isDark ? "text-white/40 hover:text-white/70" : "text-foreground/40 hover:text-foreground/70";
 const textIcon = isDark ? "" : "text-foreground/30";
 
 return (
 <div className="mb-6 last:mb-0">
 <button 
 onClick={() => setExpanded(!expanded)}
 className={cn("w-full flex items-center justify-between py-2 text-[12px] font-bold uppercase tracking-wider transition-colors", textHeader)}
 >
 <span>{title}</span>
 <span className="flex items-center justify-center w-5 h-5">
 <svg 
 className={cn("size-3.5 transition-transform", expanded ? "rotate-90" : "rotate-0", textIcon)} 
 fill="none" viewBox="0 0 24 24" stroke="currentColor"
 >
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
 </svg>
 </span>
 </button>
 {expanded && (
 <div className="mt-3 animate-in slide-in-from-top-2 fade-in duration-200">
 {children}
 </div>
 )}
 </div>
 );
}

export function RealityFabricJSON({ data }: { data: any }) {
 const { resolved } = useThemePreference();
 const isDark = resolved === "dark";
 const bgMain = isDark ? "bg-[#0a0a0a]" : "bg-[#F9F9F9]";
 const borderMain = isDark ? "border-white/5" : "border-border";
 const textPre = isDark ? "text-[#a8a8a8]" : "text-foreground/60";
 
 const replacer = (match: string, p1?: string) => {
 if (match.startsWith('"') && match.endsWith('":')) {
 return `<span class="${isDark ? 'text-[#89b4fa]' : 'text-[#0550ae]'}">${match}</span>`;
 } else if (match.startsWith(': "')) {
 return `: <span class="${isDark ? 'text-[#a6e3a1]' : 'text-[#0a3069]'}">"${match.slice(3, -1)}"</span>`;
 } else if (match === ': true' || match === ': false') {
 return `: <span class="${isDark ? 'text-[#f9e2af]' : 'text-[#cf222e]'}">${match.slice(2)}</span>`;
 } else {
 return `: <span class="${isDark ? 'text-[#f38ba8]' : 'text-[#116329]'}">${match.slice(2)}</span>`;
 }
 };

 const html = JSON.stringify(data, null, 2)
 .replace(/"(.*?)":/g, replacer)
 .replace(/: "(.*?)"/g, replacer)
 .replace(/: (true|false)/g, replacer)
 .replace(/: (\d+)/g, replacer);

 return (
 <div className={cn("rounded-md p-6 font-mono text-[11px] leading-[1.6] overflow-x-auto border custom-scrollbar", bgMain, borderMain)}>
 <pre className={textPre} dangerouslySetInnerHTML={{ __html: html }} />
 </div>
 );
}
