"use client";

import React, { useState, useMemo } from "react";
import { Shield, Key, AlertTriangle, Search, CheckCircle2, XCircle, Building, Bot, GitMerge, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { CommandBar, SectionHeader, KPICard, MOCK_AUTHORITY_GRANTS } from "./governance-shared-components";
import {
 ReactFlow,
 useNodesState,
 useEdgesState,
 Handle,
 Position,
 BaseEdge,
 getBezierPath,
 EdgeProps,
 EdgeLabelRenderer
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// --- Custom Nodes ---

const OrgNode = ({ data }: any) => (
 <div className="flex flex-col items-center">
 <Handle type="target" position={Position.Top} className="opacity-0" />
 <div className="p-6 bg-card dark:bg-[#121212] border border-border dark:border-white/5 rounded-3xl shadow-xl flex flex-col items-center w-[360px]">
 <div className="size-16 rounded-md bg-muted dark:bg-white/5 flex items-center justify-center mb-4"><Building className="size-8 text-foreground/60 dark:text-white/60" /></div>
 <span className="text-[20px] font-bold tracking-tight text-foreground dark:text-white">{data.label}</span>
 </div>
 <Handle type="source" position={Position.Bottom} className="opacity-0" />
 </div>
);

const InstNode = ({ data }: any) => (
 <div className="flex flex-col items-center">
 <Handle type="target" position={Position.Top} className="opacity-0" />
 <div className="p-6 bg-card dark:bg-[#121212] border border-border dark:border-white/5 rounded-3xl shadow-xl flex items-center gap-6 w-[360px]">
 <div className="size-16 rounded-md bg-[#0f52ff]/10 flex items-center justify-center"><Shield className="size-8 text-[#0f52ff]" /></div>
 <span className="text-[20px] font-bold tracking-tight text-foreground dark:text-white">{data.label}</span>
 </div>
 <Handle type="source" position={Position.Bottom} className="opacity-0" />
 </div>
);

const AgentNode = ({ data }: any) => (
 <div className="flex flex-col items-center">
 <Handle type="target" position={Position.Top} className="opacity-0" />
 <div className="p-6 bg-card dark:bg-[#121212] border border-[#0f52ff]/30 rounded-3xl shadow-[0_10px_40px_rgba(15,82,255,0.15)] flex items-center gap-6 w-[360px] relative overflow-hidden">
 <div className="absolute inset-y-0 left-0 w-2 bg-[#0f52ff]" />
 <div className="size-16 rounded-md bg-[#0f52ff]/10 text-[#0f52ff] flex items-center justify-center ml-2"><Bot className="size-8" /></div>
 <div className="flex flex-col">
 <span className="text-[20px] font-bold tracking-tight text-foreground dark:text-white">{data.label}</span>
 <span className="text-[12px] font-bold text-[#0f52ff] uppercase tracking-wider mt-1">Active Session</span>
 </div>
 </div>
 <Handle type="source" position={Position.Bottom} className="opacity-0" />
 </div>
);

const ActionNode = ({ data }: any) => (
 <div className="flex flex-col items-center">
 <Handle type="target" position={Position.Top} className="opacity-0" />
 <div className="p-6 bg-card dark:bg-[#121212] border border-amber-500/40 rounded-3xl shadow-[0_10px_40px_rgba(245,158,11,0.15)] flex items-center gap-6 w-[360px] relative overflow-hidden">
 <div className="absolute inset-y-0 left-0 w-2 bg-amber-500" />
 <div className="size-16 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center ml-2"><Key className="size-8" /></div>
 <div className="flex flex-col">
 <span className="text-[20px] font-bold tracking-tight text-foreground dark:text-white">{data.label}</span>
 <span className="text-[12px] font-bold text-amber-500 uppercase tracking-wider mt-1 animate-pulse">High Risk</span>
 </div>
 </div>
 <Handle type="source" position={Position.Bottom} className="opacity-0" />
 </div>
);

const TargetNode = ({ data }: any) => (
 <div className="flex flex-col items-center">
 <Handle type="target" position={Position.Top} className="opacity-0" />
 <div className="p-6 bg-[#0a0a0a] text-white dark:bg-white dark:text-black rounded-3xl shadow-2xl flex items-center gap-6 w-[360px] border border-white/10 dark:border-black/10">
 <div className="size-16 rounded-md bg-card/10 dark:bg-black/10 flex items-center justify-center"><GitMerge className="size-8" /></div>
 <span className="text-[20px] font-bold tracking-tight">{data.label}</span>
 </div>
 <Handle type="source" position={Position.Bottom} className="opacity-0" />
 </div>
);

// --- Custom Edge ---

const AnimatedGradientEdge = ({
 id,
 sourceX,
 sourceY,
 targetX,
 targetY,
 sourcePosition,
 targetPosition,
 style = {},
 markerEnd,
 data
}: EdgeProps) => {
 const [edgePath, labelX, labelY] = getBezierPath({
 sourceX,
 sourceY,
 sourcePosition,
 targetX,
 targetY,
 targetPosition,
 });

 return (
 <>
 <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, strokeWidth: 2, strokeOpacity: 0.1, stroke: 'currentColor' }} />
 {/* Animated Dash Path overlay */}
 <path
 d={edgePath}
 fill="none"
 stroke={(data as any)?.color || "#0f52ff"}
 strokeWidth={3}
 className="react-flow__edge-path animate-[dash_10s_linear_infinite]"
 style={{ strokeDasharray: '8, 8' }}
 />
 {(data as any)?.label && (
 <EdgeLabelRenderer>
 <div
 className="absolute p-2 bg-card dark:bg-[#121212] border border-border dark:border-white/10 rounded-md text-[12px] font-mono font-bold tracking-widest text-foreground/60 dark:text-white/60 pointer-events-none "
 style={{
 transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
 }}
 >
 {(data as any).label}
 </div>
 </EdgeLabelRenderer>
 )}
 </>
 );
};

