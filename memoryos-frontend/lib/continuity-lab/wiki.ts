/**
 * Operational Wiki — section ids, storage, and repo ↔ project helpers.
 */

import { projectIdFromRepo } from "@/lib/continuity-lab/company-model";

export type WikiViewMode = "grid" | "list";
export type WikiIndexFilter = "all" | "indexed" | "generating" | "not_indexed";

export type WikiSectionId =
  | "overview"
  | "getting-started"
  | "deployment"
  | "decisions"
  | "runbooks"
  | "incidents"
  | "blockers"
  | "architecture"
  | "preferences"
  | "policies"
  | "bugs"
  | "previous-attempts"
  | "model-tool-updates"
  | "risky-files"
  | "next-actions";

export type WikiDocSection = {
  id: WikiSectionId;
  label: string;
  group: "core" | "contract";
  contractCategories: string[];
  nodeCount?: number;
  children?: Array<{ id: string; label: string; type: string }>;
};

export const WIKI_DOC_SECTIONS: WikiDocSection[] = [
  { id: "overview", label: "Overview", group: "core", contractCategories: [] },
  { id: "getting-started", label: "Getting Started", group: "core", contractCategories: [] },
  { id: "deployment", label: "Deployment", group: "core", contractCategories: ["runbook"] },
  { id: "decisions", label: "Decisions", group: "contract", contractCategories: ["decision"] },
  { id: "runbooks", label: "Runbooks", group: "contract", contractCategories: ["runbook"] },
  { id: "incidents", label: "Incidents", group: "contract", contractCategories: ["incident"] },
  { id: "blockers", label: "Blockers", group: "contract", contractCategories: ["blocker"] },
  { id: "architecture", label: "Architecture", group: "contract", contractCategories: ["architecture_note"] },
  { id: "preferences", label: "Preferences", group: "contract", contractCategories: ["preference"] },
  { id: "policies", label: "Policies", group: "contract", contractCategories: ["policy"] },
  { id: "bugs", label: "Bugs", group: "contract", contractCategories: ["bug"] },
  {
    id: "previous-attempts",
    label: "Previous attempts",
    group: "contract",
    contractCategories: ["previous_attempt"],
  },
  {
    id: "model-tool-updates",
    label: "Model & tool updates",
    group: "contract",
    contractCategories: ["model_tool_update"],
  },
  { id: "risky-files", label: "Risky files", group: "contract", contractCategories: ["risky_file"] },
  { id: "next-actions", label: "Next actions", group: "contract", contractCategories: ["next_action"] },
];

export const WIKI_CONTRACT_SECTIONS = WIKI_DOC_SECTIONS.filter((section) => section.group === "contract");

const SECTION_ALIASES: Record<string, WikiSectionId> = {
  overview: "overview",
  "getting-started": "getting-started",
  getting_started: "getting-started",
  deployment: "deployment",
  decisions: "decisions",
  decision: "decisions",
  runbooks: "runbooks",
  runbook: "runbooks",
  incidents: "incidents",
  incident: "incidents",
  blockers: "blockers",
  blocker: "blockers",
  architecture: "architecture",
  preferences: "preferences",
  policies: "policies",
  bugs: "bugs",
  "previous-attempts": "previous-attempts",
  "model-tool-updates": "model-tool-updates",
  "risky-files": "risky-files",
  "next-actions": "next-actions",
};

export function wikiSectionFromQuery(raw: string | null | undefined): WikiSectionId {
  const key = (raw ?? "").trim().toLowerCase();
  return SECTION_ALIASES[key] ?? "overview";
}

export function wikiRepoHref(projectId: string, section?: WikiSectionId): string {
  const base = `/continuity-lab/wiki/${encodeURIComponent(projectId)}`;
  if (!section || section === "overview") return base;
  return `${base}?section=${encodeURIComponent(section)}`;
}

export function repoFullNameFromProjectId(
  projectId: string,
  repos: Array<{ fullName: string }>,
): string | null {
  const normalized = projectId.trim().toLowerCase();
  const hit = repos.find((r) => projectIdFromRepo(r.fullName) === normalized);
  return hit?.fullName ?? null;
}

export function formatWikiRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "Not synced";
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (diff < 60_000) return "Just now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return d.toLocaleDateString();
  } catch {
    return "Not synced";
  }
}

type WikiStorageState = {
  recentRepos: string[];
  viewMode: WikiViewMode;
  filter: WikiIndexFilter;
};

const STORAGE_KEY = "memoryos.continuity-lab.wiki";

const DEFAULT_WIKI_STORAGE: WikiStorageState = {
  recentRepos: [],
  viewMode: "grid",
  filter: "all",
};

export function readWikiStorage(): WikiStorageState {
  if (typeof window === "undefined") return { ...DEFAULT_WIKI_STORAGE };
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_WIKI_STORAGE };
    const parsed = JSON.parse(raw) as Partial<WikiStorageState>;
    return {
      recentRepos: Array.isArray(parsed.recentRepos)
        ? parsed.recentRepos.filter((r): r is string => typeof r === "string" && r.includes("/"))
        : [],
      viewMode: parsed.viewMode === "list" ? "list" : "grid",
      filter:
        parsed.filter === "indexed" ||
        parsed.filter === "generating" ||
        parsed.filter === "not_indexed"
          ? parsed.filter
          : "all",
    };
  } catch {
    return { ...DEFAULT_WIKI_STORAGE };
  }
}

