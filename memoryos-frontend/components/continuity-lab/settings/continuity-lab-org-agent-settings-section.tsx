"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useOrganization } from "@clerk/nextjs";
import { ArrowLeft, Plus, RotateCcw, X } from "lucide-react";
import { useContinuityLab } from "@/components/continuity-lab/continuity-lab-context";
import { ContinuityLabSettingsSectionFrame } from "@/components/continuity-lab/settings/continuity-lab-settings-shell";
import {
  SettingsCard,
  SettingsFieldRow,
  SettingsFlatPanel,
  SettingsOsOption,
  SettingsRowLink,
  SettingsSecondaryButton,
  SettingsSelect,
  SettingsToggle,
} from "@/components/continuity-lab/settings/continuity-lab-settings-ui";
import { subtlePanel } from "@/components/continuity-lab/continuity-lab-section-ui";
import {
  addLabContinuityLabCommandViaApi,
  fetchLabContinuityLabSettingsFromApi,
  loadLabContinuityLabSettingsHybrid,
  loadLabContinuityLabSettingsLocalFallback,
  patchLabContinuityLabSettingsToApi,
  resetLabContinuityLabCommandsViaApi,
} from "@/lib/continuity-lab/lab-continuity-lab-settings-api";
import {
  loadCompanyModelSnapshot,
  type CompanyModelSnapshot,
} from "@/lib/continuity-lab/company-model";
import {
  buildLabDefaultAgentOptions,
  coerceLabDefaultAgent,
  isOpenRouterConfigured,
} from "@/lib/continuity-lab/lab-default-agent-options";
import {
  listAllSlashCommands,
  readLabContinuityLabSettings,
  saveLabContinuityLabSettings,
  type LabContinuityLabSettings,
  type LabDefaultAgentId,
  type LabDefaultPlatform,
  type LabOpenPrsAs,
  type LabRespondingToBots,
  type LabSlashCommand,
} from "@/lib/continuity-lab/lab-continuity-lab-settings-storage";
import { SETTINGS_INDEX_PATH } from "@/lib/continuity-lab/settings-nav";
import { cn } from "@/lib/utils";

const SAVE_DEBOUNCE_MS = 450;

const inputClass =
  "h-9 w-full rounded-md border border-white/[0.08] bg-[#111111] px-3 text-sm text-[#F0EFE2] placeholder:text-[#F0EFE2]/35 focus:border-white/20 focus:outline-none";

const textareaClass = cn(
  inputClass,
  "min-h-[88px] resize-y py-2 font-mono text-xs leading-relaxed",
);

function CreateSlashCommandModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (input: { name: string; description: string; prompt: string }) => Promise<string | null>;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    setBusy(true);
    setError(null);
    const err = await onCreate({ name, description, prompt });
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-labelledby="slash-command-title"
        className={cn(subtlePanel(), "w-full max-w-lg p-5 shadow-xl")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="slash-command-title" className="text-base font-semibold text-[#F0EFE2]">
              Create Slash Command
            </h2>
            <p className="mt-1 text-xs text-[#F0EFE2]/45">
              Custom commands are available to everyone in your organization.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-md border border-white/[0.08] text-[#F0EFE2]/60 hover:bg-white/[0.06]"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-medium text-[#F0EFE2]/70">
            Command name
            <div className="relative mt-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-[#F0EFE2]/40">
                /
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.replace(/^\//, ""))}
                placeholder="my-command"
                className={cn(inputClass, "pl-7 font-mono")}
              />
            </div>
          </label>
          <label className="block text-xs font-medium text-[#F0EFE2]/70">
            Description
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this command does"
              className={cn(inputClass, "mt-1")}
            />
          </label>
          <label className="block text-xs font-medium text-[#F0EFE2]/70">
            Prompt
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Instructions sent when the command runs"
              className={cn(textareaClass, "mt-1")}
            />
          </label>
          {error ? <p className="text-xs text-amber-200/90">{error}</p> : null}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <SettingsSecondaryButton onClick={onClose}>Cancel</SettingsSecondaryButton>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleCreate()}
            className="inline-flex h-9 items-center rounded-md bg-white px-4 text-sm font-medium text-[#0A0A0A] hover:bg-white/90 disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

function SlashCommandRow({ command }: { command: LabSlashCommand }) {
  return (
    <div className="flex gap-3 border-b border-white/[0.06] px-3 py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-medium text-[#F0EFE2]">/{command.name}</span>
          {command.system ? (
            <span className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#F0EFE2]/45">
              System
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-[#F0EFE2]/45">{command.description}</p>
      </div>
    </div>
  );
}

const MEMORYOS_API_KEYS_PATH = "/continuity-lab/settings/memoryos-api";

export function ContinuityLabOrgAgentSettingsSection() {
  const { connector, openCompanyModelModal, refreshCompanyModel } = useContinuityLab();
  const { organization } = useOrganization();
  const githubConnected = connector.payload.github.connected;

  const [settings, setSettings] = useState<LabContinuityLabSettings>(readLabContinuityLabSettings);
  const [companyModel, setCompanyModel] = useState<CompanyModelSnapshot | null>(null);
  const [companyModelLoading, setCompanyModelLoading] = useState(true);
  const [commands, setCommands] = useState<LabSlashCommand[]>(() =>
    listAllSlashCommands(readLabContinuityLabSettings()),
  );
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [failedPatch, setFailedPatch] = useState<Partial<LabContinuityLabSettings> | null>(null);
  const [usageLimitDraft, setUsageLimitDraft] = useState("");
  const [usageLimitMsg, setUsageLimitMsg] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const skipNextSaveRef = useRef(true);
  const saveTimerRef = useRef<number | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const applyRemote = useCallback((next: LabContinuityLabSettings, nextCommands?: LabSlashCommand[]) => {
    skipNextSaveRef.current = true;
    setSettings(next);
    saveLabContinuityLabSettings(next);
    setCommands(nextCommands ?? listAllSlashCommands(next));
    setUsageLimitDraft(
      next.messageUsageLimitUsd === null ? "" : String(next.messageUsageLimitUsd),
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    const orgId = organization?.id?.trim() ?? "";
    void (async () => {
      const remote = await loadLabContinuityLabSettingsHybrid();
      if (cancelled) return;
      if (remote) {
        applyRemote(remote.settings, remote.commands);
      } else {
        const local = loadLabContinuityLabSettingsLocalFallback(orgId);
        applyRemote(local.settings);
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [organization?.id, applyRemote]);

  const refreshCompanyModelSnapshot = useCallback(async () => {
    setCompanyModelLoading(true);
    try {
      const snapshot = await loadCompanyModelSnapshot();
      setCompanyModel(snapshot);
      return snapshot;
    } finally {
      setCompanyModelLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshCompanyModelSnapshot();
  }, [refreshCompanyModelSnapshot, organization?.id]);

  const agentOptions = buildLabDefaultAgentOptions(companyModel);
  const openRouterConnected = isOpenRouterConfigured(companyModel);

  const persistToApi = useCallback(
    async (partial: Partial<LabContinuityLabSettings>) => {
      setSaveState("saving");
      setFailedPatch(null);
      const saved = await patchLabContinuityLabSettingsToApi(partial);
      if (saved) {
        applyRemote(saved.settings, saved.commands);
        const refreshed = await fetchLabContinuityLabSettingsFromApi();
        if (refreshed) applyRemote(refreshed.settings, refreshed.commands);
        setSaveState("saved");
        window.setTimeout(() => setSaveState("idle"), 2000);
        return true;
      }
      setFailedPatch(partial);
      setSaveState("error");
      return false;
    },
    [applyRemote],
  );

  const retrySave = useCallback(() => {
    const partial = failedPatch ?? settingsRef.current;
    void persistToApi(partial);
  }, [failedPatch, persistToApi]);

  useEffect(() => {
    if (!loaded) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      void persistToApi(settingsRef.current);
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [settings, loaded, persistToApi]);

  function updateSettings(partial: Partial<LabContinuityLabSettings>) {
    const next = saveLabContinuityLabSettings(partial);
    setSettings(next);
    if (partial.customCommands !== undefined) {
      setCommands(listAllSlashCommands(next));
    }
  }

  useEffect(() => {
    if (companyModelLoading || !openRouterConnected || agentOptions.length === 0) return;
    const coerced = coerceLabDefaultAgent(settings.defaultAgent, agentOptions);
    if (coerced !== settings.defaultAgent) {
      updateSettings({ defaultAgent: coerced });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reconcile when OpenRouter options load
  }, [companyModelLoading, openRouterConnected, agentOptions.length, settings.defaultAgent]);

  async function resetCommands() {
    setSaveState("saving");
    const saved = await resetLabContinuityLabCommandsViaApi();
    if (saved) {
      applyRemote(saved.settings, saved.commands);
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 2000);
      return;
    }
    updateSettings({ customCommands: [] });
    setSaveState("error");
  }

  async function createCommand(input: {
    name: string;
    description: string;
    prompt: string;
  }): Promise<string | null> {
    const { response, error } = await addLabContinuityLabCommandViaApi(input);
    if (response) {
      applyRemote(response.settings, response.commands);
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 2000);
      return null;
    }
    return error;
  }

  async function updateUsageLimit() {
    const trimmed = usageLimitDraft.trim();
    const parsed = trimmed === "" ? null : Number(trimmed);
    if (trimmed !== "" && (!Number.isFinite(parsed) || (parsed ?? 0) < 0)) {
      setUsageLimitMsg("Enter a valid dollar amount or leave empty.");
      return;
    }
    const value = trimmed === "" ? null : Math.round((parsed as number) * 100) / 100;
    setUsageLimitMsg(null);
    const ok = await persistToApi({ messageUsageLimitUsd: value });
    if (ok) setUsageLimitMsg("Usage limit updated.");
    else setUsageLimitMsg("Could not save usage limit.");
    window.setTimeout(() => setUsageLimitMsg(null), 3200);
  }

  const openPrOptions: { value: LabOpenPrsAs; label: string }[] = githubConnected
    ? [
        { value: "memoryos", label: "MemoryOS" },
        { value: "user", label: "User" },
      ]
    : [{ value: "memoryos", label: "MemoryOS (connect GitHub for User)" }];

  return (
    <ContinuityLabSettingsSectionFrame
      sectionId="continuity-lab"
      titleOverride="Continuity Lab"
      descriptionOverride="Organization preferences and settings for Continuity Lab sessions"
      breadcrumb={[
        { label: "Settings", href: SETTINGS_INDEX_PATH },
        { label: "Continuity Lab" },
      ]}
    >
      <Link
        href={SETTINGS_INDEX_PATH}
        className="-mt-2 mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#F0EFE2]/50 transition hover:text-[#F0EFE2]/80"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to organization
      </Link>

      {saveState === "error" ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90">
          <span>
            Could not save to the server. Changes are kept locally until sync succeeds.
          </span>
          <button
            type="button"
            onClick={() => void retrySave()}
            className="inline-flex h-7 items-center rounded-md border border-amber-400/40 px-2.5 font-medium text-amber-50 hover:bg-amber-500/20"
          >
            Retry
          </button>
        </div>
      ) : saveState === "saving" ? (
        <p className="text-xs text-[#F0EFE2]/40">Saving…</p>
      ) : saveState === "saved" ? (
        <p className="text-xs text-emerald-300/90">Saved</p>
      ) : null}

      <SettingsCard
        title="Model & API keys"
        description="OpenRouter powers agent sessions. MemoryOS API keys are separate REST/MCP credentials."
      >
        <SettingsFlatPanel>
          <div className="flex flex-wrap items-center gap-2 px-3 py-3">
            <span
              className={cn(
                "rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                openRouterConnected
                  ? "bg-emerald-500/15 text-emerald-200"
                  : "bg-amber-500/15 text-amber-100",
              )}
            >
              {companyModelLoading
                ? "Checking…"
                : openRouterConnected
                  ? "OpenRouter connected"
                  : "OpenRouter not configured"}
            </span>
            {companyModel?.model && openRouterConnected ? (
              <span className="text-xs text-[#F0EFE2]/45">
                Default model: {companyModel.model.replace(/^openrouter\//, "")}
              </span>
            ) : null}
          </div>
          <SettingsRowLink
            href={MEMORYOS_API_KEYS_PATH}
            label="MemoryOS API keys"
            detail="REST and MCP tokens for your organization"
          />
          <SettingsRowLink
            href="/mission-control?tab=API%20Keys"
            label="Mission Control API keys"
            detail="Create and rotate keys outside Continuity Lab"
          />
          <SettingsRowLink
            href="/continuity-lab"
            label="Company model (OpenRouter)"
            detail="Paste your OpenRouter key and choose the default agent model"
            onClick={() => {
              void refreshCompanyModel().then(() => refreshCompanyModelSnapshot());
              openCompanyModelModal();
            }}
          />
        </SettingsFlatPanel>
      </SettingsCard>

      <SettingsCard title="Sessions">
        <SettingsFlatPanel>
          <SettingsFieldRow
            label="Secure mode"
            hint="Prevent native internet deployment in agent sandboxes"
          >
            <SettingsToggle
              label="Secure mode"
              checked={settings.secureMode}
              onChange={(next) => updateSettings({ secureMode: next })}
            />
          </SettingsFieldRow>
          <SettingsFieldRow
            label="Computer use"
            hint="Full computer use vs legacy browser-only tools"
          >
            <SettingsToggle
              label="Computer use"
              checked={settings.computerUse}
              onChange={(next) => updateSettings({ computerUse: next })}
            />
          </SettingsFieldRow>
        </SettingsFlatPanel>
      </SettingsCard>

      <SettingsCard title="Session agents">
        <SettingsFlatPanel>
          <SettingsFieldRow
            label="Default agent"
            hint={
              openRouterConnected
                ? "OpenRouter model applied when new agent sessions start"
                : "Save your Company Model (OpenRouter key + model) to enable presets"
            }
          >
            {openRouterConnected && agentOptions.length > 0 ? (
              <SettingsSelect<LabDefaultAgentId>
                value={coerceLabDefaultAgent(settings.defaultAgent, agentOptions)}
                onChange={(next) => updateSettings({ defaultAgent: next })}
                options={agentOptions.map((o) => ({ value: o.value, label: o.label }))}
              />
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-[#F0EFE2]/55">
                  Configure an OpenRouter API key and model before choosing a default agent profile.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void refreshCompanyModel().then(() => refreshCompanyModelSnapshot());
                      openCompanyModelModal();
                    }}
                    className="inline-flex h-9 items-center rounded-md bg-white px-3.5 text-sm font-medium text-[#0A0A0A] hover:bg-white/90"
                  >
                    Configure Company Model
                  </button>
                  <Link
                    href={MEMORYOS_API_KEYS_PATH}
                    className="inline-flex h-9 items-center rounded-md border border-white/[0.12] px-3.5 text-sm font-medium text-[#F0EFE2]/80 hover:bg-white/[0.06]"
                  >
                    API Keys settings
                  </Link>
                </div>
              </div>
            )}
          </SettingsFieldRow>
          <SettingsFieldRow
            label="Default platform"
            hint="Operating system for new sandbox sessions"
          >
            <div className="space-y-2">
              <SettingsOsOption
                os="ubuntu"
                label="Ubuntu"
                selected={settings.defaultPlatform === "ubuntu"}
                onSelect={() => updateSettings({ defaultPlatform: "ubuntu" as LabDefaultPlatform })}
              />
              <SettingsOsOption
                os="windows"
                label="Windows"
                selected={settings.defaultPlatform === "windows"}
                onSelect={() => updateSettings({ defaultPlatform: "windows" as LabDefaultPlatform })}
              />
            </div>
          </SettingsFieldRow>
        </SettingsFlatPanel>
      </SettingsCard>

      <SettingsCard
        title="Commands"
        actions={
          <div className="flex gap-2">
            <SettingsSecondaryButton onClick={() => void resetCommands()}>
              <RotateCcw className="mr-1.5 size-3.5" aria-hidden />
              Reset
            </SettingsSecondaryButton>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-white px-3.5 text-sm font-medium text-[#0A0A0A] hover:bg-white/90"
            >
              <Plus className="size-3.5" aria-hidden />
              Add Command
            </button>
          </div>
        }
      >
        <SettingsFlatPanel className="px-0">
          {commands.map((cmd) => (
            <SlashCommandRow key={cmd.id} command={cmd} />
          ))}
        </SettingsFlatPanel>
      </SettingsCard>

      <SettingsCard title="Usage limits">
        <SettingsFlatPanel>
          <SettingsFieldRow
            label="Batch limit"
            hint="Maximum parallel operations per batch (1–500)"
          >
            <input
              type="number"
              min={1}
              max={500}
              value={settings.batchLimit}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (!Number.isFinite(n)) return;
                updateSettings({ batchLimit: Math.min(500, Math.max(1, Math.round(n))) });
              }}
              className={cn(inputClass, "max-w-[120px]")}
            />
          </SettingsFieldRow>
          <SettingsFieldRow
            label="Message usage limit"
            hint="Monthly spend cap in USD (optional)"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-[#F0EFE2]/50">$</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={usageLimitDraft}
                onChange={(e) => setUsageLimitDraft(e.target.value)}
                placeholder="No limit"
                className={cn(inputClass, "max-w-[140px]")}
              />
              <SettingsSecondaryButton onClick={() => void updateUsageLimit()}>
                Update
              </SettingsSecondaryButton>
            </div>
            {usageLimitMsg ? (
              <p className="mt-2 text-xs text-[#F0EFE2]/45">{usageLimitMsg}</p>
            ) : null}
          </SettingsFieldRow>
        </SettingsFlatPanel>
      </SettingsCard>

      <SettingsCard title="Pull Requests">
        <SettingsFlatPanel>
          <SettingsFieldRow
            label="Share prompts in PRs"
            hint="Include agent prompts in pull request comments"
          >
            <SettingsToggle
              label="Share prompts in PRs"
              checked={settings.sharePromptsInPrs}
              onChange={(next) => updateSettings({ sharePromptsInPrs: next })}
            />
          </SettingsFieldRow>
          <SettingsFieldRow
            label="Require @MemoryOS to respond"
            hint="Only respond when mentioned on pull requests"
          >
            <SettingsToggle
              label="Require @MemoryOS to respond"
              checked={settings.requireMemoryosToRespond}
              onChange={(next) => updateSettings({ requireMemoryosToRespond: next })}
            />
          </SettingsFieldRow>
          <SettingsFieldRow
            label="Auto-add reviewer"
            hint="Automatically request review from MemoryOS on new PRs"
          >
            <SettingsToggle
              label="Auto-add reviewer"
              checked={settings.autoAddReviewer}
              onChange={(next) => updateSettings({ autoAddReviewer: next })}
            />
          </SettingsFieldRow>
          <SettingsFieldRow
            label="Open PRs as"
            hint={githubConnected ? "Author for pull requests opened by the agent" : "Connect GitHub to enable User-authored PRs"}
          >
            <SettingsSelect<LabOpenPrsAs>
              value={settings.openPrsAs}
              onChange={(next) => updateSettings({ openPrsAs: next })}
              options={openPrOptions}
              disabled={!githubConnected && settings.openPrsAs === "user"}
            />
          </SettingsFieldRow>
          <SettingsFieldRow
            label="Responding to bots"
            hint="Which bot accounts MemoryOS should reply to on PRs"
          >
            <SettingsSelect<LabRespondingToBots>
              value={settings.respondingToBots}
              onChange={(next) => updateSettings({ respondingToBots: next })}
              options={[
                { value: "all", label: "All bots" },
                { value: "selected", label: "Selected only" },
                { value: "none", label: "No bots" },
              ]}
            />
          </SettingsFieldRow>
        </SettingsFlatPanel>
      </SettingsCard>

      {modalOpen ? (
        <CreateSlashCommandModal
          onClose={() => setModalOpen(false)}
          onCreate={createCommand}
        />
      ) : null}
    </ContinuityLabSettingsSectionFrame>
  );
}
