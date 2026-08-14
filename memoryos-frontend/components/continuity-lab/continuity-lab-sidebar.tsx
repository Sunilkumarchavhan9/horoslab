"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import {
  BookOpen,
  Bot,
  Brain,
  GitBranch,
  GitPullRequest,
  MessageCircle,
  Search,
  Settings,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useContinuityLab } from "@/components/continuity-lab/continuity-lab-context";
import { projectIdFromRepo } from "@/lib/continuity-lab/company-model";
import {
  formatPrLabel,
  readReviewStorage,
  type RecentPullRequest,
} from "@/lib/continuity-lab/review-storage";
import { readAutomationStorage } from "@/lib/continuity-lab/automation-storage";
import { AUTOMATIONS_CHANGED_EVENT } from "@/lib/continuity-lab/automation-events";
import {
  fetchAutomationsFromApi,
  subscribeAutomationEvents,
} from "@/lib/continuity-lab/automation-api";
import { readWikiStorage, wikiRepoHref } from "@/lib/continuity-lab/wiki";
import { ContinuityLabRecentSessions } from "@/components/continuity-lab/continuity-lab-recent-sessions";
import { MemoryosLogoTile } from "@/components/continuity-lab/memoryos-logo-mark";
import { MemoryOSFullLogo } from "@/components/landing/memoryos-full-logo";
import { MemoryosProfileMenu } from "@/components/memoryos/memoryos-profile-menu";
import { readDevConsoleOrgDisplayName } from "@/lib/continuity-lab/settings-org";
import { SidebarPanelToggleIcon } from "@/components/continuity-lab/sidebar-panel-toggle-icon";
import {
  labBetaBadge,
  labNavActive,
  labNavIdle,
  labSearchInput,
  labSidebarBg,
  labSidebarEdge,
} from "@/components/continuity-lab/continuity-lab-section-ui";

const NAV_ITEMS = [
  { href: "/continuity-lab", label: "Sessions", icon: Bot, exact: true },
  { href: "/continuity-lab/ask", label: "Ask", icon: MessageCircle },
  { href: "/continuity-lab/spine", label: "Spine", icon: GitBranch },
  { href: "/continuity-lab/wiki", label: "Wiki", icon: BookOpen },
  { href: "/continuity-lab/review", label: "Review", icon: GitPullRequest },
  {
    href: "/continuity-lab/automations",
    label: "Automations",
    icon: Workflow,
    badge: "Beta",
  },
] as const;

const RECENT_LIST_SCROLL_CLASS =
  "continuity-lab-sidebar-recent-scroll min-h-0 flex-1 overflow-y-auto";

type SidebarRecentKind = "sessions" | "wiki" | "review" | "automations";

function sidebarRecentKind(pathname: string): SidebarRecentKind {
  if (
    pathname === "/continuity-lab/sessions" ||
    pathname.startsWith("/continuity-lab/session/")
  ) {
    return "sessions";
  }
  if (
    pathname === "/continuity-lab/wiki" ||
    pathname.startsWith("/continuity-lab/wiki/")
  ) {
    return "wiki";
  }
  if (
    pathname === "/continuity-lab/review" ||
    pathname.startsWith("/continuity-lab/review/")
  ) {
    return "review";
  }
  if (
    pathname === "/continuity-lab/automations" ||
    pathname.startsWith("/continuity-lab/automations/")
  ) {
    return "automations";
  }
  return "sessions";
}

function deferSidebarStateUpdate(callback: () => void): void {
  if (typeof queueMicrotask === "function") {
    queueMicrotask(callback);
    return;
  }
  window.setTimeout(callback, 0);
}

function RecentSectionShell({
  title,
  headerExtra,
  children,
}: {
  title: string;
  headerExtra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0">
        <p className="px-0.5 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
          {title}
        </p>
        {headerExtra}
      </div>
      <div className={RECENT_LIST_SCROLL_CLASS}>{children}</div>
    </div>
  );
}

function RecentSearchInput({
  value,
  onChange,
  placeholder = "Search",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative mb-2">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-white/35" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={labSearchInput}
      />
    </div>
  );
}

type ContinuityLabSidebarProps = {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobile?: boolean;
};

const SIDEBAR_WIDTH_EXPANDED = 240;
const SIDEBAR_WIDTH_COLLAPSED = 52;

