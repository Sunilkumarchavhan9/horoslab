"use client";

import { useState } from "react";

type PermissionMode = "full" | "scoped";

type ApiKeyRecord = {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsed: string;
  expires: string;
  mode: PermissionMode;
  status: "active" | "revoked";
  endpoints: string[];
  contentTag: string;
  requests24h: number;
};

const KEY_EXPIRY_OPTIONS = ["30 days", "90 days", "1 year", "Never"] as const;
const KEY_ENDPOINTS = [
  "retrieve",
  "resume",
  "continue",
  "handoff",
  "memory_add",
  "memory_update",
  "memory_delete",
  "search",
] as const;

const NAME_FRAGMENTS_A = ["rapid", "clear", "stable", "sharp", "steady", "trusted"] as const;
const NAME_FRAGMENTS_B = ["resume", "handoff", "memory", "context", "agent", "thread"] as const;
const NAME_FRAGMENTS_C = ["key", "token", "access", "bridge", "scope", "sync"] as const;

const AUDIT_EVENTS = [
  { event: "Scoped key template created", at: "Today 09:12", tone: "#4f93ff" },
  { event: "Rotation policy updated to 90 days", at: "Yesterday 19:43", tone: "#14c38e" },
  { event: "Access denied for missing endpoint scope", at: "Yesterday 15:06", tone: "#f0b429" },
];

function randomName() {
  const a = NAME_FRAGMENTS_A[Math.floor(Math.random() * NAME_FRAGMENTS_A.length)];
  const b = NAME_FRAGMENTS_B[Math.floor(Math.random() * NAME_FRAGMENTS_B.length)];
  const c = NAME_FRAGMENTS_C[Math.floor(Math.random() * NAME_FRAGMENTS_C.length)];
  return `${a}-${b}-${c}`;
}

function randomTokenPrefix() {
  return `mkey_${Math.random().toString(36).slice(2, 8)}`;
}

function randomLiveToken() {
  return `mkey_live_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 8)}`;
}

function toneForMode(mode: PermissionMode) {
  return mode === "full" ? "#f0b429" : "#14c38e";
}

function toneForStatus(status: ApiKeyRecord["status"]) {
  return status === "active" ? "#14c38e" : "#ff6d6d";
}

