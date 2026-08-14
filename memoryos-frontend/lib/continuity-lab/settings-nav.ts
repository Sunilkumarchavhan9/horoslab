export type SettingsSectionId =
  | "preferences"
  | "personal-connections"
  | "general"
  | "connections"
  | "sessions"
  | "plans"
  | "invoices"
  | "usage"
  | "continuity-lab"
  | "review"
  | "wiki"
  | "schedules"
  | "memoryos-desktop"
  | "shell-integration"
  | "skills-rules"
  | "environment"
  | "knowledge"
  | "playbooks"
  | "secrets"
  | "repositories"
  | "membership"
  | "memoryos-api"
  | "analytics"
  /** Legacy route — not shown in sidebar; playbooks/schedules cover this surface. */
  | "automations";

export type SettingsNavItem = {
  id: SettingsSectionId;
  label: string;
  keywords?: string[];
  badge?: string;
  /** When set, nav row links out of settings (e.g. live product routes). */
  productHref?: string;
};

export type SettingsNavGroup = {
  id: string;
  title: string;
  items: SettingsNavItem[];
};

/** Devin → MemoryOS slug aliases for `/continuity-lab/settings/{slug}`. */
export const SETTINGS_SECTION_ALIASES: Record<string, SettingsSectionId> = {
  deepwiki: "wiki",
  devin: "continuity-lab",
  "devin-desktop": "memoryos-desktop",
  shell: "shell-integration",
  "devin-shell": "shell-integration",
  terminal: "shell-integration",
  "api-keys": "memoryos-api",
};

const ALL_SETTINGS_SECTION_IDS: SettingsSectionId[] = [
  "preferences",
  "personal-connections",
  "general",
  "connections",
  "sessions",
  "plans",
  "invoices",
  "usage",
  "continuity-lab",
  "review",
  "wiki",
  "schedules",
  "memoryos-desktop",
  "shell-integration",
  "skills-rules",
  "environment",
  "knowledge",
  "playbooks",
  "secrets",
  "repositories",
  "membership",
  "memoryos-api",
  "analytics",
  "automations",
];

/** Section subtitles shown in the main content header (Devin-style). */
export const SETTINGS_SECTION_DESCRIPTIONS: Partial<Record<SettingsSectionId, string>> = {
  preferences: "Manage your personal preferences",
  "personal-connections":
    "Connect your personal accounts to use team-enabled integrations and MCPs.",
  general: "Organization identity and data sharing preferences.",
  connections: "MCP servers, custom integrations, and organization connectors.",
  sessions: "Browse, filter, and export agent sessions for your organization.",
  plans: "Subscription plans and upgrades.",
  invoices: "Billing history and receipts.",
  usage: "Usage metering and limits.",
  "continuity-lab": "Organization preferences and settings for Continuity Lab sessions",
  review: "Organization preferences and settings for MemoryOS Review",
  wiki: "Choose how MemoryOS Wiki generates and displays content for your organization",
  schedules: "Automate recurring or one-time Continuity Lab sessions.",
  "memoryos-desktop": "Manage your MemoryOS Desktop API keys and privacy settings",
  "shell-integration": "Devin CLI shell setup, keybindings, and lifecycle hooks.",
  "skills-rules": "Agent skills and workspace rules.",
  environment: "Configure how MemoryOS agent sandboxes are set up for your organization.",
  knowledge: "Company Brain memory surfaces through wiki and console.",
  playbooks: "Reusable system prompts that customize how MemoryOS works.",
  secrets: "Runtime and connector secrets for your organization.",
  repositories: "GitHub connector status and indexed repositories.",
  membership: "Organization members and roles.",
  "memoryos-api": "Service users and legacy API keys for your organization.",
  analytics: "Governance KPIs and trust benchmarks.",
  automations: "Workflow templates and scheduled agent runs.",
};

