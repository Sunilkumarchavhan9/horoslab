"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Braces, Eye, EyeOff, HelpCircle, Plus, Trash2, X } from "lucide-react";
import { McpBrandIcon } from "@/components/continuity-lab/brand-icons/mcp-brand-registry";
import { ContinuityLabSettingsSectionFrame } from "@/components/continuity-lab/settings/continuity-lab-settings-shell";
import {
  SettingsCard,
  SettingsFlatPanel,
  SettingsSecondaryButton,
} from "@/components/continuity-lab/settings/continuity-lab-settings-ui";
import { subtlePanel } from "@/components/continuity-lab/continuity-lab-section-ui";
import {
  CONNECTIONS_SETTINGS_PATH,
  connectionsSettingsHref,
} from "@/lib/continuity-lab/connections-settings-urls";
import {
  MCP_TRANSPORT_OPTIONS,
  newCustomMcpId,
  readMcpCatalog,
  upsertCustomMcp,
  type McpAuthType,
  type McpCatalogEntry,
  type McpSecretEntry,
  type McpTransportType,
} from "@/lib/continuity-lab/mcp-catalog-storage";
import {
  MCP_JSON_IMPORT_SAMPLE,
  parseMcpJsonImport,
  type ParsedMcpServerConfig,
} from "@/lib/continuity-lab/mcp-json-import";
import { cn } from "@/lib/utils";

type KeyValueRow = { key: string; value: string };
type HeaderRow = { name: string; value: string };

const inputClass =
  "h-9 w-full rounded-md border border-white/[0.08] bg-[#111111] px-3 text-sm text-[#F0EFE2] placeholder:text-[#F0EFE2]/35 focus:border-white/20 focus:outline-none";
const monoInputClass = cn(inputClass, "font-mono text-xs");

const bluePrimaryClass =
  "inline-flex h-9 items-center rounded-md bg-indigo-500 px-4 text-sm font-medium text-[#F0EFE2] transition hover:bg-indigo-400 disabled:opacity-60";

const AUTH_OPTIONS: { value: McpAuthType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "authorization_header", label: "Authorization header" },
  { value: "oauth", label: "OAuth" },
];

type McpSetupPreset = {
  id: string;
  name: string;
  description: string;
  category: McpCatalogEntry["category"];
  source: McpCatalogEntry["source"];
  docsUrl?: string;
  iconLabel?: string;
  transport: McpTransportType;
  serverUrl: string;
  authType: McpAuthType;
  authHeaderName?: string;
};

const MCP_SETUP_ID_ALIASES: Record<string, string> = {
  cloudflare: "cloudflare-observability",
  datadog: "datadog-api-key",
};

const MCP_SETUP_CONNECTIONS: Record<
  string,
  {
    serverUrl: string;
    authType: McpAuthType;
    authHeaderName?: string;
    docsUrl?: string;
  }
> = {
  slack: {
    serverUrl: "https://mcp.slack.com/mcp",
    authType: "oauth",
    docsUrl: "https://api.slack.com/",
  },
  notion: {
    serverUrl: "https://mcp.notion.com/mcp",
    authType: "oauth",
    docsUrl: "https://developers.notion.com/",
  },
  stripe: {
    serverUrl: "https://mcp.stripe.com/mcp",
    authType: "authorization_header",
    authHeaderName: "Authorization",
    docsUrl: "https://docs.stripe.com/",
  },
  "datadog-api-key": {
    serverUrl: "https://mcp.datadoghq.com/mcp",
    authType: "authorization_header",
    authHeaderName: "DD-API-KEY",
    docsUrl: "https://docs.datadoghq.com/",
  },
  sentry: {
    serverUrl: "https://mcp.sentry.io/mcp",
    authType: "authorization_header",
    authHeaderName: "Authorization",
    docsUrl: "https://docs.sentry.io/",
  },
  circleci: {
    serverUrl: "https://mcp.circleci.com/mcp",
    authType: "authorization_header",
    authHeaderName: "Authorization",
    docsUrl: "https://circleci.com/docs/",
  },
  "cloudflare-observability": {
    serverUrl: "https://mcp.cloudflare.com/mcp",
    authType: "oauth",
    docsUrl: "https://developers.cloudflare.com/",
  },
  metabase: {
    serverUrl: "https://mcp.metabase.com/mcp",
    authType: "authorization_header",
    authHeaderName: "Authorization",
    docsUrl: "https://www.metabase.com/docs/",
  },
  hubspot: {
    serverUrl: "https://mcp.hubspot.com/mcp",
    authType: "oauth",
    docsUrl: "https://developers.hubspot.com/docs/",
  },
  jam: {
    serverUrl: "https://mcp.jam.dev/mcp",
    authType: "authorization_header",
    authHeaderName: "Authorization",
    docsUrl: "https://jam.dev/",
  },
  asana: {
    serverUrl: "https://mcp.asana.com/mcp",
    authType: "oauth",
    docsUrl: "https://developers.asana.com/docs/",
  },
  figma: {
    serverUrl: "https://mcp.figma.com/mcp",
    authType: "oauth",
    docsUrl: "https://www.figma.com/developers/api",
  },
  sonarqube: {
    serverUrl: "https://mcp.sonarqube.com/mcp",
    authType: "authorization_header",
    authHeaderName: "Authorization",
    docsUrl: "https://docs.sonarsource.com/",
  },
  pagerduty: {
    serverUrl: "https://mcp.pagerduty.com/mcp",
    authType: "authorization_header",
    authHeaderName: "Authorization",
    docsUrl: "https://developer.pagerduty.com/",
  },
};

