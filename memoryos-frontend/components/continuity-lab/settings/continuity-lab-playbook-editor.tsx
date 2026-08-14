"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useUser } from "@clerk/nextjs";
import { ArrowLeft, Maximize2 } from "lucide-react";
import { ContinuityLabSettingsSectionFrame } from "@/components/continuity-lab/settings/continuity-lab-settings-shell";
import {
  SettingsFieldRow,
  SettingsFlatPanel,
  SettingsSecondaryButton,
  SettingsSelectDropdown,
} from "@/components/continuity-lab/settings/continuity-lab-settings-ui";
import {
  createLabPlaybook,
  fetchLabPlaybook,
  patchLabPlaybook,
  type LabPlaybook,
  type LabPlaybookAgentMode,
  type LabPlaybookDraft,
} from "@/lib/continuity-lab/lab-playbooks-api";
import { SETTINGS_INDEX_PATH, settingsSectionPath } from "@/lib/continuity-lab/settings-nav";
import { subtlePanel } from "@/components/continuity-lab/continuity-lab-section-ui";
import { cn } from "@/lib/utils";

const inputClass =
  "h-9 w-full rounded-md border border-white/[0.08] bg-[#111111] px-3 text-sm text-white placeholder:text-white/35 focus:border-white/20 focus:outline-none disabled:opacity-60";

const saveButtonClass =
  "inline-flex h-9 items-center rounded-md bg-[#2563EB] px-3.5 text-sm font-medium text-white transition hover:bg-[#3B82F6] disabled:opacity-40";

const PLAYBOOK_AGENT_MODE_OPTIONS: {
  value: LabPlaybookAgentMode;
  label: string;
  description: string;
}[] = [
  {
    value: "default",
    label: "Default",
    description: "Use the workspace default MemoryOS mode",
  },
  {
    value: "normal",
    label: "Normal",
    description: "Balanced agent sessions with full memory context",
  },
  {
    value: "fast",
    label: "Fast",
    description: "Prioritize faster sessions for lightweight playbooks",
  },
];

type PlaybookEditorDraft = LabPlaybookDraft;

function playbookToDraft(playbook: LabPlaybook): PlaybookEditorDraft {
  return {
    name: playbook.name,
    macro: playbook.macro,
    agentMode: playbook.agentMode ?? "default",
    content: playbook.content,
  };
}

function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}

function renderMarkdownContent(content: string) {
  const lines = content.split(/\r?\n/);
  return lines.map((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={index} className="h-3" />;
    const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (heading) {
      const level = heading[1].length;
      const className =
        level === 1
          ? "mt-3 text-xl font-semibold text-white first:mt-0"
          : level === 2
            ? "mt-3 text-base font-semibold text-white first:mt-0"
            : "mt-2 text-sm font-semibold text-white first:mt-0";
      return (
        <div key={index} className={className}>
          {renderInline(heading[2])}
        </div>
      );
    }
    const ordered = /^\d+\.\s+(.+)$/.exec(trimmed);
    if (ordered) {
      return (
        <div key={index} className="ml-4 text-sm leading-6 text-white/85">
          {trimmed.replace(/^(\d+\.).*$/, "$1")} {renderInline(ordered[1])}
        </div>
      );
    }
    const bullet = /^[-*]\s+(.+)$/.exec(trimmed);
    if (bullet) {
      return (
        <div key={index} className="ml-4 text-sm leading-6 text-white/85">
          - {renderInline(bullet[1])}
        </div>
      );
    }
    return (
      <p key={index} className="text-sm leading-6 text-white/85">
        {renderInline(trimmed)}
      </p>
    );
  });
}

