"use client";

import React from "react";
import {
  Search,
  Sun,
  Moon,
  Settings,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { HorosLogo } from "@/components/horos/primitives/horos-logo";

interface HorosHeaderProps {
  onOpenCommand: () => void;
  dark?: boolean;
  onToggleTheme?: () => void;
  onOpenSettings?: () => void;
  onOpenBilling?: () => void;
  balanceUsd?: number;
  className?: string;
}

export function HorosHeader({
  onOpenCommand,
  dark = true,
  onToggleTheme,
  onOpenSettings,
  onOpenBilling,
  balanceUsd = 9.51,
  className,
}: HorosHeaderProps) {
  return (
    <header
      className={cn(
        "relative z-40 bg-transparent transition-colors select-none",
        dark ? "text-[#f0f3ee]" : "text-[#151515]",
        className
      )}
    >
      <div className="mx-auto flex h-12 max-w-[1440px] items-center justify-between px-4 sm:px-6">
        {/* Left: HOROS Logo + Global Search */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* HOROS Logo Mark */}
          <div className="flex items-center gap-2.5 text-[#151515] dark:text-[#F0EFE2] select-none">
            <HorosLogo
              size="md"
              className={dark ? "text-[#F0EFE2]" : "text-[#151515]"}
            />
            <span className="hidden text-[10px] font-mono text-[#858f80] border border-dashed border-[#d8ddd3] dark:border-[#333] px-1 py-0.2 sm:inline rounded-xs">
              v14.2
            </span>
          </div>

          {/* Quick Search Ctrl+K button */}
          <button
            type="button"
            onClick={onOpenCommand}
            className={cn(
              "flex items-center gap-2 border border-dashed px-2.5 py-1 text-xs transition-colors rounded-xs font-mono",
              dark
                ? "border-[#2e2e2e] bg-[#181818] text-[#889084] hover:border-[#444] hover:text-[#F0EFE2]"
                : "border-[#d8ddd3] bg-[#fafbfa] text-[#667064] hover:border-[#aaa] hover:text-black"
            )}
          >
            <Search size={12} className="text-[#C8C7BA]" />
            <span className="text-xs">Search</span>
            <kbd className={cn(
              "border border-dashed px-1 py-0.2 font-mono text-[9px] rounded-xs",
              dark ? "border-[#383838] bg-[#111] text-[#C8C7BA]" : "border-[#ccc] bg-white text-[#555]"
            )}>
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right: Balance + Theme Toggle + Settings + User Avatar */}
        <div className="flex items-center gap-3 sm:gap-4 text-xs font-mono">
          {/* Balance Pill matching HOROS */}
          <button
            type="button"
            onClick={onOpenBilling || onOpenSettings}
            className={cn(
              "flex items-center gap-1.5 border border-dashed px-2.5 py-1 text-xs rounded-xs cursor-pointer transition-colors",
              dark
                ? "border-[#2e2e2e] bg-[#181818] hover:border-[#75bf00]"
                : "border-[#d8ddd3] bg-white hover:border-[#75bf00]"
            )}
            title="View Billing & Credits"
          >
            <Wallet size={12} className="text-[#C8C7BA]" />
            <span className="text-[#C8C7BA]">Balance</span>
            <span className="border border-dashed border-[#75bf00]/40 bg-[#75bf00]/10 text-[#75bf00] px-1 text-[10px] font-sans font-bold rounded-xs">
              Free
            </span>
            <span className={cn("font-bold", dark ? "text-[#F0EFE2]" : "text-[#111]")}>
              ${balanceUsd.toFixed(2)}
            </span>
          </button>

          {/* Theme Toggle Sun/Moon */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-1 text-[#C8C7BA] hover:text-[#F0EFE2] transition-colors"
              title="Toggle theme"
            >
              {dark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          )}

          {/* Settings Icon */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1 text-[#C8C7BA] hover:text-[#F0EFE2] transition-colors"
            title="Settings"
          >
            <Settings size={14} />
          </button>

          {/* User Avatar square EP with green online indicator */}
          <div className="relative flex h-6 w-6 items-center justify-center border border-dashed border-[#383838] bg-[#222] font-mono text-[11px] font-bold text-[#F0EFE2] rounded-xs">
            <span>EP</span>
            <span className="absolute bottom-[-1.5px] right-[-1.5px] h-1.5 w-1.5 rounded-full bg-[#75bf00] ring-1 ring-[#151515]" />
          </div>
        </div>
      </div>
    </header>
  );
}
