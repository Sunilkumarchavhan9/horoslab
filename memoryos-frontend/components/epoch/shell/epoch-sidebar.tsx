"use client";

import React from "react";
import {
  Home,
  GitBranch,
  Gauge,
  Rocket,
  Box,
  Cpu,
  Settings,
  Sparkles,
  Zap,
  ChevronRight,
  Plus,
  Moon,
  Sun,
  Search,
  Layout,
  ArrowLeft,
  Building2,
  Bell,
  CreditCard,
  BarChart3,
  Key,
  Cloud,
  Shield,
  Globe,
  ShieldAlert,
  Database,
  Brain,
} from "lucide-react";
import { EpochNavRoute } from "./epoch-subnav";
import { cn } from "@/lib/utils";
import { EpochLogo } from "@/components/epoch/primitives/epoch-logo";

export type SettingsTabType = "workspace" | "notifications" | "billing" | "cost" | "keys" | "clouds" | "security";

interface EpochSidebarProps {
  activeRoute: EpochNavRoute;
  onNavigate: (route: EpochNavRoute) => void;
  onOpenCommand: () => void;
  dark?: boolean;
  onToggleTheme?: () => void;
  userBalance?: number;
  displayLayout?: "top_bar" | "sidebar";
  onToggleLayout?: (layout: "top_bar" | "sidebar") => void;
  recentPipelines?: Array<{ id: string; name: string; time: string; status?: string }>;
  onSelectPipeline?: (id: string) => void;
  settingsTab?: SettingsTabType;
  onSelectSettingsTab?: (tab: SettingsTabType) => void;
  onBackFromSettings?: () => void;
  className?: string;
}

