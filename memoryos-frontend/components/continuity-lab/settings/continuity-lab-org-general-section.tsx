"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useOrganization } from "@clerk/nextjs";
import { ArrowLeft, Pencil } from "lucide-react";
import {
  ContinuityLabSettingsSectionFrame,
} from "@/components/continuity-lab/settings/continuity-lab-settings-shell";
import {
  SettingsCard,
  SettingsCopyValue,
  SettingsFieldRow,
  SettingsFlatPanel,
  SettingsToggle,
} from "@/components/continuity-lab/settings/continuity-lab-settings-ui";
import {
  fetchLabOrgSettingsFromApi,
  loadLabOrgSettingsHybrid,
  loadLabOrgSettingsLocalFallback,
  patchLabOrgSettingsToApi,
} from "@/lib/continuity-lab/lab-org-settings-api";
import {
  readLabOrgSettings,
  saveLabOrgSettings,
  type LabOrgSettings,
} from "@/lib/continuity-lab/lab-org-settings-storage";
import {
  readActiveOrganizationId,
  readDevConsoleOrgDisplayName,
  writeDevConsoleOrgDisplayName,
} from "@/lib/continuity-lab/settings-org";

const SAVE_DEBOUNCE_MS = 450;

export function ContinuityLabOrgGeneralSection() {
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const [orgId, setOrgId] = useState("");
  const [settings, setSettings] = useState<LabOrgSettings>(readLabOrgSettings);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [copiedOrgId, setCopiedOrgId] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const skipNextSaveRef = useRef(true);
  const saveTimerRef = useRef<number | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const clerkOrgId = organization?.id?.trim() ?? "";
  const clerkOrgName = organization?.name?.trim() ?? "";
  const fallbackOrgName =
    clerkOrgName || readDevConsoleOrgDisplayName() || "Your organization";
  const displayOrgName = settings.organizationName.trim() || fallbackOrgName;
  const orgIdDisplay = orgId || clerkOrgId || readActiveOrganizationId() || "—";

  useEffect(() => {
    let cancelled = false;
    const localOrgId = clerkOrgId || readActiveOrganizationId();
    void (async () => {
      const remote = await loadLabOrgSettingsHybrid();
      if (cancelled) return;
      if (remote) {
        skipNextSaveRef.current = true;
        setOrgId(remote.orgId || localOrgId || "");
        setSettings(remote.settings);
      } else {
        const local = loadLabOrgSettingsLocalFallback(localOrgId);
        skipNextSaveRef.current = true;
        setOrgId(local.orgId || localOrgId || "");
        setSettings(local.settings);
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [clerkOrgId]);

  useEffect(() => {
    if (!orgLoaded) return;
    if (orgId) return;
    const resolved = clerkOrgId || readActiveOrganizationId();
    if (resolved) setOrgId(resolved);
  }, [orgLoaded, clerkOrgId, orgId]);

  useEffect(() => {
    if (editingName) nameInputRef.current?.focus();
  }, [editingName]);

  const applyRemote = useCallback((nextOrgId: string, nextSettings: LabOrgSettings) => {
    skipNextSaveRef.current = true;
    if (nextOrgId) setOrgId(nextOrgId);
    setSettings(nextSettings);
    saveLabOrgSettings(nextSettings);
  }, []);

  const persistToApi = useCallback(
    async (next: LabOrgSettings) => {
      setSaveState("saving");
      const saved = await patchLabOrgSettingsToApi(next);
      if (saved) {
        applyRemote(saved.orgId, saved.settings);
        if (next.organizationName.trim()) {
          writeDevConsoleOrgDisplayName(next.organizationName.trim());
        }
        const refreshed = await fetchLabOrgSettingsFromApi();
        if (refreshed) {
          applyRemote(refreshed.orgId, refreshed.settings);
        }
        setSaveState("saved");
        window.setTimeout(() => setSaveState("idle"), 2000);
        return;
      }
      setSaveState("error");
    },
    [applyRemote],
  );

  useEffect(() => {
    if (!loaded) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      void persistToApi(settings);
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [settings, loaded, persistToApi]);

  function updateSettings(partial: Partial<LabOrgSettings>) {
    const next = saveLabOrgSettings(partial);
    setSettings(next);
  }

  async function copyOrgId() {
    const value = orgIdDisplay === "—" ? "" : orgIdDisplay;
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedOrgId(true);
      window.setTimeout(() => setCopiedOrgId(false), 2000);
    } catch {
      setCopiedOrgId(false);
    }
  }

  function commitOrgName(value: string) {
    updateSettings({ organizationName: value });
    setEditingName(false);
  }

  return (
    <ContinuityLabSettingsSectionFrame
      sectionId="general"
      breadcrumb={[
        { label: "Settings", href: "/continuity-lab/settings" },
        { label: "General" },
      ]}
      titleOverride="General"
      descriptionOverride="Organization identity and data sharing preferences."
    >
      <Link
        href="/continuity-lab/settings"
        className="-mt-2 mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#F0EFE2]/50 transition hover:text-[#F0EFE2]/80"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to organization
      </Link>

      {saveState === "error" ? (
        <p className="text-xs text-amber-200/90">
          Could not save to the server. Changes are kept in this browser until organization context
          is available.
        </p>
      ) : saveState === "saving" ? (
        <p className="text-xs text-[#F0EFE2]/40">Saving…</p>
      ) : saveState === "saved" ? (
        <p className="text-xs text-emerald-300/90">Saved</p>
      ) : null}

      <SettingsCard title="Organization">
        <SettingsFlatPanel>
          <SettingsFieldRow
            label="Organization name"
            hint="The name shown across MemoryOS and in notifications"
          >
            {editingName ? (
              <input
                ref={nameInputRef}
                type="text"
                defaultValue={settings.organizationName || fallbackOrgName}
                onBlur={(e) => commitOrgName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  }
                  if (e.key === "Escape") {
                    setEditingName(false);
                  }
                }}
                className="h-9 w-full rounded-md border border-white/[0.08] bg-[#111111] px-3 text-sm text-[#F0EFE2] placeholder:text-[#F0EFE2]/35 focus:border-white/20 focus:outline-none"
              />
            ) : (
              <div className="flex items-center gap-2">
                <p className="min-w-0 flex-1 truncate text-sm text-[#F0EFE2]/80">{displayOrgName}</p>
                <button
                  type="button"
                  onClick={() => setEditingName(true)}
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-white/[0.08] text-[#F0EFE2]/60 transition hover:bg-white/[0.06] hover:text-[#F0EFE2]"
                  aria-label="Edit organization name"
                >
                  <Pencil className="size-3.5" aria-hidden />
                </button>
              </div>
            )}
          </SettingsFieldRow>
          <SettingsFieldRow
            label="Organization ID"
            hint="Your unique organization identifier for API usage"
          >
            <SettingsCopyValue
              value={orgIdDisplay}
              onCopy={orgIdDisplay !== "—" ? copyOrgId : undefined}
              copied={copiedOrgId}
            />
          </SettingsFieldRow>
        </SettingsFlatPanel>
      </SettingsCard>

      <SettingsCard
        title="Data controls & privacy"
        description="Choose what MemoryOS is allowed to use for improving its products"
      >
        <SettingsFlatPanel>
          <SettingsFieldRow
            label="Share data for evaluation"
            hint="Share session data to help us measure MemoryOS performance"
          >
            <SettingsToggle
              label="Share data for evaluation"
              checked={settings.shareDataForEvaluation}
              onChange={(next) => updateSettings({ shareDataForEvaluation: next })}
            />
          </SettingsFieldRow>
          <SettingsFieldRow
            label="Share data for training"
            hint="Share session input and output to help us train and improve MemoryOS"
          >
            <SettingsToggle
              label="Share data for training"
              checked={settings.shareDataForTraining}
              onChange={(next) => updateSettings({ shareDataForTraining: next })}
            />
          </SettingsFieldRow>
        </SettingsFlatPanel>
      </SettingsCard>
    </ContinuityLabSettingsSectionFrame>
  );
}
