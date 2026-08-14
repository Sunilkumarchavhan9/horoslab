"use client";

import React, { useState } from "react";
import {
  Search,
  Sun,
  Moon,
  Settings,
  ChevronDown,
  Bell,
  Wallet,
  Server,
  Shield,
  Sparkles,
  Layout,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EpochLogo } from "@/components/epoch/primitives/epoch-logo";

interface EpochHeaderProps {
  onOpenCommand: () => void;
  dark?: boolean;
  onToggleTheme?: () => void;
  activeWorkspace?: string;
  onSelectWorkspace?: (ws: string) => void;
  balanceUsd?: number;
  displayLayout?: "top_bar" | "sidebar";
  onToggleLayout?: (layout: "top_bar" | "sidebar") => void;
  className?: string;
}

export function EpochHeader({
  onOpenCommand,
  dark = false,
  onToggleTheme,
  activeWorkspace = "Production US-East",
  onSelectWorkspace,
  balanceUsd = 10.0,
  displayLayout = "top_bar",
  onToggleLayout,
  className,
}: EpochHeaderProps) {
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);

  return (
    <header
      className={cn(
        "relative z-40 border-b border-dashed border-[#c9cec4] bg-[#ffffff] transition-all",
        dark && "border-[#282828] bg-[#151515] text-[#f0f3ee]",
        className
      )}
    >
      <div className="mx-auto flex h-13 max-w-[1440px] items-center justify-between px-4 sm:px-6">
        {/* Left: Brand Mark + Layout Switcher + Global Search */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Epoch Logo Mark */}
          <div className="flex items-center gap-2.5 text-[#151515] dark:text-white select-none">
            <EpochLogo
              size="md"
              className={dark ? "text-white" : "text-[#151515]"}
            />
            <span className="hidden text-[10px] font-mono text-[#858f80] border border-[#d8ddd3] dark:border-[#333] px-1 py-0.2 sm:inline rounded-xs">
              v14.2
            </span>
          </div>

          {/* Quick Layout Switcher Button */}
          {onToggleLayout && (
            <button
              type="button"
              onClick={() => onToggleLayout(displayLayout === "top_bar" ? "sidebar" : "top_bar")}
              className="hidden sm:flex items-center gap-1.5 border border-[#d8ddd3] dark:border-[#333] bg-[#fafbfa] dark:bg-[#181d18] px-2 py-1 text-xs text-[#525a4d] dark:text-[#a0a89e] hover:border-[#75bf00] hover:text-[#171a17] transition-colors"
              title={displayLayout === "top_bar" ? "Switch to Sidebar layout" : "Switch to Top bar layout"}
            >
              {displayLayout === "top_bar" ? (
                <>
                  <PanelLeft size={12} className="text-[#75bf00]" />
                  <span className="text-[11px] font-mono">Sidebar</span>
                </>
              ) : (
                <>
                  <Layout size={12} className="text-[#75bf00]" />
                  <span className="text-[11px] font-mono">Top bar</span>
                </>
              )}
            </button>
          )}

          {/* Quick Search Ctrl+K button */}
          <button
            type="button"
            onClick={onOpenCommand}
            className="flex items-center gap-2 border border-[#d8ddd3] dark:border-[#333] bg-[#fafbfa] dark:bg-[#181d18] px-2.5 py-1 text-xs text-[#667064] dark:text-[#9ea89c] hover:border-[#a8b0a2] hover:text-[#171a17] dark:hover:text-white transition-colors"
          >
            <Search size={13} />
            <span className="hidden md:inline">Search programs, models, evidence...</span>
            <span className="md:hidden">Search</span>
            <kbd className="border border-[#c9cec4] dark:border-[#444] bg-white dark:bg-[#111] px-1.5 py-0.2 font-mono text-[9px] text-[#4b5247] dark:text-[#aaa]">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right: Workspace + Balance + Theme + Avatar */}
        <div className="flex items-center gap-3 sm:gap-4 text-xs text-[#525a4d] dark:text-[#a0a89e]">
          {/* Workspace Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
              className="flex items-center gap-1.5 border border-[#d8ddd3] dark:border-[#333] bg-white dark:bg-[#181d18] px-2.5 py-1 text-xs text-[#2a3028] dark:text-[#e0e4dd] hover:border-[#a8b0a2]"
            >
              <Server size={12} className="text-[#75bf00]" />
              <span className="hidden sm:inline font-medium">{activeWorkspace}</span>
              <ChevronDown size={11} className="text-[#889083]" />
            </button>

            {workspaceMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-52 border border-[#c9cec4] bg-white dark:bg-[#1a1f1a] py-1 shadow-lg text-xs">
                {["Production US-East", "Staging Cluster EU", "Local Dev Environment"].map((ws) => (
                  <button
                    key={ws}
                    type="button"
                    onClick={() => {
                      onSelectWorkspace?.(ws);
                      setWorkspaceMenuOpen(false);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-[#f3f6f0] dark:hover:bg-[#252c25]"
                  >
                    <span>{ws}</span>
                    {activeWorkspace === ws ? <span className="h-1.5 w-1.5 rounded-full bg-[#75bf00]" /> : null}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Balance Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 border border-[#d8ddd3] dark:border-[#333] bg-white dark:bg-[#181d18] px-2.5 py-1 text-xs font-mono">
            <Wallet size={12} className="text-[#65a30d]" />
            <span className="text-[#788274]">Balance</span>
            <span className="border border-[#b9de78] bg-[#f2fbe6] px-1 text-[10px] text-[#3c7000] font-sans font-bold">
              Free
            </span>
            <span className="font-semibold text-[#151515] dark:text-white">
              ${balanceUsd.toFixed(2)}
            </span>
          </div>

          {/* Theme Toggle */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-1.5 text-[#667064] hover:text-[#171a17] dark:text-[#a0a89e] dark:hover:text-white"
              title="Toggle theme"
            >
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          )}

          {/* User Avatar */}
          <div className="flex items-center gap-2 pl-1 border-l border-[#d8ddd3] dark:border-[#333]">
            <div className="relative flex h-7 w-7 items-center justify-center border border-[#c9cec4] bg-[#f2f4f0] font-mono text-xs font-bold text-[#171a17]">
              <span>EP</span>
              <span className="absolute bottom-[-2px] right-[-2px] h-2 w-2 rounded-full bg-[#75bf00] ring-2 ring-white dark:ring-[#111]" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
