"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { loadLabPreferencesHybrid, patchLabPreferencesToApi } from "@/lib/continuity-lab/lab-preferences-api";
import {
  applyThemeToDocument,
  readLabPreferences,
  saveLabPreferences,
  THEME_PREFERENCE_EVENT,
  type ThemePreference,
} from "@/lib/continuity-lab/lab-preferences-storage";

export type ThemePreferenceContextValue = {
  preference: ThemePreference;
  resolved: "light" | "dark";
  setThemePreference: (theme: ThemePreference) => void;
};

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | null>(null);

let remotePreferencesLoadStarted = false;

type LegacyMediaQueryList = MediaQueryList & {
  addListener?: (listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void) => void;
  removeListener?: (listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void) => void;
};

function subscribeThemePreference(onStoreChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (
      event.key === "memoryos-lab-preferences" ||
      event.key === "memoryos.theme.preference"
    ) {
      onStoreChange();
    }
  };
  const onThemeEvent = () => onStoreChange();
  window.addEventListener("storage", onStorage);
  window.addEventListener(THEME_PREFERENCE_EVENT, onThemeEvent);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(THEME_PREFERENCE_EVENT, onThemeEvent);
  };
}

function getThemePreferenceSnapshot(): ThemePreference {
  return readLabPreferences().theme;
}

function getThemePreferenceServerSnapshot(): ThemePreference {
  return "system";
}

function subscribeSystemColorScheme(onStoreChange: () => void) {
  const media = typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  const legacyOnChange = () => onStoreChange();
  if (media && media.addEventListener) {
    media.addEventListener("change", onStoreChange);
  } else if (media && "addListener" in media) {
    (media as LegacyMediaQueryList).addListener?.(legacyOnChange);
  }
  return () => {
    if (media && media.removeEventListener) {
      media.removeEventListener("change", onStoreChange);
    } else if (media && "removeListener" in media) {
      (media as LegacyMediaQueryList).removeListener?.(legacyOnChange);
    }
  };
}

function getSystemDarkSnapshot(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getSystemDarkServerSnapshot(): boolean {
  return false;
}

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const preference = useSyncExternalStore(
    subscribeThemePreference,
    getThemePreferenceSnapshot,
    getThemePreferenceServerSnapshot,
  );
  const systemDark = useSyncExternalStore(
    subscribeSystemColorScheme,
    getSystemDarkSnapshot,
    getSystemDarkServerSnapshot,
  );
  const resolved = useMemo<"light" | "dark">(() => {
    if (preference === "system") return systemDark ? "dark" : "light";
    return preference;
  }, [preference, systemDark]);

  useEffect(() => {
    applyThemeToDocument(preference);
  }, [preference, systemDark]);

  const syncThemePreferenceFromServer = useCallback(async () => {
    const prefs = await loadLabPreferencesHybrid();
    saveLabPreferences(prefs);
  }, []);

  useEffect(() => {
    if (remotePreferencesLoadStarted) return;
    remotePreferencesLoadStarted = true;
    let cancelled = false;
    void (async () => {
      if (cancelled) return;
      await syncThemePreferenceFromServer();
    })();
    return () => {
      cancelled = true;
    };
  }, [syncThemePreferenceFromServer]);

  useEffect(() => {
    const onFocus = () => {
      void syncThemePreferenceFromServer();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncThemePreferenceFromServer();
      }
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [syncThemePreferenceFromServer]);

  const setThemePreference = useCallback((theme: ThemePreference) => {
    saveLabPreferences({ theme });
    void patchLabPreferencesToApi({ theme });
  }, []);

  const value = useMemo(
    () => ({ preference, resolved, setThemePreference }),
    [preference, resolved, setThemePreference],
  );

  return (
    <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>
  );
}

export function useThemePreferenceContext(): ThemePreferenceContextValue | null {
  return useContext(ThemePreferenceContext);
}
