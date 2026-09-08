"use client";

import { Brain, Clock3, Link2 } from "lucide-react";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  BitbucketHdIcon,
  GitLabHdIcon,
  LinearHdIcon,
  MicrosoftTeamsHdIcon,
  NotionHdIcon,
} from "@/components/continuity-lab/brand-icons/hd-icons";
import {
  CATALOG_BRAND_PATHS,
  type CatalogBrandPathId,
} from "@/components/continuity-lab/brand-icons/catalog-brand-paths";
import { PathBrandIcon } from "@/components/continuity-lab/brand-icons/path-brand-icon";
import type { AutomationConnectorId } from "@/lib/continuity-lab/automation-storage";
import type { AutomationIntegrationPill } from "@/lib/continuity-lab/automation-templates";

type IconProps = { className?: string };
export type TriggerFamilyIconId = "github" | "schedule" | "slack" | "webhook";

const SUPPORTED_CONNECTORS = new Set<AutomationConnectorId>([
  "github",
  "slack",
  "jira",
  "notion",
  "stripe",
  "datadog",
  "sentry",
  "circleci",
  "cloudflare",
  "metabase",
  "hubspot",
  "jam",
  "asana",
  "figma",
  "sonarqube",
  "pagerduty",
  "linear",
]);

export type SettingsIntegrationId =
  | "github"
  | "gitlab"
  | "bitbucket"
  | "slack"
  | "teams"
  | "linear"
  | "jira"
  | "notion";

function Svg({
  className,
  children,
  viewBox = "0 0 24 24",
}: IconProps & { children: ReactNode; viewBox?: string }) {
  return (
    <svg
      className={cn("shrink-0", className)}
      viewBox={viewBox}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}

function catalogConnectorIcon(id: CatalogBrandPathId): React.ComponentType<IconProps> {
  const spec = CATALOG_BRAND_PATHS[id];
  function CatalogConnectorIcon({ className }: IconProps) {
    return <PathBrandIcon className={className} d={spec.d} fill={spec.fill} />;
  }
  CatalogConnectorIcon.displayName = `AutomationConnectorBrandIcon(${id})`;
  return CatalogConnectorIcon;
}

/** GitHub mark — Simple Icons path, light fill for dark UI. */
export function GitHubBrandIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        fill="currentColor"
        d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
      />
    </Svg>
  );
}

/** Slack — official four-color hash (Font Awesome geometry). */
export function SlackBrandIcon({ className }: IconProps) {
  return (
    <svg className={cn("shrink-0", className)} viewBox="0 0 640 640" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <path
        fill="#E01E5A"
        d="M190.1 379.1C190.1 405 168.9 426.2 143 426.2C117.1 426.2 96 405 96 379.1C96 353.2 117.2 332 143.1 332L190.2 332L190.2 379.1zM213.8 379.1C213.8 353.2 235 332 260.9 332C286.8 332 308 353.2 308 379.1L308 496.9C308 522.8 286.8 544 260.9 544C235 544 213.8 522.8 213.8 496.9L213.8 379.1z"
      />
      <path
        fill="#36C5F0"
        d="M260.9 190.1C235 190.1 213.8 168.9 213.8 143C213.8 117.1 235 96 260.9 96C286.8 96 308 117.2 308 143.1L308 190.2L260.9 190.2zM260.9 213.8C286.8 213.8 308 235 308 260.9C308 286.8 286.8 308 260.9 308L143.1 308C117.2 308 96 286.8 96 260.9C96 235 117.2 213.8 143.1 213.8L260.9 213.8z"
      />
      <path
        fill="#2EB67D"
        d="M449.9 260.9C449.9 235 471.1 213.8 497 213.8C522.9 213.8 544 235 544 260.9C544 286.8 522.8 308 496.9 308L449.8 308L449.8 260.9zM426.2 260.9C426.2 286.8 405 308 379.1 308C353.2 308 332 286.8 332 260.9L332 143.1C332 117.2 353.2 96 379.1 96C405 96 426.2 117.2 426.2 143.1L426.2 260.9z"
      />
      <path
        fill="#ECB22E"
        d="M379.1 449.9C405 449.9 426.2 471.1 426.2 497C426.2 522.9 405 544 379.1 544C353.2 544 332 522.8 332 496.9L332 449.8L379.1 449.8zM379.1 426.2C353.2 426.2 332 405 332 379.1C332 353.2 353.2 332 379.1 332L496.9 332C522.8 332 544 353.2 544 379.1C544 405 522.8 426.2 496.9 426.2L379.1 426.2z"
      />
    </svg>
  );
}

