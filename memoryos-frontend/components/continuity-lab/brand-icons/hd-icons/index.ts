"use client";

import type { ComponentType } from "react";
import {
  AtlassianHdIcon,
  BitbucketHdIcon,
  GitLabHdIcon,
  LinearHdIcon,
  MicrosoftTeamsHdIcon,
  NotionHdIcon,
} from "@/components/continuity-lab/brand-icons/hd-icons/integrations";
import {
  CloudflareHdIcon,
  DatadogHdIcon,
  FigmaHdIcon,
  GmailHdIcon,
  GoogleCalendarHdIcon,
  GoogleDriveHdIcon,
  PlaywrightHdIcon,
  SentryHdIcon,
  StripeHdIcon,
} from "@/components/continuity-lab/brand-icons/hd-icons/mcp";

type IconProps = { className?: string };

export {
  AtlassianHdIcon,
  BitbucketHdIcon,
  CloudflareHdIcon,
  DatadogHdIcon,
  FigmaHdIcon,
  GitLabHdIcon,
  GmailHdIcon,
  GoogleCalendarHdIcon,
  GoogleDriveHdIcon,
  LinearHdIcon,
  MicrosoftTeamsHdIcon,
  NotionHdIcon,
  PlaywrightHdIcon,
  SentryHdIcon,
  StripeHdIcon,
};

/** Catalog / integration ids mapped to HD multi-color components (overrides PathBrandIcon). */
/** HD overrides only where multi-color beats Simple Icons single-path marks. */
export const HD_BRAND_ICONS: Record<string, ComponentType<IconProps>> = {
  atlassian: AtlassianHdIcon,
  cloudflare: CloudflareHdIcon,
  datadog: DatadogHdIcon,
  figma: FigmaHdIcon,
  gmail: GmailHdIcon,
  "google-calendar": GoogleCalendarHdIcon,
  "google-drive": GoogleDriveHdIcon,
  notion: NotionHdIcon,
  playwright: PlaywrightHdIcon,
  sentry: SentryHdIcon,
  stripe: StripeHdIcon,
  teams: MicrosoftTeamsHdIcon,
  "microsoft-teams": MicrosoftTeamsHdIcon,
};

export function getHdBrandIcon(id: string): ComponentType<IconProps> | null {
  const key = id.trim().toLowerCase().replace(/_/g, "-");
  return HD_BRAND_ICONS[key] ?? null;
}
