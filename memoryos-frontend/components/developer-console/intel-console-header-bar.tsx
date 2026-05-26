"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bell, ChevronRight, FolderOpen, HelpCircle } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import type { RequestSectionEvent } from "@/components/developer-console/sections/requests-section";
import { cn } from "@/lib/utils";

export type IntelHeaderNotification = {
  id: string;
  title: string;
  detail: string;
  tone: "info" | "success" | "warning" | "error";
  at: string;
  navigateTo?: string;
};

const SOURCE_SLOT_COUNT = 5;

function formatHeaderTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Just now";
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60_000) return "Just now";
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function agentLabel(event: RequestSectionEvent): string {
  const name = event.agent?.trim();
  if (name) return name;
  if (event.type === "handoff") return "Handoff agent";
  if (event.type === "resume") return "Continuity agent";
  return "Workspace agent";
}

export function buildHeaderNotifications(input: {
  requestEvents: RequestSectionEvent[];
  memoryCount: number;
  hasConnectedSource?: boolean;
  installationConnected?: boolean;
}): IntelHeaderNotification[] {
  const items: IntelHeaderNotification[] = [];
  const now = new Date().toISOString();

  if (!input.hasConnectedSource && input.memoryCount === 0) {
    items.push({
      id: "notify-no-sources",
      title: "Connect your first intelligence source",
      detail: "GitHub or local files give agents repo-aware memory before handoffs and debugging.",
      tone: "warning",
      at: now,
      navigateTo: "Connected Intelligence Sources",
    });
  }

  if (input.installationConnected) {
    items.push({
      id: "notify-sdk-live",
      title: "SDK installation verified",
      detail: "Live events are reaching this workspace — agents can read and write memory.",
      tone: "success",
      at: now,
      navigateTo: "Integrations & SDK",
    });
  }

  for (const event of input.requestEvents) {
    if (event.status === "Error") {
      items.push({
        id: `notify-err-${event.id}`,
        title: `Agent runtime error · ${agentLabel(event)}`,
        detail: event.errorDetails ?? `HTTP ${event.statusCode} on ${event.type || "request"}.`,
        tone: "error",
        at: event.createdAt,
        navigateTo: "Runtime Activity",
      });
      if (items.length >= 12) break;
      continue;
    }
    if (event.type === "handoff") {
      items.push({
        id: `notify-handoff-${event.id}`,
        title: "Handoff ready for review",
        detail: `${agentLabel(event)} published a transfer brief for your team.`,
        tone: "info",
        at: event.createdAt,
        navigateTo: "Continuity Lab",
      });
    }
    if (event.type === "memory_add") {
      items.push({
        id: `notify-mem-${event.id}`,
        title: "New memory indexed",
        detail: `${agentLabel(event)} stored context in the organizational graph.`,
        tone: "success",
        at: event.createdAt,
        navigateTo: "Memory Graph",
      });
    }
    if (event.latencyMs >= 2500 && (event.type === "retrieve" || event.type === "resume")) {
      items.push({
        id: `notify-slow-${event.id}`,
        title: "Slow retrieval detected",
        detail: `${event.type} took ${event.latencyMs}ms — check source health and connectors.`,
        tone: "warning",
        at: event.createdAt,
        navigateTo: "Connected Intelligence Sources",
      });
    }
    if (items.length >= 12) break;
  }

  return items.slice(0, 10);
}

const toneDot: Record<IntelHeaderNotification["tone"], string> = {
  info: "bg-[#6366F1]",
  success: "bg-[#10B981]",
  warning: "bg-[#F59E0B]",
  error: "bg-[#EF4444]",
};

function HeaderNotificationsPanel({
  notifications,
  onNavigate,
  onClose,
}: {
  notifications: IntelHeaderNotification[];
  onNavigate?: (item: string) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-xl"
    >
      <div className="border-b border-[#F3F4F6] px-3 py-2.5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6B7280]">Notifications</p>
        <p className="mt-0.5 text-[11px] text-[#9CA3AF]">Workspace alerts for your team</p>
      </div>
      <div className="max-h-72 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-[#9CA3AF]">You&apos;re caught up.</p>
        ) : (
          notifications.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.navigateTo) onNavigate?.(item.navigateTo);
                onClose();
              }}
              className="flex w-full gap-2 border-b border-[#F3F4F6] px-3 py-3 text-left transition last:border-b-0 hover:bg-[#F9FAFB]"
            >
              <span className={cn("mt-1 size-2 shrink-0 rounded-full", toneDot[item.tone])} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[#111827]">{item.title}</span>
                  <span className="shrink-0 text-[10px] text-[#9CA3AF]">{formatHeaderTime(item.at)}</span>
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-[#6B7280]">{item.detail}</span>
              </span>
              {item.navigateTo ? <ChevronRight className="mt-0.5 size-4 shrink-0 text-[#D1D5DB]" /> : null}
            </button>
          ))
        )}
      </div>
    </motion.div>
  );
}

