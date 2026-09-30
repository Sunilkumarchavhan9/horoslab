"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ThemeSegmentedControl } from "@/components/dhyra/theme-segmented-control";
import { useThemePreference } from "@/lib/continuity-lab/use-theme-preference";
import { cn } from "@/lib/utils";

type MemoryosProfileMenuProps = {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  orgName: string;
  userEmail: string;
  userInitial: string;
  onSignOut: () => void;
  accountSettingsHref?: string;
  onAccountSettingsClick?: () => void;
  triggerClassName?: string;
  menuVariant?: "light" | "dark";
  fullWidthTrigger?: boolean;
  triggerLabel?: string;
};

export function MemoryosProfileMenuTrigger({
  userInitial,
  onClick,
  className,
  lightShell,
}: {
  userInitial: string;
  onClick: () => void;
  className?: string;
  lightShell?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "grid size-9 place-items-center rounded-full border text-sm font-medium shadow-sm transition",
        lightShell
          ? "border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#F9FAFB]"
          : "border-white/[0.08] bg-white/[0.06] text-[#C8C7BA] hover:bg-white/[0.1]",
        className,
      )}
      aria-label="Account menu"
      aria-expanded={false}
    >
      {userInitial}
    </button>
  );
}

export function MemoryosProfileMenu({
  open,
  onToggle,
  onClose,
  orgName,
  userEmail,
  userInitial,
  onSignOut,
  accountSettingsHref = "/continuity-lab/settings/preferences",
  onAccountSettingsClick,
  triggerClassName,
  menuVariant,
  fullWidthTrigger = false,
  triggerLabel,
}: MemoryosProfileMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { preference, resolved, setThemePreference } = useThemePreference();
  const darkMenu = menuVariant === "dark" || (menuVariant !== "light" && resolved === "dark");

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return (
    <div className="relative z-50" ref={rootRef}>
      {fullWidthTrigger ? (
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13px] font-medium transition",
            darkMenu
              ? "text-[#C8C7BA]/70 hover:bg-white/[0.04] hover:text-[#C8C7BA]"
              : "text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827]",
            triggerClassName,
          )}
          aria-label="Account menu"
        >
          <span
            className={cn(
              "grid size-7 shrink-0 place-items-center rounded-full text-xs font-medium",
              darkMenu ? "bg-white/[0.08] text-[#C8C7BA]" : "bg-[#E0E7FF] text-[#4338CA]",
            )}
          >
            {userInitial}
          </span>
          <span className="min-w-0 flex-1 truncate">{triggerLabel ?? orgName}</span>
        </button>
      ) : (
        <MemoryosProfileMenuTrigger
          userInitial={userInitial}
          onClick={onToggle}
          className={triggerClassName}
          lightShell={!darkMenu}
        />
      )}
      {open ? (
        <div
          className={cn(
            "absolute top-full z-50 mt-2 w-72 isolate overflow-hidden rounded-md border shadow-xl",
            fullWidthTrigger ? "left-0" : "right-0",
            darkMenu
              ? "border-white/[0.08] bg-[#141414] text-[#C8C7BA]"
              : "border-[#E5E7EB] bg-white text-[#111827]",
          )}
        >
          <div
            className={cn(
              "border-b px-4 py-4",
              darkMenu ? "border-white/[0.06]" : "border-[#F3F4F6]",
            )}
          >
            <p className="truncate text-lg font-medium">{orgName}</p>
            <p
              className={cn(
                "mt-1 truncate text-sm",
                darkMenu ? "text-[#C8C7BA]/55" : "text-[#6B7280]",
              )}
            >
              {userEmail}
            </p>
          </div>
          <div
            className={cn(
              "border-b px-4 py-3",
              darkMenu ? "border-white/[0.06]" : "border-[#F3F4F6]",
            )}
          >
            <p
              className={cn(
                "mb-2 text-[10px] font-medium uppercase tracking-[0.14em]",
                darkMenu ? "text-[#C8C7BA]/40" : "text-[#9CA3AF]",
              )}
            >
              Theme
            </p>
            <ThemeSegmentedControl
              value={preference}
              onChange={setThemePreference}
              variant={darkMenu ? "dark" : "light"}
            />
          </div>
          {onAccountSettingsClick ? (
            <button
              type="button"
              onClick={() => {
                onAccountSettingsClick();
                onClose();
              }}
              className={cn(
                "flex w-full items-center gap-3 border-b px-4 py-4 text-left text-sm font-medium transition",
                darkMenu
                  ? "border-white/[0.06] hover:bg-white/[0.04]"
                  : "border-[#F3F4F6] hover:bg-[#F9FAFB]",
              )}
            >
              Account settings
            </button>
          ) : (
            <Link
              href={accountSettingsHref}
              onClick={onClose}
              className={cn(
                "flex w-full items-center gap-3 border-b px-4 py-4 text-left text-sm font-medium transition",
                darkMenu
                  ? "border-white/[0.06] hover:bg-white/[0.04]"
                  : "border-[#F3F4F6] hover:bg-[#F9FAFB]",
              )}
            >
              Account settings
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              onClose();
              onSignOut();
            }}
            className={cn(
              "flex w-full items-center gap-3 px-4 py-4 text-left text-sm font-medium transition",
              darkMenu
                ? "text-red-400 hover:bg-white/[0.04]"
                : "text-[#DC2626] hover:bg-[#F9FAFB]",
            )}
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
