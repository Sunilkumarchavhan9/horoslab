"use client";

import React, { useState } from "react";
import { Key, Plus, RotateCw, AlertTriangle, Shield, Clock, Activity, Fingerprint } from "lucide-react";
import { cn } from "@/lib/utils";
import { SplitViewLayout, DeveloperHeader, StatusBadge } from "./developer-shared-components";

// --- Mock Data ---
const API_KEYS = [
 { id: "pk_live_1", name: "Production Gateway Key", prefix: "pk_live_9f82...", created: "Oct 12, 2025", expires: "Never", scopes: ["mission:write", "reality:read"], lastUsed: "2 mins ago" },
 { id: "pk_test_1", name: "Staging Testing Key", prefix: "pk_test_3b41...", created: "Nov 01, 2025", expires: "Jan 01, 2027", scopes: ["*"], lastUsed: "5 hours ago" },
 { id: "pk_live_2", name: "Legacy Script Key", prefix: "pk_live_1a99...", created: "Jan 15, 2024", expires: "Expired", scopes: ["mission:read"], lastUsed: "3 months ago" }
];

export function DeveloperAPIKeys() {
 const [selectedKey, setSelectedKey] = useState(API_KEYS[0]);

 const renderMain = () => (
 <div className="flex flex-col w-full max-w-[900px]">
 <div className="flex items-start justify-between mb-2">
 <DeveloperHeader 
 title="API Keys" 
 description="Manage programmatic access to your Epoch organization. Keys should be rotated every 90 days for optimal security."
 />
 <button className="px-6 py-2 bg-[#111] dark:bg-white text-white dark:text-black rounded-md text-[13px] font-medium flex items-center gap-2 hover:opacity-90">
 <Plus className="size-4" />
 Create Secret Key
 </button>
 </div>

 <div className="rounded-md border border-border dark:border-white/10 overflow-hidden bg-card dark:bg-[#111]">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-muted/50 dark:bg-[#050505] border-b border-border dark:border-white/10">
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground dark:text-muted-foreground">Name</th>
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground dark:text-muted-foreground">Token</th>
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground dark:text-muted-foreground">Scopes</th>
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground dark:text-muted-foreground">Created</th>
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground dark:text-muted-foreground text-right">Actions</th>
 </tr>
 </thead>
 <tbody>
 {API_KEYS.map((apiKey) => (
 <tr 
 key={apiKey.id} 
 onClick={() => setSelectedKey(apiKey)}
 className={cn(
 "border-b border-border dark:border-white/5 last:border-0 cursor-pointer transition-colors",
 selectedKey.id === apiKey.id ? "bg-muted dark:bg-white/10" : "hover:bg-muted/50/50 dark:hover:bg-[#1a1a1a]/50"
 )}
 >
 <td className="px-6 py-3">
 <div className="flex items-center gap-2">
 <Key className={cn("size-3.5", apiKey.expires === "Expired" ? "text-red-500" : "text-foreground dark:text-white")} />
 <span className="text-[13px] font-medium text-foreground dark:text-white">{apiKey.name}</span>
 </div>
 </td>
 <td className="px-6 py-3">
 <span className="text-[12px] font-mono text-muted-foreground dark:text-muted-foreground">{apiKey.prefix}</span>
 </td>
 <td className="px-6 py-3">
 <div className="flex gap-1">
 {apiKey.scopes.map(s => (
 <span key={s} className="px-1.5 py-0.5 rounded bg-muted dark:bg-white/10 text-[10px] font-mono font-medium text-muted-foreground dark:text-[#aaa]">{s}</span>
 ))}
 </div>
 </td>
 <td className="px-6 py-3">
 <span className="text-[13px] text-foreground/80 dark:text-[#ccc]">{apiKey.created}</span>
 </td>
 <td className="px-6 py-3 text-right">
 <button className="p-1.5 text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-white transition-colors" title="Rotate Key">
 <RotateCw className="size-4" />
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 );

 const renderInspector = () => (
 <div className="flex flex-col h-full w-full">
 <div className="flex items-center gap-3 px-6 py-6 border-b border-border dark:border-white/5 bg-muted/50 dark:bg-[#030303]">
 <Shield className="size-4 text-muted-foreground" />
 <span className="text-[13px] font-medium text-foreground dark:text-[#eee]">Security Inspector</span>
 {selectedKey.expires === "Expired" && <StatusBadge status="error" />}
 {selectedKey.expires !== "Expired" && <StatusBadge status="healthy" />}
 </div>
 
 <div className="flex-1 p-6 flex flex-col gap-8">
 
 {/* Usage Stats Mock */}
 <div className="flex flex-col gap-3">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Usage (Last 24h)</span>
 <div className="flex items-end gap-1 h-12">
 {[10, 25, 40, 20, 60, 45, 80, 30, 20, 100, 85, 40, 50, 70, 90, 60].map((val, i) => (
 <div 
 key={i} 
 className={cn("flex-1 rounded-t-sm", selectedKey.expires === "Expired" ? "bg-red-500/20" : "bg-[#0f52ff]/60")}
 style={{ height: `${val}%` }}
 />
 ))}
 </div>
 <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
 <span>24h ago</span>
 <span>Now</span>
 </div>
 </div>

 <div className="flex flex-col gap-3">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Details</span>
 <div className="flex flex-col gap-2 rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#111] p-6 text-[13px]">
 <div className="flex justify-between border-b border-border dark:border-white/5 pb-2">
 <span className="text-muted-foreground dark:text-muted-foreground">Last Used</span>
 <span className="font-medium text-foreground dark:text-white flex items-center gap-1.5"><Clock className="size-3"/> {selectedKey.lastUsed}</span>
 </div>
 <div className="flex justify-between border-b border-border dark:border-white/5 pb-2 pt-2">
 <span className="text-muted-foreground dark:text-muted-foreground">Expires</span>
 <span className="font-medium text-foreground dark:text-white">{selectedKey.expires}</span>
 </div>
 <div className="flex justify-between pt-2">
 <span className="text-muted-foreground dark:text-muted-foreground">IP Restrictions</span>
 <span className="font-mono text-[11px] bg-muted dark:bg-white/10 px-1.5 py-0.5 rounded text-foreground dark:text-white">0.0.0.0/0</span>
 </div>
 </div>
 </div>

 <div className="flex flex-col gap-3">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Audit Log</span>
 <div className="flex flex-col gap-3">
 <div className="flex items-start gap-3">
 <Activity className="size-4 text-muted-foreground mt-0.5" />
 <div className="flex flex-col">
 <span className="text-[13px] font-medium text-foreground dark:text-white">API Request (POST /v1/missions)</span>
 <span className="text-[11px] text-muted-foreground dark:text-muted-foreground">2 mins ago from 192.168.1.1</span>
 </div>
 </div>
 <div className="flex items-start gap-3">
 <Fingerprint className="size-4 text-muted-foreground mt-0.5" />
 <div className="flex flex-col">
 <span className="text-[13px] font-medium text-foreground dark:text-white">Key Created</span>
 <span className="text-[11px] text-muted-foreground dark:text-muted-foreground">Oct 12, 2025 by admin@epoch.ai</span>
 </div>
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
