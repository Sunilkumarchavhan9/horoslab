"use client";

import React, { useState } from "react";
import {
  Box,
  Search,
  Lock,
  ArrowRight,
  UploadCloud,
  FileCheck,
  AlertTriangle,
  FileX,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WeightsViewProps {
  dark?: boolean;
  onOpenNewPipeline?: () => void;
  onContactSales?: () => void;
}

export function WeightsView({
  dark = true,
  onOpenNewPipeline,
  onContactSales,
}: WeightsViewProps) {
  const [filterTab, setFilterTab] = useState<"all" | "validated" | "incomplete" | "failed">("incomplete");
  const [searchQuery, setSearchQuery] = useState("");

  const primaryText = dark ? "text-[#F0EFE2]" : "text-[#171a17]";
  const secondaryText = dark ? "text-[#889084]" : "text-[#687063]";

  return (
    <div className="space-y-6 max-w-[1240px] mx-auto animate-in fade-in duration-150">
      {/* Top Header matching Reference Screenshot 4 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono tracking-tight flex items-center gap-1.5">
            <span className={primaryText}>Uploaded</span>
            <span className="bg-[#75bf00] text-black px-2 py-0.5 rounded-xs font-bold inline-block font-sans">
              weights
            </span>
          </h1>
          <p className={cn("mt-1 text-xs", secondaryText)}>
            0 private model repos in workspace. Upload your own weights for measured optimization. To browse open-source models,{" "}
            <button
              type="button"
              onClick={onOpenNewPipeline}
              className="text-[#90988c] underline hover:text-[#75bf00] transition-colors"
            >
              start a new pipeline
            </button>
            .
          </p>
        </div>

        <button
          type="button"
          onClick={onContactSales}
          className={cn(
            "flex items-center gap-1.5 border border-dashed px-3 py-1.5 text-xs font-medium transition-colors rounded-xs font-mono",
            dark
              ? "border-[#383838] bg-[#202020] text-[#a0a89d] hover:text-[#F0EFE2] hover:border-[#75bf00]"
              : "border-[#d8ddd3] bg-white text-[#525a4d] hover:text-black hover:border-black"
          )}
        >
          <Lock size={12} className="text-[#a0a89d]" />
          <span>Enterprise only →</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar matching Reference Screenshot 4 */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1 text-xs font-mono">
          {[
            { id: "all", label: "All", icon: null },
            { id: "validated", label: "Validated", icon: FileCheck },
            { id: "incomplete", label: "Incomplete", icon: AlertTriangle },
            { id: "failed", label: "Failed", icon: FileX },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = filterTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id as typeof filterTab)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 border border-dashed transition-colors rounded-xs",
                  isActive
                    ? dark
                      ? "border-[#555] bg-[#282828] text-[#F0EFE2] font-bold"
                      : "border-[#888] bg-[#eaeaea] text-[#111] font-bold"
                    : dark
                    ? "border-transparent text-[#788274] hover:text-[#F0EFE2]"
                    : "border-transparent text-[#687063] hover:text-[#171a17]"
                )}
              >
                {Icon && <Icon size={12} className={isActive ? "text-[#75bf00]" : "text-[#788274]"} />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <label className={cn(
          "flex items-center gap-2 border border-dashed px-3 py-1.5 text-xs rounded-xs min-w-[240px]",
          dark ? "border-[#2e2e2e] bg-[#202020] text-[#788274]" : "border-[#d8ddd3] bg-white text-[#687063]"
        )}>
          <Search size={13} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search models..."
            className="bg-transparent outline-none placeholder:text-[#666] font-mono text-xs w-full"
          />
        </label>
      </div>

      {/* Stored model data status bar */}
      <div className="flex items-center justify-between text-[11px] font-mono text-[#788274] px-1 border-b border-dashed border-[#282828] pb-2">
        <span className="uppercase font-semibold">Stored model data</span>
        <span>No stored model data</span>
      </div>

      {/* Weights Table Container with Dashed Borders */}
      <div className={cn(
        "border border-dashed divide-y divide-dashed overflow-hidden rounded-xs",
        dark ? "border-[#2e2e2e] bg-[#202020] divide-[#282828]" : "border-[#d8ddd3] bg-white divide-[#edf0eb]"
      )}>
        {/* Table Header Row matching Reference Screenshot 4 */}
        <div className={cn(
          "grid grid-cols-12 gap-3 px-4 py-2.5 text-[11px] font-mono uppercase tracking-wider font-semibold border-b border-dashed",
          dark ? "border-[#282828] bg-[#181818] text-[#889084]" : "border-[#edf0eb] bg-[#fafbfa] text-[#6b7367]"
        )}>
          <div className="col-span-4">Weight</div>
          <div className="col-span-2">Format</div>
          <div className="col-span-2">Size Status</div>
          <div className="col-span-2 text-right">Optimize</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {/* Empty State Box matching Reference Screenshot 4 */}
        <div className="py-20 flex flex-col items-center justify-center text-center p-6 space-y-4">
          <div className={cn(
            "flex h-12 w-12 items-center justify-center border border-dashed rounded-xs",
            dark ? "border-[#383838] bg-[#1a1a1a] text-[#C8C7BA]" : "border-[#d8ddd3] bg-[#f8faf6] text-[#555]"
          )}>
            <Box size={22} className="text-[#C8C7BA]" />
          </div>

          <div className="space-y-1 max-w-sm">
            <h3 className={cn("font-bold text-xs font-mono", primaryText)}>
              Custom weight uploads
            </h3>
            <p className={cn("text-[11px] leading-relaxed", secondaryText)}>
              Uploading your own model weights is an Enterprise feature.
            </p>
          </div>

          <button
            type="button"
            onClick={onContactSales}
            className={cn(
              "flex items-center gap-1.5 border border-dashed px-3.5 py-1.5 text-xs font-medium transition-colors rounded-xs font-mono",
              dark
                ? "border-[#383838] bg-[#222] text-[#F0EFE2] hover:border-[#75bf00] hover:text-[#75bf00]"
                : "border-[#d8ddd3] bg-white text-[#171a17] hover:border-black"
            )}
          >
            <span>Contact sales →</span>
          </button>
        </div>
      </div>
    </div>
  );
}