/** GitLab — multi-tone tanuki. */
export function GitLabBrandIcon({ className }: IconProps) {
  return <GitLabHdIcon className={className} />;
}

/** Notion — white mark on dark UI. */
export function NotionBrandIcon({ className }: IconProps) {
  return <NotionHdIcon className={className} />;
}

/** Linear — four purple stripes. */
export function LinearBrandIcon({ className }: IconProps) {
  return <LinearHdIcon className={className} />;
}

/** Microsoft Teams — gradient people + T tile. */
export function MicrosoftTeamsBrandIcon({ className }: IconProps) {
  return <MicrosoftTeamsHdIcon className={className} />;
}

/** Bitbucket — blue bucket + white accent. */
export function BitbucketBrandIcon({ className }: IconProps) {
  return <BitbucketHdIcon className={className} />;
}

/** Jira — Atlassian blue gradient mark. */
export function JiraBrandIcon({ className }: IconProps) {
  const uid = useId().replace(/:/g, "");
  const gradA = `jira-a-${uid}`;
  const gradB = `jira-b-${uid}`;
  const gradC = `jira-c-${uid}`;

  return (
    <svg
      className={cn("shrink-0", className)}
      viewBox="0 -30.632388516510233 255.324 285.95638851651023"
      preserveAspectRatio="xMidYMid"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradA}>
          <stop offset=".18" stopColor="#0052cc" />
          <stop offset="1" stopColor="#2684ff" />
        </linearGradient>
        <linearGradient id={gradB} x1="98.031%" x2="58.888%" y1=".161%" y2="40.766%" href={`#${gradA}`} />
        <linearGradient id={gradC} x1="100.665%" x2="55.402%" y1=".455%" y2="44.727%" href={`#${gradA}`} />
      </defs>
      <path
        d="M244.658 0H121.707a55.502 55.502 0 0 0 55.502 55.502h22.649V77.37c.02 30.625 24.841 55.447 55.466 55.467V10.666C255.324 4.777 250.55 0 244.658 0z"
        fill="#2684ff"
      />
      <path
        d="M183.822 61.262H60.872c.019 30.625 24.84 55.447 55.466 55.467h22.649v21.938c.039 30.625 24.877 55.43 55.502 55.43V71.93c0-5.891-4.776-10.667-10.667-10.667z"
        fill={`url(#${gradB})`}
      />
      <path
        d="M122.951 122.489H0c0 30.653 24.85 55.502 55.502 55.502h22.72v21.867c.02 30.597 24.798 55.408 55.396 55.466V133.156c0-5.891-4.776-10.667-10.667-10.667z"
        fill={`url(#${gradC})`}
      />
    </svg>
  );
}

function PagerDutyBrandIcon({ className }: IconProps) {
  return (
    <Svg className={className} viewBox="0 0 24 24">
      <path
        fill="#06AC38"
        d="M4 2.5h8.2c4.7 0 7.8 2.9 7.8 7.1 0 4.3-3.2 7.2-7.9 7.2H8.2v4.7H4V2.5Zm4.2 3.7v7.1h3.7c2.5 0 3.9-1.3 3.9-3.6s-1.4-3.5-3.9-3.5H8.2Z"
      />
    </Svg>
  );
}

