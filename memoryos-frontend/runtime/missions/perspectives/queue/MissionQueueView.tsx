"use client";

import { Clock, Settings2, UserCog, Network } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemePreference } from "@/lib/continuity-lab/use-theme-preference";
import { useMissionStore } from "../../runtime/store";
import { useMissionRuntimeData } from "../../runtime/mission-runtime-data";

export function MissionQueueView() {
  const { setView, setSelection } = useMissionStore();
  const { missions } = useMissionRuntimeData();

  const { resolved } = useThemePreference();
  const isDark = resolved === "dark";

  const queue = missions
    .filter((mission) => ["draft", "waiting_review", "failed"].includes((mission.state ?? "").toLowerCase()))
    .map((mission) => {
      const policy = mission.authorityPolicies?.[0];
      const blockerType = policy?.blocked ? "Dependency" : policy?.needsApproval ? "Approval" : mission.state === "failed" ? "Dependency" : "Time";
      const condition = policy?.blocked
        ? policy.name ? `${policy.name} blocked execution` : "Policy blocked execution"
        : policy?.needsApproval
          ? policy.name ? `${policy.name} requires approval` : "Waiting for approval"
          : mission.state === "failed"
            ? "Execution failed and needs review"
            : "Waiting in queue";

      return {
        id: mission.id,
        title: mission.title ?? mission.objective ?? "Untitled mission",
        priority: policy?.blocked ? "Critical" : policy?.needsApproval ? "High" : "Normal",
        queuedAt: mission.updatedAt ? new Date(mission.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Unknown",
        scheduledTime: mission.startedAt ? new Date(mission.startedAt).toLocaleString() : "Immediate",
        estimatedStart: mission.state === "draft" ? "Pending" : "Live",
        blockerType,
        condition,
        dependencies: mission.executionRun?.planner && typeof mission.executionRun.planner === "object" && Array.isArray((mission.executionRun.planner as { plan?: unknown[] }).plan)
          ? (mission.executionRun.planner as { plan?: unknown[] }).plan!.slice(0, 3).map((step, index) => {
              if (typeof step === "string") return step;
              return `Step ${index + 1}`;
            })
          : ["Backend plan"],
      };
    });

  return (
    <div className={cn("flex flex-col w-full h-full font-sans animate-in fade-in duration-500 bg-background text-foreground", isDark ? "bg-[#0a0a0a]" : "bg-background")}>
      <div className={cn("flex items-center justify-between px-8 py-6 border-b shrink-0", isDark ? "border-white/10 bg-[#121212]" : "border-border bg-card")}>
        <div className="flex items-center gap-4">
          <div className="size-10 bg-foreground text-background flex items-center justify-center rounded-sm">
            <Clock className="size-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-[18px] font-bold leading-none tracking-tight">Mission Queue</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Pending and blocked operations waiting for execution.</p>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-muted/50 border border-border text-foreground px-4 py-2 rounded-sm text-[13px] font-bold hover:bg-muted transition-colors">
          <Settings2 className="size-4" /> Queue Policies
        </button>
      </div>

      <div className="flex flex-col w-full h-full overflow-y-auto">
        <div className="flex items-center px-8 py-3 bg-muted/30 border-b border-border sticky top-0 z-10">
          <div className="flex-[2] text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Mission in Queue</div>
          <div className="flex-[1.5] text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Waiting For (Blocker)</div>
          <div className="flex-[0.75] text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Priority</div>
          <div className="flex-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Dependencies</div>
          <div className="flex-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Scheduled Time</div>
          <div className="flex-[0.75] text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">Est. Start</div>
          <div className="w-8"></div>
        </div>

        <div className="flex flex-col divide-y divide-border">
          {queue.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center text-muted-foreground">
              <Clock className="size-8 mb-4 opacity-20" />
              <p className="text-[14px]">No pending missions in the queue.</p>
            </div>
          ) : (
            queue.map((q) => (
              <div
                key={q.id}
                onClick={() => {
                  setSelection({ id: q.id, type: "mission" });
                  setView("planner");
                }}
                className="flex items-center px-8 py-4 hover:bg-muted/30 transition-colors cursor-pointer group"
              >
                <div className="flex flex-col flex-[2] pr-8">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-sm w-fit">{q.id}</span>
                    <span className="text-[14px] font-bold text-foreground group-hover:text-blue-500 transition-colors">{q.title}</span>
                  </div>
                  <span className="text-[12px] text-muted-foreground font-mono">Queued {q.queuedAt}</span>
                </div>

                <div className="flex flex-col gap-1 flex-[1.5]">
                  <div className="flex items-center gap-1.5">
                    {q.blockerType === "Approval" ? <UserCog className="size-3.5 text-amber-500" /> : q.blockerType === "Dependency" ? <Network className="size-3.5 text-red-500" /> : <Clock className="size-3.5 text-blue-500" />}
                    <span className={cn(
                      "text-[13px] font-bold",
                      q.blockerType === "Approval" ? "text-amber-600 dark:text-amber-500" : q.blockerType === "Dependency" ? "text-red-600 dark:text-red-500" : "text-blue-600 dark:text-blue-500",
                    )}>
                      {q.condition}
                    </span>
                  </div>
                </div>

                <div className="flex items-center flex-[0.75]">
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-sm text-[11px] font-bold uppercase tracking-wider",
                    q.priority === "Critical" ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20" : q.priority === "High" ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20" : "bg-muted text-muted-foreground border border-border",
                  )}>
                    {q.priority}
                  </span>
                </div>

                <div className="flex flex-col flex-1 gap-1">
                  {q.dependencies.map((dep) => (
                    <span key={dep} className="text-[12px] font-medium text-muted-foreground">{dep}</span>
                  ))}
                </div>

                <div className="flex flex-col flex-1">
                  <span className="text-[13px] font-mono text-muted-foreground">{q.scheduledTime}</span>
                </div>

                <div className="flex flex-col flex-[0.75] text-right">
                  <span className="text-[13px] font-mono font-medium text-foreground">{q.estimatedStart}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
