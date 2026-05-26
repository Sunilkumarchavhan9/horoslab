"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronLeft,
  ExternalLink,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { MemoryStarLogo } from "@/components/landing/memory-star-logo";
import { osNavIcon } from "@/components/developer-console/os-nav-icons";
import {
  CompanyBrainRuntimeSidebar,
  IntelConsoleHeaderBar,
  type IntelHeaderNotification,
} from "@/components/developer-console/intel-console-header-bar";
import { IntelNavSearch } from "@/components/developer-console/intel-nav-search";
import { intel, intelMotion } from "@/components/developer-console/intel-design";
import { cn } from "@/lib/utils";

export type IntelligenceNavGroup = {
  section: string;
  items: readonly string[];
};

type IntelligenceConsoleLayoutProps = {
  navGroups: readonly IntelligenceNavGroup[];
  activeItem: string;
  navSearchQuery: string;
  onNavSearchChange: (q: string) => void;
  onNavSelect: (item: string) => void;
  isWorkspaceTab: (item: string) => boolean;
  resolveItem: (item: string) => string;
  navBadges?: Record<string, string | number>;
  children: ReactNode;
  orgName: string;
  userInitial: string;
  userDisplayName: string;
  userEmail: string;
  memoryCount: number;
  runtimeHealthy: boolean;
  notifications?: IntelHeaderNotification[];
  onHeaderNavigate?: (item: string) => void;
  headerRight?: ReactNode;
};

function navSectionKey(section: string): string {
  return section.trim().length > 0 ? section : "main";
}

function buildExpandedMap(groups: readonly IntelligenceNavGroup[]): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const group of groups) {
    map[navSectionKey(group.section)] = true;
  }
  return map;
}

