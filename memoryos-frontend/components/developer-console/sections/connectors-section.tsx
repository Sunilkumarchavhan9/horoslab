"use client";

import { useState, useEffect, useMemo } from "react";

type ConnectorPlan = "Free" | "Scale";
type ConnectorStatus = "connected" | "not_connected" | "pending";
type HealthStatus = "good" | "watch" | "error" | "offline";

type ConnectorRow = {
  id: string;
  name: string;
  purpose: string;
  plan: ConnectorPlan;
  status: ConnectorStatus;
  health: HealthStatus;
  records: number;
  lastSync: string;
  primary?: boolean;
  category: string;
  description: string;
};

const INITIAL_CONNECTORS: ConnectorRow[] = [
  {
    id: "github",
    name: "GitHub",
    purpose: "Best for developer continuity: PRs, issues, repo decisions, bug history",
    description: "PRs, issues, commits, repo decisions",
    plan: "Free",
    status: "not_connected",
    health: "offline",
    records: 0,
    lastSync: "Never",
    primary: true,
    category: "Recommended",
  },
  {
    id: "local-files",
    name: "Local Files",
    purpose: "Import markdown/json context from local workspace",
    description: "Markdown, JSON, workspace context",
    plan: "Free",
    status: "connected",
    health: "good",
    records: 96,
    lastSync: "Just now",
    category: "Recommended",
  },
  {
    id: "notion",
    name: "Notion",
    purpose: "Product notes, specs, and team decisions",
    description: "Docs, Specs, and Team decisions",
    plan: "Free",
    status: "not_connected",
    health: "offline",
    records: 0,
    lastSync: "Never",
    category: "Knowledge Sources",
  },
  {
    id: "google-drive",
    name: "Google Drive",
    purpose: "Shared documents and project specs",
    description: "Shared documents and project specs",
    plan: "Scale",
    status: "not_connected",
    health: "offline",
    records: 0,
    lastSync: "Requires Scale plan",
    category: "Knowledge Sources",
  },
  {
    id: "onedrive",
    name: "OneDrive",
    purpose: "Enterprise docs and shared folders",
    description: "Enterprise docs and shared folders",
    plan: "Scale",
    status: "not_connected",
    health: "offline",
    records: 0,
    lastSync: "Requires Scale plan",
    category: "Knowledge Sources",
  },
  {
    id: "gmail",
    name: "Gmail",
    purpose: "Email threads and follow-up context",
    description: "Email threads and follow-up context",
    plan: "Scale",
    status: "not_connected",
    health: "offline",
    records: 0,
    lastSync: "Requires Scale plan",
    category: "Communication",
  },
  {
    id: "web-crawler",
    name: "Web Crawler",
    purpose: "Capture public docs and release notes",
    description: "Capture public docs and release notes",
    plan: "Scale",
    status: "not_connected",
    health: "offline",
    records: 0,
    lastSync: "Requires Scale plan",
    category: "Advanced",
  },
  {
    id: "amazon-s3",
    name: "Amazon S3",
    purpose: "Import knowledge snapshots from object storage",
    description: "Import knowledge snapshots from object storage",
    plan: "Scale",
    status: "not_connected",
    health: "offline",
    records: 0,
    lastSync: "Requires Scale plan",
    category: "Advanced",
  },
];

const EXTRACTS = [
  {
    source: "GitHub",
    items: ["PR decisions", "Open bugs", "Architecture changes", "Repo ownership", "TODO patterns"],
  },
  {
    source: "Local Files",
    items: ["Project goals", "Stack decisions", "API contracts", "Roadmap notes"],
  },
];

const INITIAL_ACTIVITY = [
  { time: "12:41 PM", message: "Local Files synced", status: "success" },
  { time: "12:41 PM", message: "96 records indexed", status: "info" },
  { time: "12:42 PM", message: "23 memories extracted", status: "success" },
  { time: "12:42 PM", message: "Agent context refreshed", status: "info" },
];

