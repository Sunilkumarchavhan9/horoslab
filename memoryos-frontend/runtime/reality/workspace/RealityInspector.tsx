"use client";

import { useEffect, useMemo, useState } from "react";
import type { RealityNode } from "@/lib/reality-api";
import { getRealityGraph } from "@/lib/reality-api";
import { useRealityStore } from "../runtime/store";
import { getActionsForEntity } from "../entities/actions";
import type { EntityAction } from "../entities/actions";
import type { RealityEntity, RealityEntityType } from "../entities/types";
import { X, GitCommit } from "lucide-react";

export function RealityInspector() {
  const { selection, setSelection } = useRealityStore();
  const [graphNodes, setGraphNodes] = useState<RealityNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selection) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const snapshot = await getRealityGraph();
        if (!cancelled) {
          setGraphNodes(snapshot.nodes ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load Reality graph details.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [selection]);

  const node = useMemo(() => graphNodes.find((item) => item.id === selection?.id) ?? null, [graphNodes, selection?.id]);
  const entity = useMemo<RealityEntity>(
    () => ({
      id: node?.id ?? selection?.id ?? "unknown",
      type: ((node?.type ?? selection?.type ?? "unknown") as RealityEntityType) || "unknown",
      title: node?.name ?? selection?.id?.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()) ?? "Selected Entity",
      status: (node?.state ?? "healthy") as RealityEntity["status"],
    }),
    [node, selection?.id, selection?.type],
  );

  const actions = getActionsForEntity(entity);

  if (!selection) return null;

  return (
    <div className="w-[320px] bg-card dark:bg-[#111] border-l border-border dark:border-[#333] flex flex-col h-full shadow-xl z-20 transition-colors">
      <div className="flex items-center justify-between p-6 border-b border-border dark:border-[#333] bg-muted/50 dark:bg-[#1a1a1a]">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-card dark:bg-[#111] border border-border dark:border-[#333] rounded text-foreground dark:text-[#eee]">
            <GitCommit className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[16px] font-bold text-foreground dark:text-[#eee]">{entity.title}</span>
            <span className="text-[10px] font-bold text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">{entity.type}</span>
          </div>
        </div>
        <button
          onClick={() => setSelection(null)}
          className="p-1 hover:bg-[#eee] dark:hover:bg-[#333] rounded text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-[#eee] transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
        {loading ? <div className="text-[13px] text-muted-foreground">Loading Reality graph node...</div> : null}
        {error ? <div className="text-[13px] text-red-500">{error}</div> : null}

        <div className="flex flex-col gap-4">
          <span className="text-[11px] font-bold text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">Properties</span>

          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center text-[13px] font-medium">
              <span className="text-muted-foreground dark:text-muted-foreground">Status</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 capitalize">{entity.status}</span>
            </div>
            <div className="flex justify-between items-center text-[13px] font-medium">
              <span className="text-muted-foreground dark:text-muted-foreground">Source</span>
              <span className="font-bold text-foreground dark:text-[#eee] capitalize">{selection.sourceView} Mode</span>
            </div>
            {node ? (
              <>
                <div className="flex justify-between items-center text-[13px] font-medium">
                  <span className="text-muted-foreground dark:text-muted-foreground">Source Connector</span>
                  <span className="font-bold text-foreground dark:text-[#eee] capitalize">{node.sourceConnector ?? "Reality Graph"}</span>
                </div>
                <div className="flex justify-between items-center text-[13px] font-medium">
                  <span className="text-muted-foreground dark:text-muted-foreground">Confidence</span>
                  <span className="font-bold text-foreground dark:text-[#eee]">
                    {typeof node.confidence === "number" ? `${Math.round(node.confidence * 100)}%` : "Unknown"}
                  </span>
                </div>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <span className="text-[11px] font-bold text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">Entity Actions</span>
          <div className="flex flex-col gap-2">
            {actions.map((action: EntityAction) => (
              <button
                key={action.id}
                onClick={() => action.handler(entity)}
                className={`flex items-center gap-3 p-3 rounded-none text-[13px] font-bold transition-colors text-left ${
                  action.primary
                    ? "bg-[#111] dark:bg-white text-white dark:text-foreground hover:bg-[#333] dark:hover:bg-[#ccc]"
                    : "bg-card dark:bg-[#111] text-foreground dark:text-[#eee] hover:bg-muted/50 dark:hover:bg-[#1a1a1a] border border-border dark:border-[#333]"
                }`}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
