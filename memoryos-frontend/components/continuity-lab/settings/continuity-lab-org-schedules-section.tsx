"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useOrganization } from "@clerk/nextjs";
import { ArrowLeft } from "lucide-react";
import { ContinuityLabSettingsSectionFrame } from "@/components/continuity-lab/settings/continuity-lab-settings-shell";
import {
  SettingsPrimaryButton,
  SettingsSearchInput,
  SettingsSelectDropdown,
  SettingsToolbar,
} from "@/components/continuity-lab/settings/continuity-lab-settings-ui";
import {
  fetchLabSchedulesFromApi,
  loadLabSchedulesHybrid,
  loadLabSchedulesLocalFallback,
} from "@/lib/continuity-lab/lab-schedules-api";
import {
  LAB_SCHEDULES_CHANGED_EVENT,
  type LabSchedulesChangedDetail,
} from "@/lib/continuity-lab/lab-schedules-events";
import {
  formatNextRunLabel,
  frequencySummary,
  scheduleTypeLabel,
} from "@/lib/continuity-lab/lab-schedules-runtime";
import { readLabSchedulesCache } from "@/lib/continuity-lab/lab-schedules-storage";
import type { LabSchedule, LabSchedulesListScope } from "@/lib/continuity-lab/lab-schedules-types";
import { SETTINGS_INDEX_PATH } from "@/lib/continuity-lab/settings-nav";
import { subtlePanel } from "@/components/continuity-lab/continuity-lab-section-ui";
import { cn } from "@/lib/utils";

const SCOPE_OPTIONS: { value: LabSchedulesListScope; label: string }[] = [
  { value: "mine", label: "Your schedules" },
  { value: "all", label: "All schedules" },
];

function formatUpdatedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function ContinuityLabOrgSchedulesSection() {
  const router = useRouter();
  const { organization } = useOrganization();
  const orgId = organization?.id?.trim() ?? "";

  const [scope, setScope] = useState<LabSchedulesListScope>("mine");
  const [search, setSearch] = useState("");
  const [schedules, setSchedules] = useState<LabSchedule[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const remote = await loadLabSchedulesHybrid(scope);
      if (remote) {
        setSchedules(remote.schedules);
        setCurrentUserId(remote.currentUserId);
        return;
      }
      const fallback = loadLabSchedulesLocalFallback(orgId);
      setSchedules(fallback.schedules);
    } finally {
      setLoading(false);
    }
  }, [orgId, scope]);

  useEffect(() => {
    const cached = readLabSchedulesCache();
    if (cached && (!orgId || cached.orgId === orgId)) {
      setSchedules(cached.schedules);
    }
    void refresh();
  }, [refresh, orgId]);

  useEffect(() => {
    function onChanged(event: Event) {
      const detail = (event as CustomEvent<LabSchedulesChangedDetail>).detail;
      if (!detail?.orgId) return;
      if (orgId && detail.orgId !== orgId) return;
      if (Array.isArray(detail.schedules)) {
        setSchedules(detail.schedules);
        return;
      }
      // When schedules are omitted from the event payload (e.g. local cache missing),
      // refetch to keep the list consistent with the currently-selected scope.
      void refresh();
    }
    window.addEventListener(LAB_SCHEDULES_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(LAB_SCHEDULES_CHANGED_EVENT, onChanged);
  }, [orgId, refresh]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return schedules;
    return schedules.filter((row) => {
      const haystack = [
        row.name,
        row.prompt,
        frequencySummary(row),
        scheduleTypeLabel(row.type),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [schedules, search]);

  const searchQuery = search.trim();
  const emptyMessage =
    searchQuery !== "" ? `No schedules match "${searchQuery}".` : "No schedules found";

  return (
    <ContinuityLabSettingsSectionFrame
      sectionId="schedules"
      titleOverride="Schedules"
      descriptionOverride="Automate recurring or one-time Continuity Lab sessions"
      docHref="/continuity-lab/automations"
      breadcrumb={[
        { label: "Settings", href: SETTINGS_INDEX_PATH },
        { label: "Schedules" },
      ]}
      contentClassName="max-w-4xl"
    >
      <Link
        href={SETTINGS_INDEX_PATH}
        className="-mt-2 mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#F0EFE2]/50 transition hover:text-[#F0EFE2]/80"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to organization
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#2563EB]/30 bg-[#2563EB]/10 px-3 py-2.5 text-xs text-blue-100/95">
        <p>
          <span className="font-medium text-[#F0EFE2]">Schedules is a legacy feature — </span>
          migrate to Automations for supported triggers and workflows.
        </p>
        <Link
          href="/continuity-lab/automations"
          className="inline-flex h-8 shrink-0 items-center rounded-md border border-[#2563EB]/40 bg-[#2563EB]/20 px-3 text-xs font-semibold text-[#F0EFE2] transition hover:bg-[#2563EB]/30"
        >
          Go to Automations
        </Link>
      </div>

      <SettingsToolbar className="mt-2">
        <SettingsSearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search schedules..."
          className="max-w-sm"
        />
        <div className="w-[180px] shrink-0">
          <SettingsSelectDropdown<LabSchedulesListScope>
            value={scope}
            onChange={(next) => {
              setScope(next);
              void fetchLabSchedulesFromApi(next).then((res) => {
                if (res) {
                  setSchedules(res.schedules);
                  setCurrentUserId(res.currentUserId);
                }
              });
            }}
            options={SCOPE_OPTIONS}
          />
        </div>
        <SettingsPrimaryButton variant="blue" href="/continuity-lab/settings/schedules/new">
          Create schedule
        </SettingsPrimaryButton>
      </SettingsToolbar>

      <div className={cn(subtlePanel(), "mt-4 overflow-hidden")}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] bg-[#111111]">
              {["Name", "Type", "Schedule", "Updated"].map((col) => (
                <th
                  key={col}
                  className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#F0EFE2]/35"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-sm text-[#F0EFE2]/45">
                  Loading schedules…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center">
                  <p className="text-sm text-[#F0EFE2]/45">{emptyMessage}</p>
                  {searchQuery === "" && scope === "mine" ? (
                    <button
                      type="button"
                      onClick={() => setScope("all")}
                      className="mt-3 text-sm font-medium text-[#60A5FA] underline decoration-[#2563EB]/40 underline-offset-2 hover:text-[#93C5FD]"
                    >
                      View all schedules
                    </button>
                  ) : null}
                  {searchQuery === "" && scope === "all" ? (
                    <p className="mt-2 text-xs text-[#F0EFE2]/40">
                      Create a schedule to automate recurring sessions
                    </p>
                  ) : null}
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer border-b border-white/[0.06] transition last:border-b-0 hover:bg-white/[0.03]"
                  onClick={() =>
                    router.push(`/continuity-lab/settings/schedules/${encodeURIComponent(row.id)}`)
                  }
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-[#F0EFE2]">{row.name}</span>
                    {currentUserId && row.createdBy === currentUserId ? (
                      <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-[#F0EFE2]/30">
                        Yours
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-[#F0EFE2]/60">{scheduleTypeLabel(row.type)}</td>
                  <td className="px-4 py-3 text-[#F0EFE2]/60">
                    <span className="block">{frequencySummary(row)}</span>
                    <span className="mt-0.5 block text-[11px] text-[#F0EFE2]/35">
                      {formatNextRunLabel(row)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#F0EFE2]/50">{formatUpdatedAt(row.updatedAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </ContinuityLabSettingsSectionFrame>
  );
}
