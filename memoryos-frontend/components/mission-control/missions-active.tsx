"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Play, AlertCircle, CheckCircle2, Clock, ShieldCheck, Search, Plus, Rocket, XCircle } from "lucide-react";
import { readActiveHorosWorkspaceId, listHorosMissions, listHorosInstitutions, createHorosMission, type HorosMissionDetail } from "@/lib/horos-api";

type MissionRow = {
  id: string;
  name: string;
  institution: string;
  planner: string;
  status: string;
  risk: string;
  progress: number;
  started: string;
};

function formatRelativeTime(value?: string): string {
  if (!value) return "Unknown";
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Unknown";
  const deltaMs = Date.now() - timestamp;
  const absMinutes = Math.abs(Math.round(deltaMs / 60000));
  if (absMinutes < 1) return "Just now";
  if (absMinutes < 60) return `${absMinutes} min${absMinutes === 1 ? "" : "s"} ago`;
  const absHours = Math.abs(Math.round(deltaMs / 3600000));
  if (absHours < 24) return `${absHours} hour${absHours === 1 ? "" : "s"} ago`;
  const absDays = Math.abs(Math.round(deltaMs / 86400000));
  return `${absDays} day${absDays === 1 ? "" : "s"} ago`;
}

function missionRisk(mission: HorosMissionDetail): string {
  const policy = mission.authorityPolicies?.[0];
  if (policy?.blocked) return "High";
  if (policy?.needsApproval) return "Medium";
  return "Low";
}

function missionPlanner(mission: HorosMissionDetail): string {
  const planner = mission.executionRun?.planner as { planner?: unknown; model?: unknown; stage?: unknown } | undefined;
  const plannerName =
    typeof planner?.planner === "string" ? planner.planner :
    typeof planner?.model === "string" ? planner.model :
    null;
  return plannerName || "HOROS Planner";
}

function missionProgress(mission: HorosMissionDetail): number {
  switch ((mission.state ?? "").toLowerCase()) {
    case "completed":
      return 100;
    case "waiting_review":
      return 85;
    case "running":
      return 60;
    case "failed":
      return 100;
    default:
      return 10;
  }
}

