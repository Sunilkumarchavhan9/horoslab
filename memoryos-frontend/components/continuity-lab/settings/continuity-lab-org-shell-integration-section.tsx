"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Check, Copy, RefreshCw, Shield, Terminal } from "lucide-react";
import { ContinuityLabSettingsSectionFrame } from "@/components/continuity-lab/settings/continuity-lab-settings-shell";
import {
  SettingsCard,
  SettingsCopyValue,
  SettingsFieldRow,
  SettingsFlatPanel,
  SettingsSecondaryButton,
  SettingsToggle,
} from "@/components/continuity-lab/settings/continuity-lab-settings-ui";
import {
  DEVIN_SHELL_BEHAVIOR_POINTS,
  DEVIN_SHELL_HOOKS,
  DEVIN_SHELL_SUPPORTED_ENVIRONMENT,
  DEVIN_SHELL_UNSUPPORTED_ENVIRONMENT,
} from "@/lib/continuity-lab/devin-shell-integration";
import {
  defaultLabShellIntegrationSettings,
  fetchLabShellIntegrationSettingsFromApi,
  patchLabShellIntegrationSettingsToApi,
  type LabShellIntegrationSettings,
} from "@/lib/continuity-lab/lab-shell-integration-settings-api";
import { SETTINGS_INDEX_PATH } from "@/lib/continuity-lab/settings-nav";
import { cn } from "@/lib/utils";

type SaveState = "idle" | "loading" | "saving" | "saved" | "error";

function buildShellConfigPreview(settings: LabShellIntegrationSettings): string {
  return JSON.stringify(
    {
      shell: {
        keybinding_trigger: settings.keybindingTrigger,
        enable_comments: settings.enableComments,
      },
    },
    null,
    2,
  );
}

function buildBackendSnapshot(settings: LabShellIntegrationSettings, orgId: string, updatedAt: string | null): string {
  return JSON.stringify(
    {
      orgId,
      updatedAt,
      ...settings,
    },
    null,
    2,
  );
}

function copyText(text: string) {
  return navigator.clipboard.writeText(text);
}

