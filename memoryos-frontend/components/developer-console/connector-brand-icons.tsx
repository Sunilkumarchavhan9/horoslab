"use client";

import { useId, type ComponentType, type ReactNode } from "react";
import { FolderOpen, GithubLogo, Globe, type Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type IconProps = { className?: string };

function Svg({ className, children, viewBox = "0 0 24 24" }: IconProps & { children: ReactNode; viewBox?: string }) {
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

/** Google Drive — official multicolor triangle mark (48×48). */
function GoogleDriveIcon({ className }: IconProps) {
  return (
    <Svg className={className} viewBox="0 0 48 48">
      <path
        fill="#1e88e5"
        d="M38.59,39c-0.535,0.93-0.298,1.68-1.195,2.197C36.498,41.715,35.465,42,34.39,42H13.61 c-1.074,0-2.106-0.285-3.004-0.802C9.708,40.681,9.945,39.93,9.41,39l7.67-9h13.84L38.59,39z"
      />
      <path
        fill="#fbc02d"
        d="M27.463,6.999c1.073-0.002,2.104-0.716,3.001-0.198c0.897,0.519,1.66,1.27,2.197,2.201l10.39,17.996 c0.537,0.93,0.807,1.967,0.808,3.002c0.001,1.037-1.267,2.073-1.806,3.001l-11.127-3.005l-6.924-11.993L27.463,6.999z"
      />
      <path
        fill="#e53935"
        d="M43.86,30c0,1.04-0.27,2.07-0.81,3l-3.67,6.35c-0.53,0.78-1.21,1.4-1.99,1.85L30.92,30H43.86z"
      />
      <path
        fill="#4caf50"
        d="M5.947,33.001c-0.538-0.928-1.806-1.964-1.806-3c0.001-1.036,0.27-2.073,0.808-3.004l10.39-17.996 c0.537-0.93,1.3-1.682,2.196-2.2c0.897-0.519,1.929,0.195,3.002,0.197l3.459,11.009l-6.922,11.989L5.947,33.001z"
      />
      <path
        fill="#1565c0"
        d="M17.08,30l-6.47,11.2c-0.78-0.45-1.46-1.07-1.99-1.85L4.95,33c-0.54-0.93-0.81-1.96-0.81-3H17.08z"
      />
      <path
        fill="#2e7d32"
        d="M30.46,6.8L24,18L17.53,6.8c0.78-0.45,1.66-0.73,2.6-0.79L27.46,6C28.54,6,29.57,6.28,30.46,6.8z"
      />
    </Svg>
  );
}

/** Amazon S3 — orange object-storage mark (48×48). */
function AmazonS3Icon({ className }: IconProps) {
  return (
    <Svg className={className} viewBox="0 0 48 48">
      <path
        fill="#ff8f00"
        d="M42 11L47.691 9 42 7 36.309 9zM43 12.667L43 19 48 17.333 48 11zM41 12.667L36 11 36 17.333 41 19zM28 11L33.691 9 28 7 22.309 9zM29 12.667L29 19 34 17.333 34 11zM27 12.667L22 11 22 17.333 27 19zM21 23L26.691 21 21 19 15.309 21zM22 24.667L22 31 27 29.333 27 23zM20 24.667L15 23 15 29.333 20 31zM7 23L12.691 21 7 19 1.309 21zM8 24.667L8 31 13 29.333 13 23zM6 24.667L1 23 1 29.333 6 31zM14 35L19.691 33 14 31 8.309 33zM15 36.667L15 43 20 41.333 20 35zM13 36.667L8 35 8 41.333 13 43z"
      />
    </Svg>
  );
}

/** Gmail — brand envelope (Simple Icons path, #EA4335). */
function GmailIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        fill="#EA4335"
        d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L12 9.548l8.073-6.055C21.69 2.28 24 3.434 24 5.457z"
      />
    </Svg>
  );
}

/** Microsoft OneDrive (#0078D4). */
function OneDriveIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        fill="#0078D4"
        d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"
      />
    </Svg>
  );
}

/** Zendesk (#03363D). */
function ZendeskIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path
        fill="#03363D"
        d="M12.914 2.523v16.855L24 2.523h-11.086zM0 2.523l7.771 11.96L0 19.477V2.523zm12.914 0L24 2.523H12.914zm0 16.855L0 19.477h12.914zM0 2.523h7.771L0 8.685V2.523z"
      />
    </Svg>
  );
}

