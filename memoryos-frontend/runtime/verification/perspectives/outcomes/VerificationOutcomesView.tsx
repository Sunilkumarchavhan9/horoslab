"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Filter, RefreshCw, Scale, Search, ShieldAlert, ShieldCheck, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { listExperienceOutcomes, type ExperienceOutcome } from "@/lib/experience-api";

function scoreOutcome(outcome: ExperienceOutcome): { label: string; tone: string } {
  if (!outcome.proofAvailable && outcome.humanCorrection) {
    return { label: "FAIL", tone: "text-red-600 dark:text-red-500" };
  }
  if (outcome.proofAvailable && !outcome.humanCorrection && outcome.testsFailed.length === 0) {
    return { label: "PASS", tone: "text-emerald-600 dark:text-emerald-500" };
  }
  return { label: "REVIEW", tone: "text-amber-600 dark:text-amber-500" };
}

function confidenceForOutcome(outcome: ExperienceOutcome): string {
  if (outcome.proofAvailable && outcome.testsFailed.length === 0) return "99.0%";
  if (outcome.humanCorrection) return "71.5%";
  if (outcome.testsFailed.length > 0) return "34.0%";
  return "82.0%";
}

export function VerificationOutcomesView() {
  const [outcomes, setOutcomes] = useState<ExperienceOutcome[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const loadOutcomes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOutcomes(await listExperienceOutcomes());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load verification outcomes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOutcomes();
  }, [loadOutcomes]);

  const filtered = useMemo(
    () =>
      outcomes.filter((outcome) =>
        `${outcome.displayId} ${outcome.problem} ${outcome.action} ${outcome.outcome} ${outcome.lesson} ${outcome.agentRunId}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [outcomes, query],
  );

  return (
    <div className="flex flex-col w-full h-full animate-in fade-in duration-500 text-foreground overflow-y-auto p-8 bg-[#fafafa] dark:bg-[#0a0a0a]">
      <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <h1 className="text-[22px] font-bold tracking-tight">Institutional Outcomes</h1>
            <p className="text-[14px] text-muted-foreground mt-2">
              Live experience outcomes that explain why a decision passed, failed, or still needs review.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadOutcomes()}
            className="inline-flex items-center gap-2 px-3 py-2 bg-muted text-foreground rounded-sm text-[12px] font-bold hover:bg-muted/80 transition-colors border border-border"
          >
            <RefreshCw className="size-4" />
            Refresh
          </button>
        </div>

        <div className="flex items-center gap-4 px-4 py-3 bg-card border border-border rounded-sm">
          <div className="flex items-center flex-1 bg-muted/30 border border-border rounded-sm focus-within:border-foreground/30 transition-colors">
            <button className="flex items-center gap-1.5 px-3 py-1.5 border-r border-border text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0 bg-card/50">
              All <Filter className="size-3" />
            </button>
            <div className="relative flex-1 flex items-center">
              <Search className="size-3.5 text-muted-foreground ml-3 shrink-0" />
              <input
                type="text"
                placeholder="Search outcomes by run, lesson, or action..."
                className="w-full bg-transparent border-none pl-2 pr-4 py-1.5 text-[13px] text-foreground focus:outline-none placeholder:text-muted-foreground/70"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-[13px] text-muted-foreground">Loading live outcomes...</div>
        ) : error ? (
          <div className="p-8 text-[13px] text-red-500">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-[13px] text-muted-foreground">No live outcomes were found for the current filter.</div>
        ) : (
          <div className="flex flex-col gap-6">
            {filtered.map((outcome) => {
              const score = scoreOutcome(outcome);
              const evidenceCount = outcome.filesChanged.length + outcome.testsPassed.length + outcome.testsFailed.length;

              return (
                <div key={outcome.id} className="flex flex-col bg-card border border-border shadow-sm rounded-sm overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-4">
                      <div className={cn("size-10 rounded-sm border flex items-center justify-center", score.label === "PASS" ? "bg-emerald-500/10 border-emerald-500/20" : score.label === "FAIL" ? "bg-red-500/10 border-red-500/20" : "bg-amber-500/10 border-amber-500/20")}>
                        {score.label === "PASS" ? <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-500" /> : score.label === "FAIL" ? <ShieldAlert className="size-5 text-red-600 dark:text-red-500" /> : <Scale className="size-5 text-amber-600 dark:text-amber-500" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[16px] font-bold text-foreground">{outcome.problem || outcome.action || outcome.lesson || "Outcome"}</span>
                        <span className="text-[12px] font-mono text-muted-foreground">{outcome.displayId}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className={cn("text-[24px] font-bold leading-none tracking-tight", score.tone)}>{score.label}</span>
                      <span className="text-[12px] font-medium text-muted-foreground mt-1 uppercase tracking-wider">
                        Confidence: <span className="font-mono text-foreground">{confidenceForOutcome(outcome)}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col p-6 gap-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Reasoning</span>

                    <div className="flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className={cn("size-4 shrink-0 mt-0.5", outcome.proofAvailable ? "text-emerald-500" : "text-muted-foreground")} />
                        <div className="flex flex-col">
                          <span className="text-[14px] font-medium text-foreground">Proof availability</span>
                          <span className="text-[12px] text-muted-foreground">
                            {outcome.proofAvailable ? "The backend has a proof record for this outcome." : "The backend has no proof record for this outcome."}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        {outcome.testsFailed.length > 0 ? <XCircle className="size-4 text-red-500 shrink-0 mt-0.5" /> : <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />}
                        <div className="flex flex-col">
                          <span className="text-[14px] font-medium text-foreground">Test health</span>
                          <span className="text-[12px] text-muted-foreground">
                            {outcome.testsFailed.length > 0
                              ? `${outcome.testsFailed.length} test(s) failed during the original run.`
                              : `${outcome.testsPassed.length} test(s) passed and no failures were recorded.`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <ArrowRight className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex flex-col">
                          <span className="text-[14px] font-medium text-foreground">Evidence footprint</span>
                          <span className="text-[12px] text-muted-foreground">
                            {evidenceCount} evidence-bearing record(s) contributed to this outcome.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