export function ConnectorsSection({ 
  liveMemoryCount = 0, 
  liveRequestCount = 0 
}: { 
  liveMemoryCount?: number; 
  liveRequestCount?: number;
}) {
  const [connectors, setConnectors] = useState<ConnectorRow[]>(INITIAL_CONNECTORS);
  const [activity, setActivity] = useState(INITIAL_ACTIVITY);
  const [internalRecords, setInternalRecords] = useState(0);

  const connectedCount = connectors.filter((connector) => connector.status === "connected").length;
  const totalRecords = (liveMemoryCount || 96) + internalRecords;
  const githubConnected = connectors.find((c) => c.id === "github")?.status === "connected";
// Simulation Engine removed for real implementation
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const connectedType = urlParams.get("connected");

  if (connectedType) {
    addActivity(
      `${connectedType.charAt(0).toUpperCase() + connectedType.slice(1)} connected successfully!`,
      "success",
    );

    // Clean up URL
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname + (window.location.hash || ""),
    );
  }
}, []);

  // Fetch real connector status from backend
  useEffect(() => {
  // Fetch real connector status from backend
  async function loadConnectors() {
    try {
      const token = localStorage.getItem("memoryos.apiToken");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MEMORYOS_API_ORIGIN || ""}/api/connector`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const { data } = await response.json();
        const dbConnectors = data.connectors || [];

        setConnectors((prev) =>
          prev.map((c) => {
            const dbMatch = dbConnectors.find(
              (dbc: any) => dbc.type === c.id.replace("-", "_"),
            );

            if (dbMatch) {
              return {
                ...c,
                status: dbMatch.status as ConnectorStatus,
                records: dbMatch.recordCount,
                lastSync: dbMatch.lastSyncAt
                  ? new Date(dbMatch.lastSyncAt).toLocaleString()
                  : "Never",
              };
            }

            return c;
          }),
        );
      }
    } catch (err) {
      console.error("Failed to load real connectors:", err);
    }
  }

  loadConnectors();
}, [liveMemoryCount]);

async function connectConnector(connectorId: string) {
  const typeMap: Record<string, string> = {
    github: "github",
    notion: "notion",
    "google-drive": "google_drive",
    onedrive: "onedrive",
  };

  const type = typeMap[connectorId];
  if (!type) return;

  if (type === "github" || type === "notion") {
    const apiOrigin =
      process.env.NEXT_PUBLIC_MEMORYOS_API_ORIGIN === "same-origin"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_MEMORYOS_API_ORIGIN || "";

    window.location.href = `${apiOrigin}/api/connector/${type}/authorize`;
    return;
  }

  setConnectors((current) =>
    current.map((connector) =>
      connector.id === connectorId
        ? { ...connector, status: "pending" as const }
        : connector,
    ),
  );

  try {
    const token = localStorage.getItem("memoryos.apiToken");

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_MEMORYOS_API_ORIGIN || ""}/api/connector/${type}/sync`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Sync failed");
    }

    const data = await response.json();
    const extractedCount = data?.data?.extractedCount ?? 0;

    setConnectors((current) =>
      current.map((connector) =>
        connector.id === connectorId
          ? {
              ...connector,
              status: "connected",
              health: "good",
              records:
                connector.records > 0
                  ? connector.records + extractedCount
                  : 128 + extractedCount,
              lastSync: "Just now",
            }
          : connector,
      ),
    );

    const connectorName =
      connectors.find((c) => c.id === connectorId)?.name || connectorId;

    addActivity(
      `${connectorName} connected and synced ${extractedCount} memories`,
      "success",
    );
  } catch (error) {
    console.error("Failed to connect connector:", error);

    setConnectors((current) =>
      current.map((connector) =>
        connector.id === connectorId
          ? {
              ...connector,
              status: "not_connected",
              health: "error",
            }
          : connector,
      ),
    );

    addActivity(`Failed to connect ${connectorId}`, "error");
  }
}

function disconnectConnector(connectorId: string) {
  setConnectors((current) =>
    current.map((connector) =>
      connector.id === connectorId
        ? {
            ...connector,
            status: "not_connected",
            health: "offline",
            records: connector.plan === "Scale" ? 0 : connector.records,
            lastSync:
              connector.plan === "Scale"
                ? "Requires Scale plan"
                : "Disconnected",
          }
        : connector,
    ),
  );

  addActivity(`${connectorId} disconnected`, "info");
}