function SidebarNavIcon({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.span
      className="inline-flex shrink-0"
      whileHover={reduceMotion ? undefined : { scale: 1.05 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
    >
      {children}
    </motion.span>
  );
}

export function ContinuityLabSidebar({
  collapsed = false,
  onToggleCollapse,
  mobile = false,
}: ContinuityLabSidebarProps) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const { connector, setSidebarOpen, modelReady, openCompanyModelModal } =
    useContinuityLab();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [orgDisplayName, setOrgDisplayName] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    deferSidebarStateUpdate(() => {
      if (active) setOrgDisplayName(readDevConsoleOrgDisplayName());
    });
    return () => {
      active = false;
    };
  }, []);

  const profileOrgName = orgDisplayName ?? "MemoryOS";
  const profileEmail =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress ??
    "developer@memoryos.local";
  const profileUserName =
    user?.fullName?.trim() ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.username ||
    "MemoryOS User";
  const profileInitial = profileUserName.slice(0, 1).toUpperCase();
  const sidebarWidth = mobile
    ? undefined
    : collapsed
      ? SIDEBAR_WIDTH_COLLAPSED
      : SIDEBAR_WIDTH_EXPANDED;
  const recentKind = sidebarRecentKind(pathname);
  const onWikiRoute = recentKind === "wiki";
  const onReviewRoute = recentKind === "review";
  const onAutomationsRoute = recentKind === "automations";
  const [recentWikiRepos, setRecentWikiRepos] = useState<string[]>([]);
  const [recentPrs, setRecentPrs] = useState<RecentPullRequest[]>([]);
  const [recentPrSearch, setRecentPrSearch] = useState("");
  const [recentAutomations, setRecentAutomations] = useState<
    ReturnType<typeof readAutomationStorage>["recentAutomations"]
  >([]);
  const [recentAutomationSearch, setRecentAutomationSearch] = useState("");

  useEffect(() => {
    if (!onWikiRoute) return;
    let active = true;
    deferSidebarStateUpdate(() => {
      if (active) setRecentWikiRepos(readWikiStorage().recentRepos);
    });
    return () => {
      active = false;
    };
  }, [onWikiRoute, pathname]);

  useEffect(() => {
    if (!onReviewRoute) return;
    let active = true;
    deferSidebarStateUpdate(() => {
      if (!active) return;
      setRecentPrs(readReviewStorage().recentPrs);
      setRecentPrSearch("");
    });
    return () => {
      active = false;
    };
  }, [onReviewRoute, pathname]);

  useEffect(() => {
    if (!onAutomationsRoute) return;
    let active = true;
    const refreshRecentAutomations = async () => {
      if (!active) return;
      const response = await fetchAutomationsFromApi("all");
      if (!active) return;
      setRecentAutomations(
        response?.recentAutomations ??
          readAutomationStorage().recentAutomations,
      );
    };
    deferSidebarStateUpdate(() => {
      void refreshRecentAutomations();
      setRecentAutomationSearch("");
    });
    const onAutomationsChanged = () => {
      void refreshRecentAutomations();
    };
    const unsubscribeRealtime = subscribeAutomationEvents();
    window.addEventListener(AUTOMATIONS_CHANGED_EVENT, onAutomationsChanged);
    return () => {
      active = false;
      unsubscribeRealtime();
      window.removeEventListener(
        AUTOMATIONS_CHANGED_EVENT,
        onAutomationsChanged,
      );
    };
  }, [onAutomationsRoute, pathname]);

  const filteredRecentPrs = recentPrSearch.trim()
    ? recentPrs.filter((entry) => {
        const q = recentPrSearch.trim().toLowerCase();
        return (
          entry.fullName.toLowerCase().includes(q) ||
          String(entry.pr).includes(q) ||
          entry.title?.toLowerCase().includes(q) ||
          entry.url.toLowerCase().includes(q)
        );
      })
    : recentPrs;

  const filteredRecentAutomations = recentAutomationSearch.trim()
    ? recentAutomations.filter((entry) => {
        const q = recentAutomationSearch.trim().toLowerCase();
        return (
          entry.name.toLowerCase().includes(q) ||
          entry.id.toLowerCase().includes(q)
        );
      })
    : recentAutomations;

  const isActive = (href: string, exact?: boolean) => {
    if (href === "/continuity-lab") {
      return (
        pathname === href ||
        pathname === "/continuity-lab/sessions" ||
        pathname.startsWith("/continuity-lab/session/")
      );
    }
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <motion.aside
      className={cn(
        "flex h-full shrink-0 flex-col overflow-hidden border-r",
        labSidebarBg,
        labSidebarEdge,
        mobile && "w-[min(280px,88vw)]",
      )}
      initial={false}
      animate={mobile ? undefined : { width: sidebarWidth }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
      }
    >
      <div
        className={cn(
          "flex h-12 shrink-0 items-center px-2.5",
          collapsed && !mobile ? "justify-center" : "gap-2.5",
        )}
      >
        {collapsed && !mobile ? (
          <MemoryosLogoTile size={28} />
        ) : (
          <motion.div
            className="min-w-0 flex-1"
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.15 }}
          >
            <MemoryOSFullLogo className="h-6 w-auto text-white" iconColor="#d4af37" textColor="#ffffff" />
          </motion.div>
        )}
        {onToggleCollapse && !mobile ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-md text-white/40 transition hover:bg-white/[0.06] hover:text-white/70",
              !collapsed && "shrink-0",
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <SidebarPanelToggleIcon
              mirrored={collapsed}
              className="size-[18px]"
            />
          </button>
        ) : null}
      </div>

      <nav className="shrink-0 px-1.5 py-1.5">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <li key={item.href + item.label}>
              <Link
                href={item.href}
                onClick={() => mobile && setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-1.5 text-[13px] font-medium transition",
                  isActive(item.href, "exact" in item ? item.exact : false)
                    ? labNavActive
                    : labNavIdle,
                )}
              >
                <SidebarNavIcon>
                  <item.icon className="size-4 opacity-80" />
                </SidebarNavIcon>
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {"badge" in item && item.badge ? (
                      <span className={labBetaBadge}>{item.badge}</span>
                    ) : null}
                  </>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {!collapsed ? (
        <div className="flex min-h-0 flex-1 flex-col border-t border-white/[0.04] px-1.5 pb-1.5 pt-2.5">
          {recentKind === "review" ? (
            <RecentSectionShell
              title="Recent"
              headerExtra={
                <RecentSearchInput
                  value={recentPrSearch}
                  onChange={setRecentPrSearch}
                />
              }
            >
              {filteredRecentPrs.length === 0 ? (
                <p className="px-0.5 text-[11px] leading-relaxed text-white/45">
                  No pull requests
                  {recentPrs.length === 0 ? (
                    <>
                      .{" "}
                      <Link
                        href="/continuity-lab/review"
                        onClick={() => mobile && setSidebarOpen(false)}
                        className="text-indigo-300/90 hover:text-indigo-200"
                      >
                        Paste a URL
                      </Link>{" "}
                      to start.
                    </>
                  ) : (
                    " match your search."
                  )}
                </p>
              ) : (
                <ul className="space-y-0.5 pr-0.5">
                  {filteredRecentPrs.map((entry) => (
                    <li key={`${entry.fullName}-${entry.pr}`}>
                      <Link
                        href={`/continuity-lab/review?pr=${encodeURIComponent(entry.url)}`}
                        onClick={() => mobile && setSidebarOpen(false)}
                        className="block rounded-md px-2 py-1.5 transition hover:bg-white/[0.04] hover:text-white"
                      >
                        <p className="truncate font-mono text-xs font-medium text-white/80">
                          {entry.fullName}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] text-white/40">
                          {formatPrLabel(entry)}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </RecentSectionShell>
          ) : null}

          {recentKind === "automations" ? (
            <RecentSectionShell
              title="Recent automations"
              headerExtra={
                <RecentSearchInput
                  value={recentAutomationSearch}
                  onChange={setRecentAutomationSearch}
                />
              }
            >
              {filteredRecentAutomations.length === 0 ? (
                <p className="px-0.5 text-[11px] leading-relaxed text-white/45">
                  No automations
                  {recentAutomations.length === 0 ? (
                    <>
                      .{" "}
                      <Link
                        href="/continuity-lab/automations/new"
                        onClick={() => mobile && setSidebarOpen(false)}
                        className="text-indigo-300/90 hover:text-indigo-200"
                      >
                        Create one
                      </Link>
                    </>
                  ) : (
                    " match your search."
                  )}
                </p>
              ) : (
                <ul className="space-y-0.5 pr-0.5">
                  {filteredRecentAutomations.map((entry) => (
                    <li key={entry.id}>
                      <Link
                        href={`/continuity-lab/automations/${encodeURIComponent(entry.id)}/edit`}
                        onClick={() => mobile && setSidebarOpen(false)}
                        className="block rounded-md px-2 py-1.5 transition hover:bg-white/[0.04] hover:text-white"
                      >
                        <p className="truncate text-xs font-medium text-white/80">
                          {entry.name}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </RecentSectionShell>
          ) : null}

          {recentKind === "wiki" ? (
            <RecentSectionShell title="Recent repos">
              {recentWikiRepos.length === 0 &&
              !connector.payload.github.repos.length ? (
                <p className="px-0.5 text-[11px] leading-relaxed text-white/45">
                  Connect GitHub and open a repo wiki.
                </p>
              ) : (
                <ul className="space-y-0.5 pr-0.5">
                  {(recentWikiRepos.length
                    ? recentWikiRepos
                    : connector.payload.github.repos
                        .slice(0, 6)
                        .map((r) => r.fullName)
                  ).map((fullName) => {
                    const pid = projectIdFromRepo(fullName);
                    const href = wikiRepoHref(pid);
                    return (
                      <li key={fullName}>
                        <Link
                          href={href}
                          onClick={() => mobile && setSidebarOpen(false)}
                          className={cn(
                            "block px-2 py-1.5 transition",
                            pathname.includes(pid)
                              ? labNavActive
                              : "text-white/60 hover:bg-white/[0.04] hover:text-white",
                          )}
                        >
                          <p className="truncate font-mono text-xs font-medium">
                            {fullName}
                          </p>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </RecentSectionShell>
          ) : null}

          {recentKind === "sessions" ? (
            <ContinuityLabRecentSessions mobile={mobile} />
          ) : null}
        </div>
      ) : (
        <div className="min-h-0 flex-1" aria-hidden />
      )}

      <div className="space-y-0.5 border-t border-white/[0.04] p-1.5">
        {!collapsed ? (
          <div className="px-1 pb-1">
              <MemoryosProfileMenu
                open={showProfileMenu}
                onToggle={() => setShowProfileMenu((open) => !open)}
                onClose={() => setShowProfileMenu(false)}
                orgName={profileOrgName}
              userEmail={profileEmail}
              userInitial={profileInitial}
              onSignOut={() =>
                void signOut({ redirectUrl: "/auth/sign-in" })
              }
                menuVariant="dark"
                fullWidthTrigger
                triggerLabel={profileOrgName}
              />
          </div>
        ) : null}
        <Link
          href="/pricing"
          onClick={() => mobile && setSidebarOpen(false)}
          className={cn(
            "flex items-center gap-2.5 px-2.5 py-1.5 text-[13px] font-medium",
            labNavIdle,
          )}
        >
          <SidebarNavIcon>
            <Zap className="size-4 text-white/50" />
          </SidebarNavIcon>
          {!collapsed && <span>Upgrade</span>}
        </Link>
        <Link
          href="/continuity-lab/settings"
          onClick={() => mobile && setSidebarOpen(false)}
          className={cn(
            "flex items-center gap-2.5 px-2.5 py-1.5 text-[13px] font-medium",
            pathname.startsWith("/continuity-lab/settings")
              ? labNavActive
              : labNavIdle,
          )}
        >
          <SidebarNavIcon>
            <Settings className="size-4 opacity-80" />
          </SidebarNavIcon>
          {!collapsed && <span>Settings</span>}
        </Link>
        <button
          type="button"
          onClick={() => {
            openCompanyModelModal();
            if (mobile) setSidebarOpen(false);
          }}
          className={cn(
            "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] font-medium",
            labNavIdle,
          )}
        >
          <SidebarNavIcon>
            <Sparkles className="size-4 opacity-80" />
          </SidebarNavIcon>
          {!collapsed && (
            <span className="flex flex-1 items-center justify-between gap-2">
              Company Model
              <span className="text-[9px] uppercase tracking-wide text-white/40">
                {modelReady ? "Ready" : "Set up"}
              </span>
            </span>
          )}
        </button>
        <Link
          href="/continuity-lab/wiki"
          onClick={() => mobile && setSidebarOpen(false)}
          className={cn(
            "flex items-center gap-2.5 px-2.5 py-1.5 text-[13px] font-medium",
            labNavIdle,
          )}
        >
          <SidebarNavIcon>
            <Brain className="size-4 opacity-80" />
          </SidebarNavIcon>
          {!collapsed && <span>Memory wiki</span>}
        </Link>
        <Link
          href="/mission-control"
          onClick={() => mobile && setSidebarOpen(false)}
          className={cn(
            "flex items-center gap-2.5 px-2.5 py-1.5 text-[13px] font-medium",
            labNavIdle,
          )}
        >
          <SidebarNavIcon>
            <Bot className="size-4 opacity-80" />
          </SidebarNavIcon>
          {!collapsed && <span>Mission Control</span>}
        </Link>
      </div>
    </motion.aside>
  );
}