export function ContinuityLabPlaybookEditor({
  mode,
  playbookId,
}: {
  mode: "create" | "edit";
  playbookId?: string;
}) {
  const router = useRouter();
  const { user } = useUser();
  const [draft, setDraft] = useState<PlaybookEditorDraft>({
    name: "",
    macro: "",
    agentMode: "default",
    content: "",
  });
  const [loaded, setLoaded] = useState(mode === "create");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving">("idle");
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [sourcePlaybook, setSourcePlaybook] = useState<LabPlaybook | null>(null);

  useEffect(() => {
    if (mode !== "edit" || !playbookId) return;
    let cancelled = false;
    void (async () => {
      const response = await fetchLabPlaybook(playbookId);
      if (cancelled) return;
      if (!response?.playbook) {
        setLoadError("Playbook not found.");
        setLoaded(true);
        return;
      }
      setSourcePlaybook(response.playbook);
      setDraft(playbookToDraft(response.playbook));
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, playbookId]);

  const updateDraft = useCallback((partial: Partial<PlaybookEditorDraft>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
  }, []);

  const canSave =
    loaded &&
    !sourcePlaybook?.readonly &&
    Boolean(draft.name.trim()) &&
    Boolean(draft.content.trim());
  const author = useMemo(() => {
    return user?.primaryEmailAddress?.emailAddress ?? sourcePlaybook?.createdBy ?? "";
  }, [sourcePlaybook?.createdBy, user?.primaryEmailAddress?.emailAddress]);

  async function handleSave() {
    if (!canSave) return;
    setSaveState("saving");
    setSaveError(null);
    const payload: LabPlaybookDraft = {
      name: draft.name.trim(),
      macro: draft.macro?.trim() || null,
      agentMode: draft.agentMode ?? "default",
      content: draft.content,
    };
    const saved =
      mode === "create"
        ? await createLabPlaybook(payload)
        : playbookId
          ? await patchLabPlaybook(playbookId, payload)
          : null;
    if (!saved) {
      setSaveState("idle");
      setSaveError("Could not save playbook.");
      return;
    }
    setSaveState("idle");
    router.push(settingsSectionPath("playbooks"));
  }

  const title = mode === "create" ? "New playbook" : sourcePlaybook?.name || "Edit playbook";

  return (
    <ContinuityLabSettingsSectionFrame
      sectionId="playbooks"
      titleOverride={title}
      descriptionOverride="Reusable system prompts that customize how MemoryOS works."
      breadcrumb={[
        { label: "Settings", href: SETTINGS_INDEX_PATH },
        { label: "Playbooks", href: settingsSectionPath("playbooks") },
        { label: title },
      ]}
      contentClassName="max-w-4xl"
    >
      <Link
        href={settingsSectionPath("playbooks")}
        className="-mt-2 mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-white/50 transition hover:text-white/80"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to playbooks
      </Link>

      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-[260px] flex-1">
            <input
              type="text"
              value={draft.name}
              onChange={(e) => updateDraft({ name: e.target.value })}
              disabled={sourcePlaybook?.readonly}
              placeholder="Enter a name for your new playbook"
              className={cn(inputClass, "max-w-md text-base font-medium")}
            />
            {author ? <p className="mt-2 text-xs text-white/45">{author}</p> : null}
          </div>
          <div className="flex items-center gap-2">
            <SettingsSecondaryButton onClick={() => router.push(settingsSectionPath("playbooks"))}>
              Cancel
            </SettingsSecondaryButton>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!canSave || saveState === "saving"}
              className={saveButtonClass}
            >
              {saveState === "saving" ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {loadError ? <p className="text-sm text-amber-200/90">{loadError}</p> : null}
        {!loaded && !loadError ? <p className="text-sm text-white/45">Loading playbook...</p> : null}
        {saveError ? <p className="text-sm text-amber-200/90">{saveError}</p> : null}
        {sourcePlaybook?.readonly ? (
          <p className="text-sm text-white/45">This system playbook is read-only.</p>
        ) : null}

        <div className={cn(subtlePanel(), "overflow-hidden")}>
          <div className="flex items-center justify-between border-b border-white/[0.06] px-2.5 py-2">
            <div className="flex items-center gap-1">
              {(["edit", "preview"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTab(item)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium capitalize transition",
                    tab === item ? "bg-white/[0.1] text-white" : "text-white/55 hover:text-white/80",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
            <Maximize2 className="size-3.5 text-white/40" aria-hidden />
          </div>
          {tab === "edit" ? (
            <textarea
              value={draft.content}
              onChange={(e) => updateDraft({ content: e.target.value })}
              disabled={sourcePlaybook?.readonly}
              rows={18}
              placeholder="Write your playbook here..."
              className="min-h-[26rem] w-full resize-y bg-transparent px-4 py-3 text-sm leading-relaxed text-white placeholder:text-white/35 focus:outline-none disabled:opacity-70"
            />
          ) : (
            <div className="min-h-[26rem] px-4 py-4">
              {draft.content.trim() ? (
                <div className="space-y-1">{renderMarkdownContent(draft.content)}</div>
              ) : (
                <p className="text-sm text-white/40">No content yet.</p>
              )}
            </div>
          )}
        </div>

        <SettingsFlatPanel>
          <SettingsFieldRow
            label="Macro"
            hint="A shortcut used in prompts to quickly run the playbook."
          >
            <input
              type="text"
              value={draft.macro ?? ""}
              onChange={(e) => updateDraft({ macro: e.target.value })}
              disabled={sourcePlaybook?.readonly}
              placeholder="!do_something"
              className={inputClass}
            />
          </SettingsFieldRow>

          <SettingsFieldRow
            label="MemoryOS mode"
            hint="Controls the MemoryOS agent mode for sessions launched from this playbook."
          >
            <SettingsSelectDropdown<LabPlaybookAgentMode>
              value={draft.agentMode ?? "default"}
              onChange={(agentMode) => updateDraft({ agentMode })}
              disabled={sourcePlaybook?.readonly}
              options={PLAYBOOK_AGENT_MODE_OPTIONS}
            />
          </SettingsFieldRow>
        </SettingsFlatPanel>
      </div>
    </ContinuityLabSettingsSectionFrame>
  );
}
