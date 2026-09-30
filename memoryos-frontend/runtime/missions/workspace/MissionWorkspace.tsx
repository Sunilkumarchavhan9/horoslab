"use client";

import { useState, useCallback, useMemo } from "react";
import { 
 X, Play, Square, CheckCircle, CheckCircle2, Search, Terminal, Plus, ArrowRight,
 Clock, ShieldAlert, GitCommit, FileCode2, MessagesSquare, Check, XCircle,
 FastForward, Pause, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemePreference } from "@/lib/continuity-lab/use-theme-preference";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import {
 ReactFlow,
 Controls,
 Background,
 useNodesState,
 useEdgesState,
 addEdge,
 MarkerType,
 MiniMap
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// --- MOCK DATA ---
const INITIAL_NODES = [
 { id: '1', position: { x: 50, y: 50 }, data: { label: 'Mission Created' }, type: 'input' },
 { id: '2', position: { x: 50, y: 150 }, data: { label: 'Planner Agent' } },
 { id: '3', position: { x: -100, y: 250 }, data: { label: 'Research Agent' } },
 { id: '4', position: { x: 200, y: 250 }, data: { label: 'Coding Agent' } },
 { id: '5', position: { x: 50, y: 350 }, data: { label: 'Reviewer Agent' } },
 { id: '6', position: { x: 50, y: 450 }, data: { label: 'Verifier' } },
 { id: '7', position: { x: 50, y: 550 }, data: { label: 'Settlement' }, type: 'output' },
];

const INITIAL_EDGES = [
 { id: 'e1-2', source: '1', target: '2', animated: true },
 { id: 'e2-3', source: '2', target: '3' },
 { id: 'e2-4', source: '2', target: '4', animated: true },
 { id: 'e3-5', source: '3', target: '5' },
 { id: 'e4-5', source: '4', target: '5', animated: true },
 { id: 'e5-6', source: '5', target: '6', animated: true },
 { id: 'e6-7', source: '6', target: '7' },
];

const TIMELINE = [
 { id: "t1", status: "complete", title: "Mission Created", time: "10:00 AM" },
 { id: "t2", status: "complete", title: "Planner Assigned", time: "10:01 AM" },
 { id: "t3", status: "complete", title: "Research Phase", time: "10:02 AM" },
 { id: "t4", status: "active", title: "Code Execution", time: "Running..." },
 { id: "t5", status: "pending", title: "Peer Review", time: "Waiting" },
 { id: "t6", status: "pending", title: "Verification", time: "Waiting" },
 { id: "t7", status: "pending", title: "Settlement", time: "Waiting" },
];

const ACTIVITY_FEED = [
 { id: "a1", icon: <CheckCircle className="size-3 text-green-500" />, text: "Worker started", time: "1m ago" },
 { id: "a2", icon: <FileCode2 className="size-3 text-blue-500" />, text: "Modified utils.ts", time: "45s ago" },
 { id: "a3", icon: <MessagesSquare className="size-3 text-amber-500" />, text: "Sent PR for review", time: "10s ago" },
];

// --- MAIN COMPONENT ---
export function MissionWorkspace({ 
 id, 
 onBack 
}: { 
 id?: string, 
 onBack?: () => void 
}) {
 const { resolved } = useThemePreference();
 const isDark = resolved === "dark";

 const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
 const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
 const [inspectorTab, setInspectorTab] = useState("Overview");

 // Custom colors based on theme
 const bgColor = isDark ? "#0a0a0a" : "#f9f9f9";
 const borderColor = isDark ? "border-white/10" : "border-border";
 const textMuted = isDark ? "text-white/50" : "text-foreground/50";
 const handleColor = isDark ? "bg-card/10 hover:bg-card/20" : "bg-black/10 hover:bg-black/20";

 return (
 <div className={cn("flex flex-col h-full w-full overflow-hidden font-sans", isDark ? "bg-[#0a0a0a] text-white" : "bg-[#F9F9F9] text-foreground")}>
 
 {/* HEADER */}
 <header className={cn("px-6 py-3 shrink-0 flex items-center justify-between border-b z-20", borderColor, isDark ? "bg-[#121212]" : "bg-card")}>
 <div className="flex items-center gap-6">
 {onBack && (
 <button onClick={onBack} className={cn("px-2 py-1.5 rounded text-[13px] font-medium border flex items-center gap-1", isDark ? "border-white/10 hover:bg-card/5 text-white/70" : "border-border hover:bg-accent text-foreground/70")}>
 ← Back
 </button>
 )}
 <div className="flex flex-col">
 <div className="flex items-center gap-2">
 <h1 className="text-[15px] font-bold tracking-tight">{id || "Active Mission"}</h1>
 <span className="px-1.5 py-0.5 rounded-[4px] bg-blue-500/10 text-blue-600 text-[10px] font-bold uppercase tracking-wider border border-blue-500/20">Running</span>
 </div>
 <div className="flex items-center gap-6 mt-1 text-[12px]">
 <span className={textMuted}>Institution: <strong className={isDark ? "text-white/90" : "text-foreground/90"}>Engineering</strong></span>
 <span className={textMuted}>Owner: <strong className={isDark ? "text-white/90" : "text-foreground/90"}>Dhyra Planner</strong></span>
 <span className={textMuted}>Priority: <strong className={isDark ? "text-white/90" : "text-foreground/90"}>P1</strong></span>
 <span className={textMuted}>Risk: <strong className="text-amber-500">Medium</strong></span>
 <span className={textMuted}>Runtime: <strong className={isDark ? "text-white/90" : "text-foreground/90"}>14m 23s</strong></span>
 </div>
 </div>
 </div>
 
 <div className="flex items-center gap-2">
 <button className={cn("px-3 py-1.5 rounded-md text-[12.5px] font-medium transition-colors border flex items-center gap-1.5", isDark ? "hover:bg-card/5 border-white/20" : "hover:bg-accent border-black/20")}>
 <FastForward className="size-3.5" /> Replay
 </button>
 <button className={cn("px-3 py-1.5 rounded-md text-[12.5px] font-medium transition-colors border flex items-center gap-1.5", isDark ? "hover:bg-card/5 border-white/20" : "hover:bg-accent border-black/20")}>
 <Pause className="size-3.5" /> Pause
 </button>
 <button className={cn("px-3 py-1.5 rounded-md text-[12.5px] font-medium transition-colors border flex items-center gap-1.5 text-red-500 border-red-500/20 bg-red-500/5 hover:bg-red-500/10")}>
 <Square className="size-3.5" /> Terminate
 </button>
 <button className="px-3 py-1.5 rounded-md bg-[#0f52ff] text-white text-[12.5px] font-medium hover:bg-[#0f52ff]/90 transition-colors flex items-center gap-1.5 ml-2 ">
 <CheckCircle className="size-3.5" /> Approve Action
 </button>
 </div>
 </header>

 {/* WORKSPACE PANELS */}
 <div className="flex-1 overflow-hidden">
 <ResizablePanelGroup direction="horizontal">
 
 {/* LEFT PANEL: TIMELINE */}
 <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
 <div className={cn("h-full border-r flex flex-col", borderColor, isDark ? "bg-[#0a0a0a]" : "bg-card")}>
 <div className={cn("px-6 py-3 border-b text-[12px] font-semibold uppercase tracking-wider opacity-70", borderColor)}>
 Timeline
 </div>
 <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-0 relative">
 <div className={cn("absolute left-6 top-6 bottom-6 w-px", isDark ? "bg-card/10" : "bg-black/10")} />
 {TIMELINE.map((step, i) => (
 <div key={step.id} className="flex gap-3 relative pb-6 last:pb-0 group cursor-pointer" onClick={() => setInspectorTab("Overview")}>
 <div className={cn("size-4 rounded-full mt-0.5 shrink-0 z-10 border-2 transition-transform group-hover:scale-125", isDark ? "border-[#0a0a0a]" : "border-[#f4f4f4]", 
 step.status === "complete" ? "bg-green-500" : step.status === "active" ? "bg-[#0f52ff] shadow-[0_0_8px_rgba(15,82,255,0.5)]" : isDark ? "bg-card/20" : "bg-black/20"
 )} />
 <div className="flex flex-col -mt-1 group-hover:translate-x-1 transition-transform">
 <span className={cn("text-[13px] font-medium", step.status === "pending" ? textMuted : isDark ? "text-white" : "text-foreground")}>{step.title}</span>
 <span className={cn("text-[11px] mt-0.5", textMuted)}>{step.time}</span>
 </div>
 </div>
 ))}
 </div>
 </div>
 </ResizablePanel>

 <ResizableHandle withHandle className="cursor-col-resize hover:bg-[#0f52ff]/50 active:bg-[#0f52ff] transition-colors" />

 {/* CENTER PANEL: CANVAS & ACTIVITY */}
 <ResizablePanel defaultSize={50} minSize={30}>
 <ResizablePanelGroup direction="vertical">
 
 {/* CANVAS */}
 <ResizablePanel defaultSize={70} minSize={30}>
 <div className={cn("h-full relative", isDark ? "bg-[#050505]" : "bg-card")}>
 <ReactFlow
 nodes={nodes.map(n => ({
 ...n,
 style: {
 background: isDark ? '#1a1a1a' : '#ffffff',
 color: isDark ? '#ffffff' : '#000000',
 border: `1px solid ${isDark ? '#333333' : '#e5e5e5'}`,
 borderRadius: '6px',
 padding: '10px 14px',
 fontSize: '12.5px',
 fontWeight: '500',
 boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
 }
 }))}
 edges={edges.map(e => ({
 ...e,
 style: { stroke: isDark ? '#444' : '#ccc', strokeWidth: 2 }
 }))}
 onNodesChange={onNodesChange}
 onEdgesChange={onEdgesChange}
 colorMode={isDark ? 'dark' : 'light'}
 fitView
 >
 <Background color={isDark ? '#333' : '#ddd'} gap={16} />
 <Controls className="opacity-0 group-hover:opacity-100 transition-opacity" />
 </ReactFlow>

 {/* Worker Cards Overlay (Bottom Left) */}
 <div className="absolute bottom-4 left-4 flex gap-6 pointer-events-none">
 <div className={cn("pointer-events-auto p-3.5 rounded-md border flex flex-col gap-2 w-64 backdrop-blur-md", isDark ? "bg-black/80 border-white/10" : "bg-card/80 border-border")}>
 <div className="flex items-center gap-2 mb-1">
 <div className="size-6 rounded-md bg-purple-500/20 flex items-center justify-center text-purple-500"><Terminal className="size-3.5" /></div>
 <div className="flex flex-col">
 <span className="text-[12.5px] font-bold">Coding Agent</span>
 <span className={cn("text-[10px]", textMuted)}>Claude 3.5 Sonnet</span>
 </div>
 <span className="ml-auto flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></span>
 </div>
 <div className="grid grid-cols-3 gap-2 text-[11px] mt-1 border-t pt-2 border-border dark:border-white/5">
 <div className="flex flex-col"><span className={textMuted}>Files</span><span className="font-semibold text-blue-500">17</span></div>
 <div className="flex flex-col"><span className={textMuted}>Tokens</span><span className="font-semibold text-purple-500">23k</span></div>
 <div className="flex flex-col"><span className={textMuted}>Runtime</span><span className="font-semibold">2m</span></div>
 </div>
 <button className="w-full py-1.5 mt-1 rounded bg-muted dark:bg-white/10 text-[11px] font-medium hover:bg-black/10 dark:hover:bg-card/20 transition-colors">View Live Output</button>
 </div>
 </div>

 {/* Mission Chat Overlay (Top Right) */}
 <div className="absolute top-4 right-4 bottom-4 w-72 pointer-events-none flex flex-col justify-end">
 <div className={cn("pointer-events-auto p-6 rounded-md border flex flex-col gap-3 backdrop-blur-md max-h-full overflow-y-auto custom-scrollbar", isDark ? "bg-black/60 border-white/10" : "bg-card/60 border-border")}>
 <div className="flex items-center gap-2 pb-2 border-b border-border dark:border-white/5">
 <MessagesSquare className="size-4 opacity-50" />
 <span className="text-[12px] font-bold uppercase tracking-wider opacity-70">Mission Chat</span>
 </div>
 
 {/* Chat Messages */}
 <div className="flex flex-col gap-3 text-[12px]">
 <div className="flex flex-col gap-1">
 <span className="font-semibold text-[#0f52ff]">Human</span>
 <span className={cn("p-2 rounded-md bg-muted dark:bg-white/10", isDark ? "text-white" : "text-foreground")}>Please update the authentication logic in main.ts.</span>
 </div>

 <div className="flex flex-col gap-1">
 <span className="font-semibold text-purple-500">Planner Agent</span>
 <span className={cn("p-2 rounded-md bg-muted dark:bg-white/10", isDark ? "text-white" : "text-foreground")}>I assigned the Coding Agent and prepared the work for review.</span>
 </div>

 <div className="flex flex-col gap-1">
 <span className="font-semibold text-green-500">Coding Agent</span>
 <span className={cn("p-2 rounded-md bg-muted dark:bg-white/10", isDark ? "text-white" : "text-foreground")}>Changes applied. Evidence #42 is ready.</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 </ResizablePanel>

 {/* LIVE ACTIVITY */}
 <ResizablePanel defaultSize={30} minSize={15}>
 <div className={cn("h-full border-t", borderColor, isDark ? "bg-[#0a0a0a]" : "bg-card")}>
 <div className={cn("px-6 py-3 border-b text-[12px] font-semibold uppercase tracking-wider opacity-70 flex items-center justify-between", borderColor)}>
 <span>Live Activity Feed</span>
 <span className="text-[10px] text-green-500">Streaming</span>
 </div>
 <div className="space-y-3 p-6">
 {ACTIVITY_FEED.map((activity) => (
 <div key={activity.id} className="flex items-center gap-3 text-[12px]">
 {activity.icon}
 <span className={textMuted}>{activity.text}</span>
 <span className="ml-auto text-[11px] text-muted-foreground">{activity.time}</span>
 </div>
 ))}
 <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
 <Loader2 className="size-3 animate-spin" /> Waiting for agent completion...
 </div>
 </div>
 </div>
 </ResizablePanel>
 </ResizablePanelGroup>
 </ResizablePanel>
 </ResizablePanelGroup>
 </div>
 </div>
 )
}
