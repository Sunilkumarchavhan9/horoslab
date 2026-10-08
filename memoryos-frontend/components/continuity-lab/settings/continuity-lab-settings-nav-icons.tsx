"use client";

import type { ComponentType } from "react";
import {
  BookOpen,
  Brain,
  CreditCard,
  Gauge,
  GitBranch,
  KeyRound,
  Layers,
  Laptop,
  Link2,
  Monitor,
  Receipt,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import { MEMORYOS_STAR_PATH } from "@/components/continuity-lab/memoryos-logo-mark";
import {
  findSettingsNavGroupForSection,
  type SettingsSectionId,
} from "@/lib/continuity-lab/settings-nav";
import { cn } from "@/lib/utils";

type NavGroupId = "personal" | "organization";

const TILE_BY_GROUP: Record<NavGroupId, string> = {
  personal: "border-[#2F2F2F] bg-[#141414] text-[#F0EFE2]/70",
  organization: "border-[#2F2F2F] bg-[#141414] text-[#F0EFE2]/65",
};

function ContinuityLabProductIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 22 26"
      fill="currentColor"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={MEMORYOS_STAR_PATH} />
    </svg>
  );
}

const SECTION_ICONS: Record<SettingsSectionId, ComponentType<{ className?: string }>> = {
  preferences: SlidersHorizontal,
  "personal-connections": Link2,
  general: Settings2,
  "horos-api": KeyRound,
  connections: Link2,
  sessions: Monitor,
  plans: CreditCard,
  invoices: Receipt,
  usage: Gauge,
  "continuity-lab": ContinuityLabProductIcon,
  review: GitBranch,
  wiki: BookOpen,
  automations: Workflow,
  schedules: Zap,
  "memoryos-desktop": Laptop,
  "shell-integration": Terminal,
  "skills-rules": Brain,
  environment: Layers,
  knowledge: Sparkles,
  playbooks: Workflow,
  secrets: KeyRound,
  repositories: GitBranch,
  membership: Users,
  "memoryos-api": KeyRound,
  analytics: Gauge,
};

function navGroupId(sectionId: SettingsSectionId): NavGroupId {
  const group = findSettingsNavGroupForSection(sectionId);
  return (group?.id ?? "organization") as NavGroupId;
}

export function SettingsNavIcon({
  sectionId,
  variant = "sidebar",
}: {
  sectionId: SettingsSectionId;
  /** Sidebar uses compact tiles; index uses larger Devin-style tiles. */
  variant?: "sidebar" | "index";
}) {
  const Icon = SECTION_ICONS[sectionId];
  if (!Icon) return null;

  const groupId = navGroupId(sectionId);
  const tileClass = TILE_BY_GROUP[groupId];
  const iconClass = variant === "index" ? "size-4" : "size-3.5";
  const boxClass =
    variant === "index"
      ? "inline-flex size-8 shrink-0 items-center justify-center rounded-md border"
      : "inline-flex size-6 shrink-0 items-center justify-center rounded border";

  return (
    <span className={cn(boxClass, tileClass)} aria-hidden>
      <Icon className={iconClass} />
    </span>
  );
}
