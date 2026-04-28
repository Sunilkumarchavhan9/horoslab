"use client";

import { useState } from "react";

type ConnectorPlan = "Free" | "Scale";
type ConnectorStatus = "connected" | "not_connected";

type ConnectorRow = {
  id: string;
  name: string;
  purpose: string;
  plan: ConnectorPlan;
  status: ConnectorStatus;
  records: number;
  lastSync: string;
  primary?: boolean;
};

const INITIAL_CONNECTORS: ConnectorRow[] = [
  {
    id: "github",
    name: "GitHub",
    purpose: "Best for developer continuity: PRs, issues, repo decisions, bug history",
    plan: "Free",
    status: "not_connected",
    records: 0,
    lastSync: "Never",
    primary: true,
  },
  {
    id: "notion",
    name: "Notion",
    purpose: "Product notes, specs, and team decisions",
    plan: "Free",
    status: "not_connected",
    records: 0,
    lastSync: "Never",
  },
  {
    id: "local-files",
    name: "Local Files",
    purpose: "Import markdown/json context from local workspace",
    plan: "Free",
    status: "connected",
    records: 96,
    lastSync: "Just now",
  },
  {
    id: "google-drive",
    name: "Google Drive",
    purpose: "Shared documents and project specs",
    plan: "Scale",
    status: "not_connected",
    records: 0,
    lastSync: "Requires Scale plan",
  },
  {
    id: "gmail",
    name: "Gmail",
    purpose: "Email threads and follow-up context",
    plan: "Scale",
    status: "not_connected",
    records: 0,
    lastSync: "Requires Scale plan",
  },
  {
    id: "onedrive",
    name: "OneDrive",
    purpose: "Enterprise docs and shared folders",
    plan: "Scale",
    status: "not_connected",
    records: 0,
    lastSync: "Requires Scale plan",
  },
  {
    id: "web-crawler",
    name: "Web Crawler",
    purpose: "Capture public docs and release notes",
    plan: "Scale",
    status: "not_connected",
    records: 0,
    lastSync: "Requires Scale plan",
  },
  {
    id: "amazon-s3",
    name: "Amazon S3",
    purpose: "Import knowledge snapshots from object storage",
    plan: "Scale",
    status: "not_connected",
    records: 0,
    lastSync: "Requires Scale plan",
  },
];

function toneForStatus(status: ConnectorStatus) {
  return status === "connected" ? "#14c38e" : "#9aa6b8";
}

