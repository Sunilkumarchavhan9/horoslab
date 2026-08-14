import type { McpAuthType, McpCustomHeader, McpTransportType } from "./mcp-catalog-storage";

export type ParsedMcpServerConfig = {
  serverName: string;
  transport: McpTransportType;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  serverUrl?: string;
  authType?: McpAuthType;
  authHeaderName?: string;
  customHeaders?: McpCustomHeader[];
};

export type McpJsonImportResult =
  | { ok: true; config: ParsedMcpServerConfig }
  | { ok: false; error: string };

type RawServer = {
  command?: unknown;
  args?: unknown;
  env?: unknown;
  url?: unknown;
  type?: unknown;
  transport?: unknown;
  headers?: unknown;
};

function normalizeArgs(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(/\s+/).filter(Boolean);
  }
  return [];
}

function normalizeEnv(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (key.trim()) out[key.trim()] = val == null ? "" : String(val);
  }
  return out;
}

function normalizeHeaders(value: unknown): McpCustomHeader[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>)
    .filter(([name]) => name.trim())
    .map(([name, val]) => ({ name: name.trim(), value: val == null ? "" : String(val) }));
}

function inferRemoteTransport(raw: RawServer, url: string): McpTransportType {
  const typeHint = [raw.type, raw.transport]
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim().toLowerCase())
    .join(" ");
  if (typeHint.includes("sse")) return "sse";
  if (typeHint.includes("http")) return "http";
  if (/\/sse(?:\/|$|\?)/i.test(url)) return "sse";
  return "http";
}

function authFromHeaders(headers: McpCustomHeader[]): {
  authType: McpAuthType;
  authHeaderName?: string;
  customHeaders: McpCustomHeader[];
} {
  const authIdx = headers.findIndex((h) => /^authorization$/i.test(h.name));
  if (authIdx >= 0) {
    const authHeader = headers[authIdx];
    return {
      authType: "authorization_header",
      authHeaderName: authHeader.name,
      customHeaders: headers.filter((_, i) => i !== authIdx),
    };
  }
  return { authType: "none", customHeaders: headers };
}

function parseRemoteServerEntry(
  serverName: string,
  raw: RawServer,
): McpJsonImportResult {
  const url = typeof raw.url === "string" ? raw.url.trim() : "";
  if (!url) {
    return { ok: false, error: "Remote MCP servers must include a non-empty url." };
  }
  const transport = inferRemoteTransport(raw, url);
  const headers = normalizeHeaders(raw.headers);
  const { authType, authHeaderName, customHeaders } = authFromHeaders(headers);
  return {
    ok: true,
    config: {
      serverName: serverName.trim() || "custom-mcp",
      transport,
      serverUrl: url,
      authType,
      ...(authHeaderName ? { authHeaderName } : {}),
      ...(customHeaders.length > 0 ? { customHeaders } : {}),
      env: normalizeEnv(raw.env),
    },
  };
}

function parseStdioServerEntry(
  serverName: string,
  raw: RawServer,
): McpJsonImportResult {
  const command = typeof raw.command === "string" ? raw.command.trim() : "";
  if (!command) {
    return { ok: false, error: "Each MCP server must include a non-empty command or url." };
  }
  return {
    ok: true,
    config: {
      serverName: serverName.trim() || "custom-mcp",
      transport: "stdio",
      command,
      args: normalizeArgs(raw.args),
      env: normalizeEnv(raw.env),
    },
  };
}

function parseServerEntry(
  serverName: string,
  raw: RawServer,
): McpJsonImportResult {
  const url = typeof raw.url === "string" ? raw.url.trim() : "";
  if (url) return parseRemoteServerEntry(serverName, raw);
  return parseStdioServerEntry(serverName, raw);
}

/** Sample JSON shown in the Import JSON modal (Windsurf / Devin mcpServers shape). */
export const MCP_JSON_IMPORT_SAMPLE = `{
  "mcpServers": {
    "example": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-example"],
      "env": {
        "EXAMPLE_API_KEY": "your-key-here"
      }
    },
    "remote": {
      "url": "https://mcp.yourserver.com/mcp",
      "headers": {
        "Authorization": "Bearer your-token"
      }
    }
  }
}`;

/**
 * Parse MCP config JSON: `{ mcpServers: { name: { command, args?, env? } } }` or a single server object.
 */
export function parseMcpJsonImport(rawText: string): McpJsonImportResult {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return { ok: false, error: "Paste a JSON configuration to import." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed) as unknown;
  } catch {
    return { ok: false, error: "Invalid JSON. Check brackets, quotes, and trailing commas." };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, error: "JSON must be an object with mcpServers or a server definition." };
  }

  const record = parsed as Record<string, unknown>;

  if (record.mcpServers && typeof record.mcpServers === "object" && !Array.isArray(record.mcpServers)) {
    const servers = record.mcpServers as Record<string, RawServer>;
    const names = Object.keys(servers);
    if (names.length === 0) {
      return { ok: false, error: "mcpServers is empty. Add at least one server." };
    }
    const firstName = names[0];
    return parseServerEntry(firstName, servers[firstName] ?? {});
  }

  if (typeof record.command === "string" || typeof record.url === "string") {
    const name =
      typeof record.name === "string" && record.name.trim()
        ? record.name.trim()
        : "custom-mcp";
    return parseServerEntry(name, record as RawServer);
  }

  return {
    ok: false,
    error:
      'Expected { "mcpServers": { "name": { "command": "…" } } } or { "url": "https://…" }.',
  };
}
