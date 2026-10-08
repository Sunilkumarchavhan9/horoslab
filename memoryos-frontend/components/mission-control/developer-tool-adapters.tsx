"use client";

import React, { useState } from "react";
import { Plug, Plus, Settings2, Code, MessageSquare, CheckCircle2, CloudLightning } from "lucide-react";
import { cn } from "@/lib/utils";
import { SplitViewLayout, DeveloperHeader, StatusBadge } from "./developer-shared-components";

// --- Mock Data ---
const ADAPTERS = [
 { id: "adp_github", name: "GitHub App", provider: "GitHub", status: "Connected", icon: Code, syncStatus: "Synced 2 mins ago" },
 { id: "adp_slack", name: "Slack Bot", provider: "Slack", status: "Connected", icon: MessageSquare, syncStatus: "Real-time active" },
 { id: "adp_aws", name: "AWS CloudTrail", provider: "AWS", status: "Warning", icon: CloudLightning, syncStatus: "Failing (401 Auth)" },
 { id: "adp_jira", name: "Jira Webhooks", provider: "Jira", status: "Disconnected", icon: Plug, syncStatus: "Not configured" },
];

export function DeveloperToolAdapters() {
 const [selectedAdapter, setSelectedAdapter] = useState(ADAPTERS[0]);

 const renderMain = () => (
 <div className="flex flex-col w-full max-w-[900px]">
 <div className="flex items-start justify-between mb-8">
 <DeveloperHeader 
 title="Tool Adapters" 
 description="Connect external platforms to feed reality data into HOROS. Adapters translate vendor-specific events into unified Reality Fabric schemas."
 />
 <button className="px-6 py-2 bg-[#111] dark:bg-white text-[#F0EFE2] dark:text-black rounded-md text-[13px] font-medium flex items-center gap-2 hover:opacity-90">
 <Plus className="size-4" />
 Add Adapter
 </button>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {ADAPTERS.map((adapter) => (
 <div 
 key={adapter.id} 
 onClick={() => setSelectedAdapter(adapter)}
 className={cn(
 "flex flex-col p-6 rounded-md border cursor-pointer transition-all",
 selectedAdapter.id === adapter.id 
 ? "border-[#111] dark:border-white bg-muted dark:bg-white/10" 
 : "border-border dark:border-white/10 bg-card dark:bg-[#111] hover:border-black/20 dark:hover:border-white/20 hover:bg-muted/50 dark:hover:bg-[#1a1a1a]"
 )}
 >
 <div className="flex items-start justify-between mb-6">
 <div className="flex items-center gap-3">
 <div className="size-10 rounded-md border border-border dark:border-white/10 bg-muted/50 dark:bg-[#050505] flex items-center justify-center">
 <adapter.icon className="size-5 text-foreground dark:text-[#F0EFE2]" />
 </div>
 <div className="flex flex-col gap-1">
 <span className="text-[14px] font-semibold text-foreground dark:text-[#F0EFE2] leading-none">{adapter.name}</span>
 <span className="text-[12px] font-medium text-muted-foreground dark:text-muted-foreground leading-none">{adapter.provider}</span>
 </div>
 </div>
 <StatusBadge status={adapter.status === "Disconnected" ? "neutral" : adapter.status} />
 </div>

 <div className="flex items-center gap-2 text-[12px] font-mono text-muted-foreground dark:text-muted-foreground mt-auto">
 {adapter.status === "Connected" && <CheckCircle2 className="size-3.5 text-emerald-500" />}
 {adapter.status === "Warning" && <span className="size-2 rounded-full bg-amber-500" />}
 {adapter.status === "Disconnected" && <span className="size-2 rounded-full bg-[#ccc]" />}
 {adapter.syncStatus}
 </div>
 </div>
 ))}
 </div>
 </div>
 );

 const renderInspector = () => (
 <div className="flex flex-col h-full w-full">
 <div className="flex items-center gap-3 px-6 py-6 border-b border-border dark:border-white/5 bg-muted/50 dark:bg-[#030303]">
 <Settings2 className="size-4 text-muted-foreground" />
 <span className="text-[13px] font-medium text-foreground dark:text-[#eee]">{selectedAdapter.name} Setup</span>
 </div>
 
 <div className="flex-1 p-6 flex flex-col gap-8">
 
 <div className="flex flex-col gap-3">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Authentication</span>
 {selectedAdapter.status === "Disconnected" ? (
 <div className="flex flex-col gap-3 p-6 rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#111]">
 <p className="text-[13px] text-muted-foreground dark:text-muted-foreground leading-relaxed">
 Connect your {selectedAdapter.provider} account using OAuth to allow HOROS to ingest events and dispatch tools.
 </p>
 <button className="px-6 py-2 bg-[#111] dark:bg-white text-[#F0EFE2] dark:text-black rounded-md text-[13px] font-medium w-full mt-2">
 Connect {selectedAdapter.provider}
 </button>
 </div>
 ) : (
 <div className="flex flex-col gap-0 rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#111] text-[13px]">
 <div className="flex justify-between p-3 border-b border-border dark:border-white/5">
 <span className="text-muted-foreground">Auth Method</span>
 <span className="font-medium text-foreground dark:text-[#F0EFE2]">OAuth 2.0</span>
 </div>
 <div className="flex justify-between p-3 border-b border-border dark:border-white/5">
 <span className="text-muted-foreground">Workspace</span>
 <span className="font-medium text-foreground dark:text-[#F0EFE2]">acmecorp</span>
 </div>
 <div className="flex justify-between p-3">
 <span className="text-muted-foreground">Connected By</span>
 <span className="font-medium text-foreground dark:text-[#F0EFE2]">admin@acme.com</span>
 </div>
 </div>
 )}
 </div>

 <div className="flex flex-col gap-3">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Granted Scopes</span>
 <div className="flex flex-wrap gap-1.5 p-3 rounded-md border border-border dark:border-white/10 bg-muted/50 dark:bg-[#050505]">
 <span className="px-2 py-1 rounded bg-muted dark:bg-white/10 text-[11px] font-mono text-foreground/80 dark:text-[#C8C7BA]">repo:read</span>
 <span className="px-2 py-1 rounded bg-muted dark:bg-white/10 text-[11px] font-mono text-foreground/80 dark:text-[#C8C7BA]">repo:write</span>
 <span className="px-2 py-1 rounded bg-muted dark:bg-white/10 text-[11px] font-mono text-foreground/80 dark:text-[#C8C7BA]">pull_requests:write</span>
 <span className="px-2 py-1 rounded bg-muted dark:bg-white/10 text-[11px] font-mono text-foreground/80 dark:text-[#C8C7BA]">issues:read</span>
 </div>
 </div>

 <div className="flex flex-col gap-3">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Event Ingestion Stats</span>
 <div className="flex flex-col gap-2 rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#111] p-6 text-[13px]">
 <div className="flex justify-between border-b border-border dark:border-white/5 pb-2">
 <span className="text-muted-foreground dark:text-muted-foreground">Events (24h)</span>
 <span className="font-mono text-foreground dark:text-[#F0EFE2] font-medium">14,291</span>
 </div>
 <div className="flex justify-between pt-2">
 <span className="text-muted-foreground dark:text-muted-foreground">Error Rate</span>
 <span className="font-mono text-foreground dark:text-[#F0EFE2] font-medium">0.01%</span>
 </div>
 </div>
 </div>

 </div>
 </div>
 );

 return (
 <SplitViewLayout inspector={renderInspector()}>
 {renderMain()}
 </SplitViewLayout>
 );
}
