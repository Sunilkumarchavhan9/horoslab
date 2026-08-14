"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, Loader2, Plus, Search } from "lucide-react";
import type { AutomationTemplate } from "@/lib/continuity-lab/automation-templates";
import { pillActionButton, subtlePanel } from "@/components/continuity-lab/continuity-lab-section-ui";
import { cn } from "@/lib/utils";
import { useContinuityLab } from "@/components/continuity-lab/continuity-lab-context";
import {
  FEATURED_AUTOMATION_TEMPLATES,
} from "@/lib/continuity-lab/automation-templates";
import {
  defaultAutomationForm,
  newTrigger,
  readAutomationStorage,
  saveAutomationDraft,
  touchRecentAutomation,
  type SavedAutomation,
} from "@/lib/continuity-lab/automation-storage";
import {
  createAutomationOnApi,
  fetchAutomationsFromApi,
  subscribeAutomationEvents,
  touchAutomationOnApi,
} from "@/lib/continuity-lab/automation-api";
import { AUTOMATIONS_CHANGED_EVENT } from "@/lib/continuity-lab/automation-events";
import { savePrefillPrompt } from "@/lib/continuity-lab/prefill-prompt";
import { startLabSessionWithBrief } from "@/lib/continuity-lab/sessions";
import { projectIdForLab } from "@/lib/continuity-lab/resume-brief";
import { readResumeProject } from "@/lib/continuity-launch-context";

type AutomationsTab = "automations" | "triage";

const WEEKLY_CHANGELOG_INSTRUCTIONS = [
  "Generate a weekly changelog.",
  "",
  "1. List all PRs merged in the past 7 days",
  "2. Categorize: features, bug fixes, improvements, breaking changes",
  "3. Write a one-line summary per change",
  "4. Open a PR to update CHANGELOG.md",
  "5. Post the highlights to the #engineering Slack channel",
  "6. Use the Notion MCP to update the changelog page with the full list",
].join("\n");

async function ensureWeeklyChangelogAutomation(): Promise<SavedAutomation> {
  const remote = await fetchAutomationsFromApi("all");
  const existing = (remote?.automations ?? readAutomationStorage().automations).find(
    (automation) => automation.templateId === "weekly-changelog-demo" || automation.name === "Weekly Changelog",
  );
  if (existing) return existing;

  const base = defaultAutomationForm();
  const trigger = newTrigger("schedule", {
    timezone: "UTC",
    hour: "16",
    minute: "0",
    interval: "1",
    intervalUnit: "week",
    repeatDays: "FR",
    dayOfWeek: "FR",
    cron: "0 16 * * 5",
    rrule: "FREQ=WEEKLY;INTERVAL=1;BYDAY=FR;BYHOUR=16;BYMINUTE=0",
    intervalLabel: "Weekly on Fri at 16:00",
  });

  const payload: Omit<SavedAutomation, "id" | "createdAt" | "updatedAt"> = {
    ...base,
    name: "Weekly Changelog",
    goal: "Generate a weekly changelog",
    triggers: [trigger],
    instructions: WEEKLY_CHANGELOG_INSTRUCTIONS,
    instructionsV2: [],
    connectors: ["slack", "notion"],
    limits: {
      ...base.limits,
      costLimitEnabled: true,
      costLimitUsd: 10,
      invocationLimitEnabled: true,
      invocationLimit: 50,
      invocationWindowHours: 1,
    },
    networkPolicy: {
      enabled: true,
      allowedDomains: ["git-manager.memoryos.ai", "mcp.notion.com"],
    },
    sharedScratchpad: "",
    templateId: "weekly-changelog-demo",
  };

  const created = await createAutomationOnApi(payload);
  if (!created) {
    throw new Error("Could not create automation on the backend.");
  }
  return created;
}

