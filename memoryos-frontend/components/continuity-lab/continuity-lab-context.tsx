"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  fetchCompanyBrainFunnel,
  type ServerFunnelProgress,
} from "@/lib/company-brain-funnel";
import { getOrCreateMemoryToken } from "@/lib/memory-token";
import {
  deriveGetStartedProgress,
  type GetStartedProgress,
} from "@/lib/continuity-lab/get-started";
import {
  EMPTY_CONNECTOR_STATE,
  loadConnectorState,
  syncRuntimeCredentials,
  type MemoryOsConnectorState,
} from "@/lib/continuity-lab/runtime";
import { loadCompanyModelSnapshot } from "@/lib/continuity-lab/company-model";
import { searchLabSessions, type LabSessionSummary } from "@/lib/continuity-lab/sessions";
import { consoleAuthHeaders } from "@/lib/console-api";
import { useOrganization } from "@clerk/nextjs";
import { LAB_CONTINUITY_LAB_SETTINGS_CHANGED_EVENT } from "@/lib/continuity-lab/lab-continuity-lab-settings-events";
import { loadLabContinuityLabSettingsHybrid } from "@/lib/continuity-lab/lab-continuity-lab-settings-api";
import {
  listAllSlashCommands,
  readLabContinuityLabSettings,
  type LabContinuityLabSettings,
  type LabSlashCommand,
} from "@/lib/continuity-lab/lab-continuity-lab-settings-storage";

type ContinuityLabContextValue = {
  funnel: Partial<ServerFunnelProgress> | null;
  connector: MemoryOsConnectorState;
  connectorBackendOffline: boolean;
  sessions: LabSessionSummary[];
  getStarted: GetStartedProgress;
  modelReady: boolean;
  canStartSession: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  companyModelModalOpen: boolean;
  openCompanyModelModal: () => void;
  closeCompanyModelModal: () => void;
  refresh: () => Promise<void>;
  refreshCompanyModel: () => Promise<boolean>;
  orgLabSettings: LabContinuityLabSettings;
  orgLabSlashCommands: LabSlashCommand[];
  orgLabSettingsLoaded: boolean;
  refreshOrgLabSettings: () => Promise<void>;
};

const ContinuityLabContext = createContext<ContinuityLabContextValue | null>(null);

type ContinuityLabSnapshot = {
  funnel: Partial<ServerFunnelProgress> | null;
  connector: MemoryOsConnectorState;
  connectorBackendOffline: boolean;
  sessions: LabSessionSummary[];
  modelReady: boolean;
  orgLabSettings: LabContinuityLabSettings;
  orgLabSlashCommands: LabSlashCommand[];
  orgLabSettingsLoaded: boolean;
};

const CONTINUITY_LAB_SNAPSHOT_CACHE_TTL_MS = 60_000;

let continuityLabSnapshotCache:
  | { updatedAt: number; snapshot: ContinuityLabSnapshot }
  | null = null;

function getCachedContinuityLabSnapshot(): ContinuityLabSnapshot | null {
  if (!continuityLabSnapshotCache) return null;
  return continuityLabSnapshotCache.snapshot;
}

function isContinuityLabSnapshotFresh(): boolean {
  if (!continuityLabSnapshotCache) return false;
  return Date.now() - continuityLabSnapshotCache.updatedAt < CONTINUITY_LAB_SNAPSHOT_CACHE_TTL_MS;
}

function updateContinuityLabSnapshot(partial: Partial<ContinuityLabSnapshot>) {
  const fallbackSettings = readLabContinuityLabSettings();
  const previous = continuityLabSnapshotCache?.snapshot;
  const snapshot: ContinuityLabSnapshot = {
    funnel: previous?.funnel ?? null,
    connector: previous?.connector ?? EMPTY_CONNECTOR_STATE,
    connectorBackendOffline: previous?.connectorBackendOffline ?? false,
    sessions: previous?.sessions ?? [],
    modelReady: previous?.modelReady ?? false,
    orgLabSettings: previous?.orgLabSettings ?? fallbackSettings,
    orgLabSlashCommands:
      previous?.orgLabSlashCommands ?? listAllSlashCommands(fallbackSettings),
    orgLabSettingsLoaded: previous?.orgLabSettingsLoaded ?? false,
    ...partial,
  };
  continuityLabSnapshotCache = { updatedAt: Date.now(), snapshot };
}

