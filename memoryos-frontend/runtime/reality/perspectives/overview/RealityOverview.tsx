"use client";

import { useEffect, useState } from "react";
import { useRealityStore } from "../../runtime/store";
import { useInstitutionStore } from "../../../institution/store";
import { Activity, AlertTriangle, Database, ShieldCheck } from "lucide-react";
import { getRealityStatus, type RealityStatus } from "@/lib/reality-api";

export function RealityOverview() {
 const { setSelection } = useRealityStore();
 const { status } = useInstitutionStore();
 const [realityStatus, setRealityStatus] = useState<RealityStatus | null>(null);

 useEffect(() => {
 let cancelled = false;
 const load = async () => {
 try {
 const statusResult = await getRealityStatus();
 if (cancelled) return;
 setRealityStatus(statusResult);
 } catch {
 if (cancelled) return;
 setRealityStatus(null);
 }
 };

 void load();
 return () => {
 cancelled = true;
 };
 }, []);

 return (
 <div className="flex flex-col w-full h-full font-sans animate-in fade-in duration-500 bg-card dark:bg-[#111] text-foreground dark:text-[#eee]">
 
<div className="flex items-center gap-3 px-8 py-6 border-b border-border dark:border-[#333]">
<div className="size-8 bg-[#111] dark:bg-white text-white dark:text-foreground flex items-center justify-center shrink-0">
<Activity className="size-4" />
</div>
<div>
<h1 className="text-[18px] font-bold leading-none">Reality Overview</h1>
<p className="text-[12px] text-muted-foreground dark:text-muted-foreground mt-1">Operational intelligence for the software-release mission at a glance.</p>
</div>
</div>

 <div className="flex flex-col w-full h-full overflow-y-auto">
 <div className="flex flex-col w-full h-full">
 <div className="px-8 py-4 bg-muted/50 dark:bg-[#1a1a1a] border-b border-border dark:border-[#333]">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-muted-foreground">Reality Graph Topology</span>
 </div>
 
 <div className={`flex flex-col transition-all duration-1000 w-full`}>
 <div className="p-8 flex items-start gap-6 border-b border-border dark:border-[#333]">
 <div className={`size-12 flex items-center justify-center shrink-0 transition-colors duration-1000 ${status === 'healthy' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
 {status === 'healthy' ? (
 <ShieldCheck className="size-6" />
 ) : (
 <AlertTriangle className="size-6" />
 )}
 </div>
 <div className="flex flex-col flex-1 gap-3">
 <div className="flex justify-between items-start">
 <span className="font-bold text-[18px] text-foreground dark:text-[#eee]">Software Release Health</span>
 <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5">Live</span>
 </div>
 
 <div className="flex items-center gap-2">
 <div className="px-3 py-1.5 bg-[#eee] dark:bg-[#222] text-[12px] font-bold text-muted-foreground dark:text-muted-foreground flex items-center gap-2 border border-[#ccc] dark:border-[#444]">
 <Database className="size-3" />
 Authentication Sector
 </div>
 </div>
 
 <p className="text-[14px] font-medium text-muted-foreground dark:text-muted-foreground mt-2 leading-relaxed">
 {realityStatus?.validation.valid
 ? `Reality is healthy with ${realityStatus.nodes} nodes and ${realityStatus.edges} edges.`
 : "Reality has validation issues that need attention."}
 </p>
 
 {status !== 'healthy' && (
 <div className="flex items-center gap-4 mt-6">
 <button 
 onClick={() => setSelection({ type: 'connection', id: 'github', sourceView: 'overview' })}
 className="px-6 py-3 bg-[#111] dark:bg-white text-white dark:text-foreground text-[13px] font-bold hover:bg-[#333] dark:hover:bg-[#ccc] transition-colors"
 >
 Inspect Risk
 </button>
 <button 
 className="px-6 py-3 bg-transparent border border-[#ccc] dark:border-[#555] text-foreground dark:text-[#eee] text-[13px] font-bold hover:bg-muted/50 dark:hover:bg-[#1a1a1a] transition-colors">
 View Impact Analysis
 </button>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>

 </div>
 </div>
 );
}
