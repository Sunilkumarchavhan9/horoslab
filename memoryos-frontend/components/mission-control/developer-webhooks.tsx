"use client";

import React, { useState } from "react";
import { Webhook, Plus, ArrowRight, CheckCircle2, RotateCcw, Box, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { SplitViewLayout, DeveloperHeader, StatusBadge, CodeBlock } from "./developer-shared-components";

// --- Mock Data ---
const ENDPOINTS = [
 { id: "wh_1", url: "https://api.acme.com/epoch/webhooks", status: "Healthy", events: ["mission.completed", "mission.failed"], retries: 0, latency: "42ms" },
 { id: "wh_2", url: "https://staging.acme.com/epoch/hooks", status: "Warning", events: ["*"], retries: 14, latency: "890ms" }
];

const DELIVERIES = [
 { id: "evt_991", type: "mission.completed", time: "2 mins ago", status: "200 OK", latency: "42ms" },
 { id: "evt_990", type: "mission.started", time: "15 mins ago", status: "200 OK", latency: "38ms" },
 { id: "evt_989", type: "verification.failed", time: "1 hour ago", status: "500 Error", latency: "1204ms" },
 { id: "evt_989_retry", type: "verification.failed", time: "55 mins ago", status: "200 OK", latency: "145ms", isRetry: true },
];

const PAYLOAD_JSON = `{
 "id": "evt_991",
 "type": "mission.completed",
 "created_at": "2026-07-26T12:00:00Z",
 "data": {
 "mission_id": "mis_9102b",
 "status": "success",
 "output": {
 "pull_request_url": "https://github.com/acme/core/pull/142",
 "verdict": "PASS"
 }
 }
}`;

const HEADERS_JSON = `{
 "content-type": "application/json",
 "user-agent": "Epoch-Webhook/1.0",
 "epoch-signature": "t=1756555200,v1=98f82b...",
 "epoch-event-id": "evt_991"
}`;

const RESPONSE_JSON = `{
 "received": true,
 "queued_for_processing": true
}`;

export function DeveloperWebhooks() {
 const [selectedEndpoint, setSelectedEndpoint] = useState(ENDPOINTS[0]);
 const [selectedDelivery, setSelectedDelivery] = useState(DELIVERIES[0]);

 const renderMain = () => (
 <div className="flex flex-col w-full max-w-[900px]">
 <div className="flex items-start justify-between mb-2">
 <DeveloperHeader 
 title="Webhooks" 
 description="Listen for asynchronous events like mission completions, verifier verdicts, and policy violations."
 />
 <button className="px-6 py-2 bg-[#111] dark:bg-white text-[#F0EFE2] dark:text-black rounded-md text-[13px] font-medium flex items-center gap-2 hover:opacity-90">
 <Plus className="size-4" />
 Add Endpoint
 </button>
 </div>

 <div className="mb-12">
 <h3 className="text-[15px] font-semibold tracking-tight mb-4">Endpoints</h3>
 <div className="rounded-md border border-border dark:border-white/10 overflow-hidden bg-card dark:bg-[#111]">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-muted/50 dark:bg-[#050505] border-b border-border dark:border-white/10">
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground dark:text-muted-foreground">URL</th>
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground dark:text-muted-foreground">Status</th>
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground dark:text-muted-foreground">Events</th>
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground dark:text-muted-foreground">Latency</th>
 </tr>
 </thead>
 <tbody>
 {ENDPOINTS.map((endpoint) => (
 <tr 
 key={endpoint.id} 
 onClick={() => setSelectedEndpoint(endpoint)}
 className={cn(
 "border-b border-border dark:border-white/5 last:border-0 cursor-pointer transition-colors",
 selectedEndpoint.id === endpoint.id ? "bg-muted dark:bg-white/10" : "hover:bg-muted/50/50 dark:hover:bg-[#1a1a1a]/50"
 )}
 >
 <td className="px-6 py-3">
 <span className="text-[13px] font-mono text-foreground dark:text-[#F0EFE2]">{endpoint.url}</span>
 </td>
 <td className="px-6 py-3">
 <StatusBadge status={endpoint.status} />
 </td>
 <td className="px-6 py-3">
 <div className="flex flex-wrap gap-1">
 {endpoint.events.map(e => (
 <span key={e} className="px-1.5 py-0.5 rounded bg-muted dark:bg-white/10 text-[10px] font-mono font-medium text-muted-foreground dark:text-[#aaa]">{e}</span>
 ))}
 </div>
 </td>
 <td className="px-6 py-3">
 <span className="text-[12px] font-mono text-muted-foreground dark:text-muted-foreground">{endpoint.latency}</span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 <div>
 <h3 className="text-[15px] font-semibold tracking-tight mb-4">Recent Deliveries</h3>
 <div className="rounded-md border border-border dark:border-white/10 overflow-hidden bg-card dark:bg-[#111]">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-muted/50 dark:bg-[#050505] border-b border-border dark:border-white/10">
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground dark:text-muted-foreground">Event</th>
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground dark:text-muted-foreground">Type</th>
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground dark:text-muted-foreground">Status</th>
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground dark:text-muted-foreground">Time</th>
 </tr>
 </thead>
 <tbody>
 {DELIVERIES.map((delivery) => (
 <tr 
 key={delivery.id} 
 onClick={() => setSelectedDelivery(delivery)}
 className={cn(
 "border-b border-border dark:border-white/5 last:border-0 cursor-pointer transition-colors",
 selectedDelivery.id === delivery.id ? "bg-muted dark:bg-white/10" : "hover:bg-muted/50/50 dark:hover:bg-[#1a1a1a]/50"
 )}
 >
 <td className="px-6 py-3">
 <div className="flex items-center gap-2">
 {delivery.isRetry && <RotateCcw className="size-3 text-amber-500" />}
 <span className="text-[12px] font-mono text-foreground dark:text-[#F0EFE2]">{delivery.id}</span>
 </div>
 </td>
 <td className="px-6 py-3">
 <span className="px-1.5 py-0.5 rounded bg-muted dark:bg-white/10 text-[10px] font-mono font-medium text-muted-foreground dark:text-[#aaa]">{delivery.type}</span>
 </td>
 <td className="px-6 py-3">
 <StatusBadge status={delivery.status} />
 </td>
 <td className="px-6 py-3">
 <span className="text-[13px] text-foreground/80 dark:text-[#C8C7BA]">{delivery.time}</span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 );

 const renderInspector = () => (
 <div className="flex flex-col h-full w-full">
 <div className="flex items-center gap-3 px-6 py-6 border-b border-border dark:border-white/5 bg-muted/50 dark:bg-[#030303]">
 <Webhook className="size-4 text-muted-foreground" />
 <span className="text-[13px] font-medium text-foreground dark:text-[#eee]">Delivery Inspector</span>
 {selectedDelivery.status === "200 OK" && <StatusBadge status="pass" />}
 {selectedDelivery.status !== "200 OK" && <StatusBadge status="error" />}
 </div>
 
 <div className="flex-1 p-6 flex flex-col gap-8">
 
 {/* Delivery Flow Signature UI */}
 <div className="flex flex-col gap-3">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Delivery Flow</span>
 <div className="flex items-center justify-between rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#111] p-6">
 <div className="flex flex-col items-center gap-2">
 <div className="size-8 rounded-full bg-muted dark:bg-white/10 flex items-center justify-center">
 <Box className="size-4" />
 </div>
 <span className="text-[10px] font-bold tracking-wider uppercase">Epoch</span>
 </div>
 
 <div className="flex-1 flex flex-col items-center relative">
 <div className="w-full h-px bg-black/10 dark:bg-white/10 absolute top-1/2 -translate-y-1/2" />
 <div className="bg-card dark:bg-[#111] px-2 z-10">
 <ArrowRight className="size-3 text-muted-foreground" />
 </div>
 <span className="text-[10px] font-mono mt-2 text-muted-foreground z-10 bg-card dark:bg-[#111] px-1">{selectedDelivery.latency}</span>
 </div>

 <div className="flex flex-col items-center gap-2">
 <div className="size-8 rounded-full bg-[#0f52ff]/10 text-[#0f52ff] flex items-center justify-center">
 <Webhook className="size-4" />
 </div>
 <span className="text-[10px] font-bold tracking-wider uppercase">Endpoint</span>
 </div>

 <div className="flex-1 flex flex-col items-center relative">
 <div className="w-full h-px bg-black/10 dark:bg-white/10 absolute top-1/2 -translate-y-1/2" />
 <div className="bg-card dark:bg-[#111] px-2 z-10">
 <ArrowRight className="size-3 text-muted-foreground" />
 </div>
 <span className="text-[10px] font-mono mt-2 text-muted-foreground z-10 bg-card dark:bg-[#111] px-1">{selectedDelivery.status}</span>
 </div>

 <div className="flex flex-col items-center gap-2">
 <div className={cn("size-8 rounded-full flex items-center justify-center", selectedDelivery.status === "200 OK" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>
 {selectedDelivery.status === "200 OK" ? <CheckCircle2 className="size-4" /> : <Activity className="size-4" />}
 </div>
 <span className="text-[10px] font-bold tracking-wider uppercase">Customer</span>
 </div>
 </div>
 </div>

 <div className="flex flex-col gap-2">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Request Headers</span>
 <CodeBlock code={HEADERS_JSON} language="json" />
 </div>

 <div className="flex flex-col gap-2">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Request Payload</span>
 <CodeBlock code={PAYLOAD_JSON} language="json" />
 </div>

 <div className="flex flex-col gap-2">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Response Body</span>
 <CodeBlock code={RESPONSE_JSON} language="json" className="bg-card dark:bg-[#111] border-none" />
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
