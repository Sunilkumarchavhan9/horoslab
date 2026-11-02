"use client";

import React, { useState } from "react";
import {
  CreditCard,
  Plus,
  BarChart3,
  Key,
  Layers,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RotateCcw,
  Clock,
  Zap,
  TrendingUp,
  FileText,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FinOpsCostViewProps {
  dark?: boolean;
  balanceUsd?: number;
  onNavigateToPipelines?: () => void;
  onNavigateToAnalytics?: () => void;
}

export function FinOpsCostView({
  dark = true,
  balanceUsd = 9.51,
  onNavigateToPipelines,
  onNavigateToAnalytics,
}: FinOpsCostViewProps) {
  const [costPeriod, setCostPeriod] = useState<"7D" | "30D" | "90D">("30D");
  const [starterDrawerOpen, setStarterDrawerOpen] = useState(false);
  const [spendLimitPreset, setSpendLimitPreset] = useState<"25" | "100" | "500" | "nolimit">("nolimit");
  const [customSpendLimit, setCustomSpendLimit] = useState("");
  const [addFundsModalOpen, setAddFundsModalOpen] = useState(false);
  const [addCardModalOpen, setAddCardModalOpen] = useState(false);
  const [fundAmount, setFundAmount] = useState("50");
  const [currentBalance, setCurrentBalance] = useState(balanceUsd);

  // Credit Activity Ledger Data (Screenshot 3)
  const creditActivity = [
    {
      id: "act-1",
      title: "Agent usage charged",
      time: "Aug 10, 1:53 PM",
      amount: "-$0.18",
      balanceAfter: "$9.51",
      type: "debit",
    },
    {
      id: "act-2",
      title: "Agent usage charged",
      time: "Aug 10, 1:53 PM",
      amount: "-$0.14",
      balanceAfter: "$9.69",
      type: "debit",
    },
    {
      id: "act-3",
      title: "Agent usage settled",
      time: "Aug 10, 1:53 PM",
      amount: "+$0.83",
      balanceAfter: "$9.83",
      type: "credit",
    },
    {
      id: "act-4",
      title: "Agent usage reserved",
      time: "Aug 10, 1:52 PM",
      amount: "-$1.00",
      balanceAfter: "$9.00",
      type: "reserved",
    },
    {
      id: "act-5",
      title: "Trial credits",
      time: "Aug 8, 6:49 PM",
      amount: "+$10.00",
      balanceAfter: "$10.00",
      type: "credit",
    },
  ];

  const handleAddFunds = (e: React.FormEvent) => {
    e.preventDefault();
    const added = Number(fundAmount) || 50;
    setCurrentBalance((prev) => prev + added);
    setAddFundsModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-[1040px] mx-auto pb-20 font-sans text-xs text-left animate-in fade-in duration-150">
      {/* Top Header Matching HOROS 1:1 */}
      <div>
        <h1 className="text-xl font-bold font-mono tracking-tight flex items-center gap-1.5 text-[#F0EFE2]">
          <span className="bg-[#75bf00] text-black px-2 py-0.5 rounded-xs font-bold inline-block font-sans text-base">
            Billing
          </span>
        </h1>
        <p className="mt-1 text-xs text-[#90988c]">
          Balance, spending controls, usage, and receipts.
        </p>
      </div>

      <div className="divide-y divide-dashed divide-[#282828] border-t border-dashed border-[#282828]">
        {/* SECTION 1: CREDITS (Screenshot 1) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-6">
          <div className="md:col-span-4 space-y-1">
            <div className="flex items-center gap-2 font-bold text-[#F0EFE2] text-xs">
              <div className="w-5 h-5 rounded-xs border border-[#333] bg-[#1a1a1a] flex items-center justify-center text-[#C8C7BA]">
                <CreditCard size={11} />
              </div>
              <span>Credits</span>
            </div>
            <p className="text-[11px] text-[#788274] leading-relaxed">
              Top up and see how your balance is spent. The balance shows in the top bar.
            </p>
          </div>

          <div className="md:col-span-8">
            <div className="border border-[#2b3a1a] bg-[#162010] p-4 rounded-xs space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-xs border border-[#486326] bg-[#1d2714] flex items-center justify-center text-[#86dc00] shrink-0 mt-0.5">
                  <Key size={13} className="text-[#86dc00]" />
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-[#F0EFE2] text-xs">
                    ${currentBalance.toFixed(2)} free balance remaining
                  </div>
                  <p className="text-[11px] text-[#90988c] leading-relaxed">
                    Your free balance funds optimization runs, the agent, and runbooks. Optimization runs require at least $30.00 available. Managed deployments unlock at $50 in lifetime credit purchases. Every charge and refund appears in Credit Activity below.
                  </p>
                </div>
              </div>

              <div className="pl-9">
                <button
                  type="button"
                  onClick={() => setAddFundsModalOpen(true)}
                  className="flex items-center gap-1.5 bg-[#1d2714] hover:bg-[#25331a] border border-[#2b3a1a] text-[#86dc00] px-3 py-1.5 rounded-xs text-xs font-mono transition-colors cursor-pointer"
                >
                  <Plus size={11} />
                  <span>Add funds</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: SPEND TIER (Screenshot 1 & 4) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-6">
          <div className="md:col-span-4 space-y-1">
            <div className="flex items-center gap-2 font-bold text-[#F0EFE2] text-xs">
              <div className="w-5 h-5 rounded-xs border border-[#333] bg-[#1a1a1a] flex items-center justify-center text-[#C8C7BA]">
                <Layers size={11} />
              </div>
              <span>Spend tier</span>
            </div>
            <p className="text-[11px] text-[#788274] leading-relaxed">
              Lifetime paid credit purchases unlock workspace capacity.
            </p>
          </div>

          <div className="md:col-span-8 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[#788274] uppercase">CURRENT TIER</span>
                  <span className="text-[10px] text-[#86dc00] bg-[#1d2714] border border-[#2b3a1a] px-1.5 py-0.2 rounded-xs font-mono">
                    ● Active
                  </span>
                </div>
                <div className="text-base font-bold text-[#F0EFE2]">Starter</div>
                <p className="text-[11px] text-[#788274]">
                  Capacity follows this workspace&apos;s paid credit purchase history.
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono text-[#788274] uppercase">LIFETIME PURCHASES</span>
                <div className="text-base font-bold text-[#F0EFE2] font-mono">$0.00</div>
                <p className="text-[11px] text-[#788274]">
                  Paid credit purchases only. Promotional grants do not raise this tier.
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 border-t border-[#242424] pt-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-[#F0EFE2]">Next unlock: Builder</span>
                <span className="text-[#788274]">$0.00 of $50.00</span>
              </div>
              <div className="w-full bg-[#202020] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#75bf00] h-full w-[0%]" />
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#788274]">Buy another $50.00 in credits to reach the next tier.</span>
                <button
                  type="button"
                  onClick={() => setAddFundsModalOpen(true)}
                  className="text-[#86dc00] hover:underline flex items-center gap-0.5 cursor-pointer font-mono"
                >
                  <span>Add funds</span>
                  <ExternalLink size={10} />
                </button>
              </div>
            </div>

            {/* Collapsible: What Starter unlocks (Screenshot 4) */}
            <div className="border-t border-[#242424] pt-2">
              <button
                type="button"
                onClick={() => setStarterDrawerOpen(!starterDrawerOpen)}
                className="flex items-center justify-between w-full text-xs text-[#889084] hover:text-[#F0EFE2] transition-colors cursor-pointer py-1"
              >
                <span>What Starter unlocks</span>
                {starterDrawerOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              {starterDrawerOpen && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 animate-in fade-in duration-100 font-mono">
                  <div className="p-3 border border-dashed border-[#282828] bg-[#181818] rounded-xs space-y-1">
                    <span className="text-[10px] text-[#788274] uppercase block">HOSTED CONCURRENCY</span>
                    <div className="font-bold text-[#F0EFE2] text-xs">4 concurrent requests</div>
                  </div>

                  <div className="p-3 border border-dashed border-[#282828] bg-[#181818] rounded-xs space-y-1">
                    <span className="text-[10px] text-[#788274] uppercase block">HOSTED THROUGHPUT</span>
                    <div className="font-bold text-[#F0EFE2] text-xs">200,000 tokens/min</div>
                  </div>

                  <div className="p-3 border border-dashed border-[#282828] bg-[#181818] rounded-xs space-y-1">
                    <span className="text-[10px] text-[#788274] uppercase block">REQUEST RATE</span>
                    <div className="font-bold text-[#F0EFE2] text-xs">1,000 requests/min</div>
                  </div>

                  <div className="p-3 border border-dashed border-[#282828] bg-[#181818] rounded-xs space-y-1">
                    <span className="text-[10px] text-[#788274] uppercase block">GPU RUN CONCURRENCY</span>
                    <div className="font-bold text-[#F0EFE2] text-xs">1 concurrent runs</div>
                    <p className="text-[10px] text-[#666] font-sans">
                      Optimization runs that can use GPU capacity together.
                    </p>
                  </div>

                  <div className="p-3 border border-dashed border-[#282828] bg-[#181818] rounded-xs space-y-1 sm:col-span-2">
                    <span className="text-[10px] text-[#788274] uppercase block">AGENT TOOL SPEND</span>
                    <div className="font-bold text-[#F0EFE2] text-xs">$5.00 per turn</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 3: AUTO RECHARGE (Screenshot 1) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-6">
          <div className="md:col-span-4 space-y-1">
            <div className="flex items-center gap-2 font-bold text-[#F0EFE2] text-xs">
              <div className="w-5 h-5 rounded-xs border border-[#333] bg-[#1a1a1a] flex items-center justify-center text-[#C8C7BA]">
                <RotateCcw size={11} />
              </div>
              <span>Auto recharge</span>
            </div>
            <p className="text-[11px] text-[#788274] leading-relaxed">
              Automatically attempts a top-up when your balance falls below the trigger, up to your monthly cap. Recharges can pause or fail if the saved card cannot be charged.
            </p>
          </div>

          <div className="md:col-span-8 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="font-bold text-[#F0EFE2] text-xs">Auto-recharge</div>
              <p className="text-[11px] text-[#788274]">
                Off. Turn on to keep a minimum balance automatically.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setAddCardModalOpen(true)}
              className="flex items-center gap-1.5 border border-[#383838] bg-[#1a1a1a] hover:bg-[#242424] text-[#a0a89d] hover:text-[#F0EFE2] px-3 py-1.5 rounded-xs text-xs font-mono transition-colors cursor-pointer"
            >
              <CreditCard size={11} />
              <span>Add a card to enable</span>
            </button>
          </div>
        </div>

        {/* SECTION 4: SPEND LIMIT (Screenshot 2) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-6">
          <div className="md:col-span-4 space-y-1">
            <div className="flex items-center gap-2 font-bold text-[#F0EFE2] text-xs">
              <div className="w-5 h-5 rounded-xs border border-[#333] bg-[#1a1a1a] flex items-center justify-center text-[#C8C7BA]">
                <Clock size={11} />
              </div>
              <span>Spend limit</span>
            </div>
            <p className="text-[11px] text-[#788274] leading-relaxed">
              A monthly limit on new optimization and deployments. Live endpoints keep serving past it.
            </p>
          </div>

          <div className="md:col-span-8 space-y-3">
            <span className="text-[10px] font-mono text-[#788274] uppercase block">MONTHLY LIMIT</span>

            <div className="flex items-center gap-2 font-mono">
              {(["25", "100", "500", "nolimit"] as const).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSpendLimitPreset(preset)}
                  className={cn(
                    "px-3 py-1 text-xs rounded-xs border transition-colors cursor-pointer",
                    spendLimitPreset === preset
                      ? "border-[#75bf00] text-[#75bf00] bg-[#182012] font-bold"
                      : "border-[#333] bg-[#181818] text-[#C8C7BA] hover:border-[#555] hover:text-[#F0EFE2]"
                  )}
                >
                  {preset === "nolimit" ? "No limit" : `$${preset}`}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 max-w-xs">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#666] font-mono">$</span>
                  <input
                    type="text"
                    value={customSpendLimit}
                    onChange={(e) => setCustomSpendLimit(e.target.value)}
                    placeholder="5"
                    className="w-full bg-[#181818] border border-[#333] focus:border-[#75bf00] rounded-xs pl-6 pr-3 py-1.5 text-xs text-[#F0EFE2] placeholder-[#666] outline-none font-mono"
                  />
                </div>
                <button
                  type="button"
                  className="px-3 py-1.5 border border-[#2a2a2a] bg-[#1e1e1e] text-[#666] rounded-xs text-xs font-mono cursor-not-allowed"
                >
                  Save limit
                </button>
              </div>
              <p className="text-[11px] text-[#788274]">
                No limit set. Enter an amount or pick a preset to start tracking.
              </p>
              <p className="text-[10px] text-[#555] pt-1">
                This limit does not govern automatic top-ups. Those are capped by auto-recharge above.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 5: COST USAGE (Screenshot 2) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-6">
          <div className="md:col-span-4 space-y-1">
            <div className="flex items-center gap-2 font-bold text-[#F0EFE2] text-xs">
              <div className="w-5 h-5 rounded-xs border border-[#333] bg-[#1a1a1a] flex items-center justify-center text-[#C8C7BA]">
                <BarChart3 size={11} />
              </div>
              <span>Cost Usage</span>
            </div>
            <p className="text-[11px] text-[#788274] leading-relaxed">
              Workspace spend, request volume, average request cost, and current-day spend rate for the selected period.
            </p>
          </div>

          <div className="md:col-span-8 space-y-4 font-mono">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-[#788274] text-[11px]">
                <TrendingUp size={12} className="text-[#86dc00]" />
                <span>Measured daily totals in UTC.</span>
              </div>

              <div className="flex items-center border border-[#383838] bg-[#181818] p-0.5 rounded-xs">
                {(["7D", "30D", "90D"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCostPeriod(p)}
                    className={cn(
                      "px-2.5 py-0.5 rounded-xs transition-colors text-[11px] cursor-pointer",
                      costPeriod === p
                        ? "bg-[#282828] text-[#F0EFE2] font-bold"
                        : "text-[#788274] hover:text-[#F0EFE2]"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 gap-4 border-b border-[#242424] pb-3">
              <div>
                <span className="text-[10px] text-[#788274] uppercase block">AVG COST</span>
                <div className="font-bold text-[#F0EFE2] text-xs mt-0.5">$0.1633</div>
              </div>
              <div>
                <span className="text-[10px] text-[#788274] uppercase block">TODAY RATE</span>
                <div className="font-bold text-[#F0EFE2] text-xs mt-0.5">$0.00/hr</div>
                <p className="text-[10px] text-[#666] font-sans">Average hourly spend for today in UTC.</p>
              </div>
            </div>

            {/* 2 Charts Side by Side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Spend Chart */}
              <div className="border border-dashed border-[#282828] bg-[#141414] rounded-xs p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#F0EFE2]">Spend over time</span>
                  <span className="text-[#788274] text-[10px]">USD</span>
                </div>
                <div className="text-xs font-bold text-[#F0EFE2]">$0.49 <span className="text-[10px] text-[#788274] font-normal">USD, last 30d</span></div>
                
                {/* SVG Graph Grid with Green Dot */}
                <div className="h-20 w-full relative pt-2">
                  <svg viewBox="0 0 200 60" className="w-full h-full">
                    <line x1="0" y1="50" x2="200" y2="50" stroke="#222" strokeWidth="1" />
                    <line x1="0" y1="25" x2="200" y2="25" stroke="#222" strokeWidth="1" strokeDasharray="2 2" />
                    {/* Baseline Dot */}
                    <circle cx="100" cy="40" r="3" fill="#86dc00" />
                  </svg>
                  <div className="flex justify-between text-[9px] text-[#555] -mt-1">
                    <span>$0.00</span>
                    <span>8/10</span>
                  </div>
                </div>
              </div>

              {/* Requests Chart */}
              <div className="border border-dashed border-[#282828] bg-[#141414] rounded-xs p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#F0EFE2]">Requests over time</span>
                  <span className="text-[#788274] text-[10px]">Daily UTC</span>
                </div>
                <div className="text-xs font-bold text-[#F0EFE2]">3 <span className="text-[10px] text-[#788274] font-normal">requests, last 30d</span></div>

                {/* SVG Graph Grid with Green Dot */}
                <div className="h-20 w-full relative pt-2">
                  <svg viewBox="0 0 200 60" className="w-full h-full">
                    <line x1="0" y1="50" x2="200" y2="50" stroke="#222" strokeWidth="1" />
                    <line x1="0" y1="25" x2="200" y2="25" stroke="#222" strokeWidth="1" strokeDasharray="2 2" />
                    {/* Baseline Dot */}
                    <circle cx="150" cy="30" r="3" fill="#86dc00" />
                  </svg>
                  <div className="flex justify-between text-[9px] text-[#555] -mt-1">
                    <span>0</span>
                    <span>8/10</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 6: CREDIT ACTIVITY (Screenshot 3) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-6">
          <div className="md:col-span-4 space-y-1">
            <div className="flex items-center gap-2 font-bold text-[#F0EFE2] text-xs">
              <div className="w-5 h-5 rounded-xs border border-[#333] bg-[#1a1a1a] flex items-center justify-center text-[#C8C7BA]">
                <Clock size={11} />
              </div>
              <span>Credit Activity</span>
            </div>
            <p className="text-[11px] text-[#788274] leading-relaxed">
              Every time money was added, spent, or refunded.
            </p>
          </div>

          <div className="md:col-span-8">
            <div className="border border-dashed border-[#282828] bg-[#141414] rounded-xs font-mono text-xs overflow-hidden">
              <div className="flex items-center justify-between p-3 bg-[#181818] border-b border-dashed border-[#282828] text-[10px] text-[#788274]">
                <span>Activity</span>
                <div className="flex items-center gap-12">
                  <span>Amount</span>
                  <span className="w-16 text-right">Balance after</span>
                </div>
              </div>

              <div className="divide-y divide-dashed divide-[#222]">
                {creditActivity.map((act) => (
                  <div key={act.id} className="p-3 flex items-center justify-between hover:bg-[#181818] transition-colors">
                    <div className="space-y-0.5">
                      <div className="font-bold text-[#F0EFE2] text-xs">{act.title}</div>
                      <div className="text-[10px] text-[#788274]">{act.time}</div>
                    </div>

                    <div className="flex items-center gap-12 text-xs">
                      <span
                        className={cn(
                          "font-bold",
                          act.type === "credit"
                            ? "text-[#86dc00]"
                            : act.type === "reserved"
                            ? "text-[#a0a89d]"
                            : "text-[#F0EFE2]"
                        )}
                      >
                        {act.amount}
                      </span>
                      <span className="w-16 text-right text-[#a0a89d]">{act.balanceAfter}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 7: INVOICES (Screenshot 3) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-6">
          <div className="md:col-span-4 space-y-1">
            <div className="flex items-center gap-2 font-bold text-[#F0EFE2] text-xs">
              <div className="w-5 h-5 rounded-xs border border-[#333] bg-[#1a1a1a] flex items-center justify-center text-[#C8C7BA]">
                <FileText size={11} />
              </div>
              <span>Invoices</span>
            </div>
            <p className="text-[11px] text-[#788274] leading-relaxed">
              Invoices from the retired monthly plans. Credit purchases are listed in Credit Activity.
            </p>
          </div>

          <div className="md:col-span-8">
            <div className="border border-dashed border-[#282828] bg-[#141414] rounded-xs p-10 text-center flex flex-col items-center justify-center space-y-2">
              <div className="w-8 h-8 rounded-xs border border-dashed border-[#383838] bg-[#1a1a1a] flex items-center justify-center text-[#788274]">
                <FileText size={14} />
              </div>
              <div className="space-y-1">
                <div className="font-bold text-[#F0EFE2] text-xs">No invoices</div>
                <p className="text-xs text-[#788274] max-w-md leading-relaxed">
                  Invoices come from the retired monthly plans. Credit purchases do not produce one, and every top-up, charge and refund is listed in Credit Activity above.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Funds Modal */}
      {addFundsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-100 backdrop-blur-xs">
          <form
            onSubmit={handleAddFunds}
            className="w-full max-w-md border border-[#282828] bg-[#141414] rounded-sm p-6 text-xs space-y-4 shadow-2xl text-left"
          >
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-[#F0EFE2] tracking-tight">Add Inference Balance</h2>
              <p className="text-xs text-[#90988c] leading-relaxed">
                Add credits to fund your hosted models, automated pipelines, and benchmark runs.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-[#788274] tracking-wider uppercase block">
                SELECT RECHARGE AMOUNT ($ USD)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {["25", "50", "100", "500"].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setFundAmount(amt)}
                    className={cn(
                      "py-2 font-mono text-xs rounded-xs border transition-colors cursor-pointer text-center",
                      fundAmount === amt
                        ? "border-[#75bf00] bg-[#1a2416] text-[#86dc00] font-bold"
                        : "border-[#333] bg-[#181818] text-[#F0EFE2] hover:border-[#555]"
                    )}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#242424]">
              <button
                type="button"
                onClick={() => setAddFundsModalOpen(false)}
                className="px-4 py-2 border border-[#383838] bg-[#1e1e1e] hover:bg-[#282828] text-[#F0EFE2] font-medium rounded-xs cursor-pointer text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-[#75bf00] hover:bg-[#86dc00] text-black font-bold px-4 py-2 rounded-xs cursor-pointer text-xs transition-colors shadow-sm"
              >
                <CreditCard size={12} />
                <span>Confirm Payment (${fundAmount})</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Card Modal */}
      {addCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-100 backdrop-blur-xs">
          <div className="w-full max-w-md border border-[#282828] bg-[#141414] rounded-sm p-6 text-xs space-y-4 shadow-2xl text-left">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-[#F0EFE2] tracking-tight">Add Payment Card</h2>
              <p className="text-xs text-[#90988c] leading-relaxed">
                Add a credit or debit card for automatic top-ups when your balance falls below the trigger.
              </p>
            </div>

            <div className="space-y-3 font-mono">
              <div>
                <label className="text-[10px] text-[#788274] uppercase block">CARD NUMBER</label>
                <input
                  type="text"
                  placeholder="•••• •••• •••• 4242"
                  className="w-full bg-[#181818] border border-[#333] rounded-xs px-3 py-2 text-[#F0EFE2] outline-none mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#788274] uppercase block">EXPIRES</label>
                  <input
                    type="text"
                    placeholder="MM / YY"
                    className="w-full bg-[#181818] border border-[#333] rounded-xs px-3 py-2 text-[#F0EFE2] outline-none mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#788274] uppercase block">CVC</label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full bg-[#181818] border border-[#333] rounded-xs px-3 py-2 text-[#F0EFE2] outline-none mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#242424]">
              <button
                type="button"
                onClick={() => setAddCardModalOpen(false)}
                className="px-4 py-2 border border-[#383838] bg-[#1e1e1e] hover:bg-[#282828] text-[#F0EFE2] font-medium rounded-xs cursor-pointer text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setAddCardModalOpen(false)}
                className="flex items-center gap-1.5 bg-[#75bf00] hover:bg-[#86dc00] text-black font-bold px-4 py-2 rounded-xs cursor-pointer text-xs transition-colors shadow-sm"
              >
                <span>Save Card</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
