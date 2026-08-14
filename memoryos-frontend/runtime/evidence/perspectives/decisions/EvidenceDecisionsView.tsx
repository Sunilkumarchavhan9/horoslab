"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, FileText, Filter, GitBranch, Lock, RefreshCw, Scale, Search, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { listExperienceOutcomes, type ExperienceOutcome } from "@/lib/experience-api";

function formatCount(items: unknown[] | undefined): number {
  return Array.isArray(items) ? items.length : 0;
}

function formatWhen(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function EvidenceDecisionsView() {
  const [decisions, setDecisions] = useState<ExperienceOutcome[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const loadDecisions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const outcomes = await listExperienceOutcomes();
      setDecisions(outcomes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load evidence decisions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDecisions();
  }, [loadDecisions]);

  const filtered = useMemo(
    () =>
      decisions.filter((decision) =>
        `${decision.displayId} ${decision.problem} ${decision.action} ${decision.outcome} ${decision.lesson} ${decision.agentRunId}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [decisions, query],
  );

  return (
    <div className="flex flex-col w-full h-full font-sans animate-in fade-in duration-500 bg-background text-foreground overflow-y-auto">
      <div className="flex flex-col w-full min-h-full bg-card overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-8 py-6 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-4">
            <div className="size-10 bg-foreground text-background flex items-center justify-center rounded-sm shrink-0">
              <Scale className="size-5" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-[18px] font-bold leading-none tracking-tight">Institutional Decisions</h1>
              <p className="text-[13px] text-muted-foreground mt-1">
                Live decision records derived from the experience backend.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadDecisions()}
            className="inline-flex items-center gap-2 px-3 py-2 bg-muted text-foreground rounded-sm text-[12px] font-bold hover:bg-muted/80 transition-colors border border-border"
          >
            <RefreshCw className="size-4" />
            Refresh
          </button>
        </div>

        <div className="flex items-center gap-4 px-8 py-3 bg-card border-b border-border shrink-0">
          <div className="flex items-center flex-1 bg-muted/30 border border-border rounded-sm focus-within:border-foreground/30 transition-colors">
            <button className="flex items-center gap-1.5 px-3 py-1.5 border-r border-border text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0 bg-card/50">
              All <Filter className="size-3" />
            </button>
            <div className="relative flex-1 flex items-center">
              <Search className="size-3.5 text-muted-foreground ml-3 shrink-0" />
              <input
                type="text"
                placeholder="Search decisions by outcome, lesson, or run ID..."
                className="w-full bg-transparent border-none pl-2 pr-4 py-1.5 text-[13px] text-foreground focus:outline-none placeholder:text-muted-foreground/70"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col w-full overflow-y-auto bg-[#fafafa] dark:bg-[#0a0a0a] p-8">
          <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full">
            {loading ? (
              <div className="p-8 text-[13px] text-muted-foreground">Loading live decisions...</div>
            ) : error ? (
              <div className="p-8 text-[13px] text-red-500 flex items-center gap-2">
                <AlertTriangle className="size-4" />
                {error}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-[13px] text-muted-foreground">No decisions were found for the current workspace.</div>
            ) : (
              filtered.map((decision) => {
                const evidenceCount = formatCount(decision.filesChanged);
                const passedCount = formatCount(decision.testsPassed);
                const failedCount = formatCount(decision.testsFailed);
                const status = decision.proofAvailable ? "Executed" : decision.humanCorrection ? "Reviewed" : "Needs Review";

                return (
                  <div key={decision.id} className="flex flex-col bg-card border border-border shadow-sm rounded-sm overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-8 py-6 border-b border-border">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[20px] font-bold tracking-tight text-foreground">
                          {decision.problem || decision.action || decision.outcome || "Decision record"}
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-mono text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded-sm">{decision.displayId}</span>
                          <span className="text-[12px] font-mono text-muted-foreground">Recorded at {formatWhen(decision.time)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Agent Run</span>
                          <span className="text-[12px] font-mono font-bold text-foreground">{decision.agentRunId}</span>
                        </div>
                        <div className="flex flex-col items-end pl-4 border-l border-border">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</span>
                          <span className={cn("text-[12px] font-bold uppercase tracking-wider", decision.proofAvailable ? "text-emerald-600 dark:text-emerald-500" : "text-amber-600 dark:text-amber-500")}>
                            {status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col p-8 gap-8">
                      <div className="flex flex-col gap-2">
                        <h3 className="text-[12px] font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                          <FileText className="size-4 text-muted-foreground" /> Decision Trail
                        </h3>
                        <p className="text-[14px] text-muted-foreground leading-relaxed pl-6">
                          {decision.action || "No backend action was recorded for this outcome."}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pl-6">
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Evidence Evaluated</span>
                            <div className="flex flex-col gap-1.5">
                              <span className="text-[12px] font-mono text-foreground bg-muted/50 border border-border px-2 py-1 rounded-sm flex items-center justify-between group">
                                {evidenceCount} file change(s)
                                <ArrowRight className="size-3 opacity-70" />
                              </span>
                              <span className="text-[12px] font-mono text-foreground bg-muted/50 border border-border px-2 py-1 rounded-sm flex items-center justify-between group">
                                {passedCount} passing test(s)
                                <ArrowRight className="size-3 opacity-70" />
                              </span>
                              <span className="text-[12px] font-mono text-foreground bg-muted/50 border border-border px-2 py-1 rounded-sm flex items-center justify-between group">
                                {failedCount} failing test(s)
                                <ArrowRight className="size-3 opacity-70" />
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Recorded Lesson</span>
                            <span className="text-[12px] font-mono text-foreground bg-muted/50 border border-border px-2 py-1 rounded-sm flex items-center gap-2">
                              <Lock className="size-3 text-muted-foreground" /> {decision.lesson || "No lesson was recorded."}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                              <ShieldAlert className="size-3" /> Outcome
                            </span>
                            <p className="text-[12px] text-muted-foreground leading-relaxed">
                              {decision.outcome || "No outcome summary recorded by the backend."}
                            </p>
                          </div>

                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                              <GitBranch className="size-3" /> Evidence State
                            </span>
                            <p className="text-[12px] text-muted-foreground leading-relaxed">
                              {decision.proofAvailable ? "Proof is available for this decision in the live experience backend." : "Proof is missing and the decision remains unverified."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
