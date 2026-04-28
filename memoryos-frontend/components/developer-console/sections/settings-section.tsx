"use client";

import { useMemo, useState } from "react";

type SettingsTab = "Organization" | "Advanced";
type ConnectorFilter = "All" | "OAuth" | "Services";

type ConnectorCard = {
  id: string;
  name: string;
  subtitle: string;
  type: Exclude<ConnectorFilter, "All">;
  color: string;
  status: "available" | "connected";
};

type SettingsSectionProps = {
  workspaceName: string;
  ownerName: string;
  ownerEmail: string;
  organizationId: string;
};

const CONNECTOR_FILTERS: ConnectorFilter[] = ["All", "OAuth", "Services"];

const CONNECTOR_CARDS: ConnectorCard[] = [
  {
    id: "google-drive",
    name: "Google Drive",
    subtitle: "Import files and folders from Google Drive",
    type: "OAuth",
    color: "#4285f4",
    status: "available",
  },
  {
    id: "notion",
    name: "Notion",
    subtitle: "Sync pages and databases from Notion",
    type: "OAuth",
    color: "#ffffff",
    status: "available",
  },
  {
    id: "onedrive",
    name: "OneDrive",
    subtitle: "Import documents from Microsoft OneDrive",
    type: "OAuth",
    color: "#0078d4",
    status: "available",
  },
  {
    id: "github",
    name: "GitHub",
    subtitle: "Index repositories and issues from GitHub",
    type: "OAuth",
    color: "#e6edf3",
    status: "connected",
  },
  {
    id: "s3",
    name: "Amazon S3",
    subtitle: "Connect to S3-compatible object storage",
    type: "Services",
    color: "#ff9900",
    status: "available",
  },
  {
    id: "gmail",
    name: "Gmail",
    subtitle: "Import emails and attachments from Gmail",
    type: "OAuth",
    color: "#ea4335",
    status: "available",
  },
  {
    id: "web-crawler",
    name: "Web Crawler",
    subtitle: "Crawl and index web pages",
    type: "Services",
    color: "#14c38e",
    status: "available",
  },
];

function randomOrgId() {
  return `org_${Math.random().toString(36).slice(2, 14)}`;
}

