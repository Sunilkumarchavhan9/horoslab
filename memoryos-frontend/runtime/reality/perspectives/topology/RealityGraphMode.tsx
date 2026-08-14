"use client";

import { useEffect } from "react";
import { useRealityStore } from "../../runtime/store";
import { graphService } from "../../services/graph-service";
import { GitCommit, Database, Cloud, Building, Target, ZapIcon, Server, Activity, Camera, Cpu, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlobalRealityRegistry } from "../../runtime/RealityRegistry";
import { RealityEntityType } from "../../entities/types";
import { 
 ReactFlow, 
 Background, 
 Handle, 
 Position, 
 Node, 
 Edge,
 NodeProps,
 NodeMouseHandler,
 useNodesState,
 useEdgesState,
 ReactFlowProvider,
 BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

type FlowPosition = { x: number; y: number };

const layoutMap: Record<string, FlowPosition> = {
 "memoryos-core": { x: 120, y: 120 },
 "reality-event-store": { x: 360, y: 120 },
 "event-store": { x: 360, y: 120 },
 "software-release-mission": { x: 600, y: 120 },
 "release-mission": { x: 600, y: 120 },
 "mission-release": { x: 600, y: 120 },
 "evidence-pack": { x: 840, y: 120 },
 "verification-run": { x: 1080, y: 120 },
 "settlement-record": { x: 1320, y: 120 },
 "learning-artifact": { x: 1560, y: 120 },
 "auth-service": { x: 120, y: 280 },
 "api-v2": { x: 360, y: 280 },
 "users-db": { x: 600, y: 280 },
 "payment-gateway": { x: 840, y: 280 },
 "tenant-acme": { x: 1080, y: 280 },
};

const renderIcon = (type: string) => {
 switch (type) {
 case "repository": return <GitCommit className="size-4" />;
 case "service": return <Server className="size-4" />;
 case "database": return <Database className="size-4" />;
 case "api": return <ZapIcon className="size-4" />;
 case "institution": return <Building className="size-4" />;
 case "mission": return <Target className="size-4" />;
 case "robot": return <ZapIcon className="size-4" />;
 case "sensor": return <Activity className="size-4" />;
 case "camera": return <Camera className="size-4" />;
 case "machine": return <Cpu className="size-4" />;
 case "location": return <MapPin className="size-4" />;
 default: return <Cloud className="size-4" />;
 }
};

const getNodeColor = (type: string) => {
 switch (type) {
 case "repository": return "text-foreground/90 dark:text-[#eee]";
 case "service": return "text-blue-600 dark:text-blue-400";
 case "database": return "text-emerald-600 dark:text-emerald-400";
 case "api": return "text-purple-600 dark:text-purple-400";
 case "institution": return "text-amber-600 dark:text-amber-400";
 case "mission": return "text-rose-600 dark:text-rose-400";
 case "robot": return "text-cyan-600 dark:text-cyan-400";
 case "sensor": return "text-orange-600 dark:text-orange-400";
 case "camera": return "text-indigo-600 dark:text-indigo-400";
 case "machine": return "text-fuchsia-600 dark:text-fuchsia-400";
 case "location": return "text-teal-600 dark:text-teal-400";
 default: return "text-foreground dark:text-white";
 }
};

// Custom Node matching the visual aesthetic
type EntityNodeData = {
 title: string;
 type: string;
 status: string;
 isFaded: boolean;
};

const EntityNode = ({ data, selected }: NodeProps<Node<EntityNodeData>>) => {
 return (
 <>
 <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-transparent !border-none" />
 <div
 className={cn(
 "flex flex-col p-3 bg-card dark:bg-[#111] border rounded-none w-[160px] transition-all duration-200",
 selected ? "border-[#111] dark:border-border ring-1 ring-[#111] dark:ring-[#eee]" : "border-border dark:border-white/10",
 data.isFaded && "opacity-30 grayscale"
 )}
 >
 <div className="flex items-center gap-2 mb-2">
 <div className={cn("shrink-0", getNodeColor(data.type))}>
 {renderIcon(data.type)}
 </div>
 <div className="text-[12px] font-bold text-foreground dark:text-[#eee] truncate">{data.title}</div>
 {data.status === "warning" && <div className="ml-auto size-2 bg-amber-500 rounded-full" />}
 {data.status === "error" && <div className="ml-auto size-2 bg-red-500 rounded-full animate-pulse" />}
 </div>
 <div className="text-[10px] font-bold text-muted-foreground dark:text-muted-foreground uppercase tracking-wider truncate">{data.type}</div>
 </div>
 <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-transparent !border-none" />
 </>
 );
};

const nodeTypes = {
 entity: EntityNode,
};

const hiddenPhysicalTypes = new Set(["robot", "sensor", "camera", "machine", "location"]);

function getNodePosition(nodeId: string, nodeType: string, index: number): FlowPosition {
 const explicit = layoutMap[nodeId];
 if (explicit) return explicit;

 if (nodeType === "repository") return { x: 120, y: 120 + (index % 3) * 160 };
 if (nodeType === "database") return { x: 360, y: 120 + (index % 3) * 160 };
 if (nodeType === "service" || nodeType === "api") return { x: 600 + (index % 2) * 240, y: 120 + (index % 3) * 160 };
 if (nodeType === "mission") return { x: 840, y: 120 + (index % 3) * 160 };
 if (nodeType === "evidence") return { x: 1080, y: 120 + (index % 3) * 160 };
 if (nodeType === "institution") return { x: 1320, y: 120 + (index % 3) * 160 };

 return { x: 120 + (index % 5) * 240, y: 120 + Math.floor(index / 5) * 160 };
}

function RealityGraphFlow() {
 const { selection, setSelection, searchQuery } = useRealityStore();
 const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
 const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

 useEffect(() => {
 graphService.fetchGraph().then((data) => {
 const flowNodes: Node[] = data.nodes
 .filter((n) => !hiddenPhysicalTypes.has(n.type))
 .map((n, index) => {
 const isMatch = searchQuery ? n.title.toLowerCase().includes(searchQuery.toLowerCase()) : true;
 return {
 id: n.id,
 type: 'entity',
 position: getNodePosition(n.id, n.type, index),
 data: {
 title: n.title,
 type: n.type,
 status: n.status,
 isFaded: searchQuery && !isMatch,
 },
 draggable: false, // Make non-draggable as requested
 };
 });

 const visibleNodeIds = new Set(flowNodes.map((node) => node.id));
 const flowEdges: Edge[] = data.edges.filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)).map(e => ({
 id: e.id,
 source: e.source,
 target: e.target,
 animated: e.animated,
 style: { stroke: e.animated ? '#0f52ff' : 'rgba(0,0,0,0.15)', strokeWidth: e.animated ? 2 : 1.5 },
 }));

 setNodes(flowNodes);
 setEdges(flowEdges);
 });
 }, [searchQuery, setNodes, setEdges]);

 // Sync React Flow selection with global store
 useEffect(() => {
 setNodes(nds => 
 nds.map(node => ({
 ...node,
 selected: selection?.id === node.id,
 }))
 );
 }, [selection, setNodes]);

 const onNodeClick: NodeMouseHandler = (_event, node) => {
 setSelection({ type: node.data.type as RealityEntityType, id: node.id, sourceView: 'topology' });
 };

 const onPaneClick = () => {
 setSelection(null);
 };

return (
<div className="absolute inset-0 bg-card dark:bg-[#111]">
 <ReactFlow
 nodes={nodes}
 edges={edges}
 nodeTypes={nodeTypes}
 onNodesChange={onNodesChange}
 onEdgesChange={onEdgesChange}
 onNodeClick={onNodeClick}
 onPaneClick={onPaneClick}
 nodesDraggable={false}
 nodesConnectable={false}
 elementsSelectable={true}
 fitView
 >
 <Background variant={BackgroundVariant.Dots} gap={24} size={1} className="opacity-10 dark:opacity-20" color="currentColor" />
 </ReactFlow>
 </div>
 );
}

export function RealityGraphMode() {
 return (
 <ReactFlowProvider>
 <RealityGraphFlow />
 </ReactFlowProvider>
 );
}

GlobalRealityRegistry.register({
 id: 'topology',
 title: 'Reality Graph',
 component: RealityGraphMode,
});
