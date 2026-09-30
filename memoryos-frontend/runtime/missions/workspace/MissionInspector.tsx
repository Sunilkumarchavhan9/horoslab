"use client";

import { useEffect, useState } from "react";
import { X, ShieldAlert, Cpu, Database, Network } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMissionStore } from "../runtime/store";
import { useMissionRuntimeData } from "../runtime/mission-runtime-data";
import type { DhyraMissionDetail } from "@/lib/dhyra-api";

export function MissionInspector() {
  const { isInspectorOpen, toggleInspector, selection, setSelection } = useMissionStore();
  const { getMission } = useMissionRuntimeData();
  const [mission, setMission] = useState<DhyraMissionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!selection || selection.type !== "mission") {
        setMission(null);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const detail = await getMission(selection.id);
        if (!cancelled) {
          setMission(detail);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to load mission details.";
          setMission(null);
          setError(message);
          if (message.toLowerCase().includes("mission not found")) {
            setSelection(null);
          }
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
  }, [getMission, selection, setSelection]);

  if (!isInspectorOpen) return null;

  return (
    <div className="w-[300px] border-l border-border bg-muted/50 flex flex-col shrink-0">
      <div className="h-12 border-b border-border flex items-center justify-between px-4">
        <span className="text-[13px] font-semibold text-foreground">Inspector</span>
        <button onClick={toggleInspector} className="p-1 hover:bg-accent rounded text-muted-foreground">
          <X className="size-4" />
        </button>
      </div>

      {selection ? (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
          <div className="flex flex-col gap-1 pb-4 border-b border-border">
            <span className="text-[15px] font-semibold text-foreground">{selection.id}</span>
            <span className="text-[12px] text-muted-foreground">Type: {selection.type}</span>
          </div>

          {loading ? (
            <div className="text-[13px] text-muted-foreground">Loading mission details...</div>
          ) : error ? (
            <div className="flex flex-col gap-2 border border-amber-500/20 bg-amber-500/5 p-3">
              <span className="text-[13px] font-semibold text-amber-600">Mission is no longer available</span>
              <span className="text-[12px] text-muted-foreground">The old selection was cleared. Select a mission from the current workspace.</span>
            </div>
          ) : mission ? (
            <>
              <div className="flex flex-col gap-3">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Assigned Agents</span>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 bg-card p-3 rounded-md border border-border">
                    <div className="size-8 rounded-full bg-blue-50 flex items-center justify-center">
                      <Cpu className="size-4 text-blue-600" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-semibold text-foreground">{mission.executionRun?.planner && typeof mission.executionRun.planner === "object" ? "Planner Agent" : "Dhyra Planner"}</span>
                      <span className="text-[11px] text-muted-foreground">{mission.state ?? "draft"} • {mission.executionRun?.startedAt ? "running" : "idle"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Active Policies</span>
                <div className="flex flex-col gap-2">
                  {(mission.authorityPolicies ?? []).length > 0 ? (
                    mission.authorityPolicies!.map((policy) => (
                      <div key={policy.id} className={cn("flex items-start gap-3 bg-card p-3 rounded-md border", policy.blocked ? "border-red-500/20" : "border-amber-200")}>
                        <ShieldAlert className={cn("size-4 shrink-0 mt-0.5", policy.blocked ? "text-red-500" : "text-amber-500")} />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[13px] font-semibold text-foreground">{policy.name ?? "Mission Authority Policy"}</span>
                          <span className="text-[11px] text-muted-foreground leading-relaxed">
                            {policy.blocked ? "Execution is blocked by this policy." : policy.needsApproval ? "Execution needs approval before it can continue." : "Policy allows execution."}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-[12px] text-muted-foreground italic px-1">No policies attached to this mission.</div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Evidence Collected</span>
                <div className="flex flex-col gap-2">
                  {(mission.evidence ?? []).length === 0 ? (
                    <div className="text-[12px] text-muted-foreground italic px-1">Waiting for evidence...</div>
                  ) : (
                    mission.evidence!.map((ev) => (
                      <div key={ev.id} className="flex items-center gap-3 bg-card p-3 rounded-md border border-emerald-500/30">
                        <div className="size-8 rounded-md bg-emerald-50 flex items-center justify-center">
                          <Database className="size-4 text-emerald-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-semibold text-foreground">{ev.summary ?? ev.kind ?? ev.id}</span>
                          <span className="text-[11px] text-muted-foreground">Captured dynamically from the backend</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Impact</span>
                <div className="flex items-center gap-3 bg-card p-3 rounded-md border border-border">
                  <div className="size-8 rounded-md bg-purple-50 flex items-center justify-center">
                    <Network className="size-4 text-purple-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-semibold text-foreground">{mission.timeline?.length ?? 0} Timeline Events</span>
                    <span className="text-[11px] text-blue-600 hover:underline cursor-pointer">View in Reality Graph</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 p-4 flex items-center justify-center text-[13px] text-muted-foreground text-center">Select a mission to view details.</div>
          )}
        </div>
      ) : (
        <div className="flex-1 p-4 flex items-center justify-center text-[13px] text-muted-foreground text-center">Select a mission to view details.</div>
      )}
    </div>
  );
}
