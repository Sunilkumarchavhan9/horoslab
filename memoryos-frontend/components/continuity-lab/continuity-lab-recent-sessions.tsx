"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MoreHorizontal, Plus, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ContinuityLabSessionMenu } from "@/components/continuity-lab/continuity-lab-session-menu";
import { useContinuityLab } from "@/components/continuity-lab/continuity-lab-context";
import { formatLabRelativeTime } from "@/lib/continuity-lab/format-relative-time";
import {
  displaySessionTitle,
  isLabSessionArchived,
  isLabSessionPinned,
  isLabSessionTerminated,
  LAB_SESSION_STORAGE_EVENT,
} from "@/lib/continuity-lab/session-storage";
import type { LabSessionSummary } from "@/lib/continuity-lab/sessions";
import { labNavActive } from "@/components/continuity-lab/continuity-lab-section-ui";
import { cn } from "@/lib/utils";

type ContinuityLabRecentSessionsProps = {
  mobile?: boolean;
};

export function ContinuityLabRecentSessions({ mobile = false }: ContinuityLabRecentSessionsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { sessions, setSidebarOpen, refresh } = useContinuityLab();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [storageTick, setStorageTick] = useState(0);

  const bumpStorage = useCallback(() => {
    setStorageTick((n) => n + 1);
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onStorage = () => bumpStorage();
    window.addEventListener(LAB_SESSION_STORAGE_EVENT, onStorage);
    return () => window.removeEventListener(LAB_SESSION_STORAGE_EVENT, onStorage);
  }, [bumpStorage]);

  const visibleSessions = useMemo(() => {
    void storageTick;
    const filtered = sessions.filter(
      (s) => !isLabSessionArchived(s.id) && !isLabSessionTerminated(s.id),
    );
    const q = searchQuery.trim().toLowerCase();
    const searched = q
      ? filtered.filter(
          (s) =>
            displaySessionTitle(s.id, s.title).toLowerCase().includes(q) ||
            s.id.toLowerCase().includes(q) ||
            (s.repo?.toLowerCase().includes(q) ?? false),
        )
      : filtered;

    return [...searched].sort((a, b) => {
      const pinA = isLabSessionPinned(a.id) ? 1 : 0;
      const pinB = isLabSessionPinned(b.id) ? 1 : 0;
      if (pinA !== pinB) return pinB - pinA;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [sessions, searchQuery, storageTick]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-1 px-0.5 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
          Recent
        </p>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-md text-white/45 hover:bg-white/[0.06] hover:text-white",
              searchOpen && "bg-white/[0.06] text-white",
            )}
            aria-label="Search sessions"
          >
            <Search className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (mobile) setSidebarOpen(false);
              router.push("/continuity-lab");
            }}
            className="inline-flex size-7 items-center justify-center rounded-md text-white/45 hover:bg-white/[0.06] hover:text-white"
            aria-label="New session"
          >
            <Plus className="size-3.5" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex size-7 items-center justify-center rounded-md text-white/45 hover:bg-white/[0.06] hover:text-white"
                aria-label="Recent sessions menu"
              >
                <MoreHorizontal className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-[160px] border border-white/[0.06] bg-[#1a1a1a] text-white"
            >
              <DropdownMenuItem
                className="text-white/85 focus:bg-white/[0.06]"
                onSelect={() => setSearchOpen(true)}
              >
                Search sessions
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-white/85 focus:bg-white/[0.06]"
                onSelect={() => {
                  if (mobile) setSidebarOpen(false);
                  router.push("/continuity-lab");
                }}
              >
                New session
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {searchOpen ? (
        <div className="relative mb-2 shrink-0">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-white/35" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sessions"
            autoFocus
            className="h-8 w-full rounded-md border border-white/[0.06] bg-[#1a1a1a] pl-8 pr-2 text-[11px] text-white placeholder:text-white/35 focus:border-white/15 focus:outline-none"
          />
        </div>
      ) : null}

      <div className="continuity-lab-sidebar-recent-scroll min-h-0 flex-1 overflow-y-auto">
        {visibleSessions.length === 0 ? (
          <p className="px-0.5 text-[11px] leading-relaxed text-white/45">
            {sessions.length === 0
              ? "No sessions yet. Start from the home prompt."
              : "No sessions match your search."}
          </p>
        ) : (
          <ul className="space-y-0.5 pr-0.5">
            {visibleSessions.map((session) => {
              const title = displaySessionTitle(session.id, session.title);
              const active = pathname.includes(session.id);
              return (
                <li key={session.id} className="group relative">
                  <Link
                    href={`/continuity-lab/session/${encodeURIComponent(session.id)}`}
                    onClick={() => mobile && setSidebarOpen(false)}
                    className={cn(
                      "block rounded-md px-2 py-1.5 pr-8 transition",
                      active ? labNavActive : "text-white/60 hover:bg-white/[0.04] hover:text-white",
                    )}
                  >
                    <p className="truncate text-xs font-medium">{title}</p>
                    <p className="mt-0.5 truncate text-[10px] text-white/40">
                      {formatLabRelativeTime(session.updatedAt)}
                    </p>
                  </Link>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                    <ContinuityLabSessionMenu
                      session={session}
                      onUpdated={bumpStorage}
                      align="start"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