function normalizeMcpSetupId(raw: string | null): string {
  const key = (raw ?? "").trim().toLowerCase().replace(/_/g, "-");
  return MCP_SETUP_ID_ALIASES[key] ?? key;
}

function humanizeMcpId(id: string): string {
  return id
    .split("-")
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function resolveMcpSetupPreset(raw: string | null): McpSetupPreset | null {
  const id = normalizeMcpSetupId(raw);
  if (!id) return null;
  const catalogEntry = readMcpCatalog().entries.find((entry) => entry.id === id);
  const connection = MCP_SETUP_CONNECTIONS[id];
  if (!catalogEntry && !connection) return null;
  return {
    id,
    name: catalogEntry?.name ?? humanizeMcpId(id),
    description: catalogEntry?.description ?? `${humanizeMcpId(id)} MCP connector`,
    category: catalogEntry?.category ?? "custom",
    source: catalogEntry?.source ?? "custom",
    docsUrl: connection?.docsUrl ?? catalogEntry?.docsUrl,
    iconLabel: catalogEntry?.iconLabel,
    transport: "http",
    serverUrl: connection?.serverUrl ?? "",
    authType: connection?.authType ?? "authorization_header",
    authHeaderName: connection?.authHeaderName ?? "",
  };
}

function isRemoteTransport(transport: McpTransportType): boolean {
  return transport === "http" || transport === "sse";
}

function parseIconField(raw: string): { iconLabel?: string; iconUrl?: string } {
  const trimmed = raw.trim();
  if (!trimmed) return {};
  if (/^https?:\/\//i.test(trimmed)) return { iconUrl: trimmed };
  return { iconLabel: trimmed.slice(0, 8) };
}

function rowsToRecord(rows: KeyValueRow[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const row of rows) {
    const key = row.key.trim();
    if (key) out[key] = row.value;
  }
  return out;
}

function recordToRows(record: Record<string, string>): KeyValueRow[] {
  const entries = Object.entries(record);
  return entries.length > 0 ? entries.map(([key, value]) => ({ key, value })) : [];
}

function headersToRows(headers: { name: string; value: string }[]): HeaderRow[] {
  return headers.length > 0 ? headers.map((h) => ({ name: h.name, value: h.value })) : [];
}

function rowsToHeaders(rows: HeaderRow[]): { name: string; value: string }[] {
  return rows
    .filter((r) => r.name.trim())
    .map((r) => ({ name: r.name.trim(), value: r.value }));
}

function ImportJsonModal({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (config: ParsedMcpServerConfig) => void;
}) {
  const [jsonText, setJsonText] = useState(MCP_JSON_IMPORT_SAMPLE);
  const [error, setError] = useState<string | null>(null);

  function handleImport() {
    const result = parseMcpJsonImport(jsonText);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onImport(result.config);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-json-title"
    >
      <div className="flex w-full max-w-lg flex-col rounded-md border border-white/[0.08] bg-[#1a1a1a] shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <div>
            <h2 id="import-json-title" className="text-lg font-semibold text-[#F0EFE2]">
              Import JSON config
            </h2>
            <p className="mt-1 text-xs text-[#F0EFE2]/45">
              Paste an MCP config (Cursor, Windsurf, or MemoryOS{" "}
              <code className="text-[#F0EFE2]/60">mcpServers</code> format).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[#F0EFE2]/50 hover:bg-white/[0.06] hover:text-[#F0EFE2]"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="px-5 py-4">
          <textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setError(null);
            }}
            rows={14}
            spellCheck={false}
            className="w-full resize-y rounded-md border border-white/[0.08] bg-[#0f0f0f] px-3 py-2 font-mono text-xs leading-relaxed text-[#F0EFE2]/90 focus:border-white/20 focus:outline-none"
          />
          {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-white/[0.06] px-5 py-4">
          <SettingsSecondaryButton onClick={onClose}>Cancel</SettingsSecondaryButton>
          <button type="button" onClick={handleImport} className={bluePrimaryClass}>
            Import
          </button>
        </div>
      </div>
    </div>
  );
}

function AddSecretModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (secret: McpSecretEntry) => void;
}) {
  const [scope, setScope] = useState<"organization">("organization");
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [redacted, setRedacted] = useState(true);
  const [showValue, setShowValue] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    const trimmedKey = key.trim();
    if (!trimmedKey) {
      setError("Secret name is required.");
      return;
    }
    if (!value) {
      setError("Secret value is required.");
      return;
    }
    onSave({
      key: trimmedKey,
      value,
      scope,
      ...(note.trim() ? { note: note.trim() } : {}),
      redacted,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-secret-title"
    >
      <div className="flex w-full max-w-md flex-col rounded-md border border-white/[0.08] bg-[#1a1a1a] shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <h2 id="add-secret-title" className="text-lg font-semibold text-[#F0EFE2]">
            Add secret
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[#F0EFE2]/50 hover:bg-white/[0.06] hover:text-[#F0EFE2]"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-4 px-5 py-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#F0EFE2]/70">Scope</span>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as "organization")}
              className="h-9 w-full rounded-md border border-white/[0.08] bg-[#111111] px-3 text-sm text-[#F0EFE2] focus:border-white/20 focus:outline-none"
            >
              <option value="organization">Organization</option>
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#F0EFE2]/70">Secret name</span>
            <input
              value={key}
              onChange={(e) => {
                setKey(e.target.value);
                setError(null);
              }}
              placeholder="API_KEY"
              className={monoInputClass}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#F0EFE2]/70">Secret value</span>
            <div className="relative">
              <input
                type={showValue && !redacted ? "text" : "password"}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError(null);
                }}
                placeholder="••••••••"
                className={cn(monoInputClass, "pr-10")}
              />
              <button
                type="button"
                onClick={() => setShowValue((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#F0EFE2]/40 hover:text-[#F0EFE2]/70"
                aria-label={showValue ? "Hide value" : "Show value"}
              >
                {showValue ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#F0EFE2]/70">
              Note <span className="font-normal text-[#F0EFE2]/35">(optional)</span>
            </span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What is this secret for?"
              className={inputClass}
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md border border-white/[0.08] bg-[#111111] px-3 py-2.5">
            <span className="text-sm text-[#F0EFE2]/80">Redacted</span>
            <input
              type="checkbox"
              checked={redacted}
              onChange={(e) => setRedacted(e.target.checked)}
              className="size-4 rounded border-white/20 bg-[#0f0f0f] text-indigo-500 focus:ring-indigo-500/40"
            />
          </label>
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-white/[0.06] px-5 py-4">
          <SettingsSecondaryButton onClick={onClose}>Cancel</SettingsSecondaryButton>
          <button type="button" onClick={handleSave} className={bluePrimaryClass}>
            Save secret
          </button>
        </div>
      </div>
    </div>
  );
}

function ArgsListEditor({
  args,
  onChange,
}: {
  args: string[];
  onChange: (args: string[]) => void;
}) {
  if (args.length === 0) {
    return (
      <div className="space-y-3">
        <p className="rounded-md border border-dashed border-white/[0.08] bg-[#0f0f0f] px-4 py-6 text-center text-sm text-[#F0EFE2]/40">
          No arguments added
        </p>
        <button
          type="button"
          onClick={() => onChange([""])}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-300 hover:text-indigo-200"
        >
          <Plus className="size-3.5" />
          Add
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {args.map((arg, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={arg}
              onChange={(e) => {
                const next = [...args];
                next[i] = e.target.value;
                onChange(next);
              }}
              placeholder="Enter argument value"
              className={monoInputClass}
            />
            <button
              type="button"
              onClick={() => onChange(args.filter((_, j) => j !== i))}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-white/[0.08] text-[#F0EFE2]/45 hover:bg-white/[0.04] hover:text-[#F0EFE2]/80"
              aria-label="Remove argument"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...args, ""])}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-300 hover:text-indigo-200"
      >
        <Plus className="size-3.5" />
        Add
      </button>
    </div>
  );
}

function KeyValueListEditor({
  rows,
  onChange,
  keyPlaceholder,
  valuePlaceholder,
  valueType = "text",
  emptyMessage,
  addLabel,
}: {
  rows: KeyValueRow[];
  onChange: (rows: KeyValueRow[]) => void;
  keyPlaceholder: string;
  valuePlaceholder: string;
  valueType?: "text" | "password";
  emptyMessage: string;
  addLabel: string;
}) {
  function updateRow(index: number, patch: Partial<KeyValueRow>) {
    const next = [...rows];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed border-white/[0.08] bg-[#0f0f0f] px-4 py-6 text-center text-sm text-[#F0EFE2]/40">
          {emptyMessage}
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={row.key}
                onChange={(e) => updateRow(i, { key: e.target.value })}
                placeholder={keyPlaceholder}
                className={cn(monoInputClass, "flex-1")}
              />
              <input
                type={valueType}
                value={row.value}
                onChange={(e) => updateRow(i, { value: e.target.value })}
                placeholder={valuePlaceholder}
                className={cn(monoInputClass, "flex-[2]")}
              />
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-white/[0.08] text-[#F0EFE2]/45 hover:bg-white/[0.04] hover:text-[#F0EFE2]/80"
                aria-label="Remove row"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => onChange([...rows, { key: "", value: "" }])}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-300 hover:text-indigo-200"
      >
        <Plus className="size-3.5" />
        {addLabel}
      </button>
    </div>
  );
}

function HeaderListEditor({
  rows,
  onChange,
}: {
  rows: HeaderRow[];
  onChange: (rows: HeaderRow[]) => void;
}) {
  function updateRow(index: number, patch: Partial<HeaderRow>) {
    const next = [...rows];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed border-white/[0.08] bg-[#0f0f0f] px-4 py-6 text-center text-sm text-[#F0EFE2]/40">
          No custom headers added
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={row.name}
                onChange={(e) => updateRow(i, { name: e.target.value })}
                placeholder="Header name"
                className={cn(monoInputClass, "flex-1")}
              />
              <input
                value={row.value}
                onChange={(e) => updateRow(i, { value: e.target.value })}
                placeholder="Header value"
                className={cn(monoInputClass, "flex-[2]")}
              />
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-white/[0.08] text-[#F0EFE2]/45 hover:bg-white/[0.04] hover:text-[#F0EFE2]/80"
                aria-label="Remove header"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => onChange([...rows, { name: "", value: "" }])}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-300 hover:text-indigo-200"
      >
        <Plus className="size-3.5" />
        Add
      </button>
    </div>
  );
}

export function ContinuityLabAddCustomMcpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo")?.trim() || CONNECTIONS_SETTINGS_PATH;
  const backHref = connectionsSettingsHref({ tab: "mcps", returnTo });
  const setupPreset = useMemo(
    () => resolveMcpSetupPreset(searchParams.get("template")),
    [searchParams],
  );
  const installRedirectHref =
    setupPreset && returnTo !== CONNECTIONS_SETTINGS_PATH ? returnTo : backHref;
  const pageTitle = setupPreset ? "Set up MCP server" : "Add a custom MCP";
  const pageDescription = setupPreset
    ? `Install and enable ${setupPreset.name} for this organization`
    : "Create a custom MCP server for your organization";

  const [name, setName] = useState(() => setupPreset?.name ?? "");
  const [icon, setIcon] = useState(() => setupPreset?.iconLabel ?? "");
  const [description, setDescription] = useState(() => setupPreset?.description ?? "");
  const [transport, setTransport] = useState<McpTransportType>(
    () => setupPreset?.transport ?? "stdio",
  );
  const [command, setCommand] = useState("");
  const [args, setArgs] = useState<string[]>([]);
  const [envRows, setEnvRows] = useState<KeyValueRow[]>([]);
  const [serverUrl, setServerUrl] = useState(() => setupPreset?.serverUrl ?? "");
  const [authType, setAuthType] = useState<McpAuthType>(
    () => setupPreset?.authType ?? "none",
  );
  const [authHeaderName, setAuthHeaderName] = useState(
    () => setupPreset?.authHeaderName ?? "",
  );
  const [customHeaderRows, setCustomHeaderRows] = useState<HeaderRow[]>([]);
  const [secrets, setSecrets] = useState<McpSecretEntry[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [secretModalOpen, setSecretModalOpen] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [saving, setSaving] = useState(false);

  const transportMeta = MCP_TRANSPORT_OPTIONS.find((o) => o.value === transport);
  const remote = isRemoteTransport(transport);

  function applyImportedConfig(config: ParsedMcpServerConfig) {
    setName(config.serverName);
    setIcon(config.serverName.slice(0, 2).toUpperCase());
    setTransport(config.transport);
    setCommand(config.command ?? "");
    setArgs(config.args ?? []);
    setEnvRows(recordToRows(config.env ?? {}));
    setServerUrl(config.serverUrl ?? "");
    setAuthType(config.authType ?? "none");
    setAuthHeaderName(config.authHeaderName ?? "");
    setCustomHeaderRows(headersToRows(config.customHeaders ?? []));
    setConnectionError(null);
    setSubmitAttempted(false);
  }

  function handleInstall(e: React.FormEvent) {
    e.preventDefault();
    setSubmitAttempted(true);
    const trimmedName = name.trim();
    if (!trimmedName) return;

    if (remote) {
      const trimmedUrl = serverUrl.trim();
      if (!trimmedUrl) {
        setConnectionError("Server URL is required.");
        return;
      }
      setConnectionError(null);
    } else {
      const trimmedCommand = command.trim();
      if (!trimmedCommand) {
        setConnectionError("Command is required.");
        return;
      }
      setConnectionError(null);
    }

    setSaving(true);
    const id = setupPreset?.id ?? newCustomMcpId(trimmedName);
    const iconFields = parseIconField(icon);
    const customHeaders = rowsToHeaders(customHeaderRows);
    const authHeader = authHeaderName.trim() || "Authorization";

    upsertCustomMcp({
      id,
      name: trimmedName,
      description: description.trim() || "Custom MCP server",
      category: setupPreset?.category ?? "custom",
      installed: true,
      source: setupPreset?.source ?? "custom",
      ...(setupPreset?.docsUrl ? { docsUrl: setupPreset.docsUrl } : {}),
      ...iconFields,
      connection: remote
        ? {
            transport,
            serverUrl: serverUrl.trim(),
            authType,
            ...(authType === "authorization_header"
              ? { authHeaderName: authHeader }
              : {}),
            ...(customHeaders.length > 0 ? { customHeaders } : {}),
          }
        : {
            transport: "stdio",
            command: command.trim(),
            args: args.map((a) => a.trim()).filter(Boolean),
            env: rowsToRecord(envRows),
          },
      secrets: secrets.filter((s) => s.key.trim()),
    });

    router.push(installRedirectHref);
  }

  return (
    <ContinuityLabSettingsSectionFrame sectionId="connections">
      <Link
        href={backHref}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-[#F0EFE2]/50 hover:text-[#F0EFE2]/80"
      >
        <ArrowLeft className="size-3.5" />
        Back to connections
      </Link>

      <header className="mb-6">
        <h1 className="text-lg font-semibold text-[#F0EFE2]">{pageTitle}</h1>
        <p className="mt-1 text-sm text-[#F0EFE2]/45">{pageDescription}</p>
      </header>

      {importOpen ? (
        <ImportJsonModal onClose={() => setImportOpen(false)} onImport={applyImportedConfig} />
      ) : null}
      {secretModalOpen ? (
        <AddSecretModal
          onClose={() => setSecretModalOpen(false)}
          onSave={(secret) => setSecrets((prev) => [...prev, secret])}
        />
      ) : null}

      <form onSubmit={handleInstall} className="space-y-6">
        <div className={cn(subtlePanel(), "overflow-hidden bg-[#1a1a1a] p-5")}>
          <div className="mb-5 flex items-start justify-between gap-4">
            <span
              className="inline-flex size-12 shrink-0 items-center justify-center rounded-md border border-white/[0.08] bg-[#0f0f0f] text-lg font-semibold text-[#F0EFE2]/35"
              aria-hidden
            >
              {setupPreset ? (
                <McpBrandIcon
                  id={setupPreset.id}
                  className="size-7"
                  fallbackLabel={setupPreset.iconLabel ?? setupPreset.name.slice(0, 2)}
                />
              ) : icon.trim() ? (
                /^https?:\/\//i.test(icon.trim()) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={icon.trim()}
                    alt=""
                    className="size-8 rounded object-contain"
                  />
                ) : (
                  icon.trim().slice(0, 2)
                )
              ) : (
                <HelpCircle className="size-5 text-[#F0EFE2]/30" />
              )}
            </span>
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-white/[0.08] bg-transparent px-3.5 text-sm font-medium text-[#F0EFE2]/85 hover:bg-white/[0.04]"
            >
              <Braces className="size-3.5 text-[#F0EFE2]/50" />
              Import JSON
            </button>
          </div>

          <div className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#F0EFE2]/70">Server name</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My MCP server"
                className={inputClass}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#F0EFE2]/70">
                Icon <span className="font-normal text-[#F0EFE2]/35">(optional emoji or URL)</span>
              </span>
              <input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="🔧 or https://…"
                className={inputClass}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#F0EFE2]/70">Short description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="What does this server provide?"
                className="w-full resize-none rounded-md border border-white/[0.08] bg-[#111111] px-3 py-2 text-sm text-[#F0EFE2] placeholder:text-[#F0EFE2]/35 focus:border-white/20 focus:outline-none"
              />
            </label>
          </div>
        </div>

        <SettingsCard title="Connection">
          <SettingsFlatPanel className="py-1">
            <div className="space-y-4 py-3">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[#F0EFE2]/70">Transport type</span>
                <select
                  value={transport}
                  onChange={(e) => {
                    setTransport(e.target.value as McpTransportType);
                    setConnectionError(null);
                  }}
                  className="h-9 w-full rounded-md border border-white/[0.08] bg-[#111111] px-3 text-sm text-[#F0EFE2] focus:border-white/20 focus:outline-none"
                >
                  {MCP_TRANSPORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {transportMeta ? (
                  <p className="text-xs text-[#F0EFE2]/40">{transportMeta.description}</p>
                ) : null}
              </label>

              {remote ? (
                <>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-[#F0EFE2]/70">Server URL</span>
                    <input
                      value={serverUrl}
                      onChange={(e) => {
                        setServerUrl(e.target.value);
                        if (e.target.value.trim()) setConnectionError(null);
                      }}
                      placeholder="https://mcp.yourserver.com/mcp"
                      aria-invalid={submitAttempted && Boolean(connectionError)}
                      className={cn(
                        monoInputClass,
                        submitAttempted && connectionError
                          ? "border-red-500/60 focus:border-red-400"
                          : undefined,
                      )}
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-[#F0EFE2]/70">Authentication</span>
                    <select
                      value={authType}
                      onChange={(e) => setAuthType(e.target.value as McpAuthType)}
                      className="h-9 w-full rounded-md border border-white/[0.08] bg-[#111111] px-3 text-sm text-[#F0EFE2] focus:border-white/20 focus:outline-none"
                    >
                      {AUTH_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {authType === "authorization_header" ? (
                    <label className="block space-y-1.5">
                      <span className="text-xs font-medium text-[#F0EFE2]/70">
                        Header name{" "}
                        <span className="font-normal text-[#F0EFE2]/35">(optional)</span>
                      </span>
                      <input
                        value={authHeaderName}
                        onChange={(e) => setAuthHeaderName(e.target.value)}
                        placeholder="Authorization"
                        className={monoInputClass}
                      />
                      <p className="text-xs text-[#F0EFE2]/40">
                        Leave blank to use{" "}
                        <code className="text-[#F0EFE2]/55">Authorization</code>, or reference a
                        secret with{" "}
                        <code className="text-[#F0EFE2]/55">$SECRET_NAME</code> in the header value
                        via custom headers.
                      </p>
                    </label>
                  ) : null}
                  {authType === "oauth" ? (
                    <p className="rounded-md border border-white/[0.08] bg-[#0f0f0f] px-3 py-2 text-xs text-[#F0EFE2]/45">
                      OAuth credentials are stored locally until server-side connector auth ships.
                    </p>
                  ) : null}
                  <div>
                    <div className="mb-1">
                      <span className="text-xs font-medium text-[#F0EFE2]/70">Custom headers</span>
                    </div>
                    <p className="mb-2 text-xs text-[#F0EFE2]/40">
                      Optional headers sent with every request
                    </p>
                    <HeaderListEditor rows={customHeaderRows} onChange={setCustomHeaderRows} />
                  </div>
                </>
              ) : (
                <>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-[#F0EFE2]/70">Command</span>
                    <input
                      value={command}
                      onChange={(e) => {
                        setCommand(e.target.value);
                        if (e.target.value.trim()) setConnectionError(null);
                      }}
                      placeholder="npx"
                      aria-invalid={submitAttempted && Boolean(connectionError)}
                      className={cn(
                        monoInputClass,
                        submitAttempted && connectionError
                          ? "border-red-500/60 focus:border-red-400"
                          : undefined,
                      )}
                    />
                    <p className="text-xs text-[#F0EFE2]/40">
                      Executable to start the MCP server (e.g.{" "}
                      <code className="text-[#F0EFE2]/55">npx</code>,{" "}
                      <code className="text-[#F0EFE2]/55">node</code>,{" "}
                      <code className="text-[#F0EFE2]/55">uvx</code>).
                    </p>
                  </label>
                  <div>
                    <div className="mb-2">
                      <span className="text-xs font-medium text-[#F0EFE2]/70">Arguments</span>
                    </div>
                    <ArgsListEditor args={args} onChange={setArgs} />
                  </div>
                  <div>
                    <div className="mb-2">
                      <span className="text-xs font-medium text-[#F0EFE2]/70">
                        Environment variables
                      </span>
                    </div>
                    <KeyValueListEditor
                      rows={envRows}
                      onChange={setEnvRows}
                      keyPlaceholder="KEY"
                      valuePlaceholder="value"
                      emptyMessage="No environment variables added"
                      addLabel="Add"
                    />
                  </div>
                </>
              )}

              {submitAttempted && connectionError ? (
                <p className="text-xs text-red-400">{connectionError}</p>
              ) : null}
            </div>
          </SettingsFlatPanel>
        </SettingsCard>

        <SettingsCard title="Secrets">
          <p className="text-xs text-[#F0EFE2]/45">
            Store sensitive values as secrets and reference them in env or headers as{" "}
            <code className="rounded bg-white/[0.06] px-1 font-mono text-[11px] text-[#F0EFE2]/70">
              $SECRET_NAME
            </code>
            . Values are kept in this browser until server-side storage ships.
          </p>
          <SettingsFlatPanel className="mt-3 py-1">
            <div className="space-y-3 py-3">
              {secrets.length === 0 ? (
                <p className="rounded-md border border-dashed border-white/[0.08] bg-[#0f0f0f] px-4 py-6 text-center text-sm text-[#F0EFE2]/40">
                  No secrets added
                </p>
              ) : (
                <ul className="space-y-2">
                  {secrets.map((secret, i) => (
                    <li
                      key={`${secret.key}-${i}`}
                      className="flex items-center gap-3 rounded-md border border-white/[0.08] bg-[#0f0f0f] px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-xs font-medium text-[#F0EFE2]/85">
                          {secret.key}
                        </p>
                        <p className="truncate font-mono text-[11px] text-[#F0EFE2]/40">
                          {secret.redacted !== false ? "••••••••" : secret.value}
                        </p>
                        {secret.note ? (
                          <p className="mt-0.5 truncate text-[11px] text-[#F0EFE2]/35">
                            {secret.note}
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => setSecrets(secrets.filter((_, j) => j !== i))}
                        className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-white/[0.08] text-[#F0EFE2]/45 hover:bg-white/[0.04] hover:text-[#F0EFE2]/80"
                        aria-label={`Delete secret ${secret.key}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={() => setSecretModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-300 hover:text-indigo-200"
              >
                <Plus className="size-3.5" />
                Add secret
              </button>
            </div>
          </SettingsFlatPanel>
        </SettingsCard>

        <div className="flex justify-end gap-3 pt-2">
          <Link
            href={backHref}
            className="inline-flex h-9 items-center px-3 text-sm font-medium text-[#F0EFE2]/55 hover:text-[#F0EFE2]/80"
          >
            Cancel
          </Link>
          <button type="submit" disabled={saving} className={bluePrimaryClass}>
            {saving ? "Installing…" : "Install and enable"}
          </button>
        </div>
      </form>
    </ContinuityLabSettingsSectionFrame>
  );
}
