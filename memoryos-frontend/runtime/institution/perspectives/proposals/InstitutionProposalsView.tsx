"use client";

import { ArrowRight, Check, Clock, Dna, GitPullRequest, RefreshCw, Shield, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInstitutionRuntimeData } from "../../runtime/institution-runtime-data";
import { useInstitutionStore } from "../../store";

export function InstitutionProposalsView() {
  const { selectedEntity, selectEntity } = useInstitutionStore();
  const { versions, institution, loading, error, refresh } = useInstitutionRuntimeData();

  return (
    <div className="flex flex-col w-full h-full font-sans animate-in fade-in duration-500 bg-background text-foreground">
      <div className="flex items-center justify-between gap-4 px-8 py-6 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-4">
          <div className="size-10 bg-foreground text-background flex items-center justify-center rounded-sm shrink-0">
            <GitPullRequest className="size-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-[18px] font-bold leading-none tracking-tight">Change Proposals</h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              Live institution version history from the backend.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void refresh()}
          className="flex items-center gap-2 bg-muted text-foreground px-4 py-2 rounded-sm text-[13px] font-bold hover:bg-muted/80 transition-colors border border-border"
        >
          <RefreshCw className="size-4" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-[13px] text-muted-foreground">Loading live proposals...</div>
      ) : error ? (
        <div className="flex items-start gap-3 px-8 py-4 bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-500">
          <AlertTriangle className="size-5 shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <h3 className="text-[13px] font-bold uppercase tracking-wider">Backend unavailable</h3>
            <p className="text-[13px] mt-1 font-medium">{error}</p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col w-full overflow-y-auto bg-background">
        <div className="flex items-center px-8 py-3 bg-muted/30 border-b border-border sticky top-0 z-10 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          <div className="flex-[2] flex items-center gap-2">Version & Summary</div>
          <div className="flex-1 flex items-center gap-2">Impact</div>
          <div className="flex-1 flex items-center gap-2">
            <Shield className="size-3.5" /> Evidence
          </div>
          <div className="flex-1 flex items-center gap-2">
            <Dna className="size-3.5" /> Snapshot
          </div>
          <div className="w-[120px] flex items-center gap-2">Review Status</div>
        </div>

        <div className="flex flex-col divide-y divide-border">
          {versions.length === 0 ? (
            <div className="p-8 text-[13px] text-muted-foreground">No backend version history was returned for the current institution.</div>
          ) : (
            versions.map((version, index) => {
              const isLatest = index === 0;
              const snapshot = version.snapshot && typeof version.snapshot === "object" ? (version.snapshot as Record<string, unknown>) : {};
              const snapshotKeys = Object.keys(snapshot).slice(0, 4);
              const status = isLatest ? "Latest" : "Archived";
              const impact = snapshotKeys.length > 2 ? "High" : snapshotKeys.length === 2 ? "Medium" : "Low";

              return (
                <div
                  key={version.id}
                  onClick={() => selectEntity(version.id)}
                  className={cn(
                    "flex items-stretch transition-colors group bg-card hover:bg-muted/20 cursor-pointer",
                    selectedEntity === version.id ? "bg-muted/30" : "bg-card",
                  )}
                >
                  <div className="flex flex-col gap-2 flex-[2] p-6 pr-8 border-r border-border/50 justify-center">
                    <div className="flex items-center gap-3">
                      <span className="text-[15px] font-bold group-hover:text-blue-500 transition-colors tracking-tight text-foreground">
                        {version.version ?? "Unknown version"}
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-sm border border-border">{version.id}</span>
                    </div>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">
                      {snapshotKeys.length > 0 ? `Snapshot fields: ${snapshotKeys.join(", ")}` : "No snapshot payload was recorded."}
                    </p>
                    <div className="flex items-center gap-2 mt-1 font-mono">
                      <span className="text-[11px] font-bold text-muted-foreground">
                        for <span className="text-foreground">{institution?.name ?? "Institution"}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col flex-1 p-6 border-r border-border/50 justify-center">
                    <span
                      className={cn(
                        "text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded-sm border w-fit",
                        impact === "High"
                          ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          : impact === "Medium"
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            : "bg-muted text-foreground border-border",
                      )}
                    >
                      {impact} Impact
                    </span>
                  </div>

                  <div className="flex flex-col flex-1 p-6 border-r border-border/50 justify-center">
                    <span className="text-[12px] text-muted-foreground italic">{version.proof ? "Proof available" : "No proof payload"}</span>
                  </div>

                  <div className="flex flex-col flex-1 p-6 border-r border-border/50 justify-center">
                    {snapshotKeys.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {snapshotKeys.map((key) => (
                          <span key={key} className="text-[11px] font-mono font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-0.5 rounded-sm">
                            {key}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[12px] text-muted-foreground italic">None</span>
                    )}
                  </div>

                  <div className="flex flex-col w-[120px] p-6 justify-center items-end relative">
                    <span
                      className={cn(
                        "px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 rounded-sm border",
                        isLatest
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-500 border-amber-500/20",
                      )}
                    >
                      {isLatest ? <Check className="size-3" /> : <Clock className="size-3" />}
                      {status}
                    </span>

                    <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="size-4 text-blue-500" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