/** Schedule clock icon (Lucide, ISC) for trigger menus/cards. */
export function ScheduleTriggerIcon({ className }: IconProps) {
  return <Clock3 className={cn("shrink-0 text-[#F0EFE2]/80", className)} aria-hidden />;
}

/** Webhook/link icon (Lucide, ISC) for trigger menus/cards. */
export function WebhookTriggerIcon({ className }: IconProps) {
  return <Link2 className={cn("shrink-0 text-[#F0EFE2]/80", className)} aria-hidden />;
}

const TRIGGER_FAMILY_ICONS: Record<TriggerFamilyIconId, React.ComponentType<IconProps>> = {
  github: GitHubBrandIcon,
  schedule: ScheduleTriggerIcon,
  slack: SlackBrandIcon,
  webhook: WebhookTriggerIcon,
};

export function TriggerFamilyIcon({
  id,
  className = "size-4",
}: {
  id: TriggerFamilyIconId;
  className?: string;
}) {
  const Icon = TRIGGER_FAMILY_ICONS[id];
  const tone = id === "github" ? "text-[#F0EFE2]" : undefined;
  return <Icon className={cn(tone, className)} />;
}

const CONNECTOR_LABELS: Record<AutomationConnectorId, string> = {
  github: "GitHub",
  slack: "Slack",
  jira: "Jira",
  notion: "Notion",
  stripe: "Stripe",
  datadog: "Datadog",
  sentry: "Sentry",
  circleci: "CircleCI",
  cloudflare: "Cloudflare",
  metabase: "Metabase",
  hubspot: "HubSpot",
  jam: "Jam",
  asana: "Asana",
  figma: "Figma",
  sonarqube: "SonarQube",
  pagerduty: "PagerDuty",
  linear: "Linear",
};

const CONNECTOR_ICONS: Partial<Record<AutomationConnectorId, React.ComponentType<IconProps>>> = {
  github: GitHubBrandIcon,
  slack: SlackBrandIcon,
  jira: JiraBrandIcon,
  notion: NotionBrandIcon,
  stripe: catalogConnectorIcon("stripe"),
  datadog: catalogConnectorIcon("datadog"),
  sentry: catalogConnectorIcon("sentry"),
  circleci: catalogConnectorIcon("circleci"),
  cloudflare: catalogConnectorIcon("cloudflare"),
  metabase: catalogConnectorIcon("metabase"),
  hubspot: catalogConnectorIcon("hubspot"),
  jam: catalogConnectorIcon("jam"),
  asana: catalogConnectorIcon("asana"),
  figma: catalogConnectorIcon("figma"),
  sonarqube: catalogConnectorIcon("sonarqube"),
  pagerduty: PagerDutyBrandIcon,
  linear: LinearBrandIcon,
};

export function connectorBrandId(id: string): AutomationConnectorId | null {
  const key = id.trim().replace(/_/g, "-").toLowerCase();
  if (SUPPORTED_CONNECTORS.has(key as AutomationConnectorId)) {
    return key as AutomationConnectorId;
  }
  return null;
}

const SETTINGS_INTEGRATION_ICONS: Record<
  SettingsIntegrationId,
  React.ComponentType<IconProps>
> = {
  github: GitHubBrandIcon,
  gitlab: GitLabBrandIcon,
  bitbucket: BitbucketBrandIcon,
  slack: SlackBrandIcon,
  teams: MicrosoftTeamsBrandIcon,
  linear: LinearBrandIcon,
  jira: JiraBrandIcon,
  notion: NotionBrandIcon,
};

/** Brand icon for supported automation connectors (github, slack, jira). */
export function ConnectorBrandIcon({ id, className = "size-4" }: { id: string; className?: string }) {
  const key = connectorBrandId(id);
  if (!key) return null;
  const Icon = CONNECTOR_ICONS[key];
  const tone = key === "github" ? "text-[#F0EFE2]" : undefined;
  if (Icon) return <Icon className={cn(tone, className)} />;
  const label = CONNECTOR_LABELS[key];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-sm text-[9px] font-bold uppercase leading-none text-[#F0EFE2]/65",
        className,
      )}
      aria-hidden
    >
      {label.slice(0, 1)}
    </span>
  );
}