export function ContinuityLabProvider({ children }: { children: ReactNode }) {
  const { organization } = useOrganization();
  const [funnel, setFunnel] = useState<Partial<ServerFunnelProgress> | null>(
    () => getCachedContinuityLabSnapshot()?.funnel ?? null,
  );
  const [orgLabSettings, setOrgLabSettings] = useState<LabContinuityLabSettings>(() =>
    getCachedContinuityLabSnapshot()?.orgLabSettings ?? readLabContinuityLabSettings(),
  );
  const [orgLabSlashCommands, setOrgLabSlashCommands] = useState<LabSlashCommand[]>(() =>
    getCachedContinuityLabSnapshot()?.orgLabSlashCommands ??
    listAllSlashCommands(readLabContinuityLabSettings()),
  );
  const [orgLabSettingsLoaded, setOrgLabSettingsLoaded] = useState(
    () => getCachedContinuityLabSnapshot()?.orgLabSettingsLoaded ?? false,
  );
  const [connector, setConnector] = useState<MemoryOsConnectorState>(
    () => getCachedContinuityLabSnapshot()?.connector ?? EMPTY_CONNECTOR_STATE,
  );
  const [connectorBackendOffline, setConnectorBackendOffline] = useState(
    () => getCachedContinuityLabSnapshot()?.connectorBackendOffline ?? false,
  );
  const [sessions, setSessions] = useState<LabSessionSummary[]>(
    () => getCachedContinuityLabSnapshot()?.sessions ?? [],
  );
  const [modelReady, setModelReady] = useState(
    () => getCachedContinuityLabSnapshot()?.modelReady ?? false,
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [companyModelModalOpen, setCompanyModelModalOpen] = useState(false);
  const openCompanyModelModal = useCallback(() => setCompanyModelModalOpen(true), []);
  const closeCompanyModelModal = useCallback(() => setCompanyModelModalOpen(false), []);
  const refreshInFlightRef = useRef<Promise<void> | null>(null);
  const credentialSyncInFlightRef = useRef<Promise<void> | null>(null);

  const scheduleRuntimeCredentialSync = useCallback(() => {
    if (credentialSyncInFlightRef.current) return credentialSyncInFlightRef.current;
    const task = syncRuntimeCredentials()
      .catch(() => undefined)
      .finally(() => {
        credentialSyncInFlightRef.current = null;
      });
    credentialSyncInFlightRef.current = task;
    return task;
  }, []);

  const refreshCompanyModelState = useCallback(async (options?: {
    syncProviderKey?: boolean;
  }): Promise<boolean> => {
    if (options?.syncProviderKey !== false) {
      await fetch("/api/runtime/openrouter-provider-key?force=1", {
        method: "POST",
        cache: "no-store",
      }).catch(() => null);
    }
    const snapshot = await loadCompanyModelSnapshot();
    const ready = snapshot.modelReady;
    setModelReady(ready);
    updateContinuityLabSnapshot({ modelReady: ready });
    return ready;
  }, []);

  const refreshCompanyModel = useCallback(
    () => refreshCompanyModelState({ syncProviderKey: true }),
    [refreshCompanyModelState],
  );

  const refreshOrgLabSettings = useCallback(async () => {
    const remote = await loadLabContinuityLabSettingsHybrid();
    if (remote) {
      setOrgLabSettings(remote.settings);
      setOrgLabSlashCommands(remote.commands);
      updateContinuityLabSnapshot({
        orgLabSettings: remote.settings,
        orgLabSlashCommands: remote.commands,
        orgLabSettingsLoaded: true,
      });
    }
    setOrgLabSettingsLoaded(true);
  }, []);

  const refresh = useCallback(async () => {
    if (refreshInFlightRef.current) return refreshInFlightRef.current;

    const task = (async () => {
      const cached = getCachedContinuityLabSnapshot();
      const localSettings = readLabContinuityLabSettings();
      const headers = await consoleAuthHeaders();
      const auth = new Headers(headers).get("Authorization");

      const funnelPromise = auth
        ? fetchCompanyBrainFunnel(headers).catch(() => null)
        : Promise.resolve(null);
      const connectorPromise = auth
        ? loadConnectorState().catch(() => ({
            state: cached?.connector ?? EMPTY_CONNECTOR_STATE,
            backendAvailable: cached ? !cached.connectorBackendOffline : false,
          }))
        : Promise.resolve({
            state: cached?.connector ?? EMPTY_CONNECTOR_STATE,
            backendAvailable: cached ? !cached.connectorBackendOffline : true,
          });
      const modelReadyPromise = refreshCompanyModelState({
        syncProviderKey: false,
      }).catch(() => cached?.modelReady ?? false);
      const sessionsPromise = searchLabSessions().catch(() => cached?.sessions ?? []);
      const orgSettingsPromise = loadLabContinuityLabSettingsHybrid().catch(() => null);

      const [remoteFunnel, connectorResult, ready, listed, remoteSettings] =
        await Promise.all([
          funnelPromise,
          connectorPromise,
          modelReadyPromise,
          sessionsPromise,
          orgSettingsPromise,
        ]);

      const nextFunnel = remoteFunnel?.progress ?? cached?.funnel ?? null;
      const shouldPreserveConnector =
        Boolean(cached?.connector.payload.github.connected) && !connectorResult.backendAvailable;
      const nextConnector = shouldPreserveConnector ? cached!.connector : connectorResult.state;
      const nextConnectorBackendOffline =
        shouldPreserveConnector ? true : !connectorResult.backendAvailable;
      const nextOrgSettings =
        remoteSettings?.settings ?? cached?.orgLabSettings ?? localSettings;
      const nextOrgCommands =
        remoteSettings?.commands ??
        cached?.orgLabSlashCommands ??
        listAllSlashCommands(nextOrgSettings);
      const nextOrgSettingsLoaded = true;

      setFunnel(nextFunnel);
      setConnector(nextConnector);
      setConnectorBackendOffline(nextConnectorBackendOffline);
      setModelReady(ready);
      setSessions(listed);
      setOrgLabSettings(nextOrgSettings);
      setOrgLabSlashCommands(nextOrgCommands);
      setOrgLabSettingsLoaded(nextOrgSettingsLoaded);

      updateContinuityLabSnapshot({
        funnel: nextFunnel,
        connector: nextConnector,
        connectorBackendOffline: nextConnectorBackendOffline,
        sessions: listed,
        modelReady: ready,
        orgLabSettings: nextOrgSettings,
        orgLabSlashCommands: nextOrgCommands,
        orgLabSettingsLoaded: nextOrgSettingsLoaded,
      });

      void scheduleRuntimeCredentialSync();
    })().finally(() => {
      refreshInFlightRef.current = null;
    });

    refreshInFlightRef.current = task;
    return task;
  }, [refreshCompanyModelState, scheduleRuntimeCredentialSync]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refreshOrgLabSettings(), 0);
    return () => window.clearTimeout(timer);
  }, [organization?.id, refreshOrgLabSettings]);

  useEffect(() => {
    function onOrgSettingsChanged(
      event: Event,
    ) {
      const detail = (event as CustomEvent<{ settings: LabContinuityLabSettings; commands: LabSlashCommand[] }>)
        .detail;
      if (!detail?.settings) return;
      setOrgLabSettings(detail.settings);
      setOrgLabSlashCommands(detail.commands ?? listAllSlashCommands(detail.settings));
      setOrgLabSettingsLoaded(true);
      updateContinuityLabSnapshot({
        orgLabSettings: detail.settings,
        orgLabSlashCommands: detail.commands ?? listAllSlashCommands(detail.settings),
        orgLabSettingsLoaded: true,
      });
    }
    window.addEventListener(LAB_CONTINUITY_LAB_SETTINGS_CHANGED_EVENT, onOrgSettingsChanged);
    return () =>
      window.removeEventListener(LAB_CONTINUITY_LAB_SETTINGS_CHANGED_EVENT, onOrgSettingsChanged);
  }, []);

  useEffect(() => {
    if (isContinuityLabSnapshotFresh()) {
      const deferred = window.setTimeout(() => void refresh(), 1000);
      const timer = window.setInterval(() => void refresh(), 300_000);
      return () => {
        window.clearTimeout(deferred);
        window.clearInterval(timer);
      };
    }
    void refresh();
    const timer = window.setInterval(() => void refresh(), 300_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let closed = false;
    let debounce: number | null = null;

    async function connectEventStream() {
      const token = await getOrCreateMemoryToken();
      if (!token || closed) return;
      eventSource = new EventSource(`/api/connector/events?token=${encodeURIComponent(token)}`);
      eventSource.onmessage = () => {
        if (debounce) window.clearTimeout(debounce);
        debounce = window.setTimeout(() => void refresh(), 5000);
      };
      eventSource.onerror = () => {
        eventSource?.close();
        if (!closed) window.setTimeout(() => void connectEventStream(), 15000);
      };
    }

    void connectEventStream();
    return () => {
      closed = true;
      if (debounce) window.clearTimeout(debounce);
      eventSource?.close();
    };
  }, [refresh]);

  const getStarted = useMemo(
    () =>
      deriveGetStartedProgress({
        funnel,
        connector,
        modelReady,
        hasSessions: sessions.length > 0,
      }),
    [funnel, connector, modelReady, sessions.length],
  );

  const value = useMemo(
    (): ContinuityLabContextValue => ({
      funnel,
      connector,
      connectorBackendOffline,
      sessions,
      getStarted,
      modelReady,
      canStartSession: modelReady,
      sidebarOpen,
      setSidebarOpen,
      companyModelModalOpen,
      openCompanyModelModal,
      closeCompanyModelModal,
      refresh,
      refreshCompanyModel,
      orgLabSettings,
      orgLabSlashCommands,
      orgLabSettingsLoaded,
      refreshOrgLabSettings,
    }),
    [
      funnel,
      connector,
      connectorBackendOffline,
      sessions,
      getStarted,
      modelReady,
      sidebarOpen,
      companyModelModalOpen,
      openCompanyModelModal,
      closeCompanyModelModal,
      refresh,
      refreshCompanyModel,
      orgLabSettings,
      orgLabSlashCommands,
      orgLabSettingsLoaded,
      refreshOrgLabSettings,
    ],
  );

  return (
    <ContinuityLabContext.Provider value={value}>{children}</ContinuityLabContext.Provider>
  );
}

export function useContinuityLab() {
  const ctx = useContext(ContinuityLabContext);
  if (!ctx) {
    throw new Error("useContinuityLab must be used within ContinuityLabProvider");
  }
  return ctx;
}
