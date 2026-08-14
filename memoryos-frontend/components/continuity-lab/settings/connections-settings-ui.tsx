"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  ChevronDown,
  Lightbulb,
  Plus,
  X,
} from "lucide-react";
import { subtlePanel } from "@/components/continuity-lab/continuity-lab-section-ui";
import {
  ContinuityLabSettingsSectionFrame,
} from "@/components/continuity-lab/settings/continuity-lab-settings-shell";
import {
  SettingsCard,
  SettingsIntegrationRow,
  SettingsSearchInput,
  SettingsTabPills,
  SettingsToolbar,
} from "@/components/continuity-lab/settings/continuity-lab-settings-ui";
import {
  SettingsIntegrationIcon,
  type SettingsIntegrationId,
} from "@/components/continuity-lab/connector-brand-icons";
import { McpBrandIcon } from "@/components/continuity-lab/brand-icons/mcp-brand-registry";
import {
  connectionsSettingsHref,
  CUSTOM_MCP_NEW_PATH,
  type ConnectionsSettingsTab,
} from "@/lib/continuity-lab/connections-settings-urls";
import {
  authorizeConnector,
  disconnectConnector,
} from "@/lib/continuity-lab/connector-actions";
import {
  appendMcpSuggestion,
  MCP_CATEGORY_LABELS,
  MCP_INSTALL_FILTERS,
  setMcpInstalled,
  type McpCatalogCategory,
  type McpCatalogEntry,
  type McpInstallFilter,
} from "@/lib/continuity-lab/mcp-catalog-storage";
import {
  isIntegrationConnected,
  useLiveConnectors,
} from "@/lib/continuity-lab/use-live-connectors";
import { useMcpCatalog } from "@/lib/continuity-lab/use-mcp-catalog";
import { cn } from "@/lib/utils";

const DEV_CONSOLE_CONNECTORS_HREF = "/mission-control?tab=Connectors";

const CATEGORY_OPTIONS: { id: McpCatalogCategory | "all"; label: string }[] = [
  { id: "all", label: "All categories" },
  ...(
    Object.entries(MCP_CATEGORY_LABELS) as [McpCatalogCategory, string][]
  ).map(([id, label]) => ({ id, label })),
];

function tabFromQuery(value: string | null): ConnectionsSettingsTab {
  return value === "mcps" ? "mcps" : "integrations";
}

export function ConnectionsSettingsSection() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = tabFromQuery(searchParams.get("tab"));
  const returnTo = searchParams.get("returnTo")?.trim() || null;
  const suggestOpen = searchParams.get("suggest") === "1";
  const { totalCount: mcpServerCount } = useMcpCatalog();
  const liveConnectors = useLiveConnectors();
  const integrationsConnectedCount = useMemo(
    () => countConnectedIntegrations(liveConnectors.list, liveConnectors.github),
    [liveConnectors.list, liveConnectors.github],
  );

  const setTab = useCallback(
    (next: ConnectionsSettingsTab) => {
      router.replace(connectionsSettingsHref({ tab: next, returnTo: returnTo ?? undefined }));
    },
    [router, returnTo],
  );

  const openSuggest = useCallback(() => {
    router.replace(
      connectionsSettingsHref({
        tab: "mcps",
        suggest: true,
        returnTo: returnTo ?? undefined,
      }),
    );
  }, [router, returnTo]);

  const closeSuggest = useCallback(() => {
    router.replace(connectionsSettingsHref({ tab: "mcps", returnTo: returnTo ?? undefined }));
  }, [router, returnTo]);

  return (
    <ContinuityLabSettingsSectionFrame sectionId="connections">
      {returnTo ? (
        <Link
          href={returnTo}
          className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-300 hover:text-indigo-200"
        >
          <ArrowLeft className="size-3.5" />
          Back
        </Link>
      ) : null}
      <SettingsToolbar className="mb-6">
        <SettingsTabPills
          tabs={[
            {
              id: "integrations" as const,
              label: "Integrations",
              count: liveConnectors.loading ? undefined : integrationsConnectedCount,
            },
            { id: "mcps" as const, label: "MCP servers", count: mcpServerCount },
          ]}
          active={tab}
          onChange={setTab}
        />
      </SettingsToolbar>
      {tab === "mcps" ? (
        <McpServersTab onSuggest={openSuggest} />
      ) : (
        <ConnectionsIntegrationsPanel liveConnectors={liveConnectors} />
      )}
      {suggestOpen ? <McpSuggestModal onClose={closeSuggest} /> : null}
    </ContinuityLabSettingsSectionFrame>
  );
}

