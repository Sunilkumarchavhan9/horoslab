"use client";

import React, { useState, useMemo } from "react";
import { Users, Building, Shield, Bot, Check, X, Search, GitMerge, FileCode, Zap, Network } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { CommandBar, SectionHeader } from "./governance-shared-components";
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

// --- Custom Nodes for Roles ---

const OrgNode = ({ data }: any) => (
 <div className="p-6 bg-card dark:bg-[#121212] border border-border dark:border-white/5 rounded-3xl shadow-xl flex flex-col items-center w-[280px]">
 <div className="size-16 rounded-md bg-muted dark:bg-white/5 flex items-center justify-center mb-4">
 <Building className="size-8 text-foreground/60 dark:text-[#F0EFE2]/60" />
 </div>
 <span className="text-[20px] font-bold tracking-tight text-foreground dark:text-[#F0EFE2]">{data.label}</span>
 <Handle type="source" position={Position.Bottom} className="opacity-0" />
 </div>
);

const InstNode = ({ data }: any) => (
 <div className="flex flex-col items-center">
 <Handle type="target" position={Position.Top} className="opacity-0" />
 <div className={cn(
 "p-6 bg-card dark:bg-[#121212] border rounded-3xl shadow-xl flex items-center gap-6 w-[320px] transition-all",
 data.active ? "border-[#0f52ff]/30 shadow-[0_10px_40px_rgba(15,82,255,0.1)]" : "border-border dark:border-white/5 opacity-50 grayscale"
 )}>
 <div className={cn("size-14 rounded-md flex items-center justify-center", data.active ? "bg-[#0f52ff]/10 text-[#0f52ff]" : "bg-muted dark:bg-white/5 text-foreground/60 dark:text-[#F0EFE2]/60")}>
 {data.active ? <Shield className="size-6" /> : <Building className="size-6" />}
 </div>
 <span className="text-[18px] font-bold tracking-tight text-foreground dark:text-[#F0EFE2]">{data.label}</span>
 </div>
 <Handle type="source" position={Position.Bottom} className="opacity-0" />
 </div>
);

const RoleContainerNode = ({ data }: any) => (
 <div className="flex flex-col items-center">
 <Handle type="target" position={Position.Top} className="opacity-0" />
 <div className="p-6 bg-card/50 dark:bg-[#121212]/50 backdrop-blur-md border border-border dark:border-white/10 rounded-3xl flex flex-col items-center w-[320px]">
 <span className="text-[12px] font-bold uppercase tracking-widest text-foreground/40 dark:text-[#F0EFE2]/40 mb-5">Defined Roles</span>
 <div className="flex flex-col w-full gap-3">
 {data.roles.map((r: any, i: number) => (
 <div 
 key={i}
 onClick={() => data.onRoleClick(r.name)}
 className={cn(
 "flex items-center justify-between p-6 rounded-md border transition-all cursor-pointer",
 r.active 
 ? "bg-card dark:bg-[#121212] border-[#0f52ff]/40 hover:border-[#0f52ff]/60" 
 : "bg-card/50 dark:bg-[#121212]/50 border-border dark:border-white/10 opacity-60 hover:opacity-100"
 )}
 >
 <span className={cn("text-[15px] font-bold tracking-tight", r.active ? "text-foreground dark:text-[#F0EFE2]" : "text-foreground/60 dark:text-[#F0EFE2]/60")}>{r.name}</span>
 <Users className={cn("size-5", r.active ? "text-[#0f52ff]" : "text-foreground/40 dark:text-[#F0EFE2]/40")} />
 </div>
 ))}
 </div>
 </div>
 <Handle type="source" position={Position.Bottom} className="opacity-0" />
 </div>
);