export function MissionsActive({ onViewMission }: { onViewMission?: (id: string) => void }) {
  const [workspaceId, setWorkspaceId] = useState<string | null>(() => readActiveHorosWorkspaceId());
  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    const syncWorkspace = () => setWorkspaceId(readActiveHorosWorkspaceId());
    syncWorkspace();
    window.addEventListener("focus", syncWorkspace);
    window.addEventListener("storage", syncWorkspace);
    return () => {
      window.removeEventListener("focus", syncWorkspace);
      window.removeEventListener("storage", syncWorkspace);
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!workspaceId) {
      setMissions([]);
      setError("Select a workspace to load missions.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [liveMissions, institutions] = await Promise.all([
        listHorosMissions(workspaceId),
        listHorosInstitutions(workspaceId),
      ]);
      setInstitutionId(institutions[0]?.id ?? null);
      setMissions(
        liveMissions
          .filter((mission) => {
            const state = (mission.state ?? "").toLowerCase();
            return state === "running" || state === "waiting_review" || state === "draft";
          })
          .map((mission) => ({
            id: mission.id,
            name: mission.title ?? mission.objective ?? "Untitled mission",
            institution: mission.institution?.name ?? "Unknown",
            planner: missionPlanner(mission),
            status: mission.state ?? "draft",
            risk: missionRisk(mission),
            progress: missionProgress(mission),
            started: formatRelativeTime(mission.updatedAt),
          })),
      );
    } catch (loadError) { 
      setError(loadError instanceof Error ? loadError.message : "Failed to load missions.");
      setMissions([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const summary = useMemo(() => {
    const running = missions.filter((mission) => mission.status === "running").length;
    const waiting = missions.filter((mission) => mission.status === "waiting_review").length;
    const failed = missions.filter((mission) => mission.status === "failed").length;
    const completedToday = missions.filter((mission) => mission.progress >= 100).length;
    return { running, waiting, failed, completedToday };
  }, [missions]);

  const handleCreateMission = useCallback(async () => {
    if (!workspaceId || !institutionId) {
      setError("Create or select an institution first.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await createHorosMission(workspaceId, {
        institutionId,
        title: "New Mission",
        objective: "Define and run a new operational mission.",
        plan: [
          "Clarify objective",
          "Plan execution",
          "Gather evidence",
          "Verify result",
        ],
      });
      await refresh();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Failed to create mission.");
    } finally {
      setCreating(false);
    }
  }, [institutionId, refresh, workspaceId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return (
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-[#555]" strokeWidth={2} />
            <span className="text-[13px] text-[#333] border-b border-dashed border-[#ccc] cursor-help hover:border-[#777]">Running</span>
          </div>
        );
      case "waiting_review":
        return (
          <div className="flex items-center gap-1.5">
            <AlertCircle className="size-3.5 text-amber-500" strokeWidth={2} />
            <span className="text-[13px] text-[#333] border-b border-dashed border-[#ccc] cursor-help hover:border-[#777]">Waiting Review</span>
          </div>
        );
      case "draft":
        return <span className="text-[#333] text-[13px]">Draft</span>;
      default:
        return <span className="text-[#333] text-[13px]">{status}</span>;
    }
  };

  const visibleMissions = missions.filter((mission) => {
    const haystack = `${mission.name} ${mission.institution} ${mission.status} ${mission.risk}`.toLowerCase();
    const normalizedFilter = activeFilter.toLowerCase();
    const statusMatches =
      activeFilter === "All" ||
      (activeFilter === "Waiting Review" && mission.status === "waiting_review") ||
      mission.status.replace(/_/g, " ") === normalizedFilter;
    return haystack.includes(query.trim().toLowerCase()) && statusMatches;
  });

  return (
    <div className="w-full flex flex-col pt-2 pb-12 font-sans">
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Rocket className="size-6 text-[#111]" strokeWidth={1.5} />
            <h1 className="text-[28px] font-medium text-[#111] tracking-tight">Active Missions</h1>
          </div>
          <p className="text-[15px] text-[#555]">Run and monitor institutional work.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCreateMission}
            disabled={creating || !workspaceId || !institutionId}
            className="btn-glossy-blue h-9 px-4 text-[13.5px] font-medium gap-1.5 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Plus className="size-4" />
            {creating ? "Creating..." : "Create Mission"}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 mb-4 text-[13px] text-[#555]">
        <div>{workspaceId ? `Workspace ${workspaceId}` : "No workspace selected"}</div>
        <button className="text-[#0f52ff] font-medium hover:underline" onClick={() => void refresh()} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error ? (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white border border-[#ddd] rounded-md p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[#777] mb-1">
            <Play className="size-4" strokeWidth={1.5} />
            <span className="text-[12px] font-medium uppercase tracking-wider">Running Missions</span>
          </div>
          <span className="text-[24px] font-semibold text-[#111]">{summary.running}</span>
        </div>
        <div className="bg-white border border-[#ddd] rounded-md p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[#777] mb-1">
            <AlertCircle className="size-4" strokeWidth={1.5} />
            <span className="text-[12px] font-medium uppercase tracking-wider">Waiting Review</span>
          </div>
          <span className="text-[24px] font-semibold text-amber-600">{summary.waiting}</span>
        </div>
        <div className="bg-white border border-[#ddd] rounded-md p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[#777] mb-1">
            <CheckCircle2 className="size-4" strokeWidth={1.5} />
            <span className="text-[12px] font-medium uppercase tracking-wider">Completed Today</span>
          </div>
          <span className="text-[24px] font-semibold text-[#111]">{summary.completedToday}</span>
        </div>
        <div className="bg-white border border-[#ddd] rounded-md p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[#777] mb-1">
            <XCircle className="size-4" strokeWidth={1.5} />
            <span className="text-[12px] font-medium uppercase tracking-wider">Failed</span>
          </div>
          <span className="text-[24px] font-semibold text-red-600">{summary.failed}</span>
        </div>
        <div className="bg-white border border-[#ddd] rounded-md p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[#777] mb-1">
            <Clock className="size-4" strokeWidth={1.5} />
            <span className="text-[12px] font-medium uppercase tracking-wider">Average Runtime</span>
          </div>
          <span className="text-[24px] font-semibold text-[#111]">Live</span>
        </div>
        <div className="bg-white border border-[#ddd] rounded-md p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[#777] mb-1">
            <ShieldCheck className="size-4" strokeWidth={1.5} />
            <span className="text-[12px] font-medium uppercase tracking-wider">Verification Rate</span>
          </div>
          <span className="text-[24px] font-semibold text-[#111]">{missions.length > 0 ? `${Math.round((missions.filter((mission) => mission.status !== "failed").length / missions.length) * 100)}%` : "—"}</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          {["All", "Running", "Waiting Review", "Draft", "Failed"].map((filter, index) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded text-[13px] font-medium transition-colors border ${activeFilter === filter ? "bg-white text-[#111] border-[#111]" : "bg-white text-[#555] border-[#ccc] hover:bg-[#f8f8f8]"}`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="flex items-center w-full md:w-[300px]">
          <div className="relative w-full">
            <Search className="size-4 text-[#777] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search mission..."
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-[#ccc] rounded text-[14px] text-[#333] outline-none focus:border-[#0f52ff] focus:ring-1 focus:ring-[#0f52ff] transition-all h-[36px]"
            />
          </div>
        </div>
      </div>

      <div className="w-full">
        {loading ? (
          <div className="bg-white border border-[#ddd] rounded-md p-8 text-center text-[14px] text-[#555]">Loading live missions...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#ddd]">
                <th className="px-4 py-3.5 text-[13px] font-semibold text-[#111]">Mission</th>
                <th className="px-4 py-3.5 text-[13px] font-semibold text-[#111]">Institution</th>
                <th className="px-4 py-3.5 text-[13px] font-semibold text-[#111]">Planner</th>
                <th className="px-4 py-3.5 text-[13px] font-semibold text-[#111]">Status</th>
                <th className="px-4 py-3.5 text-[13px] font-semibold text-[#111]">Risk</th>
                <th className="px-4 py-3.5 text-[13px] font-semibold text-[#111]">Progress</th>
                <th className="px-4 py-3.5 text-[13px] font-semibold text-[#111]">Started</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eee]">
              {visibleMissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[14px] text-[#555]">
                    No active missions match the selected filter.
                  </td>
                </tr>
              ) : (
                visibleMissions.map((mission) => (
                  <tr key={mission.id} className="hover:bg-[#fcfcfc] transition-colors group cursor-pointer" onClick={() => onViewMission?.(mission.id)}>
                    <td className="px-4 py-4">
                      <span className="font-semibold text-[14px] text-[#0f52ff] group-hover:underline">{mission.name}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[14px] text-[#333]">{mission.institution}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[14px] text-[#555]">{mission.planner}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center text-[14px]">{getStatusBadge(mission.status)}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[14px] text-[#555]">{mission.risk}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-[13px] font-medium text-[#111] w-10">{mission.progress}%</span>
                        <div className="w-[100px] h-[6px] bg-[#eee] rounded-full overflow-hidden">
                          <div className="h-full bg-[#0f52ff]" style={{ width: `${mission.progress}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[14px] text-[#555]">{mission.started}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
