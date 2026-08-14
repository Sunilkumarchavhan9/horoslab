"use client";

import { useMemo, useState } from "react";
import { Activity, AlertTriangle, ArrowRight, CheckCircle2, Clock, Database, FileText, Play, Rocket, Shield, Sparkles, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemePreference } from "@/lib/continuity-lab/use-theme-preference";
import { useMissionStore } from "../../runtime/store";
import { useMissionRuntimeData } from "../../runtime/mission-runtime-data";

type StageKey = "planning" | "execution" | "evidence" | "verification" | "settlement" | "learning";

type StageState = {
  id: StageKey;
  label: string;
  detail: string;
  complete: boolean;
  active: boolean;
};

export function MissionOverview() {
  const { resolved } = useThemePreference();
  const isDark = resolved === "dark";
  const { setView, setSelection } = useMissionStore();
  const { missions, missionRows, institutions, templates, historyCards, loading, error, createMission, executeMission } =
    useMissionRuntimeData();
  const [runningDemo, setRunningDemo] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  const latestMission = missions[0] ?? null;
  const latestRow = missionRows[0] ?? null;
  const primaryInstitution = institutions[0] ?? null;
  const latestCertificate = latestMission?.certificate ?? null;
  const latestMemoryRecord = latestMission?.memoryRecord ?? null;

  const stats = useMemo(() => {
    const running = missions.filter((mission) => (mission.state ?? "").toLowerCase() === "running").length;
    const completed = missions.filter((mission) => (mission.state ?? "").toLowerCase() === "completed").length;
    const blocked = missions.filter((mission) => (mission.state ?? "").toLowerCase() === "failed").length;
    const verified = missions.filter((mission) => Boolean(mission.verificationRun?.finalDecision)).length;
    const evidence = missions.reduce((count, mission) => count + (Array.isArray(mission.evidence) ? mission.evidence.length : 0), 0);
    const learningArtifacts = missions.filter((mission) => Boolean(mission.memoryRecord)).length;

    return { running, completed, blocked, verified, evidence, learningArtifacts };
  }, [missions]);

  const stages = useMemo<StageState[]>(() => {
    const hasExecution = Boolean(latestMission?.executionRun);
    const hasEvidence = (latestMission?.evidence?.length ?? 0) > 0;
    const hasVerification = Boolean(latestMission?.verificationRun);
    const hasCertificate = Boolean(latestCertificate);
    const hasLearning = Boolean(latestMemoryRecord);

    const completedState = (active: boolean, complete: boolean) => ({ active, complete });

    return [
      {
        id: "planning",
        label: "Planning",
        detail: latestMission?.executionRun?.planner && typeof latestMission.executionRun.planner === "object"
          ? "Planner generated a live plan."
          : "Waiting for a mission to be planned.",
        ...completedState(false, Boolean(latestMission && (latestMission.state ?? "").toLowerCase() !== "draft")),
      },
      {
        id: "execution",
        label: "Execution",
        detail: hasExecution ? "Execution run has been recorded." : "No execution run yet.",
        ...completedState((latestMission?.state ?? "").toLowerCase() === "running", hasExecution),
      },
      {
        id: "evidence",
        label: "Evidence",
        detail: hasEvidence ? `${latestMission?.evidence?.length ?? 0} evidence artifact(s) captured.` : "No evidence has been captured yet.",
        ...completedState(false, hasEvidence),
      },
      {
        id: "verification",
        label: "Verification",
        detail: hasVerification
          ? `Verdict: ${latestMission?.verificationRun?.finalDecision ?? "UNKNOWN"}`
          : "Verification is still pending.",
        ...completedState((latestMission?.state ?? "").toLowerCase() === "waiting_review", hasVerification),
      },
      {
        id: "settlement",
        label: "Settlement",
        detail: hasCertificate ? "Certificate issued and settlement recorded." : "Settlement is waiting on verification.",
        ...completedState(false, hasCertificate),
      },
      {
        id: "learning",
        label: "Learning",
        detail: hasLearning ? "Learning artifact saved back into the memory graph." : "Learning artifact not recorded yet.",
        ...completedState(false, hasLearning),
      },
    ];
  }, [latestCertificate, latestMemoryRecord, latestMission]);

  const launchFullMissionLoop = async () => {
    if (!primaryInstitution) {
      setDemoError("Create or connect an institution before launching the mission loop.");
      return;
    }

    setRunningDemo(true);
    setDemoError(null);

    try {
      const mission = await createMission({
        institutionId: primaryInstitution.id,
        title: "Software Institution Loop",
        objective: "Run one mission from planning through learning, backed by live Epoch data.",
        plan: [
          "Planning",
          "Execution",
          "Evidence",
          "Verification",
          "Settlement",
          "Learning",
        ],
        authority: {
          source: "MissionOverview",
          path: "software-institution-loop",
        },
        proof: {
          productSlice: "beta-core-loop",
          source: "live-mission-overview",
        },
      });

      const result = await executeMission(mission.id, {
        humanApproval: "approved",
        confidence: 100,
        checklist: [
          "Planning complete",
          "Execution complete",
          "Evidence generated",
          "Verification passed",
          "Settlement recorded",
          "Learning artifact created",
        ],
        notes: "Launched from Mission Overview to prove the full end-to-end mission loop.",
      });

      setSelection({ id: mission.id, type: "mission" });
      setView("execution");

      if ("blocked" in result || "approvalRequired" in result) {
        setDemoError(result.reason);
      }
    } catch (err) {
      setDemoError(err instanceof Error ? err.message : "Failed to launch the mission loop.");
    } finally {
      setRunningDemo(false);
    }
  };

  const openLatestMission = () => {
    if (!latestMission) return;
    setSelection({ id: latestMission.id, type: "mission" });
    setView("execution");
  };

  const recentSignals = [
    latestMission
      ? {
          time: latestMission.updatedAt ? new Date(latestMission.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Now",
          event: latestMission.state === "completed" ? "Mission completed" : latestMission.state === "failed" ? "Mission failed" : "Mission active",
          detail: latestMission.title ?? latestMission.objective ?? "Untitled mission",
        }
      : {
          time: "Now",
          event: "No mission selected",
          detail: "Launch a mission to populate the live loop.",
        },
    ...historyCards.slice(0, 2).map((card) => ({
      time: card.date,
      event: `Verification ${card.status}`,
      detail: card.missionName,
    })),
  ];

  return (
    <div className="flex flex-col w-full h-full font-sans animate-in fade-in duration-500 bg-background text-foreground overflow-y-auto">
      <div className="flex items-center justify-between px-8 py-6 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-4">
          <div className="size-10 bg-foreground text-background flex items-center justify-center rounded-sm">
            <Activity className="size-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-[18px] font-bold leading-none tracking-tight">Mission Command Center</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Live Epoch data for the software institution loop.</p>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Institution Health</span>
            <div className="flex items-center gap-2">
              <span className="relative flex size-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-2.5 bg-emerald-500" />
              </span>
              <span className="text-[14px] font-mono font-medium">{institutions.length > 0 ? "Connected" : "Waiting"}</span>
            </div>
          </div>
          <div className="w-[1px] h-8 bg-border" />
          <div className="flex flex-col items-end">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Active Missions</span>
            <span className="text-[14px] font-mono font-medium">{stats.running}</span>
          </div>
          <div className="w-[1px] h-8 bg-border" />
          <div className="flex flex-col items-end">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Learning Artifacts</span>
            <span className="text-[14px] font-mono font-medium">{stats.learningArtifacts}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row w-full flex-1 min-h-0">
        <div className="flex flex-col flex-1 border-r border-border min-w-0">
          <div className="flex flex-col flex-1">
            <div className="flex items-center justify-between px-8 py-4 border-b border-border bg-muted/30">
              <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Rocket className="size-3.5" /> Live Missions
              </span>
              <span className="text-[12px] font-mono font-medium bg-border px-2 py-0.5 rounded-sm">{missions.length} Total</span>
            </div>

            <div className="flex flex-col divide-y divide-border">
              {loading ? (
                <div className="px-8 py-8 text-sm text-muted-foreground">Loading live mission data...</div>
              ) : error ? (
                <div className="px-8 py-8 text-sm text-red-500">{error}</div>
              ) : missionRows.length === 0 ? (
                <div className="px-8 py-10 text-center text-muted-foreground">
                  <div className="mx-auto mb-4 size-10 rounded-sm border border-border flex items-center justify-center">
                    <Sparkles className="size-4" />
                  </div>
                  <p>No missions yet. Use the planner to create the first software institution loop.</p>
                </div>
              ) : (
                missionRows.slice(0, 4).map((mission) => (
                  <div key={mission.id} className="flex flex-col px-8 py-5 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setSelection({ id: mission.id, type: "mission" })}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] font-mono text-muted-foreground uppercase tracking-wider bg-muted px-2 py-0.5 rounded-sm">{mission.id}</span>
                      <span className={cn(
                        "text-[11px] font-bold uppercase tracking-wider",
                        mission.status === "completed"
                          ? "text-emerald-500"
                          : mission.status === "running"
                            ? "text-blue-500"
                            : mission.status === "waiting_review"
                              ? "text-amber-500"
                              : "text-red-500",
                      )}>
                        {mission.status.replace("_", " ")}
                      </span>
                    </div>
                    <span className="text-[15px] font-bold text-foreground">{mission.name}</span>
                    <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
                      <span className="text-[13px] text-muted-foreground flex items-center gap-1.5">
                        <Shield className="size-3.5" /> {mission.institution}
                      </span>
                      <span className="text-[13px] text-muted-foreground flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded-sm">
                        <Database className="size-3.5" /> {mission.evidence} evidence
                      </span>
                      <span className="text-[13px] text-muted-foreground flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded-sm">
                        <Clock className="size-3.5" /> {mission.started}
                      </span>
                      <button
                        className="ml-auto flex items-center gap-1 text-[12px] font-medium text-blue-600 hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelection({ id: mission.id, type: "mission" });
                          setView("execution");
                        }}
                      >
                        Open <ArrowRight className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-col border-t border-border">
            <div className="flex items-center justify-between px-8 py-4 border-b border-border bg-red-500/5">
              <span className="text-[12px] font-bold text-red-500 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="size-3.5" /> Critical / Blocked
              </span>
            </div>
            <div className="px-8 py-5">
              <div className="text-[13px] text-muted-foreground">
                {stats.blocked > 0
                  ? `${stats.blocked} mission(s) are blocked and need review.`
                  : "No blocked missions in the live workspace."}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex flex-col border-b border-border">
            <div className="flex items-center justify-between px-8 py-4 border-b border-border bg-muted/30">
              <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Target className="size-3.5" /> Mission Loop
              </span>
              <span className="text-[11px] font-mono bg-muted px-2 py-0.5 rounded-sm text-muted-foreground">
                Planning → Learning
              </span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-0">
              <div className="flex flex-col divide-y divide-border">
                {stages.map((stage) => (
                  <div key={stage.id} className="flex items-start gap-4 px-8 py-4">
                    <div className={cn(
                      "mt-0.5 size-8 rounded-sm border flex items-center justify-center shrink-0",
                      stage.complete
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                        : stage.active
                          ? "border-blue-500/20 bg-blue-500/10 text-blue-500"
                          : "border-border bg-muted text-muted-foreground",
                    )}>
                      <CheckCircle2 className="size-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[14px] font-bold text-foreground">{stage.label}</span>
                      <span className="text-[13px] text-muted-foreground mt-0.5">{stage.detail}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col border-l border-border bg-muted/10">
                <div className="flex items-center justify-between px-8 py-4 border-b border-border bg-muted/30">
                  <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <FileText className="size-3.5" /> Latest Artifact
                  </span>
                </div>
                <div className="flex flex-col gap-4 p-8">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Verification</span>
                    <span className={cn(
                      "text-[11px] font-bold uppercase tracking-wider",
                      latestMission?.verificationRun?.finalDecision === "PASS"
                        ? "text-emerald-500"
                        : latestMission?.verificationRun?.finalDecision === "FAIL"
                          ? "text-red-500"
                          : "text-amber-500",
                    )}>
                      {latestMission?.verificationRun?.finalDecision ?? "Pending"}
                    </span>
                  </div>
                  <div className="text-[13px] text-muted-foreground">
                    {latestMission?.verificationRun?.finalDecision
                      ? `Confidence ${latestMission.verificationRun.confidence ?? "n/a"}`
                      : "No verification has run yet for the current live mission."}
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Settlement</span>
                    <span className={cn("text-[11px] font-bold uppercase tracking-wider", latestCertificate ? "text-emerald-500" : "text-muted-foreground")}>
                      {latestCertificate ? "Issued" : "Pending"}
                    </span>
                  </div>
                  <div className="text-[13px] text-muted-foreground">
                    {latestCertificate?.summary ?? "No certificate has been issued yet."}
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Learning artifact</span>
                    <span className={cn("text-[11px] font-bold uppercase tracking-wider", latestMemoryRecord ? "text-blue-500" : "text-muted-foreground")}>
                      {latestMemoryRecord ? "Recorded" : "Pending"}
                    </span>
                  </div>
                  <div className="text-[13px] text-muted-foreground">
                    {latestMemoryRecord?.summary ?? "No learning artifact has been recorded yet."}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col flex-1 bg-muted/10">
            <div className="flex items-center justify-between px-8 py-4 border-b border-border bg-muted/30">
              <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Database className="size-3.5" /> Reality Ledger
              </span>
            </div>
            <div className="flex flex-col divide-y divide-border">
              {recentSignals.map((signal, index) => (
                <div key={`${signal.event}-${index}`} className="flex items-start gap-4 px-8 py-4 hover:bg-muted/50 transition-colors">
                  <div className="text-[12px] font-mono text-muted-foreground w-16 pt-0.5 shrink-0">{signal.time}</div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-foreground">{signal.event}</span>
                    <span className="text-[13px] text-muted-foreground mt-0.5">{signal.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col flex-1 border-t border-border bg-muted/5">
            <div className="flex items-center justify-between px-8 py-4 border-b border-border bg-muted/30">
              <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="size-3.5" /> End-to-End Mission Loop
              </span>
            </div>
            <div className="flex flex-col gap-4 p-8">
              <p className="text-[13px] text-muted-foreground max-w-2xl">
                Launch one live mission and drive it through planning, execution, evidence, verification, settlement, and learning. The backend already records the loop; this panel makes the path visible and actionable.
              </p>
              {demoError && <div className="text-[13px] text-red-500">{demoError}</div>}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => void launchFullMissionLoop()}
                  disabled={runningDemo || primaryInstitution === null}
                  className="flex items-center gap-2 px-5 py-2 bg-[#0f52ff] text-white rounded-md text-[13px] font-semibold hover:bg-[#0f52ff]/90 transition-colors disabled:opacity-60"
                >
                  <Play className="size-4" />
                  {runningDemo ? "Running..." : "Run Full Mission Loop"}
                </button>
                <button
                  onClick={openLatestMission}
                  disabled={!latestMission}
                  className="flex items-center gap-2 px-5 py-2 border border-border rounded-md text-[13px] font-semibold hover:bg-muted transition-colors disabled:opacity-60"
                >
                  <ArrowRight className="size-4" />
                  Open Latest Mission
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="rounded-md border border-border bg-card p-4">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Templates</div>
                  <div className="mt-1 text-[18px] font-semibold">{templates.length}</div>
                </div>
                <div className="rounded-md border border-border bg-card p-4">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Verified</div>
                  <div className="mt-1 text-[18px] font-semibold">{stats.verified}</div>
                </div>
                <div className="rounded-md border border-border bg-card p-4">
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Evidence</div>
                  <div className="mt-1 text-[18px] font-semibold">{stats.evidence}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


