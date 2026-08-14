"use client";

import { useEffect, useState } from "react";
import { ContinuityLabSessionsBrowser } from "@/components/continuity-lab/continuity-lab-sessions-browser";
import { ContinuityLabSettingsSectionFrame } from "@/components/continuity-lab/settings/continuity-lab-settings-shell";
import {
  SettingsCard,
  SettingsFieldRow,
  SettingsFlatPanel,
} from "@/components/continuity-lab/settings/continuity-lab-settings-ui";
import {
  resetSessionSplitRatio,
  writeSessionDefaults,
} from "@/lib/continuity-lab/session-defaults-storage";
import {
  loadLabSessionsSettingsHybrid,
  patchLabSessionsSettingsToApi,
} from "@/lib/continuity-lab/lab-sessions-settings-api";
import { SETTINGS_INDEX_PATH } from "@/lib/continuity-lab/settings-nav";

export function ContinuityLabSettingsSessionsSection() {
  const [focusDefault, setFocusDefault] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "error">("idle");
  const [splitResetMsg, setSplitResetMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadLabSessionsSettingsHybrid().then((settings) => {
      if (cancelled) return;
      setFocusDefault(settings.focusModeByDefault);
      writeSessionDefaults({ focusModeByDefault: settings.focusModeByDefault });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function updateFocusDefault(next: boolean) {
    setFocusDefault(next);
    writeSessionDefaults({ focusModeByDefault: next });
    setSaveState("saving");
    const saved = await patchLabSessionsSettingsToApi({ focusModeByDefault: next });
    if (!saved) {
      setSaveState("error");
      return;
    }
    setFocusDefault(saved.focusModeByDefault);
    writeSessionDefaults({ focusModeByDefault: saved.focusModeByDefault });
    setSaveState("idle");
  }

  return (
    <ContinuityLabSettingsSectionFrame
      sectionId="sessions"
      contentClassName="max-w-5xl"
      descriptionOverride="Browse, filter, and export agent sessions for your organization."
      breadcrumb={[
        { label: "Settings", href: SETTINGS_INDEX_PATH },
        { label: "Sessions" },
      ]}
    >
      <div className="-mx-2 max-w-none md:-mx-0">
        <SettingsFlatPanel className="px-4 py-4">
          <ContinuityLabSessionsBrowser variant="settings" sessionFetchLimit={100} />
        </SettingsFlatPanel>
      </div>

      <SettingsCard title="Session layout" className="mt-8">
        <SettingsFieldRow
          label="Focus mode by default"
          hint="New sessions start with the continuity rail hidden."
        >
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-white/80">
            <input
              type="checkbox"
              checked={focusDefault}
              onChange={(e) => {
                void updateFocusDefault(e.target.checked);
              }}
              className="size-4 accent-[#6366F1]"
            />
            Enable on new sessions
          </label>
          {saveState === "saving" ? (
            <p className="mt-2 text-xs text-white/45">Saving…</p>
          ) : saveState === "error" ? (
            <p className="mt-2 text-xs text-amber-200/90">
              Could not save to the server. The local fallback was updated.
            </p>
          ) : null}
        </SettingsFieldRow>
        <SettingsFieldRow
          label="Chat / rail split"
          hint="Resets the draggable divider to the default 60/40 layout."
        >
          <div>
            <button
              type="button"
              onClick={() => {
                resetSessionSplitRatio();
                setSplitResetMsg("Split ratio reset. Open or refresh a session to apply.");
              }}
              className="border border-[#3A3A3A] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#141414]"
            >
              Reset split ratio
            </button>
            {splitResetMsg ? (
              <p className="mt-2 text-xs text-emerald-300/90">{splitResetMsg}</p>
            ) : null}
          </div>
        </SettingsFieldRow>
      </SettingsCard>
    </ContinuityLabSettingsSectionFrame>
  );
}