export function ApiKeysSection() {
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [keyName, setKeyName] = useState(randomName);
  const [expires, setExpires] = useState<(typeof KEY_EXPIRY_OPTIONS)[number]>("1 year");
  const [permissionMode, setPermissionMode] = useState<PermissionMode>("full");
  const [contentTag, setContentTag] = useState("continuity");
  const [selectedEndpoints, setSelectedEndpoints] = useState<string[]>(["retrieve", "resume", "handoff"]);
  const [revealedToken, setRevealedToken] = useState<string | null>(null);

  const activeKeys = keys.filter((key) => key.status === "active");
  const scopedCount = keys.filter((key) => key.mode === "scoped").length;
  const fullCount = keys.filter((key) => key.mode === "full").length;
  const totalRequests24h = keys.reduce((sum, key) => sum + key.requests24h, 0);

  function openCreateModal() {
    setShowCreateModal(true);
    setKeyName(randomName());
  }

  function closeCreateModal() {
    setShowCreateModal(false);
  }

  function toggleEndpoint(endpoint: string) {
    setSelectedEndpoints((current) =>
      current.includes(endpoint) ? current.filter((item) => item !== endpoint) : [...current, endpoint],
    );
  }

  function createKey() {
    const normalizedName = keyName.trim();
    if (!normalizedName) return;

    const prefix = randomTokenPrefix();
    const liveToken = randomLiveToken();
    const endpoints = permissionMode === "full" ? [...KEY_ENDPOINTS] : selectedEndpoints;
    const record: ApiKeyRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: normalizedName,
      prefix,
      createdAt: "Just now",
      lastUsed: "Never",
      expires,
      mode: permissionMode,
      status: "active",
      endpoints,
      contentTag: permissionMode === "scoped" ? contentTag.trim() || "continuity" : "all",
      requests24h: 0,
    };

    setKeys((current) => [record, ...current]);
    setRevealedToken(liveToken);
    setShowCreateModal(false);
  }

  async function copyToken() {
    if (!revealedToken) return;
    try {
      await navigator.clipboard.writeText(revealedToken);
    } catch {
      // best effort copy
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[16px] font-semibold tracking-[-0.04em] sm:text-[18px]">API Keys</h1>
          <p className="mt-1 text-[12px] leading-6 text-white/46 sm:text-[13px]">
            Create and manage secure keys for retrieve, resume, continue, and handoff APIs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-[8px] border border-[#4f93ff]/30 bg-[#4f93ff]/8 px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] text-[#8bb5ff]"
          >
            + CREATE KEY
          </button>
          <button
            type="button"
            className="rounded-[8px] border border-white/10 bg-[#111111] px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] text-white/62"
          >
            ROTATION POLICY
          </button>
        </div>
      </div>

      {revealedToken ? (
        <div className="mt-2.5 rounded-[10px] border border-[#4f93ff]/30 bg-[#4f93ff]/8 px-3.5 py-3.5">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#8bb5ff]">Copy now</p>
          <p className="mt-1 text-[12px] text-white/70">
            This key is shown once. Copy and store it securely in your secrets manager.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="rounded-[7px] border border-white/10 bg-[#0f0f0f] px-2.5 py-1.5 text-[11px] text-white/72">
              {revealedToken}
            </code>
            <button
              type="button"
              onClick={copyToken}
              className="rounded-[7px] border border-white/12 bg-[#1c1c1c] px-2.5 py-1.5 text-[11px] font-medium text-white/74"
            >
              COPY
            </button>
            <button
              type="button"
              onClick={() => setRevealedToken(null)}
              className="rounded-[7px] border border-white/12 bg-[#1c1c1c] px-2.5 py-1.5 text-[11px] font-medium text-white/74"
            >
              I SAVED IT
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-2.5 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[10px] border border-white/10 bg-[#161616] px-3.5 py-3" style={{ borderTopColor: "#14c38e", borderTopWidth: "2px" }}>
          <p className="text-[10px] uppercase tracking-[0.1em] text-white/36">Active keys</p>
          <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em]">{activeKeys.length}</p>
        </div>
        <div className="rounded-[10px] border border-white/10 bg-[#161616] px-3.5 py-3" style={{ borderTopColor: "#9b7bff", borderTopWidth: "2px" }}>
          <p className="text-[10px] uppercase tracking-[0.1em] text-white/36">Scoped keys</p>
          <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em]">{scopedCount}</p>
        </div>
        <div className="rounded-[10px] border border-white/10 bg-[#161616] px-3.5 py-3" style={{ borderTopColor: "#f0b429", borderTopWidth: "2px" }}>
          <p className="text-[10px] uppercase tracking-[0.1em] text-white/36">Full-access keys</p>
          <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em]">{fullCount}</p>
        </div>
        <div className="rounded-[10px] border border-white/10 bg-[#161616] px-3.5 py-3" style={{ borderTopColor: "#4f93ff", borderTopWidth: "2px" }}>
          <p className="text-[10px] uppercase tracking-[0.1em] text-white/36">24h requests</p>
          <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em]">{totalRequests24h}</p>
        </div>
      </div>

      <div className="mt-2.5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="rounded-[10px] border border-white/10 bg-[#161616] px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="7.5" cy="4" r="2.5" /><path d="M5 6.5L1.5 10v.5H3l.5-.5V9h1.5" />
              </svg>
              Key Inventory
            </p>
            <span className="text-[11px] text-white/38">{keys.length} total</span>
          </div>

          {keys.length === 0 ? (
            <div className="mt-3 grid min-h-[260px] place-items-center rounded-[10px] border border-dashed border-white/12 bg-[#101010] text-center">
              <div className="max-w-[360px] px-4">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-white/10 text-white/28">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="15" cy="8" r="4.5" />
                    <path d="M10.5 12.5l-7.5 7.5v1.5H5l.5-.5V20h2.5l.5-.5V18h1.5" />
                  </svg>
                </div>
                <h2 className="mt-3 text-[28px] font-semibold tracking-[-0.04em]">No API keys yet</h2>
                <p className="mt-2 text-[13px] leading-6 text-white/46">
                  Create your first key to run MemoryOS APIs programmatically from apps, agents, and MCP tools.
                </p>
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-3 rounded-[8px] border border-[#4f93ff]/30 bg-[#4f93ff]/8 px-3.5 py-2 text-[11px] font-medium tracking-[0.08em] text-[#8bb5ff]"
                >
                  + CREATE KEY
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3 space-y-2.5">
              {keys.map((key) => (
                <div key={key.id} className="rounded-[8px] border border-white/10 bg-[#111111] px-3.5 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-[13px] font-semibold tracking-[-0.02em]">{key.name}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-white/44">{key.prefix}••••••••••••</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="rounded-[6px] border px-2 py-0.5 text-[10px] uppercase tracking-[0.1em]"
                        style={{
                          borderColor: `${toneForMode(key.mode)}55`,
                          color: toneForMode(key.mode),
                          background: `${toneForMode(key.mode)}14`,
                        }}
                      >
                        {key.mode}
                      </span>
                      <span
                        className="rounded-[6px] border px-2 py-0.5 text-[10px] uppercase tracking-[0.1em]"
                        style={{
                          borderColor: `${toneForStatus(key.status)}55`,
                          color: toneForStatus(key.status),
                          background: `${toneForStatus(key.status)}14`,
                        }}
                      >
                        {key.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 grid gap-2 text-[11px] text-white/46 sm:grid-cols-4">
                    <p>Created: {key.createdAt}</p>
                    <p>Last used: {key.lastUsed}</p>
                    <p>Expires: {key.expires}</p>
                    <p>24h req: {key.requests24h}</p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {key.endpoints.slice(0, 6).map((endpoint) => (
                      <span key={endpoint} className="rounded-[6px] border border-white/10 bg-[#111111] px-2 py-1 text-[10px] text-white/58">
                        {endpoint}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="rounded-[10px] border border-white/10 bg-[#161616] px-4 py-4">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1.5 3L4 5.5 1.5 8M5.5 8.5h4" />
              </svg>
              Quickstart
            </p>
            <pre className="mt-2.5 overflow-x-auto rounded-[8px] border border-white/10 bg-[#0f0f0f] p-3 text-[11px] leading-6 text-white/72">
              <code>{`export MEMORYOS_API_KEY="mkey_live_..."

curl -X POST "$MEMORYOS_BASE_URL/v1/retrieve" \\
  -H "Authorization: Bearer $MEMORYOS_API_KEY" \\
  -H "Content-Type: application/json"`}</code>
            </pre>
          </div>

          <div className="rounded-[10px] border border-white/10 bg-[#161616] px-4 py-4">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1.5 3h8M1.5 5.5h8M1.5 8h5" />
              </svg>
              Audit Feed
            </p>
            <div className="mt-2.5 space-y-2">
              {AUDIT_EVENTS.map((event) => (
                <div key={event.event} className="rounded-[8px] border border-white/10 bg-[#111111] px-3 py-2.5">
                  <div className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: event.tone }} />
                    <div>
                      <p className="text-[12px] text-white/74">{event.event}</p>
                      <p className="mt-1 text-[11px] text-white/38">{event.at}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showCreateModal ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-[560px] overflow-hidden rounded-[12px] border border-white/12 bg-[#1c1c1c] shadow-[0_30px_90px_rgba(0,0,0,0.5)]">
            <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-4">
              <div>
                <h2 className="text-[24px] font-semibold tracking-[-0.04em]">Create New API Key</h2>
                <p className="mt-1 text-[13px] text-white/48">
                  Configure access for MemoryOS retrieve, resume, continue, and handoff flows.
                </p>
              </div>
              <button type="button" onClick={closeCreateModal} className="text-[18px] text-white/38">
                ×
              </button>
            </div>

            <div className="space-y-4 px-4 py-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-white/38">Key Name</p>
                <input
                  value={keyName}
                  onChange={(event) => setKeyName(event.target.value)}
                  placeholder="helpful-context-key"
                  className="mt-1.5 w-full rounded-[8px] border border-white/12 bg-[#111111] px-3 py-2.5 text-[13px] outline-none ring-[#4f93ff]/45 focus:ring-1"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-white/38">Expires</p>
                  <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                    {KEY_EXPIRY_OPTIONS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setExpires(option)}
                        className={`rounded-[7px] border px-2.5 py-2 text-[11px] transition ${
                          expires === option
                            ? "border-[#4f93ff]/45 bg-[#4f93ff]/8 text-[#8bb5ff]"
                            : "border-white/10 bg-[#111111] text-white/58 hover:border-white/20"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-white/38">Permissions</p>
                  <div className="mt-1.5 flex items-center overflow-hidden rounded-[8px] border border-white/10 bg-[#101010]">
                    <button
                      type="button"
                      onClick={() => setPermissionMode("full")}
                      className={`flex-1 px-3 py-2 text-[12px] font-medium transition ${
                        permissionMode === "full" ? "bg-[#1f1f1f] text-white" : "text-white/42"
                      }`}
                    >
                      Full Access
                    </button>
                    <button
                      type="button"
                      onClick={() => setPermissionMode("scoped")}
                      className={`flex-1 px-3 py-2 text-[12px] font-medium transition ${
                        permissionMode === "scoped" ? "bg-[#1f1f1f] text-white" : "text-white/42"
                      }`}
                    >
                      Scoped
                    </button>
                  </div>
                </div>
              </div>

              {permissionMode === "scoped" ? (
                <>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-white/38">Content Tag</p>
                    <input
                      value={contentTag}
                      onChange={(event) => setContentTag(event.target.value)}
                      placeholder="continuity"
                      className="mt-1.5 w-full rounded-[8px] border border-white/12 bg-[#111111] px-3 py-2.5 text-[13px] outline-none ring-[#4f93ff]/45 focus:ring-1"
                    />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-white/38">Allowed Endpoints</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {KEY_ENDPOINTS.map((endpoint) => {
                        const selected = selectedEndpoints.includes(endpoint);
                        return (
                          <button
                            key={endpoint}
                            type="button"
                            onClick={() => toggleEndpoint(endpoint)}
                            className={`rounded-[7px] border px-2.5 py-1.5 text-[11px] transition ${
                              selected
                                ? "border-[#4f93ff]/45 bg-[#4f93ff]/8 text-[#8bb5ff]"
                                : "border-white/10 bg-[#111111] text-white/56 hover:border-white/20"
                            }`}
                          >
                            {endpoint}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-[8px] border border-[#f0b429]/25 bg-[#2a1f0b] px-3 py-2 text-[12px] text-[#f4d287]">
                  This key grants full access to all MemoryOS endpoints. Use scoped keys in production where possible.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-white/10 px-4 py-3">
              <button
                type="button"
                onClick={closeCreateModal}
                className="rounded-[8px] border border-white/10 bg-[#111111] px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] text-white/62"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={!keyName.trim() || (permissionMode === "scoped" && selectedEndpoints.length === 0)}
                onClick={createKey}
                className="rounded-[8px] border border-[#4f93ff]/30 bg-[#4f93ff]/8 px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] text-[#8bb5ff] disabled:cursor-not-allowed disabled:opacity-50"
              >
                CREATE KEY
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