/** Sidebar footer strip — company brain runtime (original compact placement). */
export function CompanyBrainRuntimeSidebar({
  sourceProgress,
  memoryCount,
  runtimeHealthy,
}: {
  sourceProgress: number;
  memoryCount: number;
  runtimeHealthy: boolean;
}) {
  const statusLabel = runtimeHealthy ? "Operational" : "Syncing";

  return (
    <div className="w-full border-b border-[#E5E7EB] pb-3">
      <div className="flex w-full items-center gap-2">
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-sm font-semibold text-[#111827]">Company brain runtime</p>
          <p className="mt-0.5 text-[11px] text-[#6B7280]">
            {sourceProgress}/{SOURCE_SLOT_COUNT} sources · {memoryCount} mem
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <div className="flex gap-0.5">
            {Array.from({ length: SOURCE_SLOT_COUNT }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "grid size-6 place-items-center rounded-md",
                  i < sourceProgress ? "bg-[#FEF3C7] text-[#B45309]" : "bg-[#F3F4F6] text-[#D1D5DB]",
                )}
              >
                <FolderOpen className="size-3" strokeWidth={1.75} />
              </span>
            ))}
          </div>
          <span
            className={cn(
              "text-xs font-medium whitespace-nowrap",
              runtimeHealthy ? "text-[#059669]" : "text-[#D97706]",
            )}
          >
            {statusLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

type IntelConsoleHeaderBarProps = {
  orgName: string;
  activeSection: string;
  notifications: IntelHeaderNotification[];
  onNavigate?: (item: string) => void;
  headerRight?: ReactNode;
};

export function IntelConsoleHeaderBar({
  orgName,
  activeSection,
  notifications,
  onNavigate,
  headerRight,
}: IntelConsoleHeaderBarProps) {
  const [notifyOpen, setNotifyOpen] = useState(false);
  const badgeCount = useMemo(() => notifications.length, [notifications]);

  return (
    <header className="shrink-0 border-b border-[#E5E7EB] bg-white">
      <div className="flex items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4">
        <div className="hidden min-w-[5.5rem] shrink-0 leading-tight sm:block">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9CA3AF]">Workspace</p>
          <p className="truncate text-xs font-semibold text-[#111827]">{orgName}</p>
          <p className="truncate text-[10px] text-[#6B7280]">{activeSection}</p>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1" data-console-header-chrome data-no-pixel-load>
          <button
            type="button"
            data-no-pixel-load
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-[#6B7280] transition hover:bg-[#F9FAFB]"
            onClick={() => onNavigate?.("Integrations & SDK")}
          >
            <HelpCircle className="size-3 shrink-0" />
            <span className="hidden md:inline">Help center</span>
          </button>
          <div className="relative">
            <button
              type="button"
              data-no-pixel-load
              onClick={() => setNotifyOpen((open) => !open)}
              className="relative flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-[#6B7280] transition hover:bg-[#F9FAFB]"
              aria-expanded={notifyOpen}
            >
              <Bell className="size-3 shrink-0" />
              <span className="hidden md:inline">Notifications</span>
              {badgeCount > 0 ? (
                <span className="grid min-w-[1rem] place-items-center rounded-full bg-[#EF4444] px-1 text-[9px] font-bold leading-none text-white">
                  {badgeCount > 9 ? "9+" : badgeCount}
                </span>
              ) : null}
            </button>
            <AnimatePresence>
              {notifyOpen ? (
                <HeaderNotificationsPanel
                  notifications={notifications}
                  onNavigate={onNavigate}
                  onClose={() => setNotifyOpen(false)}
                />
              ) : null}
            </AnimatePresence>
          </div>
          {headerRight}
        </div>
      </div>
    </header>
  );
}
