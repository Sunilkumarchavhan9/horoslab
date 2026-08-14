import { MCP_SEED_CATALOG, type McpSeedCatalogEntry } from "./mcp-seed-catalog";

export const MCP_CATALOG_STORAGE_KEY = "continuity-lab-mcp-catalog";
export const MCP_CATALOG_CHANGED_EVENT = "continuity-lab-mcp-catalog-changed";

const CATALOG_KEY = MCP_CATALOG_STORAGE_KEY;
const SUGGESTIONS_KEY = "continuity-lab-mcp-suggestions";

function notifyMcpCatalogChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(MCP_CATALOG_CHANGED_EVENT));
}

export type McpCatalogCategory =
  | "essentials"
  | "ai_ml"
  | "cloud"
  | "communication"
  | "customer_sales"
  | "databases"
  | "design_creative"
  | "dev_tools"
  | "finance"
  | "monitoring"
  | "productivity"
  | "custom";

export type McpCatalogEntry = {
  id: string;
  name: string;
  description: string;
  category: McpCatalogCategory;
  installed: boolean;
  recommended?: boolean;
  verified?: boolean;
  /** Built-in catalog vs user-defined custom MCP */
  source: "catalog" | "custom";
  iconLabel?: string;
  iconUrl?: string;
  docsUrl?: string;
  connection?: McpConnectionConfig;
  secrets?: McpSecretEntry[];
};

export type McpAuthType = "none" | "authorization_header" | "oauth";

export type McpSecretScope = "organization";

export type McpSecretEntry = {
  key: string;
  value: string;
  scope?: McpSecretScope;
  note?: string;
  redacted?: boolean;
};

export type McpCustomHeader = {
  name: string;
  value: string;
};

export type McpConnectionConfig = {
  transport: McpTransportType;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  serverUrl?: string;
  authType?: McpAuthType;
  authHeaderName?: string;
  customHeaders?: McpCustomHeader[];
};

export type McpSuggestionSubmission = {
  id: string;
  name: string;
  docsUrl: string;
  description: string;
  submittedAt: string;
};

export type McpCatalogState = {
  entries: McpCatalogEntry[];
  version: 1;
};

export const MCP_CATEGORY_LABELS: Record<McpCatalogCategory, string> = {
  essentials: "Essentials",
  ai_ml: "AI & ML",
  cloud: "Cloud & Infrastructure",
  communication: "Communication",
  customer_sales: "Customer & Sales",
  databases: "Databases",
  design_creative: "Design & Creative",
  dev_tools: "Development Tools",
  finance: "Finance",
  monitoring: "Monitoring & Analytics",
  productivity: "Productivity",
  custom: "Custom",
};

export const MCP_INSTALL_FILTERS = ["all", "installed", "not_installed"] as const;
export type McpInstallFilter = (typeof MCP_INSTALL_FILTERS)[number];

export type McpTransportType = "stdio" | "sse" | "http";

export const MCP_TRANSPORT_OPTIONS: {
  value: McpTransportType;
  label: string;
  description: string;
  enabled: boolean;
}[] = [
  { value: "http", label: "HTTP", description: "Remote server at a URL.", enabled: true },
  { value: "stdio", label: "STDIO", description: "Local server spawned as a process.", enabled: true },
  { value: "sse", label: "SSE", description: "Legacy remote streaming transport.", enabled: true },
];

const SEED_CATALOG: Omit<McpCatalogEntry, "installed" | "source">[] = MCP_SEED_CATALOG.map(
  (item: McpSeedCatalogEntry) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    category: item.category,
    ...(item.recommended ? { recommended: true } : {}),
    ...(item.verified ? { verified: true } : {}),
  }),
);

function defaultCatalogState(): McpCatalogState {
  return {
    version: 1,
    entries: SEED_CATALOG.map((item) => ({
      ...item,
      installed: false,
      source: "catalog" as const,
    })),
  };
}

function parseCatalog(raw: string | null): McpCatalogState {
  if (!raw) return defaultCatalogState();
  try {
    const parsed = JSON.parse(raw) as McpCatalogState;
    if (!parsed?.entries?.length) return defaultCatalogState();
    const seedIds = new Set(SEED_CATALOG.map((e) => e.id));
    const merged = [...parsed.entries];
    for (const seed of SEED_CATALOG) {
      if (!merged.some((e) => e.id === seed.id)) {
        merged.push({
          ...seed,
          installed: false,
          source: "catalog",
        });
      }
    }
    return {
      version: 1,
      entries: merged.map((e) => ({
        ...e,
        source: e.source ?? (seedIds.has(e.id) ? "catalog" : "custom"),
      })),
    };
  } catch {
    return defaultCatalogState();
  }
}

export function readMcpCatalog(): McpCatalogState {
  if (typeof window === "undefined") return defaultCatalogState();
  try {
    return parseCatalog(window.localStorage.getItem(CATALOG_KEY));
  } catch {
    return defaultCatalogState();
  }
}

export function writeMcpCatalog(state: McpCatalogState): McpCatalogState {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CATALOG_KEY, JSON.stringify(state));
    notifyMcpCatalogChanged();
  }
  return state;
}

export function setMcpInstalled(id: string, installed: boolean): McpCatalogState {
  const state = readMcpCatalog();
  const next = {
    ...state,
    entries: state.entries.map((e) => (e.id === id ? { ...e, installed } : e)),
  };
  return writeMcpCatalog(next);
}

export function upsertCustomMcp(entry: McpCatalogEntry): McpCatalogState {
  const state = readMcpCatalog();
  const idx = state.entries.findIndex((e) => e.id === entry.id);
  const nextEntries =
    idx >= 0
      ? state.entries.map((e, i) => (i === idx ? entry : e))
      : [...state.entries, entry];
  return writeMcpCatalog({ ...state, entries: nextEntries });
}

export function readMcpSuggestions(): McpSuggestionSubmission[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SUGGESTIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as McpSuggestionSubmission[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendMcpSuggestion(
  input: Omit<McpSuggestionSubmission, "id" | "submittedAt">,
): McpSuggestionSubmission[] {
  const submission: McpSuggestionSubmission = {
    ...input,
    id: `suggest-${Date.now()}`,
    submittedAt: new Date().toISOString(),
  };
  const next = [...readMcpSuggestions(), submission];
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(next));
  }
  return next;
}

export function slugifyMcpId(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base ? `custom-${base}` : "custom-mcp";
}

export function newCustomMcpId(name: string): string {
  return `${slugifyMcpId(name)}-${Date.now()}`;
}

/** Count of built-in marketplace seeds (for tests / tab labels). */
export function mcpSeedCatalogCount(): number {
  return SEED_CATALOG.length;
}
