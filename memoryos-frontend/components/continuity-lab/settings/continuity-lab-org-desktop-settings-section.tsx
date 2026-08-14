"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useOrganization } from "@clerk/nextjs";
import { ArrowLeft, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { ContinuityLabSettingsSectionFrame } from "@/components/continuity-lab/settings/continuity-lab-settings-shell";
import {
  SettingsCard,
  SettingsCopyValue,
  SettingsFieldRow,
  SettingsFlatPanel,
  SettingsRowLink,
  SettingsSecondaryButton,
  SettingsToggle,
} from "@/components/continuity-lab/settings/continuity-lab-settings-ui";
import {
  fetchLabDesktopSettingsFromApi,
  loadLabDesktopSettingsHybrid,
  loadLabDesktopSettingsLocalFallback,
  patchLabDesktopSettingsToApi,
  saveLabDesktopProviderKeyToApi,
} from "@/lib/continuity-lab/lab-desktop-settings-api";
import {
  LAB_DESKTOP_SETTINGS_CHANGED_EVENT,
  type LabDesktopSettingsChangedDetail,
} from "@/lib/continuity-lab/lab-desktop-settings-events";
import {
  readLabDesktopSettings,
  saveLabDesktopSettings,
  type LabDesktopSettings,
  type ModelProviderKeyId,
} from "@/lib/continuity-lab/lab-desktop-settings-storage";
import { SETTINGS_INDEX_PATH } from "@/lib/continuity-lab/settings-nav";
import { cn } from "@/lib/utils";

const SAVE_DEBOUNCE_MS = 450;

const MEMORYOS_GITHUB_URL = "https://github.com/Sunilkumarchavhan9/MemoryOS";
const CURSOR_MARKETPLACE_SEARCH_URL = "https://cursor.com/marketplace?search=memoryos";
const VSCODE_MARKETPLACE_SEARCH_URL =
  "https://marketplace.visualstudio.com/search?term=memoryos&target=VSCode&category=All%20categories&sortBy=Relevance";

const PARTNERSHIP_PITCH =
  "MemoryOS gives your IDE or agent stack durable company memory — ingest context once, retrieve it across MCP, REST, and Continuity Lab sandbox sessions. Interested in partnering on an integration?";

const PARTNERSHIP_MAILTO = `mailto:partnerships@memoryos.dev?subject=${encodeURIComponent("MemoryOS integration partnership")}&body=${encodeURIComponent(`${PARTNERSHIP_PITCH}\n\n`)}`;

const inputClass =
  "h-9 w-full rounded-md border border-white/[0.08] bg-[#111111] px-3 font-mono text-sm text-white placeholder:text-white/35 focus:border-white/20 focus:outline-none";

type ProviderKeyDraft = Record<ModelProviderKeyId, string>;

const EMPTY_DRAFTS: ProviderKeyDraft = {
  anthropic: "",
  openrouter: "",
};

function isPlausibleAnthropicKey(key: string): boolean {
  const trimmed = key.trim();
  return trimmed.length >= 20 && trimmed.startsWith("sk-ant-") && !/\s/.test(trimmed);
}

function isPlausibleOpenRouterKey(key: string): boolean {
  const trimmed = key.trim();
  return trimmed.length >= 20 && trimmed.startsWith("sk-or-") && !/\s/.test(trimmed);
}

export function ContinuityLabOrgDesktopSettingsSection() {
  const { organization } = useOrganization();
  const orgId = organization?.id?.trim() ?? "";

  const [settings, setSettings] = useState<LabDesktopSettings>(readLabDesktopSettings);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [keysExpanded, setKeysExpanded] = useState(false);
  const [keyDrafts, setKeyDrafts] = useState<ProviderKeyDraft>(EMPTY_DRAFTS);
  const [keySaveState, setKeySaveState] = useState<
    Partial<Record<ModelProviderKeyId, "idle" | "saving" | "saved" | "error">>
  >({});
  const [keyErrors, setKeyErrors] = useState<Partial<Record<ModelProviderKeyId, string>>>({});
  const [partnershipExpanded, setPartnershipExpanded] = useState(false);
  const [pitchCopied, setPitchCopied] = useState(false);

  const skipNextSaveRef = useRef(true);
  const saveTimerRef = useRef<number | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const applyRemote = useCallback((next: LabDesktopSettings) => {
    skipNextSaveRef.current = true;
    setSettings(next);
    saveLabDesktopSettings(next, { broadcast: false });
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const remote = await loadLabDesktopSettingsHybrid();
      if (cancelled) return;
      if (remote) {
        applyRemote(remote.settings);
      } else {
        const local = loadLabDesktopSettingsLocalFallback(orgId);
        applyRemote(local.settings);
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [orgId, applyRemote]);

  useEffect(() => {
    function onChanged(event: Event) {
      const detail = (event as CustomEvent<LabDesktopSettingsChangedDetail>).detail;
      if (!detail?.settings) return;
      if (detail.orgId && orgId && detail.orgId !== orgId) return;
      applyRemote(detail.settings);
    }
    window.addEventListener(LAB_DESKTOP_SETTINGS_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(LAB_DESKTOP_SETTINGS_CHANGED_EVENT, onChanged);
  }, [orgId, applyRemote]);

  const persistTelemetry = useCallback(async (disableTelemetry: boolean) => {
    setSaveState("saving");
    const saved = await patchLabDesktopSettingsToApi({ disableTelemetry });
    if (saved) {
      applyRemote(saved.settings);
      const refreshed = await fetchLabDesktopSettingsFromApi();
      if (refreshed) applyRemote(refreshed.settings);
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 2000);
      return;
    }
    setSaveState("error");
  }, [applyRemote]);

  useEffect(() => {
    if (!loaded) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      void persistTelemetry(settingsRef.current.disableTelemetry);
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [settings.disableTelemetry, loaded, persistTelemetry]);

  function updateTelemetry(next: boolean) {
    const merged = saveLabDesktopSettings({ disableTelemetry: next });
    setSettings(merged);
  }

  async function saveProviderKey(provider: ModelProviderKeyId) {
    const draft = keyDrafts[provider].trim();
    setKeyErrors((prev) => ({ ...prev, [provider]: undefined }));

    if (!draft) {
      setKeyErrors((prev) => ({
        ...prev,
        [provider]: "Paste an API key before saving.",
      }));
      return;
    }

    if (provider === "anthropic" && !isPlausibleAnthropicKey(draft)) {
      setKeyErrors((prev) => ({
        ...prev,
        [provider]: "Key should start with sk-ant- (from console.anthropic.com).",
      }));
      return;
    }

    if (provider === "openrouter" && !isPlausibleOpenRouterKey(draft)) {
      setKeyErrors((prev) => ({
        ...prev,
        [provider]: "Key should start with sk-or- (from openrouter.ai/keys).",
      }));
      return;
    }

    setKeySaveState((prev) => ({ ...prev, [provider]: "saving" }));
    const saved = await saveLabDesktopProviderKeyToApi(provider, draft);
    if (saved) {
      applyRemote(saved.settings);
      setKeyDrafts((prev) => ({ ...prev, [provider]: "" }));
      setKeySaveState((prev) => ({ ...prev, [provider]: "saved" }));
      window.setTimeout(
        () => setKeySaveState((prev) => ({ ...prev, [provider]: "idle" })),
        2500,
      );
      return;
    }
    setKeySaveState((prev) => ({ ...prev, [provider]: "error" }));
  }

  const anthropicConfigured = settings.modelProviderKeys.anthropic?.configured === true;
  const openRouterConfigured = settings.modelProviderKeys.openrouter?.configured === true;

  async function copyPartnershipPitch() {
    try {
      await navigator.clipboard.writeText(PARTNERSHIP_PITCH);
      setPitchCopied(true);
      window.setTimeout(() => setPitchCopied(false), 2000);
    } catch {
      setPitchCopied(false);
    }
  }

  return (
    <ContinuityLabSettingsSectionFrame
      sectionId="memoryos-desktop"
      titleOverride="MemoryOS Desktop"
      descriptionOverride="Manage API keys and privacy settings for MemoryOS Desktop."
      breadcrumb={[
        { label: "Settings", href: SETTINGS_INDEX_PATH },
        { label: "MemoryOS Desktop" },
      ]}
    >
      <Link
        href={SETTINGS_INDEX_PATH}
        className="-mt-2 mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-white/50 transition hover:text-white/80"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to organization
      </Link>

      {saveState === "error" ? (
        <p className="text-xs text-amber-200/90">
          Could not save telemetry preference to the server. Your choice is kept locally until sync
          succeeds.
        </p>
      ) : saveState === "saving" ? (
        <p className="text-xs text-white/40">Saving…</p>
      ) : saveState === "saved" ? (
        <p className="text-xs text-emerald-300/90">Saved</p>
      ) : null}

      <SettingsCard
        title="Connect your IDE"
        description="Wire MemoryOS into your editor or agent stack via MCP, REST API, or the Continuity Lab sandbox."
      >
        <SettingsFlatPanel className="px-1 py-1">
          <SettingsRowLink href="/continuity-lab" label="Open Continuity Lab" />
          <SettingsRowLink
            href="/continuity-lab/settings/connections"
            label="Organization connections"
            detail="GitHub, Slack, Jira, and MCP servers for your org"
          />
          <SettingsRowLink
            href="/continuity-lab/settings/memoryos-api"
            label="MemoryOS API"
            detail="REST tokens and MCP configuration"
          />
          <SettingsRowLink
            href={CURSOR_MARKETPLACE_SEARCH_URL}
            label="Cursor extension"
            detail="Extension listing — coming soon"
            external
          />
          <SettingsRowLink
            href={VSCODE_MARKETPLACE_SEARCH_URL}
            label="VS Code extension"
            detail="Extension listing — coming soon"
            external
          />
          <SettingsRowLink
            href={MEMORYOS_GITHUB_URL}
            label="GitHub repository"
            detail="SDK, MCP server, and integration examples"
            external
          />
        </SettingsFlatPanel>
      </SettingsCard>

      <SettingsCard title="Usage">
        <SettingsFlatPanel>
          <div className="flex flex-col gap-3 border-b border-white/[0.06] px-3 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">Account activity</p>
              <p className="mt-0.5 text-xs text-white/45">
                Usage metering for MemoryOS Desktop is not live yet — the usage page is a preview.
              </p>
            </div>
            <Link
              href="/continuity-lab/settings/usage"
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-white/[0.12] bg-white/[0.04] px-3.5 text-sm font-medium text-white/90 transition hover:bg-white/[0.08]"
            >
              View usage
              <ExternalLink className="size-3.5 text-white/50" aria-hidden />
            </Link>
          </div>
        </SettingsFlatPanel>
      </SettingsCard>

      <SettingsCard title="Analytics and compliance">
        <SettingsFlatPanel>
          <SettingsFieldRow
            label="Disable telemetry"
            hint="When enabled, MemoryOS Desktop will not send anonymous usage or crash reports. Product analytics in Continuity Lab are unaffected."
          >
            <SettingsToggle
              label="Disable telemetry"
              checked={settings.disableTelemetry}
              onChange={updateTelemetry}
              disabled={!loaded}
            />
          </SettingsFieldRow>
        </SettingsFlatPanel>
        <p className="mt-2 text-[11px] text-white/35">
          Stub: the desktop client does not ship yet — this preference is stored for your organization
          and will apply when MemoryOS Desktop connects.
        </p>
      </SettingsCard>

      <div className="border-t border-white/[0.06] pt-4">
        <button
          type="button"
          onClick={() => setKeysExpanded((prev) => !prev)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-white/70 transition hover:text-white"
          aria-expanded={keysExpanded}
        >
          {keysExpanded ? (
            <ChevronDown className="size-4 text-white/45" aria-hidden />
          ) : (
            <ChevronRight className="size-4 text-white/45" aria-hidden />
          )}
          Model provider API keys
        </button>

        {keysExpanded ? (
          <div className="mt-4 space-y-4">
            <ProviderKeyCard
              title="Anthropic"
              description="Direct Claude access for MemoryOS Desktop sessions. Keys are stored per organization and never returned after save."
              placeholder="sk-ant-..."
              configured={anthropicConfigured}
              masked={settings.modelProviderKeys.anthropic?.masked}
              value={keyDrafts.anthropic}
              onChange={(value) => setKeyDrafts((prev) => ({ ...prev, anthropic: value }))}
              onSave={() => void saveProviderKey("anthropic")}
              saveState={keySaveState.anthropic ?? "idle"}
              error={keyErrors.anthropic}
            />

            <ProviderKeyCard
              title="OpenRouter"
              description="Optional fallback routing through OpenRouter. Continuity Lab sessions still use Company Model for OpenRouter."
              placeholder="sk-or-v1-..."
              configured={openRouterConfigured}
              masked={settings.modelProviderKeys.openrouter?.masked}
              value={keyDrafts.openrouter}
              onChange={(value) => setKeyDrafts((prev) => ({ ...prev, openrouter: value }))}
              onSave={() => void saveProviderKey("openrouter")}
              saveState={keySaveState.openrouter ?? "idle"}
              error={keyErrors.openrouter}
            />

            <p className="text-[11px] text-white/35">
              OpenAI and other providers will appear here as MemoryOS Desktop adds native routing.
            </p>
          </div>
        ) : null}
      </div>

      <div className="border-t border-white/[0.06] pt-4">
        <button
          type="button"
          onClick={() => setPartnershipExpanded((prev) => !prev)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-white/70 transition hover:text-white"
          aria-expanded={partnershipExpanded}
        >
          {partnershipExpanded ? (
            <ChevronDown className="size-4 text-white/45" aria-hidden />
          ) : (
            <ChevronRight className="size-4 text-white/45" aria-hidden />
          )}
          Share your integration
        </button>

        {partnershipExpanded ? (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-white/45">
              Building a plugin, MCP server, or IDE extension? Copy this one-liner for outreach or
              open a partnership email draft.
            </p>
            <SettingsCopyValue
              value={PARTNERSHIP_PITCH}
              onCopy={() => void copyPartnershipPitch()}
              copied={pitchCopied}
              ariaLabel="Copy partnership pitch"
            />
            <a
              href={PARTNERSHIP_MAILTO}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-white/[0.12] bg-white/[0.04] px-3.5 text-sm font-medium text-white/90 transition hover:bg-white/[0.08]"
            >
              Email partnership inquiry
              <ExternalLink className="size-3.5 text-white/50" aria-hidden />
            </a>
            <p className="text-[11px] text-white/35">
              partnerships@memoryos.dev is a placeholder until a live inbox is published — adjust
              before sending.
            </p>
          </div>
        ) : null}
      </div>
    </ContinuityLabSettingsSectionFrame>
  );
}

function ProviderKeyCard({
  title,
  description,
  placeholder,
  configured,
  masked,
  value,
  onChange,
  onSave,
  saveState,
  error,
}: {
  title: string;
  description: string;
  placeholder: string;
  configured: boolean;
  masked?: string;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  saveState: "idle" | "saving" | "saved" | "error";
  error?: string;
}) {
  return (
    <div className={cn("rounded-md border border-white/[0.08] bg-[#111111] p-4")}>
      <div className="mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {configured ? (
            <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
              Key saved
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-white/45">{description}</p>
        {configured && masked ? (
          <p className="mt-2 font-mono text-xs text-white/55">Stored: {masked}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="password"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
          aria-label={`${title} API key`}
        />
        <SettingsSecondaryButton onClick={onSave} disabled={saveState === "saving"}>
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Save"}
        </SettingsSecondaryButton>
      </div>

      {error ? <p className="mt-2 text-xs text-amber-200/90">{error}</p> : null}
      {saveState === "error" ? (
        <p className="mt-2 text-xs text-amber-200/90">
          Could not save key. Check organization context and try again.
        </p>
      ) : null}
    </div>
  );
}