export function ContinuityLabAutomations() {
  const router = useRouter();
  const { canStartSession, openCompanyModelModal, refresh, connector } =
    useContinuityLab();
  const defaultRepo = connector.payload.github.repos[0]?.fullName ?? null;

  const [tab, setTab] = useState<AutomationsTab>("automations");
  const [prompt, setPrompt] = useState("");
  const [automations, setAutomations] = useState<SavedAutomation[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshList = useCallback(async () => {
    const response = await fetchAutomationsFromApi("all");
    setAutomations(response?.automations ?? readAutomationStorage().automations);
  }, []);

  useEffect(() => {
    let active = true;
    void refreshList().then(() => {
      if (!active) return;
    });

    const unsubscribe = subscribeAutomationEvents();
    const onAutomationsChanged = (event: Event) => {
      const detail = (event as CustomEvent).detail as
        | { automations?: SavedAutomation[] }
        | undefined;
      if (Array.isArray(detail?.automations)) {
        setAutomations(detail.automations);
        return;
      }
      void refreshList();
    };
    window.addEventListener(AUTOMATIONS_CHANGED_EVENT, onAutomationsChanged);
    return () => {
      active = false;
      unsubscribe();
      window.removeEventListener(AUTOMATIONS_CHANGED_EVENT, onAutomationsChanged);
    };
  }, [refreshList]);

  function handleFeaturedAdd(templateId: string) {
    router.push(`/continuity-lab/automations/new?template=${encodeURIComponent(templateId)}`);
  }

  async function handlePromptSubmit() {
    const text = prompt.trim();
    if (!text) return;
    setError(null);

    if (text.length < 80) {
      savePrefillPrompt(text);
      saveAutomationDraft({
        name: text.slice(0, 60),
        goal: text,
        instructions: text,
        triggers: [],
      });
      router.push("/continuity-lab/automations/new");
      return;
    }

    if (!canStartSession) {
      setError("Save your Company Model before starting a session.");
      openCompanyModelModal();
      return;
    }

    setSubmitting(true);
    try {
      const project =
        readResumeProject() ??
        (defaultRepo ? projectIdForLab({ repoFullName: defaultRepo }) : "continuity-lab-workspace");
      const { sessionPath } = await startLabSessionWithBrief({
        prompt: text,
        project,
        repo: defaultRepo,
        briefQuestion: text,
      });
      await refresh();
      router.push(sessionPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start session.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleAutomationClick(automation: SavedAutomation) {
    touchRecentAutomation({ id: automation.id, name: automation.name });
    void touchAutomationOnApi(automation.id);
    router.push(`/continuity-lab/automations/${encodeURIComponent(automation.id)}/edit`);
  }

  async function handleWeeklyChangelogClick() {
    setError(null);
    try {
      const automation = await ensureWeeklyChangelogAutomation();
      await refreshList();
      router.push(`/continuity-lab/automations/${encodeURIComponent(automation.id)}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create automation.");
    }
  }

  return (
    <div className="mx-auto max-w-[820px] px-5 py-12 pb-16">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-white">Automations</h1>
      </div>

      <div className={cn(subtlePanel(), "mt-6 overflow-hidden")}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handlePromptSubmit();
            }
          }}
          rows={5}
          disabled={submitting}
          placeholder="Fix lint errors whenever CI fails on a PR"
          className="w-full resize-none bg-transparent px-4 pb-2 pt-4 text-sm leading-relaxed text-white placeholder:text-white/35 focus:outline-none disabled:opacity-50"
        />
        <div className="flex justify-end border-t border-white/[0.06] px-3 py-2">
          <button
            type="button"
            onClick={() => void handlePromptSubmit()}
            disabled={submitting || !prompt.trim()}
            className="inline-flex size-9 items-center justify-center rounded-md bg-white text-[#0A0A0A] disabled:opacity-40"
            aria-label="Submit prompt"
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ArrowUpRight className="size-4" />
            )}
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-3 text-xs text-red-300/90" role="alert">
          {error}
        </p>
      ) : null}

      <section className="mt-10 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Featured automations</h2>
          </div>
          <Link
            href="/continuity-lab/automations/templates"
            className="text-xs font-medium text-white/50 hover:text-white/75"
          >
            View all examples
          </Link>
        </div>

        <ul className={cn(subtlePanel(), "overflow-hidden")}>
          {FEATURED_AUTOMATION_TEMPLATES.slice(0, 3).map((template) => (
            <FeaturedTemplateRow
              key={template.id}
              template={template}
              onSelect={() => handleFeaturedAdd(template.id)}
            />
          ))}
        </ul>
      </section>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-0">
          <button
            type="button"
            onClick={() => setTab("automations")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-semibold transition",
              tab === "automations"
                ? "bg-[#1F1F1F] text-white"
                : "text-white/45 hover:text-white/70",
            )}
          >
            Automations 1
          </button>
          <button
            type="button"
            onClick={() => setTab("triage")}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition",
              tab === "triage"
                ? "bg-[#1F1F1F] text-white"
                : "text-white/45 hover:text-white/70",
            )}
          >
            Triage agents
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex size-8 items-center justify-center rounded-md text-white/45 hover:bg-white/[0.04] hover:text-white/70"
            aria-label="Search automations"
          >
            <Search className="size-4" />
          </button>
          <Link href="/continuity-lab/automations/new" className={pillActionButton}>
            <Plus className="size-3.5" />
            Create automation
          </Link>
        </div>
      </div>

      {tab === "triage" ? (
        <div className="mt-8 px-2 py-12 text-center">
          <p className="text-sm font-medium text-white/70">Triage agents</p>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-white/45">
            Queue and assign MemoryOS triage agents across Slack and GitHub — coming in the next
            slice. Use featured templates above to create triage agents today.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {automations.length === 0 ? (
            <li>
              <WeeklyChangelogRow onClick={() => void handleWeeklyChangelogClick()} />
            </li>
          ) : null}
          {automations.map((automation) => (
            <li key={automation.id}>
              <button
                type="button"
                onClick={() => handleAutomationClick(automation)}
                className={cn(
                  subtlePanel(),
                  "flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-[#222222]",
                )}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{automation.name}</p>
                  <p className="mt-0.5 truncate text-[11px] text-white/40">
                    {automation.triggers.length} trigger
                    {automation.triggers.length === 1 ? "" : "s"}
                    {automation.connectors.length
                      ? ` · ${automation.connectors.join(", ")}`
                      : ""}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] text-white/35">
                  {new Date(automation.updatedAt).toLocaleDateString()}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function WeeklyChangelogRow({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid w-full grid-cols-[minmax(0,1fr)_160px_80px] items-center gap-4 rounded-md px-2 py-3 text-left transition hover:bg-white/[0.03] max-sm:grid-cols-1"
    >
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-white/45">Created by you</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="inline-flex size-4 items-center justify-center rounded-full border border-white/25 text-[10px] text-white/60">
            W
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">Weekly Changelog</p>
            <p className="text-xs text-white/45">You</p>
          </div>
        </div>
      </div>
      <div className="hidden h-10 items-end justify-end sm:flex" aria-hidden>
        <svg className="h-8 w-36" viewBox="0 0 144 32" role="img">
          <path d="M0 24 H72 L76 24 L80 24 L84 24 L88 24 L92 8 L96 24 H144" fill="none" stroke="#2563EB" strokeWidth="1.5" />
        </svg>
      </div>
      <div className="text-right text-xs text-white/45 max-sm:text-left">
        <p>Created</p>
        <p className="mt-2 text-white/60">6d ago</p>
      </div>
    </button>
  );
}

function FeaturedTemplateRow({
  template,
  onSelect,
}: {
  template: AutomationTemplate;
  onSelect: () => void;
}) {
  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
          }
        }}
        className={cn(
          "group flex cursor-pointer items-center gap-4 border-b border-white/[0.06] px-4 py-3.5 transition last:border-b-0 hover:bg-white/[0.03]",
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">{template.title}</p>
          <p className="mt-1 truncate text-xs leading-relaxed text-white/50">{template.description}</p>
        </div>
        <span
          className="inline-flex size-7 shrink-0 items-center justify-center text-white/55 transition group-hover:text-white"
          aria-hidden
        >
          <Plus className="size-4" />
        </span>
      </div>
    </li>
  );
}
