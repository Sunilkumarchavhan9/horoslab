"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

export type WikiDiagramNode = {
  id: string;
  label: string;
  type: string;
  confidence?: number;
  contractCategory?: string;
};

export type WikiDiagramEdge = {
  id: string;
  from: string;
  to: string;
  relation: string;
};

type WikiGraphDiagramProps = {
  nodes: WikiDiagramNode[];
  edges: WikiDiagramEdge[];
  /** Horizontal layered flow (default) or aggregated category nodes */
  layout?: "flow" | "category";
  maxNodes?: number;
  className?: string;
  compact?: boolean;
};

const NODE_TYPE_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  Decision: { bg: "bg-indigo-500/15", border: "border-indigo-500/40", text: "text-indigo-200/90" },
  Runbook: { bg: "bg-emerald-500/15", border: "border-emerald-500/40", text: "text-emerald-200/90" },
  Incident: { bg: "bg-amber-500/15", border: "border-amber-500/40", text: "text-amber-200/90" },
  Blocker: { bg: "bg-red-500/15", border: "border-red-500/40", text: "text-red-200/90" },
  Risk: { bg: "bg-orange-500/15", border: "border-orange-500/40", text: "text-orange-200/90" },
  Repository: { bg: "bg-slate-500/15", border: "border-slate-400/35", text: "text-slate-200/85" },
  Project: { bg: "bg-violet-500/15", border: "border-violet-500/40", text: "text-violet-200/90" },
  PR: { bg: "bg-sky-500/15", border: "border-sky-500/40", text: "text-sky-200/90" },
  Issue: { bg: "bg-sky-500/15", border: "border-sky-500/40", text: "text-sky-200/90" },
  Owner: { bg: "bg-cyan-500/15", border: "border-cyan-500/40", text: "text-cyan-200/90" },
  decision: { bg: "bg-indigo-500/15", border: "border-indigo-500/40", text: "text-indigo-200/90" },
  runbook: { bg: "bg-emerald-500/15", border: "border-emerald-500/40", text: "text-emerald-200/90" },
  incident: { bg: "bg-amber-500/15", border: "border-amber-500/40", text: "text-amber-200/90" },
  policy: { bg: "bg-violet-500/15", border: "border-violet-500/40", text: "text-violet-200/90" },
  risk: { bg: "bg-orange-500/15", border: "border-orange-500/40", text: "text-orange-200/90" },
  system: { bg: "bg-slate-500/15", border: "border-slate-400/35", text: "text-slate-200/85" },
  person: { bg: "bg-cyan-500/15", border: "border-cyan-500/40", text: "text-cyan-200/90" },
  team: { bg: "bg-teal-500/15", border: "border-teal-500/40", text: "text-teal-200/90" },
};

const DEFAULT_STYLE = {
  bg: "bg-[#1a1a2e]",
  border: "border-[#3A3A3A]",
  text: "text-white/80",
};

function nodeStyle(type: string) {
  return NODE_TYPE_STYLES[type] ?? DEFAULT_STYLE;
}

