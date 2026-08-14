"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { loadProfilePreferencesHybrid, patchProfilePreferencesToApi } from "@/lib/continuity-lab/profile-preferences-api";
import {
  PROFILE_LANGUAGE_EVENT,
  PROFILE_TIMEZONE_EVENT,
  readProfilePreferences,
  saveProfilePreferences,
  type ProfilePreferences,
} from "@/lib/continuity-lab/profile-preferences-storage";

type ProfilePreferencesContextValue = {
  preferences: ProfilePreferences;
  setProfilePreferences: (partial: Partial<ProfilePreferences>) => ProfilePreferences;
  syncProfilePreferencesFromServer: () => Promise<void>;
};

let remotePreferencesLoadStarted = false;

function subscribeProfilePreferences(onStoreChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === "memoryos-profile-preferences") {
      onStoreChange();
    }
  };
  const onLanguage = () => onStoreChange();
  const onTimezone = () => onStoreChange();
  window.addEventListener("storage", onStorage);
  window.addEventListener(PROFILE_LANGUAGE_EVENT, onLanguage);
  window.addEventListener(PROFILE_TIMEZONE_EVENT, onTimezone);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(PROFILE_LANGUAGE_EVENT, onLanguage);
    window.removeEventListener(PROFILE_TIMEZONE_EVENT, onTimezone);
  };
}

let lastSnapshot: ProfilePreferences | null = null;

function getProfilePreferencesSnapshot(): ProfilePreferences {
  const current = readProfilePreferences();
  if (
    lastSnapshot &&
    lastSnapshot.language === current.language &&
    lastSnapshot.timezone === current.timezone
  ) {
    return lastSnapshot;
  }
  lastSnapshot = current;
  return current;
}

const SERVER_SNAPSHOT: ProfilePreferences = { language: "en", timezone: "UTC" };

function getProfilePreferencesServerSnapshot(): ProfilePreferences {
  return SERVER_SNAPSHOT;
}

export function useProfilePreferences(): ProfilePreferencesContextValue {
  const preferences = useSyncExternalStore(
    subscribeProfilePreferences,
    getProfilePreferencesSnapshot,
    getProfilePreferencesServerSnapshot,
  );

  const syncProfilePreferencesFromServer = useCallback(async () => {
    const remote = await loadProfilePreferencesHybrid();
    saveProfilePreferences(remote);
  }, []);

  useEffect(() => {
    if (remotePreferencesLoadStarted) return;
    remotePreferencesLoadStarted = true;
    let cancelled = false;
    void (async () => {
      if (cancelled) return;
      await syncProfilePreferencesFromServer();
    })();
    return () => {
      cancelled = true;
    };
  }, [syncProfilePreferencesFromServer]);

  useEffect(() => {
    const onFocus = () => {
      void syncProfilePreferencesFromServer();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncProfilePreferencesFromServer();
      }
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [syncProfilePreferencesFromServer]);

  const setProfilePreferences = useCallback((partial: Partial<ProfilePreferences>) => {
    const next = saveProfilePreferences(partial);
    void patchProfilePreferencesToApi(partial).then((remote) => {
      if (remote) {
        saveProfilePreferences(remote);
      }
    });
    return next;
  }, []);

  return useMemo(
    () => ({ preferences, setProfilePreferences, syncProfilePreferencesFromServer }),
    [preferences, setProfilePreferences, syncProfilePreferencesFromServer],
  );
}
