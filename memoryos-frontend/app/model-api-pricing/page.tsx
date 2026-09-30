"use client";

import React, { useState } from "react";
import { Check, Info, ArrowRight, Minus, ChevronRight, X } from "lucide-react";
import { DeepSeekLogo, MetaLogo, MistralLogo, OrnithLogo, NvidiaLogo, QwenLogo, GLMLogo } from "@/components/dhyra/primitives/brand-icons";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { CAPABILITIES } from "@/lib/capabilities-data";

export default function PricingPage() {
  const [creditAmount, setCreditAmount] = useState(20);
  const [faqTab, setFaqTab] = useState<"payg" | "enterprise">("payg");
  const [selectedPlan, setSelectedPlan] = useState<"payg" | "coding">("payg");

  return (
    <div className="relative min-h-screen bg-[#151515] text-[#C8C7BA] font-sans pb-24 overflow-hidden">
      <LandingNavbar />

      {/* Background Dashed Lines - Global Layout */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute left-[6%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        <div className="absolute left-[14%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        <div className="absolute left-[86%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        <div className="absolute left-[94%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
      </div>

      <div className="max-w-5xl mx-auto pt-20 px-6 md:px-0 relative z-10">

        {/* Section 1: Simple pricing */}
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium mb-4 tracking-tight flex items-center gap-3 text-[#C8C7BA]">
            Simple pricing for open <span className="bg-[#76b900] text-[#151515] px-3 py-1 rounded-none">models</span>
          </h1>
          <p className="text-[#888] text-base md:text-lg">Pick the way that fits how you work.</p>
        </div>

        {/* Top Cards Toggle Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

          {/* Pay as you go Card */}
          <div
            onClick={() => setSelectedPlan("payg")}
            className={`border border-dashed p-6 cursor-pointer transition-colors ${selectedPlan === "payg" ? "border-[#76b900] bg-transparent" : "border-[#333] bg-[#1c1c1c] hover:border-[#76b900]"
              }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-medium text-[#C8C7BA]">Pay as you go</h2>
              <div className={`w-4 h-4 rounded-none border flex items-center justify-center ${selectedPlan === "payg" ? "border-[#888]" : "border-[#555]"
                }`}>
                {selectedPlan === "payg" && <div className="w-2 h-2 rounded-none bg-white" />}
              </div>
            </div>
            <p className="text-[#888] text-sm mb-6">For apps, APIs and everything else</p>

            <div className="text-sm">
              <p className="font-medium mb-3 text-[#C8C7BA]">Any amount from $5</p>
              <ul className="space-y-2 text-[#aaa]">
                <li className="flex items-center gap-2"><Check size={14} className="text-[#888]" /> Pay per token at published prices</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[#888]" /> Credits last a year</li>
              </ul>
            </div>
          </div>

          {/* Coding Plan Card */}
          <div
            onClick={() => setSelectedPlan("coding")}
            className={`border border-dashed p-6 cursor-pointer transition-colors ${selectedPlan === "coding" ? "border-[#76b900] bg-transparent" : "border-[#333] bg-[#1c1c1c] hover:border-[#76b900]"
              }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-medium text-[#C8C7BA]">Coding plan</h2>
              <div className={`w-4 h-4 rounded-none border flex items-center justify-center ${selectedPlan === "coding" ? "border-[#888]" : "border-[#555]"
                }`}>
                {selectedPlan === "coding" && <div className="w-2 h-2 rounded-none bg-white" />}
              </div>
            </div>
            <p className="text-[#888] text-sm mb-6">For Claude Code, Codex, OpenCode and more</p>

            <div className="text-sm">
              <p className="font-medium mb-3 text-[#C8C7BA]">From $10 a month</p>
              <ul className="space-y-2 text-[#aaa]">
                <li className="flex items-center gap-2"><Check size={14} className="text-[#888]" /> Usage included, resets every 5 hours and every week</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[#888]" /> At a limit, credits or free Standby</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Selected Plan Details */}
        <div className="mb-24 flex flex-col md:flex-row border border-dashed border-[#333]">

          {/* LEFT COLUMN: Dynamic based on selected plan */}
          <div className="w-full md:w-1/2 flex flex-col justify-between p-8 md:p-12 md:pr-10 mb-12 md:mb-0">
            {selectedPlan === "payg" ? (
              <>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl md:text-2xl lg:text-[28px] font-medium text-[#C8C7BA]">Pay as you go</h2>
                    <span className="text-[9px] md:text-[10px] md:text-[11px] lg:text-[12px] font-medium tracking-wide bg-[#222] px-3 py-1 rounded-none text-[#aaa] flex items-center gap-1.5">
                      <span className="text-[#888]">#</span> No subscription
                    </span>
                  </div>
                  <p className="text-[#aaa] text-[11px] md:text-[12px] lg:text-[13px] md:text-[14px] lg:text-[15px] mb-8">Hosted Model APIs, per token, on one prepaid balance.</p>

                  <div className="mb-8">
                    <label className="text-[9px] md:text-[10px] lg:text-[11px] text-[#666] font-medium uppercase tracking-widest mb-3 block">AMOUNT IN DOLLARS</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C8C7BA] font-medium text-lg">$</span>
                      <input
                        type="number"
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(Number(e.target.value))}
                        className="w-full bg-transparent border border-dashed border-[#333] rounded-none py-3.5 pl-9 pr-4 text-[#C8C7BA] text-lg focus:outline-none focus:border-[#76b900] transition-colors"
                      />
                    </div>
                    <p className="text-[#888] text-[9px] md:text-[10px] lg:text-[11px] mt-3">
                      $5 minimum top-up. Pay per token.
                    </p>
                  </div>

                  <div className="mb-8">
                    <h3 className="font-medium text-[13px] md:text-[14px] lg:text-[15px] mb-5 text-[#C8C7BA]">What's included</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-[11.5px] md:text-[12.5px] lg:text-[13.5px] text-[#ccc]">
                      <div className="flex items-start gap-3"><Check size={14} strokeWidth={2} className="text-[#888] mt-0.5 shrink-0" /> OpenAI-compatible chat completions and Anthropic-compatible Messages</div>
                      <div className="flex items-start gap-3"><Check size={14} strokeWidth={2} className="text-[#888] mt-0.5 shrink-0" /> Per-token pricing with cached input discounts on supported models</div>
                      <div className="flex items-start gap-3"><Check size={14} strokeWidth={2} className="text-[#888] mt-0.5 shrink-0" /> Session-aware routing keeps agent replays warm</div>
                      <div className="flex items-start gap-3"><Check size={14} strokeWidth={2} className="text-[#888] mt-0.5 shrink-0" /> One prepaid balance, no seats, no per-user fees</div>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <p className="text-center text-[10px] md:text-[11px] lg:text-[12px] text-[#888] mb-5">New accounts start with $1 free to test the Model APIs.</p>
                  <button className="w-full bg-[#76b900] hover:bg-[#85cc00] text-[#151515] font-medium text-[11.5px] md:text-[12.5px] lg:text-[13.5px] py-3.5 flex items-center justify-center transition-colors">
                    Add credits <ChevronRight size={15} strokeWidth={2.5} className="ml-1" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl md:text-2xl lg:text-[28px] font-medium text-[#C8C7BA]">Coding plan</h2>
                    <span className="text-[9px] md:text-[10px] md:text-[11px] lg:text-[12px] font-medium tracking-wide bg-[#222] px-3 py-1 rounded-none text-[#aaa] flex items-center gap-1.5">
                      <span className="text-[#888]">#</span> Subscription
                    </span>
                  </div>
                  <p className="text-[#aaa] text-[11px] md:text-[12px] lg:text-[13px] md:text-[14px] lg:text-[15px] mb-8">For Claude Code, Codex, OpenCode and more.</p>

                  <div className="mb-8">
                    <h3 className="font-medium text-[13px] md:text-[14px] lg:text-[15px] mb-5 text-[#C8C7BA]">What's included</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-[11.5px] md:text-[12.5px] lg:text-[13.5px] text-[#ccc]">
                      <div className="flex items-start gap-3"><Check size={14} strokeWidth={2} className="text-[#888] mt-0.5 shrink-0" /> Usage included, resets every 5 hours and every week</div>
                      <div className="flex items-start gap-3"><Check size={14} strokeWidth={2} className="text-[#888] mt-0.5 shrink-0" /> At a limit, credits or free Standby</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* RIGHT COLUMN: Enterprise (Always visible) */}
          <div className="w-full md:w-1/2 flex flex-col justify-between p-8 md:p-12 md:pl-10 border-t md:border-t-0 md:border-l border-dashed border-[#333]">
            <div>
              <div className="mb-10">
                <h2 className="text-xl md:text-2xl lg:text-[28px] font-medium mb-3 text-[#C8C7BA]">Enterprise</h2>
                <p className="text-[#aaa] text-[11px] md:text-[12px] lg:text-[13px] md:text-[14px] lg:text-[15px] pr-8">Dedicated infrastructure, compliance, and custom volume.</p>
              </div>

              <div>
                <h2 className="text-2xl font-medium mb-2 text-[#C8C7BA]">Custom pricing</h2>
                <p className="text-[#C8C7BA] font-medium text-[13px] md:text-[14px] lg:text-[15px] mb-5 mt-8">Everything self-serve includes, plus</p>
                <ul className="space-y-4 text-[11.5px] md:text-[12.5px] lg:text-[13.5px] text-[#ccc]">
                  <li className="flex items-start gap-3"><Check size={14} strokeWidth={2} className="text-[#888] mt-0.5 shrink-0" /> Audit logs and role-based access control (RBAC)</li>
                  <li className="flex items-start gap-3"><Check size={14} strokeWidth={2} className="text-[#888] mt-0.5 shrink-0" /> Custom volume and contract terms</li>
                  <li className="flex items-start gap-3"><Check size={14} strokeWidth={2} className="text-[#888] mt-0.5 shrink-0" /> Custom SLAs up to 99.99%</li>
                  <li className="flex items-start gap-3"><Check size={14} strokeWidth={2} className="text-[#888] mt-0.5 shrink-0" /> SOC 2 Type II attestation</li>
                  <li className="flex items-start gap-3"><Check size={14} strokeWidth={2} className="text-[#888] mt-0.5 shrink-0" /> Dedicated CSM and private Slack</li>
                </ul>
              </div>
            </div>

            <button className="w-full mt-10 bg-[#1c1c1c] hover:bg-[#252525] text-[#888] hover:text-[#aaa] font-medium text-[11.5px] md:text-[12.5px] lg:text-[13.5px] py-3.5 flex items-center justify-center transition-colors">
              Request a demo <ChevronRight size={15} strokeWidth={2} className="ml-1" />
            </button>
          </div>
        </div>


        {/* Section 2: Token Pricing Table */}
        <div className="mb-24">
          <div className="text-[#76b900] text-[9px] md:text-[10px] lg:text-[11px] font-medium tracking-widest uppercase mb-4">Model APIs</div>
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-2xl md:text-3xl lg:text-[32px] font-medium text-[#C8C7BA] tracking-tight flex items-center gap-2">
              Pay for model tokens, not idle <span className="bg-[#76b900] text-[#151515] px-2 py-0.5 rounded-none leading-none inline-flex">capacity</span>
            </h2>
            <button className="text-[10px] md:text-[11px] lg:text-[12px] text-[#888] font-medium border border-dashed border-[#333] px-4 py-2 rounded-none hover:text-[#C8C7BA] transition-colors">
              Price per 1M tokens
            </button>
          </div>

          <div className="w-full border border-dashed border-[#333] rounded-none bg-transparent">
            <div className="grid grid-cols-[2.5fr_1fr_1.5fr_1fr_1fr] px-8 pt-5 pb-4 border-b border-dashed border-[#333] text-[9px] md:text-[10px] lg:text-[11px] font-medium text-[#666]">
              <div>Model</div>
              <div>Input</div>
              <div>Cached input</div>
              <div>Output</div>
              <div></div>
            </div>

            {CAPABILITIES.map((cap, i) => (
              <a href={`/capabilities/${encodeURIComponent(cap.developer)}/${encodeURIComponent(cap.name)}`} key={cap.id} className={`grid grid-cols-[2.5fr_1fr_1.5fr_1fr_1fr] px-8 py-6 items-center group hover:bg-[#1f1f1f] transition-all duration-200 cursor-pointer ${i < CAPABILITIES.length - 1 ? 'border-b border-dashed border-[#333]' : ''}`}>
                <div className="flex items-center gap-4">
                  <cap.icon size={26} />
                  <span className="font-medium text-[#C8C7BA] group-hover:text-[#76b900] transition-colors text-[12px] md:text-[13px] lg:text-[14px] md:text-[15px] lg:text-[16.5px]">{cap.name}</span>
                </div>
                <div className="font-medium text-[#C8C7BA] text-[12px] md:text-[13px] lg:text-[14px] md:text-[15px] lg:text-[16px]">{cap.metrics.input}</div>
                <div>
                  <div className="font-medium text-[#C8C7BA] text-[12px] md:text-[13px] lg:text-[14px] md:text-[15px] lg:text-[16px] mb-1.5">{cap.metrics.cached}</div>
                  <div className="text-[9px] md:text-[10px] md:text-[10.5px] lg:text-[11px] text-[#666] leading-snug pr-4">{cap.metrics.cacheHit} cache hit, last 24<br />hours</div>
                </div>
                <div className="font-medium text-[#C8C7BA] text-[12px] md:text-[13px] lg:text-[14px] md:text-[15px] lg:text-[16px]">{cap.metrics.output}</div>
                <div className="flex justify-end">
                  <span className="text-[#ccc] text-[10px] md:text-[11px] lg:text-[12px] md:text-[13px] lg:text-[14px] group-hover:text-[#C8C7BA] transition-colors flex items-center gap-1.5 font-medium">
                    View model <ArrowRight size={15} />
                  </span>
                </div>
              </a>
            ))}
          </div>

          <div className="mt-5 text-[12.5px] text-[#666] font-medium">
            Limits and modality-specific capabilities are listed on each model page.
          </div>
        </div>

        {/* Section 3: Compare plans */}
        <div className="mb-24">
          <div className="w-full border border-dashed border-[#333] flex flex-col">
            {/* Title Row */}
            <div className="grid grid-cols-[1.5fr_2fr_1.5fr] border-b border-dashed border-[#333]">
              <div className="p-6 lg:p-8 flex flex-col justify-start">
                <h2 className="text-[18px] md:text-[20px] lg:text-[22px] font-medium text-[#C8C7BA] mb-3">Compare Pay as you go and Enterprise</h2>
                <p className="text-[#888] text-[11px] md:text-[12px] lg:text-[13px] leading-relaxed pr-4">
                  Pay as you go is self-serve, funded by credit top-ups. Enterprise adds private infrastructure, reserved capacity, compliance, and custom terms.
                </p>
              </div>
              <div className="p-6 lg:p-8"></div>
              <div className="p-6 lg:p-8"></div>
            </div>

            {/* Header */}
            <div className="grid grid-cols-[1.5fr_2fr_1.5fr] divide-x divide-dashed divide-[#333] border-b border-dashed border-[#333]">
              <div className="p-6 lg:p-8 flex items-end">
                <div className="text-[#888] text-[12px] md:text-[13px] lg:text-[14px] font-medium">Feature</div>
              </div>
              <div className="p-6 lg:p-8 flex flex-col justify-end items-start">
                <div className="text-[#C8C7BA] text-[18px] md:text-[20px] lg:text-[22px] font-medium mb-1">Pay as you go</div>
                <div className="text-[#888] text-[12px] md:text-[13px] lg:text-[14px]">from a $5 top-up</div>
              </div>
              <div className="p-6 lg:p-8 flex flex-col justify-end items-start">
                <div className="text-[#C8C7BA] text-[18px] md:text-[20px] lg:text-[22px] font-medium mb-1">Enterprise</div>
                <div className="text-[#888] text-[12px] md:text-[13px] lg:text-[14px]">Custom</div>
              </div>
            </div>

            {/* Row 1 */}
            <div className="grid grid-cols-[1.5fr_2fr_1.5fr] divide-x divide-dashed divide-[#333] border-b border-dashed border-[#333] bg-[#1a1a1a]">
              <div className="px-6 py-6 lg:px-8 text-[#aaa] text-[12px] md:text-[13px] lg:text-[14px] flex items-center">Pricing model</div>
              <div className="px-6 py-6 lg:px-8 text-[#C8C7BA] text-[12px] md:text-[13px] lg:text-[14px] flex items-center justify-center text-center">Credit top-ups from $5, pay for what you run</div>
              <div className="px-6 py-6 lg:px-8 text-[#C8C7BA] text-[12px] md:text-[13px] lg:text-[14px] flex items-center justify-center text-center">Custom volume and terms</div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-[1.5fr_2fr_1.5fr] divide-x divide-dashed divide-[#333] border-b border-dashed border-[#333]">
              <div className="px-6 py-6 lg:px-8 text-[#aaa] text-[12px] md:text-[13px] lg:text-[14px] flex items-center">Balance</div>
              <div className="px-6 py-6 lg:px-8 text-[#C8C7BA] text-[12px] md:text-[13px] lg:text-[14px] flex items-center justify-center text-center">One balance for Model APIs</div>
              <div className="px-6 py-6 lg:px-8 text-[#C8C7BA] text-[12px] md:text-[13px] lg:text-[14px] flex items-center justify-center text-center">One shared balance with custom controls</div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-[1.5fr_2fr_1.5fr] divide-x divide-dashed divide-[#333] border-b border-dashed border-[#333] bg-[#1a1a1a]">
              <div className="px-6 py-6 lg:px-8 text-[#aaa] text-[12px] md:text-[13px] lg:text-[14px] flex items-center">Seats</div>
              <div className="px-6 py-6 lg:px-8 text-[#C8C7BA] text-[12px] md:text-[13px] lg:text-[14px] flex items-center justify-center text-center">No per-seat fees</div>
              <div className="px-6 py-6 lg:px-8 text-[#C8C7BA] text-[12px] md:text-[13px] lg:text-[14px] flex items-center justify-center text-center">No per-seat fees</div>
            </div>

            {/* Row 4 */}
            <div className="grid grid-cols-[1.5fr_2fr_1.5fr] divide-x divide-dashed divide-[#333] border-b border-dashed border-[#333]">
              <div className="px-6 py-6 lg:px-8 text-[#aaa] text-[12px] md:text-[13px] lg:text-[14px] flex items-center">OpenAI- and Anthropic-compatible APIs</div>
              <div className="px-6 py-6 lg:px-8 flex items-center justify-center"><Check size={18} className="text-[#76b900]" /></div>
              <div className="px-6 py-6 lg:px-8 flex items-center justify-center"><Check size={18} className="text-[#76b900]" /></div>
            </div>

            {/* Row 5 */}
            <div className="grid grid-cols-[1.5fr_2fr_1.5fr] divide-x divide-dashed divide-[#333] border-b border-dashed border-[#333] bg-[#1a1a1a]">
              <div className="px-6 py-6 lg:px-8 text-[#aaa] text-[12px] md:text-[13px] lg:text-[14px] flex items-center">Audit logs and RBAC</div>
              <div className="px-6 py-6 lg:px-8 text-[#C8C7BA] text-[12px] md:text-[13px] lg:text-[14px] flex items-center justify-center text-center">Free with a Business account (Settings)</div>
              <div className="px-6 py-6 lg:px-8 flex items-center justify-center"><Check size={18} className="text-[#76b900]" /></div>
            </div>

            {/* Row 6 */}
            <div className="grid grid-cols-[1.5fr_2fr_1.5fr] divide-x divide-dashed divide-[#333] border-b border-dashed border-[#333]">
              <div className="px-6 py-6 lg:px-8 text-[#aaa] text-[12px] md:text-[13px] lg:text-[14px] flex items-center">SOC 2 Type II</div>
              <div className="px-6 py-6 lg:px-8 flex items-center justify-center"><X size={18} className="text-[#888]" /></div>
              <div className="px-6 py-6 lg:px-8 flex items-center justify-center"><Check size={18} className="text-[#76b900]" /></div>
            </div>

            {/* Row 7 */}
            <div className="grid grid-cols-[1.5fr_2fr_1.5fr] divide-x divide-dashed divide-[#333] border-b border-dashed border-[#333] bg-[#1a1a1a]">
              <div className="px-6 py-6 lg:px-8 text-[#aaa] text-[12px] md:text-[13px] lg:text-[14px] flex items-center">SLA</div>
              <div className="px-6 py-6 lg:px-8 text-[#C8C7BA] text-[12px] md:text-[13px] lg:text-[14px] flex items-center justify-center text-center">No contractual SLA</div>
              <div className="px-6 py-6 lg:px-8 text-[#C8C7BA] text-[12px] md:text-[13px] lg:text-[14px] flex items-center justify-center text-center">Up to 99.99%</div>
            </div>

            {/* Row 8 */}
            <div className="grid grid-cols-[1.5fr_2fr_1.5fr] divide-x divide-dashed divide-[#333]">
              <div className="px-6 py-6 lg:px-8 text-[#aaa] text-[12px] md:text-[13px] lg:text-[14px] flex items-center">Support</div>
              <div className="px-6 py-6 lg:px-8 text-[#C8C7BA] text-[12px] md:text-[13px] lg:text-[14px] flex items-center justify-center text-center">Priority email</div>
              <div className="px-6 py-6 lg:px-8 text-[#C8C7BA] text-[12px] md:text-[13px] lg:text-[14px] flex items-center justify-center text-center">Dedicated CSM and private Slack</div>
            </div>
          </div>

          <div className="mt-8 text-[12px] md:text-[13px] lg:text-[14px] text-[#888]">
            Compare pay-as-you-go API costs with renting GPUs. <span className="font-medium text-[#C8C7BA] border-b-[1.5px] border-[#76b900] cursor-pointer pb-0.5">Compare GPU fit, rental costs, idle time and API costs</span> for your model and traffic.
          </div>
        </div>

        {/* Section 4: Common Questions */}
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          <h2 className="text-3xl font-medium text-[#C8C7BA] mb-2 flex items-center gap-2">
            Common <span className="bg-[#76b900] text-[#151515] px-2 py-0.5 rounded-none">questions</span>
          </h2>
          <p className="text-[#888] text-sm mb-8 text-center">
            Need something else? Contact us.
          </p>

          <div className="flex gap-2 mb-10 bg-[#111] p-1 rounded-none border border-[#333]">
            <button
              onClick={() => setFaqTab("payg")}
              className={`px-4 py-2 text-xs font-medium uppercase tracking-wider rounded-none transition-colors ${faqTab === "payg" ? "bg-[#76b900] text-[#151515]" : "text-[#888] hover:text-[#C8C7BA]"
                }`}>
              Pay as you go
            </button>
            <button
              onClick={() => setFaqTab("enterprise")}
              className={`px-4 py-2 text-xs font-medium uppercase tracking-wider rounded-none transition-colors ${faqTab === "enterprise" ? "bg-[#76b900] text-[#151515]" : "text-[#888] hover:text-[#C8C7BA]"
                }`}>
              Enterprise & Batch
            </button>
          </div>

          <div className="w-full border border-dashed border-[#333] bg-[#111] p-6 rounded-none">
            <h3 className="font-medium text-[#C8C7BA] mb-3 text-sm flex items-center gap-3">
              <div className="w-4 h-4 rounded-none border border-[#555] flex items-center justify-center shrink-0">
                <div className="w-2 h-2 rounded-none bg-[#555]" />
              </div>
              How do I get started?
            </h3>
            <p className="text-[#aaa] text-[11px] md:text-[12px] lg:text-[13px] pl-7 leading-relaxed">
              You can create a free account to test models with free credits. Once you're ready to scale, simply add your credit card to fund your prepaid balance. The $5 minimum top-up gives you access to our entire library of open models.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
