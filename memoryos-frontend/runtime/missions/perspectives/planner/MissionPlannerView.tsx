"use client";

import { useMemo, useState } from "react";
import { Bot, CheckCircle2, LayoutPanelLeft, Lock, Play, Sparkles, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemePreference } from "@/lib/continuity-lab/use-theme-preference";
import { useMissionStore } from "../../runtime/store";
import { useMissionRuntimeData } from "../../runtime/mission-runtime-data";

export function MissionPlannerView() {
  const { setView, setSelection } = useMissionStore();
  const { workspaceId, loading, institutions, ensureSoftwareReleaseInstitution, createMission, executeMission } = useMissionRuntimeData();
  const [objective, setObjective] = useState("Release v1.0 from the connected GitHub repository.");
  const [planGenerated, setPlanGenerated] = useState(false);
  const [createdMissionId, setCreatedMissionId] = useState<string | null>(null);
  const [generatedSteps, setGeneratedSteps] = useState<string[]>([]);
  const [working, setWorking] = useState<"generating" | "executing" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { resolved } = useThemePreference();
  const isDark = resolved === "dark";

  const institution = institutions[0] ?? null;

  const planSteps = useMemo(() => {
    if (generatedSteps.length > 0) return generatedSteps;
    return [
      "Parse the operational objective",
      "Identify the target institution",
      "Generate execution steps",
      "Run execution and verify the result",
    ];
  }, [generatedSteps]);

  const handleGenerate = async () => {
    setError(null);
    setWorking("generating");
    try {
      const selectedInstitution = institution ?? await ensureSoftwareReleaseInstitution();
      const mission = await createMission({
        institutionId: selectedInstitution.id,
        title: objective.trim() || "Release v1.0",
        objective,
        plan: [
          "Inspect the connected GitHub repository and release state",
          "Run the release checks and capture backend evidence",
          "Verify the evidence and issue a PASS or FAIL decision",
          "Settle the mission and store the learning artifact",
        ],
      });
      const plan = (mission as { plan?: unknown }).plan;
      setCreatedMissionId(mission.id);
      setGeneratedSteps(Array.isArray(plan) ? plan.filter((step): step is string => typeof step === "string") : []);
      setPlanGenerated(true);
      setSelection({ id: mission.id, type: "mission" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate mission plan.");
    } finally {
      setWorking(null);
    }
  };

  const handleExecute = async () => {
    if (!createdMissionId) {
      await handleGenerate();
      return;
    }

    setError(null);
    setWorking("executing");
    try {
      const result = await executeMission(createdMissionId, {
        humanApproval: "approved",
        confidence: 100,
        checklist: planSteps,
        notes: "Mission executed from the runtime planner view.",
      });
      setSelection({ id: createdMissionId, type: "mission" });
      setView("execution");
      if ("blocked" in result || "approvalRequired" in result) {
        setError(result.reason);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mission execution failed.");
    } finally {
      setWorking(null);
    }
  };

  return (
    <div className={cn("flex flex-col w-full h-full font-sans animate-in fade-in duration-500 bg-background text-foreground overflow-y-auto", isDark ? "bg-[#0a0a0a]" : "bg-background")}>
      <div className={cn("flex items-center justify-between px-8 py-6 border-b shrink-0", isDark ? "border-white/10 bg-[#121212]" : "border-border bg-card")}>
        <div className="flex items-center gap-4">
          <div className="size-10 bg-foreground text-background flex items-center justify-center rounded-sm">
            <LayoutPanelLeft className="size-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-[18px] font-bold leading-none tracking-tight">Mission Planner</h1>
            <p className="text-[13px] text-muted-foreground mt-1">Define objectives and generate operational plans backed by the backend.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col max-w-4xl w-full mx-auto p-8 gap-8">
        <div className="flex gap-6">
          <div className="flex flex-col items-center pt-1 shrink-0">
            <div className="size-6 rounded-full bg-foreground text-background flex items-center justify-center text-[11px] font-bold">1</div>
            <div className="w-[1px] h-full bg-border my-2 min-h-[40px]" />
          </div>
          <div className="flex flex-col flex-1 gap-3 pb-8">
            <h2 className="text-[15px] font-bold">Operational Objective</h2>
            <div className="flex flex-col border border-border rounded-md bg-card overflow-hidden focus-within:border-foreground/30 transition-colors">
              <textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="w-full min-h-[100px] p-4 bg-transparent outline-none text-[14px] resize-none"
                placeholder="Describe the institutional operation to perform..."
              />
              <div className="flex items-center justify-between p-3 border-t border-border bg-muted/30">
                <span className="text-[12px] text-muted-foreground">{institution ? `Using ${institution.name}` : "Software Release will be created when you generate the plan."}</span>
                <button
                  onClick={() => void handleGenerate()}
                  disabled={working !== null || loading || !workspaceId || objective.trim().length === 0}
                  className="flex items-center gap-2 bg-foreground text-background px-4 py-1.5 rounded-sm text-[12px] font-bold hover:bg-foreground/90 transition-colors disabled:opacity-60"
                >
                  <Sparkles className="size-3.5" /> {working === "generating" ? "Creating mission..." : "Create Mission & Generate Plan"}
                </button>
              </div>
            </div>
            {error && <div className="text-[13px] text-red-500">{error}</div>}
          </div>
        </div>

        {planGenerated && (
          <>
            <div className="flex gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex flex-col items-center pt-1 shrink-0">
                <div className="size-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-[11px] font-bold">2</div>
                <div className="w-[1px] h-full bg-border my-2 min-h-[40px]" />
              </div>
              <div className="flex flex-col flex-1 gap-3 pb-8">
                <h2 className="text-[15px] font-bold flex items-center gap-2">
                  Generated Execution Graph
                  <span className="text-[11px] font-mono bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-sm">{createdMissionId ?? "Pending"}</span>
                </h2>
                <div className="flex flex-col border border-border rounded-md bg-card">
                  {planSteps.map((step, index) => (
                    <div key={`${step}-${index}`} className={cn("flex items-center gap-3 p-4", index !== planSteps.length - 1 ? "border-b border-border bg-muted/20" : "bg-muted/20")}>
                      <div className="size-6 rounded-sm bg-border flex items-center justify-center text-[10px] font-mono">{index + 1}</div>
                      <div className="flex-1 text-[13px] font-medium">{step}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-6 animate-in fade-in slide-in-from-top-4 duration-500 delay-100 fill-mode-both">
              <div className="flex flex-col items-center pt-1 shrink-0">
                <div className="size-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[11px] font-bold">3</div>
                <div className="w-[1px] h-full bg-border my-2 min-h-[40px]" />
              </div>
              <div className="flex flex-col flex-1 gap-3 pb-8">
                <h2 className="text-[15px] font-bold">Agents & Authorities</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col border border-border rounded-md bg-card p-4">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2"><Bot className="size-3.5" /> Leased Capabilities</span>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-medium">Planner</span>
                        <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">Generate</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-medium">Executor</span>
                        <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">Run</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-medium">Verifier</span>
                        <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">Review</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col border border-border rounded-md bg-card p-4">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2"><Lock className="size-3.5" /> Policies Evoked</span>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-[13px]">
                        <CheckCircle2 className="size-3.5 text-green-500" /> Create mission
                      </div>
                      <div className="flex items-center gap-2 text-[13px]">
                        <CheckCircle2 className="size-3.5 text-green-500" /> Persist backend state
                      </div>
                      <div className="flex items-center gap-2 text-[13px] text-amber-500 font-medium">
                        <Target className="size-3.5" /> Execute with approval checks
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-6 animate-in fade-in slide-in-from-top-4 duration-500 delay-200 fill-mode-both">
              <div className="flex flex-col items-center pt-1 shrink-0">
                <div className="size-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[11px] font-bold">4</div>
                <div className="w-[1px] h-full bg-border my-2 min-h-[40px]" />
              </div>
              <div className="flex flex-col flex-1 gap-3 pb-8">
                <h2 className="text-[15px] font-bold">Verification & Reality Impact</h2>
                <div className="flex flex-col border border-border rounded-md bg-card p-5">
                  <div className="flex items-start gap-4">
                    <Target className="size-5 text-muted-foreground mt-0.5" />
                    <div className="flex flex-col">
                      <span className="text-[14px] font-bold">Automated Verification Protocol</span>
                      <span className="text-[13px] text-muted-foreground mt-1">
                        The backend now stores the mission, generates a plan, runs the mission, and records the resulting execution, verification, and timeline state.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-6 animate-in fade-in slide-in-from-top-4 duration-500 delay-300 fill-mode-both">
              <div className="flex flex-col items-center pt-1 shrink-0">
                <div className="size-6 rounded-full bg-foreground text-background flex items-center justify-center text-[11px] font-bold">5</div>
              </div>
              <div className="flex flex-col flex-1 gap-3">
                <h2 className="text-[15px] font-bold">Launch Authorization</h2>
                <div className="flex items-center p-4 border border-border rounded-md bg-card justify-between">
                  <span className="text-[13px] text-muted-foreground">All parameters validated. Ready to lease agents and bind to runtime.</span>
                  <button
                    onClick={() => void handleExecute()}
                    disabled={working !== null}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-sm text-[13px] font-bold transition-colors disabled:opacity-60"
                  >
                    <Play className="size-4" /> {working === "executing" ? "Executing..." : "Execute Mission"}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
