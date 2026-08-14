import React, { useMemo } from "react";
import { Activity, Server, Database, ShieldCheck, FileCheck, Layers, Bot, GitMerge } from "lucide-react";
import { ReactFlow, Background, Handle, Position, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { cn } from "@/lib/utils";

// --- Custom Node Definitions ---
const OrgNode = ({ data }: any) => (
  <div className="flex items-center gap-3 px-6 py-3 border border-border bg-muted/20 rounded-sm min-w-[280px] justify-center">
    <Handle type="target" position={Position.Top} className="opacity-0" />
    <Layers className="size-4 text-muted-foreground" />
    <span className="text-[13px] font-bold uppercase tracking-wider text-foreground">{data.label}</span>
    <Handle type="source" position={Position.Bottom} className="opacity-0" />
  </div>
);

const InstNode = ({ data }: any) => (
  <div className="flex items-center gap-3 px-6 py-3 border border-border bg-card shadow-sm rounded-sm min-w-[280px] justify-center">
    <Handle type="target" position={Position.Top} className="opacity-0" />
    <Server className="size-4 text-muted-foreground" />
    <span className="text-[13px] font-medium text-foreground">{data.label}</span>
    <Handle type="source" position={Position.Bottom} className="opacity-0" />
  </div>
);

const CoreNode = ({ data }: any) => (
  <div className="flex items-center gap-2 px-6 py-4 border border-border bg-muted/10 rounded-sm min-w-[320px] justify-center relative">
    <Handle type="target" position={Position.Top} className="opacity-0" />
    <Activity className="size-4 text-foreground" />
    <span className="text-[14px] font-bold text-foreground">{data.label}</span>
    <Handle type="source" position={Position.Bottom} className="opacity-0" />
  </div>
);

const ServiceNode = ({ data }: any) => {
  const Icon = data.icon;
  return (
    <div className={cn(
      "flex flex-col items-center gap-2 border rounded-sm p-4 w-[160px] transition-all bg-card",
      data.status === 'warning' ? "border-foreground shadow-sm" : "border-border hover:bg-muted/30"
    )}>
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Icon className={cn("size-4", data.status === 'warning' ? "text-foreground" : "text-muted-foreground")} />
      <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">{data.label}</span>
      <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1 mt-1">
         <div className={cn("size-1.5 rounded-full", data.status === 'warning' ? "bg-foreground animate-pulse" : "bg-foreground")} /> 
         {data.status === 'warning' ? 'Warning' : 'Healthy'}
      </span>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
};

// --- Nodes and Edges ---
const initialNodes: Node[] = [
  { id: 'org', type: 'orgNode', position: { x: 260, y: 0 }, data: { label: 'Acme Corp Organization' } },
  { id: 'inst', type: 'instNode', position: { x: 260, y: 100 }, data: { label: 'Engineering Institution' } },
  { id: 'core', type: 'coreNode', position: { x: 240, y: 200 }, data: { label: 'Active Institution Runtime' } },
  
  { id: 's1', type: 'serviceNode', position: { x: -40, y: 340 }, data: { label: 'Planner', icon: GitMerge, status: 'healthy' } },
  { id: 's2', type: 'serviceNode', position: { x: 140, y: 340 }, data: { label: 'Workers', icon: Bot, status: 'healthy' } },
  { id: 's3', type: 'serviceNode', position: { x: 320, y: 340 }, data: { label: 'Verification', icon: ShieldCheck, status: 'warning' } },
  { id: 's4', type: 'serviceNode', position: { x: 500, y: 340 }, data: { label: 'Evidence', icon: Database, status: 'healthy' } },
  { id: 's5', type: 'serviceNode', position: { x: 680, y: 340 }, data: { label: 'Settlement', icon: FileCheck, status: 'healthy' } },
];

const initialEdges: Edge[] = [
  { id: 'e1', source: 'org', target: 'inst', type: 'straight', style: { stroke: 'hsl(var(--border))', strokeDasharray: '4' } },
  { id: 'e2', source: 'inst', target: 'core', type: 'straight', style: { stroke: 'hsl(var(--border))', strokeDasharray: '4' } },
  { id: 'e3', source: 'core', target: 's1', type: 'smoothstep', style: { stroke: 'hsl(var(--border))', strokeDasharray: '4' } },
  { id: 'e4', source: 'core', target: 's2', type: 'smoothstep', style: { stroke: 'hsl(var(--border))', strokeDasharray: '4' } },
  { id: 'e5', source: 'core', target: 's3', type: 'straight', style: { stroke: 'hsl(var(--border))', strokeDasharray: '4' } },
  { id: 'e6', source: 'core', target: 's4', type: 'smoothstep', style: { stroke: 'hsl(var(--border))', strokeDasharray: '4' } },
  { id: 'e7', source: 'core', target: 's5', type: 'smoothstep', style: { stroke: 'hsl(var(--border))', strokeDasharray: '4' } },
];

export function ObserveRuntimeView() {
  const nodeTypes = useMemo(() => ({
    orgNode: OrgNode,
    instNode: InstNode,
    coreNode: CoreNode,
    serviceNode: ServiceNode
  }), []);

  return (
    <div className="flex flex-col w-full h-full animate-in fade-in duration-500 text-foreground overflow-y-auto p-8 bg-[#fafafa] dark:bg-[#0a0a0a]">
      <div className="flex flex-col gap-10 max-w-5xl mx-auto w-full">
        
        <div className="flex flex-col border-b border-border pb-6">
          <h1 className="text-[22px] font-bold tracking-tight text-foreground">Enterprise Runtime Topology</h1>
          <p className="text-[14px] text-muted-foreground mt-2">
            The live architecture and health status of the autonomous operating system.
          </p>
        </div>

        {/* Global KPIs (Tabular) */}
        <div className="flex flex-col gap-4">
           <h2 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Global Telemetry</h2>
           <div className="flex flex-col border border-border bg-card rounded-sm shadow-sm">
             <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
               
               <div className="flex flex-col p-4 gap-2">
                 <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Running Missions</span>
                 <div className="flex items-center gap-2">
                    <span className="text-[18px] font-bold text-foreground">12</span>
                    <span className="text-[11px] font-mono border border-border bg-muted/50 px-1 rounded-sm text-muted-foreground">+2/hr</span>
                 </div>
               </div>

               <div className="flex flex-col p-4 gap-2">
                 <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Agents</span>
                 <div className="flex items-center gap-2">
                    <span className="text-[18px] font-bold text-foreground">48</span>
                    <span className="text-[11px] font-mono border border-border bg-muted/50 px-1 rounded-sm text-muted-foreground">96% Util</span>
                 </div>
               </div>

               <div className="flex flex-col p-4 gap-2">
                 <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Healthy Inst</span>
                 <div className="flex items-center gap-2">
                    <span className="text-[18px] font-bold text-foreground">3 / 3</span>
                    <span className="text-[11px] font-mono border border-border bg-muted/50 px-1 rounded-sm text-muted-foreground">Stable</span>
                 </div>
               </div>

               <div className="flex flex-col p-4 gap-2 bg-muted/20">
                 <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">Sys Latency</span>
                 <div className="flex items-center gap-2">
                    <span className="text-[18px] font-bold text-foreground">45ms</span>
                    <span className="text-[11px] font-mono border border-border bg-card shadow-sm px-1 rounded-sm text-foreground">P99</span>
                 </div>
               </div>

             </div>
           </div>
        </div>

        {/* Topology Graph Structure (React Flow) */}
        <div className="flex flex-col gap-4">
           <h2 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Runtime Hierarchy</h2>
           
           <div className="h-[550px] border border-border bg-card rounded-sm shadow-sm relative">
              <ReactFlow
                nodes={initialNodes}
                edges={initialEdges}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.3 }}
                minZoom={0.5}
                maxZoom={1.5}
                proOptions={{ hideAttribution: true }}
              >
                <Background color="hsl(var(--muted-foreground))" gap={24} size={1} />
              </ReactFlow>
           </div>
        </div>

      </div>
    </div>
  );
}
