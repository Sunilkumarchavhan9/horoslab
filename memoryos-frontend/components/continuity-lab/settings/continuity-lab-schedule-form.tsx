"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useOrganization } from "@clerk/nextjs";
import { ArrowLeft, Maximize2 } from "lucide-react";
import { ContinuityLabScheduleFrequencyField } from "@/components/continuity-lab/settings/continuity-lab-schedule-frequency-field";
import { ContinuityLabSettingsSectionFrame } from "@/components/continuity-lab/settings/continuity-lab-settings-shell";
import {
  SettingsFieldRow,
  SettingsFlatPanel,
  SettingsSecondaryButton,
  SettingsSelectDropdown,
  SettingsToggle,
} from "@/components/continuity-lab/settings/continuity-lab-settings-ui";
import {
  createLabScheduleOnApi,
  fetchLabScheduleFromApi,
  patchLabScheduleOnApi,
} from "@/lib/continuity-lab/lab-schedules-api";
import {
  defaultLabScheduleDraft,
  isLabScheduleDraftValid,
} from "@/lib/continuity-lab/lab-schedules-runtime";
import {
  fetchLabPlaybooks,
  type LabPlaybook,
} from "@/lib/continuity-lab/lab-playbooks-api";
import type {
  LabSchedule,
  LabScheduleDraft,
  LabScheduleEmailNotifications,
  LabScheduleType,
} from "@/lib/continuity-lab/lab-schedules-types";
import { useLiveConnectors } from "@/lib/continuity-lab/use-live-connectors";
import { SETTINGS_INDEX_PATH, settingsSectionPath } from "@/lib/continuity-lab/settings-nav";
import { subtlePanel } from "@/components/continuity-lab/continuity-lab-section-ui";
import { cn } from "@/lib/utils";

const ALL_REPOS_VALUE = "__all__";

const inputClass =
  "h-9 w-full rounded-md border border-white/[0.08] bg-[#111111] px-3 text-sm text-white placeholder:text-white/35 focus:border-white/20 focus:outline-none";

const TYPE_OPTIONS: { value: LabScheduleType; label: string }[] = [
  { value: "recurring", label: "Recurring" },
  { value: "one_time", label: "One-time" },
];

const EMAIL_OPTIONS: { value: LabScheduleEmailNotifications; label: string }[] = [
  { value: "all_runs", label: "Always" },
  { value: "on_failure", label: "On failure only" },
  { value: "never", label: "Never" },
];

const saveButtonClass =
  "inline-flex h-9 items-center rounded-md bg-[#2563EB] px-3.5 text-sm font-medium text-white transition hover:bg-[#3B82F6] disabled:opacity-40";

type PlaybookOption = { id: string | null; label: string };

function scheduleToDraft(schedule: LabSchedule): LabScheduleDraft {
  return {
    name: schedule.name,
    type: schedule.type,
    frequency: schedule.frequency,
    oneTimeAt: schedule.oneTimeAt,
    prompt: schedule.prompt,
    playbookId: schedule.playbookId,
    autoApproveChildSessions: schedule.autoApproveChildSessions,
    repoScope: schedule.repoScope,
    repos: schedule.repos,
    emailNotifications: schedule.emailNotifications,
  };
}

function repoDropdownValue(draft: LabScheduleDraft): string {
  if (draft.repoScope === "all" || draft.repos.length === 0) return ALL_REPOS_VALUE;
  return draft.repos[0];
}

