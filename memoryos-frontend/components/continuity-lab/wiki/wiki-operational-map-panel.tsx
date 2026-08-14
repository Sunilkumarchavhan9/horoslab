"use client";

import type { GraphEdge, GraphNode, OperationalMapPayload } from "@/lib/continuity-lab/wiki-api";
import {
  WikiDiagramPanel,
  operationalMapToDiagram,
} from "@/components/continuity-lab/wiki/wiki-diagram-panel";
import { WikiContentBlock } from "@/components/continuity-lab/wiki/wiki-section-layout";
import { WikiRepoTreeDiagram } from "@/components/continuity-lab/wiki/wiki-repo-tree-diagram";
import type { RepoTreeDiagramNode } from "@/lib/continuity-lab/wiki-workspace";

type WikiOperationalMapPanelProps = {
  operationalMap: OperationalMapPayload | null;
  graphNodes: GraphNode[];
  graphEdges: GraphEdge[];
  repoTreeNodes?: RepoTreeDiagramNode[];
  focusPath?: string | null;
};

export function WikiOperationalMapPanel({
  operationalMap,
  graphNodes,
  graphEdges,
  repoTreeNodes = [],
  focusPath,
}: WikiOperationalMapPanelProps) {
  const mapNodes = operationalMap?.nodes ?? [];
  const mapEdges = operationalMap?.edges ?? [];
  const hasMap = mapNodes.length > 0 || mapEdges.length > 0;
  const hasGraph = graphNodes.length > 0 || graphEdges.length > 0;
  const hasRepoTree = repoTreeNodes.length > 0;

  if (!hasMap && !hasGraph && !hasRepoTree) {
    return (
      <p className="text-sm text-white/45">
        No operational map or repository structure for this repo yet. Sync GitHub or add contract
        memories.
      </p>
    );
  }

  const mapDiagram = operationalMapToDiagram(mapNodes, mapEdges);
  const graphDiagram = operationalMapToDiagram(
    graphNodes.map((node) => ({
      id: node.id,
      type: node.type,
      label: node.label,
      confidence: node.confidence,
    })),
    graphEdges.map((edge) => ({
      id: edge.id,
      from: edge.from,
      to: edge.to,
      relation: edge.relation,
    })),
  );

  return (
    <div className="space-y-8">
      {hasRepoTree ? (
        <WikiContentBlock
          title="Repository structure"
          description="Top-level directories and key files from GitHub — grouped by heuristic (frontend / backend / static)."
        >
          <WikiRepoTreeDiagram nodes={repoTreeNodes} focusPath={focusPath} />
        </WikiContentBlock>
      ) : null}

      {hasMap ? (
        <WikiDiagramPanel
          title="Operational map"
          description="Compiled from indexed contract memories and connector hints — nodes and edges are real graph data."
          nodes={mapDiagram.nodes}
          edges={mapDiagram.edges}
          layout="flow"
          maxNodes={14}
        />
      ) : null}

      {hasGraph ? (
        <WikiDiagramPanel
          title="Entity mapping (Company Brain)"
          description="Org graph nodes scoped to this repository — category aggregation shows how contract types connect."
          nodes={graphDiagram.nodes}
          edges={graphDiagram.edges}
          layout="category"
          maxNodes={16}
        />
      ) : null}
    </div>
  );
}