function truncateLabel(label: string, max = 42): string {
  const trimmed = label.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function formatRelation(relation: string): string {
  return relation.replace(/_/g, " ");
}

function formatCategoryLabel(category: string): string {
  return category.replace(/_/g, " ");
}

function limitNodesForDiagram(
  nodes: WikiDiagramNode[],
  edges: WikiDiagramEdge[],
  maxNodes: number,
): { nodes: WikiDiagramNode[]; edges: WikiDiagramEdge[] } {
  if (nodes.length <= maxNodes) {
    return { nodes, edges };
  }
  const edgeLinked = new Set<string>();
  for (const edge of edges) {
    edgeLinked.add(edge.from);
    edgeLinked.add(edge.to);
  }
  const prioritized = [
    ...nodes.filter((node) => edgeLinked.has(node.id)),
    ...nodes.filter((node) => !edgeLinked.has(node.id)),
  ].slice(0, maxNodes);
  const ids = new Set(prioritized.map((node) => node.id));
  return {
    nodes: prioritized,
    edges: edges.filter((edge) => ids.has(edge.from) && ids.has(edge.to)),
  };
}

function buildFlowLayers(
  nodes: WikiDiagramNode[],
  edges: WikiDiagramEdge[],
): WikiDiagramNode[][] {
  if (!nodes.length) return [];
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const inDegree = new Map<string, number>();
  for (const node of nodes) inDegree.set(node.id, 0);
  for (const edge of edges) {
    inDegree.set(edge.to, (inDegree.get(edge.to) ?? 0) + 1);
  }

  const layers: WikiDiagramNode[][] = [];
  const placed = new Set<string>();
  let frontier = nodes.filter((node) => (inDegree.get(node.id) ?? 0) === 0).map((node) => node.id);

  if (!frontier.length) {
    frontier = [nodes[0].id];
  }

  while (frontier.length && placed.size < nodes.length) {
    const layer = frontier.map((id) => nodeById.get(id)).filter(Boolean) as WikiDiagramNode[];
    if (layer.length) layers.push(layer);
    for (const id of frontier) placed.add(id);

    const nextIds: string[] = [];
    for (const id of frontier) {
      for (const edge of edges) {
        if (edge.from !== id || placed.has(edge.to) || nextIds.includes(edge.to)) continue;
        const parentsPlaced = edges
          .filter((candidate) => candidate.to === edge.to)
          .every((candidate) => placed.has(candidate.from));
        if (parentsPlaced) nextIds.push(edge.to);
      }
    }
    frontier = nextIds;
  }

  const orphans = nodes.filter((node) => !placed.has(node.id));
  if (orphans.length) {
    layers.push(orphans);
  }

  return layers;
}

type CategoryAggregate = {
  key: string;
  label: string;
  count: number;
  type: string;
};

type CategoryLink = {
  from: string;
  to: string;
  relation: string;
  count: number;
};

function buildCategoryAggregates(
  nodes: WikiDiagramNode[],
  edges: WikiDiagramEdge[],
): { categories: CategoryAggregate[]; links: CategoryLink[] } {
  const categoryKey = (node: WikiDiagramNode) =>
    node.contractCategory?.trim() || node.type.trim() || "unknown";

  const counts = new Map<string, CategoryAggregate>();
  for (const node of nodes) {
    const key = categoryKey(node);
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, {
        key,
        label: formatCategoryLabel(key),
        count: 1,
        type: node.type,
      });
    }
  }

  const nodeCategory = new Map(nodes.map((node) => [node.id, categoryKey(node)]));
  const linkMap = new Map<string, CategoryLink>();

  for (const edge of edges) {
    const from = nodeCategory.get(edge.from);
    const to = nodeCategory.get(edge.to);
    if (!from || !to || from === to) continue;
    const key = `${from}|${edge.relation}|${to}`;
    const existing = linkMap.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      linkMap.set(key, { from, to, relation: edge.relation, count: 1 });
    }
  }

  return {
    categories: [...counts.values()].sort((a, b) => b.count - a.count),
    links: [...linkMap.values()],
  };
}

function DiagramNodeCard({
  node,
  compact,
}: {
  node: WikiDiagramNode;
  compact?: boolean;
}) {
  const style = nodeStyle(node.type);
  return (
    <div
      className={cn(
        "relative min-w-0 rounded-md border px-3 py-2 shadow-sm",
        style.bg,
        style.border,
        compact ? "max-w-[140px]" : "max-w-[180px]",
      )}
    >
      <p className={cn("text-[9px] font-semibold uppercase tracking-wide", style.text)}>
        {node.type}
      </p>
      <p className="mt-0.5 text-xs leading-snug text-white/90" title={node.label}>
        {truncateLabel(node.label, compact ? 32 : 42)}
      </p>
      {typeof node.confidence === "number" ? (
        <p className="mt-1 text-[9px] tabular-nums text-white/40">
          {Math.round(node.confidence * 100)}% conf
        </p>
      ) : null}
    </div>
  );
}