export function EpochSidebar({
  activeRoute,
  onNavigate,
  onOpenCommand,
  dark = false,
  onToggleTheme,
  userBalance = 10.0,
  displayLayout = "sidebar",
  onToggleLayout,
  recentPipelines = [
    { id: "pipe-1", name: "Untitled Pipeline", time: "6m ago", status: "draft" },
  ],
  onSelectPipeline,
  settingsTab = "workspace",
  onSelectSettingsTab,
  onBackFromSettings,
  className,
}: EpochSidebarProps) {
  const isSettings = activeRoute === "settings";

  return (
    <aside
      className={cn(
        "flex flex-col justify-between w-60 border-r border-dashed h-screen select-none shrink-0 sticky top-0 text-xs transition-colors",
        dark
          ? "border-[#282828] bg-[#151515] text-[#f0f3ee]"
          : "border-[#c9cec4] bg-white text-[#151515]",
        className
      )}
    >
      {/* Top Section */}
      <div className="p-3 space-y-3.5 overflow-y-auto">
        {/* Brand, Theme, & Layout Switcher */}
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => onNavigate("home")}
            className="flex items-center group text-left hover:opacity-90 transition-opacity"
            title="Epoch Home"
          >
            <EpochLogo
              size="md"
              className={dark ? "text-[#F0EFE2]" : "text-[#151515]"}
            />
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onToggleLayout?.("top_bar")}
              className="p-1 text-[#788274] hover:text-[#75bf00] transition-colors"
              title="Switch to Top bar layout"
            >
              <Layout size={14} />
            </button>

            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className="p-1 text-[#788274] hover:text-[#75bf00] transition-colors"
                title="Toggle theme"
              >
                {dark ? <Sun size={14} /> : <Moon size={14} />}
              </button>
            )}
          </div>
        </div>

        {/* Search Command Trigger */}
        <button
          type="button"
          onClick={onOpenCommand}
          className={cn(
            "flex w-full items-center justify-between border px-2.5 py-1.5 text-xs transition-colors",
            dark
              ? "border-[#2e2e2e] bg-[#202020] text-[#9ea89c] hover:border-[#75bf00]"
              : "border-[#d8ddd3] bg-[#fafbfa] text-[#788274] hover:border-[#171a17]"
          )}
        >
          <div className="flex items-center gap-2">
            <Search size={13} />
            <span>Search</span>
          </div>
          <kbd className={cn(
            "font-mono text-[10px] border px-1 py-0.2",
            dark ? "bg-[#151515] border-[#333] text-[#aaa]" : "bg-white border-[#d8ddd3]"
          )}>
            Ctrl K
          </kbd>
        </button>

        {/* IF IN SETTINGS MODE MATCHING SCREENSHOT */}
        {isSettings ? (
          <div className="space-y-3 pt-1">
            {/* Back Button */}
            <button
              type="button"
              onClick={onBackFromSettings || (() => onNavigate("home"))}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 text-left font-medium transition-colors w-full",
                dark ? "text-[#a0a89d] hover:text-[#F0EFE2]" : "text-[#4b5247] hover:text-[#171a17]"
              )}
            >
              <ArrowLeft size={13} />
              <span>Back</span>
            </button>

            <div className="space-y-1">
              <span className="px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8e968b] block">
                Settings
              </span>

              <button
                type="button"
                onClick={() => onSelectSettingsTab?.("workspace")}
                className={cn(
                  "flex w-full items-center gap-2.5 px-2.5 py-1.5 transition-colors text-left font-medium",
                  settingsTab === "workspace"
                    ? "bg-[#75bf00] text-[#111] font-semibold"
                    : dark
                    ? "text-[#a0a89d] hover:bg-[#1a201a] hover:text-[#F0EFE2]"
                    : "text-[#4b5247] hover:bg-[#f3f6f0]"
                )}
              >
                <Building2 size={14} />
                <span>Workspace</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectSettingsTab?.("notifications")}
                className={cn(
                  "flex w-full items-center gap-2.5 px-2.5 py-1.5 transition-colors text-left font-medium",
                  settingsTab === "notifications"
                    ? "bg-[#75bf00] text-[#111] font-semibold"
                    : dark
                    ? "text-[#a0a89d] hover:bg-[#1a201a] hover:text-[#F0EFE2]"
                    : "text-[#4b5247] hover:bg-[#f3f6f0]"
                )}
              >
                <Bell size={14} />
                <span>Notifications</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectSettingsTab?.("billing")}
                className={cn(
                  "flex w-full items-center gap-2.5 px-2.5 py-1.5 transition-colors text-left font-medium",
                  settingsTab === "billing"
                    ? "bg-[#75bf00] text-[#111] font-semibold"
                    : dark
                    ? "text-[#a0a89d] hover:bg-[#1a201a] hover:text-[#F0EFE2]"
                    : "text-[#4b5247] hover:bg-[#f3f6f0]"
                )}
              >
                <CreditCard size={14} />
                <span>Billing</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectSettingsTab?.("cost")}
                className={cn(
                  "flex w-full items-center gap-2.5 px-2.5 py-1.5 transition-colors text-left font-medium",
                  settingsTab === "cost"
                    ? "bg-[#75bf00] text-[#111] font-semibold"
                    : dark
                    ? "text-[#a0a89d] hover:bg-[#1a201a] hover:text-[#F0EFE2]"
                    : "text-[#4b5247] hover:bg-[#f3f6f0]"
                )}
              >
                <BarChart3 size={14} />
                <span>Cost</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectSettingsTab?.("keys")}
                className={cn(
                  "flex w-full items-center gap-2.5 px-2.5 py-1.5 transition-colors text-left font-medium",
                  settingsTab === "keys"
                    ? "bg-[#75bf00] text-[#111] font-semibold"
                    : dark
                    ? "text-[#a0a89d] hover:bg-[#1a201a] hover:text-[#F0EFE2]"
                    : "text-[#4b5247] hover:bg-[#f3f6f0]"
                )}
              >
                <Key size={14} />
                <span>API Keys</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectSettingsTab?.("clouds")}
                className={cn(
                  "flex w-full items-center gap-2.5 px-2.5 py-1.5 transition-colors text-left font-medium",
                  settingsTab === "clouds"
                    ? "bg-[#75bf00] text-[#111] font-semibold"
                    : dark
                    ? "text-[#a0a89d] hover:bg-[#1a201a] hover:text-[#F0EFE2]"
                    : "text-[#4b5247] hover:bg-[#f3f6f0]"
                )}
              >
                <Cloud size={14} />
                <span>Clouds</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectSettingsTab?.("security")}
                className={cn(
                  "flex w-full items-center gap-2.5 px-2.5 py-1.5 transition-colors text-left font-medium",
                  settingsTab === "security"
                    ? "bg-[#75bf00] text-[#111] font-semibold"
                    : dark
                    ? "text-[#a0a89d] hover:bg-[#1a201a] hover:text-[#F0EFE2]"
                    : "text-[#4b5247] hover:bg-[#f3f6f0]"
                )}
              >
                <Shield size={14} />
                <span>Security</span>
              </button>
            </div>
          </div>
        ) : (
          /* STANDARD BUILD, DISCOVER, OPERATE & GOVERN GROUPS */
          <>
            {/* Compact 3-Section Primary Navigation List */}
            <div className="space-y-1">
              {/* 1. Home */}
              <button
                type="button"
                onClick={() => onNavigate("home")}
                className={cn(
                  "flex w-full items-center gap-2.5 px-2.5 py-2 transition-colors text-left font-medium rounded-xs text-xs",
                  activeRoute === "home"
                    ? dark
                      ? "text-[#F0EFE2] font-bold bg-[#1e2719]"
                      : "text-[#171a17] font-bold bg-[#f0f4ee]"
                    : dark
                    ? "text-[#a0a89d] hover:bg-[#1a201a] hover:text-[#F0EFE2]"
                    : "text-[#4b5247] hover:bg-[#f3f6f0]"
                )}
              >
                <Home size={15} className={activeRoute === "home" ? "text-[#75bf00]" : "text-[#889083]"} />
                {activeRoute === "home" ? (
                  <span className="bg-[#75bf00] text-[#111] font-bold px-2 py-0.5 rounded-xs text-xs">
                    Home
                  </span>
                ) : (
                  <span>Home</span>
                )}
              </button>

              {/* 2. Model APIs */}
              <button
                type="button"
                onClick={() => onNavigate("models")}
                className={cn(
                  "flex w-full items-center justify-between px-2.5 py-2 transition-colors text-left font-medium rounded-xs text-xs",
                  activeRoute === "models"
                    ? dark
                      ? "text-[#F0EFE2] font-bold bg-[#1e2719]"
                      : "text-[#171a17] font-bold bg-[#f0f4ee]"
                    : dark
                    ? "text-[#a0a89d] hover:bg-[#1a201a] hover:text-[#F0EFE2]"
                    : "text-[#4b5247] hover:bg-[#f3f6f0]"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Gauge size={15} className={activeRoute === "models" ? "text-[#75bf00]" : "text-[#889083]"} />
                  {activeRoute === "models" ? (
                    <span className="bg-[#75bf00] text-[#111] font-bold px-2 py-0.5 rounded-xs text-xs">
                      Model APIs
                    </span>
                  ) : (
                    <span>Model APIs</span>
                  )}
                </div>
                <span className="bg-[#75bf00] text-[#111] text-[9px] font-bold px-1.5 py-0.2 rounded-xs uppercase tracking-wider">
                  NEW
                </span>
              </button>

              {/* 3. Usage Analytics */}
              <button
                type="button"
                onClick={() => onNavigate("analytics")}
                className={cn(
                  "flex w-full items-center gap-2.5 px-2.5 py-2 transition-colors text-left font-medium rounded-xs text-xs",
                  activeRoute === "analytics"
                    ? dark
                      ? "text-[#F0EFE2] font-bold bg-[#1e2719]"
                      : "text-[#171a17] font-bold bg-[#f0f4ee]"
                    : dark
                    ? "text-[#a0a89d] hover:bg-[#1a201a] hover:text-[#F0EFE2]"
                    : "text-[#4b5247] hover:bg-[#f3f6f0]"
                )}
              >
                <BarChart3 size={15} className={activeRoute === "analytics" ? "text-[#75bf00]" : "text-[#889083]"} />
                {activeRoute === "analytics" ? (
                  <span className="bg-[#75bf00] text-[#111] font-bold px-2 py-0.5 rounded-xs text-xs">
                    Usage Analytics
                  </span>
                ) : (
                  <span>Usage Analytics</span>
                )}
              </button>
            </div>

            {/* Group: Recent */}
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8e968b]">
                  Recent
                </span>
              </div>

              {recentPipelines.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectPipeline ? onSelectPipeline(p.id) : onNavigate("programs")}
                  className={cn(
                    "flex w-full items-center justify-between px-2.5 py-1.5 text-left transition-colors group rounded-xs",
                    dark ? "text-[#a0a89d] hover:bg-[#202020] hover:text-[#F0EFE2]" : "text-[#555e50] hover:bg-[#f3f6f0]"
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    <GitBranch size={12} className="text-[#889083] shrink-0" />
                    <span className="truncate">{p.name}</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#8e968b] shrink-0">{p.time}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Bottom Section */}
      <div className={cn(
        "p-3 border-t border-dashed space-y-3",
        dark ? "border-[#282828] bg-[#151515]" : "border-[#c9cec4] bg-[#fafbfa]"
      )}>
        {/* Free Plan Meter */}
        <div className={cn(
          "border border-dashed p-2.5 space-y-2 text-[11px] rounded-xs",
          dark ? "border-[#303030] bg-[#202020]" : "border-[#c9cec4] bg-white"
        )}>
          <div className="flex items-center justify-between">
            <span className={cn("font-semibold", dark ? "text-[#F0EFE2]" : "text-[#171a17]")}>Free Plan</span>
            <span className="text-[10px] text-[#75bf00] font-mono cursor-pointer hover:underline">
              Upgrade
            </span>
          </div>

          <div className="space-y-1 font-mono text-[10px] text-[#889084]">
            <div className="flex justify-between">
              <span>Pipelines</span>
              <span className={dark ? "text-[#F0EFE2]" : "text-[#171a17]"}>0/3</span>
            </div>
            <div className="flex justify-between">
              <span>Optimizations</span>
              <span className={dark ? "text-[#F0EFE2]" : "text-[#171a17]"}>0/3</span>
            </div>
            <div className="flex justify-between text-[9px] text-[#C8C7BA] pt-0.5">
              <span>Resets in 22d</span>
              <span>Deployment: Core</span>
            </div>
          </div>

          {/* Upgrade Banner */}
          <button
            type="button"
            onClick={() => onNavigate("settings")}
            className={cn(
              "flex w-full items-center justify-center gap-1.5 border py-1 text-[11px] font-semibold transition-colors rounded-xs",
              dark
                ? "border-[#75bf00] bg-[#1a2216] text-[#a3e635] hover:bg-[#202c1a]"
                : "border-[#b9de78] bg-[#f2fbe6] text-[#2d5800] hover:bg-[#eaf8db]"
            )}
          >
            <Zap size={12} />
            <span>Upgrade to deploy</span>
          </button>
        </div>

        {/* Settings & User Account */}
        <div className="space-y-1">
          {!isSettings && (
            <button
              type="button"
              onClick={() => onNavigate("settings")}
              className={cn(
                "flex w-full items-center gap-2.5 px-2 py-1.5 text-left transition-colors font-medium rounded-xs",
                dark ? "text-[#a0a89d] hover:bg-[#202020] hover:text-[#F0EFE2]" : "text-[#4b5247] hover:bg-[#f0f3ed]"
              )}
            >
              <Settings size={14} />
              <span>Settings</span>
            </button>
          )}

          <div className="flex items-center gap-2.5 px-2 py-1">
            <div className="flex h-6 w-6 items-center justify-center bg-[#202020] border border-[#2e2e2e] dark:bg-white text-[#F0EFE2] dark:text-[#111] font-bold text-[10px] rounded-xs">
              S
            </div>
            <div className="truncate">
              <div className={cn("font-medium truncate text-xs", dark ? "text-[#F0EFE2]" : "text-[#171a17]")}>Sunilkumar</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
