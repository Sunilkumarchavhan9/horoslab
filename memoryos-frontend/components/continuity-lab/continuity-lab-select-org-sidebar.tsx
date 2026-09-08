"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  BookOpen,
  Bot,
  ChevronDown,
  CircleHelp,
  Clock3,
  Download,
  GitPullRequest,
  MessageCircleQuestion,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Zap,
} from "lucide-react";
import { useContinuityLab } from "@/components/continuity-lab/continuity-lab-context";
import { SidebarPanelToggleIcon } from "@/components/continuity-lab/sidebar-panel-toggle-icon";
import { cn } from "@/lib/utils";

const RECENTS_FALLBACK = [
  { id: "fallback-solve-bug", title: "Solve bug", meta: "18 hours ago" },
  { id: "fallback-greeting", title: "Greeting", meta: "19 hours ago" },
  { id: "fallback-fix", title: "Fix", meta: "19 hours ago" },
  { id: "fallback-fix-bug", title: "Fix bug", meta: "PR is ready · ⑂ 1", accent: true },
  { id: "fallback-poly", title: "Set up Sunilkumarchavhan9/20.Poly", meta: "3 days ago" },
];

const NAV_ITEMS = [
  { href: "/continuity-lab", label: "Sessions", icon: Bot, active: true },
  { href: "/continuity-lab/ask", label: "Ask", icon: MessageCircleQuestion },
  { href: "/continuity-lab/wiki", label: "Wiki", icon: BookOpen },
  { href: "/continuity-lab/review", label: "Review", icon: GitPullRequest },
  { href: "/continuity-lab/automations", label: "Automations", icon: Clock3, badge: "Beta" },
] as const;

export function ContinuityLabSelectOrgSidebar() {
  const { sessions } = useContinuityLab();
  const { user } = useUser();
  const displayName =
    user?.fullName?.trim() ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.username ||
    "Sunil Kumar Chavhan";
  const initial = displayName.slice(0, 1).toUpperCase();
  const recents = sessions.length
    ? sessions.slice(0, 6).map((session, index) => ({
        id: session.id || `session-${index}`,
        title: session.title || (session.id ? `Session ${session.id.slice(0, 8)}` : "Session"),
        meta: session.updatedAt ? "Recent" : "Recent",
      }))
    : RECENTS_FALLBACK;

  return (
    <aside className="hidden h-full w-[308px] shrink-0 flex-col border-r border-white/[0.07] bg-[#111111] text-[#F0EFE2] md:flex">
      <div className="flex h-[52px] shrink-0 items-center gap-2 px-6">
        <span className="inline-flex size-5 items-center justify-center rounded bg-white/[0.08] text-[11px] font-semibold text-[#F0EFE2]/65">
          {initial}
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{displayName}</span>
        <ChevronDown className="size-4 text-[#F0EFE2]/45" aria-hidden />
        <button
          type="button"
          className="ml-auto inline-flex size-8 items-center justify-center rounded-md text-[#F0EFE2]/45 hover:bg-white/[0.06] hover:text-[#F0EFE2]/70"
          aria-label="Collapse sidebar"
        >
          <SidebarPanelToggleIcon className="size-[18px]" />
        </button>
      </div>

      <nav className="shrink-0 px-2">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex h-9 items-center gap-3 rounded-md px-4 text-[14px] font-semibold",
                  "active" in item && item.active
                    ? "bg-white/[0.045] text-[#F0EFE2]"
                    : "text-[#F0EFE2]/58 hover:bg-white/[0.035] hover:text-[#F0EFE2]/80",
                )}
              >
                <item.icon className="size-4 shrink-0" strokeWidth={1.8} aria-hidden />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {"badge" in item && item.badge ? (
                  <span className="rounded-md bg-white/[0.08] px-2 py-0.5 text-[11px] font-semibold text-[#F0EFE2]/55">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-6 flex min-h-0 flex-1 flex-col px-6">
        <div className="mb-4 flex items-center gap-3">
          <p className="min-w-0 flex-1 text-[13px] font-semibold text-[#F0EFE2]/58">Recent</p>
          <Search className="size-4 text-[#F0EFE2]/45" aria-hidden />
          <Plus className="size-4 text-[#F0EFE2]/45" aria-hidden />
          <MoreHorizontal className="size-4 text-[#F0EFE2]/45" aria-hidden />
        </div>
        <ul className="min-h-0 flex-1 space-y-3 overflow-hidden">
          {recents.map((item) => (
            <li key={item.id}>
              <Link href="/continuity-lab" className="block">
                <p className="truncate text-[13px] font-semibold leading-5 text-[#F0EFE2]">
                  {item.title}
                </p>
                <p
                  className={cn(
                    "mt-0.5 truncate text-[12px] leading-4 text-[#F0EFE2]/55",
                    "accent" in item && item.accent ? "text-emerald-400" : undefined,
                  )}
                >
                  {item.meta}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="shrink-0 space-y-5 px-6 pb-6 pt-5">
        <Link
          href="/pricing"
          className="flex items-center gap-3 text-[14px] font-semibold text-sky-400 hover:text-sky-300"
        >
          <Zap className="size-4" aria-hidden />
          Upgrade
        </Link>
        <div className="flex items-center justify-between text-[#F0EFE2]/65">
          <Settings className="size-4" aria-hidden />
          <Download className="size-4" aria-hidden />
          <CircleHelp className="size-4" aria-hidden />
        </div>
      </div>
    </aside>
  );
}