function McpServersTab({ onSuggest }: { onSuggest: () => void }) {
  const { entries: catalog, refresh, installedCount } = useMcpCatalog();
  const [search, setSearch] = useState("");
  const [installFilter, setInstallFilter] = useState<McpInstallFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<McpCatalogCategory | "all">("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!filterRef.current?.contains(e.target as Node)) setFilterOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalog.filter((entry) => {
      if (installFilter === "installed" && !entry.installed) return false;
      if (installFilter === "not_installed" && entry.installed) return false;
      if (categoryFilter !== "all" && entry.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        entry.name.toLowerCase().includes(q) ||
        entry.description.toLowerCase().includes(q) ||
        MCP_CATEGORY_LABELS[entry.category].toLowerCase().includes(q)
      );
    });
  }, [catalog, search, installFilter, categoryFilter]);

  const recommended = filtered.filter((e) => e.recommended);
  const allServers = filtered;

  const filterLabel =
    installFilter === "all"
      ? "All"
      : installFilter === "installed"
        ? "Installed"
        : "Not installed";

  function toggleInstall(id: string) {
    const entry = catalog.find((e) => e.id === id);
    if (!entry) return;
    setMcpInstalled(id, !entry.installed);
    refresh();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2">
        <SettingsSearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search MCP servers"
          className="min-w-[220px] max-w-md flex-1"
        />
        <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-medium text-white/45">
          {installedCount} installed
        </span>
        <div className="relative" ref={filterRef}>
          <button
            type="button"
            onClick={() => setFilterOpen((o) => !o)}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-white/[0.08] bg-[#111111] px-3 text-sm text-white/80 hover:border-white/15"
          >
            {filterLabel}
            <ChevronDown className="size-3.5 text-white/40" />
          </button>
          {filterOpen ? (
            <div className="absolute left-0 top-full z-30 mt-1 min-w-[200px] rounded-md border border-white/[0.08] bg-[#141416] py-1 shadow-xl">
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-white/35">
                Status
              </p>
              {MCP_INSTALL_FILTERS.map((id) => {
                const label =
                  id === "all" ? "All" : id === "installed" ? "Installed" : "Not installed";
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setInstallFilter(id);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-white/80 hover:bg-white/[0.04]"
                  >
                    {label}
                    {installFilter === id ? (
                      <Check className="size-3.5 text-white/60" />
                    ) : null}
                  </button>
                );
              })}
              <div className="my-1 border-t border-white/[0.06]" />
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-white/35">
                Category
              </p>
              {CATEGORY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setCategoryFilter(opt.id);
                  }}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-white/80 hover:bg-white/[0.04]"
                >
                  {opt.label}
                  {categoryFilter === opt.id ? (
                    <Check className="size-3.5 text-white/60" />
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onSuggest}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-white/[0.08] bg-transparent px-3.5 text-sm font-medium text-white/85 hover:bg-white/[0.04]"
        >
          <Lightbulb className="size-3.5 text-white/50" />
          Suggest
        </button>
        <Link
          href={CUSTOM_MCP_NEW_PATH}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-indigo-500 px-3.5 text-sm font-medium text-white hover:bg-indigo-400"
        >
          <Plus className="size-3.5" />
          Add a custom MCP
        </Link>
      </div>

      {recommended.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-white">Recommended</h2>
          <McpServerGrid entries={recommended} onToggleInstall={toggleInstall} />
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-white">All servers</h2>
        {allServers.length === 0 ? (
          <p className={cn(subtlePanel(), "px-4 py-8 text-center text-sm text-white/45")}>
            No MCP servers match your filters.
          </p>
        ) : (
          <McpServerGrid entries={allServers} onToggleInstall={toggleInstall} />
        )}
      </section>
    </div>
  );
}

function McpServerGrid({
  entries,
  onToggleInstall,
}: {
  entries: McpCatalogEntry[];
  onToggleInstall: (id: string) => void;
}) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {entries.map((entry) => (
        <li key={entry.id}>
          <McpServerCard entry={entry} onToggleInstall={() => onToggleInstall(entry.id)} />
        </li>
      ))}
    </ul>
  );
}