export function IntelligenceConsoleLayout({
  navGroups,
  activeItem,
  navSearchQuery,
  onNavSearchChange,
  onNavSelect,
  isWorkspaceTab,
  resolveItem,
  navBadges = {},
  children,
  orgName,
  userInitial,
  userDisplayName,
  userEmail,
  memoryCount,
  runtimeHealthy,
  notifications = [],
  onHeaderNavigate,
  headerRight,
}: IntelligenceConsoleLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() =>
    buildExpandedMap(navGroups),
  );
  const resolvedActive = resolveItem(activeItem);
  const sourceProgress = Math.min(memoryCount, 5);

  useEffect(() => {
    setExpandedSections((prev) => {
      const next = buildExpandedMap(navGroups);
      for (const key of Object.keys(prev)) {
        if (key in next) next[key] = prev[key];
      }
      return next;
    });
  }, [navGroups]);

  useEffect(() => {
    const activeGroup = navGroups.find((group) =>
      group.items.some((item) => resolveItem(item) === resolvedActive),
    );
    if (!activeGroup?.section) return;
    const key = navSectionKey(activeGroup.section);
    setExpandedSections((prev) => ({ ...prev, [key]: true }));
  }, [navGroups, resolvedActive, resolveItem]);

  useEffect(() => {
    if (!navSearchQuery.trim()) return;
    setExpandedSections((prev) => {
      const next = { ...prev };
      for (const group of navGroups) {
        if (group.section) next[navSectionKey(group.section)] = true;
      }
      return next;
    });
  }, [navSearchQuery, navGroups]);

  const isSectionExpanded = useMemo(
    () => (section: string) => expandedSections[navSectionKey(section)] ?? true,
    [expandedSections],
  );

  const toggleSection = (section: string) => {
    const key = navSectionKey(section);
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div
      className="memoryos-prody-shell developer-console-root relative flex h-dvh overflow-hidden text-[#111827]"
      style={{ background: intel.colors.canvas }}
    >
      <aside
        data-no-pixel-load
        data-console-sidebar
        className={cn(
          "relative z-20 flex shrink-0 flex-col border-r transition-[width] duration-300",
          collapsed ? "w-[72px] min-w-[72px]" : "w-[260px] min-w-[260px]",
        )}
        style={{ borderColor: intel.colors.borderStrong, background: intel.colors.sidebar }}
      >
        <div className="flex items-center justify-between px-4 py-4">
          {!collapsed ? (
            <Link href="/" className="block scale-[0.72] origin-left">
              <MemoryStarLogo tone="black" />
            </Link>
          ) : (
            <span className="mx-auto grid size-8 place-items-center rounded-lg bg-white text-xs font-bold text-[#111827] shadow-sm">
              M
            </span>
          )}
          <motion.button
            type="button"
            data-no-pixel-load
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCollapsed((c) => !c)}
            className="grid size-8 place-items-center rounded-lg border bg-white text-[#6B7280] shadow-sm hover:text-[#111827]"
            style={{ borderColor: intel.colors.borderStrong }}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />
          </motion.button>
        </div>

        {!collapsed ? (
          <div className="px-3 pb-2">
            <IntelNavSearch value={navSearchQuery} onChange={onNavSearchChange} placeholder="Search…" />
          </div>
        ) : null}

        <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto px-2 pb-2">
          {navGroups.map((group) => {
            const sectionOpen = collapsed || !group.section || isSectionExpanded(group.section);
            return (
            <div key={group.section || "main"}>
              {!collapsed && group.section ? (
                <button
                  type="button"
                  data-no-pixel-load
                  onClick={() => toggleSection(group.section)}
                  className="mb-1 flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left transition hover:bg-black/[0.04]"
                  aria-expanded={isSectionExpanded(group.section)}
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                    {group.section}
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-3.5 shrink-0 text-[#9CA3AF] transition-transform duration-200",
                      isSectionExpanded(group.section) && "rotate-180",
                    )}
                  />
                </button>
              ) : null}
              <AnimatePresence initial={false}>
                {sectionOpen ? (
                  <motion.div
                    key={`items-${group.section}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="space-y-0.5 overflow-hidden"
                  >
                {group.items.map((item) => {
                  const resolved = resolveItem(item);
                  const isActive = resolved === resolvedActive;
                  const NavIcon = osNavIcon(item);
                  const badge = navBadges[item] ?? navBadges[resolved];
                  const external = isWorkspaceTab(item);

                  return (
                    <motion.button
                      key={item}
                      type="button"
                      data-no-pixel-load
                      onClick={() => onNavSelect(item)}
                      whileHover={{ x: collapsed ? 0 : 1 }}
                      title={item}
                      className={cn(
                        "relative flex w-full items-center gap-2.5 rounded-xl py-2 text-left text-sm font-medium transition-colors",
                        collapsed ? "justify-center px-2" : "px-2.5",
                        isActive
                          ? "text-[#111827]"
                          : "text-[#6B7280] hover:bg-black/[0.03] hover:text-[#374151]",
                      )}
                    >
                      {isActive ? (
                        <span
                          aria-hidden
                          className="pointer-events-none absolute inset-0 rounded-xl bg-white transition-shadow duration-200"
                          style={{ boxShadow: intel.shadow.navActive }}
                        />
                      ) : null}
                      <NavIcon
                        className={cn(
                          "relative z-10 size-[18px] shrink-0",
                          isActive ? "text-[#111827]" : "text-[#9CA3AF]",
                        )}
                        strokeWidth={1.75}
                      />
                      {!collapsed ? (
                        <>
                          <span className="relative z-10 min-w-0 flex-1 truncate">{item}</span>
                          {badge !== undefined ? (
                            <span
                              className={cn(
                                "relative z-10 text-xs",
                                typeof badge === "string" && badge === "Core"
                                  ? "rounded-md bg-[#EEF2FF] px-1.5 py-0.5 font-semibold text-[#4338CA]"
                                  : "tabular-nums text-[#9CA3AF]",
                              )}
                            >
                              {badge}
                            </span>
                          ) : null}
                          {external ? (
                            <ExternalLink className="relative z-10 size-3 text-[#9CA3AF]" />
                          ) : null}
                        </>
                      ) : null}
                    </motion.button>
                  );
                })}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
          })}
        </nav>

        {!collapsed ? (
          <div
            className="shrink-0 border-t px-3 pt-3 pb-3"
            style={{ borderColor: intel.colors.borderStrong }}
          >
            <CompanyBrainRuntimeSidebar
              sourceProgress={sourceProgress}
              memoryCount={memoryCount}
              runtimeHealthy={runtimeHealthy}
            />
            <div className="flex items-center gap-2 px-0 pt-3">
              <span className="grid size-8 place-items-center rounded-full bg-[#E0E7FF] text-xs font-semibold text-[#4338CA]">
                {userInitial}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#111827]">{userDisplayName}</p>
                <p className="truncate text-[11px] text-[#9CA3AF]">{userEmail}</p>
              </div>
            </div>
          </div>
        ) : null}
      </aside>

      <main className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
        <IntelConsoleHeaderBar
          orgName={orgName}
          activeSection={resolvedActive}
          notifications={notifications}
          onNavigate={onHeaderNavigate}
          headerRight={headerRight}
        />

        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
          <motion.div
            key={resolvedActive}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={intelMotion.panel}
            className="developer-console-sections flex h-full min-h-0 w-full min-w-0 flex-1 flex-col"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