/** Brand icon for settings integration rows (github, gitlab, slack, …). */
export function SettingsIntegrationIcon({
  id,
  className = "size-5",
}: {
  id: SettingsIntegrationId;
  className?: string;
}) {
  const Icon = SETTINGS_INTEGRATION_ICONS[id];
  const tone = id === "github" ? "text-[#F0EFE2]" : undefined;
  return <Icon className={cn(tone, className)} />;
}

/** MemoryOS built-in memory surface — always available in automations. */
export function MemoryOsBrandIcon({ className }: IconProps) {
  return (
    <Brain
      className={cn("shrink-0 text-indigo-300", className)}
      aria-hidden
    />
  );
}

const PILL_LABELS: Record<AutomationIntegrationPill, string> = {
  github: "GitHub",
  slack: "Slack",
  jira: "Jira",
  notion: "Notion",
  memoryos: "Memory",
  stripe: "Stripe",
  datadog: "Datadog",
  sentry: "Sentry",
  circleci: "CircleCI",
  pagerduty: "PagerDuty",
  linear: "Linear",
  cloudflare: "Cloudflare",
  metabase: "Metabase",
  hubspot: "HubSpot",
  jam: "Jam",
  asana: "Asana",
  figma: "Figma",
  sonarqube: "SonarQube",
};

function IntegrationPillIcon({ pill, className }: { pill: AutomationIntegrationPill; className?: string }) {
  if (pill === "memoryos") {
    return <MemoryOsBrandIcon className={className} />;
  }
  const connector = connectorBrandId(pill);
  if (connector) {
    return <ConnectorBrandIcon id={connector} className={className} />;
  }
  return (
    <span className={cn("text-[9px] font-bold uppercase tracking-wide text-[#F0EFE2]/50", className)}>
      {pill.slice(0, 2)}
    </span>
  );
}

export function AutomationConnectorIcons({
  connectors,
  className,
  iconClassName = "size-4",
  chipClassName = "size-7",
}: {
  connectors: AutomationConnectorId[];
  className?: string;
  iconClassName?: string;
  chipClassName?: string;
}) {
  const ids = connectors.filter((id) => SUPPORTED_CONNECTORS.has(id));
  if (!ids.length) return null;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {ids.map((id) => (
        <span
          key={id}
          className={cn(
            "inline-flex items-center justify-center rounded-md border border-[#2F2F2F] bg-[#0A0A0A]",
            chipClassName,
          )}
          title={id}
        >
          <ConnectorBrandIcon id={id} className={iconClassName} />
        </span>
      ))}
    </div>
  );
}

export function AutomationIntegrationPills({
  pills,
  className,
  muted = false,
}: {
  pills: AutomationIntegrationPill[];
  className?: string;
  muted?: boolean;
}) {
  if (!pills.length) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {pills.map((pill) => (
        <span
          key={pill}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
            muted
              ? "border-[#2F2F2F] bg-[#0A0A0A]/50 text-[#F0EFE2]/35"
              : "border-[#3A3A3A] bg-[#0A0A0A] text-[#F0EFE2]/60",
          )}
          title={PILL_LABELS[pill]}
        >
          <IntegrationPillIcon pill={pill} className="size-3" />
          {PILL_LABELS[pill]}
        </span>
      ))}
    </div>
  );
}

export function ConnectorBrandAvatar({
  connectorId,
  className,
  iconClassName = "size-6",
}: {
  connectorId: string;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <div
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-md border border-black/[0.06] bg-white shadow-sm",
        className,
      )}
    >
      <ConnectorBrandIcon id={connectorId} className={iconClassName} />
    </div>
  );
}