export function saveWikiStorage(partial: Partial<WikiStorageState>): WikiStorageState {
  const next = { ...readWikiStorage(), ...partial };
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function touchRecentWikiRepo(fullName: string): string[] {
  const trimmed = fullName.trim();
  if (!trimmed.includes("/")) return readWikiStorage().recentRepos;
  const prev = readWikiStorage().recentRepos.filter((r) => r !== trimmed);
  const next = [trimmed, ...prev].slice(0, 8);
  saveWikiStorage({ recentRepos: next });
  return next;
}

export function parseWikiRepoFullName(
  fullName: string | null | undefined,
): { owner: string; repo: string } | null {
  if (!fullName?.includes("/")) return null;
  const [owner, repo] = fullName.split("/", 2);
  if (!owner?.trim() || !repo?.trim()) return null;
  return { owner: owner.trim(), repo: repo.trim() };
}

export function githubRepoUrl(fullName: string): string {
  return `https://github.com/${fullName}`;
}

export function githubBlobUrl(fullName: string, branch: string, filePath: string): string {
  const normalized = filePath.replace(/^\.\//, "").replace(/^\/+/, "");
  return `https://github.com/${fullName}/blob/${encodeURIComponent(branch)}/${normalized}`;
}

export type WikiContractSummaryRow = {
  category: string;
  label: string;
  count: number;
};

export function buildContractSummaryRows(
  decisions: Array<{ contractCategory: string }>,
): WikiContractSummaryRow[] {
  const counts = new Map<string, number>();
  for (const entry of decisions) {
    const key = entry.contractCategory;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const rows: WikiContractSummaryRow[] = [];
  for (const section of WIKI_DOC_SECTIONS) {
    if (section.group !== "contract" || !section.contractCategories.length) continue;
    let count = 0;
    for (const cat of section.contractCategories) {
      count += counts.get(cat) ?? 0;
    }
    if (count > 0) {
      rows.push({ category: section.id, label: section.label, count });
    }
  }
  return rows;
}

export type OperationalMapSidebarSection = {
  sectionId: WikiSectionId;
  label: string;
  nodeCount: number;
};

export function mapOperationalSectionsToWiki(
  sections: Array<{ sectionId: string; label: string; nodeCount: number }>,
): OperationalMapSidebarSection[] {
  const allowed = new Set(WIKI_DOC_SECTIONS.map((section) => section.id));
  return sections
    .filter((section) => allowed.has(section.sectionId as WikiSectionId))
    .map((section) => ({
      sectionId: section.sectionId as WikiSectionId,
      label: section.label,
      nodeCount: section.nodeCount,
    }));
}

export function resolveVisibleWikiSections(input: {
  operationalSections: OperationalMapSidebarSection[];
  decisions: Array<{ contractCategory: string }>;
  hasBlockers?: boolean;
}): WikiSectionId[] {
  const core: WikiSectionId[] = ["overview", "getting-started", "deployment"];
  const fromMap = input.operationalSections.map((section) => section.sectionId);
  const fromMemories = new Set<WikiSectionId>();

  for (const def of WIKI_DOC_SECTIONS) {
    if (def.group !== "contract") continue;
    const hasMemories = input.decisions.some((entry) =>
      def.contractCategories.includes(entry.contractCategory),
    );
    if (hasMemories) {
      fromMemories.add(def.id);
    }
  }

  if (input.hasBlockers) {
    fromMemories.add("blockers");
  }

  const merged = new Set<WikiSectionId>([...core, ...fromMap, ...fromMemories]);
  return WIKI_DOC_SECTIONS.filter((section) => merged.has(section.id)).map((section) => section.id);
}

export function wikiSectionLabel(sectionId: WikiSectionId): string {
  return WIKI_DOC_SECTIONS.find((section) => section.id === sectionId)?.label ?? sectionId;
}

export function wikiSectionContractCategories(sectionId: WikiSectionId): string[] {
  return WIKI_DOC_SECTIONS.find((section) => section.id === sectionId)?.contractCategories ?? [];
}

export function buildWikiSectionsFromOperationalMap(
  sections: Array<{
    sectionId: string;
    label: string;
    nodeCount: number;
    contractCategories?: string[];
    children?: Array<{ id: string; label: string; type: string }>;
  }>,
): WikiDocSection[] {
  const core = WIKI_DOC_SECTIONS.filter((section) => section.group === "core");
  const byId = new Map(WIKI_DOC_SECTIONS.map((section) => [section.id, section]));
  const contract: WikiDocSection[] = [];

  for (const section of sections) {
    const base = byId.get(section.sectionId as WikiSectionId);
    if (!base) continue;
    contract.push({
      ...base,
      label: section.label || base.label,
      nodeCount: section.nodeCount,
      contractCategories:
        section.contractCategories && section.contractCategories.length > 0
          ? section.contractCategories
          : base.contractCategories,
      children: section.children,
    });
  }

  return [...core, ...contract];
}

export function resolveWikiDocSection(
  sectionId: WikiSectionId,
  sections: WikiDocSection[],
): WikiDocSection {
  return sections.find((section) => section.id === sectionId) ?? WIKI_DOC_SECTIONS[0];
}