export function ConnectorsSection() {
  const [connectors, setConnectors] = useState<ConnectorRow[]>(INITIAL_CONNECTORS);

  const connectedCount = connectors.filter((connector) => connector.status === "connected").length;
  const totalRecords = connectors.reduce((sum, connector) => sum + connector.records, 0);
  const primaryConnected = connectors.some((connector) => connector.primary && connector.status === "connected");

  function connectConnector(connectorId: string) {
    setConnectors((current) =>
      current.map((connector) =>
        connector.id === connectorId
          ? {
              ...connector,
              status: "connected",
              records: connector.records > 0 ? connector.records : 128,
              lastSync: "Just now",
            }
          : connector,
      ),
    );
  }

  function disconnectConnector(connectorId: string) {
    setConnectors((current) =>
      current.map((connector) =>
        connector.id === connectorId
          ? {
              ...connector,
              status: "not_connected",
              records: connector.plan === "Scale" ? 0 : connector.records,
              lastSync: connector.plan === "Scale" ? "Requires Scale plan" : "Disconnected",
            }
          : connector,
      ),
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[16px] font-semibold tracking-[-0.04em] sm:text-[18px]">Connectors</h1>
          <p className="mt-1 text-[12px] leading-6 text-white/46 sm:text-[13px]">
            Connect external data sources to feed MemoryOS continuity memory automatically.
          </p>
        </div>
      </div>

      <div className="mt-2.5 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[10px] border border-white/10 bg-[#161616] px-3.5 py-3" style={{ borderTopColor: "#4f93ff", borderTopWidth: "2px" }}>
          <p className="text-[10px] uppercase tracking-[0.1em] text-white/36">Connected connectors</p>
          <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em]">{connectedCount}</p>
        </div>
        <div className="rounded-[10px] border border-white/10 bg-[#161616] px-3.5 py-3" style={{ borderTopColor: "#14c38e", borderTopWidth: "2px" }}>
          <p className="text-[10px] uppercase tracking-[0.1em] text-white/36">Primary connector</p>
          <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em]">
            {primaryConnected ? "GitHub connected" : "Connect GitHub"}
          </p>
        </div>
        <div className="rounded-[10px] border border-white/10 bg-[#161616] px-3.5 py-3" style={{ borderTopColor: "#9b7bff", borderTopWidth: "2px" }}>
          <p className="text-[10px] uppercase tracking-[0.1em] text-white/36">Indexed records</p>
          <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em]">{totalRecords}</p>
        </div>
        <div className="rounded-[10px] border border-white/10 bg-[#161616] px-3.5 py-3" style={{ borderTopColor: "#f0b429", borderTopWidth: "2px" }}>
          <p className="text-[10px] uppercase tracking-[0.1em] text-white/36">Recommended now</p>
          <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em]">GitHub</p>
        </div>
      </div>

      <div className="mt-2.5 overflow-x-auto rounded-[10px] border border-white/10 bg-[#151515]">
        <table className="min-w-full divide-y divide-white/10">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.1em] text-white/34">
              <th className="px-3 py-2.5">Connector</th>
              <th className="px-3 py-2.5">Purpose</th>
              <th className="px-3 py-2.5">Plan</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5">Records</th>
              <th className="px-3 py-2.5">Last sync</th>
              <th className="px-3 py-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/8">
            {connectors.map((connector) => (
              <tr key={connector.id} className="text-[12px]">
                <td className="px-3 py-2.5">
                  <p className="font-semibold text-white/82">{connector.name}</p>
                  {connector.primary ? (
                    <span className="mt-1 inline-block rounded-[6px] border border-[#4f93ff]/35 bg-[#4f93ff]/8 px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-[#8bb5ff]">
                      primary
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2.5 text-white/56">{connector.purpose}</td>
                <td className="px-3 py-2.5">
                  <span
                    className="rounded-[6px] border px-2 py-0.5 text-[10px] uppercase tracking-[0.1em]"
                    style={{
                      borderColor: connector.plan === "Free" ? "#4f93ff55" : "#f0b42955",
                      color: connector.plan === "Free" ? "#8bb5ff" : "#f4d287",
                      background: connector.plan === "Free" ? "#4f93ff14" : "#f0b42914",
                    }}
                  >
                    {connector.plan}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className="rounded-[6px] border px-2 py-0.5 text-[10px] uppercase tracking-[0.1em]"
                    style={{
                      borderColor: `${toneForStatus(connector.status)}55`,
                      color: toneForStatus(connector.status),
                      background: `${toneForStatus(connector.status)}14`,
                    }}
                  >
                    {connector.status === "connected" ? "connected" : "not connected"}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-white/62">{connector.records}</td>
                <td className="px-3 py-2.5 text-white/46">{connector.lastSync}</td>
                <td className="px-3 py-2.5 text-right">
                  {connector.plan === "Scale" ? (
                    <button
                      type="button"
                      className="rounded-[7px] border border-[#f0b429]/35 bg-[#2a1f0b] px-2.5 py-1 text-[10px] tracking-[0.08em] text-[#f4d287]"
                    >
                      UPGRADE
                    </button>
                  ) : connector.status === "connected" ? (
                    <button
                      type="button"
                      onClick={() => disconnectConnector(connector.id)}
                      className="rounded-[7px] border border-white/10 bg-[#0f0f0f] px-2.5 py-1 text-[10px] tracking-[0.08em] text-white/60"
                    >
                      DISCONNECT
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => connectConnector(connector.id)}
                      className="rounded-[7px] border border-[#4f93ff]/30 bg-[#4f93ff]/8 px-2.5 py-1 text-[10px] tracking-[0.08em] text-[#8bb5ff]"
                    >
                      CONNECT
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
