"use client";

import React, { useState, useMemo } from "react";
import { 
 Activity, 
 Workflow, 
 Search, 
 CheckCircle2, 
 AlertTriangle, 
 Clock, 
 Server, 
 ShieldAlert, 
 Cpu, 
 ShieldCheck, 
 FileText, 
 Database,
 Building
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CommandBar, SectionHeader, KPICard, InspectorModal } from "./observe-shared-components";
import {
 ReactFlow,
 useNodesState,
 useEdgesState,
 Handle,
 Position,
 BaseEdge,
 getBezierPath,
 EdgeProps
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// --- Custom Nodes for Runtime Topology ---

const OrgNode = ({ data }: any) => (
 <div className="flex flex-col items-center">
 <Handle type="target" position={Position.Top} className="opacity-0" />
 <div className="p-6 bg-card dark:bg-[#121212] border border-border dark:border-white/10 rounded-md flex items-center justify-center min-w-[200px]">
 <span className="text-[14px] font-bold tracking-tight">{data.label}</span>
 </div>
 <Handle type="source" position={Position.Bottom} className="opacity-0" />
 </div>
);

const InstNode = ({ data }: any) => (
 <div className="flex flex-col items-center">
 <Handle type="target" position={Position.Top} className="opacity-0" />
 <div className="p-6 bg-[#0f52ff]/10 border border-[#0f52ff]/30 text-[#0f52ff] rounded-md flex items-center justify-center min-w-[200px]">
 <span className="text-[14px] font-bold tracking-tight">{data.label}</span>
 </div>
 <Handle type="source" position={Position.Bottom} className="opacity-0" />
 </div>
);

const RuntimeCoreNode = ({ data }: any) => (
 <div className="flex flex-col items-center">
 <Handle type="target" position={Position.Top} className="opacity-0" />
 <div className="p-6 bg-black text-[#F0EFE2] dark:bg-white dark:text-black rounded-md shadow-xl flex items-center justify-center min-w-[240px] border border-white/20 dark:border-black/20">
 <Activity className="size-5 mr-3 animate-pulse text-emerald-400 dark:text-emerald-600" />
 <span className="text-[16px] font-bold tracking-tight">{data.label}</span>
 </div>
 <Handle type="source" position={Position.Bottom} className="opacity-0" />
 </div>
);

const ServiceNode = ({ data }: any) => {
 const Icon = data.icon;
 return (
 <div className="flex flex-col items-center group cursor-pointer" onClick={() => data.onClick(data.label)}>
 <Handle type="target" position={Position.Top} className="opacity-0" />
 <div className={cn(
 "p-6 bg-card dark:bg-[#121212] border rounded-md flex flex-col items-center justify-center min-w-[160px] transition-all group-hover:scale-105 group-hover:",
 data.status === "healthy" ? "border-emerald-500/30" :
 data.status === "warning" ? "border-amber-500/50" : "border-red-500/50"
 )}>
 <Icon className={cn(
 "size-6 mb-2",
 data.status === "healthy" ? "text-emerald-500" :
 data.status === "warning" ? "text-amber-500" : "text-red-500"
 )} />
 <span className="text-[13px] font-bold tracking-tight">{data.label}</span>
 <div className="flex items-center gap-1 mt-1 opacity-60">
 <div className={cn("size-2 rounded-full", data.status === "healthy" ? "bg-emerald-500" : data.status === "warning" ? "bg-amber-500" : "bg-red-500")} />
 <span className="text-[10px] uppercase font-bold tracking-widest">{data.status}</span>
 </div>
 </div>
 <Handle type="source" position={Position.Bottom} className="opacity-0" />
 </div>
 );
};

// --- Custom Edge ---
const AnimatedStatusEdge = ({
 id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data
}: EdgeProps) => {
 const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
 return (
 <>
 <BaseEdge path={edgePath} style={{ strokeWidth: 2, strokeOpacity: 0.1, stroke: 'currentColor' }} />
 <path
 d={edgePath}
 fill="none"
 stroke={(data as any)?.color || "#0f52ff"}
 strokeWidth={2}
 className="react-flow__edge-path animate-[dash_15s_linear_infinite]"
 style={{ strokeDasharray: '6, 6' }}
 />
 </>
 );
};

const MOCK_SERVICES = [
 { id: '1', name: "Execution Planner", status: "Healthy", latency: "12ms", workers: 4, queue: 0 },
 { id: '2', name: "Worker Pool Alpha", status: "Healthy", latency: "45ms", workers: 12, queue: 3 },
 { id: '3', name: "Verification Engine", status: "Warning", latency: "240ms", workers: 2, queue: 14 },
 { id: '4', name: "Evidence Store", status: "Healthy", latency: "8ms", workers: 1, queue: 0 },
 { id: '5', name: "Settlement Ledger", status: "Healthy", latency: "15ms", workers: 1, queue: 0 },
 { id: '6', name: "Observe Telemetry", status: "Healthy", latency: "4ms", workers: 3, queue: 0 },
];

export function ObserveRuntime() {
 const [inspectorOpen, setInspectorOpen] = useState(false);
 const [inspectorTarget, setInspectorTarget] = useState("");

 const handleNodeClick = (label: string) => {
 setInspectorTarget(label);
 setInspectorOpen(true);
 };

 const nodeTypes = useMemo(() => ({
 orgNode: OrgNode,
 instNode: InstNode,
 coreNode: RuntimeCoreNode,
 serviceNode: ServiceNode
 }), []);

 const edgeTypes = useMemo(() => ({
 statusEdge: AnimatedStatusEdge,
 }), []);

 const initialNodes = [
 { id: 'org', type: 'orgNode', position: { x: 400, y: 0 }, data: { label: 'Acme Corp Organization' } },
 { id: 'inst', type: 'instNode', position: { x: 400, y: 120 }, data: { label: 'Engineering Institution' } },
 { id: 'core', type: 'coreNode', position: { x: 400, y: 240 }, data: { label: 'Active Institution Runtime' } },
 
 { id: 's1', type: 'serviceNode', position: { x: 0, y: 400 }, data: { label: 'Planner', icon: Workflow, status: 'healthy', onClick: handleNodeClick } },
 { id: 's2', type: 'serviceNode', position: { x: 180, y: 400 }, data: { label: 'Workers', icon: Cpu, status: 'healthy', onClick: handleNodeClick } },
 { id: 's3', type: 'serviceNode', position: { x: 360, y: 400 }, data: { label: 'Verification', icon: ShieldCheck, status: 'warning', onClick: handleNodeClick } },
 { id: 's4', type: 'serviceNode', position: { x: 540, y: 400 }, data: { label: 'Evidence', icon: FileText, status: 'healthy', onClick: handleNodeClick } },
 { id: 's5', type: 'serviceNode', position: { x: 720, y: 400 }, data: { label: 'Settlement', icon: Database, status: 'healthy', onClick: handleNodeClick } },
 { id: 's6', type: 'serviceNode', position: { x: 900, y: 400 }, data: { label: 'Observe', icon: Activity, status: 'healthy', onClick: handleNodeClick } },
 ];

 const initialEdges = [
 { id: 'e1', source: 'org', target: 'inst', type: 'statusEdge', data: { color: 'currentColor' } },
 { id: 'e2', source: 'inst', target: 'core', type: 'statusEdge', data: { color: '#0f52ff' } },
 { id: 'e3', source: 'core', target: 's1', type: 'statusEdge', data: { color: '#10b981' } },
 { id: 'e4', source: 'core', target: 's2', type: 'statusEdge', data: { color: '#10b981' } },
 { id: 'e5', source: 'core', target: 's3', type: 'statusEdge', data: { color: '#f59e0b' } },
 { id: 'e6', source: 'core', target: 's4', type: 'statusEdge', data: { color: '#10b981' } },
 { id: 'e7', source: 'core', target: 's5', type: 'statusEdge', data: { color: '#10b981' } },
 { id: 'e8', source: 'core', target: 's6', type: 'statusEdge', data: { color: '#10b981' } },
 ];

 const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
 const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

 return (
 <div className="flex flex-col h-full w-full bg-[#FBFBFB] dark:bg-[#030303] text-foreground dark:text-[#F0EFE2] font-sans overflow-hidden">
 <CommandBar>
 <div className="flex items-center gap-2">
 <Activity className="size-4 text-[#0f52ff]" />
 <span className="text-[13px] font-bold tracking-wide">Observe / Runtime</span>
 </div>
 </CommandBar>

 <div className="flex-1 overflow-y-auto custom-scrollbar">
 <div className="p-10 w-full mx-auto flex flex-col gap-10">
 
 <SectionHeader 
 title="Enterprise Runtime Topology" 
 description="Live health and status of the entire autonomous operating system. Click any node to inspect."
 className="mb-0"
 />

 <div className="grid grid-cols-5 gap-6">
 <KPICard title="Running Missions" value="12" trend="up" trendValue="2" index={0} />
 <KPICard title="Active Agents" value="48" trend="up" trendValue="5%" index={1} />
 <KPICard title="Healthy Inst" value="3/3" trend="neutral" trendValue="Same" index={2} />
 <KPICard title="Global Queue" value="17" subtext="Pending tasks" trend="up" trendValue="10" index={3} />
 <KPICard title="Sys Latency" value="45ms" trend="down" trendValue="2ms" index={4} />
 </div>

 <div className="relative w-full h-[550px]">
 <ReactFlow
 nodes={nodes}
 edges={edges}
 onNodesChange={onNodesChange}
 onEdgesChange={onEdgesChange}
 nodeTypes={nodeTypes}
 edgeTypes={edgeTypes}
 fitView
 fitViewOptions={{ padding: 0.1 }}
 nodesDraggable={false}
 nodesConnectable={false}
 zoomOnScroll={false}
 panOnDrag={true}
 proOptions={{ hideAttribution: true }}
 className="react-flow-clean"
 />
 </div>

 <div>
 <h3 className="text-[18px] font-bold tracking-tight mb-6">Runtime Health Grid</h3>
 <div className="border border-border dark:border-white/10 rounded-md overflow-hidden bg-card/50 dark:bg-[#121212]/50 backdrop-blur-md">
 <table className="w-full text-left text-[14px]">
 <thead className="bg-card dark:bg-[#050505] text-[12px] font-bold uppercase tracking-widest text-foreground/50 dark:text-[#F0EFE2]/50 border-b border-border dark:border-white/10">
 <tr>
 <th className="p-6 font-medium">Service</th>
 <th className="p-6 font-medium">Status</th>
 <th className="p-6 font-medium">Active Workers</th>
 <th className="p-6 font-medium">Latency</th>
 <th className="p-6 font-medium">Queue Depth</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-black/5 dark:divide-white/5">
 {MOCK_SERVICES.map((s, i) => (
 <tr key={s.id} className="hover:bg-accent dark:hover:bg-card/5 transition-colors cursor-pointer" onClick={() => handleNodeClick(s.name)}>
 <td className="p-6 font-bold">{s.name}</td>
 <td className="p-6">
 <div className="flex items-center gap-2">
 <div className={cn("size-2 rounded-full", s.status === "Healthy" ? "bg-emerald-500" : s.status === "Warning" ? "bg-amber-500" : "bg-red-500")} />
 <span className={cn("text-[13px] font-bold", s.status === "Healthy" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>{s.status}</span>
 </div>
 </td>
 <td className="p-6 font-mono text-[13px] text-foreground/70 dark:text-[#F0EFE2]/70">{s.workers} nodes</td>
 <td className="p-6 font-mono text-[13px] text-foreground/70 dark:text-[#F0EFE2]/70">{s.latency}</td>
 <td className="p-6 font-mono text-[13px] text-foreground/70 dark:text-[#F0EFE2]/70">{s.queue} tasks</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 </div>

 <InspectorModal 
 isOpen={inspectorOpen} 
 onClose={() => setInspectorOpen(false)} 
 title={`Inspector: ${inspectorTarget}`}
 subtitle="Live telemetry data streaming directly from the runtime."
 >
 <div className="space-y-6">
 <div className="grid grid-cols-2 gap-6">
 <div className="p-6 rounded-md border border-border dark:border-white/10 bg-card/50 dark:bg-[#121212]/50">
 <span className="text-[11px] font-bold uppercase tracking-widest text-foreground/40 dark:text-[#F0EFE2]/40 block mb-2">CPU Usage</span>
 <div className="flex items-end gap-2">
 <span className="text-[24px] font-mono font-bold">14.2%</span>
 <span className="text-[12px] font-bold text-emerald-500 mb-1">Normal</span>
 </div>
 </div>
 <div className="p-6 rounded-md border border-border dark:border-white/10 bg-card/50 dark:bg-[#121212]/50">
 <span className="text-[11px] font-bold uppercase tracking-widest text-foreground/40 dark:text-[#F0EFE2]/40 block mb-2">Memory</span>
 <div className="flex items-end gap-2">
 <span className="text-[24px] font-mono font-bold">2.4 GB</span>
 <span className="text-[12px] font-bold text-emerald-500 mb-1">Stable</span>
 </div>
 </div>
 </div>

 <div className="p-6 rounded-md border border-border dark:border-white/10 bg-muted dark:bg-white/5">
 <h4 className="text-[13px] font-bold mb-3">Recent Logs</h4>
 <div className="font-mono text-[11px] text-foreground/60 dark:text-[#F0EFE2]/60 space-y-2">
 <p>[INFO] Heartbeat synchronized across all workers (12ms latency)</p>
 <p>[INFO] Processed 42 evidence assertions in the last 60s</p>
 <p className={inspectorTarget.includes('Verification') ? "text-amber-500" : ""}>
 {inspectorTarget.includes('Verification') ? "[WARN] Verification queue depth increasing beyond threshold (14 tasks)" : "[INFO] Awaiting new mission dispatches from Planner"}
 </p>
 </div>
 </div>
 </div>
 </InspectorModal>

 <style dangerouslySetInnerHTML={{__html: `
 @keyframes dash { to { stroke-dashoffset: -100; } }
 `}} />
 </div>
 );
}