function addActivity(message: string, status: string = "info") {
  const now = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  setActivity((prev) => [{ time: now, message, status }, ...prev].slice(0, 10));
}

  const categories = ["Recommended", "Knowledge Sources", "Communication", "Advanced"];

  return (
    <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-500">
      {/* Page Title & Positioning */}
      <div>
        <h1 className="text-[24px] font-bold tracking-[-0.04em] text-white">Data Sources</h1>
        <p className="mt-1.5 text-[14px] leading-relaxed text-white/50 max-w-2xl">
          Connect the tools your agents use every day and turn them into long-term developer memory. 
          MemoryOS indexes issues, docs, commits, messages, and local context so agents can continue work with full project awareness.
        </p>
      </div>

      {/* Hero Overview Card */}
      <div className="relative overflow-hidden rounded-[4px] border border-white/10 bg-[#0a0a0a] p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(79,147,255,0.08),transparent_50%)]" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
            <h2 className="text-[14px] font-semibold uppercase tracking-[0.1em] text-white/40">Memory Ingestion Overview</h2>
            <div className="flex flex-wrap gap-8">
              <div>
                <p className="text-[24px] font-bold text-white">{totalRecords}</p>
                <p className="text-[11px] uppercase tracking-[0.05em] text-white/40">records indexed</p>
              </div>
              <div>
                <p className="text-[24px] font-bold text-white">{connectedCount}</p>
                <p className="text-[11px] uppercase tracking-[0.05em] text-white/40">active sources</p>
              </div>
              <div>
                <p className="text-[24px] font-bold text-white">0</p>
                <p className="text-[11px] uppercase tracking-[0.05em] text-white/40">failed syncs</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              {!githubConnected && (
                <button 
                  onClick={() => connectConnector("github")}
                  className="rounded-[4px] bg-[#4f93ff] px-4 py-1.5 text-[12px] font-bold text-white hover:bg-[#3d7ee6] transition-colors"
                >
                  Connect GitHub
                </button>
              )}
              <button 
                className="rounded-[4px] border border-white/10 bg-white/5 px-4 py-1.5 text-[12px] font-bold text-white hover:bg-white/10 transition-colors"
                onClick={() => addActivity("Manual sync triggered", "success")}
              >
                Run Sync
              </button>
              <button className="rounded-[4px] border border-white/10 bg-white/5 px-4 py-1.5 text-[12px] font-bold text-white hover:bg-white/10 transition-colors">
                View Ingestion Logs
              </button>
            </div>
          </div>

          {/* Mini Live Feed inside Hero */}
          <div className="w-full md:w-64 rounded-[4px] border border-white/5 bg-black/40 p-4">
            <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.1em] text-white/30 flex items-center gap-2">
              <span className="flex h-1.5 w-1.5 rounded-full bg-[#14c38e] animate-pulse"></span>
              Live Memory Feed
            </h3>
            <div className="space-y-2.5">
              {activity.slice(0, 4).map((item, i) => (
                <div key={i} className="flex gap-2 text-[11px]">
                  <span className="text-[#14c38e] shrink-0">✓</span>
                  <span className="text-white/70 truncate">{item.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Grid Section */}
        <div className="lg:col-span-2 space-y-10">
          {categories.map((category) => (
            <div key={category} className="space-y-4">
              <h2 className="text-[12px] font-bold uppercase tracking-[0.15em] text-white/30 px-1">{category}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {connectors
                  .filter((c) => c.category === category)
                  .map((connector) => (
                    <div 
                      key={connector.id} 
                      className={`group relative flex flex-col justify-between rounded-[4px] border p-5 transition-all duration-300 ${
                        connector.status === "connected" 
                          ? "border-[#14c38e]/30 bg-[#14c38e]/[0.02] shadow-[0_0_20px_-12px_rgba(20,195,142,0.3)]" 
                          : "border-white/10 bg-[#0a0a0a] hover:border-white/20"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-[16px] font-bold text-white">{connector.name}</h3>
                          <div className="flex items-center gap-2">
                            <span 
                              className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                                connector.plan === "Free" ? "border-[#4f93ff]/30 text-[#4f93ff] bg-[#4f93ff]/5" : "border-[#f0b429]/30 text-[#f0b429] bg-[#f0b429]/5"
                              }`}
                            >
                              {connector.plan}
                            </span>
                            {connector.status === "connected" && (
                              <div className="h-2 w-2 rounded-full bg-[#14c38e] shadow-[0_0_8px_#14c38e]" />
                            )}
                          </div>
                        </div>
                        <p className="text-[12px] text-white/50 leading-relaxed mb-6">
                          {connector.description}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-white/30 uppercase tracking-wider">Status</span>
                          <span className={`font-medium ${connector.status === "connected" ? "text-[#14c38e]" : "text-white/40"}`}>
                            {connector.status === "connected" ? "Active" : "Not connected"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-white/30 uppercase tracking-wider">Records</span>
                          <span className="text-white font-mono">{connector.records}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-white/30 uppercase tracking-wider">Last Sync</span>
                          <span className="text-white/60">{connector.lastSync}</span>
                        </div>

                        <div className="pt-4 flex gap-2">
                          {connector.plan === "Scale" && connector.status === "not_connected" ? (
                            <button className="flex-1 rounded-[4px] border border-[#f0b429]/30 bg-[#f0b429]/10 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#f4d287] hover:bg-[#f0b429]/20 transition-colors">
                              Upgrade to Connect
                            </button>
                          ) : connector.status === "connected" ? (
                            <>
                              <button 
                                onClick={() => addActivity(`${connector.name} sync triggered`, "success")}
                                className="flex-1 rounded-[4px] bg-white/5 border border-white/10 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-colors"
                              >
                                Sync Now
                              </button>
                              <button 
                                onClick={() => disconnectConnector(connector.id)}
                                className="px-3 rounded-[4px] bg-white/5 border border-white/10 text-white/30 hover:text-white/80 transition-colors"
                              >
                                ✕
                              </button>
                            </>
                          ) : (
                            <button 
                              onClick={() => connectConnector(connector.id)}
                              className="flex-1 rounded-[4px] bg-[#4f93ff]/10 border border-[#4f93ff]/30 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#8bb5ff] hover:bg-[#4f93ff]/20 transition-colors"
                            >
                              Connect {connector.name}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Sections */}
        <div className="space-y-8">
          {/* Recommended Next Action */}
          <div className="rounded-[4px] border border-[#f0b429]/30 bg-[#f0b429]/[0.02] p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#f0b429]/5 rounded-full -mr-12 -mt-12 blur-2xl" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f0b429] mb-4">Recommended Next</h3>
            {!githubConnected ? (
              <>
                <h4 className="text-[18px] font-bold text-white mb-2">Connect GitHub</h4>
                <p className="text-[13px] text-white/60 leading-relaxed mb-6">
                  Your local workspace is indexed, but MemoryOS cannot yet understand PRs, issues, commits, or repo decisions.
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-[12px] text-white/80">
                    <span className="text-[#14c38e]">+</span> Better agent handoffs
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-white/80">
                    <span className="text-[#14c38e]">+</span> Repo-aware planning
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-white/80">
                    <span className="text-[#14c38e]">+</span> Bug history memory
                  </div>
                </div>
                <button 
                  onClick={() => connectConnector("github")}
                  className="w-full rounded-[4px] bg-[#f0b429] py-2 text-[12px] font-bold text-black hover:bg-[#d9a321] transition-colors"
                >
                  Connect GitHub
                </button>
              </>
            ) : (
              <>
                <h4 className="text-[18px] font-bold text-white mb-2">Configure Notion</h4>
                <p className="text-[13px] text-white/60 leading-relaxed mb-6">
                  Connect Notion to give your agents access to product specs, meeting notes, and team decisions.
                </p>
                <button 
                  onClick={() => connectConnector("notion")}
                  className="w-full rounded-[4px] bg-[#f0b429] py-2 text-[12px] font-bold text-black hover:bg-[#d9a321] transition-colors"
                >
                  Connect Notion
                </button>
              </>
            )}
          </div>

          {/* Live Activity Timeline */}
          <div className="rounded-[4px] border border-white/10 bg-[#0a0a0a] overflow-hidden">
            <div className="border-b border-white/10 bg-white/[0.02] px-5 py-4">
              <h3 className="text-[12px] font-bold uppercase tracking-widest text-white/80">Recent Ingestion Activity</h3>
            </div>
            <div className="p-5 space-y-4">
              {activity.map((item, i) => (
                <div key={i} className="relative pl-5 border-l border-white/10 pb-4 last:pb-0">
                  <div className={`absolute left-[-5px] top-1 h-2 w-2 rounded-full ${item.status === 'success' ? 'bg-[#14c38e]' : 'bg-[#4f93ff]'}`} />
                  <div className="flex justify-between items-baseline mb-0.5">
                    <p className="text-[12px] font-medium text-white/90">{item.message}</p>
                    <span className="text-[10px] font-mono text-white/30">{item.time}</span>
                  </div>
                </div>
              ))}
              {activity.length === 0 && (
                <p className="text-[12px] text-white/30 italic">No recent activity</p>
              )}
            </div>
          </div>

          {/* Memory Extraction Panel */}
          <div className="rounded-[4px] border border-white/10 bg-[#0a0a0a] p-6">
            <h3 className="text-[12px] font-bold uppercase tracking-widest text-white/80 mb-6 flex items-center justify-between">
              What MemoryOS extracts
              <span className="h-1.5 w-1.5 rounded-full bg-[#14c38e]" />
            </h3>
            <div className="space-y-8">
              {EXTRACTS.map((extract) => (
                <div key={extract.source} className="space-y-3">
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#4f93ff]">{extract.source}</h4>
                  <ul className="space-y-2">
                    {extract.items.map((item, i) => (
                      <li key={i} className="text-[12px] text-white/60 flex items-center gap-2">
                        <span className="text-white/20">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

