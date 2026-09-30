"use client";

import { useCallback, useEffect, useState } from "react";
import { GitBranch, GitCommit, FileText, Activity, Dna, CheckCircle2, ChevronRight, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getDhyraInstitution,
  listDhyraInstitutions,
  listDhyraInstitutionVersions,
  readActiveDhyraWorkspaceId,
  type DhyraInstitution,
  type DhyraInstitutionVersion,
} from "@/lib/dhyra-api";

type VersionGroup = {
  institution: DhyraInstitution;
  versions: DhyraInstitutionVersion[];
};

function formatDate(value?: string): string {
  if (!value) return "Unknown";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

function snapshotSummary(version: DhyraInstitutionVersion): string {
  if (!version.snapshot || typeof version.snapshot !== "object") return "No snapshot payload";
  const keys = Object.keys(version.snapshot).slice(0, 4);
  return keys.length > 0 ? `Snapshot fields: ${keys.join(", ")}` : "Empty snapshot";
}

export function InstitutionVersionsView() {
  const [groups, setGroups] = useState<VersionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const workspaceId = readActiveDhyraWorkspaceId();

  const loadVersions = useCallback(async () => {
    if (!workspaceId) {
      setGroups([]);
      setLoading(false);
      setError("No active Dhyra workspace is available.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const institutions = await listDhyraInstitutions(workspaceId);
      const liveGroups = await Promise.all(
        institutions.slice(0, 4).map(async (institution) => {
          const detail = await getDhyraInstitution(workspaceId, institution.id).catch(() => institution);
          const versionRows = await listDhyraInstitutionVersions(workspaceId, institution.id).catch(() => ({ versions: [] as DhyraInstitutionVersion[] }));
          return { institution: detail, versions: versionRows.versions };
        }),
      );
      setGroups(liveGroups);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load institution versions.");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void loadVersions();
  }, [loadVersions]);

  return (
    <div className="flex flex-col w-full h-full font-sans animate-in fade-in duration-500 bg-background text-foreground">
      <div className="flex items-center justify-between gap-4 px-8 py-6 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-4">
          <div className="size-10 bg-foreground text-background flex items-center justify-center rounded-sm shrink-0">
            <GitBranch className="size-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-[18px] font-bold leading-none tracking-tight">Institution Versions</h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              Live version history loaded from the backend.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadVersions()}
          className="flex items-center gap-2 bg-muted text-foreground px-4 py-2 rounded-sm text-[13px] font-bold hover:bg-muted/80 transition-colors border border-border"
        >
          <RefreshCw className="size-4" /> Refresh
        </button>
      </div>

      <div className="flex flex-col w-full h-full overflow-y-auto bg-background">
        {loading ? (
          <div className="p-8 text-[13px] text-muted-foreground">Loading live institution versions...</div>
        ) : error ? (
          <div className="p-8 text-[13px] text-red-500">{error}</div>
        ) : groups.length === 0 ? (
          <div className="p-8 text-[13px] text-muted-foreground">No institution versions were found in this workspace.</div>
        ) : (
          <div className="flex flex-col w-full relative pb-16">
            <div className="absolute left-[79px] top-0 bottom-0 w-px bg-border z-0" />
            {groups.flatMap((group) =>
              group.versions.map((version, index) => {
                const isActive = index === 0;
                return (
                  <div key={`${group.institution.id}-${version.id}`} className="flex relative z-10 w-full group cursor-pointer">
                    <div className="flex flex-col items-center w-[160px] shrink-0 pt-8 pb-12 relative">
                      <div
                        className={cn(
                          "size-10 rounded-full border-2 flex items-center justify-center shrink-0 z-10 relative transition-colors",
                          isActive ? "bg-card border-foreground" : "bg-muted border-border group-hover:border-foreground/30",
                        )}
                      >
                        <GitCommit className={cn("size-5 transition-colors", isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                      </div>
                    </div>

                    <div className="flex flex-col flex-1 pt-8 pb-4 pr-16 justify-start">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <span className="text-[20px] font-bold font-mono text-foreground group-hover:text-blue-500 transition-colors tracking-tight">
                            {version.version ?? "Unknown version"}
                          </span>
                          {isActive ? (
                            <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20 rounded-sm text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                              <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Latest
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-muted text-muted-foreground border border-border rounded-sm text-[10px] font-bold uppercase tracking-wider">
                              Archived
                            </span>
                          )}
                        </div>
                        <span className="text-[13px] text-muted-foreground font-mono">{formatDate(version.createdAt)}</span>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between bg-card hover:bg-muted/30 border border-border rounded-sm p-4 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-sm flex items-center justify-center border bg-blue-500/10 border-blue-500/20">
                              <FileText className="size-4 text-blue-500" />
                            </div>
                            <span className="text-[14px] font-medium text-foreground">{snapshotSummary(version)}</span>
                          </div>
                          <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="flex items-center justify-between bg-card hover:bg-muted/30 border border-border rounded-sm p-4 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-sm flex items-center justify-center border bg-purple-500/10 border-purple-500/20">
                              <Dna className="size-4 text-purple-500" />
                            </div>
                            <span className="text-[14px] font-medium text-foreground">{group.institution.name}</span>
                          </div>
                          <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="flex items-center justify-between bg-card hover:bg-muted/30 border border-border rounded-sm p-4 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-sm flex items-center justify-center border bg-emerald-500/10 border-emerald-500/20">
                              <Activity className="size-4 text-emerald-500" />
                            </div>
                            <span className="text-[14px] font-medium text-foreground">{group.institution.status ?? "unknown"}</span>
                          </div>
                          <CheckCircle2 className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }),
            )}
          </div>
        )}
      </div>
    </div>
  );
}
