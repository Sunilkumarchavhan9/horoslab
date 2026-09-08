"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Pencil } from "lucide-react";
import {
  ContinuityLabSettingsSectionFrame,
} from "@/components/continuity-lab/settings/continuity-lab-settings-shell";
import {
  SettingsCard,
  SettingsCopyValue,
  SettingsFieldRow,
  SettingsFlatPanel,
  SettingsSecondaryButton,
  SettingsSelect,
  SettingsToggle,
} from "@/components/continuity-lab/settings/continuity-lab-settings-ui";
import {
  loadLabPreferencesHybrid,
  patchLabPreferencesToApi,
} from "@/lib/continuity-lab/lab-preferences-api";
import {
  readLabPreferences,
  saveLabPreferences,
  type LabPreferences,
  type ReviewTriggerPreference,
  type ThemePreference,
} from "@/lib/continuity-lab/lab-preferences-storage";

const REVIEW_TRIGGER_OPTIONS: { value: ReviewTriggerPreference; label: string }[] = [
  { value: "manual", label: "Manual" },
  { value: "on_pr_open", label: "When a pull request opens" },
  { value: "on_push", label: "On push to default branch" },
];

const SAVE_DEBOUNCE_MS = 450;

export function ContinuityLabPreferencesSection() {
  const { user, isLoaded } = useUser();
  const [prefs, setPrefs] = useState<LabPreferences>(readLabPreferences);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [copiedUserId, setCopiedUserId] = useState(false);
  const [browserMsg, setBrowserMsg] = useState<string | null>(null);
  const skipNextSaveRef = useRef(true);
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const remote = await loadLabPreferencesHybrid();
      if (!cancelled) {
        skipNextSaveRef.current = true;
        setPrefs(remote);
        setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const clerkName =
    user?.fullName?.trim() ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    "";
  const clerkEmail =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress ??
    "";
  const userId = user?.id ?? "";
  const avatarUrl = user?.imageUrl ?? "";

  const displayName = prefs.displayName.trim() || clerkName || "MemoryOS user";
  const email = clerkEmail || "Not signed in";
  const userIdDisplay = userId || "—";

  const authorOptions = useMemo(() => {
    const values = new Set<string>();
    if (clerkName) values.add(clerkName);
    if (prefs.gitCommitAuthor.trim()) values.add(prefs.gitCommitAuthor.trim());
    if (!values.size) values.add("MemoryOS Agent");
    return Array.from(values);
  }, [clerkName, prefs.gitCommitAuthor]);

  const emailOptions = useMemo(() => {
    const values = new Set<string>();
    if (clerkEmail) values.add(clerkEmail);
    if (prefs.gitCommitEmail.trim()) values.add(prefs.gitCommitEmail.trim());
    if (!values.size) values.add("agent@memoryos.local");
    return Array.from(values);
  }, [clerkEmail, prefs.gitCommitEmail]);

  const gitCommitAuthor =
    prefs.gitCommitAuthor.trim() && authorOptions.includes(prefs.gitCommitAuthor.trim())
      ? prefs.gitCommitAuthor.trim()
      : authorOptions[0] ?? "";

  const gitCommitEmail =
    prefs.gitCommitEmail.trim() && emailOptions.includes(prefs.gitCommitEmail.trim())
      ? prefs.gitCommitEmail.trim()
      : emailOptions[0] ?? "";

  const persistToApi = useCallback(async (next: LabPreferences) => {
    setSaveState("saving");
    const saved = await patchLabPreferencesToApi(next);
    if (saved) {
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 2000);
      return;
    }
    setSaveState("error");
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      void persistToApi(prefs);
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [prefs, loaded, persistToApi]);

  function updatePrefs(partial: Partial<LabPreferences>) {
    const next = saveLabPreferences(partial);
    setPrefs(next);
  }

  async function enableBrowserNotifications() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setBrowserMsg("Browser notifications are not supported here.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        updatePrefs({ browserNotificationsEnabled: true });
        setBrowserMsg(null);
        return;
      }
      updatePrefs({ browserNotificationsEnabled: false });
      setBrowserMsg(
        permission === "denied"
          ? "Notifications blocked in browser settings."
          : "Notification permission was not granted.",
      );
    } catch {
      setBrowserMsg("Could not request notification permission.");
    }
  }

  async function copyUserId() {
    if (!userId) return;
    try {
      await navigator.clipboard.writeText(userId);
      setCopiedUserId(true);
      window.setTimeout(() => setCopiedUserId(false), 2000);
    } catch {
      setCopiedUserId(false);
    }
  }

  return (
    <ContinuityLabSettingsSectionFrame
      sectionId="preferences"
      breadcrumb={[{ label: "Settings", href: "/continuity-lab/settings" }, { label: "Preferences" }]}
      titleOverride="Preferences"
      descriptionOverride="Manage your personal preferences"
    >
      {saveState === "error" ? (
        <p className="text-xs text-amber-200/90">
          Could not save to the server. Changes are kept in this browser until you sign in again.
        </p>
      ) : saveState === "saving" ? (
        <p className="text-xs text-[#F0EFE2]/40">Saving…</p>
      ) : saveState === "saved" ? (
        <p className="text-xs text-emerald-300/90">Saved</p>
      ) : null}

      <SettingsCard title="Profile">
        <SettingsFlatPanel>
          <SettingsFieldRow label="Picture">
            <div className="flex items-center gap-3">
              <span className="relative inline-flex size-12 shrink-0 overflow-hidden rounded-full bg-white/[0.06]">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt=""
                    width={48}
                    height={48}
                    className="size-12 object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="flex size-full items-center justify-center text-sm font-semibold text-[#F0EFE2]/50">
                    {displayName.slice(0, 1).toUpperCase() || "?"}
                  </span>
                )}
              </span>
              <button
                type="button"
                disabled={!isLoaded || !user}
                onClick={() => {
                  /* v1: avatar managed via Clerk account */
                }}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#F0EFE2]/70 hover:text-[#F0EFE2] disabled:opacity-40"
              >
                <Pencil className="size-3.5" aria-hidden />
                Edit
              </button>
            </div>
          </SettingsFieldRow>
          <SettingsFieldRow label="Name">
            <input
              type="text"
              value={prefs.displayName}
              onChange={(e) => updatePrefs({ displayName: e.target.value })}
              onBlur={() => void persistToApi(prefs)}
              placeholder={clerkName || "Your name"}
              className="h-9 w-full rounded-md border border-white/[0.08] bg-[#111111] px-3 text-sm text-[#F0EFE2] placeholder:text-[#F0EFE2]/35 focus:border-white/20 focus:outline-none"
            />
          </SettingsFieldRow>
          <SettingsFieldRow label="Email">
            <p className="text-sm text-[#F0EFE2]/80">{email}</p>
          </SettingsFieldRow>
          <SettingsFieldRow label="User ID" hint="Copy your MemoryOS user identifier.">
            <SettingsCopyValue
              value={userIdDisplay}
              onCopy={userId ? copyUserId : undefined}
              copied={copiedUserId}
              ariaLabel="Copy user ID"
            />
          </SettingsFieldRow>
        </SettingsFlatPanel>
      </SettingsCard>

      <SettingsCard title="Display">
        <SettingsFlatPanel>
          <SettingsFieldRow label="Theme">
            <SettingsSelect
              value={prefs.theme}
              onChange={(value) => updatePrefs({ theme: value as ThemePreference })}
              options={[
                { value: "system", label: "System" },
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ]}
            />
          </SettingsFieldRow>
        </SettingsFlatPanel>
      </SettingsCard>

      <SettingsCard title="Notifications">
        <SettingsFlatPanel>
          <SettingsFieldRow label="In-app notifications">
            <SettingsToggle
              label="In-app notifications"
              checked={prefs.inAppNotifications}
              onChange={(next) => updatePrefs({ inAppNotifications: next })}
            />
          </SettingsFieldRow>
          <SettingsFieldRow label="Play sound">
            <SettingsToggle
              label="Play sound"
              checked={prefs.playSound}
              onChange={(next) => updatePrefs({ playSound: next })}
            />
          </SettingsFieldRow>
          <SettingsFieldRow
            label="Browser notifications"
            hint={browserMsg ?? undefined}
          >
            {prefs.browserNotificationsEnabled ? (
              <SettingsToggle
                label="Browser notifications"
                checked
                onChange={(next) => updatePrefs({ browserNotificationsEnabled: next })}
              />
            ) : (
              <SettingsSecondaryButton onClick={() => void enableBrowserNotifications()}>
                Enable
              </SettingsSecondaryButton>
            )}
          </SettingsFieldRow>
          <SettingsFieldRow label="Slack notifications">
            <SettingsToggle
              label="Slack notifications"
              checked={prefs.slackNotifications}
              onChange={(next) => updatePrefs({ slackNotifications: next })}
            />
          </SettingsFieldRow>
          <SettingsFieldRow label="Newsletter">
            <SettingsToggle
              label="Newsletter"
              checked={prefs.newsletter}
              onChange={(next) => updatePrefs({ newsletter: next })}
            />
          </SettingsFieldRow>
        </SettingsFlatPanel>
      </SettingsCard>

      <SettingsCard title="Continuity sessions">
        <SettingsFlatPanel>
          <SettingsFieldRow label="Git commit author">
            <SettingsSelect
              value={gitCommitAuthor}
              onChange={(value) => updatePrefs({ gitCommitAuthor: value })}
              options={authorOptions.map((value) => ({ value, label: value }))}
            />
          </SettingsFieldRow>
          <SettingsFieldRow label="Git commit email">
            <SettingsSelect
              value={gitCommitEmail}
              onChange={(value) => updatePrefs({ gitCommitEmail: value })}
              options={emailOptions.map((value) => ({ value, label: value }))}
            />
          </SettingsFieldRow>
          <SettingsFieldRow
            label="Open pull requests as drafts"
            hint="New PRs from agent sessions start as drafts when supported."
          >
            <SettingsToggle
              label="Open pull requests as drafts"
              checked={prefs.openPullRequestsAsDrafts}
              onChange={(next) => updatePrefs({ openPullRequestsAsDrafts: next })}
            />
          </SettingsFieldRow>
        </SettingsFlatPanel>
      </SettingsCard>

      <SettingsCard title="Review">
        <SettingsFlatPanel>
          <SettingsFieldRow label="Review trigger">
            <SettingsSelect
              value={prefs.reviewTrigger}
              onChange={(value) =>
                updatePrefs({ reviewTrigger: value as ReviewTriggerPreference })
              }
              options={REVIEW_TRIGGER_OPTIONS}
            />
          </SettingsFieldRow>
        </SettingsFlatPanel>
      </SettingsCard>
    </ContinuityLabSettingsSectionFrame>
  );
}
