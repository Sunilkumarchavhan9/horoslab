"use client";

import React from "react";
import {
  Home,
  History,
  Cpu,
  BarChart3,
  Gauge,
  Box,
  Database,
  ShieldCheck,
  Globe,
  Shield,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type EpochNavRoute =
  | "home"
  | "programs"
  | "reality"
  | "capabilities"
  | "models"
  | "systems"
  | "experiments"
  | "runs"
  | "deployments"
  | "analytics"
  | "weights"
  | "registry"
  | "evidence"
  | "governance"
  | "settings";

interface EpochSubnavProps {
  activeRoute: EpochNavRoute;
  onNavigate: (route: EpochNavRoute) => void;
  dark?: boolean;
  className?: string;
}

const PRIMARY_NAV_ITEMS: Array<{
  id: EpochNavRoute;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
}> = [
  { id: "home", label: "Home", icon: Home },
  { id: "programs", label: "History", icon: History },
  { id: "models", label: "Model APIs", icon: Cpu, badge: "NEW" },
  { id: "analytics", label: "Usage Analytics", icon: BarChart3 },
  { id: "deployments", label: "Deployments", icon: Gauge },
  { id: "weights", label: "Weights", icon: Box },
  { id: "registry", label: "Registry", icon: Database },
  { id: "evidence", label: "Evidence", icon: ShieldCheck },
  { id: "reality", label: "Reality", icon: Globe },
  { id: "governance", label: "Governance", icon: Shield },
  { id: "settings", label: "Settings", icon: Settings },
];

export function EpochSubnav({
  activeRoute,
  onNavigate,
  dark = true,
  className,
}: EpochSubnavProps) {
  return (
    <nav
      className={cn(
        "border-b border-dashed transition-colors overflow-x-auto select-none",
        dark ? "border-[#282828] bg-transparent" : "border-[#e5e7eb] bg-transparent",
        className
      )}
    >
      <div className="mx-auto flex max-w-[1440px] items-center gap-1 px-4 sm:px-6">
        {PRIMARY_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeRoute === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={cn(
                "relative flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-xs font-mono transition-colors focus:outline-none",
                isActive
                  ? "text-[#75bf00] font-bold"
                  : dark
                  ? "text-[#889084] hover:text-white"
                  : "text-[#687063] hover:text-black"
              )}
            >
              <Icon size={13} className={isActive ? "text-[#75bf00]" : "text-[#888]"} />
              <span>{item.label}</span>

              {item.badge && (
                <span className="bg-[#75bf00] text-black text-[9px] font-mono font-extrabold px-1 py-0.2 rounded-xs leading-none">
                  {item.badge}
                </span>
              )}

              {/* Shared active thin bottom green line matching RunInfra */}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#75bf00]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
