"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, ChevronDown, FileWarning, Filter, Gavel, RefreshCw, Search, ShieldQuestion } from "lucide-react";
import { cn } from "@/lib/utils";
import { listExperienceOutcomes, type ExperienceOutcome } from "@/lib/experience-api";

type ChallengeRow = {
  id: string;
  claim: string;
  challenger: string;
  status: "Under Review" | "Resolved";
  counterEvidence: string;
  decision: string;
};

function mapChallenge(outcome: ExperienceOutcome): ChallengeRow {
  const underReview = !outcome.proofAvailable || outcome.humanCorrection || outcome.testsFailed.length > 0;
  return {
    id: outcome.displayId,
    claim: outcome.problem || outcome.action || outcome.lesson || "Unresolved outcome",
    challenger: underReview ? "Experience backend" : "Auto-verification",
    status: underReview ? "Under Review" : "Resolved",
    counterEvidence:
      outcome.testsFailed.length > 0
        ? outcome.testsFailed.map((item) => String(item)).slice(0, 2).join(", ")
        : outcome.lesson || "No counter-evidence recorded.",
    decision: underReview ? "Pending" : outcome.outcome || "Claim Accepted",
  };
}

export function VerificationChallengesView() {
  const [rows, setRows] = useState<ChallengeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const loadChallenges = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const outcomes = await listExperienceOutcomes();
      setRows(outcomes.map(mapChallenge).filter((row) => row.status === "Under Review" || row.decision.toLowerCase() !== "claim accepted"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load challenges.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadChallenges();
  }, [loadChallenges]);

  const filtered = useMemo(
    () =>
      rows.filter((challenge) =>
        `${challenge.id} ${challenge.claim} ${challenge.challenger} ${challenge.status} ${challenge.counterEvidence} ${challenge.decision}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query, rows],
  );

  return (
    <div className="flex flex-col w-full h-full animate-in fade-in duration-500 text-foreground overflow-y-auto">
      <div className="flex flex-col px-8 py-6 border-b border-border bg-card shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[18px] font-bold leading-none tracking-tight">Active Challenges</h1>
            <p className="text-[13px] text-muted-foreground mt-2">
              Live disputes derived from the experience backend.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadChallenges()}
            className="inline-flex items-center gap-2 px-3 py-2 bg-muted text-foreground rounded-sm text-[12px] font-bold hover:bg-muted/80 transition-colors border border-border"
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </button>
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
              placeholder="Search challenges by ID or claim..."
              className="w-full bg-transparent border-none pl-2 pr-4 py-1.5 text-[13px] text-foreground focus:outline-none placeholder:text-muted-foreground/70"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-sm text-[12px] font-medium text-muted-foreground hover:bg-muted/50 transition-colors bg-card">
            <Filter className="size-3.5" /> Status <ChevronDown className="size-3" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-[13px] text-muted-foreground">Loading live challenges...</div>
      ) : error ? (
        <div className="p-8 text-[13px] text-red-500 flex items-center gap-2">
          <AlertTriangle className="size-4" />
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-[13px] text-muted-foreground">No active challenges were found.</div>
      ) : (
        <div className="flex flex-col w-full overflow-y-auto bg-card">
          <div className="flex items-center px-8 py-3 bg-muted/30 border-b border-border shrink-0 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <div className="w-[120px]">Challenge ID</div>
            <div className="flex-[1.5]">Disputed Claim</div>
            <div className="w-[200px]">Challenger</div>
            <div className="w-[180px]">Status</div>
            <div className="flex-[1]">Final Decision</div>
          </div>

          <div className="flex flex-col divide-y divide-border/50">
            {filtered.map((challenge) => (
              <div key={challenge.id} className="flex flex-col group bg-card transition-colors hover:bg-muted/30 cursor-pointer">
                <div className="flex items-center px-8 py-4 w-full">
                  <div className="w-[120px] shrink-0">
                    <span className="text-[12px] font-mono font-bold text-foreground bg-muted border border-border px-1.5 py-0.5 rounded-sm flex items-center w-fit gap-1.5 group-hover:text-amber-600 transition-colors">
                      <Gavel className="size-3" /> {challenge.id}
                    </span>
                  </div>

                  <div className="flex-[1.5] shrink-0 pr-4">
                    <span className="text-[13px] font-medium text-foreground">{challenge.claim}</span>
                  </div>

                  <div className="w-[200px] shrink-0">
                    <span className="text-[12px] font-mono text-muted-foreground flex items-center gap-1.5">
                      <ShieldQuestion className="size-3.5 text-amber-500" /> {challenge.challenger}
                    </span>
                  </div>

                  <div className="w-[180px] shrink-0">
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border inline-flex items-center gap-1.5",
                        challenge.status === "Under Review"
                          ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                      )}
                    >
                      {challenge.status}
                    </span>
                  </div>

                  <div className="flex-[1] shrink-0">
                    <span className="text-[13px] font-medium text-foreground">{challenge.decision}</span>
                  </div>
                </div>

                <div className="px-8 pb-4 w-full flex items-center gap-4">
                  <div className="w-[120px] shrink-0" />
                  <div className="flex items-center gap-3 bg-red-500/5 border border-red-500/10 rounded-sm px-4 py-2 w-fit">
                    <FileWarning className="size-4 text-red-500" />
                    <span className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Counter Evidence:</span>
                    <span className="text-[12px] font-mono text-foreground">{challenge.counterEvidence}</span>
                  </div>
                  {challenge.status === "Under Review" && (
                    <button className="flex items-center gap-1.5 text-[11px] font-bold text-foreground bg-foreground/5 hover:bg-foreground/10 px-3 py-1.5 rounded-sm transition-colors uppercase tracking-wider">
                      Review Challenge <ArrowRight className="size-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
