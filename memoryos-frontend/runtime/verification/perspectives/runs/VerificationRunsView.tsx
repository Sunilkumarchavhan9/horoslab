"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Filter, ChevronDown, Clock, RefreshCw, ShieldCheck, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVerificationStore } from "../../store";
import { listDhyraVerificationRuns, readActiveDhyraWorkspaceId, type DhyraVerificationRunHistoryItem } from "@/lib/dhyra-api";

function formatConfidence(run: DhyraVerificationRunHistoryItem): string {
  if (typeof run.confidence === "number" && Number.isFinite(run.confidence)) {
    return `${(run.confidence * 100).toFixed(1)}%`;
  }
  return run.finalDecision ?? "Pending";
}

function formatDuration(run: DhyraVerificationRunHistoryItem): string {
  const started = run.createdAt;
  const finished = run.finalDecision;
  if (!started) return "Pending";
  if (!finished) return "Running";
  return "Recorded";
}

export function VerificationRunsView() {
  const { selectedRunId, setSelectedRunId } = useVerificationStore();
  const [runs, setRuns] = useState<DhyraVerificationRunHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const workspaceId = readActiveDhyraWorkspaceId();

  const loadRuns = useCallback(async () => {
    if (!workspaceId) {
      setRuns([]);
      setLoading(false);
      setError("No active Dhyra workspace is available.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = await listDhyraVerificationRuns(workspaceId, { limit: 50 });
      setRuns(payload.verifications);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load verification runs.");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  const summary = useMemo(() => {
    const completed = runs.filter((run) => (run.finalDecision ?? "").toLowerCase() === "pass").length;
    const verifying = runs.filter((run) => !run.finalDecision || (run.finalDecision ?? "").toLowerCase() === "verifying").length;
    const failed = runs.filter((run) => (run.finalDecision ?? "").toLowerCase() === "fail").length;
    return { total: runs.length, completed, verifying, failed };
  }, [runs]);

  return (
    <div className="flex flex-col w-full h-full animate-in fade-in duration-500 text-foreground overflow-y-auto">
      <div className="flex flex-col px-8 py-6 border-b border-border bg-card shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[18px] font-bold leading-none tracking-tight">Verifier Runs</h1>
            <p className="text-[13px] text-muted-foreground mt-2">
              Live verification queue from the backend.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadRuns()}
            className="inline-flex items-center gap-2 px-3 py-2 bg-[#111] dark:bg-white text-white dark:text-foreground rounded-md text-[12px] font-bold hover:bg-[#333] dark:hover:bg-[#ccc] transition-colors"
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-[12px]">
          <span className="font-mono text-muted-foreground">{summary.total} runs</span>
          <span className="font-mono text-muted-foreground">{summary.completed} completed</span>
          <span className="font-mono text-muted-foreground">{summary.verifying} verifying</span>
          <span className="font-mono text-muted-foreground">{summary.failed} failed</span>
        </div>
      </div>

      <div className="flex items-center gap-4 px-8 py-3 bg-card border-b border-border shrink-0">
        <div className="flex items-center flex-1 bg-muted/30 border border-border rounded-sm focus-within:border-foreground/30 transition-colors">
          <button className="flex items-center gap-1.5 px-3 py-1.5 border-r border-border text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0 bg-card/50">
            All <ChevronDown className="size-3" />
          </button>
          <div className="relative flex-1 flex items-center">
            <Search className="size-3.5 text-muted-foreground ml-3 shrink-0" />
            <input
              type="text"
              placeholder="Search verifications..."
              className="w-full bg-transparent border-none pl-2 pr-4 py-1.5 text-[13px] text-foreground focus:outline-none placeholder:text-muted-foreground/70"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-sm text-[12px] font-medium text-muted-foreground hover:bg-muted/50 transition-colors bg-card">
            <Filter className="size-3.5" /> Status <ChevronDown className="size-3" />
          </button>
        </div>
      </div>

      <div className="flex flex-col w-full overflow-y-auto bg-card">
        <div className="flex items-center px-8 py-3 bg-muted/30 border-b border-border shrink-0 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          <div className="w-[140px]">Verification Run</div>
          <div className="flex-[1.5]">Mission</div>
          <div className="w-[100px] text-center">Evidence</div>
          <div className="w-[100px] text-center">Policies</div>
          <div className="w-[100px] text-center">Claims</div>
          <div className="w-[120px] text-right">Confidence</div>
          <div className="w-[100px] text-right">Duration</div>
          <div className="w-[120px] text-right">Status</div>
        </div>

        {loading ? (
          <div className="p-8 text-[13px] text-muted-foreground">Loading live verification runs...</div>
        ) : error ? (
          <div className="p-8 text-[13px] text-red-500">{error}</div>
        ) : (
          <div className="flex flex-col divide-y divide-border/50">
            {runs.length === 0 ? (
              <div className="p-8 text-[13px] text-muted-foreground">No verification runs are available yet.</div>
            ) : (
              runs.map((run) => {
                const isSelected = selectedRunId === run.id;
                const evidenceCount = Array.isArray(run.evidenceSummary?.evidence) ? (run.evidenceSummary.evidence as unknown[]).length : 0;
                const policyCount = Array.isArray(run.checklist) ? run.checklist.length : 0;

                return (
                  <div
                    key={run.id}
                    onClick={() => setSelectedRunId(isSelected ? null : run.id)}
                    className={cn(
                      "flex items-center px-8 py-3 transition-colors w-full cursor-pointer group",
                      isSelected ? "bg-muted/60 border-l-[3px] border-l-foreground pl-[29px]" : "hover:bg-muted/30 border-l-[3px] border-l-transparent pl-[29px]",
                    )}
                  >
                    <div className="w-[140px] shrink-0">
                      <span className="text-[12px] font-mono font-bold text-foreground bg-muted border border-border px-1.5 py-0.5 rounded-sm group-hover:text-blue-500 transition-colors flex items-center w-fit gap-1.5">
                        {run.id}
                      </span>
                    </div>

                    <div className="flex-[1.5] shrink-0">
                      <span className="text-[13px] font-medium text-foreground">{run.mission?.title ?? run.mission?.objective ?? "Mission verification"}</span>
                    </div>

                    <div className="w-[100px] shrink-0 flex justify-center">
                      <span className="text-[12px] font-mono text-muted-foreground">{evidenceCount}</span>
                    </div>

                    <div className="w-[100px] shrink-0 flex justify-center">
                      <span className="text-[12px] font-mono text-muted-foreground">{policyCount}</span>
                    </div>

                    <div className="w-[100px] shrink-0 flex justify-center">
                      <span className="text-[12px] font-mono text-muted-foreground">{Array.isArray(run.auditTrail) ? run.auditTrail.length : 0}</span>
                    </div>

                    <div className="w-[120px] shrink-0 text-right">
                      <span className="text-[12px] font-mono font-medium text-foreground">{formatConfidence(run)}</span>
                    </div>

                    <div className="w-[100px] shrink-0 text-right flex items-center justify-end gap-1.5 text-muted-foreground">
                      <Clock className="size-3" />
                      <span className="text-[12px] font-mono">{formatDuration(run)}</span>
                    </div>

                    <div className="w-[120px] shrink-0 text-right flex justify-end">
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border inline-flex items-center gap-1.5",
                          (run.finalDecision ?? "").toLowerCase() === "verify" || !(run.finalDecision ?? "")
                            ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                            : (run.finalDecision ?? "").toLowerCase() === "pass"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : "bg-red-500/10 text-red-600 border-red-500/20",
                        )}
                      >
                        {(run.finalDecision ?? "Verifying").toLowerCase() === "pass" && <ShieldCheck className="size-3" />}
                        {(run.finalDecision ?? "Verifying").toLowerCase() === "verifying" && <Activity className="size-3 animate-spin" />}
                        {(run.finalDecision ?? "Verifying").toLowerCase() === "fail" && <span className="size-3 rounded-full bg-current" />}
                        {run.finalDecision ?? "Verifying"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