export function SettingsSection({ workspaceName, ownerName, ownerEmail, organizationId }: SettingsSectionProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("Organization");
  const [connectorFilter, setConnectorFilter] = useState<ConnectorFilter>("All");
  const [connectorSearch, setConnectorSearch] = useState("");
  const [orgName, setOrgName] = useState(workspaceName);
  const [orgContextEnabled, setOrgContextEnabled] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  const visibleConnectors = useMemo(() => {
    const query = connectorSearch.trim().toLowerCase();
    return CONNECTOR_CARDS.filter((connector) => {
      const matchesFilter = connectorFilter === "All" || connector.type === connectorFilter;
      const matchesSearch =
        query.length === 0 ||
        `${connector.name} ${connector.subtitle}`.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [connectorFilter, connectorSearch]);

  function saveOrgName() {
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 1500);
  }

  async function copyOrgId() {
    try {
      await navigator.clipboard.writeText(organizationId || randomOrgId());
    } catch {
      // best effort
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[16px] font-semibold tracking-[-0.04em] sm:text-[18px]">Settings</h1>
          <p className="mt-1 text-[12px] leading-6 text-white/46 sm:text-[13px]">
            Manage organization identity, connector credentials, and advanced workspace controls.
          </p>
        </div>
      </div>

      <div className="mt-2.5 flex items-center border-b border-white/10">
        {(["Organization", "Advanced"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-[13px] transition ${
              activeTab === tab
                ? "border-[#4f93ff] text-[#8bb5ff]"
                : "border-transparent text-white/44 hover:text-white/74"
            }`}
          >
            {tab === "Organization" && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="5" width="10" height="6" rx="1" />
                <path d="M4 5V3.5a2 2 0 014 0V5" />
                <path d="M6 7.5v1.5" />
              </svg>
            )}
            {tab === "Advanced" && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 3.5h3M7 3.5h4M4 3.5a1.5 1.5 0 003 0 1.5 1.5 0 00-3 0zM1 8.5h4M8 8.5h3M5 8.5a1.5 1.5 0 003 0 1.5 1.5 0 00-3 0z" />
              </svg>
            )}
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Organization" ? (
        <div className="mt-3 space-y-3">
          <div className="rounded-[10px] border border-white/10 bg-[#161616] px-4 py-4">
            <div className="grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)]">
              <div>
                <p className="text-[14px] font-semibold">Organization Name</p>
              </div>
              <div className="space-y-2">
                <input
                  value={orgName}
                  onChange={(event) => setOrgName(event.target.value)}
                  className="w-full rounded-[8px] border border-white/12 bg-[#101010] px-3 py-2.5 text-[13px] outline-none ring-[#4f93ff]/45 focus:ring-1"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={saveOrgName}
                    className="rounded-[7px] border border-[#4f93ff]/30 bg-[#4f93ff]/8 px-2.5 py-1.5 text-[11px] tracking-[0.08em] text-[#8bb5ff]"
                  >
                    SAVE
                  </button>
                  {showSaved ? <span className="text-[11px] text-[#8ce6c7]">Saved</span> : null}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)]">
              <div>
                <p className="text-[14px] font-semibold">Organization ID</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1 rounded-[8px] border border-white/10 bg-[#111111] px-3 py-2.5 font-mono text-[12px] text-white/62">
                  {organizationId || randomOrgId()}
                </div>
                <button
                  type="button"
                  onClick={copyOrgId}
                  className="rounded-[7px] border border-white/10 bg-[#111111] px-2.5 py-1.5 text-[11px] text-white/62"
                >
                  COPY
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)]">
              <div>
                <p className="text-[14px] font-semibold">Organization Context</p>
                <p className="mt-1 text-[12px] leading-6 text-white/44">
                  Guide how content is filtered and processed during ingestion.
                </p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setOrgContextEnabled((current) => !current)}
                  className={`rounded-[8px] border px-3 py-2 text-[11px] tracking-[0.08em] ${
                    orgContextEnabled
                      ? "border-[#14c38e]/35 bg-[#14c38e]/8 text-[#8ce6c7]"
                      : "border-white/12 bg-[#111111] text-white/62"
                  }`}
                >
                  {orgContextEnabled ? "ENABLED" : "ENABLE"}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[10px] border border-white/10 bg-[#161616] px-4 py-4">
            <p className="text-[16px] font-semibold tracking-[-0.02em]">Connector Configurations</p>
            <p className="mt-1 text-[13px] text-white/50">
              Configure custom OAuth credentials and service connections.
            </p>

            <div className="mt-3">
              <input
                value={connectorSearch}
                onChange={(event) => setConnectorSearch(event.target.value)}
                placeholder="Search connectors..."
                className="w-full rounded-[8px] border border-white/12 bg-[#101010] px-3 py-2.5 text-[13px] outline-none ring-[#4f93ff]/45 focus:ring-1"
              />
            </div>

            <div className="mt-2.5 flex items-center gap-1.5">
              {CONNECTOR_FILTERS.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setConnectorFilter(filter)}
                  className={`rounded-[7px] border px-2.5 py-1.5 text-[11px] tracking-[0.08em] ${
                    connectorFilter === filter
                      ? "border-[#4f93ff]/30 bg-[#4f93ff]/8 text-[#8bb5ff]"
                      : "border-white/10 bg-[#111111] text-white/58"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="mt-3 grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
              {visibleConnectors.map((connector) => (
                <button
                  key={connector.id}
                  type="button"
                  className="rounded-[10px] border border-white/10 bg-[#161616] px-3.5 py-3 text-left transition hover:border-white/20"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] text-[13px] font-bold"
                      style={{ background: `${connector.color}18`, color: connector.color }}
                    >
                      {connector.name.slice(0, 1)}
                    </div>
                    <span
                      className={`rounded-[6px] border px-2 py-0.5 text-[10px] tracking-[0.1em] ${
                        connector.status === "connected"
                          ? "border-[#14c38e]/35 bg-[#14c38e]/8 text-[#8ce6c7]"
                          : "border-white/10 bg-[#111111] text-white/50"
                      }`}
                    >
                      {connector.status}
                    </span>
                  </div>
                  <p className="mt-2 text-[14px] font-semibold tracking-[-0.02em]">{connector.name}</p>
                  <p className="mt-1 text-[12px] leading-6 text-white/46">{connector.subtitle}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "Advanced" ? (
        <div className="mt-3 space-y-3">
          <div className="rounded-[10px] border border-white/10 bg-[#161616] px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-[#2a2a2a] text-[20px]">
                {ownerName.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.1em] text-white/34">Name</p>
                <p className="mt-1 text-[24px] font-semibold tracking-[-0.03em]">{ownerName}</p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.1em] text-white/34">Email</p>
                <p className="mt-1 text-[14px] text-white/74">{ownerEmail}</p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.1em] text-white/34">Organization</p>
                <p className="mt-1 text-[14px] text-white/74">{workspaceName}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[10px] border border-[#ff6d6d]/30 bg-[#140d0d] px-4 py-4">
            <p className="text-[20px] font-semibold tracking-[-0.02em] text-[#ff7d7d]">Danger Zone</p>
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-[#ff6d6d]/20 bg-[#1b1010] px-3 py-2.5">
                <div>
                  <p className="text-[14px] font-semibold">Reset Organization Data</p>
                  <p className="mt-1 text-[12px] text-white/58">
                    Remove documents, memories, connections, and org settings. Billing and members stay.
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-[7px] border border-[#ff6d6d]/35 bg-[#2a1212] px-3 py-1.5 text-[11px] tracking-[0.08em] text-[#ff8f8f]"
                >
                  RESET
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-[#ff6d6d]/20 bg-[#1b1010] px-3 py-2.5">
                <div>
                  <p className="text-[14px] font-semibold">Delete Organization</p>
                  <p className="mt-1 text-[12px] text-white/58">
                    Permanently delete this organization and all of its data.
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-[7px] border border-[#ff6d6d]/35 bg-[#2a1212] px-3 py-1.5 text-[11px] tracking-[0.08em] text-[#ff8f8f]"
                >
                  DELETE
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
