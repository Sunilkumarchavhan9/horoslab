"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Play,
  Pause,
  Rocket,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Layers,
  Activity,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Globe,
  Server,
  Cloud,
  Cpu,
  HelpCircle,
  TrendingDown,
  Scale,
} from "lucide-react";
import { Program, CandidateProfile } from "@/lib/dhyra-types";
import { ProgramPhaseRail } from "../primitives/program-phase-rail";
import { ThinkingPanel } from "../primitives/thinking-panel";
import { CandidateComparison } from "../primitives/candidate-comparison";
import { RecommendationCard } from "../primitives/recommendation-card";
import { DhyraButton } from "../ui/dhyra-button";
import { DhyraBadge } from "../ui/dhyra-badge";
import { DhyraStatusDot } from "../ui/dhyra-status-dot";
import { cn } from "@/lib/utils";

interface ProgramDetailViewProps {
  program: Program;
  runs?: Array<Record<string, unknown>>;
  onBack: () => void;
  onDeployCandidate?: (candidate: CandidateProfile) => void;
  onPauseProgram?: (programId: string) => void;
  onReviewEvidence?: (programId: string) => void;
  onRunSweep?: (programId: string) => void;
}

export function ProgramDetailView({
  program,
  runs = [],
  onBack,
  onDeployCandidate,
  onPauseProgram,
  onReviewEvidence,
  onRunSweep,
}: ProgramDetailViewProps) {
  const [detailTab, setDetailTab] = useState<"overview" | "hypotheses" | "gap" | "candidates" | "experiments">("overview");

  const best = program.bestCandidate;
  const outcome = program.outcomeTarget;
  const worldState = program.worldState;
  const gap = program.capabilityGap;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e1e4df] pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center border border-[#d8ddd3] bg-white text-[#687063] hover:border-[#171a17] hover:text-[#171a17] transition-colors"
            title="Back to Programs"
          >
            <ArrowLeft size={15} />
          </button>

          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#788274]">
              <span>Programs</span>
              <span>/</span>
              <span className="text-[#171a17] font-semibold">{program.name}</span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-[#171a17] md:text-2xl">
                {program.name}
              </h1>
              <DhyraBadge
                variant={
                  program.status === "optimizing"
                    ? "optimizing"
                    : program.status === "ready"
                    ? "healthy"
                    : "active"
                }
                showDot
                size="sm"
              >
                {program.status.toUpperCase()} • {program.currentPhase.toUpperCase()}
              </DhyraBadge>

              {program.hfIdentity && (
                <span className="border border-[#d8ddd3] bg-[#fafbfa] px-2 py-0.5 text-[10px] font-mono text-[#4b5247]">
                  HF: {program.hfIdentity.repositoryId} @ {program.hfIdentity.commitSha.slice(0, 7)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {onPauseProgram && (
            <DhyraButton
              variant="outline"
              size="sm"
              onClick={() => onPauseProgram(program.id)}
            >
              <Pause size={13} />
              <span>Pause</span>
            </DhyraButton>
          )}

          {onRunSweep && (
            <DhyraButton
              variant="secondary"
              size="sm"
              onClick={() => onRunSweep(program.id)}
            >
              <Play size={13} />
              <span>Run Benchmark Sweep</span>
            </DhyraButton>
          )}

          {best && onDeployCandidate && (
            <DhyraButton
              variant="action"
              size="sm"
              onClick={() => onDeployCandidate(best)}
            >
              <Rocket size={13} />
              <span>Deploy to Staging</span>
            </DhyraButton>
          )}
        </div>
      </div>

      {/* Persistent Horizontal Phase Rail */}
      <section>
        <ProgramPhaseRail currentPhase={program.currentPhase} status={program.status} />
      </section>

      {/* Verified Outcome Banner */}
      <section className="border border-[#b9de78] bg-[#fbfdf9] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center bg-[#75bf00] text-[#111]">
              <ShieldCheck size={16} strokeWidth={2.5} />
            </span>
            <div>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="font-bold text-[#2d5800] uppercase tracking-[0.1em]">Outcome Target:</span>
                <span className="text-[#171a17]">{outcome.objective}</span>
              </div>
              <div className="mt-0.5 text-xs text-[#525a4d]">
                Baseline: <span className="font-mono font-bold">${(outcome.baselineCostMonthly).toLocaleString()}/mo</span> → Observed: <span className="font-mono font-bold text-[#3c7000]">${(outcome.actualCostObservedMonthly ?? outcome.targetCostMonthly).toLocaleString()}/mo</span> (-31.6% monthly cost)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="border border-[#b9de78] bg-white px-2 py-0.5 font-bold text-[#2d5800]">
              VERDICT: {outcome.verdict}
            </span>
          </div>
        </div>
      </section>

      {/* Perspective Navigation Tabs inside Detail */}
      <div className="flex items-center gap-1 border-b border-[#d8ddd3] pb-1 overflow-x-auto text-xs font-medium">
        {[
          { id: "overview", label: "Executive Overview" },
          { id: "hypotheses", label: `Hypotheses (${program.hypotheses.length})` },
          { id: "gap", label: "World State & Capability Gap" },
          { id: "candidates", label: `Candidates & Cross-Domain (${program.candidates.length})` },
          { id: "experiments", label: `Experiment History (${runs.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setDetailTab(tab.id as typeof detailTab)}
            className={cn(
              "px-3 py-1.5 transition-colors",
              detailTab === tab.id
                ? "border-b-2 border-[#75bf00] text-[#151515] font-bold"
                : "text-[#6b7367] hover:text-[#171a17]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Executive Overview */}
      {detailTab === "overview" && (
        <div className="space-y-6">
          {/* Flagship Split Row: Current State & Dhyra Reasoning */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left: Current State & Best Candidate (6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="border border-[#d8ddd3] bg-white p-5">
                <div className="flex items-center justify-between border-b border-dashed border-[#d8ddd3] pb-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#171a17]">
                    Current Leading Candidate
                  </span>
                  {best ? (
                    <div className="flex items-center gap-1.5">
                      <span className="border border-[#bfdbfe] bg-[#eff6ff] px-1.5 py-0.5 text-[10px] font-mono text-[#1e40af] uppercase">
                        {best.executionDomain}
                      </span>
                      <DhyraBadge variant="healthy" size="sm">
                        {best.format} • {best.engine}
                      </DhyraBadge>
                    </div>
                  ) : null}
                </div>

                {best ? (
                  <div className="mt-4 space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[#171a17]">{best.name}</h3>
                      <p className="mt-0.5 text-xs text-[#687063]">
                        Deployed on {best.hardware}. {best.notes}
                      </p>
                    </div>

                    {/* 4-Box Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 font-mono">
                      <div className="border border-[#d8ddd3] bg-[#fafbfa] p-2.5">
                        <span className="block text-[10px] text-[#788274] uppercase font-sans">p95 Latency</span>
                        <span className="mt-1 block text-base font-bold text-[#3c7000]">
                          {best.metrics.p95LatencyMs} ms
                        </span>
                        <span className="text-[10px] text-[#3c7000]">↓ 31% vs base</span>
                      </div>

                      <div className="border border-[#d8ddd3] bg-[#fafbfa] p-2.5">
                        <span className="block text-[10px] text-[#788274] uppercase font-sans">Cost / 1k</span>
                        <span className="mt-1 block text-base font-bold text-[#3c7000]">
                          ${best.metrics.costPer1kTokens.toFixed(5)}
                        </span>
                        <span className="text-[10px] text-[#3c7000]">↓ 24% cheaper</span>
                      </div>

                      <div className="border border-[#d8ddd3] bg-[#fafbfa] p-2.5">
                        <span className="block text-[10px] text-[#788274] uppercase font-sans">Quality Retention</span>
                        <span className="mt-1 block text-base font-bold text-[#2563eb]">
                          {best.metrics.qualityScore.toFixed(1)}%
                        </span>
                        <span className="text-[10px] text-[#656d60]">-0.4% delta</span>
                      </div>

                      <div className="border border-[#d8ddd3] bg-[#fafbfa] p-2.5">
                        <span className="block text-[10px] text-[#788274] uppercase font-sans">VRAM Required</span>
                        <span className="mt-1 block text-base font-bold text-[#171a17]">
                          {best.metrics.vramGb} GB
                        </span>
                        <span className="text-[10px] text-[#3c7000]">Fits 1x L4</span>
                      </div>
                    </div>

                    {/* Action Links */}
                    <div className="flex items-center justify-between border-t border-dashed border-[#edf0eb] pt-3 text-xs">
                      <span className="text-[#656d60]">47 benchmark runs verified</span>
                      {onReviewEvidence && (
                        <button
                          type="button"
                          onClick={() => onReviewEvidence(program.id)}
                          className="font-medium text-[#2d5800] underline underline-offset-4 hover:text-[#111]"
                        >
                          [ Inspect assurance proof graph ]
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-[#788274]">
                    Evaluating candidates in discovery phase...
                  </div>
                )}
              </div>

              {/* Dhyra Recommendation Card */}
              {program.recommendation && (
                <RecommendationCard
                  recommendation={program.recommendation}
                  onReviewEvidence={() => onReviewEvidence?.(program.id)}
                  onApplyAction={() => best && onDeployCandidate?.(best)}
                />
              )}
            </div>

            {/* Right: Dhyra Reasoning & Thinking Panel (6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              <ThinkingPanel steps={program.thinkingSteps} />
            </div>
          </div>

          {/* Candidate Comparison Matrix */}
          {program.candidates.length > 0 && (
            <CandidateComparison
              candidates={program.candidates}
              onSelectCandidate={onDeployCandidate}
            />
          )}
        </div>
      )}

      {/* Tab 2: Hypotheses Engine */}
      {detailTab === "hypotheses" && (
        <div className="space-y-4">
          <div className="border border-[#d8ddd3] bg-white p-5">
            <div className="flex items-center justify-between border-b border-[#edf0eb] pb-3">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#171a17]">
                  Active Hypotheses & Evidence Verdicts
                </h3>
                <p className="text-xs text-[#687063]">
                  Dhyra explicitly formulates and tests hypotheses to resolve unknowns in compute bottlenecks.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {program.hypotheses.map((h) => (
                <div key={h.id} className="border border-[#d8ddd3] bg-[#fafbfa] p-4 text-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="border border-[#171a17] bg-[#171a17] px-2 py-0.5 font-mono font-bold text-[#F0EFE2] text-[11px]">
                        {h.id}
                      </span>
                      <span className="font-semibold text-sm text-[#171a17]">{h.statement}</span>
                    </div>
                    <DhyraBadge
                      variant={h.status === "confirmed" ? "healthy" : h.status === "testing" ? "active" : "warning"}
                      size="sm"
                    >
                      {h.status.toUpperCase()} ({h.confidencePct}%)
                    </DhyraBadge>
                  </div>

                  <div className="mt-3 border-t border-dashed border-[#d8ddd3] pt-2.5 text-[#525a4d] flex items-center justify-between font-mono text-[11px]">
                    <span>Evidence: {h.evidenceSummary}</span>
                    {h.experimentRef ? <span className="text-[#2563eb]">{h.experimentRef}</span> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: World State & Capability Gap */}
      {detailTab === "gap" && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* World State */}
          <div className="border border-[#d8ddd3] bg-white p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#edf0eb] pb-3">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#171a17]">
                Captured World State ({worldState.version})
              </span>
              <DhyraBadge variant="healthy" size="sm">
                {worldState.driftStatus}
              </DhyraBadge>
            </div>

            <div className="divide-y divide-[#edf0eb] font-mono text-xs">
              <div className="flex items-center justify-between py-2.5">
                <span className="font-sans text-[#687063]">Cloud GPU Allocated</span>
                <span className="font-bold text-[#171a17]">{worldState.cloudGpuAllocated}x NVIDIA GPUs</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="font-sans text-[#687063]">Data Center Capacity</span>
                <span className="font-bold text-[#171a17]">{worldState.dataCenterGpuCapacity}x NVIDIA H100</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="font-sans text-[#687063]">Monthly Spend Baseline</span>
                <span className="font-bold text-[#171a17]">${worldState.stateDetails.monthlySpendBaseline.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="font-sans text-[#687063]">Active Workload TPS</span>
                <span className="text-[#2563eb] font-bold">{worldState.stateDetails.activeWorkloadTps} TPS</span>
              </div>
            </div>
          </div>

          {/* Capability Gap */}
          <div className="border border-[#d8ddd3] bg-white p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#edf0eb] pb-3">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#171a17]">
                Calculated Capability Gap
              </span>
              <span className="font-mono text-xs text-[#3c7000] font-bold">Target - Current</span>
            </div>

            <div className="space-y-3 text-xs">
              <p className="font-medium text-[#171a17] leading-relaxed">
                {gap.gapSummary}
              </p>

              <div className="border border-dashed border-[#c9cec4] bg-[#fafbfa] p-3 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#788274]">Latency Gap:</span>
                  <span className="text-[#171a17]">{gap.currentPerformance} → {gap.targetPerformance}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#788274]">Cost Delta:</span>
                  <span className="text-[#3c7000] font-bold">{gap.costCurrent} → {gap.costTarget}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold uppercase text-[#788274] block mb-1">
                  Required Capabilities to Bridge Gap:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {gap.requiredCapabilities.map((c, i) => (
                    <span key={i} className="border border-[#b9de78] bg-[#f2fbe6] px-2 py-0.5 text-[11px] font-mono text-[#2d5800]">
                      + {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Candidates & Rejected Candidates */}
      {detailTab === "candidates" && (
        <div className="space-y-6">
          <CandidateComparison candidates={program.candidates} onSelectCandidate={onDeployCandidate} />

          {/* Rejected Candidates Section */}
          {program.rejectedCandidates && program.rejectedCandidates.length > 0 && (
            <div className="border border-[#fecaca] bg-[#fffbfb] p-5">
              <div className="flex items-center gap-2 border-b border-[#fca5a5] pb-3 text-[#991b1b]">
                <AlertCircle size={15} />
                <h3 className="text-xs font-semibold uppercase tracking-[0.14em]">
                  Rejected Ineligible Candidates ({program.rejectedCandidates.length})
                </h3>
              </div>

              <div className="mt-4 space-y-2.5">
                {program.rejectedCandidates.map((rej) => (
                  <div key={rej.id} className="border border-[#fca5a5] bg-white p-3.5 text-xs font-mono">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold text-[#171a17]">{rej.name} ({rej.hardware})</span>
                      <span className="text-[10px] bg-[#fef2f2] text-[#991b1b] border border-[#fca5a5] px-1.5 py-0.2 font-sans font-bold">
                        DISQUALIFIED
                      </span>
                    </div>
                    <p className="mt-1 font-sans text-xs text-[#991b1b]">
                      {rej.rejectionReason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Experiments */}
      {detailTab === "experiments" && (
        <section className="border border-[#d8ddd3] bg-white">
          <div className="flex items-center justify-between border-b border-[#e1e4df] bg-[#fafbfa] px-4 py-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#171a17]">
                Experiment Execution History
              </span>
              <p className="text-xs text-[#687063]">
                Empirical benchmark sweeps across engines, batch sizes, and hardware envelopes.
              </p>
            </div>
            <span className="font-mono text-xs text-[#788274]">
              {runs.length} persisted runs recorded
            </span>
          </div>
          {runs.length === 0 ? (
            <div className="p-8 text-sm text-[#687063]">No persisted runs recorded for this program.</div>
          ) : (
            <div className="divide-y divide-[#edf0eb]">
              {runs.map((run) => {
                const design = run.design && typeof run.design === "object" ? run.design as Record<string, unknown> : {};
                const result = run.result && typeof run.result === "object" ? run.result as Record<string, unknown> : {};
                const status = typeof run.status === "string" ? run.status.toUpperCase() : "UNKNOWN";
                const createdAt = typeof run.createdAt === "string" ? run.createdAt : "Not recorded";
                return (
                  <div key={String(run.id)} className="grid gap-3 p-4 md:grid-cols-[1.2fr_0.8fr_1.6fr] md:items-center">
                    <div>
                      <div className="font-semibold text-[#171a17]">{typeof run.name === "string" ? run.name : String(run.id)}</div>
                      <div className="text-[11px] text-[#788274]">{createdAt}</div>
                    </div>
                    <DhyraBadge variant={status === "COMPLETED" ? "healthy" : status === "FAILED" ? "failed" : "default"} size="sm">
                      {status}
                    </DhyraBadge>
                    <div className="text-xs text-[#40483c]">
                      <div>Prompt: {typeof design.prompt === "string" ? design.prompt : "Not recorded"}</div>
                      <div className="mt-1 text-[11px] text-[#788274]">
                        Result: {Object.keys(result).length ? JSON.stringify(result) : "Not measured"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
