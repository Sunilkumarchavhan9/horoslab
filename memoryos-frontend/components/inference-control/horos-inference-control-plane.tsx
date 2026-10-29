"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { horosAdapter } from "@/lib/adapters/horos-adapter";
import {
  Program,
  ModelEntity,
  RunEntity,
  DeploymentEntity,
  RegistryArtifact,
  EvidenceItem,
  HorosRuntimeOverview,
  CandidateProfile,
} from "@/lib/horos-types";
import { HorosHeader } from "../horos/shell/horos-header";
import { HorosSubnav, HorosNavRoute } from "../horos/shell/horos-subnav";
import { HorosSidebar } from "../horos/shell/horos-sidebar";
import { HorosCommandDialog } from "../horos/shell/horos-command-dialog";
import { HorosShortcutsDialog } from "../horos/shell/horos-shortcuts-dialog";
import { HomeView } from "../horos/views/home-view";
import { ProgramsListView } from "../horos/views/programs-list-view";
import { ProgramDetailView } from "../horos/views/program-detail-view";
import { PipelineWorkspaceView } from "../horos/views/pipeline-workspace-view";
import { NewProgramModal } from "../horos/views/new-program-modal";
import { ModelsCatalogView, CANONICAL_HOSTED_MODELS } from "../horos/views/models-catalog-view";
import { ModelDetailView } from "../horos/views/model-detail-view";
import { RunsListView } from "../horos/views/runs-list-view";
import { RunDetailView } from "../horos/views/run-detail-view";
import { DeploymentsView } from "../horos/views/deployments-view";
import { RegistryView } from "../horos/views/registry-view";
import { WeightsView } from "../horos/views/weights-view";
import { UsageAnalyticsView } from "../horos/views/usage-analytics-view";
import { EvidenceView } from "../horos/views/evidence-view";
import { SettingsView } from "../horos/views/settings-view";
import { RealityView } from "../horos/views/reality-view";
import { CapabilitiesView } from "../horos/views/capabilities-view";
import { SystemsView } from "../horos/views/systems-view";
import { ExperimentsView } from "../horos/views/experiments-view";
import { GovernanceView } from "../horos/views/governance-view";
import { LearningView } from "../horos/views/learning-view";
import { cn } from "@/lib/utils";

interface HorosInferenceControlPlaneProps {
  workspaceId: string;
}

