"use client";

import { createElement, type ComponentType } from "react";
import { cn } from "@/lib/utils";
import {
  BitbucketBrandIcon,
  GitHubBrandIcon,
  GitLabBrandIcon,
  JiraBrandIcon,
  LinearBrandIcon,
  NotionBrandIcon,
  SlackBrandIcon,
} from "@/components/continuity-lab/connector-brand-icons";
import { HD_BRAND_ICONS } from "@/components/continuity-lab/brand-icons/hd-icons";
import {
  CATALOG_BRAND_PATHS,
  type CatalogBrandPathId,
} from "@/components/continuity-lab/brand-icons/catalog-brand-paths";
import { PathBrandIcon } from "@/components/continuity-lab/brand-icons/path-brand-icon";
import { MemoryosStarIcon } from "@/components/continuity-lab/memoryos-logo-mark";

type IconProps = { className?: string };

const MONOCHROME_TONE_IDS = new Set([
  "github",
  "vercel",
  "replicate",
  "posthog",
]);

/** Catalog ids that share another brand path (e.g. Cloudflare MCP variants). */
const BRAND_ID_ALIASES: Record<string, string> = {
  "amazon-redshift-iam": "amazon-redshift",
  "amazon-redshift-password": "amazon-redshift",
  "cloud-sql-mysql": "mysql",
  "cloud-sql-postgresql": "postgresql",
  "cloud-sql-sql-server": "sql-server",
  "datadog-api-key": "datadog",
  "datadog-oauth": "datadog",
  "docker-hub": "docker",
  "perplexity-ask": "perplexity",
  postgres: "postgresql",
  "cloudflare-ai-gateway": "cloudflare",
  "cloudflare-audit-logs": "cloudflare",
  "cloudflare-autorag": "cloudflare",
  "cloudflare-browser-rendering": "cloudflare",
  "cloudflare-container": "cloudflare",
  "cloudflare-digital-experience-monitoring": "cloudflare",
  "cloudflare-dns-analytics": "cloudflare",
  "cloudflare-documentation": "cloudflare",
  "cloudflare-graphql": "cloudflare",
  "cloudflare-logpush": "cloudflare",
  "cloudflare-observability": "cloudflare",
  "cloudflare-one-casb": "cloudflare",
  "cloudflare-radar": "cloudflare",
  "cloudflare-workers-bindings": "cloudflare",
  "cloudflare-workers-builds": "cloudflare",
};

function catalogPathIcon(id: CatalogBrandPathId): ComponentType<IconProps> {
  const spec = CATALOG_BRAND_PATHS[id];
  function CatalogIcon({ className }: IconProps) {
    return <PathBrandIcon className={className} d={spec.d} fill={spec.fill} />;
  }
  CatalogIcon.displayName = `CatalogBrandIcon(${id})`;
  return CatalogIcon;
}

const CONNECTOR_ICONS: Record<string, ComponentType<IconProps>> = {
  github: GitHubBrandIcon,
  gitlab: GitLabBrandIcon,
  bitbucket: BitbucketBrandIcon,
  slack: SlackBrandIcon,
  linear: LinearBrandIcon,
  jira: JiraBrandIcon,
  notion: NotionBrandIcon,
  atlassian: catalogPathIcon("atlassian"),
  confluence: catalogPathIcon("confluence"),
};

const PATH_ICONS: Record<string, ComponentType<IconProps>> = Object.fromEntries(
  (Object.keys(CATALOG_BRAND_PATHS) as CatalogBrandPathId[]).map((id) => [
    id,
    catalogPathIcon(id),
  ]),
) as Record<string, ComponentType<IconProps>>;

function DeepWikiBrandIcon({ className }: IconProps) {
  return <MemoryosStarIcon className={className} size={20} />;
}
DeepWikiBrandIcon.displayName = "DeepWikiBrandIcon";

const MCP_BRAND_ICONS: Record<string, ComponentType<IconProps>> = {
  ...PATH_ICONS,
  ...CONNECTOR_ICONS,
  ...HD_BRAND_ICONS,
  deepwiki: DeepWikiBrandIcon,
  k8s: catalogPathIcon("kubernetes"),
};

/** Normalize catalog / connector ids for registry lookup. */
export function normalizeMcpBrandIconId(id: string): string {
  return id.trim().toLowerCase().replace(/_/g, "-");
}

export function resolveMcpBrandPathId(id: string): CatalogBrandPathId | null {
  const key = normalizeMcpBrandIconId(id);
  const alias = BRAND_ID_ALIASES[key];
  const resolved = alias ?? key;
  if (resolved in CATALOG_BRAND_PATHS) return resolved as CatalogBrandPathId;
  return null;
}

/** Returns a brand icon component for a catalog id, or null if unknown. */
export function getMcpBrandIcon(id: string): ComponentType<IconProps> | null {
  const key = normalizeMcpBrandIconId(id);
  const direct = MCP_BRAND_ICONS[key];
  if (direct) return direct;

  const pathId = resolveMcpBrandPathId(key);
  if (pathId) return catalogPathIcon(pathId);

  return null;
}

export function hasMcpBrandIcon(id: string): boolean {
  return getMcpBrandIcon(id) !== null;
}

type McpBrandIconProps = {
  id: string;
  className?: string;
  /** Shown in the generic fallback chip when no brand mark exists (e.g. custom MCP). */
  fallbackLabel?: string;
};

/**
 * Brand mark for MCP catalog cards and connection surfaces.
 * Uses inline SVG paths (Simple Icons / existing connector marks).
 */
export function McpBrandIcon({
  id,
  className = "size-5",
  fallbackLabel,
}: McpBrandIconProps) {
  const key = normalizeMcpBrandIconId(id);
  const Icon = getMcpBrandIcon(key);
  if (Icon) {
    const pathId = resolveMcpBrandPathId(key) ?? key;
    const tone = MONOCHROME_TONE_IDS.has(pathId) ? "text-[#F0EFE2]" : undefined;
    return createElement(Icon, { className: cn(tone, className) });
  }

  const label =
    fallbackLabel?.trim() ||
    id
      .replace(/^custom-/, "")
      .slice(0, 2)
      .toUpperCase() ||
    "MC";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-bold uppercase tracking-wide text-[#F0EFE2]/55",
        className,
      )}
      aria-hidden
      title={label}
    >
      {label}
    </span>
  );
}