/** Slack mark (Font Awesome geometry, official four-color palette). */
function SlackIcon({ className }: IconProps) {
  return (
    <svg className={cn("shrink-0", className)} viewBox="0 0 640 640" aria-hidden xmlns="http://www.w3.org/2000/svg">
      {/* bottom-left — red */}
      <path
        fill="#E01E5A"
        d="M190.1 379.1C190.1 405 168.9 426.2 143 426.2C117.1 426.2 96 405 96 379.1C96 353.2 117.2 332 143.1 332L190.2 332L190.2 379.1zM213.8 379.1C213.8 353.2 235 332 260.9 332C286.8 332 308 353.2 308 379.1L308 496.9C308 522.8 286.8 544 260.9 544C235 544 213.8 522.8 213.8 496.9L213.8 379.1z"
      />
      {/* top-left — cyan */}
      <path
        fill="#36C5F0"
        d="M260.9 190.1C235 190.1 213.8 168.9 213.8 143C213.8 117.1 235 96 260.9 96C286.8 96 308 117.2 308 143.1L308 190.2L260.9 190.2zM260.9 213.8C286.8 213.8 308 235 308 260.9C308 286.8 286.8 308 260.9 308L143.1 308C117.2 308 96 286.8 96 260.9C96 235 117.2 213.8 143.1 213.8L260.9 213.8z"
      />
      {/* top-right — green */}
      <path
        fill="#2EB67D"
        d="M449.9 260.9C449.9 235 471.1 213.8 497 213.8C522.9 213.8 544 235 544 260.9C544 286.8 522.8 308 496.9 308L449.8 308L449.8 260.9zM426.2 260.9C426.2 286.8 405 308 379.1 308C353.2 308 332 286.8 332 260.9L332 143.1C332 117.2 353.2 96 379.1 96C405 96 426.2 117.2 426.2 143.1L426.2 260.9z"
      />
      {/* bottom-right — yellow */}
      <path
        fill="#ECB22E"
        d="M379.1 449.9C405 449.9 426.2 471.1 426.2 497C426.2 522.9 405 544 379.1 544C353.2 544 332 522.8 332 496.9L332 449.8L379.1 449.8zM379.1 426.2C353.2 426.2 332 405 332 379.1C332 353.2 353.2 332 379.1 332L496.9 332C522.8 332 544 353.2 544 379.1C544 405 522.8 426.2 496.9 426.2L379.1 426.2z"
      />
    </svg>
  );
}

/** Official Jira logo (Atlassian blue gradient mark). */
function JiraIcon({ className }: IconProps) {
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

function PhosphorBrand({
  icon: PhosphorIcon,
  className,
  color,
}: {
  icon: Icon;
  className?: string;
  color?: string;
}) {
  return <PhosphorIcon className={className} weight="duotone" color={color} aria-hidden />;
}

const CONNECTOR_ICONS: Record<string, ComponentType<IconProps>> = {
  github: ({ className }) => <PhosphorBrand icon={GithubLogo} className={className} color="#181717" />,
  "local-files": ({ className }) => <FolderOpen className={cn(className, "text-[#D97706]")} weight="duotone" aria-hidden />,
  "google-drive": GoogleDriveIcon,
  onedrive: OneDriveIcon,
  gmail: GmailIcon,
  zendesk: ZendeskIcon,
  jira: JiraIcon,
  "web-crawler": ({ className }) => <Globe className={cn(className, "text-[#0F766E]")} weight="duotone" aria-hidden />,
  "amazon-s3": AmazonS3Icon,
  slack: SlackIcon,
};

/** Maps backend type (`local_files`) or catalog id (`local-files`) to icon key. */
export function connectorBrandId(typeOrId: string): string {
  return typeOrId.trim().replace(/_/g, "-").toLowerCase();
}

export function ConnectorBrandIcon({ id, className = "size-6" }: { id: string; className?: string }) {
  const key = connectorBrandId(id);
  const Icon = CONNECTOR_ICONS[key];
  if (Icon) return <Icon className={className} />;
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md bg-[#F3F4F6] text-[10px] font-bold uppercase text-[#6B7280]",
        className,
      )}
    >
      {key.slice(0, 2)}
    </span>
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
        "grid size-11 shrink-0 place-items-center rounded-xl border border-black/[0.06] bg-white shadow-sm",
        className,
      )}
    >
      <ConnectorBrandIcon id={connectorId} className={iconClassName} />
    </div>
  );
}

/** For extract chips keyed by display name. */
export function connectorBrandIdFromName(name: string): string {
  const map: Record<string, string> = {
    GitHub: "github",
    "Local Files": "local-files",
    "Google Drive": "google-drive",
    OneDrive: "onedrive",
    Gmail: "gmail",
    Zendesk: "zendesk",
    Jira: "jira",
    Slack: "slack",
  };
  return map[name] ?? connectorBrandId(name);
}
