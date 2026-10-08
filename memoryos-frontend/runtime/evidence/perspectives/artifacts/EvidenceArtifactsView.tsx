"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Building,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  ExternalLink,
  FileText,
  Filter,
  GitBranch,
  History,
  Lock,
  Rocket,
  Scale as GovIcon,
  Search,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMissionStore } from "../../../missions/runtime/store";
import { useMissionRuntimeData } from "../../../missions/runtime/mission-runtime-data";
import type { HorosMissionDetail } from "@/lib/horos-api";

type MissionEvidence = NonNullable<HorosMissionDetail["evidence"]>[number];

function formatTime(value?: string | null): string {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function displayName(evidence: MissionEvidence): string {
  return evidence.summary ?? evidence.kind ?? evidence.id;
}

export function EvidenceArtifactsView() {
  const { selection } = useMissionStore();
  const { missions, loading, error, getMission } = useMissionRuntimeData();
  const [mission, setMission] = useState<HorosMissionDetail | null>(null);
  const [missionLoading, setMissionLoading] = useState(false);
  const [missionError, setMissionError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const selectedMissionId = selection?.type === "mission" ? selection.id : missions[0]?.id ?? null;

  useEffect(() => {
    let cancelled = false;
    const loadMission = async () => {
      if (!selectedMissionId) {
        setMission(null);
        return;
      }

      setMissionLoading(true);
      setMissionError(null);
      try {
        const detail = await getMission(selectedMissionId);
        if (!cancelled) {
          setMission(detail);
          const nextSelectedArtifactId = detail?.evidence?.[0]?.id ?? null;
          setSelectedArtifactId((current) => current ?? nextSelectedArtifactId);
        }
      } catch (err) {
        if (!cancelled) {
          setMissionError(err instanceof Error ? err.message : "Failed to load mission evidence.");
        }
      } finally {
        if (!cancelled) {
          setMissionLoading(false);
        }
      }
    };

    void loadMission();
    return () => {
      cancelled = true;
    };
  }, [getMission, selectedMissionId]);

  const artifacts = useMemo(() => {
    const backendEvidence = Array.isArray(mission?.evidence) ? mission.evidence : [];
    return backendEvidence;
  }, [mission]);
  const visibleArtifacts = useMemo(
    () =>
      artifacts.filter((artifact) =>
        `${artifact.id} ${artifact.kind ?? ""} ${artifact.summary ?? ""} ${artifact.url ?? ""} ${artifact.filePath ?? ""} ${artifact.contentType ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [artifacts, query],
  );
  const selectedArtifact = visibleArtifacts.find((artifact) => artifact.id === selectedArtifactId) ?? visibleArtifacts[0] ?? null;

  return (
    <div className="flex flex-col w-full h-full font-sans animate-in fade-in duration-500 bg-background text-foreground overflow-y-auto overflow-x-hidden">
      <div className="flex flex-col w-full min-h-full bg-card overflow-hidden">
        <div className="flex items-center justify-between px-8 py-6 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-4">
            <div className="size-10 bg-muted border border-border flex items-center justify-center rounded-sm shrink-0">
              <FileText className="size-5 text-foreground" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-[18px] font-bold leading-none tracking-tight">Immutable Artifacts</h1>
              <p className="text-[13px] text-muted-foreground mt-1">
                Live mission evidence loaded from the backend mission record.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 px-3 py-2 bg-muted text-foreground rounded-sm text-[12px] font-bold hover:bg-muted/80 transition-colors border border-border"
            onClick={() => {
              if (!selectedMissionId) return;
              setMissionLoading(true);
              void getMission(selectedMissionId)
                .then((detail) => setMission(detail))
                .catch((err) => setMissionError(err instanceof Error ? err.message : "Failed to refresh evidence."))
                .finally(() => setMissionLoading(false));
            }}
          >
            <Eye className="size-4" />
            Refresh
          </button>
        </div>

        <div className="flex items-center gap-4 px-8 py-3 bg-card border-b border-border shrink-0 w-full">
          <div className="flex items-center gap-2 flex-[1.5] relative">
            <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search artifacts by filename, ID, or SHA-256 hash..."
              className="w-full bg-muted/30 border border-border rounded-sm pl-9 pr-4 py-1.5 text-[13px] text-foreground focus:outline-none focus:border-foreground/30 transition-colors placeholder:text-muted-foreground/70"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
              <span className="text-[10px] font-mono text-muted-foreground border border-border bg-card px-1.5 py-0.5 rounded-sm">⌘K</span>
            </div>

            {isSearchFocused && (
              <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-card border border-border rounded-sm shadow-md z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="px-4 py-2 border-b border-border/50 bg-muted/30">
                  <span className="text-[11px] font-bold text-muted-foreground">Search tips</span>
                </div>

                <div className="flex flex-col py-2">
                  <button className="flex items-center justify-between px-4 py-2 hover:bg-muted/50 transition-colors w-full text-left group">
                    <div className="flex items-center gap-3">
                      <Building className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span className="text-[13px] font-medium text-foreground">
                        <span className="font-bold">inst:</span> - Search Institutions
                      </span>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <button className="flex items-center justify-between px-4 py-2 hover:bg-muted/50 transition-colors w-full text-left group">
                    <div className="flex items-center gap-3">
                      <Rocket className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span className="text-[13px] font-medium text-foreground">
                        <span className="font-bold">mis:</span> - Search Missions
                      </span>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <button className="flex items-center justify-between px-4 py-2 hover:bg-muted/50 transition-colors w-full text-left group">
                    <div className="flex items-center gap-3">
                      <FileText className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span className="text-[13px] font-medium text-foreground">
                        <span className="font-bold">evid:</span> - Search Evidence
                      </span>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <button className="flex items-center justify-between px-4 py-2 hover:bg-muted/50 transition-colors w-full text-left group">
                    <div className="flex items-center gap-3">
                      <History className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span className="text-[13px] font-medium text-foreground">
                        <span className="font-bold">rec:</span> - Search Memory Records
                      </span>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <button className="flex items-center justify-between px-4 py-2 hover:bg-muted/50 transition-colors w-full text-left group">
                    <div className="flex items-center gap-3">
                      <GovIcon className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      <span className="text-[13px] font-medium text-foreground">
                        <span className="font-bold">gov:</span> - Search Governance Policies
                      </span>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="h-5 w-px bg-border shrink-0" />

          <div className="flex items-center gap-2 shrink-0">
            <button className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-sm text-[12px] font-medium text-muted-foreground hover:bg-muted/50 transition-colors bg-card">
              <Filter className="size-3.5" /> File Type <ChevronDown className="size-3" />
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-sm text-[12px] font-medium text-muted-foreground hover:bg-muted/50 transition-colors bg-card">
              Mission <ChevronDown className="size-3" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 w-full overflow-hidden">
          <div className="flex flex-col w-1/2 border-r border-border bg-card overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-3 bg-muted/30 border-b border-border sticky top-0 z-10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Artifact Registry</span>
              <span className="text-[11px] font-mono font-bold text-foreground bg-muted border border-border px-2 py-0.5 rounded-sm">
                {visibleArtifacts.length} Items
              </span>
            </div>

            {loading || missionLoading ? (
              <div className="p-6 text-[13px] text-muted-foreground">Loading live mission evidence...</div>
            ) : error ? (
              <div className="p-6 text-[13px] text-red-500">{error}</div>
            ) : missionError ? (
              <div className="p-6 text-[13px] text-red-500">{missionError}</div>
            ) : visibleArtifacts.length === 0 ? (
              <div className="p-6 text-[13px] text-muted-foreground">No evidence has been recorded for the selected mission yet.</div>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {visibleArtifacts.map((artifact, index) => (
                  <div
                    key={artifact.id}
                    onClick={() => setSelectedArtifactId(artifact.id)}
                    className={cn(
                      "flex items-start gap-4 p-6 hover:bg-muted/30 transition-colors cursor-pointer",
                      index === 0 ? "bg-muted/30" : "",
                      selectedArtifact?.id === artifact.id ? "bg-muted/40" : "",
                    )}
                  >
                    <div className="size-8 rounded-sm bg-muted border border-border flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="size-4 text-foreground" />
                    </div>
                    <div className="flex flex-col flex-1 gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[14px] font-bold text-foreground tracking-tight">{displayName(artifact)}</span>
                        <span className="text-[11px] font-mono text-muted-foreground">{formatTime(artifact.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-muted-foreground bg-muted/50 border border-border px-1.5 py-0.5 rounded-sm">
                          {artifact.id}
                        </span>
                        <span className="text-[11px] font-medium text-muted-foreground">{artifact.kind ?? "Evidence"}</span>
                        <span className="text-[11px] text-muted-foreground">•</span>
                        <span className="text-[11px] text-muted-foreground">{artifact.contentType ?? artifact.filePath ?? artifact.url ?? "Live mission data"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col w-1/2 bg-[#fafafa] dark:bg-[#0a0a0a] overflow-y-auto">
            <div className="flex items-center justify-between px-8 py-6 border-b border-border bg-card">
              <h2 className="text-[16px] font-bold tracking-tight text-foreground">
                {selectedArtifact ? displayName(selectedArtifact) : "Select an artifact"}
              </h2>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded-sm text-[12px] font-bold text-foreground hover:bg-muted/80 transition-colors">
                  <Eye className="size-3.5" /> Preview
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground text-background rounded-sm text-[12px] font-bold hover:bg-foreground/90 transition-colors">
                  <Download className="size-3.5" /> Download
                </button>
              </div>
            </div>

            <div className="flex flex-col p-8 gap-8">
              {!selectedArtifact ? (
                <div className="text-[13px] text-muted-foreground">Select an evidence item to inspect its backend provenance.</div>
              ) : (
                <>
                  <div className="flex flex-col gap-4 p-6 bg-card border border-border rounded-sm shadow-sm">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Trust Provenance</h3>

                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between py-2 border-b border-border/50">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Lock className="size-4" />
                          <span className="text-[12px] font-medium">Evidence ID</span>
                        </div>
                        <span className="text-[11px] font-mono text-foreground truncate max-w-[200px]" title={selectedArtifact.id}>
                          {selectedArtifact.id}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b border-border/50">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-500" />
                          <span className="text-[12px] font-medium text-emerald-600 dark:text-emerald-500">Captured by</span>
                        </div>
                        <span className="text-[12px] font-medium text-foreground">{mission?.executionRun?.executor && typeof mission.executionRun.executor === "object" ? "Mission Executor" : "HOROS Mission Runtime"}</span>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b border-border/50">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FileText className="size-4 text-blue-500" />
                          <span className="text-[12px] font-medium">Source Metadata</span>
                        </div>
                        <span className="text-[12px] font-medium text-foreground truncate max-w-[200px]">
                          {selectedArtifact.contentType ?? selectedArtifact.filePath ?? selectedArtifact.url ?? "Live evidence record"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 p-6 bg-card border border-border rounded-sm shadow-sm">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Lineage Graph</h3>

                    <div className="flex flex-col gap-3 relative">
                      <div className="absolute left-3 top-4 bottom-4 w-px bg-border" />

                      <div className="flex items-center gap-3 relative z-10">
                        <div className="size-6 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                          <GitBranch className="size-3 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Produced By Mission</span>
                          <span className="text-[12px] font-mono font-bold text-foreground cursor-pointer hover:text-blue-500 transition-colors flex items-center gap-1">
                            {mission?.id ?? selectedMissionId ?? "Unknown mission"} <ExternalLink className="size-3" />
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 relative z-10">
                        <div className="size-6 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                          <CheckCircle2 className="size-3 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Execution State</span>
                          <span className="text-[12px] font-mono font-bold text-foreground capitalize">{mission?.state ?? "unknown"}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 relative z-10">
                        <div className="size-6 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                          <FileText className="size-3 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Payload Summary</span>
                          <span className="text-[12px] font-mono font-bold text-foreground cursor-pointer hover:text-blue-500 transition-colors flex items-center gap-1">
                            {selectedArtifact.summary ?? selectedArtifact.kind ?? selectedArtifact.id} <ArrowRight className="size-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
