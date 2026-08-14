import type { RealityEntity } from '../entities/types';
import { getRealityGraph } from '@/lib/reality-api';

export interface GraphData {
 nodes: RealityEntity[];
 edges: { id: string; source: string; target: string; animated?: boolean }[];
}

function nodeToEntity(node: { id: string; type: string; name: string; state?: string; metadata?: Record<string, unknown> }): RealityEntity {
  return {
    id: node.id,
    type: node.type as RealityEntity["type"],
    title: node.name,
    subtitle: typeof node.metadata?.provider === "string" ? node.metadata.provider : undefined,
    status:
      node.state === "warning" || node.state === "critical" || node.state === "offline"
        ? "warning"
        : node.state === "error"
          ? "error"
          : "healthy",
    metadata: node.metadata ?? {},
  };
}

export class GraphService {
  async fetchGraph(): Promise<GraphData> {
    const snapshot = await getRealityGraph();
    const baseNodes = snapshot.nodes.map(nodeToEntity);

    const hiddenPhysicalTypes = new Set(["robot", "sensor", "camera", "machine", "location"]);
    const softwareNodes = baseNodes.filter((node) => !hiddenPhysicalTypes.has(node.type));

    const baseEdges = snapshot.edges.map((edge) => ({
      id: edge.id,
      source: edge.from,
      target: edge.to,
      animated: (edge.metadata as Record<string, unknown> | undefined)?.source === "connector-sync",
    })).filter((edge) => {
      const sourceIsVisible = softwareNodes.some((node) => node.id === edge.source);
      const targetIsVisible = softwareNodes.some((node) => node.id === edge.target);
      return sourceIsVisible && targetIsVisible;
    });

    return {
      nodes: softwareNodes,
      edges: baseEdges,
    };
  }
}

export const graphService = new GraphService();
