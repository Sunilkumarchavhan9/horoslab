"use client";

import React, { useState } from "react";
import { Search, ChevronRight, BarChart2, Clock, Check, ArrowDown, ArrowUp, Braces } from "lucide-react";
import { ModelEntity } from "@/lib/epoch-types";
import { DeepSeekLogo } from "../primitives/brand-icons";
import { cn } from "@/lib/utils";

interface ModelsCatalogViewProps {
  models?: ModelEntity[];
  onSelectModel: (modelId: string) => void;
  onOpenImport?: () => void;
  onManageKeys?: () => void;
  dark?: boolean;
}

export function ModelsCatalogView({
  models = [],
  onSelectModel,
  dark = true,
}: ModelsCatalogViewProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const hostedModels = models.map((model) => ({
    id: model.id, name: model.name, status: model.status,
    hfId: model.hfIdentity?.repositoryId ?? model.name,
    inputPrice: model.pricing ? `$${model.pricing.inputPricePer1M}` : "—",
    outputPrice: model.pricing ? `$${model.pricing.outputPricePer1M}` : "—",
    contextWindow: model.contextWindow > 0 ? model.contextWindow.toLocaleString() : "Unknown",
    icon: <DeepSeekLogo size={20} />,
    statusColor: model.status === "ready" || model.status === "available" ? "text-[#75bf00]" : "text-[#fbbf24]",
  }));

  const filteredModels = hostedModels.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.hfId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1000px] mx-auto pb-12">
      {/* Title matching Screenshot 1 */}
      <div>
        <h1 className={cn("text-2xl font-medium tracking-tight", dark ? "text-white" : "text-[#171a17]")}>
          Model{" "}
          <span className="bg-[#75bf00] text-black px-2 py-0.5 font-bold inline-block rounded-xs">
            APIs
          </span>
        </h1>
        <p className={cn("mt-2 text-xs md:text-sm", dark ? "text-[#90988c]" : "text-[#555d50]")}>
          Choose the hosted model that fits your request.
        </p>
      </div>

      {/* Toolbar row with search & usage analytics matching Screenshot 1 */}
      <div className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-y border-dashed py-3",
        dark ? "border-[#2e2e2e]" : "border-[#d8ddd3]"
      )}>
        <div className={cn(
          "flex items-center gap-2 border px-3 py-1.5 text-xs rounded-xs w-full sm:w-80",
          dark ? "border-[#333] bg-[#202020] text-white" : "border-[#d8ddd3] bg-white text-[#171a17]"
        )}>
          <Search size={14} className="text-[#888]" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Find by name or served ID"
            className={cn(
              "w-full bg-transparent text-xs outline-none",
              dark ? "placeholder:text-[#666] text-white" : "placeholder:text-[#90988c] text-[#171a17]"
            )}
          />
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-[#788274]">
          <span>{filteredModels.length} {filteredModels.length === 1 ? "model" : "models"}</span>
          <button
            type="button"
            className={cn(
              "flex items-center gap-1.5 border px-2.5 py-1 text-xs transition-colors rounded-xs",
              dark ? "border-[#333] bg-[#222] text-[#d1d5db] hover:border-[#555]" : "border-[#d8ddd3] bg-white text-[#333] hover:border-[#999]"
            )}
          >
            <BarChart2 size={13} className="text-[#788274]" />
            <span>Usage Analytics</span>
          </button>
        </div>
      </div>

      {/* High-density Model Table Rows matching Screenshot 1 */}
      <div className={cn(
        "border border-dashed divide-y divide-dashed overflow-hidden rounded-xs",
        dark ? "border-[#2e2e2e] bg-[#1a1a1a] divide-[#262626]" : "border-[#d8ddd3] bg-white divide-[#edf0eb]"
      )}>
        {filteredModels.map((m) => (
          <div
            key={m.id}
            onClick={() => onSelectModel(m.id)}
            className={cn(
              "flex flex-col md:flex-row md:items-center justify-between p-4 cursor-pointer transition-colors gap-4 text-xs group",
              dark ? "hover:bg-[#222]" : "hover:bg-[#fafbfa]"
            )}
          >
            {/* Left: Brand Icon + Name */}
            <div className="flex items-center gap-3 min-w-[240px]">
              <div className="shrink-0">{m.icon}</div>
              <span className={cn(
                "font-bold text-sm tracking-tight transition-colors",
                dark ? "text-white group-hover:text-[#75bf00]" : "text-[#171a17] group-hover:text-[#2d5800]"
              )}>
                {m.name}
              </span>
            </div>

            {/* Metrics Columns matching Screenshot 1 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 md:gap-8 flex-1 md:justify-end items-center">
              {/* Input Price */}
              <div>
                <div className={cn("flex items-center gap-1 font-mono font-semibold text-xs", dark ? "text-white" : "text-[#171a17]")}>
                  <ArrowDown size={12} className="text-[#788274]" />
                  <span>{m.inputPrice}</span>
                </div>
                <div className="text-[10px] text-[#788274] font-mono uppercase tracking-wider mt-0.5">
                  INPUT / 1M
                </div>
              </div>

              {/* Output Price */}
              <div>
                <div className={cn("flex items-center gap-1 font-mono font-semibold text-xs", dark ? "text-white" : "text-[#171a17]")}>
                  <ArrowUp size={12} className="text-[#788274]" />
                  <span>{m.outputPrice}</span>
                </div>
                <div className="text-[10px] text-[#788274] font-mono uppercase tracking-wider mt-0.5">
                  OUTPUT / 1M
                </div>
              </div>

              {/* Context Window */}
              <div>
                <div className={cn("flex items-center gap-1 font-mono font-semibold text-xs", dark ? "text-white" : "text-[#171a17]")}>
                  <Braces size={12} className="text-[#788274]" />
                  <span>{m.contextWindow}</span>
                </div>
                <div className="text-[10px] text-[#788274] font-mono uppercase tracking-wider mt-0.5">
                  CONTEXT
                </div>
              </div>

              {/* State */}
              <div className="flex items-center justify-between">
                <div>
                <div className={cn("flex items-center gap-1.5 font-mono font-semibold text-xs", m.statusColor)}>
                    <Clock size={12} />
                    <span>{m.status}</span>
                  </div>
                  <div className="text-[10px] text-[#788274] font-mono uppercase tracking-wider mt-0.5">
                    STATE
                  </div>
                </div>

                <ChevronRight size={15} className={cn("text-[#788274] transition-all group-hover:translate-x-0.5", dark ? "group-hover:text-white" : "group-hover:text-black")} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
