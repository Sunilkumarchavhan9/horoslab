"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Menu, RefreshCw, X } from "lucide-react";
import { ContinuityLabProvider, useContinuityLab } from "@/components/continuity-lab/continuity-lab-context";
import { ContinuityLabCompanyModelModal } from "@/components/continuity-lab/continuity-lab-company-model-modal";
import { ContinuityLabSidebar } from "@/components/continuity-lab/continuity-lab-sidebar";
import { bannerStrip, labMainBg } from "@/components/continuity-lab/continuity-lab-section-ui";
import { cn } from "@/lib/utils";

const SCROLLBAR_HIDE_MS = 600;

function ContinuityLabReconnectBanner({
  onRetry,
  retrying,
}: {
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <div
      className={bannerStrip(
        "shrink-0 rounded-none border-b border-amber-500/20 bg-amber-950/50 text-amber-100/85",
      )}
    >
      <p className="min-w-0 flex-1 leading-snug">
        Connector API is temporarily unavailable. GitHub status and data sources may be out of date.
      </p>
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-amber-50/90 hover:text-amber-50 disabled:opacity-60"
      >
        <RefreshCw className={cn("size-3", retrying && "animate-spin")} aria-hidden />
        {retrying ? "Reconnecting…" : "Retry"}
      </button>
    </div>
  );
}

function ShellInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { sidebarOpen, setSidebarOpen, connectorBackendOffline, refresh } = useContinuityLab();
  const [retryingConnector, setRetryingConnector] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const mainScrollRef = useRef<HTMLElement>(null);
  const inSettings = pathname.startsWith("/continuity-lab/settings");
  const inSelectOrg = pathname === "/continuity-lab" && searchParams.get("select_org") === "true";

  useEffect(() => {
    const el = mainScrollRef.current;
    if (!el) return;

    let hideTimer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      el.classList.add("is-scrolling");
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => el.classList.remove("is-scrolling"), SCROLLBAR_HIDE_MS);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      clearTimeout(hideTimer);
      el.classList.remove("is-scrolling");
    };
  }, []);

  const forceExpandedSidebar = pathname.startsWith("/continuity-lab/session/");
  const effectiveCollapsed = forceExpandedSidebar ? false : collapsed;

  return (
    <div
      className={cn("continuity-lab-root flex h-dvh w-full overflow-hidden text-white", labMainBg)}
      suppressHydrationWarning
    >
      {!inSettings ? (
        <div className="hidden md:flex">
          <ContinuityLabSidebar
            collapsed={effectiveCollapsed}
            onToggleCollapse={() => setCollapsed((v) => !v)}
          />
        </div>
      ) : null}

      {sidebarOpen && !inSettings ? (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
          />
          <ContinuityLabSidebar mobile />
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {connectorBackendOffline ? (
          <ContinuityLabReconnectBanner
            retrying={retryingConnector}
            onRetry={() => {
              setRetryingConnector(true);
              void refresh().finally(() => setRetryingConnector(false));
            }}
          />
        ) : null}
        {!inSettings && !inSelectOrg ? (
        <div className="flex h-12 shrink-0 items-center gap-2 px-3 md:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex size-9 items-center justify-center rounded-md text-white/80 hover:bg-white/[0.06]"
            aria-label="Open menu"
          >
            <Menu className="size-4" />
          </button>
          <span className="text-xs font-semibold uppercase tracking-[0.1em]">Continuity Lab</span>
          {sidebarOpen ? (
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="ml-auto inline-flex size-9 items-center justify-center text-white/70"
              aria-label="Close menu"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
        ) : null}
        <main
          ref={mainScrollRef}
          data-continuity-lab-scroll-root
          className={cn(
            "min-h-0 flex-1 overflow-y-auto",
            "[&:has(.continuity-lab-session-root)]:overflow-hidden",
          )}
        >
          {children}
        </main>
      </div>
      <ContinuityLabCompanyModelModal />
    </div>
  );
}

export function ContinuityLabShell({ children }: { children: ReactNode }) {
  return (
    <ContinuityLabProvider>
      <ShellInner>{children}</ShellInner>
    </ContinuityLabProvider>
  );
}