export function GovernanceAuthority() {
 const [selectedGrant, setSelectedGrant] = useState<string | null>(null);

 // --- React Flow Setup ---
 const nodeTypes = useMemo(() => ({
 orgNode: OrgNode,
 instNode: InstNode,
 agentNode: AgentNode,
 actionNode: ActionNode,
 targetNode: TargetNode
 }), []);

 const edgeTypes = useMemo(() => ({
 animatedEdge: AnimatedGradientEdge,
 }), []);

 const initialNodes = [
 { id: '1', type: 'orgNode', position: { x: 0, y: 0 }, data: { label: 'Acme Corp' } },
 { id: '2', type: 'instNode', position: { x: 0, y: 180 }, data: { label: 'Engineering Institution' } },
 { id: '3', type: 'agentNode', position: { x: 0, y: 360 }, data: { label: 'Claude Reviewer' } },
 { id: '4', type: 'actionNode', position: { x: 0, y: 540 }, data: { label: 'Deploy Production' } },
 { id: '5', type: 'targetNode', position: { x: 0, y: 720 }, data: { label: 'GitHub Core API' } },
 ];

 const initialEdges = [
 { id: 'e1-2', source: '1', target: '2', type: 'animatedEdge', data: { color: 'currentColor', label: 'OWNS' } },
 { id: 'e2-3', source: '2', target: '3', type: 'animatedEdge', data: { color: '#0f52ff', label: 'ASSIGNS' } },
 { id: 'e3-4', source: '3', target: '4', type: 'animatedEdge', data: { color: '#f59e0b', label: 'EXECUTES' } },
 { id: 'e4-5', source: '4', target: '5', type: 'animatedEdge', data: { color: '#10b981', label: 'TARGETS' } },
 ];

 const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
 const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

 return (
 <div className="flex flex-col h-full w-full bg-card dark:bg-[#030303] text-foreground dark:text-white font-sans overflow-hidden relative">
 <CommandBar>
 <div className="flex items-center gap-2 w-1/2">
 <Shield className="size-4 text-[#0f52ff]" />
 <span className="text-[13px] font-bold text-foreground dark:text-white tracking-wide">Authority Engine</span>
 </div>
 </CommandBar>

 <div className="flex-1 overflow-y-auto custom-scrollbar relative z-0">
 <div className="flex flex-col h-full p-10 max-w-7xl mx-auto">
 <div className="flex items-center justify-between mb-8">
 <SectionHeader 
 title="Active Authority Graph" 
 description="Visualizing the chain of custody for all active IAM permissions granted to autonomous agents."
 className="mb-0"
 />
 <button 
 onClick={() => setSelectedGrant(MOCK_AUTHORITY_GRANTS[0].id)}
 className="px-6 py-2.5 bg-[#0f52ff] hover:bg-[#0042e6] text-white rounded-md font-bold tracking-wide shadow-[0_10px_20px_rgba(15,82,255,0.2)] transition-all hover:scale-105 flex items-center gap-2"
 >
 <Search className="size-4" /> Authority Ledger
 </button>
 </div>

 <div className="grid grid-cols-4 gap-6 mb-10 shrink-0">
 <KPICard title="Active Grants" value="142" trend="up" trendValue="12%" index={0} />
 <KPICard title="Pending" value="5" trend="neutral" trendValue="Same" index={1} />
 <KPICard title="High Risk" value="2" trend="down" trendValue="1" index={2} />
 <KPICard title="Revoked" value="18" subtext="Past 24 hours" index={3} />
 </div>

 <div className="relative w-full flex flex-col items-center justify-start h-[800px] mt-4">
 
 {/* Clean background - No dots, no grid */}
 <div className="absolute inset-0 bg-transparent pointer-events-none" />

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
 >
 {/* NO Background component to keep it minimalistic */}
 </ReactFlow>

 </div>
 </div>
 </div>

 {/* Center Modal Overlay */}
 <AnimatePresence>
 {selectedGrant && (
 <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none p-10">
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="absolute inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-md pointer-events-auto"
 onClick={() => setSelectedGrant(null)}
 />
 
 <motion.div 
 initial={{ opacity: 0, scale: 0.95, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 20 }}
 transition={{ type: "spring", damping: 25, stiffness: 300 }}
 className="relative w-full max-w-2xl bg-card/95 dark:bg-[#0a0a0a]/95 backdrop-blur-2xl border border-border dark:border-white/10 rounded-[2rem] shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[80vh]"
 >
 <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#0f52ff] to-transparent opacity-50" />
 
 <div className="flex items-center justify-between p-8 border-b border-border dark:border-white/10 shrink-0">
 <div className="flex flex-col gap-1">
 <h3 className="text-[20px] font-bold tracking-tight">Authority Ledger</h3>
 <p className="text-[13px] text-foreground/50 dark:text-white/50 mt-1">Direct agent access grants</p>
 </div>
 <button 
 onClick={() => setSelectedGrant(null)}
 className="size-10 rounded-full bg-muted dark:bg-white/5 flex items-center justify-center hover:bg-black/10 dark:hover:bg-card/10 transition-colors"
 >
 <X className="size-5" />
 </button>
 </div>

 <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-4">
 <AnimatePresence>
 {MOCK_AUTHORITY_GRANTS.map((grant, index) => (
 <motion.div 
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: index * 0.1 }}
 key={grant.id}
 className="flex flex-col p-6 rounded-md border border-border dark:border-white/10 bg-card/60 dark:bg-[#121212]/60 backdrop-blur-md "
 >
 <div className="flex items-center justify-between mb-5">
 <span className="text-[16px] font-bold tracking-tight">{grant.target}</span>
 {grant.status === "ACTIVE" && <CheckCircle2 className="size-5 text-emerald-500 drop-" />}
 {grant.status === "PENDING" && <AlertTriangle className="size-5 text-amber-500 drop-" />}
 {grant.status === "REVOKED" && <XCircle className="size-5 text-red-500 drop-" />}
 </div>
 <div className="flex items-center justify-between text-[13px]">
 <span className="text-foreground/60 dark:text-white/60 bg-muted dark:bg-white/5 px-3 py-1.5 rounded-md font-mono">{grant.scope}</span>
 <span className={cn(
 "font-bold px-3 py-1.5 rounded-md uppercase tracking-wider",
 grant.risk === "HIGH" || grant.risk === "CRITICAL" ? "bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400" : 
 grant.risk === "MEDIUM" ? "bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400" :
 "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
 )}>{grant.risk}</span>
 </div>
 </motion.div>
 ))}
 </AnimatePresence>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 <style dangerouslySetInnerHTML={{__html: `
 @keyframes dash {
 to {
 stroke-dashoffset: -100;
 }
 }
 `}} />
 </div>
 );
}
