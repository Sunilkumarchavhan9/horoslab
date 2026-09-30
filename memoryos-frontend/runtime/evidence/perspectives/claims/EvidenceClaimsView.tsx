"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, FileText, RefreshCw, Scale, ShieldAlert, Target } from "lucide-react";
import { listExperienceOutcomes, type ExperienceOutcome } from "@/lib/experience-api";

type ClaimRow = {
  id: string;
  assertion: string;
  evidence: string;
  verification: string;
  confidence: number;
  reviewer: string;
  status: "Verified" | "Needs Review";
};

function mapClaim(outcome: ExperienceOutcome): ClaimRow {
  return {
    id: outcome.displayId,
    assertion: outcome.problem || outcome.action || outcome.lesson || "Live outcome",
    evidence: outcome.proofAvailable ? "Proof available in experience backend" : "Proof missing",
    verification: outcome.proofAvailable ? "Cryptographic Check" : "Review Required",
    confidence: outcome.proofAvailable ? 100 : outcome.humanCorrection ? 72 : 84,
    reviewer: outcome.agentRunId,
    status: outcome.proofAvailable ? "Verified" : "Needs Review",
  };
}

export function EvidenceClaimsView() {
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadClaims = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const outcomes = await listExperienceOutcomes();
      setClaims(outcomes.map(mapClaim));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load claims.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadClaims();
  }, [loadClaims]);

  const summary = useMemo(() => ({ verified: claims.filter((claim) => claim.status === "Verified").length, review: claims.filter((claim) => claim.status === "Needs Review").length }), [claims]);

  return (
    <div className="flex flex-col w-full h-full font-sans animate-in fade-in duration-500 bg-background text-foreground overflow-y-auto">
      <div className="flex flex-col w-full min-h-full bg-card overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-8 py-6 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-4">
            <div className="size-10 bg-foreground text-background flex items-center justify-center rounded-sm shrink-0">
              <Target className="size-5" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-[18px] font-bold leading-none tracking-tight">Institutional Claims</h1>
              <p className="text-[13px] text-muted-foreground mt-1">Live claims derived from the experience backend.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadClaims()}
            className="inline-flex items-center gap-2 px-3 py-2 bg-muted text-foreground rounded-sm text-[12px] font-bold hover:bg-muted/80 transition-colors border border-border"
          >
            <RefreshCw className="size-4" />
            Refresh
          </button>
        </div>

        <div className="flex items-center gap-4 px-8 py-3 bg-muted/30 border-b border-border shrink-0 text-[12px] font-mono text-muted-foreground">
          <span>{summary.verified} verified</span>
          <span>{summary.review} needs review</span>
        </div>

        {loading ? (
          <div className="p-8 text-[13px] text-muted-foreground">Loading live claims...</div>
        ) : error ? (
          <div className="p-8 text-[13px] text-red-500 flex items-center gap-2">
            <AlertTriangle className="size-4" />
            {error}
          </div>
        ) : (
          <div className="flex flex-col w-full overflow-hidden bg-background">
            <div className="flex items-center px-8 py-3 bg-muted/30 border-b border-border shrink-0 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <div className="w-[120px]">Claim ID</div>
              <div className="flex-[2]">Assertion</div>
              <div className="w-[200px]">Backing Evidence</div>
              <div className="w-[160px]">Verification</div>
              <div className="w-[120px]">Confidence</div>
              <div className="w-[160px]">Reviewer</div>
            </div>

            <div className="flex flex-col overflow-y-auto divide-y divide-border/50">
              {claims.map((claim) => (
                <div key={claim.id} className="flex items-center px-8 py-4 hover:bg-muted/30 transition-colors w-full group bg-card">
                  <div className="w-[120px] shrink-0">
                    <span className="text-[11px] font-mono font-bold text-foreground bg-muted border border-border px-1.5 py-0.5 rounded-sm">{claim.id}</span>
                  </div>

                  <div className="flex-[2] shrink-0 pr-6">
                    <span className="text-[14px] font-bold text-foreground tracking-tight group-hover:text-blue-500 transition-colors cursor-pointer">{claim.assertion}</span>
                  </div>

                  <div className="w-[200px] shrink-0">
                    <div className="flex items-center gap-2">
                      <FileText className="size-3.5 text-muted-foreground" />
                      <span className="text-[12px] font-mono text-muted-foreground truncate" title={claim.evidence}>
                        {claim.evidence}
                      </span>
                    </div>
                  </div>

                  <div className="w-[160px] shrink-0">
                    <div className="flex items-center gap-2">
                      <Scale className="size-3.5 text-muted-foreground" />
                      <span className="text-[12px] font-medium text-foreground">{claim.verification}</span>
                    </div>
                  </div>

                  <div className="w-[120px] shrink-0">
                    <span className="text-[12px] font-mono font-bold text-emerald-600 dark:text-emerald-500">{claim.confidence}%</span>
                  </div>

                  <div className="w-[160px] shrink-0">
                    <span className="text-[11px] font-mono text-muted-foreground">{claim.reviewer}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto border-t border-border bg-card p-4 flex items-center justify-center">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-4 text-muted-foreground" />
                <span className="text-[12px] font-bold text-muted-foreground">Dhyra Policy Enforced: claims now reflect live backend outcomes.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
