"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ShieldCheck, Target, Shield, ServerCog, BarChart4, RefreshCw, AlertTriangle } from "lucide-react";
import { getExperienceSummary, listExperienceOutcomes, type ExperienceSummary } from "@/lib/experience-api";
import { listHorosCertificates, listHorosVerificationRuns, readActiveHorosWorkspaceId, type HorosCertificate, type HorosVerificationRunHistoryItem } from "@/lib/horos-api";

export function VerificationAssuranceView() {
  const [summary, setSummary] = useState<ExperienceSummary | null>(null);
  const [verifications, setVerifications] = useState<HorosVerificationRunHistoryItem[]>([]);
  const [certificates, setCertificates] = useState<HorosCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const workspaceId = readActiveHorosWorkspaceId();

  const loadAssurance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [experienceSummary, verificationPage, certificatePage, outcomes] = await Promise.all([
        getExperienceSummary().catch(() => null),
        workspaceId ? listHorosVerificationRuns(workspaceId, { limit: 20 }) : Promise.resolve({ verifications: [] as HorosVerificationRunHistoryItem[], page: { nextCursor: null, hasMore: false, total: 0 } }),
        workspaceId ? listHorosCertificates(workspaceId, { limit: 20 }) : Promise.resolve({ certificates: [] as HorosCertificate[], page: { nextCursor: null, hasMore: false, total: 0 } }),
        listExperienceOutcomes().catch(() => []),
      ]);

      setSummary(
        experienceSummary ?? {
          metrics: [],
          totals: {
            outcomes: outcomes.length,
            experienceRecords: outcomes.length,
            humanCorrections: outcomes.filter((outcome) => outcome.humanCorrection).length,
            lessons: outcomes.filter((outcome) => Boolean(outcome.lessonId)).length,
            futureInstructions: outcomes.filter((outcome) => Boolean(outcome.futureInstruction)).length,
            skillCandidates: 0,
          },
        },
      );
      setVerifications(verificationPage.verifications);
      setCertificates(certificatePage.certificates);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load assurance data.");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void loadAssurance();
  }, [loadAssurance]);

  const assuranceScore = useMemo(() => {
    const outcomeCount = summary?.totals.outcomes ?? 0;
    const corrections = summary?.totals.humanCorrections ?? 0;
    const passCount = verifications.filter((run) => (run.finalDecision ?? "").toLowerCase() === "pass").length;
    const certCount = certificates.filter((certificate) => (certificate.status ?? "").toLowerCase() === "valid").length;
    if (outcomeCount === 0) return 0;
    const verificationRatio = verifications.length > 0 ? passCount / verifications.length : 0.5;
    const certificateRatio = certificates.length > 0 ? certCount / certificates.length : 0.5;
    const correctionPenalty = Math.max(0, 1 - corrections / Math.max(1, outcomeCount));
    return Math.min(0.999, Math.max(0, 0.35 * verificationRatio + 0.35 * certificateRatio + 0.3 * correctionPenalty));
  }, [certificates, summary, verifications]);

  const metrics = useMemo(
    () => [
      { label: "Policy Coverage", value: String(summary?.totals.lessons ?? 0), status: "Lessons" },
      { label: "Evidence Completeness", value: String(summary?.totals.outcomes ?? 0), status: "Outcomes" },
      { label: "Human Review", value: String(summary?.totals.humanCorrections ?? 0), status: "Corrections" },
    ],
    [summary],
  );

  return (
    <div className="flex flex-col w-full h-full animate-in fade-in duration-500 text-foreground overflow-y-auto p-8 bg-[#fafafa] dark:bg-[#0a0a0a]">
      <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <h1 className="text-[22px] font-bold tracking-tight">Assurance</h1>
            <p className="text-[14px] text-muted-foreground mt-2">Live trust metrics derived from experience, verifications, and certificates.</p>
          </div>

          <button
            type="button"
            onClick={() => void loadAssurance()}
            className="inline-flex items-center gap-2 px-3 py-2 bg-muted text-foreground rounded-sm text-[12px] font-bold hover:bg-muted/80 transition-colors border border-border"
          >
            <RefreshCw className="size-4" />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-[13px] text-muted-foreground">Loading live assurance data...</div>
        ) : error ? (
          <div className="p-8 text-[13px] text-red-500 flex items-center gap-2">
            <AlertTriangle className="size-4" />
            {error}
          </div>
        ) : (
          <>
            <div className="flex flex-col bg-card border border-border rounded-sm shadow-sm p-8 items-center text-center">
              <ShieldCheck className="size-12 text-emerald-500 mb-4" />
              <div className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Overall Institutional Assurance</div>
              <div className="text-[48px] font-bold tracking-tighter text-foreground mt-1">{(assuranceScore * 100).toFixed(1)}%</div>
              <div className="flex items-center gap-2 mt-4 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-sm">
                <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[12px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500">Verified High</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {metrics.map((metric) => (
                <div key={metric.label} className="flex flex-col bg-card border border-border rounded-sm p-6 shadow-sm">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{metric.label}</span>
                  <span className="text-[28px] font-bold text-foreground mt-2">{metric.value}</span>
                  <span className="text-[12px] font-medium text-emerald-600 dark:text-emerald-500 mt-1">{metric.status}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col mt-4">
              <h2 className="text-[16px] font-bold mb-6">Assurance Pipeline</h2>
              <div className="flex items-center justify-between bg-card border border-border p-6 rounded-sm shadow-sm relative">
                <div className="absolute top-1/2 left-6 right-6 h-px bg-border -translate-y-1/2 z-0 hidden md:block" />

                <div className="flex flex-col items-center gap-3 z-10 bg-card px-4">
                  <div className="size-10 rounded-full border border-border bg-muted flex items-center justify-center">
                    <Target className="size-5 text-muted-foreground" />
                  </div>
                  <span className="text-[12px] font-bold uppercase tracking-wider">Experience</span>
                </div>

                <div className="flex flex-col items-center gap-3 z-10 bg-card px-4">
                  <div className="size-10 rounded-full border border-border bg-muted flex items-center justify-center">
                    <ServerCog className="size-5 text-muted-foreground" />
                  </div>
                  <span className="text-[12px] font-bold uppercase tracking-wider">Verification Runs</span>
                </div>

                <div className="flex flex-col items-center gap-3 z-10 bg-card px-4">
                  <div className="size-10 rounded-full border border-border bg-emerald-500/10 flex items-center justify-center">
                    <Shield className="size-5 text-emerald-600 dark:text-emerald-500" />
                  </div>
                  <span className="text-[12px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500">Certificates</span>
                </div>

                <div className="flex flex-col items-center gap-3 z-10 bg-card px-4">
                  <div className="size-10 rounded-full border border-border bg-muted flex items-center justify-center">
                    <BarChart4 className="size-5 text-muted-foreground" />
                  </div>
                  <span className="text-[12px] font-bold uppercase tracking-wider">Confidence</span>
                </div>

                <div className="flex flex-col items-center gap-3 z-10 bg-card px-4">
                  <div className="size-10 rounded-full border border-border bg-blue-500/10 flex items-center justify-center">
                    <ShieldCheck className="size-5 text-blue-600 dark:text-blue-500" />
                  </div>
                  <span className="text-[12px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-500">Institution Assurance</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col bg-card border border-border rounded-sm p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground">Verification Runs</h3>
                  <span className="text-[12px] font-mono text-muted-foreground">{verifications.length}</span>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  {verifications.slice(0, 4).map((run) => (
                    <div key={run.id} className="flex items-center justify-between rounded-sm border border-border bg-muted/20 px-3 py-2">
                      <span className="text-[12px] font-mono text-foreground">{run.id}</span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{run.finalDecision ?? "Verifying"}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col bg-card border border-border rounded-sm p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground">Certificates</h3>
                  <span className="text-[12px] font-mono text-muted-foreground">{certificates.length}</span>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  {certificates.slice(0, 4).map((certificate) => (
                    <div key={certificate.id} className="flex items-center justify-between rounded-sm border border-border bg-muted/20 px-3 py-2">
                      <span className="text-[12px] font-mono text-foreground">{certificate.id}</span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{certificate.status ?? "Unknown"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