function CodeBlock({
  title,
  description,
  code,
}: {
  title: string;
  description?: string;
  code: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await copyText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="rounded-md border border-white/[0.08] bg-[#101010]">
      <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-4 py-3">
        <div>
          <p className="text-sm font-medium text-[#F0EFE2]">{title}</p>
          {description ? <p className="mt-0.5 text-xs text-[#F0EFE2]/45">{description}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-[#F0EFE2]/75 transition hover:bg-white/[0.08]"
        >
          {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-4 font-mono text-xs leading-relaxed text-[#F0EFE2]/80">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Pill({ children }: { children: string }) {
  return (
    <span className="inline-flex rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-[#F0EFE2]/70">
      {children}
    </span>
  );
}

export function ContinuityLabOrgShellIntegrationSection() {
  const [settings, setSettings] = useState<LabShellIntegrationSettings>(
    defaultLabShellIntegrationSettings,
  );
  const [orgId, setOrgId] = useState<string>("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const response = await fetchLabShellIntegrationSettingsFromApi();
      if (cancelled) return;
      if (response) {
        setOrgId(response.orgId);
        setSettings(response.settings);
        setUpdatedAt(response.updatedAt ?? null);
        setError(null);
        setSaveState("idle");
      } else {
        setError("Could not load shell integration settings from backend.");
        setSaveState("error");
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const supportedPills = useMemo(
    () => DEVIN_SHELL_SUPPORTED_ENVIRONMENT.map((item) => <Pill key={item}>{item}</Pill>),
    [],
  );
  const unsupportedPills = useMemo(
    () => DEVIN_SHELL_UNSUPPORTED_ENVIRONMENT.map((item) => <Pill key={item}>{item}</Pill>),
    [],
  );

  const shellConfigPreview = useMemo(() => buildShellConfigPreview(settings), [settings]);
  const backendSnapshotPreview = useMemo(
    () => buildBackendSnapshot(settings, orgId, updatedAt),
    [settings, orgId, updatedAt],
  );
  const enabledShellCount = useMemo(
    () => Object.values(settings.enabledShells).filter(Boolean).length,
    [settings.enabledShells],
  );

  const isActive = settings.enabled && enabledShellCount > 0;

  async function persist(next: LabShellIntegrationSettings) {
    setSaveState("saving");
    setError(null);
    const saved = await patchLabShellIntegrationSettingsToApi(next);
    if (!saved) {
      setSaveState("error");
      setError("Could not save shell integration settings to the backend.");
      return;
    }
    setOrgId(saved.orgId);
    setSettings(saved.settings);
    setUpdatedAt(saved.updatedAt ?? null);
    setSaveState("saved");
    window.setTimeout(() => setSaveState("idle"), 2000);
  }

  async function handleReset() {
    await persist(defaultLabShellIntegrationSettings());
  }

  function updateSettings(patch: Partial<LabShellIntegrationSettings>) {
    setSettings((current) => ({
      ...current,
      ...patch,
      enabledShells: patch.enabledShells
        ? {
            ...current.enabledShells,
            ...patch.enabledShells,
          }
        : current.enabledShells,
    }));
  }

  return (
    <ContinuityLabSettingsSectionFrame
      sectionId="shell-integration"
      titleOverride="Shell integration"
      descriptionOverride="MemoryOSTM terminal setup, keybindings, and lifecycle hooks."
      docHref="https://docs.devin.ai/cli/shell-integration"
      docLabel="Open shell reference docs"
      breadcrumb={[
        { label: "Settings", href: SETTINGS_INDEX_PATH },
        { label: "Shell integration" },
      ]}
    >
      <Link
        href={SETTINGS_INDEX_PATH}
        className="-mt-2 mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#F0EFE2]/50 transition hover:text-[#F0EFE2]/80"
      >
        Back to organization
      </Link>

      <SettingsCard
        title="Backend status"
        description="This panel reads and writes live org-scoped shell integration settings."
        actions={
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
                isActive
                  ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
                  : "border-white/[0.08] bg-white/[0.03] text-[#F0EFE2]/55",
              )}
            >
              {isActive ? "Active" : "Waiting"}
            </span>
            <span className="inline-flex rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-[#F0EFE2]/65">
              {enabledShellCount} shell{enabledShellCount === 1 ? "" : "s"}
            </span>
          </div>
        }
      >
        <SettingsFlatPanel className="space-y-1 px-4 py-4">
          <div className="flex flex-wrap gap-2 text-xs text-[#F0EFE2]/40">
            <Pill>{settings.installCommand}</Pill>
            <Pill>{settings.configPath}</Pill>
            <Pill>{settings.hooksPath}</Pill>
            <Pill>{settings.keybindingTrigger}</Pill>
          </div>
          <p className="text-xs text-[#F0EFE2]/40">
            {loaded
              ? error ?? (updatedAt ? `Last updated ${new Date(updatedAt).toLocaleString()}` : "Ready")
              : "Loading from backend..."}
          </p>
        </SettingsFlatPanel>
      </SettingsCard>

      <SettingsCard
        title="Install MemoryOSTM shell integration"
        description="Run the MemoryOSTM shell bridge inside a supported terminal, then let the shell feed MemoryOSTM the current line and recent command history."
      >
        <SettingsFlatPanel className="px-1 py-1">
          <SettingsFieldRow
            label="Setup command"
            hint="Run this in Bash, Zsh, or Fish on macOS, Linux, or WSL."
          >
            <SettingsCopyValue
              value={settings.installCommand}
              onCopy={() => copyText(settings.installCommand)}
              ariaLabel="Copy shell setup command"
            />
          </SettingsFieldRow>
          <SettingsFieldRow
            label="Config file"
            hint="The shell config lives in your local MemoryOSTM config and should be reloaded after changes."
          >
            <SettingsCopyValue
              value={settings.configPath}
              onCopy={() => copyText(settings.configPath)}
              ariaLabel="Copy shell config path"
            />
          </SettingsFieldRow>
          <SettingsFieldRow
            label="Hooks file"
            hint="Lifecycle hooks are configured in MemoryOSTM's hooks manifest."
          >
            <SettingsCopyValue
              value={settings.hooksPath}
              onCopy={() => copyText(settings.hooksPath)}
              ariaLabel="Copy hooks file path"
            />
          </SettingsFieldRow>
          <SettingsFieldRow label="Supported environments" hint="Shell integration is available in these terminals.">
            <div className="flex flex-wrap gap-2">{supportedPills}</div>
          </SettingsFieldRow>
          <SettingsFieldRow label="Not supported" hint="These shells do not get MemoryOSTM shell integration.">
            <div className="flex flex-wrap gap-2">{unsupportedPills}</div>
          </SettingsFieldRow>
        </SettingsFlatPanel>
      </SettingsCard>

      <SettingsCard
        title="Live shell controls"
        description="These settings are saved to the backend and drive the live MemoryOSTM shell integration state."
        actions={
          <div className="flex items-center gap-2">
            <SettingsSecondaryButton onClick={() => void handleReset()}>
              Reset defaults
            </SettingsSecondaryButton>
            <button
              type="button"
              onClick={() => void persist(settings)}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#2563EB] px-3.5 text-sm font-medium text-[#F0EFE2] transition hover:bg-[#3B82F6]"
            >
              {saveState === "saving" ? (
                <RefreshCw className="size-3.5 animate-spin" aria-hidden />
              ) : null}
              {saveState === "saving" ? "Saving..." : "Save changes"}
            </button>
          </div>
        }
      >
        <SettingsFlatPanel className="px-1 py-1">
          <SettingsFieldRow
            label="Enable shell integration"
            hint="Turns on the MemoryOSTM terminal integration for this organization."
          >
            <SettingsToggle
              checked={settings.enabled}
              onChange={(next) => updateSettings({ enabled: next })}
              label="Enable shell integration"
            />
          </SettingsFieldRow>
          <SettingsFieldRow
            label="Enable comment prompts"
            hint="Allows Zsh comment syntax to submit a prompt, matching the shell integration behavior."
          >
            <SettingsToggle
              checked={settings.enableComments}
              onChange={(next) => updateSettings({ enableComments: next })}
              label="Enable comment prompts"
            />
          </SettingsFieldRow>
          <SettingsFieldRow
            label="Bash"
            hint="Allow setup for Bash terminals."
          >
            <SettingsToggle
              checked={settings.enabledShells.bash}
              onChange={(next) =>
                updateSettings({
                  enabledShells: { ...settings.enabledShells, bash: next },
                })
              }
              label="Enable Bash"
            />
          </SettingsFieldRow>
          <SettingsFieldRow
            label="Zsh"
            hint="Allow setup for Zsh terminals."
          >
            <SettingsToggle
              checked={settings.enabledShells.zsh}
              onChange={(next) =>
                updateSettings({
                  enabledShells: { ...settings.enabledShells, zsh: next },
                })
              }
              label="Enable Zsh"
            />
          </SettingsFieldRow>
          <SettingsFieldRow
            label="Fish"
            hint="Allow setup for Fish terminals."
          >
            <SettingsToggle
              checked={settings.enabledShells.fish}
              onChange={(next) =>
                updateSettings({
                  enabledShells: { ...settings.enabledShells, fish: next },
                })
              }
              label="Enable Fish"
            />
          </SettingsFieldRow>
        </SettingsFlatPanel>
      </SettingsCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SettingsCard
          title="Shell config preview"
          description="This matches the MemoryOSTM shell config shape, rendered from the live backend-backed settings."
        >
          <CodeBlock
            title="config.json"
            description="Live MemoryOSTM shell config values."
            code={shellConfigPreview}
          />
        </SettingsCard>

        <SettingsCard
          title="Backend snapshot"
          description="The current org-scoped shell integration payload stored by MemoryOSTM."
        >
          <CodeBlock title="live state" description="Real backend payload." code={backendSnapshotPreview} />
        </SettingsCard>
      </div>

      <SettingsCard
        title="Lifecycle hooks"
        description="Hooks live in .memoryostm/hooks.v1.json and use shell lifecycle events to enforce policy, add context, and record outcomes."
      >
        <div className="grid gap-3 md:grid-cols-2">
          {DEVIN_SHELL_HOOKS.map((hook) => (
            <div
              key={hook.event}
              className="rounded-md border border-white/[0.08] bg-[#101010] px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[#F0EFE2]">{hook.title}</p>
                  <p className="mt-0.5 text-xs text-[#F0EFE2]/45">{hook.description}</p>
                </div>
                <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F0EFE2]/55">
                  {hook.event}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {hook.inputFields.map((field) => (
                  <span
                    key={field}
                    className="inline-flex rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-[#F0EFE2]/65"
                  >
                    {field}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SettingsCard>

      <SettingsCard
        title="What MemoryOSTM reads"
        description="This is the behavior MemoryOSTM preserves when the shell integration is active."
      >
        <SettingsFlatPanel className="space-y-3 px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-medium text-[#F0EFE2]">
            <Terminal className="size-4 text-[#F0EFE2]/55" aria-hidden />
            Shell behavior
          </div>
          <ul className="space-y-2 text-sm text-[#F0EFE2]/60">
            {DEVIN_SHELL_BEHAVIOR_POINTS.map((point) => (
              <li key={point} className="flex gap-2">
                <span className="mt-1.5 size-1.5 rounded-full bg-white/35" aria-hidden />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-100/85">
            PowerShell and CMD are not supported for shell integration. Use a supported shell so
            MemoryOSTM can hook into command history and prompt submission.
          </div>
        </SettingsFlatPanel>
      </SettingsCard>

      <SettingsCard
        title="Where this fits in MemoryOSTM"
        description="Keep the shell integration outside the in-app session shell panel so the terminal setup stays focused and docs-aligned."
      >
        <SettingsFlatPanel className="space-y-2 px-4 py-4">
          <div className="flex items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-[#F0EFE2]/80">
            <Shield className="size-3.5 text-[#F0EFE2]/30" aria-hidden />
            This page is the terminal-side MemoryOSTM layer. The in-app session shell panel stays unchanged.
          </div>
          <Link
            href="/continuity-lab/settings/connections"
            className="block rounded-md px-3 py-2.5 text-sm text-[#F0EFE2]/85 transition hover:bg-white/[0.04]"
          >
            <span className="block font-medium text-[#F0EFE2]">Organization connections</span>
            <span className="mt-0.5 block text-xs text-[#F0EFE2]/45">
              Wire GitHub, Slack, Jira, and MCP before connecting terminal hooks.
            </span>
          </Link>
          <Link
            href="/continuity-lab/settings/memoryos-api"
            className="block rounded-md px-3 py-2.5 text-sm text-[#F0EFE2]/85 transition hover:bg-white/[0.04]"
          >
            <span className="block font-medium text-[#F0EFE2]">MemoryOS API</span>
            <span className="mt-0.5 block text-xs text-[#F0EFE2]/45">
              Persist shell-derived context into Company Brain later.
            </span>
          </Link>
        </SettingsFlatPanel>
      </SettingsCard>
    </ContinuityLabSettingsSectionFrame>
  );
}
