"use client";

import React from "react";
import {
  Home,
  Layers,
  Cpu,
  Play,
  Gauge,
  Database,
  ShieldCheck,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type EpochNavRoute =
  | "home"
  | "programs"
  | "models"
  | "runs"
  | "deployments"
  | "registry"
  | "evidence"
  | "settings";

interface EpochSubnavProps {
  activeRoute: EpochNavRoute;
  onNavigate: (route: EpochNavRoute) => void;
  dark?: boolean;
  className?: string;
}

const NAV_ITEMS: Array<{ id: EpochNavRoute; label: string; icon: typeof Home }> = [
  { id: "home", label: "Home", icon: Home },
  { id: "programs", label: "Programs", icon: Layers },
  { id: "models", label: "Models", icon: Cpu },
  { id: "runs", label: "Runs", icon: Play },
  { id: "deployments", label: "Deployments", icon: Gauge },
  { id: "registry", label: "Registry", icon: Database },
  { id: "evidence", label: "Evidence", icon: ShieldCheck },
  { id: "settings", label: "Settings", icon: Settings },
];

export function EpochSubnav({
  activeRoute,
  onNavigate,
  dark = false,
  className,
}: EpochSubnavProps) {
  return (
    <nav
      className={cn(
        "border-b transition-colors overflow-x-auto",
        dark ? "border-[#282828] bg-[#151515]" : "border-[#e1e4df] bg-white",
        className
      )}
    >
      <div className="mx-auto flex max-w-[1440px] items-center gap-1 px-4 sm:px-6">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeRoute === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={cn(
                "relative flex items-center gap-2 whitespace-nowrap px-3.5 py-3 text-xs md:text-sm font-medium transition-colors focus:outline-none",
                isActive
                  ? dark ? "text-white font-semibold" : "text-[#151515] font-semibold"
                  : dark ? "text-[#9ea89c] hover:text-white" : "text-[#687063] hover:text-[#171a17]"
              )}
            >
              <Icon size={14} className={isActive ? "text-[#75bf00]" : "text-current"} />
              <span>{item.label}</span>

              {/* Shared active thin underline matching spec */}
              {isActive ? (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#75bf00]" />
              ) : (
                <span className={cn(
                  "absolute bottom-0 left-0 right-0 h-[2.5px] bg-transparent",
                  dark ? "hover:bg-[#333]" : "hover:bg-[#d8ddd3]"
                )} />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
