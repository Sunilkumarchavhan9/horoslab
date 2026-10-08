"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DitherBackground } from "@/components/ui/dither-background";
import { EASE_OUT } from "@/lib/motion";
import { getOrCreateMemoryToken } from "@/lib/memory-token";

type PermissionMode = "full" | "scoped";

type ApiKeyRecord = {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  mode: PermissionMode;
  status: "active" | "revoked";
  endpoints: string[];
  contentTag: string;
  requests24h: number;
};

type ApiKeysListResponse = {
  keys: ApiKeyRecord[];
};

type ApiKeyCreateResponse = {
  token: string;
  key: ApiKeyRecord;
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

const DEFAULT_API_ORIGIN =
  process.env.NEXT_PUBLIC_MEMORYOS_API_ORIGIN?.trim() ||
  process.env.NEXT_PUBLIC_MEMORYOS_API_BASE_URL?.trim() ||
  "http://localhost:3001";

function normalizeApiOrigin(origin: string): string {
  return origin === "same-origin" ? "" : origin.replace(/\/+$/, "");
}

function randomName() {
  const a = NAME_FRAGMENTS_A[Math.floor(Math.random() * NAME_FRAGMENTS_A.length)];
  const b = NAME_FRAGMENTS_B[Math.floor(Math.random() * NAME_FRAGMENTS_B.length)];
  const c = NAME_FRAGMENTS_C[Math.floor(Math.random() * NAME_FRAGMENTS_C.length)];
  return `${a}-${b}-${c}`;
}

function toneForMode(mode: PermissionMode) {
  return mode === "full" ? "#f0b429" : "#14c38e";
}

function formatDate(value: string | null): string {
  if (!value) return "Never";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Unknown";
  return date.toLocaleString([], {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function fetchApiKeys<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getOrCreateMemoryToken();
  if (!token) {
    throw new Error("Sign in first so MemoryOS can mint your console token.");
  }

  const response = await fetch(`${normalizeApiOrigin(DEFAULT_API_ORIGIN)}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof (payload as { error?: unknown }).error === "string"
        ? (payload as { error: string }).error
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

function toneForStatus(status: ApiKeyRecord["status"]) {
  return status === "active" ? "#14c38e" : "#ff6d6d";
}

export function ApiKeysSection(props: any) {
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [keyName, setKeyName] = useState(randomName);
  const [expires, setExpires] = useState<(typeof KEY_EXPIRY_OPTIONS)[number]>("1 year");
  const [permissionMode, setPermissionMode] = useState<PermissionMode>("full");
  const [contentTag, setContentTag] = useState("continuity");
  const [selectedEndpoints, setSelectedEndpoints] = useState<string[]>(["retrieve", "resume", "handoff"]);
  const [revealedToken, setRevealedToken] = useState<string | null>(null);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeKeys = keys.filter((key) => key.status === "active");
  const scopedCount = keys.filter((key) => key.mode === "scoped").length;
  const fullCount = keys.filter((key) => key.mode === "full").length;
  const totalRequests24h = keys.reduce((sum, key) => sum + key.requests24h, 0);

  async function loadKeys() {
    setErrorMessage(null);
    try {
      const response = await fetchApiKeys<ApiKeysListResponse>("/api/memory/api-keys");
      setKeys(response.keys);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load API keys.");
    } finally {
      setIsLoadingKeys(false);
    }
  }

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

  useEffect(() => {
    let cancelled = false;
    setIsLoadingKeys(true);
    void (async () => {
      if (!cancelled) await loadKeys();
    })();

    const interval = window.setInterval(() => {
      if (!cancelled) {
        void loadKeys();
      }
    }, 8000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  async function createKey() {
    const normalizedName = keyName.trim();
    if (!normalizedName) return;

    const endpoints = permissionMode === "full" ? [...KEY_ENDPOINTS] : selectedEndpoints;
    setIsSavingKey(true);
    setErrorMessage(null);
    try {
      const response = await fetchApiKeys<ApiKeyCreateResponse>("/api/memory/api-keys", {
        method: "POST",
        body: JSON.stringify({
          name: normalizedName,
          expires,
          mode: permissionMode,
          endpoints,
          contentTag: permissionMode === "scoped" ? contentTag.trim() || "continuity" : "all",
        }),
      });
      setKeys((current) => [response.key, ...current]);
      setRevealedToken(response.token);
      setShowCreateModal(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create API key.");
    } finally {
      setIsSavingKey(false);
    }
  }

  async function revokeKey(keyId: string) {
    setErrorMessage(null);
    try {
      const response = await fetchApiKeys<{ key: ApiKeyRecord }>(`/api/memory/api-keys/${keyId}/revoke`, {
        method: "POST",
      });
      setKeys((current) => current.map((key) => (key.id === keyId ? response.key : key)));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to revoke API key.");
    }
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
      <motion.div
        className="relative overflow-hidden border border-white/10 bg-black px-4 py-4 sm:px-5"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: EASE_OUT }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(79,147,255,0.10),transparent_52%),radial-gradient(ellipse_at_bottom_left,rgba(155,123,255,0.08),transparent_52%)]" />
        <motion.div
          className="pointer-events-none absolute inset-0"
          animate={{ x: [0, 2, -2, 0], y: [0, -1, 1, 0] }}
          transition={{ duration: 9, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        >
          <DitherBackground className="h-full w-full opacity-25" accent="#4f93ff" density={0.54} cols={260} rows={72} />
        </motion.div>
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="inline-block rounded-[6px] bg-black px-2 py-1 text-[16px] font-semibold tracking-[-0.04em] sm:text-[18px]">
            API Keys
          </h1>
          <br />
          <p className="mt-1 inline-block rounded-[6px] bg-black px-2 py-1 text-[12px] leading-6 text-white/70 sm:text-[13px]">
            Create and manage secure keys for retrieve, resume, continue, and handoff APIs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            whileHover={{ y: -1, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-[8px] border border-[#4f93ff]/55 bg-[linear-gradient(180deg,#1d4ed8,#1e40af)] px-3.5 py-2 text-[11px] font-semibold tracking-[0.08em] text-white shadow-[0_8px_24px_rgba(30,64,175,0.35)] transition hover:border-[#7fb2ff] hover:shadow-[0_10px_28px_rgba(37,99,235,0.42)]"
          >
            <span aria-hidden>+</span>
             CREATE KEY
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ y: -1, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.18, ease: EASE_OUT }}
            className="inline-flex items-center gap-2 rounded-[8px] border border-white/20 bg-[#0b0b0b] px-3.5 py-2 text-[11px] font-semibold tracking-[0.08em] text-white/82 shadow-[0_6px_16px_rgba(0,0,0,0.35)]"
          >
            <span aria-hidden>↻</span>
            ROTATION POLICY
          </motion.button>
        </div>
        </div>
      </motion.div>

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

      {errorMessage ? (
        <div className="mt-2.5 rounded-[10px] border border-[#ff6d6d]/25 bg-[#2a1111] px-3.5 py-3 text-[12px] leading-5 text-[#ffb0b0]">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-2.5 grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Active keys", value: activeKeys.length, tone: "#14c38e" },
          { label: "Scoped keys", value: scopedCount, tone: "#9b7bff" },
          { label: "Full-access keys", value: fullCount, tone: "#f0b429" },
          { label: "24h requests", value: totalRequests24h, tone: "#4f93ff" },
        ].map((card) => (
          <div
            key={card.label}
            className="relative overflow-hidden rounded-[10px] border border-white/10 bg-[#0b0b0b] px-3.5 py-3"
            style={{ borderTopColor: card.tone, borderTopWidth: "2px" }}
          >
            <DitherBackground
              cols={52}
              rows={20}
              accent={card.tone}
              density={0.52}
              opacity={0.22}
              className="pointer-events-none absolute inset-0"
            />
            <p className="relative">
              <span className="inline-block rounded-[4px] bg-black px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white">
                {card.label}
              </span>
            </p>
            <p className="relative mt-1">
              <span className="inline-block rounded-[4px] bg-black px-1.5 py-0.5 text-[20px] font-semibold tracking-[-0.03em] text-white">
                {card.value}
              </span>
            </p>
          </div>
        ))}
      </div>

      <div className="mt-2.5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="rounded-[10px] border border-white/10 bg-[#0b0b0b] px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="7.5" cy="4" r="2.5" /><path d="M5 6.5L1.5 10v.5H3l.5-.5V9h1.5" />
              </svg>
              Key Inventory
            </p>
            <span className="text-[11px] text-white/38">{keys.length} total</span>
          </div>

          {isLoadingKeys ? (
            <div className="mt-3 grid min-h-[260px] place-items-center rounded-[10px] border border-dashed border-white/12 bg-[#101010] text-center text-[13px] text-white/50">
              Loading live API keys...
            </div>
          ) : keys.length === 0 ? (
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
                <div key={key.id} className="rounded-[8px] border border-white/10 bg-[#0b0b0b] px-3.5 py-3">
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
                    <p>Last used: {formatDate(key.lastUsedAt)}</p>
                    <p>Expires: {formatDate(key.expiresAt)}</p>
                    <p>24h req: {key.requests24h}</p>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {key.endpoints.slice(0, 6).map((endpoint) => (
                        <span key={endpoint} className="rounded-[6px] border border-white/10 bg-[#0b0b0b] px-2 py-1 text-[10px] text-white/58">
                          {endpoint}
                        </span>
                      ))}
                    </div>
                    {key.status === "active" ? (
                      <button
                        type="button"
                        onClick={() => void revokeKey(key.id)}
                        className="rounded-[7px] border border-[#ff6d6d]/25 bg-[#ff6d6d]/8 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-[#ff9a9a]"
                      >
                        Revoke
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="rounded-[10px] border border-white/10 bg-[#0b0b0b] px-4 py-4">
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

          <div className="rounded-[10px] border border-white/10 bg-[#0b0b0b] px-4 py-4">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/34">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1.5 3h8M1.5 5.5h8M1.5 8h5" />
              </svg>
              Audit Feed
            </p>
            <div className="mt-2.5 space-y-2">
              {keys.slice(0, 4).map((key) => (
                <div key={key.id} className="rounded-[8px] border border-white/10 bg-[#0b0b0b] px-3 py-2.5">
                  <div className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: toneForStatus(key.status) }} />
                    <div>
                      <p className="text-[12px] text-white/74">{key.status === "active" ? "API key active" : "API key revoked"}: {key.name}</p>
                      <p className="mt-1 text-[11px] text-white/38">Created {formatDate(key.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
              {keys.length === 0 ? (
                <p className="rounded-[8px] border border-white/10 bg-[#0b0b0b] px-3 py-2.5 text-[12px] text-white/44">
                  No key events yet.
                </p>
              ) : null}
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
                  className="mt-1.5 w-full rounded-[8px] border border-white/12 bg-[#0b0b0b] px-3 py-2.5 text-[13px] outline-none ring-[#4f93ff]/45 focus:ring-1"
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
                            : "border-white/10 bg-[#0b0b0b] text-white/58 hover:border-white/20"
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
                      className="mt-1.5 w-full rounded-[8px] border border-white/12 bg-[#0b0b0b] px-3 py-2.5 text-[13px] outline-none ring-[#4f93ff]/45 focus:ring-1"
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
                                : "border-white/10 bg-[#0b0b0b] text-white/56 hover:border-white/20"
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
                className="rounded-[8px] border border-white/10 bg-[#0b0b0b] px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] text-white/62"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={!keyName.trim() || (permissionMode === "scoped" && selectedEndpoints.length === 0)}
                onClick={() => void createKey()}
                className="rounded-[8px] border border-[#4f93ff]/30 bg-[#4f93ff]/8 px-3 py-1.5 text-[11px] font-medium tracking-[0.08em] text-[#8bb5ff] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSavingKey ? "CREATING..." : "CREATE KEY"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}