function FlowDiagram({
  layers,
  edges,
  compact,
}: {
  layers: WikiDiagramNode[][];
  edges: WikiDiagramEdge[];
  compact?: boolean;
}) {
  const edgeLabels = useMemo(() => {
    const byPair = new Map<string, string>();
    for (const edge of edges) {
      byPair.set(`${edge.from}->${edge.to}`, formatRelation(edge.relation));
    }
    return byPair;
  }, [edges]);

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max items-stretch gap-0 px-1 py-2">
        {layers.map((layer, layerIndex) => (
          <div key={`layer-${layerIndex}`} className="flex items-center">
            <div className="flex flex-col gap-3">
              {layer.map((node) => (
                <DiagramNodeCard key={node.id} node={node} compact={compact} />
              ))}
            </div>
            {layerIndex < layers.length - 1 ? (
              <div className="flex w-12 shrink-0 flex-col items-center justify-center gap-1 px-1">
                {layer.flatMap((fromNode) => {
                  const nextLayer = layers[layerIndex + 1] ?? [];
                  const outgoing = edges.filter(
                    (edge) =>
                      edge.from === fromNode.id &&
                      nextLayer.some((target) => target.id === edge.to),
                  );
                  if (!outgoing.length) return [];
                  return outgoing.slice(0, 1).map((edge) => (
                    <div key={edge.id} className="flex flex-col items-center">
                      <div className="h-px w-8 bg-indigo-400/50" />
                      <span className="text-[8px] uppercase tracking-wide text-indigo-300/70">
                        {edgeLabels.get(`${edge.from}->${edge.to}`) ?? "→"}
                      </span>
                      <div className="text-indigo-300/60">→</div>
                    </div>
                  ));
                })}
                {layer.every(
                  (fromNode) =>
                    !edges.some(
                      (edge) =>
                        edge.from === fromNode.id &&
                        (layers[layerIndex + 1] ?? []).some((target) => target.id === edge.to),
                    ),
                ) ? (
                  <div className="text-indigo-300/60">→</div>
                ) : null}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryDiagram({
  categories,
  links,
}: {
  categories: CategoryAggregate[];
  links: CategoryLink[];
}) {
  const ordered = categories.slice(0, 8);
  const orderedKeys = new Set(ordered.map((category) => category.key));
  const visibleLinks = links.filter(
    (link) => orderedKeys.has(link.from) && orderedKeys.has(link.to),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {ordered.map((category) => {
          const style = nodeStyle(category.type);
          return (
            <div
              key={category.key}
              className={cn(
                "rounded-md border px-3 py-2",
                style.bg,
                style.border,
              )}
            >
              <p className={cn("text-[9px] font-semibold uppercase tracking-wide", style.text)}>
                {category.label}
              </p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-white">
                {category.count}
              </p>
            </div>
          );
        })}
      </div>
      {visibleLinks.length > 0 ? (
        <ul className="space-y-1.5 border-t border-[#2F2F2F] pt-3">
          {visibleLinks.slice(0, 10).map((link) => (
            <li
              key={`${link.from}-${link.relation}-${link.to}`}
              className="flex flex-wrap items-center gap-2 text-xs text-white/70"
            >
              <span className="rounded border border-[#3A3A3A] bg-[#111111] px-2 py-0.5 text-white/85">
                {formatCategoryLabel(link.from)}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-indigo-300/80">
                {formatRelation(link.relation)}
                {link.count > 1 ? ` ×${link.count}` : ""}
              </span>
              <span className="rounded border border-[#3A3A3A] bg-[#111111] px-2 py-0.5 text-white/85">
                {formatCategoryLabel(link.to)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function WikiGraphDiagram({
  nodes,
  edges,
  layout = "flow",
  maxNodes = 12,
  className,
  compact = false,
}: WikiGraphDiagramProps) {
  const limited = useMemo(
    () => limitNodesForDiagram(nodes, edges, maxNodes),
    [nodes, edges, maxNodes],
  );

  const layers = useMemo(
    () => buildFlowLayers(limited.nodes, limited.edges),
    [limited.nodes, limited.edges],
  );

  const categoryData = useMemo(
    () => buildCategoryAggregates(limited.nodes, limited.edges),
    [limited.nodes, limited.edges],
  );

  if (!limited.nodes.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-md border border-[#2F2F2F] bg-[#0D0D0D] p-3",
        className,
      )}
    >
      {layout === "category" ? (
        <CategoryDiagram
          categories={categoryData.categories}
          links={categoryData.links}
        />
      ) : (
        <FlowDiagram layers={layers} edges={limited.edges} compact={compact} />
      )}
      {nodes.length > maxNodes ? (
        <p className="mt-2 text-[10px] text-white/35">
          Showing {limited.nodes.length} of {nodes.length} nodes
        </p>
      ) : null}
    </div>
  );
}

export function WikiGraphDiagramEmpty({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-dashed border-[#3A3A3A] bg-[#0D0D0D]/60 px-4 py-6 text-center">
      <p className="text-sm text-white/45">{message}</p>
    </div>
  );
}
