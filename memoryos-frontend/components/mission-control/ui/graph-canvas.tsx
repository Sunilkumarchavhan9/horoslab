"use client";

import React, { useMemo } from "react";
import { ReactFlow, Background, Controls, Node, Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { NodeCard } from "./node-card";

// Custom node that wraps our NodeCard
function CustomNode({ data }: { data: any }) {
 return (
 <div className=" rounded-[6px]">
 <NodeCard 
 id={data.id}
 label={data.label}
 type={data.type}
 status={data.status}
 />
 </div>
 );
}

const nodeTypes = {
 custom: CustomNode,
};

export function GraphCanvas({ 
 nodes, 
 edges 
}: { 
 nodes: Node[], 
 edges: Edge[] 
}) {
 return (
 <div className="w-full h-full min-h-[400px] border border-border rounded-[6px] overflow-hidden bg-black/[0.01]">
 <ReactFlow
 nodes={nodes}
 edges={edges}
 nodeTypes={nodeTypes}
 fitView
 proOptions={{ hideAttribution: true }}
 >
 <Background color="#ccc" gap={16} size={1} />
 <Controls showInteractive={false} />
 </ReactFlow>
 </div>
 );
}