export function ContinuityLabScheduleForm({
  scheduleId,
  mode,
}: {
  scheduleId?: string;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const { organization } = useOrganization();
  const liveConnectors = useLiveConnectors();
  const github = liveConnectors.github;

  const [draft, setDraft] = useState<LabScheduleDraft>(defaultLabScheduleDraft);
  const [loaded, setLoaded] = useState(mode === "create");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [promptTab, setPromptTab] = useState<"edit" | "preview">("edit");
  const [playbooks, setPlaybooks] = useState<LabPlaybook[]>([]);

  const playbookOptions = useMemo(() => {
    const options: PlaybookOption[] = [
      { id: null, label: "No playbook" },
      ...playbooks.map((playbook) => ({
        id: playbook.id,
        label: playbook.macro ? `${playbook.name} (${playbook.macro})` : playbook.name,
      })),
    ];
    if (draft.playbookId && !playbooks.some((playbook) => playbook.id === draft.playbookId)) {
      options.push({ id: draft.playbookId, label: `Saved playbook (${draft.playbookId})` });
    }
    return options;
  }, [draft.playbookId, playbooks]);

  const repoOptions = useMemo(() => {
    const rows = github.repos.map((repo) => ({
      value: repo.fullName,
      label: repo.fullName,
    }));
    // Ensure the currently-selected repo is always present in the dropdown,
    // even if it isn't in the first N repos loaded from the connector.
    const existing = new Set(rows.map((r) => r.value));
    if (draft.repoScope === "specific") {
      for (const fullName of draft.repos) {
        if (!fullName || existing.has(fullName)) continue;
        rows.push({ value: fullName, label: fullName });
        existing.add(fullName);
      }
    }
    return [{ value: ALL_REPOS_VALUE, label: "All repositories" }, ...rows];
  }, [github.repos, draft.repoScope, draft.repos]);

  useEffect(() => {
    if (mode !== "edit" || !scheduleId) return;
    let cancelled = false;
    void (async () => {
      const remote = await fetchLabScheduleFromApi(scheduleId);
      if (cancelled) return;
      if (!remote?.schedule) {
        setLoadError("Schedule not found.");
        setLoaded(true);
        return;
      }
      if (organization?.id && remote.orgId !== organization.id) {
        setLoadError("Schedule belongs to another organization.");
        setLoaded(true);
        return;
      }
      setDraft(scheduleToDraft(remote.schedule));
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, scheduleId, organization?.id]);

  useEffect(() => {
    let cancelled = false;
    void fetchLabPlaybooks().then((response) => {
      if (cancelled || !response) return;
      setPlaybooks([...response.playbooks.organization, ...response.playbooks.system]);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateDraft = useCallback((partial: Partial<LabScheduleDraft>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
  }, []);

  const canSave = isLabScheduleDraftValid(draft);

  async function handleSave() {
    if (!canSave) return;
    setSaveState("saving");
    setSaveError(null);
    const payload = { ...draft, name: draft.name.trim(), prompt: draft.prompt.trim() };
    const saved =
      mode === "create"
        ? await createLabScheduleOnApi(payload)
        : scheduleId
          ? await patchLabScheduleOnApi(scheduleId, payload)
          : null;
    if (!saved) {
      setSaveState("error");
      setSaveError("Could not save schedule. Check organization context and try again.");
      return;
    }
    setSaveState("idle");
    router.push(settingsSectionPath("schedules"));
  }

  const breadcrumbLabel = mode === "create" ? "New schedule" : draft.name.trim() || "Edit schedule";

  return (
    <ContinuityLabSettingsSectionFrame
      sectionId="schedules"
      titleOverride={mode === "create" ? "New schedule" : draft.name.trim() || "Edit schedule"}
      descriptionOverride="Automate recurring or one-time Continuity Lab sessions"
      docHref="/continuity-lab/automations"
      breadcrumb={[
        { label: "Settings", href: SETTINGS_INDEX_PATH },
        { label: "Schedules", href: settingsSectionPath("schedules") },
        { label: breadcrumbLabel },
      ]}
      contentClassName="max-w-2xl"
    >
      <Link
        href={settingsSectionPath("schedules")}
        className="-mt-2 mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-white/50 transition hover:text-white/80"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to schedules
      </Link>

      <div className="mx-auto w-full space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            type="text"
            value={draft.name}
            onChange={(e) => updateDraft({ name: e.target.value })}
            placeholder="Schedule name"
            className={cn(inputClass, "max-w-md flex-1 text-base font-medium")}
          />
          <div className="flex items-center gap-2">
            <SettingsSecondaryButton onClick={() => router.push(settingsSectionPath("schedules"))}>
              Cancel
            </SettingsSecondaryButton>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!canSave || saveState === "saving" || !loaded}
              className={saveButtonClass}
            >
              {saveState === "saving" ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        {loadError ? <p className="text-sm text-amber-200/90">{loadError}</p> : null}
        {!loaded && !loadError ? <p className="text-sm text-white/45">Loading schedule…</p> : null}
        {saveState === "error" && saveError ? (
          <p className="text-sm text-amber-200/90">{saveError}</p>
        ) : null}

        <div className="border-l-4 border-orange-500 bg-orange-500/10 px-3 py-2.5 text-xs text-orange-100/95">
          <span className="font-medium text-orange-50">Prompt injection notice — </span>
          Scheduled prompts run with your organization&apos;s agent permissions. Only use trusted
          instructions and review playbook content before saving.
        </div>

        <SettingsFlatPanel>
          <SettingsFieldRow label="Type">
            <SettingsSelectDropdown<LabScheduleType>
              value={draft.type}
              onChange={(type) => updateDraft({ type })}
              options={TYPE_OPTIONS}
            />
          </SettingsFieldRow>

          {draft.type === "recurring" ? (
            <SettingsFieldRow label="Frequency">
              <ContinuityLabScheduleFrequencyField
                frequency={draft.frequency}
                onChange={(frequency) => updateDraft({ frequency })}
              />
            </SettingsFieldRow>
          ) : (
            <SettingsFieldRow label="Run at" hint="Local datetime for the one-time run.">
              <input
                type="datetime-local"
                value={draft.oneTimeAt?.slice(0, 16) ?? ""}
                onChange={(e) =>
                  updateDraft({
                    oneTimeAt: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                  })
                }
                className={inputClass}
              />
            </SettingsFieldRow>
          )}
        </SettingsFlatPanel>

        <div className={cn(subtlePanel(), "overflow-hidden")}>
          <div className="flex items-center justify-between border-b border-white/[0.06] px-2.5 py-2">
            <div className="flex items-center gap-1">
              {(["edit", "preview"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setPromptTab(tab)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium capitalize transition",
                    promptTab === tab
                      ? "bg-white/[0.1] text-white"
                      : "text-white/55 hover:text-white/80",
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
            <Maximize2 className="size-3.5 text-white/40" aria-hidden />
          </div>
          {promptTab === "edit" ? (
            <textarea
              value={draft.prompt}
              onChange={(e) => updateDraft({ prompt: e.target.value })}
              rows={10}
              placeholder="Write your playbook here…"
              className="min-h-[12rem] w-full resize-y bg-transparent px-4 py-3 text-sm leading-relaxed text-white placeholder:text-white/35 focus:outline-none"
            />
          ) : (
            <div className="min-h-[12rem] whitespace-pre-wrap px-4 py-3 text-sm leading-relaxed text-white/80">
              {draft.prompt.trim() ? draft.prompt : "No prompt yet."}
            </div>
          )}
        </div>

        <SettingsFlatPanel>
          <SettingsFieldRow label="Playbook" hint="Optional template to seed the session.">
            <SettingsSelectDropdown<string>
              value={draft.playbookId ?? ""}
              onChange={(value) => updateDraft({ playbookId: value ? value : null })}
              options={playbookOptions.map((opt) => ({
                value: opt.id ?? "",
                label: opt.label,
              }))}
              searchable
              searchPlaceholder="Search playbooks"
            />
          </SettingsFieldRow>

          <SettingsFieldRow
            label="Auto-approve starting child sessions"
            hint="Child sessions skip manual approval when this schedule starts them."
          >
            <SettingsToggle
              checked={draft.autoApproveChildSessions}
              onChange={(autoApproveChildSessions) => updateDraft({ autoApproveChildSessions })}
              label="Auto-approve starting child sessions"
            />
          </SettingsFieldRow>

          <SettingsFieldRow
            label="Repositories"
            hint={
              github.connected
                ? "Scope codebase context from your GitHub connector."
                : "Connect GitHub in Organization → Connections."
            }
          >
            {github.connected && repoOptions.length > 1 ? (
              <SettingsSelectDropdown<string>
                value={repoDropdownValue(draft)}
                onChange={(value) => {
                  if (value === ALL_REPOS_VALUE) {
                    updateDraft({ repoScope: "all", repos: [] });
                  } else {
                    updateDraft({ repoScope: "specific", repos: [value] });
                  }
                }}
                options={repoOptions}
                searchable
                searchPlaceholder="Search repositories"
              />
            ) : (
              <div className="space-y-2">
                <SettingsSelectDropdown<string>
                  value={ALL_REPOS_VALUE}
                  onChange={() => updateDraft({ repoScope: "all", repos: [] })}
                  options={[{ value: ALL_REPOS_VALUE, label: "All repositories" }]}
                  disabled={!github.connected}
                />
                {!github.connected ? (
                  <p className="text-xs text-white/40">
                    <Link
                      href="/continuity-lab/settings/connections"
                      className="text-[#60A5FA] hover:text-[#93C5FD]"
                    >
                      Connect GitHub
                    </Link>{" "}
                    to pick a specific repository.
                  </p>
                ) : (
                  <p className="text-xs text-white/40">No repositories indexed yet.</p>
                )}
              </div>
            )}
          </SettingsFieldRow>

          <SettingsFieldRow label="Email notifications">
            <SettingsSelectDropdown<LabScheduleEmailNotifications>
              value={draft.emailNotifications}
              onChange={(emailNotifications) => updateDraft({ emailNotifications })}
              options={EMAIL_OPTIONS}
              triggerIcon="chevrons-up-down"
            />
          </SettingsFieldRow>
        </SettingsFlatPanel>
      </div>
    </ContinuityLabSettingsSectionFrame>
  );
}
