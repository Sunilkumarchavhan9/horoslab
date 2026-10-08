"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  GitBranch,
  Gauge,
  Rocket,
  Box,
  CreditCard,
  BarChart3,
  Key,
  Cloud,
  Shield,
  Settings,
  Keyboard,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HorosCommandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (view: string) => void;
  onSelectCommand?: (cmd: string) => void;
  onOpenShortcuts?: () => void;
  dark?: boolean;
}

interface CommandItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  viewTarget?: string;
  isAction?: boolean;
}

export function HorosCommandDialog({
  open,
  onOpenChange,
  onNavigate,
  onSelectCommand,
  onOpenShortcuts,
  dark = true,
}: HorosCommandDialogProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = [
    {
      id: "new-pipeline",
      icon: <Plus size={15} />,
      title: "New pipeline",
      description: "Start a new optimization",
      viewTarget: "programs",
      isAction: true,
    },
    {
      id: "pipelines",
      icon: <GitBranch size={15} />,
      title: "Pipelines",
      description: "All of your pipelines",
      viewTarget: "programs",
    },
    {
      id: "model-apis",
      icon: <Gauge size={15} />,
      title: "Model APIs",
      description: "Call hosted models with workspace API keys",
      viewTarget: "models",
    },
    {
      id: "deployments",
      icon: <Rocket size={15} />,
      title: "Deployments",
      description: "Live inference endpoints",
      viewTarget: "deployments",
    },
    {
      id: "weights",
      icon: <Box size={15} />,
      title: "Weights",
      description: "Your uploaded model weights",
      viewTarget: "registry",
    },
    {
      id: "billing",
      icon: <CreditCard size={15} />,
      title: "Billing",
      description: "Plan, subscription, and invoices",
      viewTarget: "settings-billing",
    },
    {
      id: "cost",
      icon: <BarChart3 size={15} />,
      title: "Cost",
      description: "Usage, balance, and spend analytics",
      viewTarget: "settings-cost",
    },
    {
      id: "api-keys",
      icon: <Key size={15} />,
      title: "API Keys",
      description: "Create and manage keys",
      viewTarget: "settings-keys",
    },
    {
      id: "clouds",
      icon: <Cloud size={15} className="text-[#75bf00]" />,
      title: "Clouds",
      description: "GPU clouds you connect and own",
      viewTarget: "settings-clouds",
    },
    {
      id: "security",
      icon: <Shield size={15} />,
      title: "Security",
      description: "Access controls and audit logs",
      viewTarget: "settings-security",
    },
    {
      id: "settings",
      icon: <Settings size={15} />,
      title: "Settings",
      description: "Workspace and account settings",
      viewTarget: "settings",
    },
    {
      id: "shortcuts",
      icon: <Keyboard size={15} />,
      title: "Keyboard shortcuts",
      description: "View every available shortcut",
      isAction: true,
    },
  ];

  const filtered = commands.filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filtered.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filtered.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          handleExecute(filtered[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, selectedIndex, filtered, onOpenChange]);

  function handleExecute(item: CommandItem) {
    if (item.id === "shortcuts") {
      onOpenChange(false);
      onOpenShortcuts?.();
      return;
    }
    if (item.viewTarget) {
      onNavigate(item.viewTarget);
      onOpenChange(false);
    } else if (onSelectCommand) {
      onSelectCommand(item.id);
      onOpenChange(false);
    }
  }

  if (!open) return null;

  return (
    <div
      onClick={() => onOpenChange(false)}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[12vh] backdrop-blur-[2px] p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full max-w-[580px] border shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden rounded-xs cursor-default",
          dark
            ? "border-[#383838] bg-[#181818] text-[#f0f3ee]"
            : "border-[#a8b0a2] bg-white text-[#171a17]"
        )}
      >
        {/* Search header */}
        <div className={cn(
          "flex items-center gap-3 border-b px-4 py-3.5",
          dark ? "border-[#282828] bg-[#181818]" : "border-[#e5e8e3] bg-white"
        )}>
          <Search size={17} className={dark ? "text-[#C8C7BA]" : "text-[#788274]"} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pipelines and commands"
            className={cn(
              "w-full bg-transparent text-sm outline-none",
              dark ? "text-[#F0EFE2] placeholder:text-[#666]" : "text-[#171a17] placeholder:text-[#8b9386]"
            )}
          />
        </div>

        {/* Commands List */}
        <div className="max-h-[380px] overflow-y-auto p-1.5">
          <div className={cn(
            "px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
            dark ? "text-[#889284]" : "text-[#8e968b]"
          )}>
            Commands
          </div>

          <div className="space-y-0.5">
            {filtered.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleExecute(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2.5 text-left text-xs transition-colors rounded-none cursor-pointer",
                  selectedIndex === idx
                    ? dark
                      ? "bg-[#282828] text-[#F0EFE2]"
                      : "bg-[#edf1eb] text-[#151515]"
                    : dark
                    ? "text-[#C8C7BA] hover:bg-[#202020]"
                    : "text-[#3e443b] hover:bg-[#f6f8f4]"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "flex h-5 w-5 items-center justify-center",
                    dark ? "text-[#a0a89d]" : "text-[#171a17]"
                  )}>
                    {item.icon}
                  </span>
                  <span className={cn(
                    "font-medium text-xs",
                    dark ? "text-[#F0EFE2]" : "text-[#171a17]"
                  )}>
                    {item.title}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[11px]",
                    dark ? "text-[#788274]" : "text-[#788274]"
                  )}>
                    {item.description}
                  </span>
                  {item.id === "clouds" && (
                    <ArrowRight size={12} className="text-[#75bf00]" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer shortcuts bar */}
        <div className={cn(
          "flex items-center justify-start gap-4 border-t px-4 py-2.5 text-[11px] font-mono text-[#788274]",
          dark ? "border-[#282828] bg-[#141414]" : "border-[#e5e8e3] bg-[#fafbfa]"
        )}>
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "border px-1.5 py-0.5 text-[10px]",
              dark ? "border-[#383838] bg-[#202020] text-[#aaa]" : "border-[#d8ddd3] bg-white text-[#171a17]"
            )}>↑</span>
            <span className={cn(
              "border px-1.5 py-0.5 text-[10px]",
              dark ? "border-[#383838] bg-[#202020] text-[#aaa]" : "border-[#d8ddd3] bg-white text-[#171a17]"
            )}>↓</span>
            <span className="font-sans text-[11px]">navigate</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={cn(
              "border px-1.5 py-0.5 text-[10px]",
              dark ? "border-[#383838] bg-[#202020] text-[#aaa]" : "border-[#d8ddd3] bg-white text-[#171a17]"
            )}>↵</span>
            <span className="font-sans text-[11px]">open</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={cn(
              "border px-1.5 py-0.5 text-[10px]",
              dark ? "border-[#383838] bg-[#202020] text-[#aaa]" : "border-[#d8ddd3] bg-white text-[#171a17]"
            )}>esc</span>
            <span className="font-sans text-[11px]">close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