export function HorosInferenceControlPlane({
  workspaceId,
}: HorosInferenceControlPlaneProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Navigation state
  const rawView = searchParams.get("view") as HorosNavRoute | null;
  const initialView: HorosNavRoute = rawView && [
    "home",
    "programs",
    "reality",
    "capabilities",
    "models",
    "systems",
    "experiments",
    "runs",
    "deployments",
    "analytics",
    "weights",
    "registry",
    "evidence",
    "governance",
    "settings",
  ].includes(rawView)
    ? rawView
    : "home";

  const [activeRoute, setActiveRoute] = useState<HorosNavRoute>(initialView);
  const [settingsTab, setSettingsTab] = useState<"workspace" | "notifications" | "billing" | "cost" | "keys" | "clouds" | "security">("workspace");

  const [activePipelineWorkspace, setActivePipelineWorkspace] = useState<{
    title: string;
    prompt: string;
    executionContext?: Record<string, unknown>;
    programId?: string;
    runId?: string;
    runStatus?: string;
    runError?: string;
  } | null>(null);

  const [displayLayout, setDisplayLayout] = useState<"top_bar" | "sidebar">("top_bar");

  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(
    searchParams.get("programId") || null
  );
  const [selectedModelId, setSelectedModelId] = useState<string | null>(
    searchParams.get("modelId") || null
  );
  const [selectedRunId, setSelectedRunId] = useState<string | null>(
    searchParams.get("runId") || null
  );

  // Modal states
  const [commandOpen, setCommandOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [newProgramModalOpen, setNewProgramModalOpen] = useState(false);
  const [newProgramInitialPrompt, setNewProgramInitialPrompt] = useState("");
  const [dark, setDark] = useState(true);
  const [activeWorkspace, setActiveWorkspace] = useState("Production US-East");

  // Data state
  const [overview, setOverview] = useState<HorosRuntimeOverview | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgramRuns, setSelectedProgramRuns] = useState<Record<string, unknown>[]>([]);
  const [models, setModels] = useState<ModelEntity[]>([]);
  const [runs, setRuns] = useState<RunEntity[]>([]);
  const [deployments, setDeployments] = useState<DeploymentEntity[]>([]);
  const [registry, setRegistry] = useState<RegistryArtifact[]>([]);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Keep the control plane synchronized with live backend state while it is open.
  const loadData = useCallback(async () => {
    try {
      // Clear data error on new attempt
      if (dataError) setDataError(null);

      if (workspaceId === "local-dev-workspace") {
        // Silently use empty states for local UI development
        setOverview(null);
        setPrograms([]);
        setModels([]);
        setRuns([]);
        setDeployments([]);
        setRegistry([]);
        setEvidence([]);
        return;
      }

      // Fetch sequentially to avoid backend 429 rate limits on 7 simultaneous requests
      const o = await horosAdapter.getOverview(workspaceId);
      const p = await horosAdapter.getPrograms(workspaceId);
      const m = await horosAdapter.getModels(workspaceId);
      const r = await horosAdapter.getRuns(workspaceId);
      const d = await horosAdapter.getDeployments(workspaceId);
      const reg = await horosAdapter.getRegistry(workspaceId);
      const ev = await horosAdapter.getEvidence(workspaceId);

      setOverview(o);
      setPrograms(p);
      setModels(m);
      setRuns(r);
      setDeployments(d);
      setRegistry(reg);
      setEvidence(ev);
      setDataError(null);
    } catch (err) {
      setDataError(err instanceof Error ? err.message : "HOROS runtime data could not be loaded.");
      console.error("Failed to fetch HOROS runtime data:", err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void loadData();
    const refreshTimer = window.setInterval(() => {
      // Don't poll if we're encountering backend errors (like 429 or 404) to avoid getting blocked
      if (document.visibilityState === "visible" && !dataError) void loadData();
    }, 10_000);

    return () => window.clearInterval(refreshTimer);
  }, [loadData, dataError]);

  const loadProgramRuns = useCallback(async (programId: string) => {
    try {
      const programRuns = await horosAdapter.listProgramRuns(workspaceId, programId);
      setSelectedProgramRuns(programRuns);
    } catch (error) {
      console.error("Failed to fetch persisted program runs:", error);
      setSelectedProgramRuns([]);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (selectedProgramId) void loadProgramRuns(selectedProgramId);
    else setSelectedProgramRuns([]);
  }, [loadProgramRuns, selectedProgramId]);

  // Route changer with URL sync
  function handleNavigate(route: string) {
    setActivePipelineWorkspace(null);
    if (route.startsWith("settings-")) {
      const tab = route.replace("settings-", "") as typeof settingsTab;
      setSettingsTab(tab);
      setActiveRoute("settings");
      router.push(`/mission-control?view=settings`);
      return;
    }

    let targetRoute = route as HorosNavRoute;
    if (route === "deployments") {
      targetRoute = "analytics";
    }
    if (route === "weights") {
      targetRoute = "models";
    }
    if (route === "registry") {
      targetRoute = "evidence";
    }

    setActiveRoute(targetRoute);
    setSelectedProgramId(null);
    setSelectedModelId(null);
    setSelectedRunId(null);
    router.push(`/mission-control?view=${targetRoute}`);
  }

  function handleSelectProgram(id: string) {
    setActivePipelineWorkspace(null);
    setSelectedProgramId(id);
    setSelectedProgramRuns([]);
    setActiveRoute("programs");
    router.push(`/mission-control?view=programs&programId=${id}`);
  }

  function handleSelectModel(id: string) {
    setActivePipelineWorkspace(null);
    setSelectedModelId(id);
    setActiveRoute("models");
    router.push(`/mission-control?view=models&modelId=${id}`);
  }

  function handleSelectRun(id: string) {
    setActivePipelineWorkspace(null);
    setSelectedRunId(id);
    setActiveRoute("runs");
    router.push(`/mission-control?view=runs&runId=${id}`);
  }

  async function handleCreateProgram(payload: {
    name: string;
    objective: string;
    modelTarget: string;
    targetHardware?: string;
    maxCostPerReq?: number;
    p95LatencyMsTarget?: number;
    minQualityRetentionPct?: number;
  }) {
    const created = await horosAdapter.createProgram(workspaceId, payload);
    await loadData();
    handleSelectProgram(created.id);
  }

  function handleLaunchPrompt(prompt: string, metadata?: Record<string, unknown>) {
    const requestedModel = typeof metadata?.model === "string" ? metadata.model : "";
    const requestedEngine = typeof metadata?.engine === "string" ? metadata.engine : "";
    const requestedGpu = typeof metadata?.gpu === "string" ? metadata.gpu : "";
    const model = requestedModel && requestedModel !== "unselected" ? requestedModel : "Auto-selected model";
    const engine = requestedEngine && requestedEngine !== "Auto" ? requestedEngine : "Auto-selected runtime";
    const gpu = requestedGpu && requestedGpu !== "Auto" ? requestedGpu : "Auto-selected GPU";
    const workload = typeof metadata?.workload === "string" ? metadata.workload : "Auto workload profile";

    // Keep the structured decision inputs with the workspace so they reach
    // the persisted program/run instead of remaining display-only state.
    setActivePipelineWorkspace({
      title: model !== "Auto-selected model" ? `Optimize ${model}` : "Untitled Pipeline",
      prompt,
      executionContext: {
        ...metadata,
        model,
        engine,
        gpu,
        workload,
        capturedAt: new Date().toISOString(),
      },
    });
  }

  async function handleAcceptAndRun(payload: { title: string; prompt: string }) {
    setActivePipelineWorkspace((current) => current ? {
      ...current,
      runStatus: "submitting",
      runError: undefined,
    } : current);

    try {
      let programId = activePipelineWorkspace?.programId;
      const executionContext = activePipelineWorkspace?.executionContext ?? {};
      if (!programId) {
        const created = await horosAdapter.createProgram(workspaceId, {
          name: payload.title || "Untitled Pipeline",
          objective: payload.prompt,
          questions: [payload.prompt, { type: "horos_execution_context", ...executionContext }],
        });
        programId = created.id;
      }

      const run = await horosAdapter.createProgramRun(workspaceId, programId, {
        name: payload.title || "Untitled Pipeline run",
        prompt: payload.prompt,
        source: "pipeline_workspace",
        executionContext,
      });

      setActivePipelineWorkspace((current) => current ? {
        ...current,
        programId,
        runId: String(run.id),
        runStatus: String(run.status ?? "queued"),
        runError: undefined,
      } : current);
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to queue pipeline run.";
      setActivePipelineWorkspace((current) => current ? {
        ...current,
        runStatus: undefined,
        runError: message,
      } : current);
      throw error;
    }
  }

  async function handleDeployCandidate(candidate: CandidateProfile) {
    try {
      await horosAdapter.createDeployment(workspaceId, {
        name: candidate.name,
        model: candidate.name,
        environment: "staging",
        executionDomain: candidate.executionDomain,
        activeVersion: candidate.id,
      });
      await loadData();
      handleNavigate("deployments");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Deployment could not be created.");
    }
  }

  async function handleRollbackDeployment(depId: string) {
    try {
      await horosAdapter.rollbackDeployment(workspaceId, depId);
      await loadData();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Deployment rollback is not available through the live HOROS API.");
    }
  }

  async function handleRunSweep(programId: string) {
    try {
      const updated = await horosAdapter.updateProgramStatus(workspaceId, programId, "benchmarking");
      if (!updated) throw new Error("Program could not be updated through the live HOROS API.");
      await loadData();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Benchmark sweep could not be started.");
    }
  }

  const selectedProgram = selectedProgramId
    ? programs.find((p) => p.id === selectedProgramId)
    : null;

  const allAvailableModels = models.length > 0 ? models : CANONICAL_HOSTED_MODELS;

  const selectedModel = selectedModelId
    ? allAvailableModels.find((m) => m.id === selectedModelId) ?? null
    : null;

  const selectedRun = selectedRunId
    ? runs.find((r) => r.id === selectedRunId)
    : null;

  // If in interactive pipeline workspace view
  if (activePipelineWorkspace) {
    return (
      <PipelineWorkspaceView
        pipelineTitle={activePipelineWorkspace.title}
        initialPrompt={activePipelineWorkspace.prompt}
        executionContext={activePipelineWorkspace.executionContext}
        onBack={() => setActivePipelineWorkspace(null)}
        onNavigateToPipelines={() => {
          setActivePipelineWorkspace(null);
          handleNavigate("programs");
        }}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        dark={dark}
        onToggleTheme={() => setDark(!dark)}
        onAcceptAndRun={handleAcceptAndRun}
        runStatus={activePipelineWorkspace.runStatus}
        runError={activePipelineWorkspace.runError}
      />
    );
  }

  return (
    <div className={dark ? "min-h-screen bg-[#151515] text-[#f0f3ee] font-sans antialiased flex" : "min-h-screen bg-[#fbfbfa] text-[#151515] font-sans antialiased flex"}>
      {/* Optional Left Sidebar Layout matching Screenshot 1 */}
      {displayLayout === "sidebar" && (
        <HorosSidebar
          activeRoute={activeRoute}
          onNavigate={(r) => handleNavigate(r)}
          onOpenCommand={() => setCommandOpen(true)}
          dark={dark}
          onToggleTheme={() => setDark(!dark)}
          userBalance={overview?.balanceUsd ?? 10.0}
          displayLayout={displayLayout}
          onToggleLayout={(l) => setDisplayLayout(l)}
          settingsTab={settingsTab}
          onSelectSettingsTab={(tab) => setSettingsTab(tab)}
          onBackFromSettings={() => handleNavigate("home")}
          onSelectPipeline={() => {
            setActivePipelineWorkspace({
              title: "Untitled Pipeline",
              prompt: "Describe the objective, constraints, and evidence required for this optimization run.",
            });
          }}
        />
      )}

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header & Subnav Sticky Container */}
        {displayLayout === "top_bar" && (
          <header className={cn(
            "sticky top-0 z-50 transition-colors border-b backdrop-blur-md",
            dark ? "bg-[#141414]/95 border-[#242424]" : "bg-white/95 border-[#e5e7eb]"
          )}>
            <HorosHeader
              onOpenCommand={() => setCommandOpen(true)}
              dark={dark}
              onToggleTheme={() => setDark(!dark)}
              onOpenSettings={() => {
                setSettingsTab("workspace");
                handleNavigate("settings");
              }}
              balanceUsd={overview?.balanceUsd ?? 9.51}
            />

            {/* Primary Subnav */}
            <HorosSubnav
              activeRoute={activeRoute}
              onNavigate={(r) => handleNavigate(r)}
              dark={dark}
              className="border-b-0 bg-transparent"
            />
          </header>
        )}

        {/* Main Content Workspace Container */}
        <main className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 md:py-10 flex-1">
          {dataError && (
            <div className="mb-4 flex items-center justify-between gap-4 border border-[#d7a8a8] bg-[#fff7f7] px-4 py-3 text-xs text-[#8f3030]">
              <span>Live HOROS data is unavailable: {dataError}</span>
              <button className="font-medium underline" onClick={() => void loadData()}>Retry</button>
            </div>
          )}
          {loading && !overview ? (
            <div className={cn(
              "flex min-h-[300px] flex-col items-center justify-center border border-dashed p-12 text-center rounded-xs",
              dark ? "border-[#282828] bg-[#141414] text-[#C8C7BA]" : "border-[#c9cec4] bg-white text-[#6b7367]"
            )}>
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#75bf00] border-t-transparent mb-3" />
              <p className="text-xs font-mono uppercase tracking-[0.14em]">
                Initializing HOROS AI Control Plane Runtime...
              </p>
            </div>
          ) : (
            <>
              {/* View Switching */}
              {activeRoute === "home" && (
                <HomeView
                  overview={overview || undefined}
                  programs={programs}
                  models={models}
                  onSelectProgram={handleSelectProgram}
                  onLaunchPrompt={handleLaunchPrompt}
                  onNavigateToEvidence={() => handleNavigate("evidence")}
                  onNavigateToPipelines={() => handleNavigate("programs")}
                  onRefresh={loadData}
                  onSelectPipeline={(pipeline) => {
                    setActivePipelineWorkspace({
                      title: pipeline.title,
                      prompt: pipeline.prompt,
                    });
                  }}
                  dark={dark}
                />
              )}

              {activeRoute === "programs" && (
                selectedProgram ? (
                  <ProgramDetailView
                    program={selectedProgram}
                    runs={selectedProgramRuns}
                    onBack={() => setSelectedProgramId(null)}
                    onDeployCandidate={handleDeployCandidate}
                    onReviewEvidence={() => handleNavigate("evidence")}
                    onPauseProgram={async (pid) => {
                      await horosAdapter.updateProgramStatus(workspaceId, pid, "paused");
                      await loadData();
                    }}
                    onRunSweep={handleRunSweep}
                  />
                ) : (
                  <ProgramsListView
                    programs={programs}
                    onSelectProgram={handleSelectProgram}
                    onOpenNewProgram={() => {
                      handleNavigate("home");
                    }}
                    onSelectPipeline={(pipeline) => {
                      setActivePipelineWorkspace({
                        title: pipeline.title,
                        prompt: pipeline.prompt,
                      });
                    }}
                    dark={dark}
                  />
                )
              )}

              {activeRoute === "models" && (
                selectedModel ? (
                  <ModelDetailView
                    model={selectedModel}
                    onBack={() => setSelectedModelId(null)}
                    onStartProgramWithModel={(mName) => {
                      setActivePipelineWorkspace({
                        title: `Optimize ${mName}`,
                        prompt: `Optimize @${mName} for production latency and cost budgets`,
                      });
                    }}
                    onManageKeys={() => handleNavigate("settings-keys")}
                    dark={dark}
                  />
                ) : (
                  <ModelsCatalogView
                    models={allAvailableModels}
                    onSelectModel={handleSelectModel}
                    onSearchModels={(query) => horosAdapter.searchHuggingFaceModels(workspaceId, query)}
                    onOpenImport={() => {
                      setNewProgramInitialPrompt("Import model weights from Hugging Face");
                      setNewProgramModalOpen(true);
                    }}
                    onManageKeys={() => handleNavigate("settings-keys")}
                    dark={dark}
                  />
                )
              )}

              {activeRoute === "deployments" && (
                <DeploymentsView
                  deployments={deployments}
                  onRollback={handleRollbackDeployment}
                  onSelectProgram={handleSelectProgram}
                  dark={dark}
                />
              )}

              {activeRoute === "runs" && (
                selectedRun ? (
                  <RunDetailView
                    run={selectedRun}
                    onBack={() => setSelectedRunId(null)}
                    dark={dark}
                  />
                ) : (
                  <RunsListView
                    runs={runs}
                    onSelectRun={handleSelectRun}
                    onRefresh={loadData}
                    dark={dark}
                  />
                )
              )}

              {activeRoute === "reality" && (
                <RealityView
                  dark={dark}
                  onSelectEntity={(entId) => console.log("Selected reality entity:", entId)}
                  onTriggerRediscovery={loadData}
                />
              )}

              {activeRoute === "capabilities" && (
                <CapabilitiesView
                  dark={dark}
                  onSelectModel={handleSelectModel}
                  onComposePipeline={(cap) => {
                    setActivePipelineWorkspace({
                      title: `Pipeline for ${cap.name}`,
                      prompt: `Compose optimized system for ${cap.name} (${cap.task})`,
                    });
                  }}
                />
              )}

              {activeRoute === "systems" && (
                <SystemsView
                  dark={dark}
                  onLaunchExperiment={(cand) => {
                    setActivePipelineWorkspace({
                      title: cand.name,
                      prompt: `Benchmark and optimize candidate ${cand.name}`,
                    });
                  }}
                  onDeploySystem={(cand) => {
                    handleDeployCandidate({
                      id: cand.id,
                      name: cand.name,
                      format: "FP8",
                      engine: "vLLM",
                      hardware: "1x A100",
                      executionDomain: "cloud",
                      metrics: {
                        latencyMs: cand.predictedMetrics.p95LatencyMs,
                        p95LatencyMs: cand.predictedMetrics.p95LatencyMs,
                        costPer1kTokens: cand.predictedMetrics.costPer1kReqUsd,
                        qualityScore: cand.predictedMetrics.qualityRetentionPct,
                        vramGb: cand.predictedMetrics.vramGb,
                        throughputTokensSec: 220,
                      },
                    });
                  }}
                />
              )}

              {activeRoute === "experiments" && (
                <ExperimentsView
                  dark={dark}
                  onRunBenchmark={(bench) => {
                    setActivePipelineWorkspace({
                      title: `Benchmark: ${bench.model}`,
                      prompt: `Execute benchmark run on ${bench.model} with ${bench.runtime}`,
                    });
                  }}
                />
              )}

              {activeRoute === "governance" && (
                <GovernanceView
                  dark={dark}
                  onNavigateToEvidence={() => handleNavigate("evidence")}
                  onNavigateToMissions={() => handleNavigate("programs")}
                />
              )}

              {activeRoute === "analytics" && (
                <UsageAnalyticsView
                  dark={dark}
                  onNavigateToModelApis={() => handleNavigate("models")}
                  onNavigateToPipelines={() => handleNavigate("programs")}
                  onNavigateToSettingsCost={() => {
                    setSettingsTab("cost");
                    handleNavigate("settings");
                  }}
                />
              )}

              {activeRoute === "weights" && (
                <WeightsView
                  dark={dark}
                  onOpenNewPipeline={() => handleNavigate("home")}
                  onContactSales={() => {
                    setSettingsTab("workspace");
                    handleNavigate("settings");
                  }}
                />
              )}

              {activeRoute === "registry" && (
                <RegistryView
                  artifacts={registry}
                  onNavigateToPipelines={() => handleNavigate("programs")}
                  dark={dark}
                />
              )}

              {activeRoute === "evidence" && (
                <EvidenceView
                  dark={dark}
                  onNavigateToPipelines={() => handleNavigate("programs")}
                  onNavigateToAnalytics={() => handleNavigate("analytics")}
                />
              )}

              {activeRoute === "learning" && (
                <LearningView
                  dark={dark}
                  onNavigateToMission={(mId) => handleNavigate("programs")}
                />
              )}

              {activeRoute === "settings" && (
                <SettingsView
                  initialTab={settingsTab}
                  onBack={() => handleNavigate("home")}
                  displayLayout={displayLayout}
                  onDisplayNavChange={(layout) => setDisplayLayout(layout)}
                  dark={dark}
                />
              )}
            </>
          )}
        </main>

      </div>

      {/* Global Command Palette Dialog matching Screenshot 1 */}
      <HorosCommandDialog
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onNavigate={handleNavigate}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        dark={dark}
      />

      {/* Keyboard Shortcuts Dialog matching Screenshot 2 */}
      <HorosShortcutsDialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
        dark={dark}
      />

      {/* New Program Command Creation Modal */}
      <NewProgramModal
        open={newProgramModalOpen}
        onClose={() => setNewProgramModalOpen(false)}
        onCreateProgram={handleCreateProgram}
        initialPrompt={newProgramInitialPrompt}
      />
    </div>
  );
}
