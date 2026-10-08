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
  ShieldAlert,
  Settings,
  FlaskConical,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type HorosNavRoute =
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
  | "learning"
  | "settings";

interface HorosSubnavProps {
  activeRoute: HorosNavRoute;
  onNavigate: (route: HorosNavRoute) => void;
  dark?: boolean;
  className?: string;
}

const PRIMARY_NAV_ITEMS: Array<{
  id: HorosNavRoute;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
}> = [
    { id: "home", label: "Home", icon: Home },
    { id: "models", label: "Model APIs", icon: Cpu, badge: "NEW" },
    { id: "analytics", label: "Usage Analytics", icon: BarChart3 },
  ];

export function HorosSubnav({
  activeRoute,
  onNavigate,
  dark = true,
  className,
}: HorosSubnavProps) {
  return (
    <nav
      className={cn(
        "relative z-10 border-b transition-colors overflow-x-auto select-none",
        dark ? "border-[#242424] bg-[#141414]" : "border-[#e5e7eb] bg-white",
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
                "relative flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-xs font-mono transition-colors focus:outline-none cursor-pointer",
                isActive
                  ? "text-[#F0EFE2] font-bold"
                  : "text-[#889084] hover:text-[#F0EFE2]"
              )}
            >
              <Icon size={13} className={isActive ? "text-[#75bf00]" : "text-[#788274]"} />
              <span>{item.label}</span>

              {item.badge && (
                <span className="bg-[#75bf00] text-black text-[9px] font-mono font-bold px-1 py-0.2 rounded-xs leading-none">
                  {item.badge}
                </span>
              )}

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