const AgentNode = ({ data }: any) => (
 <div className="flex flex-col items-center">
 <Handle type="target" position={Position.Top} className="opacity-0" />
 <div className="p-6 bg-card dark:bg-[#121212] border border-emerald-500/30 rounded-3xl shadow-[0_10px_40px_rgba(16,185,129,0.15)] flex items-center gap-6 w-[320px] relative overflow-hidden">
 <div className="absolute inset-y-0 left-0 w-2 bg-emerald-500" />
 <div className="size-14 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center ml-2">
 <Bot className="size-7" />
 </div>
 <div className="flex flex-col">
 <span className="text-[18px] font-bold tracking-tight text-foreground dark:text-[#F0EFE2]">{data.label}</span>
 <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-1">Assigned Agent</span>
 </div>
 </div>
 <Handle type="source" position={Position.Bottom} className="opacity-0" />
 </div>
);

// --- Custom Animated Edge ---

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
 const [edgePath] = getBezierPath({
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
 <path
 d={edgePath}
 fill="none"
 stroke={(data as any)?.color || "#0f52ff"}
 strokeWidth={3}
 className="react-flow__edge-path animate-[dash_10s_linear_infinite]"
 style={{ strokeDasharray: '8, 8' }}
 />
 </>
 );
};

export function GovernanceRoles() {
 const [activeTab, setActiveTab] = useState<"Graph" | "Matrix">("Graph");
 const [hoveredRow, setHoveredRow] = useState<number | null>(null);
 const [hoveredCol, setHoveredCol] = useState<number | null>(null);
 const [inspectorOpen, setInspectorOpen] = useState(false);

 const roles = [
 { name: "Senior Reviewer", mpr: true, dp: false, rs: false, ab: false, isRed: false },
 { name: "Release Engineer", mpr: true, dp: true, rs: false, ab: false, isRed: false },
 { name: "Security Verifier", mpr: false, dp: false, rs: true, ab: false, isRed: true },
 { name: "Finance Admin", mpr: false, dp: false, rs: false, ab: true, isRed: false }
 ];

 // --- React Flow Setup ---
 const nodeTypes = useMemo(() => ({
 orgNode: OrgNode,
 instNode: InstNode,
 roleContainerNode: RoleContainerNode,
 agentNode: AgentNode
 }), []);

 const edgeTypes = useMemo(() => ({
 animatedEdge: AnimatedGradientEdge,
 }), []);

 const initialNodes = [
 { id: 'org', type: 'orgNode', position: { x: 400, y: 0 }, data: { label: 'Acme Corp' } },
 { id: 'inst1', type: 'instNode', position: { x: 200, y: 220 }, data: { label: 'Engineering', active: true } },
 { id: 'inst2', type: 'instNode', position: { x: 600, y: 220 }, data: { label: 'Finance', active: false } },
 { id: 'roles1', type: 'roleContainerNode', position: { x: 200, y: 400 }, data: { 
 roles: [{ name: "Senior Reviewer", active: true }, { name: "Release Engineer", active: false }],
 onRoleClick: () => setInspectorOpen(true)
 }},
 { id: 'agent1', type: 'agentNode', position: { x: 200, y: 650 }, data: { label: 'Claude 3.5 Sonnet' } },
 ];

 const initialEdges = [
 { id: 'e-org-inst1', source: 'org', target: 'inst1', type: 'animatedEdge', data: { color: '#0f52ff' } },
 { id: 'e-org-inst2', source: 'org', target: 'inst2', type: 'animatedEdge', data: { color: 'currentColor' } },
 { id: 'e-inst1-roles1', source: 'inst1', target: 'roles1', type: 'animatedEdge', data: { color: '#0f52ff' } },
 { id: 'e-roles1-agent1', source: 'roles1', target: 'agent1', type: 'animatedEdge', data: { color: '#10b981' } },
 ];

 const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
 const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

 return (
 <div className="flex flex-col h-full w-full bg-card dark:bg-[#030303] text-foreground dark:text-[#F0EFE2] font-sans overflow-hidden relative">
 <CommandBar>
 <div className="flex items-center gap-2 w-1/2">
 <Users className="size-4 text-[#0f52ff]" />
 <span className="text-[13px] font-bold text-foreground dark:text-[#F0EFE2] tracking-wide">Organization & Roles</span>
 </div>
 <div className="flex bg-muted dark:bg-white/5 p-1 rounded-md border border-border dark:border-white/10 shadow-inner">
 {["Graph", "Matrix"].map(tab => (
 <button 
 key={tab}
 onClick={() => setActiveTab(tab as any)}
 className={cn(
 "px-6 py-2 rounded-md text-[13px] font-bold transition-all flex items-center gap-2",
 activeTab === tab ? "bg-card dark:bg-[#121212] text-foreground dark:text-[#F0EFE2] " : "text-foreground/50 dark:text-[#F0EFE2]/50 hover:text-foreground dark:hover:text-[#F0EFE2]"
 )}
 >
 {tab === "Graph" ? <Network className="size-4" /> : <Shield className="size-4" />}
 {tab}
 </button>
 ))}
 </div>
 </CommandBar>

 <div className="flex-1 overflow-y-auto custom-scrollbar relative z-0">
 <div className="flex flex-col h-full p-10 max-w-7xl mx-auto">
 
 {activeTab === "Graph" && (
 <>
 <SectionHeader 
 title="Organization Capability Graph" 
 description="Visualizing the hierarchical capability structure across institutions and assigned agents."
 />

 <div className="relative w-full flex flex-col items-center justify-start h-[750px] mt-4">
 
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
 fitViewOptions={{ padding: 0.2 }}
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
 </>
 )}

 {activeTab === "Matrix" && (
 <>
 <SectionHeader 
 title="Capability Matrix" 
 description="Dense overview of exactly what roles map to what actions across the enterprise. Hover to inspect intersections."
 />
 
 <div className="border border-border dark:border-white/10 rounded-3xl overflow-hidden bg-card/80 dark:bg-[#121212]/80 backdrop-blur-2xl shadow-xl mt-4 max-w-6xl mx-auto w-full">
 <table className="w-full text-left text-[14px]">
 <thead className="bg-card dark:bg-[#050505] text-[12px] font-bold uppercase tracking-widest text-foreground/40 dark:text-[#F0EFE2]/40 border-b border-border dark:border-white/10">
 <tr>
 <th className="p-6 border-r border-border dark:border-white/10 bg-transparent">Role \ Capability</th>
 {["Merge PR", "Deploy Prod", "Read Secrets", "Approve Budget"].map((header, colIndex) => (
 <th 
 key={header} 
 className={cn("p-6 text-center transition-colors duration-300", hoveredCol === colIndex ? "bg-muted dark:bg-white/5 text-foreground dark:text-[#F0EFE2]" : "")}
 >
 {header}
 </th>
 ))}
 </tr>
 </thead>
 <tbody>
 {roles.map((role, rowIndex) => (
 <tr 
 key={role.name}
 onClick={() => setInspectorOpen(true)}
 onMouseEnter={() => setHoveredRow(rowIndex)}
 onMouseLeave={() => setHoveredRow(null)}
 className={cn(
 "border-b border-border dark:border-white/5 transition-colors duration-300 cursor-pointer",
 hoveredRow === rowIndex ? "bg-muted dark:bg-white/5" : "bg-transparent"
 )}
 >
 <td className={cn(
 "p-6 font-bold tracking-tight border-r border-border dark:border-white/10 transition-colors duration-300 flex items-center gap-3",
 hoveredRow === rowIndex ? "text-[#0f52ff]" : "",
 role.isRed ? "text-red-500" : ""
 )}>
 {role.isRed && <Zap className="size-4" />} {role.name}
 </td>
 {[role.mpr, role.dp, role.rs, role.ab].map((hasCap, colIndex) => (
 <td 
 key={colIndex}
 onMouseEnter={() => setHoveredCol(colIndex)}
 onMouseLeave={() => setHoveredCol(null)}
 className={cn(
 "p-6 text-center transition-all duration-300",
 hoveredCol === colIndex || hoveredRow === rowIndex ? "bg-muted dark:bg-white/5" : ""
 )}
 >
 {hasCap ? (
 <div className="flex justify-center">
 <div className={cn("size-6 rounded-full flex items-center justify-center ", role.isRed ? "bg-red-500/10" : "bg-emerald-500/10")}>
 <Check className={cn("size-4", role.isRed ? "text-red-500" : "text-emerald-500")} />
 </div>
 </div>
 ) : (
 <div className="flex justify-center">
 <X className="size-4 text-foreground/10 dark:text-[#F0EFE2]/10" />
 </div>
 )}
 </td>
 ))}
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </>
 )}

 </div>
 </div>

 {/* Center Modal Overlay */}
 <AnimatePresence>
 {inspectorOpen && (
 <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none p-10">
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="absolute inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-md pointer-events-auto"
 onClick={() => setInspectorOpen(false)}
 />
 
 <motion.div 
 initial={{ opacity: 0, scale: 0.95, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 20 }}
 transition={{ type: "spring", damping: 25, stiffness: 300 }}
 className="relative w-full max-w-xl bg-card/95 dark:bg-[#0a0a0a]/95 backdrop-blur-2xl border border-border dark:border-white/10 rounded-[2rem] shadow-2xl overflow-hidden pointer-events-auto flex flex-col"
 >
 <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#0f52ff] to-transparent opacity-50" />
 
 <div className="flex items-center justify-between p-8 border-b border-border dark:border-white/10 shrink-0">
 <div className="flex flex-col gap-1">
 <h3 className="text-[20px] font-bold tracking-tight">Role Inspector</h3>
 <div className="flex items-center gap-2 mt-2">
 <span className="px-3 py-1 rounded-md bg-[#0f52ff]/10 text-[#0f52ff] font-bold text-[13px] uppercase tracking-wider">Senior Reviewer</span>
 <span className="text-[14px] text-foreground/40 dark:text-[#F0EFE2]/40 font-medium">Engineering</span>
 </div>
 </div>
 <button 
 onClick={() => setInspectorOpen(false)}
 className="size-10 rounded-full bg-muted dark:bg-white/5 flex items-center justify-center hover:bg-black/10 dark:hover:bg-card/10 transition-colors"
 >
 <X className="size-5" />
 </button>
 </div>

 <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
 <div>
 <h4 className="text-[12px] font-bold uppercase tracking-widest text-foreground/40 dark:text-[#F0EFE2]/40 mb-5">Granted Capabilities</h4>
 <div className="flex flex-col gap-6">
 <div className="flex items-center gap-6 p-6 rounded-md border border-[#0f52ff]/20 bg-card/80 dark:bg-[#121212]/80 ">
 <div className="size-12 rounded-md bg-[#0f52ff]/10 flex items-center justify-center">
 <GitMerge className="size-6 text-[#0f52ff]" />
 </div>
 <div className="flex flex-col">
 <span className="text-[16px] font-bold tracking-tight">Merge PR</span>
 <span className="text-[13px] font-mono text-foreground/50 dark:text-[#F0EFE2]/50">github/core-api</span>
 </div>
 </div>
 <div className="flex items-center gap-6 p-6 rounded-md border border-border dark:border-white/10 bg-card/80 dark:bg-[#121212]/80 ">
 <div className="size-12 rounded-md bg-muted dark:bg-white/5 flex items-center justify-center">
 <FileCode className="size-6 text-foreground/70 dark:text-[#F0EFE2]/70" />
 </div>
 <div className="flex flex-col">
 <span className="text-[16px] font-bold tracking-tight">Code Review</span>
 <span className="text-[13px] font-mono text-foreground/50 dark:text-[#F0EFE2]/50">github/*</span>
 </div>
 </div>
 </div>
 </div>

 <div>
 <h4 className="text-[12px] font-bold uppercase tracking-widest text-foreground/40 dark:text-[#F0EFE2]/40 mb-5">Assigned Agents</h4>
 <div className="flex items-center gap-6 p-6 rounded-md border border-emerald-500/30 bg-emerald-500/5 ">
 <div className="size-12 rounded-md bg-emerald-500/20 flex items-center justify-center">
 <Bot className="size-6 text-emerald-600 dark:text-emerald-400" />
 </div>
 <div className="flex flex-col">
 <span className="text-[16px] font-bold tracking-tight text-emerald-600 dark:text-emerald-400">Claude 3.5 Sonnet</span>
 <span className="text-[12px] font-bold uppercase tracking-wider text-emerald-600/70 dark:text-emerald-400/70 mt-1">Active via Release Mission</span>
 </div>
 </div>
 </div>
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
