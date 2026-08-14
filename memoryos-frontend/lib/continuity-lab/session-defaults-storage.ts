"use client";

import { readOrgContinuityLabSettingsSnapshot } from "@/lib/continuity-lab/lab-continuity-lab-settings-runtime";
import type { LabDefaultPlatform } from "@/lib/continuity-lab/lab-continuity-lab-settings-storage";
import { readLabSessionsSettings } from "@/lib/continuity-lab/sessions-settings-storage";

const SESSION_DEFAULTS_KEY = "memoryos.continuity-lab.settings.sessionDefaults";

export type SessionDefaults = {
  /** When true, new sessions open with focus mode enabled. */
  focusModeByDefault?: boolean;
  /** Org default sandbox OS (from Continuity Lab org settings API). */
  defaultPlatform?: LabDefaultPlatform;
  secureMode?: boolean;
  computerUse?: boolean;
};

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function readSessionDefaults(): SessionDefaults {
  const org = readOrgContinuityLabSettingsSnapshot();
  const sessions = readLabSessionsSettings();
  const store = storage();
  let local: SessionDefaults = {};
  if (store) {
    try {
      const raw = store.getItem(SESSION_DEFAULTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SessionDefaults;
        if (parsed && typeof parsed === "object") local = parsed;
      }
    } catch {
      /* ignore */
    }
  }
  return {
    focusModeByDefault: sessions.focusModeByDefault,
    defaultPlatform: org.defaultPlatform,
    secureMode: org.secureMode,
    computerUse: org.computerUse,
    ...local,
  };
}

export function writeSessionDefaults(patch: Partial<SessionDefaults>): SessionDefaults {
  const next = { ...readSessionDefaults(), ...patch };
  const store = storage();
  if (store) {
    store.setItem(SESSION_DEFAULTS_KEY, JSON.stringify(next));
  }
  return next;
}

export function resetSessionSplitRatio(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem("memoryos.continuity-lab.session.splitRatio");
  } catch {
    /* ignore */
  }
}
