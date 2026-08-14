"use client";

import { subtlePanel } from "@/components/continuity-lab/continuity-lab-section-ui";
import { cn } from "@/lib/utils";

type WikiGraphPanelProps = {
  nodes: Array<{
    id: string;
    type: string;
    label: string;
    confidence: number;
  }>;
  edges: Array<{
    id: string;
    from: string;
    to: string;
    relation: string;
    confidence: number;
  }>;
};

export function WikiGraphPanel({ nodes, edges }: WikiGraphPanelProps) {
  if (!nodes.length) {
    return (
      <p className="text-sm text-white/45">
        No operational graph nodes indexed for this repository yet.
      </p>
    );
  }

  const labelById = new Map(nodes.map((node) => [node.id, node.label]));

  return (
    <div className="space-y-4">
      <div className={cn(subtlePanel(), "overflow-x-auto")}>
        <table className="w-full min-w-[320px] text-left text-sm">
          <thead className="border-b border-white/[0.06] bg-[#1a1a1a] text-[10px] uppercase tracking-wide text-white/40">
            <tr>
              <th className="px-4 py-2 font-semibold">Node</th>
              <th className="px-4 py-2 font-semibold">Type</th>
              <th className="px-4 py-2 font-semibold">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {nodes.slice(0, 24).map((node) => (
              <tr key={node.id} className="border-b border-white/[0.06] last:border-0">
                <td className="px-4 py-2.5 text-white/80">{node.label}</td>
                <td className="px-4 py-2.5 text-white/55">{node.type}</td>
                <td className="px-4 py-2.5 tabular-nums text-white/60">
                  {Math.round(node.confidence * 100)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {edges.length > 0 ? (
        <div className={cn(subtlePanel(), "overflow-x-auto")}>
          <p className="border-b border-white/[0.06] bg-[#1a1a1a] px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-white/40">
            Relationships
          </p>
          <ul className="divide-y divide-white/[0.06]">
            {edges.slice(0, 16).map((edge) => (
              <li key={edge.id} className="px-4 py-2.5 text-sm text-white/70">
                <span className="text-white/85">{labelById.get(edge.from) ?? edge.from}</span>
                <span className="mx-2 text-[10px] uppercase tracking-wide text-indigo-300/80">
                  {edge.relation.replace(/_/g, " ")}
                </span>
                <span className="text-white/85">{labelById.get(edge.to) ?? edge.to}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