/** Devin-style left nav — Personal + Organization (org header shows display name). */
export const SETTINGS_NAV: SettingsNavGroup[] = [
  {
    id: "personal",
    title: "Personal",
    items: [
      { id: "preferences", label: "Preferences", keywords: ["profile", "theme", "notifications"] },
      {
        id: "personal-connections",
        label: "Connections",
        keywords: ["oauth", "github", "slack", "personal"],
      },
    ],
  },
  {
    id: "organization",
    title: "Organization",
    items: [
      { id: "general", label: "General", keywords: ["org", "repo", "company model"] },
      { id: "connections", label: "Connections", keywords: ["github", "slack", "jira", "mcp", "org"] },
      { id: "sessions", label: "Sessions", keywords: ["filter", "export", "archive", "layout", "agent"] },
      { id: "plans", label: "Plans", keywords: ["billing", "upgrade", "subscription"] },
      { id: "invoices", label: "Invoices", keywords: ["billing", "receipts", "payment"] },
      { id: "usage", label: "Usage & limits", keywords: ["metering", "quota", "limits"] },
      {
        id: "continuity-lab",
        label: "Continuity Lab",
        keywords: ["memoryos agent", "devin", "agent", "sessions", "memory"],
      },
      { id: "review", label: "Review", keywords: ["pr", "pull request", "code review"] },
      { id: "wiki", label: "Wiki", keywords: ["deepwiki", "docs", "memory", "knowledge base"] },
      { id: "schedules", label: "Schedules", keywords: ["cron", "recurring", "automation"] },
      {
        id: "memoryos-desktop",
        label: "MemoryOS Desktop",
        badge: "New",
        keywords: ["devin desktop", "desktop app", "download"],
      },
      {
        id: "shell-integration",
        label: "Shell integration",
        badge: "New",
        keywords: ["devin shell", "terminal", "hooks", "cli", "keybinding"],
      },
      { id: "skills-rules", label: "Skills & Rules", keywords: ["cursor", "rules", "skills", "agents"] },
      { id: "environment", label: "Environment", keywords: ["sandbox", "ubuntu", "windows", "network"] },
      { id: "knowledge", label: "Knowledge", keywords: ["brain", "company brain", "memory"] },
      { id: "playbooks", label: "Playbooks", keywords: ["templates", "automation", "workflow"] },
      { id: "secrets", label: "Secrets", keywords: ["credentials", "env", "keys"] },
      { id: "repositories", label: "Repositories", keywords: ["github", "repos", "codebase"] },
      { id: "membership", label: "Membership", keywords: ["members", "roles", "team", "invite"] },
      {
        id: "memoryos-api",
        label: "MemoryOS API",
        keywords: ["memoryos api", "developer", "keys", "mcp", "rest"],
      },
      { id: "analytics", label: "Analytics", keywords: ["kpi", "governance", "metrics", "trust"] },
    ],
  },
];

const NAV_ITEMS = SETTINGS_NAV.flatMap((g) => g.items);

export function settingsSectionPath(id: SettingsSectionId): string {
  return `/continuity-lab/settings/${id}`;
}

export const SETTINGS_INDEX_PATH = "/continuity-lab/settings";

export function isSettingsSectionId(id: string): id is SettingsSectionId {
  return ALL_SETTINGS_SECTION_IDS.includes(id as SettingsSectionId);
}

export function resolveSettingsSectionSlug(slug: string): SettingsSectionId | undefined {
  const normalized = SETTINGS_SECTION_ALIASES[slug] ?? slug;
  return isSettingsSectionId(normalized) ? normalized : undefined;
}

export function findSettingsNavItem(id: string): SettingsNavItem | undefined {
  return NAV_ITEMS.find((item) => item.id === id);
}

export function findSettingsNavGroupForSection(id: SettingsSectionId): SettingsNavGroup | undefined {
  return SETTINGS_NAV.find((group) => group.items.some((item) => item.id === id));
}

export function filterSettingsNav(query: string): SettingsNavGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return SETTINGS_NAV;

  return SETTINGS_NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      const aliasHaystack = Object.entries(SETTINGS_SECTION_ALIASES)
        .filter(([, target]) => target === item.id)
        .map(([alias]) => alias)
        .join(" ");
      const haystack = [item.label, ...(item.keywords ?? []), aliasHaystack, group.title]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q) || item.id.includes(q);
    }),
  })).filter((group) => group.items.length > 0);
}

export function settingsSectionTitle(id: SettingsSectionId): string {
  const fromNav = findSettingsNavItem(id);
  if (fromNav) return fromNav.label;
  if (id === "automations") return "Automations";
  return "Settings";
}

export function settingsSectionDescription(id: SettingsSectionId): string | undefined {
  return SETTINGS_SECTION_DESCRIPTIONS[id];
}