function McpServerCard({
  entry,
  onToggleInstall,
}: {
  entry: McpCatalogEntry;
  onToggleInstall: () => void;
}) {
  return (
    <article
      className={cn(
        subtlePanel(),
        "flex h-full flex-col p-4 transition hover:border-white/[0.1]",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-white/[0.08] bg-[#0A0A0A]">
          <McpBrandIcon
            id={entry.id}
            className="size-5"
            fallbackLabel={entry.iconLabel ?? entry.name.slice(0, 2).toUpperCase()}
          />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-sm font-semibold text-white">{entry.name}</h3>
            {entry.verified ? (
              <BadgeCheck className="size-3.5 shrink-0 text-sky-400" aria-label="Verified" />
            ) : null}
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/45">
            {entry.description}
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        {!entry.installed ? (
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-white/50">
            Not installed
          </span>
        ) : (
          <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium text-emerald-200">
            Installed
          </span>
        )}
        <button
          type="button"
          onClick={onToggleInstall}
          className="text-xs font-semibold text-indigo-300 hover:text-indigo-200"
        >
          {entry.installed ? "Disable" : "Install"}
        </button>
      </div>
    </article>
  );
}

function McpSuggestModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [docsUrl, setDocsUrl] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const maxDesc = 500;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    appendMcpSuggestion({
      name: name.trim(),
      docsUrl: docsUrl.trim(),
      description: description.trim().slice(0, maxDesc),
    });
    setSubmitted(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mcp-suggest-title"
    >
      <div className="w-full max-w-md rounded-md bg-[#141416] p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="mcp-suggest-title" className="text-lg font-semibold text-white">
              Suggest MCP Integration
            </h2>
            <p className="mt-1 text-xs text-white/45">
              We review suggestions and add popular integrations to the catalog.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-white/50 hover:bg-white/[0.06] hover:text-white"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {submitted ? (
          <div className="space-y-4">
            <p className="text-sm text-emerald-200/90">Thanks — your suggestion was saved locally.</p>
            <button
              type="button"
              onClick={onClose}
              className="h-9 w-full rounded-md bg-white text-sm font-medium text-[#0A0A0A] hover:bg-white/90"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-white/70">Name</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 w-full rounded-md border border-white/[0.08] bg-[#0A0A0A] px-3 text-sm text-white placeholder:text-white/35 focus:border-white/20 focus:outline-none"
                placeholder="e.g. Airtable"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-white/70">Documentation Link</span>
              <input
                type="url"
                value={docsUrl}
                onChange={(e) => setDocsUrl(e.target.value)}
                className="h-9 w-full rounded-md border border-white/[0.08] bg-[#0A0A0A] px-3 text-sm text-white placeholder:text-white/35 focus:border-white/20 focus:outline-none"
                placeholder="https://…"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="flex items-center justify-between text-xs font-medium text-white/70">
                Description
                <span className="text-white/35">
                  {description.length}/{maxDesc}
                </span>
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, maxDesc))}
                rows={4}
                className="w-full resize-none rounded-md border border-white/[0.08] bg-[#0A0A0A] px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-white/20 focus:outline-none"
                placeholder="What should this integration do?"
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="h-9 rounded-md border border-white/[0.08] px-4 text-sm font-medium text-white/80 hover:bg-white/[0.04]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-9 rounded-md bg-white px-4 text-sm font-medium text-[#0A0A0A] hover:bg-white/90"
              >
                Submit suggestion
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

type IntegrationRowDef = {
  id: SettingsIntegrationId;
  name: string;
  connectorType?: string;
  stub?: boolean;
};

const INTEGRATION_SECTIONS: { title: string; rows: IntegrationRowDef[] }[] = [
  {
    title: "Git providers",
    rows: [
      { id: "github", name: "GitHub", connectorType: "github" },
      { id: "gitlab", name: "GitLab", stub: true },
      { id: "bitbucket", name: "Bitbucket", stub: true },
    ],
  },
  {
    title: "Communication",
    rows: [
      { id: "slack", name: "Slack", connectorType: "slack" },
      { id: "teams", name: "Teams", stub: true },
    ],
  },
  {
    title: "Task management",
    rows: [
      { id: "linear", name: "Linear", stub: true },
      { id: "jira", name: "Jira", connectorType: "jira" },
    ],
  },
];

function countConnectedIntegrations(
  connectorList: ReturnType<typeof useLiveConnectors>["list"],
  github: ReturnType<typeof useLiveConnectors>["github"],
): number {
  return INTEGRATION_SECTIONS.flatMap((section) => section.rows).filter((row) =>
    isIntegrationConnected(row, connectorList, github),
  ).length;
}

function IntegrationConfigureDrawer({
  row,
  connected,
  detail,
  busy,
  error,
  onClose,
  onConnect,
  onDisconnect,
}: {
  row: IntegrationRowDef;
  connected: boolean;
  detail?: string;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const { name, id: integrationId, stub, connectorType } = row;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" role="dialog" aria-modal="true">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-white/[0.08] bg-[#0F0F10] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-white/[0.08] bg-[#0A0A0A]">
              <SettingsIntegrationIcon id={integrationId} className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-white">{name}</h2>
              {detail ? <p className="truncate text-xs text-white/45">{detail}</p> : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-white/50 hover:bg-white/[0.06] hover:text-white"
            aria-label="Close panel"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {stub ? (
            <p className="text-sm text-white/50">
              {name} is not available yet. We will add this provider in a future release.
            </p>
          ) : connected ? (
            <p className="text-sm text-white/50">
              {name} is connected for your organization. OAuth completes via Mission Control
              callback; sync and advanced settings live there too.
            </p>
          ) : (
            <p className="text-sm text-white/50">
              Connect {name} to ingest memories and power agent sessions. You will be redirected to
              complete OAuth, then returned to Mission Control.
            </p>
          )}
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            {!stub && connectorType && !connected ? (
              <button
                type="button"
                disabled={busy}
                onClick={onConnect}
                className="inline-flex h-9 items-center rounded-md bg-white px-4 text-sm font-medium text-[#0A0A0A] hover:bg-white/90 disabled:opacity-60"
              >
                {busy ? "Redirecting…" : `Connect ${name}`}
              </button>
            ) : null}
            {!stub && connectorType && connected ? (
              <button
                type="button"
                disabled={busy}
                onClick={onDisconnect}
                className="inline-flex h-9 items-center rounded-md border border-red-500/40 px-4 text-sm font-medium text-red-300 hover:bg-red-500/10 disabled:opacity-60"
              >
                {busy ? "Disconnecting…" : "Disconnect"}
              </button>
            ) : null}
            <Link
              href={DEV_CONSOLE_CONNECTORS_HREF}
              className="inline-flex h-9 items-center rounded-md border border-white/[0.08] px-4 text-sm font-medium text-white/85 hover:bg-white/[0.04]"
            >
              Mission Control
            </Link>
          </div>
          {integrationId === "github" && connected ? (
            <Link
              href="/continuity-lab/wiki"
              className="block text-sm font-medium text-indigo-300 hover:text-indigo-200"
            >
              Open wiki repositories →
            </Link>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function ConnectionsIntegrationsPanel({
  liveConnectors,
}: {
  liveConnectors: ReturnType<typeof useLiveConnectors>;
}) {
  const { list: connectorList, loading, reload, github } = liveConnectors;
  const [drawer, setDrawer] = useState<IntegrationRowDef | null>(null);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function isRowConnected(row: IntegrationRowDef): boolean {
    return isIntegrationConnected(row, connectorList, github);
  }

  function rowDetail(row: IntegrationRowDef, connected: boolean): string | undefined {
    if (row.stub) return "Coming soon";
    if (row.id === "github" && connected && github.profile?.login) {
      return `@${github.profile.login}`;
    }
    if (connected) return "Connected";
    return undefined;
  }

  async function connectRow(row: IntegrationRowDef) {
    if (!row.connectorType || row.stub) return;
    setActionError(null);
    setAction(row.id);
    try {
      await authorizeConnector(row.connectorType);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : `Could not connect ${row.name}.`);
      setAction(null);
    }
  }

  async function disconnectRow(row: IntegrationRowDef) {
    if (!row.connectorType || row.stub) return;
    setActionError(null);
    setAction(row.id);
    try {
      await disconnectConnector(row.connectorType);
      await reload();
      if (drawer?.id === row.id) setDrawer(null);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : `Could not disconnect ${row.name}.`,
      );
    } finally {
      setAction(null);
    }
  }

  function openRow(row: IntegrationRowDef) {
    setActionError(null);
    if (row.stub) {
      setDrawer(row);
      return;
    }
    const connected = isRowConnected(row);
    if (connected) {
      setDrawer(row);
      return;
    }
    void connectRow(row);
  }

  const q = search.trim().toLowerCase();
  const sections = INTEGRATION_SECTIONS.map((section) => ({
    ...section,
    rows: section.rows.filter((row) => {
      if (!q) return true;
      return row.name.toLowerCase().includes(q);
    }),
  })).filter((section) => section.rows.length > 0);

  const connectedCount = countConnectedIntegrations(connectorList, github);

  const busy = action !== null;

  const content = (
    <div className="space-y-8">
      <SettingsToolbar>
        <SettingsSearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search integrations"
          className="max-w-md"
        />
        <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-medium text-white/45">
          {loading ? "…" : `${connectedCount} connected`}
        </span>
      </SettingsToolbar>

      {actionError && !drawer ? (
        <p className="text-xs text-red-400">{actionError}</p>
      ) : null}

      {sections.map((section) => (
        <section key={section.title}>
          <h2 className="mb-2 text-sm font-semibold text-white">{section.title}</h2>
          <div className={cn(subtlePanel(), "divide-y divide-white/[0.06] overflow-hidden")}>
            {section.rows.map((row) => {
              const connected = isRowConnected(row);
              const detail = rowDetail(row, connected);
              const actionLabel = row.stub
                ? undefined
                : connected
                  ? "Configure"
                  : "Connect";
              return (
                <SettingsIntegrationRow
                  key={row.id}
                  borderless
                  icon={<SettingsIntegrationIcon id={row.id} className="size-5" />}
                  name={row.name}
                  detail={detail}
                  badge={row.stub ? "Coming soon" : undefined}
                  connected={row.stub ? undefined : connected}
                  disabled={busy && action === row.id}
                  actionLabel={actionLabel}
                  actionDisabled={busy}
                  onActionClick={
                    row.stub
                      ? undefined
                      : connected
                        ? () => setDrawer(row)
                        : () => void connectRow(row)
                  }
                  onClick={() => openRow(row)}
                />
              );
            })}
          </div>
        </section>
      ))}

      {sections.length === 0 ? (
        <p className={cn(subtlePanel(), "px-4 py-8 text-center text-sm text-white/45")}>
          No integrations match your search.
        </p>
      ) : null}

      <p className="text-xs text-white/40">
        GitHub, Slack, and Jira use OAuth through the Mission Control callback. GitLab, Bitbucket,
        Microsoft Teams, and Linear are not available yet.
      </p>
    </div>
  );

  return (
    <>
      {content}
      {drawer ? (
        <IntegrationConfigureDrawer
          row={drawer}
          connected={isRowConnected(drawer)}
          detail={rowDetail(drawer, isRowConnected(drawer))}
          busy={busy}
          error={actionError}
          onClose={() => {
            setDrawer(null);
            setActionError(null);
          }}
          onConnect={() => void connectRow(drawer)}
          onDisconnect={() => void disconnectRow(drawer)}
        />
      ) : null}
    </>
  );
}

