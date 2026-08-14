"use client";

import {
  WikiGraphDiagram,
  WikiGraphDiagramEmpty,
  type WikiDiagramEdge,
  type WikiDiagramNode,
} from "@/components/continuity-lab/wiki/wiki-graph-diagram";
import { cn } from "@/lib/utils";

type WikiDiagramPanelProps = {
  title: string;
  description?: string;
  nodes: WikiDiagramNode[];
  edges: WikiDiagramEdge[];
  layout?: "flow" | "category";
  maxNodes?: number;
  compact?: boolean;
  emptyMessage?: string;
  className?: string;
};

export function WikiDiagramPanel({
  title,
  description,
  nodes,
  edges,
  layout = "flow",
  maxNodes = 12,
  compact = false,
  emptyMessage = "No diagram data available yet.",
  className,
}: WikiDiagramPanelProps) {
  return (
    <section className={cn("space-y-2", className)}>
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {description ? (
          <p className="mt-1 text-xs leading-relaxed text-white/45">{description}</p>
        ) : null}
      </div>
      {nodes.length > 0 ? (
        <WikiGraphDiagram
          nodes={nodes}
          edges={edges}
          layout={layout}
          maxNodes={maxNodes}
          compact={compact}
        />
      ) : (
        <WikiGraphDiagramEmpty message={emptyMessage} />
      )}
    </section>
  );
}

export function operationalMapToDiagram(
  nodes: Array<{
    id: string;
    type: string;
    label: string;
    confidence: number;
    contractCategory?: string;
  }>,
  edges: Array<{ id: string; from: string; to: string; relation: string }>,
): { nodes: WikiDiagramNode[]; edges: WikiDiagramEdge[] } {
  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      label: node.label,
      type: node.type,
      confidence: node.confidence,
      contractCategory: node.contractCategory,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      from: edge.from,
      to: edge.to,
      relation: edge.relation,
    })),
  };
}
